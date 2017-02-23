/* eslint no-new: 0 */
/* eslint camelcase: 0 */
import {Transactions} from "/lib/collections";

new Meteor.Pagination(Transactions, {
  dynamic_filters: function () {
    return { userId: this.userId };
  }
});
