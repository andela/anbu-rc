/* eslint-disable no-undef */
import { Template } from "meteor/templating";
import "./static-pages.html";
import { StaticPages } from "/lib/collections";
import { Reaction } from "/client/api";

Template.staticPages.onCreated(function () {
   // Subscribe to Pages publication
  this.subscribe("staticPages");
});

Template.staticPages.helpers({
  // Get base Url
  baseUrl() {
    return window.location.host;
  },
  // Get pages Created
  displayPages() {
    return StaticPages.find().fetch();
  }
});

Template.staticPages.events({
  "submit form": (event) => {
    event.preventDefault();
    const title = $("#static-page-title").val();
    const slug = $("#static-page-slug").val();
    const content = $("#static-page-content").val();
    const shopId = Reaction.shopId;
    const pageOwner = Meteor.user()._id;

    Meteor.call("insertPage", title, slug, content, shopId, pageOwner, error => {
      if (error) {
        console.log(error);
        Alerts.toast(error.reason, "error");
      } else {
        Alerts.toast("Created New Static Page", "success");
      }
    });
  },
  "click .delete-page"() {
    // Meteor.call("deletePage", this._id);
    Alerts.alert({
      title: "Delete this page?",
      showCancelButton: true,
      cancelButtonText: "No",
      confirmButtonText: "Yes"
    }, (confirmed) => {
      if (confirmed) {
        // const _id = $(event.currentTarget).parents("tr").attr("id");
        Meteor.call("deletePage", this._id);
      }
    });
  }
});
