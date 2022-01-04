const metascraper = require("metascraper")([require("metascraper-image")()]);
const got = require("got");

module.exports = async function getMetadata(targetUrl) {
  const { body: html, url } = await got(targetUrl, {
    timeout: 10000,
  });
  const metadata = await metascraper({ html, url });
  // check image is valid
  if (metadata.image) {
    try {
      await got(metadata.image, {
        timeout: 10000,
      });
      return metadata;
    } catch (error) {
      console.error("error", error);
      delete metadata.image;
      return metadata;
    }
  }

  return metadata;
};
