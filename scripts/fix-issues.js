const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const { clear } = require("console");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data"));
  const jsonFiles = micromatch(files, "data/*-issues/**/*.json");
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    const thedirname = jsonFiles[i].split("/")[1];
    // console.log("jsonPath", jsonPath);
    const jsonString = await readFile(jsonPath, "utf8");
    let jsonContent = JSON.parse(jsonString);

    if (jsonContent.id) {
      // console.log("Empty file found");
      // console.log(jsonPath);
      let isChanged = true;
      jsonContent.id = thedirname + "-" + jsonContent.id;
      if (isChanged) {
        console.log("write", jsonPath, jsonContent.id);

        await writeFile(jsonPath, JSON.stringify(jsonContent, null, 2));
      }
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
