const micromatch = require("micromatch");
const { resolve, relative } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { readdir, readFile, writeFile } = fs;
async function main() {
  const files = await getFiles(resolve(__dirname, "../data/tweet-stocks"));
  const jsonFiles = micromatch(files, "**/*.json");
  for (let i = 0; i < jsonFiles.length; i++) {
    const jsonPath = resolve(__dirname, "../", jsonFiles[i]);
    const jsonContent = await readFile(jsonPath, "utf8");
    let json = JSON.parse(jsonContent);

    if (json && typeof json.created_at === "number") {
      json.created_at = toTwitterDate(new Date(json.created_at * 1000));
      console.log(`write ${jsonPath}`);
      await writeFile(jsonPath, JSON.stringify(json, null, 2));
    }
  }
}
function toTwitterDate(date) {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const addZero = (num) => {
    if (num < 10) {
      return `0${num}`;
    } else {
      return `${num}`;
    }
  };

  const twitterDate = `${daysOfWeek[date.getUTCDay()]} ${
    monthShort[date.getUTCMonth()]
  } ${addZero(
    date.getUTCDate()
  )} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()} +0000 ${date.getUTCFullYear()}`;
  return twitterDate;
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
