const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const generateSourceFiles = require("./generate-reddit-top-module");
async function main() {
  const outputs = require(`${process.env.GITHUB_WORKSPACE}/${process.env.OUTPUTS_PATH}`);
  const items = outputs;
  await generateSourceFiles();
  // add item to issues json
  // get the last json
  let now = Date.now();
  const currentYear = new Date(now).getUTCFullYear();
  const issuesDir = `./data/reddit-top-issues`;
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
  let currentIssueItems = [];
  let lastIssueDraft = false;
  let draft = true;
  if (issuesIssueNumbers && issuesIssueNumbers[0]) {
    // last issue exists
    let lastIssueNumber = issuesIssueNumbers[0];
    const lastIssueFilePath = path.join(issuesDir, `${lastIssueNumber}.json`);
    const lastIssueContent = await fs.readFile(lastIssueFilePath, "utf8");
    const lastIssue = JSON.parse(lastIssueContent);
    lastIssueEndedAt = lastIssue.endedAt;
    lastIssueStartedAt = lastIssue.startedAt;
    lastIssueDraft = lastIssue.draft;
    // if lastIssueTime less than 7 days
    // console.log("now", now);
    // console.log("lastIssueStartedAt", lastIssueStartedAt);
    // console.log("lastIssueEndedAt", lastIssueEndedAt);
    // console.log("now >= lastIssueStartedAt", now >= lastIssueStartedAt);
    // console.log("now < lastIssueEndedAt", now < lastIssueEndedAt);

    if (now >= lastIssueStartedAt && now < lastIssueEndedAt) {
      // overwrite
      currentIssueNumber = lastIssueNumber;
      currentIssueCreatedAt = lastIssue.createdAt;
      currentIssueEndedAt = lastIssue.endedAt;
      currentIssueStartedAt = lastIssue.startedAt;
      currentIssueItems = lastIssue.items;
      console.log("this will overwrite already generated issue file");
    } else {
      currentIssueNumber = lastIssueNumber + 1;
      currentIssueStartedAt = lastIssueEndedAt;
      currentIssueEndedAt = lastIssueEndedAt + periodTime;
      if (lastIssueDraft && now >= lastIssueEndedAt) {
        // change draft flag
        lastIssue.draft = false;
        await fs.writeFile(
          lastIssueFilePath,
          JSON.stringify(lastIssue, null, 2)
        );
      }
    }
  }

  const maxPosts = {
    reddit: 25,
  };
  // compare and replace the most popular posts
  const newItems = items
    .map((item) => {
      return {
        slug: item.permalink,
        createdAt: item.created_utc * 1000,
        score: item.score,
        type: "reddit",
      };
    })
    .filter((item) => {
      if (
        item.createdAt >= currentIssueStartedAt &&
        item.createdAt < currentIssueEndedAt
      ) {
        return true;
      } else {
        return false;
      }
    });
  console.log("New items length: ", newItems.length);
  const allItemsMap = {};
  const uniqueMap = {};
  currentIssueItems.forEach((item) => {
    uniqueMap[item.type + item.slug] = item;
  });
  newItems.forEach((item) => {
    uniqueMap[item.type + item.slug] = item;
  });
  const newMergedItems = Object.keys(uniqueMap).map((key) => uniqueMap[key]);

  // if need change the

  if (newMergedItems.length <= currentIssueItems.length) {
    console.log("There is no new items for issue, skip for this time");
    return;
  }
  newMergedItems.forEach((item) => {
    if (!allItemsMap[item.type]) {
      allItemsMap[item.type] = [];
    }
    allItemsMap[item.type].push(item);
  });
  let allItems = [];
  // sort by score
  const allTypekeys = Object.keys(allItemsMap);
  allTypekeys.forEach((type) => {
    let typeItems = allItemsMap[type].sort((a, b) => {
      return b.score - a.score;
    });
    if (typeItems.length > maxPosts[type]) {
      allItems = allItems.concat(typeItems.slice(0, maxPosts[type]));
    } else {
      allItems = allItems.concat(typeItems);
    }
  });

  // sort by created at

  allItems.sort((a, b) => {
    return b.createdAt - a.createdAt;
  });

  const currentIssueFile = path.join(issuesDir, `${currentIssueNumber}.json`);
  if (now >= currentIssueEndedAt) {
    draft = false;
  }
  const currentIssue = {
    createdAt: currentIssueCreatedAt,
    updatedAt: now,
    startedAt: currentIssueStartedAt,
    endedAt: currentIssueEndedAt,
    id: currentIssueNumber,
    issueNumber: currentIssueNumber,
    year: currentYear,
    items: allItems,
    draft: draft,
  };
  console.log("currentIssueFile", currentIssueFile);
  console.log("currentIssue", currentIssue);
  await fs.writeFile(currentIssueFile, JSON.stringify(currentIssue, null, 2));
  return true;
}
module.exports = main;
