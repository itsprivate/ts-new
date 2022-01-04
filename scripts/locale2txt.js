const json = require("../i18n/i18next/zh/translation-tag.json");
const fs = require("fs");
const main = () => {
  let txts = [];
  Object.keys(json).forEach((key) => {
    txts.push(json[key]);
  });
  fs.writeFileSync("./temp-translate.txt", txts.join("\n"));
};

main();
