require("dotenv").config();
const script = require("./generate-reddit-top-module");

script().catch((e) => {
  console.error("e", e);
});
