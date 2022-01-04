const micromatch = require("micromatch");
const { resolve, relative, basename } = require("path");
const { readdir } = require("fs").promises;
async function main() {
  const directories = [
    "data/reddit-top",
    "data/reddit-crypto",
    "data/reddit-stocks",
    "data/tweet-stocks",
    "data/youtube-top",
    "data/hn-top",
    "data/ph-top",
    "data/tweet-crypto",
  ];
  const now = Date.now();
  const fields = {
    reddit: {
      dateParser: (item) => {
        return new Date(item.created_utc * 1000);
      },
      paramsParser: (item) => {
        return {
          name: item.name,
        };
      },
    },
    youtube: {
      dateParser: (item) => {
        return new Date(item.isoDate);
      },
      paramsParser: (item) => {
        return {
          id: item.videoId,
        };
      },
    },
    hn: {
      dateParser: (item) => {
        return new Date(item.created_at);
      },
      paramsParser: (item) => {
        return {
          id: item.objectID,
        };
      },
    },
    ph: {
      dateParser: (item) => {
        return new Date(item.createdAt);
      },
      paramsParser: (item) => {
        return {
          id: item.id,
        };
      },
    },
    tweet: {
      dateParser: (item) => {
        return new Date(Date.parse(item.created_at));
      },
      paramsParser: (item) => {
        return {
          id: item.id_str,
        };
      },
    },
  };
  for (let p = 0; p < directories.length; p++) {
    const directory = directories[p];
    const type = basename(directory).split("-")[0];
    const files = await getFiles(resolve(__dirname, "../", directory));
    const jsonFiles = micromatch(files, "**/*.json");
    const dataMap = {};
    const result = {};
    for (let i = 0; i < jsonFiles.length; i++) {
      let json = require(resolve(__dirname, "../", jsonFiles[i]));
      let params = fields[type].paramsParser(json);
      const date = fields[type].dateParser(json);
      let day =
        date.getUTCFullYear() +
        "-" +
        (date.getUTCMonth() + 1) +
        "-" +
        date.getUTCDate();
      if (!dataMap[day]) {
        dataMap[day] = [];
      }
      dataMap[day].push({
        params: params,
      });
    }
    const dateKeys = Object.keys(dataMap);
    dateKeys.forEach((dateKey) => {
      const dateData = dataMap[dateKey];
      result[dateKey] = {
        count: dateData.length,
      };
    });
    console.log(directory, result);
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
