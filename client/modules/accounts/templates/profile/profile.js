import * as Collections from "/lib/collections";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

let allShops = [];
let addShop = false;

/**
 * onCreated: Account Profile View
 */
Template.accountProfile.onCreated(() => {
  const template = Template.instance();
  Meteor.call("shopNames/all", (err, result) => {
    return err ? err : (allShops = result.vendorShopNames);
  });
  template.userHasPassword = ReactiveVar(false);
  template.formMessages = new ReactiveVar({});
  Meteor.call("accounts/currentUserHasPassword", (error, result) => {
    template.userHasPassword.set(result);
  });
});

/**
 * Helpers: Account Profile View
 */
Template.accountProfile.helpers({
  messages: function () {
    return Template.instance().formMessages.get();
  },

  hasError(error) {
    // True here means the field is valid
    // We're checking if theres some other message to display
    if (error !== true && typeof error !== "undefined") {
      return "has-error has-feedback";
    }

    return false;
  },

  formErrors() {
    return Template.instance().formErrors.get();
  },

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
    return [];
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
  isVendor: function () {
    if (Meteor.user().profile.vendor[0]) {
      return true;
    }
    return false;
  },
  shopProfile: function () {
    if (Meteor.user().profile.vendor[1]) {
      return Meteor.user().profile.vendor[1];
    }
    return { shopName: "", shopPhone: "", shopAddress: ""};
  },
  shopFormHeader: function () {
    return Meteor.user().profile.vendor[0] ? "Update Vendor Info" : "Become A Seller";
  },
  shopFormButtonText: function () {
    return Meteor.user().profile.vendor[0] ? "Update Shop Info" : "Create Shop";
  },
  shopNameDisable: function () {
    if (Meteor.user().profile.vendor[0]) {
      return "disabled";
    }
    addShop = true;
    return "";
  }
});
// event to upgrade to seller account on profile
Template.accountProfile.events({
  "click .register-shop-button": function (event) {
    event.preventDefault();
    const templateInstance = Template.instance();
    const errors = {};
    templateInstance.formMessages.set({});
    const isVendorNow = Meteor.user().profile.vendor[0];
    const shopName = Template.instance().find(".shop-name").value;
    const shopPhone = Template.instance().find(".shop-phone").value;
    const shopAddress = Template.instance().find(".shop-address").value;
    const dbShopName = Meteor.user().profile.vendor[1] ? Meteor.user().profile.vendor[1].shopName : undefined;
    if (!/\w+/g.test(shopName) && shopName.length <= 20) {
      errors.shopName = { i18nKeyReason: "invalid shop name", reason: "invalid shop name"};
    } else if (allShops.includes(shopName) && addShop) {
      errors.shopName = {
        i18nKeyReason: "Hello! Shop name has already been taken.",
        reason: "Hello! Shop name has already been taken."
      };
    } else if (isVendorNow && (shopName !== (dbShopName || undefined))) {
      errors.shopName = {
        i18nKeyReason: "Cheating Huh! You shouldn't do this.",
        reason: "Cheating Huh! You shouldn't do this."
      };
    }
    if (!/\d+(-)?/g.test(shopPhone) && shopPhone.length <= 14) {
      errors.shopPhone = { i18nKeyReason: "invalid shop phone number", reason: "invalid shop phone number"};
    }

    if (!/\w+/g.test(shopAddress) && shopAddress.length <= 250) {
      errors.shopAddress = { i18nKeyReason: "invalid shop address", reason: "invalid shop address"};
    }
    if ($.isEmptyObject(errors) === false) {
      templateInstance.formMessages.set({
        errors: errors
      });
      // prevent signup
      return;
    }
    const vendorDetail = {shopName, shopPhone, shopAddress};
    if (shopName === dbShopName || dbShopName === undefined) {
      Meteor.users.update(Meteor.userId(), {$set: { profile: { vendor: [true, vendorDetail] } } });
      Meteor.call("accounts/addVendorPermissions", Meteor.userId(), (err, result) => {
        if (!err && !allShops.includes(shopName) && !Meteor.user().profile.vendor[0]) {
          Meteor.call("shopNames/update", shopName, (e, res) => {
            return e ? e : res;
          });
        }
        return err ? err : result;
      });
    } else { throw new TypeError({error}); }
  }
});
