const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data"));
  const jsonFiles = micromatch(files, "**/*.json");
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    const jsonContent = await readFile(jsonPath, "utf8");
    let json = JSON.parse(jsonContent);
    // console.log("json", json);
    if (json && !json.localize) {
      const localize = [];
      if (json.i18nResource) {
        const i18nKeys = Object.keys(json.i18nResource);
        i18nKeys.forEach((i18nKey) => {
          localize.push({
            locale: i18nKey,
            ...json.i18nResource[i18nKey],
          });
        });
      }
      json.localize = localize;
      delete json.i18nResource;
      console.log("write", jsonPath);
      await writeFile(jsonPath, JSON.stringify(json, null, 2));
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
