import { Notifications } from "/lib/collections";

Meteor.publish("getNotification", (userId) => {
  check(userId, String);
  return Notifications.find({ userId });
});
