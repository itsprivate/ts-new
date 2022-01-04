const { resolve, basename, relative } = require("path");
const { readFile, writeFile, readdir } = require("fs").promises;
async function main() {
  const targetLocales = ["zh", "zh-Hant"];
  for (let i = 0; i < targetLocales.length; i++) {
    const targetLocale = targetLocales[i];
    const translationTitlePath = resolve(
      __dirname,
      "../i18n/i18next",
      targetLocale,
      "reddit-title-2020.json"
    );
    const translationTitleContent = await readFile(
      translationTitlePath,
      "utf8"
    );
    const translationTitleObj = JSON.parse(translationTitleContent);

    const translationExcerppPath = resolve(
      __dirname,
      "../i18n/i18next",
      targetLocale,
      "reddit-excerpt-2020.json"
    );
    const translationExcerptContent = await readFile(
      translationExcerppPath,
      "utf8"
    );
    const translationExcerptObj = JSON.parse(translationExcerptContent);
    const sourceFiles = await getFiles(
      resolve(__dirname, "../i18n/post-resource/en")
    );
    for (let j = 0; j < sourceFiles.length; j++) {
      const sourceFile = sourceFiles[j];
      const sourceFilename = basename(sourceFile, ".json");
      const filenameArr = sourceFilename.split("_--_");
      if (filenameArr.length < 5) {
        throw new Error(`file name invalid: ${sourceFile}`);
      }
      const field = filenameArr[2];
      // TODO
      const sourceFileContent = await readFile(
        resolve(__dirname, "../", sourceFile),
        "utf8"
      );
      const sourceObj = JSON.parse(sourceFileContent);
      const sourceKeys = Object.keys(sourceObj);
      const targetObj = {};
      for (let h = 0; h < sourceKeys.length; h++) {
        const sourceKey = sourceKeys[h];
        const sourceValue = sourceObj[sourceKey];
        if (field === "title") {
          targetObj[sourceKey] = translationTitleObj[sourceValue] || "";
        } else if (field === `the_new_excerpt`) {
          const pathArr = sourceKey.split("/");
          const id = pathArr[5];
          targetObj[sourceKey] = translationExcerptObj[id] || "";
        }
      }
      const targetFilePath = resolve(
        __dirname,
        "../",
        "i18n/post-resource",
        targetLocale,
        `${sourceFilename}.json`
      );
      console.log("Write target translation", targetFilePath);
      await writeFile(targetFilePath, JSON.stringify(targetObj, null, 2));
    }
  }
}

main().catch((e) => {
  console.error("e", e);
});

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
