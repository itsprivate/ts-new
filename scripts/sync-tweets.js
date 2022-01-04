const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const writeJson = require("./write-json");
const main = async ({
  dest = "data/tweet-stocks",
  name = "tweet-stocks",
} = {}) => {
  const outputs = require(`${process.env.GITHUB_WORKSPACE}/${process.env.OUTPUTS_PATH}`);
  for (let i = 0; i < outputs.length; i++) {
    const item = outputs[i];
    const originalCreatedAt = new Date(Date.parse(item.original_created_at));
    const fileRelativePath = path.join(
      dest,
      `${originalCreatedAt.getUTCFullYear()}/${
        originalCreatedAt.getUTCMonth() + 1
      }/${item.id_str}.json`
    );
    const tweetFilePath = path.resolve(
      process.env.GITHUB_WORKSPACE,
      fileRelativePath
    );
    console.log(`Write tweet json ${tweetFilePath}`);
    // is exist
    const isTargetFileExist = fsPure.existsSync(tweetFilePath);
    if (isTargetFileExist) {
      const originalJson = await fs.readFile(tweetFilePath, "utf8");
      const originalRedditItem = JSON.parse(originalJson);
      item.created_at = originalRedditItem.created_at;
      if (originalRedditItem.localize) {
        item.localize = originalRedditItem.localize;
      }
    }
    await fs
      .mkdir(path.dirname(tweetFilePath), {
        recursive: true,
      })
      .then(() => {
        return fs
          .writeFile(tweetFilePath, JSON.stringify(item, null, 2), {
            flag: "wx",
          })
          .catch((e) => {
            if (e.code === "EEXIST") {
              return Promise.resolve();
            } else {
              return Promise.reject(e);
            }
          });
      });
    const full_text = item.full_text;
    let quoteFull_text;
    if (
      item.is_quote_status &&
      item.quoted_status &&
      item.quoted_status.full_text
    ) {
      quoteFull_text = item.quoted_status.full_text;
    }
    let retweeted_status_full_text;
    if (item.retweeted_status && item.retweeted_status.full_text) {
      retweeted_status_full_text = item.retweeted_status.full_text;
    }
    const user = item.user;
    const tags = [user.name].concat(
      item.entities.hashtags.map((tag) => tag.text) || []
    );
    const locale = "en";
    const utcYear = originalCreatedAt.getUTCFullYear();
    const utcMonth = originalCreatedAt.getUTCMonth() + 1;
    const addZeroUtcMonth = utcMonth < 10 ? `0${utcMonth}` : `${utcMonth}`;
    const titleLocaleFileName = `tweet_--_${name}_--_full_text_--_${utcYear}_--_${addZeroUtcMonth}.json`;
    const quoteTextFileName = `tweet_--_${name}_--_quoted_status_full_text_--_${utcYear}_--_${addZeroUtcMonth}.json`;
    const retweetTextFileName = `tweet_--_${name}_--_retweeted_status_full_text_--_${utcYear}_--_${addZeroUtcMonth}.json`;

    const filePath = `./i18n/post-resource/${locale}/${titleLocaleFileName}`;
    const absoluteFilePath = path.resolve(
      process.env.GITHUB_WORKSPACE,
      filePath
    );
    const quoteFilePath = `./i18n/post-resource/${locale}/${quoteTextFileName}`;
    const absoluteQuoteFilePath = path.resolve(
      process.env.GITHUB_WORKSPACE,
      quoteFilePath
    );

    const retweetFilePath = `./i18n/post-resource/${locale}/${retweetTextFileName}`;
    const absoluteRetweetFilePath = path.resolve(
      process.env.GITHUB_WORKSPACE,
      retweetFilePath
    );

    // const tagFilePath = `./i18n/i18next/${locale}/translation-tag.json`;
    // const absoluteTagFilePath = path.resolve(
    //   process.env.GITHUB_WORKSPACE,
    //   tagFilePath
    // );
    const isExist = fsPure.existsSync(absoluteFilePath);
    if (!isExist) {
      await writeJson(absoluteFilePath, {});
    }
    const isQuoteExist = fsPure.existsSync(absoluteQuoteFilePath);
    if (!isQuoteExist) {
      await writeJson(absoluteQuoteFilePath, {});
    }
    const isRetweetExist = fsPure.existsSync(absoluteRetweetFilePath);
    if (!isRetweetExist) {
      await writeJson(absoluteRetweetFilePath, {});
    }
    // const isTagFileExist = fsPure.existsSync(absoluteTagFilePath);
    // if (!isTagFileExist) {
    //   await fs.writeFile(absoluteTagFilePath, "{}");
    // }

    const localeJson = await fs.readFile(absoluteFilePath, "utf8");
    const localeObj = JSON.parse(localeJson);
    if (full_text) {
      if (localeObj[fileRelativePath] !== full_text) {
        localeObj[fileRelativePath] = full_text;
        // write
        await writeJson(absoluteFilePath, localeObj);
      }
    }

    const localeQuoteJson = await fs.readFile(absoluteQuoteFilePath, "utf8");
    const localeQuoteObj = JSON.parse(localeQuoteJson);
    if (quoteFull_text) {
      if (localeQuoteObj[fileRelativePath] !== quoteFull_text) {
        localeQuoteObj[fileRelativePath] = quoteFull_text;
        // write
        await writeJson(absoluteQuoteFilePath, localeQuoteObj);
      }
    }

    const localeRetweetJson = await fs.readFile(
      absoluteRetweetFilePath,
      "utf8"
    );
    const localeRetweetObj = JSON.parse(localeRetweetJson);
    if (retweeted_status_full_text) {
      if (localeRetweetObj[fileRelativePath] !== retweeted_status_full_text) {
        localeRetweetObj[fileRelativePath] = retweeted_status_full_text;
        // write
        await writeJson(absoluteRetweetFilePath, localeRetweetObj);
      }
    }

    // const tagLocaleJson = await fs.readFile(absoluteTagFilePath, "utf8");
    // const tagLocaleObj = JSON.parse(tagLocaleJson);
    // let isChanged = false;
    // tags.forEach((tag) => {
    //   if (!tagLocaleObj[tag]) {
    //     isChanged = true;
    //     tagLocaleObj[tag] = tag;
    //   }
    // });
    // if (isChanged) {
    //   // write
    //   await fs.writeFile(
    //     absoluteTagFilePath,
    //     JSON.stringify(tagLocaleObj, null, 2)
    //   );
    //   console.log(`Write ${tagFilePath} success`);
    // } else {
    //   console.log(`No changes for tags, skip write tag file`);
    // }
    console.log("\n");
  }

  return outputs.length;
};
module.exports = main;
