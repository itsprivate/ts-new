const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { relative, resolve } = path;
const { readdir, readFile, writeFile } = fs;
const CWD = process.env.GITHUB_WORKSPACE;
console.log("CWD", CWD);

async function main({ dest = "./i18n/post-resource" } = {}) {
  const absoluteDest = resolve(CWD, dest);

  const dirents = await readdir(absoluteDest);
  console.log("\n");
  for (let a = 0; a < dirents.length; a++) {
    const locale = dirents[a];
    if (locale.startsWith(".")) {
      continue;
    }
    if (locale === "en") {
      continue;
    }
    console.log("locale", locale);
    const files = await getFiles(resolve(absoluteDest, locale), ".json");
    console.log(`There are ${files.length} files.`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // if (
      //   file !=
      //   "i18n/post-resource/zh-Hant/reddit_--_reddit-ask_--_the_new_excerpt_--_2021_--_07.json"
      // ) {
      //   continue;
      // }
      const filenameArr = file.split("_--_");
      if (filenameArr.length < 4) {
        throw new Error(`file name invalid: ${file}`);
      }
      const field = filenameArr[2];

      const jsonPath = resolve(CWD, file);
      const jsonContent = await readFile(jsonPath, "utf8");
      let jsonObj = JSON.parse(jsonContent);
      const keys = Object.keys(jsonObj);
      for (let j = 0; j < keys.length; j++) {
        const sourcePath = keys[j];
        const text = jsonObj[sourcePath];
        const sourceAbsolutePath = resolve(CWD, sourcePath);
        const isSourceExist = fsPure.existsSync(sourceAbsolutePath);
        if (isSourceExist) {
          // exist
          const sourceJson = await readFile(sourceAbsolutePath, "utf8");
          let sourceObj = {};
          try {
            sourceObj = JSON.parse(sourceJson);
          } catch (e) {
            console.error("parse json error:", e);
            console.log("sourceJson", sourceJson);
            throw e;
          }
          let isChanged = false;
          if (!sourceObj.localize) {
            sourceObj.localize = [];
            isChanged = true;
          }
          if (!isLocaleExist(sourceObj.localize, locale)) {
            sourceObj.localize.push({
              locale: locale,
            });
            isChanged = true;
          }
          if (
            isNeedChangeLocaleField(sourceObj.localize, locale, field, text)
          ) {
            sourceObj.localize = witeLocaleField(
              [...sourceObj.localize],
              locale,
              field,
              text
            );
            isChanged = true;
          }
          if (isChanged) {
            console.log(`Write ${sourceAbsolutePath}`);
            await writeFile(
              sourceAbsolutePath,
              JSON.stringify(sourceObj, null, 2)
            );
          }
        } else {
          console.error(`${sourceAbsolutePath} not exist`);
          delete jsonObj[sourcePath];
          console.log(`Write ${jsonPath}`);

          await writeFile(jsonPath, JSON.stringify(jsonObj, null, 2));
        }
      }
    }
  }

  return true;
}
function isLocaleExist(localize = [], locale) {
  if (!localize) {
    return false;
  }
  return localize.filter((item) => item.locale === locale).length > 0;
}
function isNeedChangeLocaleField(localize = [], locale, field, value) {
  if (!localize) {
    return true;
  }
  for (let i = 0; i < localize.length; i++) {
    const localeItem = localize[i];
    if (localeItem.locale === locale) {
      if (
        localeItem[field] === undefined ||
        localeItem[field] === null ||
        localeItem[field] === ""
      ) {
        return true;
      }
    }
  }
  return false;
}
function witeLocaleField(localize, locale, key, value) {
  let tempLocalize = localize ? localize : [];
  if (!isLocaleExist(tempLocalize, locale)) {
    tempLocalize.push({ locale: locale });
  }
  for (let i = 0; i < tempLocalize.length; i++) {
    const tempLocale = tempLocalize[i];
    if (tempLocale.locale === locale) {
      console.log("locale", locale);

      console.log("new", value);

      tempLocalize[i] = {
        ...localize[i],
      };
      tempLocalize[i][key] = value;
      console.log("old, ", localize[i][key]);
    }
  }
  return tempLocalize;
}
async function getFiles(dir, ext) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      const relativePath = relative(CWD, res);
      return dirent.isDirectory() ? getFiles(res) : relativePath;
    })
  );
  return Array.prototype.concat(...files).filter((item) => {
    // console.log("item", item);

    if (ext) {
      return path.extname(item) === ext;
    } else {
      return true;
    }
  });
}

module.exports = main;
