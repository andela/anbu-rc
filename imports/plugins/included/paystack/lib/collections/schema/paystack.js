import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { PackageConfig } from "/lib/collections/schemas/registry";

export const PaystackPackageConfig = new SimpleSchema([
  PackageConfig, {
    "settings.secretKey": {
      type: String,
      label: "Secret Key",
      defaultValue: ""
    },
    "settings.publicKey": {
      type: String,
      label: "Public Key",
      defaultValue: ""
    }
  }
]);
