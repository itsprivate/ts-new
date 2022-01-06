require("dotenv").config();

const sync = require("./fix-translate-duduplicate-module.js");

async function main() {
  await sync();
}

main().catch((e) => {
  console.error("e", e);
});
