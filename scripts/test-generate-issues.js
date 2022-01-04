const main = require("./src/generate-issues");

main().catch((e) => {
  console.log("e", e);
});
