const { translate } = require("./deepl");
const homepage = "https://www.deepl.com/translator";

let browser;

const getBrowser = async () => {
  if (browser) return browser;
  browser = await require("puppeteer").launch({
    devtools: process.env.NODE_ENV === "development" ? true : false,
    headless: process.env.NODE_ENV === "development" ? false : true,
    defaultViewport: null,
    args: ["--lang=zh-Hans,zh"],
  });
  browser.on("disconnected", () => (browser = null));
  return browser;
};

const getNewPage = async () => await (await getBrowser()).newPage();
module.exports = class DeeplClient {
  constructor() {
    this.page = null;
  }
  async TextTranslate(params) {
    if (!this.page) {
      this.page = await getNewPage();

      this.page.setUserAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
      );
      await this.page.setViewport({ width: 1370, height: 1200 });
      await this.page.goto(homepage);
      await this.page.waitForTimeout(1000);
    }
    const setence = params.SourceText;
    const source = params.Source;
    let target = params.Target === "zh" ? "zh-ZH" : params.Target;
    if (params.Target === "ja") {
      target = "ja-JA";
    }
    // console.log("setence", source, target, setence);
    return await translate(this.page, setence, source, target).then((data) => {
      console.log("result", data.target.translation);
      return {
        TargetText: data.target.translation,
      };
    });
  }
  async quit() {
    if (this.page) {
      this.page.close().catch(() => {});
      this.page = null;
    }
    if (browser) await browser.close();
  }
  provider() {
    return "deepl";
  }
};
