import { Vendors } from "/lib/collections";

/**
 * ShopNames
 * @returns {Object} shop names - shop names cursor
 */

Meteor.publish("Vendors", function () {
  return Vendors.findOne({});
});
