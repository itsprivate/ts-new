const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
const format = require("./format");
async function main() {
  const files = await getFiles(resolve(__dirname, "../data"));
  const jsonFiles = micromatch(files, "**/*.json");
  for (let i = 0; i < jsonFiles.length; i++) {
    const type = getType(jsonFiles[i]);
    const types = ["reddit", "hn", "tweet"];
    if (types.includes(type)) {
      const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
      const jsonContent = await readFile(jsonPath, "utf8");
      const json = JSON.parse(jsonContent);
      const newJson = format(type, json);
      console.log(`Write ${jsonFiles[i]}`);
      await fs.writeFile(jsonPath, JSON.stringify(newJson, null, 2));
    }
  }
}
exports.main = main;
function getType(path) {
  const pathArr = path.split("/");
  const folder = pathArr[1];
  if (folder === "db") {
    return "db";
  } else if (folder.endsWith("-issues")) {
    return "issue";
  } else if (folder.endsWith("-placeholder")) {
    return "placeholder";
  } else {
    const folderArr = folder.split("-");
    return folderArr[0];
  }
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
main().catch((e) => {
  console.error("e", e);
});
