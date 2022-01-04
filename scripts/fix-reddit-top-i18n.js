const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data/reddit-top"));
  const jsonFiles = micromatch(files, "**/*.json");
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    const jsonContent = await readFile(jsonPath, "utf8");
    let json = JSON.parse(jsonContent);
    console.log("json", json);

    if (
      json &&
      json.i18nResource &&
      json.i18nResource.zh &&
      json.i18nResource.zh["reddit-top"]
    ) {
      delete json.i18nResource.zh["reddit-top"];
    }
    if (
      json &&
      json.i18nResource &&
      json.i18nResource["zh-Hant"] &&
      json.i18nResource["zh-Hant"]["reddit-top"]
    ) {
      delete json.i18nResource["zh-Hant"]["reddit-top"];
    }
    console.log("write", jsonPath);
    await writeFile(jsonPath, JSON.stringify(json, null, 2));
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
