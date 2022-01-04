const zhJson = require("../locales/zh.json");
const replaceAll = require("string.prototype.replaceall");

const locales = {
  zh: zhJson,
};
module.exports = ({ text, lang = "zh" }) => {
  if (lang && locales[lang]) {
    const locale = locales[lang];
    const keys = Object.keys(locale);
    keys.forEach((key) => {
      const value = locale[key];

      text = replaceAll(text, key, value);
    });
    // tag space encode
    if (text) {
      text = replaceAll(text, /\B(#\w\w+\b)/g, "$1%%");
    }
  }

  // if include $XXX
  const matchedResult = text.match(/(\$[A-Z]+[0-9]*)\s/);
  let untranslatedText;
  if (matchedResult) {
    untranslatedText = matchedResult[1];
  }
  return {
    text,
    untranslatedText,
  };
};
