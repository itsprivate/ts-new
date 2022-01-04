require("dotenv").config();
const script = require("./generate-reddit-top-weekly-module");

script().catch((e) => {
  console.error("e", e);
});
