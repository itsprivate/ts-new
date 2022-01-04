const update = require("./src/update-resource");

update().catch((e) => {
  console.log("e", e);
});
