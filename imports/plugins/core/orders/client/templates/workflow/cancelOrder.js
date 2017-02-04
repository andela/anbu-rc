import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

const validateComment = (comment) => {
  check(comment, Match.OptionalOrNull(String));

  // Valid
  if (comment.length >= 10) {
    return true;
  }

  // Invalid
  return {
    error: "INVALID_COMMENT",
    reason: "The reason must be at least 10 characters long."
  };
};

Template.coreOrderCancelOrder.onCreated(function () {
  const template = Template.instance();

  template.showCancelOrderForm = ReactiveVar(true);
  this.state = new ReactiveDict();
  template.formMessages = new ReactiveVar({});

  this.autorun(() => {
    const currentData = Template.currentData();
    const order = currentData.order;

    if (order.workflow.status === "canceled") {
      template.showCancelOrderForm = ReactiveVar(false);
    }

    this.state.set("order", order);
  });
});

Template.coreOrderCancelOrder.events({
  "submit form[name=cancelOrderForm]"(event, template) {
    event.preventDefault();

    const commentInput = template.$(".input-comment");

    const comment = commentInput.val().trim();
    const validatedComment = validateComment(comment);

    const templateInstance = Template.instance();
    const errors = {};

    templateInstance.formMessages.set({});

    if (validatedComment !== true) {
      errors.comment = validatedComment;
    }

    if ($.isEmptyObject(errors) === false) {
      templateInstance.formMessages.set({
        errors: errors
      });
      // prevent order cancel
      return;
    }

    const newComment = {
      body: comment,
      userId: Meteor.userId(),
      updatedAt: new Date
    };

    const state = template.state;
    const order = state.get("order");

    Alerts.alert({
      title: "Are you sure you want to cancel this order.",
      showCancelButton: true,
      confirmButtonText: "Cancel Order"
    }, (isConfirm) => {
      if (isConfirm) {
        Meteor.call("orders/vendorCancelOrder", order, newComment, (error) => {
          if (!error) {
            template.showCancelOrderForm.set(false);
          }
        });
      }
    });
  }
});

Template.coreOrderCancelOrder.helpers({
  showCancelOrderForm() {
    const template = Template.instance();
    return template.showCancelOrderForm.get();
  },

  messages() {
    return Template.instance().formMessages.get();
  },

  hasError(error) {
    // True here means the field is valid
    // We're checking if theres some other message to display
    if (error !== true && typeof error !== "undefined") {
      return "has-error has-feedback";
    }

    return false;
  }
});
