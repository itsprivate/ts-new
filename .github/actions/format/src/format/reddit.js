const { htmlToText } = require(`html-to-text`);
const ellipsize = require("ellipsize");

module.exports = function (outputs) {
  outputs = outputs.map((item) => {
    let excerpt = "";
    if (item.selftext_html) {
      const finalHtml = decodeEntities(item.selftext_html);

      excerpt = htmlToText(finalHtml, {
        tags: {
          a: {
            options: {
              hideLinkHrefIfSameAsText: true,
            },
          },
        },
      });
    }
    item.the_new_excerpt = ellipsize(excerpt, 300);
    return item;
  });

  return outputs;
};
function decodeEntities(encodedString) {
  var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  var translate = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    lt: "<",
    gt: ">",
  };
  return encodedString
    .replace(translate_re, function (match, entity) {
      return translate[entity];
    })
    .replace(/&#(\d+);/gi, function (match, numStr) {
      var num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    });
}
