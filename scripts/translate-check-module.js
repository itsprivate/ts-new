// check files validate
const { resolve, relative, basename } = require("path");
const fsPure = require("fs");
const https = require("https");
const fs = fsPure.promises;
const { readdir, readFile } = fs;
const githubWorkspace =
  process.env.GITHUB_WORKSPACE || resolve(__dirname, "../");
const main = async () => {
  const files = await getFiles("./i18n");
  let untranslatedCount = 0;
  for (let i = 0; i < files.length; i++) {
    if (files[i].endsWith(".json")) {
      const jsonPath = resolve(__dirname, "../", files[i]);
      const jsonContent = await readFile(jsonPath, "utf8");
      try {
        JSON.parse(jsonContent);
      } catch (e) {
        console.error("error path: ", jsonPath);

        const message = `翻译源文件出错,错误文件:${jsonPath} , 错误内容: ${e.message}`;
        // report
        https.get(
          `https://webhook.actionsflow.workers.dev/theowenyoung/actionsflow-workflow/notice/webhook?__token=${
            process.env.PERSONAL_TOKEN
          }&message=${encodeURIComponent(message)}`,
          () => {}
        );
        await sleep(5000);
        throw e;
      }
    }
  }

  // check untranslated count
  const locales = ["zh", "ja"];
  const allFiles = await getFiles("./i18n/post-resource/en");
  // console.log("allFiles", allFiles);

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];

    const enSourceObj = require(`${githubWorkspace}/${file}`);

    const filename = basename(file, ".json");
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

      const targetAbsoluteFilePath = resolve(githubWorkspace, targetFilePath);
      // console.log("targetAbsoluteFilePath", targetAbsoluteFilePath);

      const ifLocaleFileExist = fsPure.existsSync(targetAbsoluteFilePath);

      const targetJSON = ifLocaleFileExist
        ? await fs.readFile(targetAbsoluteFilePath, "utf8")
        : "{}";
      const targetObj = JSON.parse(targetJSON);
      // check
      const enKeys = Object.keys(enSourceObj);
      let isChanged = false;

      for (let k = 0; k < enKeys.length; k++) {
        const key = enKeys[k];
        const value = enSourceObj[key];
        if (value && targetObj[key] === undefined) {
          isChanged = true;
          untranslatedCount++;
        }
      }
    }
  }
  console.log("untranslatedCount: ", untranslatedCount);
};
module.exports = main;
function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}
async function getFiles(dir) {
  const cwd = process.cwd();
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : relative(cwd, res);
    })
  );
  return Array.prototype.concat(...files);
}
