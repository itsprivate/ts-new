const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const { symlink, mkdir } = fs;
const { existsSync } = fsPure;
const { dirname, relative, resolve } = path;
const writeJson = require("./write-json");
async function main({ dest = "data/reddit-top", name = "reddit-top" } = {}) {
  const outputs = require(`${process.env.GITHUB_WORKSPACE}/${process.env.OUTPUTS_PATH}`);
  const items = outputs;
  console.log(`There are ${items.length} items.`);
  console.log("\n");
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let link = item.permalink;
    if (link && link.endsWith("/")) {
      link = link.slice(0, -1);
    }
    const redditFilePath = path.join(dest, `${link}.json`);
    // is exist
    const isRedditFileExist = fsPure.existsSync(redditFilePath);
    const originalCreatedAt = new Date(item.original_created_utc * 1000);
    if (isRedditFileExist) {
      const originalJson = await fs.readFile(redditFilePath, "utf8");
      const originalRedditItem = JSON.parse(originalJson);
      item.created_utc = originalRedditItem.created_utc;
      if (originalRedditItem.localize) {
        item.localize = originalRedditItem.localize;
      }
    }

    await fs
      .mkdir(path.dirname(redditFilePath), {
        recursive: true,
      })
      .then(() => {
        return writeJson(redditFilePath, item);
      });
    console.log(`Write reddit json ${redditFilePath} success.`);
    // is ln link exists
    const targetLink = getTargetLink("reddit", item);
    await createSymLink(redditFilePath, targetLink);
    const title = item.title;
    const id = item.id;
    const excerpt = item.the_new_excerpt;
    const tags = [item.subreddit];
    const locale = "en";
    const utcYear = originalCreatedAt.getUTCFullYear();
    const utcMonth = originalCreatedAt.getUTCMonth() + 1;
    const addZeroUtcMonth = utcMonth < 10 ? `0${utcMonth}` : `${utcMonth}`;
    const titleLocaleFileName = `reddit_--_${name}_--_title_--_${utcYear}_--_${addZeroUtcMonth}.json`;
    const excerptLocaleFileName = `reddit_--_${name}_--_the_new_excerpt_--_${utcYear}_--_${addZeroUtcMonth}.json`;
    const filePath = `./i18n/post-resource/${locale}/${titleLocaleFileName}`;
    const excerptFilePath = `./i18n/post-resource/${locale}/${excerptLocaleFileName}`;
    const tagFilePath = `./i18n/i18next/${locale}/translation-tag.json`;

    const isExist = fsPure.existsSync(filePath);
    if (!isExist) {
      await writeJson(filePath, {});
    }
    const isExcerptExist = fsPure.existsSync(excerptFilePath);
    if (!isExcerptExist) {
      await writeJson(excerptFilePath, {});
    }
    const isTagFileExist = fsPure.existsSync(tagFilePath);
    if (!isTagFileExist) {
      await writeJson(tagFilePath, {});
    }

    const localeJson = await fs.readFile(filePath, "utf8");
    const localeObj = JSON.parse(localeJson);

    if (title) {
      if (localeObj[redditFilePath] !== title) {
        localeObj[redditFilePath] = title;
        // write
        await writeJson(filePath, localeObj);
      }
    }

    const localeExcerptJson = await fs.readFile(excerptFilePath, "utf8");
    const localeExcerptObj = JSON.parse(localeExcerptJson);
    if (excerpt) {
      if (localeExcerptObj[redditFilePath] !== excerpt) {
        localeExcerptObj[redditFilePath] = excerpt;
        // write excerpt
        await writeJson(excerptFilePath, localeExcerptObj);
      }
    }

    const tagLocaleJson = await fs.readFile(tagFilePath, "utf8");
    const tagLocaleObj = JSON.parse(tagLocaleJson);
    let isChanged = false;
    tags.forEach((tag) => {
      if (!tagLocaleObj[tag]) {
        isChanged = true;
        tagLocaleObj[tag] = tag;
      }
    });
    if (isChanged) {
      // write
      await writeJson(tagFilePath, tagLocaleObj);
      console.log(`Write ${tagFilePath} success`);
    } else {
      console.log(`No changes for tags, skip write tag file`);
    }
    console.log("\n");
  }
  return true;
}
async function createSymLink(from, to) {
  if (!existsSync(to)) {
    // if parent exists
    if (!existsSync(dirname(to))) {
      // mkdir
      await mkdir(dirname(to), { recursive: true });
    }
    // create link
    // relative link
    // console.log("from ", from, "to", to);
    const relativeLink = relative(dirname(to), from);
    // console.log("relativeLink", relativeLink);

    await symlink(relativeLink, to);
  }
}

function getTargetLink(fileType, json) {
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
  return targetPath;
}
module.exports = main;
