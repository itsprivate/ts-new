require("dotenv").config();
const tencentcloud = require("tencentcloud-sdk-nodejs");
const DeeplClient = require("../.github/actions/translate/src/deepl-client");
const translate = require("../.github/actions/translate/src/translate");
const TmtClient = tencentcloud.tmt.v20180321.Client;

const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_TRANSLATION_SECRET_ID,
    secretKey: process.env.TENCENT_TRANSLATION_SECRET_KEY,
  },
  region: "na-siliconvalley",
  profile: {
    httpProfile: {
      endpoint: "tmt.tencentcloudapi.com",
    },
  },
};
const client = new TmtClient(clientConfig);
const deelyClient = new DeeplClient();
async function main() {
  const value = `This is so sweet 😍`;
  const data = await translate({
    client: deelyClient,
    sourceText: value,
    source: "en",
    target: "zh",
  });
  await deelyClient.quit();
  console.log("data", data);
}

main().catch((e) => {
  console.log("e", e);
});
