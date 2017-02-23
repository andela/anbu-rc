import { Template } from "meteor/templating";
import { NumericInput } from "/imports/plugins/core/ui/client/components";

Template.ordersListSummary.onCreated(function () {
  this.state = new ReactiveDict();
  this.formMessages = new ReactiveVar({});
  this.autorun(() => {
    const currentData = Template.currentData();
    const order = currentData.order;
    this.state.set("order", order);
  });
});

/**
 * ordersListSummary helpers
 *
 * @returns paymentInvoice
 */
Template.ordersListSummary.helpers({
  invoice() {
    return this.invoice;
  },

  numericInputProps(value) {
    const { currencyFormat } = Template.instance().data;

    return {
      component: NumericInput,
      value,
      format: currencyFormat,
      isEditing: false
    };
  },

  showCancelOrderForm() {
    return !(this.order.workflow.status === "canceled"
    || this.order.workflow.status === "coreOrderWorkflow/completed");
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

/**
 * ordersListSummary events
 */
Template.ordersListSummary.events({
  /**
   * Submit form
   * @param  {Event} event - Event object
   * @param  {Template} template - Blaze Template
   * @return {void}
   */
  "submit form[name=cancelOrderForm]"(event, template) {
    event.preventDefault();
    const validateComment = (comment) => {
      check(comment, Match.OptionalOrNull(String));
      const reasons = [
        "Late Delivery",
        "Customer Changed Mind"
      ];
      // Valid
      if (reasons.includes(comment)) {
        return true;
      }

      // Invalid
      return {
        error: "INVALID_COMMENT",
        reason: "Please select a reason for cancellation."
      };
    };

    const commentInput = template.$(".select-comment");

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
    order.comments = newComment;

    Alerts.alert({
      title: "Are you sure you want to cancel this order.",
      showCancelButton: true,
      confirmButtonText: "Cancel Order"
    }, (isConfirm) => {
      if (isConfirm) {
        Meteor.call("orders/cancelOrder", order, newComment);
      }
    });
  }
});
