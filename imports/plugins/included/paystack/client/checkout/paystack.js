/* eslint camelcase: 0 */
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Reaction } from "/client/api";
import { Cart, Shops, Accounts, Packages } from "/lib/collections";

import "./paystack.html";

const getExchangeRate = () => {
  const shop = Shops.find(Reaction.getShopId()).fetch();
  return shop[0].currencies.NGN.rate;
};

const generateTransactionID = () => {
  return Random.id(16);
};

const getOrderPrice = () => {
  const cart = Cart.findOne();
  const exchangeRate =  getExchangeRate();
  return parseInt(cart.cartTotal() * exchangeRate, 10);
};

const getPaystackSettings = () => {
  const settings = Packages.findOne({
    name: "paystack-paymentmethod",
    shopId: Reaction.getShopId()
  });
  return settings;
};

const finalizePayment = (paystackMethod) => {
  Meteor.call("cart/submitPayment", paystackMethod);
};

handlePayment = (transactionId, type) => {
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
      const exchangeRate = getExchangeRate();
      const paystackResponse = response.data.data;
      const paystackMethod = {
        processor: "Paystack",
        storedCard: paystackResponse.authorization.last4,
        method: "Paystack",
        transactionId: paystackResponse.reference,
        currency: paystackResponse.currency,
        amount: paystackResponse.amount * exchangeRate,
        status: paystackResponse.status,
        mode: "authorize",
        createdAt: new Date()
      };
      if (type === "payment") {
        paystackMethod.transactions = [];
        paystackMethod.transactions.push({
          amount: (paystackResponse.amount / 100),
          transactionId: paystackResponse.reference,
          currency: paystackResponse.currency
        });
        finalizePayment(paystackMethod);
      }
    }
  });
};

// Paystack payment
const payWithPaystack = (email, amount, transactionId) => {
  const paystackDetails = getPaystackSettings();
  const handler = PaystackPop.setup({
    key: paystackDetails.settings.publicKey,
    email: email,
    amount: amount * 100,
    ref: transactionId,
    callback: function (response) {
      handlePayment(response.reference, "payment");
    }
  });
  handler.openIframe();
};

Template.paystackPaymentForm.events({
  "click #paywithpaystack": (event) => {
    event.preventDefault();
    const accountDetails = Accounts.find(Meteor.userId()).fetch();
    const userMail = accountDetails[0].emails[0].address;
    const amount = getOrderPrice();
    const transactionId = generateTransactionID();
    const mailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$/i;
    if (!mailRegex.test(userMail)) {
      Alerts.toast("Invalid email address", "error");
      return false;
    }
    payWithPaystack(userMail, amount, transactionId);
  }
});

Template.paystackPaymentForm.helpers({
  PaystackSchema() {
    return PaystackSchema;
  }
});
