import { Reaction, i18next } from "/client/api";
import * as Collections from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

var shopNameInput = null;

/**
 * onCreated: Account Profile View
 */
Template.accountProfile.onCreated(() => {
  const template = Template.instance();

  template.userHasPassword = ReactiveVar(false);

  Meteor.call("accounts/currentUserHasPassword", (error, result) => {
    template.userHasPassword.set(result);
  });
});

/**
 * Helpers: Account Profile View
 */
Template.accountProfile.helpers({

  /**
   * User has password
   * @return {Boolean} return true if the current user has a password, false otherwise
   */
  userHasPassword() {
    return Template.instance().userHasPassword.get();
  },

  /**
   * User's order history
   * @return {Array|null} an array of available orders for the user
   */
  userOrders() {
    const orderSub = Meteor.subscribe("AccountOrders", Meteor.userId());
    if (orderSub.ready()) {
      return Collections.Orders.find({
        userId: Meteor.userId()
      }, {
        sort: {
          createdAt: -1
        },
        limit: 25
      });
    }
  },

  /**
   * User's account profile
   * @return {Object} account profile
   */
  account() {
    return Collections.Accounts.findOne();
  },

  /**
   * Returns the address book default view
   * @return {String} "addressBookGrid" || "addressBookAdd"
   */
  addressBookView: function () {
    const account = Collections.Accounts.findOne();
    if (account.profile) {
      return "addressBookGrid";
    }
    return "addressBookAdd";
  },
  // to check if user is a vendor
  isVendor: function() {
    if (Meteor.user().profile.vendor[0]) {
       return true;
    }
    return false;
  },
  shopProfile: function() {
    if (Meteor.user().profile.vendor[1]) {
      return Meteor.user().profile.vendor[1];
    }
    return { shopName: "", shopPhone: "", shopAddress: ""};
  },
  shopFormHeader: function() {
    return Meteor.user().profile.vendor[0] ? 'Update Vendor Info' : 'Become A Seller';
  },
  shopFormButtonText: function() {
    return Meteor.user().profile.vendor[0] ? 'Update Shop Info' : 'Create Shop';
  },
  shopNameDisable: function() {
    return Meteor.user().profile.vendor[0] ? 'disabled' : '';
  }
});
// event to upgrade to seller account on profile
Template.accountProfile.events({
  'click .register-shop-button': function(event) {
    const error = { message: 'add error strings'};
    const vendorRoles =
    ["dashboard", "createProduct", "orders", "dashboard/orders", "guest", "account/profile", "product", "tag", "index", "cart/checkout", "cart/completed"];
    console.log('Upgrade to a seller account');
    let vendorDetail = {};
    event.preventDefault();

    let shopName = Template.instance().find('.shop-name').value;
    let shopPhone = Template.instance().find('.shop-phone').value;
    let shopAddress = Template.instance().find('.shop-address').value;
    let dbShopName = Meteor.user().profile.vendor.shopName;
    vendorDetail = {shopName, shopPhone, shopAddress};
    console.log(vendorDetail);
    if (shopName === dbShopName || dbShopName === undefined) {
      Meteor.users.update(Meteor.userId(), {$set: { profile: { vendor: [true, vendorDetail] } } });
    }
    else {
      console.log(error);
    }
  }
});
