import { Themes } from "/lib/collections";

/**
 * Themes
 * @returns {Object} themes - themes cursor
 */

Meteor.publish("Themes", function () {
  return Themes.find({});
});
