import { Accounts, Cart, Orders, Products, Shops } from "/lib/collections";

export default () => {

  // Global API configuration
  const Api = new Restivus({
    useDefaultAuth: true,
    prettyjson: true
  });

  // To prevent using the DELETE http method on the API
  const options = (collection) => {
    return {
      excludedEndpoints: ["delete"],
      routeOptions: {
        authRequired: true
      },
      endpoints: {
        put: {
          action() {
            const isUpdated = collection.update(this.urlParams.id, {
              $set: this.bodyParams
            });
            if (isUpdated) {
              const record = collection.findOne(this.urlParams.id);
              return {
                status: "success",
                data: record
              }
            }
            return {
              statusCode: 404, 
              message: "Item not found",
              body: this.bodyParams
            }
          }
        }
      }
    };
  };

  Api.addCollection(Accounts, options(Accounts));
  Api.addCollection(Cart, options(Cart));
  Api.addCollection(Orders, options(Orders));
  Api.addCollection(Products, options(Products));
  Api.addCollection(Shops, options(Shops));
};
