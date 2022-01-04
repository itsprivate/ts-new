require("dotenv").config();

const sync = require("./sync-i18n-resource-module");

async function main() {
  await sync();
}

main().catch((e) => {
  console.error("e", e);
});
