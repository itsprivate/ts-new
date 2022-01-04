const path = require("path");
const { resolve } = path;
const fsPure = require("fs");
const fs = fsPure.promises;
const { readFile, writeFile, readdir } = fs;
const main = async (file, key, value) => {
  const dbPath = resolve(__dirname, "../", file);
  const isTargetFileExist = fsPure.existsSync(dbPath);
  const nowISO = new Date().toISOString();
  if (!isTargetFileExist) {
    // create
    await fs
      .mkdir(path.dirname(dbPath), {
        recursive: true,
      })
      .then(() => {
        return fs
          .writeFile(
            dbPath,
            JSON.stringify(
              {
                created_at: nowISO,
                version: "v1",
                data: {},
              },
              null,
              2
            ),
            {
              flag: "wx",
            }
          )
          .catch((e) => {
            if (e.code === "EEXIST") {
              return Promise.resolve();
            } else {
              return Promise.reject(e);
            }
          });
      });
  }
  // if exist
  const targetFileContent = await readFile(dbPath);
  let dbObj = JSON.parse(targetFileContent);
  if (dbObj && dbObj.data) {
    dbObj.data[key] = value;
    // write json
    await writeJson(dbPath, dbObj);
  } else {
    throw new Error("Db format error");
  }
};
async function writeJson(filePath, obj) {
  console.log(`write ${filePath}`);
  await writeFile(filePath, JSON.stringify(obj, null, 2));
}
module.exports = main;
