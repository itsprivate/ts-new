const format = require("../.github/actions/format/src/format/reddit");
const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data/reddit-top"));
  const jsonFiles = micromatch(files, "**/*.json");
  const excerptFor2020 = {};
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    const jsonContent = await readFile(jsonPath, "utf8");
    let json = JSON.parse(jsonContent);
    let excerpt = json.the_new_excerpt;

    if (json.the_new_excerpt === undefined) {
      const newJson = format([json]);
      excerpt = newJson.the_new_excerpt;
      console.log("write", jsonPath);
      await writeFile(jsonPath, JSON.stringify(newJson[0], null, 2));
    }
    if (excerpt) {
      const createdAt = new Date(json.created_utc * 1000);
      const utcYear = createdAt.getUTCFullYear();
      if (utcYear === 2020) {
        excerptFor2020[json.id] = excerpt;
      }
    }
  }

  // add excerpt translate

  const excerptFilePath = `./i18n/i18next/en/reddit-excerpt-2020.json`;
  const isExcerptExist = fsPure.existsSync(excerptFilePath);
  if (!isExcerptExist) {
    await fs.writeFile(excerptFilePath, "{}");
  }
  // write excerpt
  await fs.writeFile(excerptFilePath, JSON.stringify(excerptFor2020, null, 2));
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
