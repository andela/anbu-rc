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
  "click .register-shop-button": function(event) {
    event.preventDefault();
    Meteor.call("shopNames", (err, result) => {
      console.log(err, result);
      return err ? err : result;
    });

    Meteor.call("shopNames/update", 'anbu-squad', (err, result) => {
      console.log(err, result);
      return err ? err : result;
    });

    const error = { message: "add error strings"};
    const shopName = Template.instance().find(".shop-name").value;
    const shopPhone = Template.instance().find(".shop-phone").value;
    const shopAddress = Template.instance().find(".shop-address").value;
    const dbShopName = Meteor.user().profile.vendor.shopName;
    const vendorDetail = {shopName, shopPhone, shopAddress};
    if (shopName === dbShopName || dbShopName === undefined) {
      Meteor.users.update(Meteor.userId(), {$set: { profile: { vendor: [true, vendorDetail] } } });
      Meteor.call("accounts/addVendorPermissions", Meteor.userId(), (err, result) => {
        return err ? err : result;
      });
    } else { throw new TypeError({error}); }
  }
});
