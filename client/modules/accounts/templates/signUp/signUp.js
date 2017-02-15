import { LoginFormSharedHelpers } from "/client/modules/accounts/helpers";
import { Template } from "meteor/templating";
import { Meteor } from "meteor/meteor";

let allShops = [];
/**
 * onCreated: Login form sign up view
 */
Template.loginFormSignUpView.onCreated(() => {
  const template = Template.instance();
  Meteor.call("shopNames/all", (err, result) => {
    return err ? err : (allShops = result.vendorShopNames);
  });
  template.uniqueId = Random.id();
  template.formMessages = new ReactiveVar({});
  template.type = "signUp";
  Session.set("vendorForm", false);
});

/**
 * Helpers: Login form sign up view
 */
Template.loginFormSignUpView.helpers(LoginFormSharedHelpers);

/**
 * Events: Login form sign up view
 */
Template.loginFormSignUpView.events({
  /**
   * Submit sign up form
   * @param  {Event} event - jQuery Event
   * @param  {Template} template - Blaze Template
   * @return {void}
   */
  "submit form": function (event, template) {
    event.preventDefault();
    const usernameInput = template.$(".login-input--username");
    const emailInput = template.$(".login-input-email");
    const passwordInput = template.$(".login-input-password");

    const username = usernameInput.val().trim();
    const email = emailInput.val().trim();
    const password = passwordInput.val().trim();

    const validatedUsername = LoginFormValidation.username(username);
    const validatedEmail = LoginFormValidation.email(email);
    const validatedPassword = LoginFormValidation.password(password);

    const templateInstance = Template.instance();
    const errors = {};
    let shopName;
    let shopPhone;
    let shopAddress;
    let shopProfile = null;

    templateInstance.formMessages.set({});

    if (validatedUsername !== true) {
      errors.username = validatedUsername;
    }

    if (validatedEmail !== true) {
      errors.email = validatedEmail;
    }

    if (validatedPassword !== true) {
      errors.password = validatedPassword;
    }

    if (LoginFormSharedHelpers.showVendorForm()) {
      shopName = template.$(".shop-name").val().trim();
      shopPhone = template.$(".shop-phone").val().trim();
      shopAddress = template.$(".shop-address").val().trim();

      if (!/\w+/g.test(shopName) && shopName.length <= 20) {
        errors.shopName = { i18nKeyReason: "invalid shop name", reason: "invalid shop name"};
      }

      if (allShops.includes(shopName)) {
        errors.shopName = {
          i18nKeyReason: "shop name already exists. please choose another.",
          reason: "shop name already exists. please choose another."
        };
      }

      if (!/\d+(-)?/g.test(shopPhone) && shopPhone.length <= 14) {
        errors.shopPhone = { i18nKeyReason: "invalid shop phone number", reason: "invalid shop phone number"};
      }

      if (!/\w+/g.test(shopAddress) && shopAddress.length <= 250) {
        errors.shopAddress = { i18nKeyReason: "invalid shop address", reason: "invalid shop address"};
      }
      shopProfile = {
        shopName: shopName,
        shopPhone: shopPhone,
        shopAddress: shopAddress
      };
    }

    if ($.isEmptyObject(errors) === false) {
      templateInstance.formMessages.set({
        errors: errors
      });
      // prevent signup
      return;
    }

    const newUserData = {
      username,
      email,
      password,
      profile: shopProfile
    };

    Accounts.createUser(newUserData, function (error) {
      if (error) {
        // Show some error message
        templateInstance.formMessages.set({
          alerts: [error]
        });
      } else {
        // Close dropdown or navigate to page
      }
    });
  },
  "change :radio": function (event, template) {
    const element = template.find("input:radio[name=role]:checked");
    const value = $(element).val();
    value === "isVendor" ? Session.set("vendorForm", true) : Session.set("vendorForm", false);
  }
});
