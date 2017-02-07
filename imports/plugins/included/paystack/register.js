/* eslint camelcase: 0 */
import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "Paystack",
  name: "paystack-paymentmethod",
  icon: "fa fa-credit-card-alt",
  autoEnable: true,
  settings: {
    secretKey: "",
    publicKey: ""
  },
  registry: [
    // Dashboard card
    {
      provides: "dashboard",
      label: "Paystack Payment Provider",
      description: "Paystack payment provider",
      icon: "fa fa-credit-card-alt",
      priority: 6,
      container: "paymentMethod"
    },

    // Settings panel
    {
      label: "Paystack Payment Settings", // this key (minus spaces) is used for translations
      route: "/dashboard/paystack",
      provides: "settings",
      container: "dashboard",
      template: "paystackSettings"
    },

    // Payment form for checkout
    {
      template: "paystackPaymentForm",
      provides: "paymentMethod"
    }
  ]
});
