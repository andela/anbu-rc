import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { FlatButton } from "/imports/plugins/core/ui/client/components";
import { Reaction, Router } from "/client/api";
import { Tags, Accounts, Notifications } from "/lib/collections";
import { playTour } from "/imports/plugins/included/tour/client/tour.js";

Template.CoreNavigationBar.onCreated(function () {
  this.state = new ReactiveDict();
  this.notifications = ReactiveVar();
  this.autorun(() => {
    const sub = this.subscribe("getNotification", Meteor.userId());
    if (sub.ready()) {
      let getNot = Notifications.find({ userId: Meteor.userId() }).fetch();
      Session.set("itemList", getNot);
      Session.set("itemLength", getNot.length);
    }
  });
});

Template.CoreNavigationBar.onRendered(function () {
  currentRoute = Router.getRouteName();
  this.autorun(() => {
    if (Accounts.findOne(Meteor.userId())) {
      if (!Accounts.findOne(Meteor.userId()).takenTour && Accounts.findOne(Meteor.userId()).emails[0]) {
        playTour();
      }
    }
  });
});

/**
 * layoutHeader events
 */
Template.CoreNavigationBar.events({
  "click .navbar-accounts .dropdown-toggle": function () {
    return setTimeout(function () {
      return $("#login-email").focus();
    }, 100);
  },
  "click .header-tag, click .navbar-brand": function () {
    return $(".dashboard-navbar-packages ul li").removeClass("active");
  },
  "click .search": function () {
    Blaze.renderWithData(Template.searchModal, {
    }, $("body").get(0));
    $("body").css("overflow", "hidden");
    $("#search-input").focus();
  }
});

Template.CoreNavigationBar.helpers({
  IconButtonComponent() {
    return {
      component: FlatButton,
      icon: "fa fa-search",
      kind: "flat"
    };
  },
  TourButtonComponent() {
    return {
      component: FlatButton,
      icon: "fa fa-taxi",
      kind: "flat",
      onClick() {
        playTour();
      }
    };
  },
  onMenuButtonClick() {
    const instance = Template.instance();
    return () => {
      if (instance.toggleMenuCallback) {
        instance.toggleMenuCallback();
      }
    };
  },

  tagNavProps() {
    const instance = Template.instance();
    let tags = [];

    tags = Tags.find({
      isTopLevel: true
    }, {
      sort: {
        position: 1
      }
    }).fetch();

    return {
      name: "coreHeaderNavigation",
      editable: Reaction.hasAdminAccess(),
      isEditing: true,
      tags: tags,
      onToggleMenu(callback) {
        // Register the callback
        instance.toggleMenuCallback = callback;
      }
    };
  },
  currentUser() {
    return Reaction.hasPermission("admin") ||
    (!Reaction.hasPermission("anonymous")) ? true : false;
  }
});

Template.dropDownNotifications.events({
    /**
   * Clear Notifications
   * @param  {Event} event - jQuery Event
   * @return {void}
   */
  "click #clearNotifications": (event) => {
    event.preventDefault();
    Meteor.call("notifications/clearNotifications", Meteor.userId(), () => {
      Session.set("itemList", []);
      Session.set("itemLength", 0);
    });
  }
});

Template.notificationDropdown.helpers({
  NotificationIcon() {
  // Check if the user has pending notifications
  // and set the appropriate Icon
    return (Session.get("itemLength") > 0)
    ? "fa fa-bell"
    : "fa fa-bell-o";
  },
  NotificationCount() {
    return Session.get("itemLength");
  },
  checkNotification() {
    return (Session.get("itemLength") > 0);
  }
});
Template.notificationItem.helpers({
  showNotification() {
    // Change the display state of the notification to show the latest notification when clicked
    return Session.get("itemList");
  }
});
