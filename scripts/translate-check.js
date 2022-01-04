const main = require("./translate-check-module.js");
main()
  .catch((e) => {
    throw e;
  })
  .then(() => {
    console.log("success");
  });
