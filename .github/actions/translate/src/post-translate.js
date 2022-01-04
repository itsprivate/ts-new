const zhJson = require("../decode/zh.json");
const replaceAll = require("string.prototype.replaceall");

const locales = {
  zh: zhJson,
};
module.exports = (data) => {
  if (data.Source === "en" && data.Target === "zh" && data.TargetText) {
    data.TargetText = replaceAll(data.TargetText, /%%/g, " ");

    if (locales[data.Target]) {
      const locale = locales[data.Target];
      const keys = Object.keys(locale);
      keys.forEach((key) => {
        const value = locale[key];
        data.TargetText = replaceAll(data.TargetText, key, value);
      });
    }
  }
  return data;
};
