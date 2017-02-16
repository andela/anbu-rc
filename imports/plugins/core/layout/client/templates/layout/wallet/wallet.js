/* eslint no-undef: 0 */
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Reaction } from "/client/api";
import { Accounts, Packages, Wallets, Shops, Transactions } from "/lib/collections";

Template.wallet.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  this.state.setDefault({
    details: { balance: 0 }
  });
  this.autorun(() => {
    this.subscribe("transactionDetails", Meteor.userId());
    const transactionInfo = Wallets.find().fetch();
    this.state.set("details", transactionInfo[0]);
  });
});

Template.transactionDetails.onCreated(function () {
  this.pagination = new Meteor.Pagination(Transactions, {
    sort: {
      date: -1
    },
    perPage: 10
  });
});

const getPaystackSettings = () => {
  const settings = Packages.findOne({
    name: "paystack-paymentmethod",
    shopId: Reaction.getShopId()
  });
  return settings;
};

const finalizeDeposit = (paystackMethod) => {
  Meteor.call("wallet/transaction", Meteor.userId(), paystackMethod.transactions, (err, res) => {
    if (res) {
      document.getElementById("depositAmount").value = "";
      Alerts.toast("Your deposit was successful", "success");
    } else {
      Alerts.toast("An error occured, please try again", "error");
    }
  });
};

const getExchangeRate = () => {
  const shop = Shops.find(Reaction.getShopId()).fetch();
  return shop[0].currencies.NGN.rate;
};

function handlePayment(result) {
  const type = "deposit";
  const transactionId = result.reference;
  const paystackConfig = getPaystackSettings();
  HTTP.call("GET", `https://api.paystack.co/transaction/verify/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${paystackConfig.settings.secretKey}`
    }
  }, function (error, response) {
    if (error) {
      Alerts.toast("Unable to verify payment", "error");
    } else if (response.data.data.status !== "success") {
      Alerts.toast("Payment was unsuccessful", "error");
    } else {
      const exchangeRate = +getExchangeRate();
      const paystackResponse = response.data.data;
      paystackMethod = {
        processor: "Paystack",
        storedCard: paystackResponse.authorization.last4,
        method: "Paystack",
        transactionId: paystackResponse.reference,
        currency: paystackResponse.currency,
        amount: paystackResponse.amount,
        status: paystackResponse.status,
        mode: "authorize",
        createdAt: new Date()
      };
      if (type === "deposit") {
        paystackMethod.transactions = {
          amount: paystackResponse.amount / (100 * exchangeRate),
          referenceId: paystackResponse.reference,
          date: new Date(),
          transactionType: "Credit",
          from: "self",
          to: "self",
          userId: Meteor.userId()
        };
        finalizeDeposit(paystackMethod);
      }
    }
  });
}

function getOwnerDetails() {
  const ownerDetails = Accounts.find(Meteor.userId()).fetch();
  const ownersEmail = ownerDetails[0].emails[0].address;
  return ownersEmail;
}

// Paystack payment
const payWithPaystack = (email, amount) => {
  const paystackConfig = getPaystackSettings();
  const handler = PaystackPop.setup({
    key: paystackConfig.settings.publicKey,
    email: email,
    ref: Random.id(16),
    amount: amount * 100,
    callback: handlePayment
  });
  handler.openIframe();
};

Template.wallet.events({
  "submit #deposit": (event) => {
    event.preventDefault();
    const userMail = getOwnerDetails();
    const amount = Number(document.getElementById("depositAmount").value);
    const mailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$/i;
    if (!mailRegex.test(userMail)) {
      Alerts.toast("Invalid email address", "error");
      return false;
    } else if (isNaN(amount) || amount < 1) {
      Alerts.toast("Invalid amount entered", "error");
      return false;
    }
    payWithPaystack(userMail, amount);
  },

  "submit #transfer": (event) => {
    event.preventDefault();
    const amount = Number(document.getElementById("transferAmount").value);
    const recipient = document.getElementById("recipient").value;
    const mailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$/i;
    const senderEmail = getOwnerDetails();
    if (isNaN(amount) || amount < 1) {
      Alerts.toast("You entered an invalid amount", "error");
      return false;
    } else if (amount > Template.instance().state.get("details").balance) {
      Alerts.toast("Insufficient Balance", "error");
      return false;
    } else if (!mailRegex.test(recipient)) {
      Alerts.toast("Invalid email address", "error");
      return false;
    } else if (senderEmail === recipient) {
      Alerts.toast("You can not transfer from your wallet to the same wallet", "error");
      return false;
    }
    const transaction = { amount,
      to: recipient,
      date: new Date(),
      transactionType: "Debit",
      from: senderEmail,
      userId: Meteor.userId()
    };
    Meteor.call("wallet/recipientDetails", recipient, (err, res) => {
      if (res) {
        let message;
        if (res.profile.addressBook === undefined) {
          message = `Email: ${res.emails[0].address}
            User has not updated their account with name and phone numbers`;
        } else {
          message = `Name: ${res.profile.addressBook[0].fullName}
            Email: ${res.emails[0].address}
            Phone: ${res.profile.addressBook[0].phone}`;
        }
        Alerts.alert({
          title: "Recipient's Information",
          text: message,
          type: "info",
          showCancelButton: true,
          confirmButtonText: "Transfer"
        }, () => {
          Meteor.call("wallet/transaction", Meteor.userId(), transaction, (error, response) => {
            if (response === 2) {
              Alerts.toast(`No user with email ${recipient}`, "error");
              return false;
            } else if (response === 1) {
              document.getElementById("recipient").value = "";
              document.getElementById("transferAmount").value = "";
              Alerts.toast("The transfer was successful", "success");
              return true;
            }
            Alerts.toast("An error occured, please try again", "error");
            return false;
          });
        });
      } else {
        Alerts.toast("No user found with such email", "error");
        return false;
      }
    });
  }
});

Template.wallet.helpers({
  balance() {
    return Template.instance().state.get("details");
  }
});

Template.transactionDetails.helpers({
  isReady: function () {
    return Template.instance().pagination.ready();
  },
  templatePagination: function () {
    return Template.instance().pagination;
  },
  transactions: function () {
    return Template.instance().pagination.getPage();
  },
  // optional helper used to return a callback that should be executed before changing the page
  clickEvent: function () {
    return function (e) {
      e.preventDefault();
    };
  }
});
