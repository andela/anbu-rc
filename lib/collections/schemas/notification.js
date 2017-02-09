import { SimpleSchema } from "meteor/aldeed:simple-schema";

/**
 * Notification schema for inserting Notifications into the db
 * for the current user.
 */

export const Notifications = new SimpleSchema({
  userId: {
    type: String
  },
  name: {
    type: String
  },
  type: {
    type: String,
    optional: true
  },
  message: {
    type: String
  },
  orderId: {
    type: String
  }
});
