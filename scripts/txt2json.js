const json = require("../i18n/i18next/zh/translation-tag.json");
const fs = require("fs");
const main = () => {
  const txt = fs.readFileSync("./temp-translated.txt", "utf-8");
  const txts = txt.split("\n");
  const newJson = {};
  Object.keys(json).forEach((key, index) => {
    newJson[key] = txts[index];
  });
  fs.writeFileSync("./temp-json.json", JSON.stringify(newJson, null, 2));
};

main();
