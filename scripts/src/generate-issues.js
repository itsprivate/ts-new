const path = require("path");
const fsPure = require("fs");
const micromatch = require("micromatch");
const fs = fsPure.promises;
const { readdir, writeFile, readFile } = fs;
const { basename, resolve, relative } = path;
async function main() {
  const directories = [
    {
      folders: ["data/reddit-top"],
      issueDir: "data/reddit-top-issues",
      config: {
        reddit: 20,
      },
      sort: "simple",
    },
    {
      folders: ["data/hn-top"],
      issueDir: "data/hn-top-issues",
      config: {
        hn: 20,
      },
      sort: "simple",
    },
    {
      folders: ["data/youtube-top"],
      issueDir: "data/youtube-top-issues",
      config: {
        youtube: 20,
      },
      sort: "simple",
    },
    {
      folders: ["data/ph-top"],
      issueDir: "data/ph-top-issues",
      config: {
        ph: 20,
      },
      sort: "simple",
    },

    {
      folders: ["data/reddit-stocks", "data/tweet-stocks"],
      issueDir: "data/stocks-issues",
      config: {
        reddit: 15,
        tweet: 5,
      },
      sort: "group",
    },
    {
      folders: ["data/reddit-crypto", "data/tweet-crypto"],
      issueDir: "data/crypto-issues",
      config: {
        reddit: 15,
        tweet: 5,
      },
      sort: "group",
    },
    // {
    //   folders: ["data/reddit-changemyview"],
    //   issueDir: "data/reddit-changemyview-issues",
    //   config: {
    //     reddit: 20,
    //   },
    //   sort: "simple",
    // },
    {
      folders: ["data/reddit-ask"],
      issueDir: "data/reddit-ask-issues",
      config: {
        reddit: 20,
      },
      sort: "simple",
    },
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
      subtypeParser: (item) => {
        return item.subreddit;
      },
      sort: (a, b) => {
        //
        return b.score - a.score;
      },
      slug: (item) => {
        return `/reddit${item.permalink}`;
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
      subtypeParser: (item) => {
        return item.channelId;
      },
      sort: (a, b) => {
        const aScore =
          (a.starRating.count * a.starRating.average * 10) / 5 +
          Number(a.statistics.views);
        const bScore =
          (b.starRating.count * b.starRating.average * 10) / 5 +
          Number(b.statistics.views);
        return bScore - aScore;
      },
      slug: (item) => {
        return `/youtube/${item.videoId}/`;
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
      subtypeParser: (item) => {
        return item.author;
      },
      sort: (a, b) => {
        return b.points - a.points;
      },
      slug: (item) => {
        return `/hn/${item.objectID}/`;
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
      subtypeParser: (item) => {
        return "ph";
      },
      sort: (a, b) => {
        return b.votesCount - a.votesCount;
      },
      slug: (item) => {
        return `/ph/${item.slug}/`;
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
      subtypeParser: (item) => {
        return item.user.id_str;
      },
      sort: (a, b) => {
        const aScore = a.retweet_count * 2 + a.favorite_count;
        const bScore = b.retweet_count * 2 + b.favorite_count;

        return bScore - aScore;
      },
      slug: (item) => {
        return `/tweet/${item.id_str}/`;
      },
    },
  };
  const gruops = [];
  const issuesMap = {};
  for (let o = 0; o < directories.length; o++) {
    const directoryItem = directories[o];
    const folders = directoryItem.folders;
    const currentYear = new Date(now).getUTCFullYear();
    const issuesDirRelative = directoryItem.issueDir;
    const issuesDir = resolve(__dirname, "../../", issuesDirRelative);
    console.log("issuesDir", issuesDir);

    const isWeeklyDirExist = fsPure.existsSync(issuesDir);
    if (!isWeeklyDirExist) {
      await fs.mkdir(issuesDir);
    }
    // get all
    let issuesFiles = await fs.readdir(issuesDir, { withFileTypes: true });
    let issuesIssueNumbers = issuesFiles
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name.split(".")[0])
      .map((dirent) => Number(dirent))
      .sort((a, b) => b - a);
    let periodTime = 7 * 24 * 60 * 60 * 1000;
    let lastIssueStartedAt = now - periodTime;
    let lastIssueEndedAt = now;
    let currentIssueNumber = 1;
    let currentIssueCreatedAt = now;
    let currentIssueStartedAt = now - periodTime;
    let currentIssueEndedAt = now;
    issuesMap[issuesDirRelative] = {
      issueDir: issuesDir,
      items: [],
    };
    let isNeedToGenerateNewIssue = true;
    if (issuesIssueNumbers && issuesIssueNumbers[0]) {
      // last issue exists
      let lastIssueNumber = issuesIssueNumbers[0];
      const lastIssueFilePath = path.join(issuesDir, `${lastIssueNumber}.json`);
      const lastIssueContent = await fs.readFile(lastIssueFilePath, "utf8");
      const lastIssue = JSON.parse(lastIssueContent);
      lastIssueEndedAt = lastIssue.endedAt;
      lastIssueStartedAt = lastIssue.startedAt;
      // if lastIssueTime less than 7 days
      // console.log("now", now);
      // console.log("lastIssueStartedAt", lastIssueStartedAt);
      // console.log("lastIssueEndedAt", lastIssueEndedAt);
      // console.log("now >= lastIssueStartedAt", now >= lastIssueStartedAt);
      // console.log("now < lastIssueEndedAt", now < lastIssueEndedAt);

      if (now >= lastIssueStartedAt && now < lastIssueEndedAt) {
        // overwrite
        isNeedToGenerateNewIssue = false;

        console.log(
          ` The issue ${issuesDir} is already exist, do not generate a new issue`
        );
      } else {
        currentIssueNumber = lastIssueNumber + 1;
        currentIssueStartedAt = lastIssueEndedAt;
      }
    }
    let issueSourceFilesLength = 0;
    for (let q = 0; q < folders.length; q++) {
      const directory = folders[q];
      const type = basename(directory).split("-")[0];

      issuesMap[issuesDirRelative].items.push({
        type: type,
        count:
          directoryItem.config && directoryItem.config[type]
            ? directoryItem.config[type]
            : 20,
        sort: directoryItem.sort ? directoryItem.sort : "simple",
        items: [],
      });
      const folder = resolve(__dirname, `../../`, directory);

      const files = await getFiles(folder);
      const jsonFiles = micromatch(files, "**/*.json");
      issueSourceFilesLength += jsonFiles.length;
      for (let i = 0; i < jsonFiles.length; i++) {
        const jsonPath = resolve(__dirname, "../../", jsonFiles[i]);
        const jsonContent = await readFile(jsonPath, "utf8");
        let item = JSON.parse(jsonContent);

        // get created_at
        const dateParser =
          fields[type] && fields[type].dateParser
            ? fields[type].dateParser
            : (item) => new Date(item.created_at);
        const createdAt = dateParser(item);

        if (
          createdAt < currentIssueEndedAt &&
          createdAt >= currentIssueStartedAt
        ) {
          issuesMap[issuesDirRelative].items[q].items.push(item);
        }
      }
    }
    if (issueSourceFilesLength < 70) {
      isNeedToGenerateNewIssue = false;
      console.log(
        "the issue source files is less than 70, no need to generatre issue"
      );
    }
    if (isNeedToGenerateNewIssue) {
      const currentIssueFile = path.join(
        issuesDir,
        `${currentIssueNumber}.json`
      );
      const currentIssue = {
        createdAt: currentIssueCreatedAt,
        updatedAt: now,
        startedAt: currentIssueStartedAt,
        endedAt: currentIssueEndedAt,
        id: basename(issuesDirRelative) + "-" + currentIssueNumber,
        issueNumber: currentIssueNumber,
        year: currentYear,
        draft: false,
      };
      console.log("currentIssueFile", currentIssueFile);
      console.log("currentIssue", currentIssue);
      issuesMap[issuesDirRelative].issueFile = currentIssueFile;
      issuesMap[issuesDirRelative].issueInfo = currentIssue;
    }
  }
  const issuesKeys = Object.keys(issuesMap);
  issuesKeys.forEach((issueKey) => {
    gruops.push(issuesMap[issueKey]);
  });
  // sort
  gruops.forEach((group, rootIndex) => {
    group.items.forEach((groupItem, index) => {
      const groupItems = groupItem.items;
      const groupType = groupItem.type;
      groupItems.sort(fields[groupType].sort);
      gruops[rootIndex].items[index].items = groupItems;
    });
  });

  // filter and group by subtype, like subreddit
  const finalGroups = [];
  gruops.forEach((group) => {
    let groupItems = [];
    group.items.forEach((theGroupItem) => {
      const subtypeGroup = {};
      theGroupItem.items.forEach((realItem) => {
        // getSubType
        let subtype = theGroupItem.type;
        if (theGroupItem.sort === "group") {
          subtype = `${theGroupItem.type}:${fields[
            theGroupItem.type
          ].subtypeParser(realItem)}`;
        }
        if (!subtypeGroup[subtype]) {
          subtypeGroup[subtype] = {
            type: theGroupItem.type,
            subtype: subtype,
            items: [],
          };
        }
        subtypeGroup[subtype].items.push(realItem);
      });

      const subtypeGroupKeys = Object.keys(subtypeGroup);

      // count ratio
      subtypeGroupKeys.forEach((subtype, subIndex) => {
        const subtypeItems = subtypeGroup[subtype].items;
        let subcount = Math.floor(
          (theGroupItem.count * subtypeItems.length) / theGroupItem.items.length
        );

        if (subIndex === subtypeGroupKeys.length - 1) {
          // remain
          let sum = 0;
          for (
            let sumIndex = 0;
            sumIndex < subtypeGroupKeys.length - 1;
            sumIndex++
          ) {
            const sumcount = subtypeGroup[subtypeGroupKeys[sumIndex]].subcount;
            sum += sumcount;
          }

          subcount = theGroupItem.count - sum;
        }

        subtypeGroup[subtype].subcount = subcount;
      });

      subtypeGroupKeys.forEach((subtype) => {
        const subtypeGroupItem = subtypeGroup[subtype];
        const subtypecount = subtypeGroupItem.subcount;
        const subtypeItems = subtypeGroupItem.items;
        subtypeItems.slice(0, subtypecount).forEach((item) => {
          groupItems.push({
            type: theGroupItem.type,
            item: item,
          });
        });
      });
    });
    finalGroups.push({
      ...group,
      items: groupItems,
    });
  });

  for (let i = 0; i < finalGroups.length; i++) {
    const finalGroup = finalGroups[i];
    const issuesDir = finalGroup.issueDir;
    const issueFile = finalGroup.issueFile;
    console.log("issueFile", issueFile);

    if (issueFile) {
      // generate
      if (finalGroup.items && finalGroup.items.length >= 20) {
        const finalIssue = {
          ...finalGroup.issueInfo,
          items: finalGroup.items.map((item) => {
            return {
              slug: fields[item.type].slug(item.item),
              type: item.type,
            };
          }),
        };
        console.log("finalIssue", JSON.stringify(finalIssue, null, 2));

        await writeJson(issueFile, finalIssue);
      } else {
        console.log("no enough items", finalGroup.items.length);
      }
    } else {
      console.log(`no need to generate ${issuesDir}`);
    }
  }
}
module.exports = main;
async function writeJson(filePath, obj) {
  console.log(`write ${filePath}`);
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
