import { Meteor } from "meteor/meteor";
import { Wallets, Accounts, Notifications } from "/lib/collections";
import * as Schemas from "/lib/collections/schemas";
import { check } from "meteor/check";

Meteor.methods({

  /**
  * wallet/deposit method to deposit money into user's account
  * @param {string} userId the id of the user
  * @param {object} transactions details of the transaction
  * @return {boolean} true or false if the db operation was successful
  */
  "wallet/transaction": (userId, transactions) => {
    transactions.amount = transactions.amount;
    let notification = {};
    let smsContent = {};
    let alertPhone;
    check(userId, String);
    check(transactions, Schemas.Transaction);
    let balanceOptions;
    const {amount, transactionType} = transactions;
    if (transactionType === "Credit") {
      const { from, date } = transactions;
      balanceOptions = {balance: amount};
      notification = {
        userId: userId,
        name: "Credit Transaction",
        type: transactionType,
        message: `Credit Alert! ${amount} has been credited into your account by ${from} on ${date}, Balance: ${balanceOptions.balance}`,
        orderId: transactions.referenceId || "00000"
      };
    }
    if (transactionType === "Debit") {
      if (transactions.to) {
        const recipient = Accounts.findOne({"emails.0.address": transactions.to});
        const sender = Accounts.findOne(userId);
        if (!recipient) {
          return 2;
        }
        notification = {
          userId: userId,
          name: "Debit Transaction",
          type: transactionType,
          message: `Debit Alert! ${amount} has been transfer from your account to ${recipient._id}`,
          orderId: transactions.referenceId || "00000"
        };
        // deposit for the recipient
        Meteor.call("wallet/transaction", recipient._id, {
          amount,
          from: sender.emails[0].address,
          date: new Date(),
          transactionType: "Credit"
        });
      } else {
        notification = {
          userId: userId,
          name: "Debit Transaction",
          type: transactionType,
          message: `Debit Alert! ${amount} was deducted from your account for the payment of the order you made;\
          \n Order Id: ${transactions.orderId} \n Date: ${transactions.date}`,
          orderId: transactions.orderId || "00000"
        };
        alertPhone = Accounts.findOne(userId).profile.addressBook[0].phone;
        smsContent = {
          to: alertPhone,
          message:
          `Debit Alert! {amount} was deducted from your account for the payment of the order you made;\
           Order Id: ${transactions.orderId} \n Date: ${transactions.date}`
        };
      }
      balanceOptions = {balance: -amount};
    }

    try {
      check(notification, Schemas.Notifications);
      Notifications.insert(notification);
      Meteor.call("send/sms/alert", smsContent);
      Wallets.update({userId}, {$push: {transactions: transactions}, $inc: balanceOptions}, {upsert: true});
      return 1;
    } catch (error) {
      return 0;
    }
  },

  /**
  * wallet/refund method to return fund when an order is canceled
  * @param {string} orderInfo the id of the logged in user
  * @param {string} userId the order reference id
  * @param {int} amount the amount to refund
  * @return {boolean} true if the refund was successful
  */
  "wallet/refund": (orderInfo) => {
    check(orderInfo, Object);
    let amount = orderInfo.billing[0].invoice.total;
    if (orderInfo.workflow.status === "coreOrderWorkflow/completed") {
      amount -= orderInfo.billing[0].invoice.shipping;
    }
    const orderId = orderInfo._id;
    userId = orderInfo.userId;
    const transaction = {amount, orderId, transactionType: "Refund", date: orderInfo.updatedAt};
    const notification = {
      userId: userId,
      name: "Money Refund",
      type: "Refund",
      message: `Refund! {amount} has be refunded into your account based on canceled order ${orderId}`,
      orderId: orderId || "0000"
    };
    try {
      check(notification, Schemas.Notifications);
      Notifications.insert(notification);
      Meteor.call("send/sms/alert", smsContent);
      Wallets.update({userId}, {$push: {transactions: transaction}, $inc: {balance: amount}}, {upsert: true});
      return true;
    } catch (error) {
      return false;
    }
  }
});
