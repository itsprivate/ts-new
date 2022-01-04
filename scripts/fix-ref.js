const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const _ = require("lodash");
const { readdir, readFile, writeFile } = fs;
const filelink = require("filelink");

async function main() {
  const files = await getFiles(resolve(__dirname, "../data"));
  const jsonFiles = micromatch(files, "**/*.json");
  // jsonFiles.length = 200; // todo
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    const relativePath = relative(resolve(__dirname, "../"), jsonPath);
    const fileType = getFileTypeName(relativePath);

    if (fileType) {
      // console.log("fileType", fileType);

      const jsonContent = await readFile(jsonPath, "utf8");
      let json = JSON.parse(jsonContent);
      // console.log("json", json);
      if (json) {
        // create ln -s
        let slug = json.id;
        if (fileType == "hn") {
          slug = `/${json.objectID}/`;
        } else if (fileType == "reddit") {
          slug = json.permalink;
        } else if (fileType == "youtube") {
          slug = `/${json.videoId}/`;
        } else if (fileType == "ph") {
          slug = `/${json.slug}/`;
        } else if (fileType == "tweet") {
          slug = `/${json.id_str}/`;
        }
        const targetPath = resolve(
          __dirname,
          "../",
          `ref/${fileType}${slug}data.json`
        );
        // console.log("targetPath", targetPath);

        // await fs.symlink(jsonPath, targetPath);
        await filelink(jsonPath, targetPath, {
          force: true,
          mkdirp: true,
        });
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
const validTypes = ["hn", "reddit", "ph", "tweet"];
function getFileTypeName(relativePath) {
  const rootDirectoryName = relativePath.split(`/`)[1];
  const rootArr = rootDirectoryName.split("-");
  const rootPrefix = rootArr[0];
  let isOtherType = false;
  if (rootArr.length > 1) {
    isOtherType = rootArr[rootArr.length - 1] === "issues";
  }
  const thetype = `${isOtherType ? null : rootPrefix}`;
  if (validTypes.includes(thetype)) {
    return thetype;
  } else {
    return null;
  }
}
