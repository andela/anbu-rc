import { StaticPages } from "/lib/collections";
Meteor.publish("staticPages", function() {
  if (this.userId === null) {
    return this.ready();
  }
  return StaticPages.find({
    pageOwner: this.userId
  });
});
