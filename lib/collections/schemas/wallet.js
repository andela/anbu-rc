import { SimpleSchema } from "meteor/aldeed:simple-schema";

export const Wallet = new SimpleSchema({
  userId: {
    type: String,
    label: "User"
  },
  balance: {
    type: Number,
    decimal: true,
    defaultValue: 0.00,
    optional: true
  }
});
