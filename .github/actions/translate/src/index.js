const core = require("@actions/core");
const tencentcloud = require("tencentcloud-sdk-nodejs");
const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const translate = require("./translate");
const DeeplClient = require("./deepl-client");
const { readdir } = fs;
const { resolve, relative } = path;
const githubWorkspace =
  process.env.GITHUB_WORKSPACE || path.resolve(__dirname, "../../../../");
async function main() {
  let startTime = Date.now();
  let totalTimeout = parseInt(core.getInput("timeout"));
  if (isNaN(totalTimeout)) {
    totalTimeout = 1 * 60 * 60 * 1000;
  }
  const TmtClient = tencentcloud.tmt.v20180321.Client;
  const provider = core.getInput("provider") || "tencent";
  const clientConfig = {
    credential: {
      secretId: core.getInput("secret_id"),
      secretKey: core.getInput("secret_key"),
    },
    region: "na-siliconvalley",
    profile: {
      httpProfile: {
        endpoint: "tmt.tencentcloudapi.com",
      },
    },
  };

  const locales = ["zh", "ja"];
  const allFiles = await getFiles("./i18n/post-resource/en");
  // console.log("allFiles", allFiles);

  for (let i = 0; i < allFiles.length; i++) {
    const nowTime = Date.now();
    if (totalTimeout > 0 && nowTime - startTime > totalTimeout * 60 * 1000) {
      break;
    }

    const file = allFiles[i];
    const enSourceObj = require(`${githubWorkspace}/${file}`);

    const filename = path.basename(file, ".json");
    let zhSourceObj = {};
    for (let j = 0; j < locales.length; j++) {
      const locale = locales[j];

      // skip for ja-JA before 202104
      const filenameArr = filename.split("_--_");
      if (filenameArr.length < 4) {
        throw new Error(`file name invalid: ${filename}`);
      }
      // console.log("filenameArr", filenameArr);

      const yearField = filenameArr[3];
      const monthField = filenameArr[4];
      const year = Number(yearField);
      const month = Number(monthField);

      if (locale === "ja" && (year < 2021 || (year === 2021 && month < 4))) {
        continue;
      }
      const targetFilePath = `i18n/post-resource/${locale}/${filename}.json`;

      const targetAbsoluteFilePath = path.resolve(
        githubWorkspace,
        targetFilePath
      );
      console.log("targetAbsoluteFilePath", targetAbsoluteFilePath);

      const ifLocaleFileExist = fsPure.existsSync(targetAbsoluteFilePath);
      if (!ifLocaleFileExist) {
        await fs.writeFile(targetAbsoluteFilePath, "{}");
      }
      const targetJSON = await fs.readFile(targetAbsoluteFilePath, "utf8");
      const targetObj = JSON.parse(targetJSON);
      // check
      const enKeys = Object.keys(enSourceObj);
      let isChanged = false;

      const tempZhHantTarget = `i18n/post-resource/zh-Hant/${filename}.json`;
      const tempZhHantTargetAbsolutePath = path.resolve(
        githubWorkspace,
        tempZhHantTarget
      );
      const tempIfLocaleFileExist = fsPure.existsSync(
        tempZhHantTargetAbsolutePath
      );
      if (!tempIfLocaleFileExist) {
        await fs.writeFile(tempZhHantTargetAbsolutePath, "{}");
      }
      const tempZhHantTargetJSON = await fs.readFile(
        tempZhHantTargetAbsolutePath,
        "utf8"
      );
      const tempZhHantObj = JSON.parse(tempZhHantTargetJSON);
      let isZhHantChanged = false;
      const client = new TmtClient(clientConfig);
      const deeplClient = new DeeplClient();
      const clientMap = {
        tencent: client,
        deepl: deeplClient,
      };
      for (let k = 0; k < enKeys.length; k++) {
        const nowTranslateTime = Date.now();
        const diffTranslateTime = nowTranslateTime - startTime;
        const shouldTranslateStop =
          diffTranslateTime > totalTimeout * 60 * 1000;

        if (totalTimeout > 0 && shouldTranslateStop) {
          break;
        }
        const key = enKeys[k];
        const value = enSourceObj[key];
        if (value && targetObj[key] === undefined) {
          isChanged = true;
          try {
            const data = await translate({
              provider: provider,
              client: clientMap[provider],
              sourceText: value,
              source: "en",
              target: locale,
            });
            // request
            targetObj[key] = data.TargetText;
            if (locale === "zh") {
              // translate zh-Hant

              const tempZhHantData = await translate({
                provider,
                client: null,
                sourceText: targetObj[key],
                source: "zh",
                target: "zh-Hant",
              });
              isZhHantChanged = true;
              tempZhHantObj[key] = tempZhHantData.TargetText;
            }
          } catch (error) {
            console.error("translate error,", error);
            if (provider === "deepl") {
              await deeplClient.quit();
            }
            // throw error;
            break;
          }
        }
      }
      zhSourceObj = targetObj;

      // if changed
      if (isChanged) {
        if (provider === "deepl") {
          await deeplClient.quit();
        }
        // write
        console.log(`Write ${targetAbsoluteFilePath}`);
        await fs.writeFile(
          targetAbsoluteFilePath,
          JSON.stringify(targetObj, null, 2)
        );
      }
      if (isZhHantChanged) {
        // write
        console.log(`Write ${tempZhHantTargetAbsolutePath}`);
        await fs.writeFile(
          tempZhHantTargetAbsolutePath,
          JSON.stringify(tempZhHantObj, null, 2)
        );
      }
    }

    // translate zh to zh-Hant

    const zhHantTarget = `i18n/post-resource/zh-Hant/${filename}.json`;
    const zhHantTargetAbsolutePath = path.resolve(
      githubWorkspace,
      zhHantTarget
    );
    const ifLocaleFileExist = fsPure.existsSync(zhHantTargetAbsolutePath);
    if (!ifLocaleFileExist) {
      await fs.writeFile(zhHantTargetAbsolutePath, "{}");
    }
    const zhHantTargetJSON = await fs.readFile(
      zhHantTargetAbsolutePath,
      "utf8"
    );
    const zhHantObj = JSON.parse(zhHantTargetJSON);
    // check
    const i18nKeys = Object.keys(zhSourceObj);
    let isChanged = false;
    for (let k = 0; k < i18nKeys.length; k++) {
      const key = i18nKeys[k];
      const value = zhSourceObj[key];
      if (value && zhHantObj[key] === undefined) {
        isChanged = true;
        try {
          const data = await translate({
            provider,
            client: null,
            sourceText: value,
            source: "zh",
            target: "zh-Hant",
          });
          // request
          zhHantObj[key] = data.TargetText;
        } catch (error) {
          console.error("translate error", error);
        }
      }
    }
    // if changed
    if (isChanged) {
      // write
      console.log(`Write ${zhHantTargetAbsolutePath}`);
      await fs.writeFile(
        zhHantTargetAbsolutePath,
        JSON.stringify(zhHantObj, null, 2)
      );
    }
  }

  // translate tag and translations

  const redditZhTagFilePath = `i18n/i18next/zh/translation-tag.json`;
  const zhTagTitle = require(`${githubWorkspace}/${redditZhTagFilePath}`);

  const redditZhCommonFilePath = `i18n/i18next/zh/translation.json`;
  const zhCommon = require(`${githubWorkspace}/${redditZhCommonFilePath}`);

  const zhTodoTranslatedFiles = [
    {
      sourceObj: zhTagTitle,
      ns: `translation-tag`,
    },
    {
      sourceObj: zhCommon,
      ns: `translation`,
    },
  ];
  const targetLocale = "zh-Hant";
  for (let h = 0; h < zhTodoTranslatedFiles.length; h++) {
    const todoTranslatedFile = zhTodoTranslatedFiles[h];
    const redditLocaleTitleFilePath = `i18n/i18next/${targetLocale}/${todoTranslatedFile.ns}.json`;
    const finalFile = `${githubWorkspace}/${redditLocaleTitleFilePath}`;
    const ifLocaleFileExist = fsPure.existsSync(finalFile);
    if (!ifLocaleFileExist) {
      await fs.writeFile(finalFile, "{}");
    }
    const localeTitleJSON = await fs.readFile(finalFile, "utf8");
    const localeTitle = JSON.parse(localeTitleJSON);
    // check
    const enKeys = Object.keys(todoTranslatedFile.sourceObj);
    let isChanged = false;
    for (let k = 0; k < enKeys.length; k++) {
      const key = enKeys[k];
      const value = todoTranslatedFile.sourceObj[key];
      if (value) {
        isChanged = true;
        const data = await translate({
          client: null,
          provider,
          sourceText: value,
          source: "zh",
          target: targetLocale,
        });
        // request
        localeTitle[key] = data.TargetText;
      }
    }
    // if changed
    if (isChanged) {
      // write
      console.log(`Write ${finalFile}`);

      await fs.writeFile(finalFile, JSON.stringify(localeTitle, null, 2));
    }
  }
}
async function getFiles(dir) {
  const cwd = githubWorkspace;
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : relative(cwd, res);
    })
  );
  return Array.prototype.concat(...files);
}
main()
  .catch((e) => {
    core.setFailed(e);
  })
  .then(() => {
    core.setOutput("success", true);
  });
