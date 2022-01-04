const format = require("../.github/actions/format/src/format/reddit");
const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data"));
  const jsonFiles = micromatch(files, "data/reddit*/**/*.json");
  // jsonFiles.length = 10;
  let count = 0;
  for (let i = 0; i < jsonFiles.length; i++) {
    const rootDirectoryName = jsonFiles[i].split(`/`)[1];
    if (!rootDirectoryName.includes("issues")) {
      const jsonPath = resolve(__dirname, "..", jsonFiles[i]);
      // console.log("jsonPath", jsonPath);

      const jsonContent = await readFile(jsonPath, "utf8");
      let json = JSON.parse(jsonContent);
      // let excerpt = json.the_new_excerpt;

      if (json.the_new_excerpt.includes("<!-- SC_OFF -->")) {
        count++;
        const newJson = format([json]);
        // excerpt = newJson.the_new_excerpt;
        // console.log("write", jsonPath);
        await writeFile(jsonPath, JSON.stringify(newJson[0], null, 2));
      }
    }
  }
  console.log("count", count);

  // add excerpt translate
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
