/* eslint-disable no-undef */
import { Template } from "meteor/templating";
import "./static-pages.html";
import { Reaction } from "/client/api";

Template.staticPages.helpers({
  baseUrl() {
    return window.location.host;
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
    console.log(`${title}: ${slug}: ${content}: ${shopId}: ${pageOwner}`);
  }
});
