require("dotenv").config();
const DeeplClient = require("./deepl-client");

const translate = require("./translate");
const preTranslate = require("./pre-translate");
process.env.NODE_ENV = "development";
async function translateTest() {
  const deeplClient = new DeeplClient();

  await translate({
    client: deeplClient,
    sourceText: "Hello World.",
    provider: "deepl",
    source: "en",
    target: "ja-JA",
  })
    .catch((e) => {
      console.error("e", e);
      // deeplClient.quit();
    })
    .then((data) => {
      console.log("data", data);
      // deeplClient.quit();
    });
  await translate({
    client: deeplClient,
    sourceText:
      "TIL that In 2018, A hacker broke into people’s routers (100,000 of them) and patched their vulnerabilities up so that they couldn’t be abused by other hackers.",
    provider: "deepl",
    source: "en",
    target: "ja-JA",
  })
    .catch((e) => {
      console.error("e", e);
      // deeplClient.quit();
    })
    .then((data) => {
      console.log("data", data);
      // deeplClient.quit();
    });
}

function translateTr() {
  translate({
    secretId: process.env.TENCENT_TRANSLATION_SECRET_ID,
    secretKey: process.env.TENCENT_TRANSLATION_SECRET_KEY,
    source: "zh",
    target: "zh-Hant",
    sourceText:
      "叶片在接近100%的湿度下旋转会产生低压气囊--字面意思是让它下雨。",
  })
    .catch((e) => {
      console.error("e", e);
    })
    .then((data) => {
      console.log("data", data);
    });
}

function preTranslateTest() {
  const text = preTranslate({
    text: "$TAN [OP] TIL Hello $BA world TIL",
  });
  console.log("text", text);
}
// preTranslateTest();
// translateTr();
translateTest();
