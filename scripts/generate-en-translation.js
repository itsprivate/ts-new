const format = require("../.github/actions/format/src/format/reddit");
const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
async function main() {
  const folder = "reddit-top";
  const files = await getFiles(resolve(__dirname, `../data/${folder}`));
  const jsonFiles = micromatch(files, "**/*.json");
  const allLocaleFiles = {};
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    const jsonContent = await readFile(jsonPath, "utf8");
    let json = JSON.parse(jsonContent);
    const createdAt = new Date(json.created_utc * 1000);
    const utcYear = createdAt.getUTCFullYear();
    const utcMonth = createdAt.getUTCMonth() + 1;
    const addZeroUtcMonth = utcMonth < 10 ? `0${utcMonth}` : `${utcMonth}`;
    const titleLocaleFileName = `reddit_--_${folder}_--_title_--_${utcYear}_--_${addZeroUtcMonth}.json`;
    const excerptLocaleFileName = `reddit_--_${folder}_--_the_new_excerpt_--_${utcYear}_--_${addZeroUtcMonth}.json`;
    if (!allLocaleFiles[titleLocaleFileName]) {
      allLocaleFiles[titleLocaleFileName] = {};
    }
    if (json.title) {
      allLocaleFiles[titleLocaleFileName][jsonFiles[i]] = json.title;
    }
    if (!allLocaleFiles[excerptLocaleFileName]) {
      allLocaleFiles[excerptLocaleFileName] = {};
    }
    if (json.the_new_excerpt) {
      allLocaleFiles[excerptLocaleFileName][jsonFiles[i]] =
        json.the_new_excerpt;
    }
  }

  const keys = Object.keys(allLocaleFiles);
  for (let i = 0; i < keys.length; i++) {
    const filePath = keys[i];
    const fileValue = allLocaleFiles[filePath];
    const finalPath = resolve(__dirname, "../i18n/post-resource/en", filePath);
    console.log("finalPath", finalPath);
    // is exists

    // write file
    await fs.writeFile(finalPath, JSON.stringify(fileValue, null, 2));
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
