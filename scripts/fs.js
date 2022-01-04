const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;

exports.getJson = async (path) => {
  const jsonContent = await readFile(path, "utf8");
  const json = JSON.parse(jsonContent);
  return json;
};
exports.getMockJson = async (path) => {
  const jsonPath = resolve(__dirname, "../__mocks__", path);
  return exports.getJson(jsonPath);
};
