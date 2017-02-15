import { SimpleSchema } from "meteor/aldeed:simple-schema";

export const Transaction = new SimpleSchema({
  amount: {
    type: Number,
    decimal: true,
    label: "Amount"
  },
  userId: {
    type: String
  },
  transactionType: {
    type: String
  },
  referenceId: {
    type: String,
    optional: true
  },
  from: {
    type: String,
    optional: true
  },
  to: {
    type: String,
    optional: true
  },
  orderId: {
    type: String,
    optional: true
  },
  date: {
    type: Date,
    optional: true
  }
});
