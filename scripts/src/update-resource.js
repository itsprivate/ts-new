require("dotenv").config();

const micromatch = require("micromatch");
const { resolve, relative, basename } = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { getList } = require("./get-list");

const { readdir, readFile, writeFile } = fs;
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

  const queuesPerGroup = 50;
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
  let queues = [];
  const period = getLastUpdatedPeriod();
  for (let o = 0; o < directories.length; o++) {
    const directory = directories[o];
    const type = basename(directory).split("-")[0];
    const folder = resolve(__dirname, `../../`, directory);
    const files = await getFiles(folder);
    const jsonFiles = micromatch(files, "**/*.json");
    let queueIndex = 0;
    console.log("type", type);

    if (
      type === "youtube" ||
      type === "reddit" ||
      type === "hn" ||
      type === "ph" ||
      type === "tweet"
    ) {
      for (let i = 0; i < jsonFiles.length; i++) {
        const jsonPath = resolve(__dirname, "../../", jsonFiles[i]);
        const jsonContent = await readFile(jsonPath, "utf8");
        let item = JSON.parse(jsonContent);

        let source_updated_at = item.source_updated_at;
        if (
          source_updated_at &&
          now - source_updated_at < 24 * 60 * 60 * 1000
        ) {
          // should not update
          console.log(`${jsonFiles[i]} updated lately, do not need update`);
        } else {
          // get created_at
          const dateParser =
            fields[type] && fields[type].dateParser
              ? fields[type].dateParser
              : (item) => new Date(item.created_at);
          const createdAt = dateParser(item);

          if (createdAt < period.end && createdAt >= period.start) {
            queueIndex++;
            // if (queueIndex > 10) {
            //   break;
            // }
            // check created at is belong the issue
            const paramsParser =
              fields[type] && fields[type].paramsParser
                ? fields[type].paramsParser
                : (item) => ({ id: item.id });
            const params = paramsParser(item);

            queues.push({
              type,
              path: jsonPath,
              params: params,
              originalItem: item,
            });
          }
        }
      }
    }
  }

  const groups = [];
  const typeQueues = {};
  queues.forEach((queue) => {
    if (!typeQueues[queue.type]) {
      typeQueues[queue.type] = [];
    }
    typeQueues[queue.type].push(queue);
  });
  const typeKeys = Object.keys(typeQueues);

  typeKeys.forEach((typeKey) => {
    const currentTypeQueues = typeQueues[typeKey];
    const pages = Math.ceil(currentTypeQueues.length / queuesPerGroup);

    for (let k = 0; k < pages; k++) {
      const page = k;
      const group = {
        type: typeKey,
        items: [],
      };
      group.items = currentTypeQueues.slice(
        page * queuesPerGroup,
        page * queuesPerGroup + queuesPerGroup
      );
      groups.push(group);
    }
  });
  console.log("groups", groups);

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const type = group.type;
    const items = group.items;

    const resultObj = await getList({
      type,
      params: items.map((item) => item.params),
    });
    // console.log("resultObj", resultObj);

    for (let k = 0; k < items.length; k++) {
      const item = items[k];
      const originalItem = item.originalItem;
      if (type === "reddit") {
        if (resultObj && resultObj[item.params.name]) {
          // write
          originalItem.score = resultObj[item.params.name].score;
          originalItem.ups = resultObj[item.params.name].score;

          await writeJson(item.path, originalItem);
        } else {
          console.warn(`there is no ${item.path} update result`);
        }
      } else if (type === "youtube") {
        if (resultObj && resultObj[item.params.id]) {
          // write
          const statics = resultObj[item.params.id].statistics;
          originalItem.statistics.views = statics.viewCount;
          const count =
            Number(statics.likeCount) + Number(statics.dislikeCount);
          originalItem.starRating.count = `${count}`;
          if (statics.likeCount > 0) {
            const average = (Number(statics.likeCount * 5) / count).toFixed(2);
            originalItem.starRating.average = average;
          }
          await writeJson(item.path, originalItem);
        } else {
          console.warn(`there is no ${item.path} update result`);
        }
      } else if (type === "hn") {
        if (resultObj && resultObj[item.params.id]) {
          // write
          originalItem.points = resultObj[item.params.id].score;
          await writeJson(item.path, originalItem);
        } else {
          console.warn(`there is no ${item.path} update result`);
        }
      } else if (type === "ph") {
        if (resultObj && resultObj[item.params.id]) {
          // write
          originalItem.votesCount = resultObj[item.params.id].votesCount;
          await writeJson(item.path, originalItem);
        } else {
          console.warn(`there is no ${item.path} update result`);
        }
      } else if (type === "tweet") {
        if (resultObj && resultObj[item.params.id]) {
          // write
          originalItem.retweet_count = resultObj[item.params.id].retweet_count;
          originalItem.favorite_count =
            resultObj[item.params.id].favorite_count;
          await writeJson(item.path, originalItem);
        } else {
          console.warn(`there is no ${item.path} update result`);
        }
      }
    }
  }
}

async function writeJson(filePath, obj) {
  console.log(`write ${filePath}`);
  obj.source_updated_at = new Date().getTime();
  await writeFile(filePath, JSON.stringify(obj, null, 2));
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

function getLastUpdatedPeriod() {
  const now = Date.now();
  const period = 8 * 24 * 60 * 60 * 1000;
  const start = now - period;
  const end = now - 1 * 6 * 60 * 60 * 1000;
  return {
    start,
    end,
  };
}
module.exports = main;
