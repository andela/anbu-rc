import { Accounts } from "/lib/collections/";

export default function () {
  Slingshot.fileRestrictions("uploadToAmazonS3", {
    allowedFileTypes: [
      "image/png",
      "image/jpeg",
      "image/gif",
      "audio/mpeg",
      "audio/wma",
      "video/mp4",
      "video/mpeg4",
      "application/pdf",
      "application/msword"
    ],
    maxSize: 20 * 1024 * 1024
  });

  Slingshot.createDirective("uploadToAmazonS3", Slingshot.S3Storage, {
    bucket: "anbu-rc2",
    acl: "public-read",
    authorize: function () {
      if (Roles.userIsInRole(this.userId, ["owner", "admin"], Roles.GLOBAL_GROUP)) {
        return true;
      }
      return false;
    },
    key: function (file) {
      const users = Accounts.findOne(this.userId);
      const results = users.emails[0].address + "/" + file.name;
      return results;
    }
  });
}
