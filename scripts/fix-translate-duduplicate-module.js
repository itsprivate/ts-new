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
    let localeMap = {};

    const files = await getFiles(resolve(absoluteDest, locale), ".json");
    console.log(`There are ${files.length} files.`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const jsonPath = resolve(CWD, file);
      const jsonContent = await readFile(jsonPath, "utf8");
      let jsonObj = JSON.parse(jsonContent);
      const keys = Object.keys(jsonObj);
      let isChanged = false;
      for (let j = 0; j < keys.length; j++) {
        let key = keys[j];
        if (!localeMap[key]) {
          localeMap[key] = true;
        } else {
          // delete
          console.log(locale, " key: ", key, "duduplicated");

          delete jsonObj[key];
          isChanged = true;
        }
      }
      if (isChanged) {
        console.log(`Write ${jsonPath}`);

        await writeFile(jsonPath, JSON.stringify(jsonObj, null, 2), "utf8");
      }
    }
  }
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
    if (ext) {
      return path.extname(item) === ext;
    } else {
      return true;
    }
  });
}

module.exports = main;
