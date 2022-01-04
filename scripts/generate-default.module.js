const path = require("path");
const fsPure = require("fs");
const fs = fsPure.promises;
const getMeta = require("./get-metadata");
const { symlink, mkdir } = fs;
const { existsSync } = fsPure;
const { dirname, relative, resolve } = path;
const main = async ({
  dest = "data/default-newstop",
  name = "default-newstop",
  dateField = "created_at",
  idField = `objectID`,
  type = "hn",
  isTranslateTag = true,
  isGetMeta = false,
  translationFields = ["title"],
} = {}) => {
  const outputs = require(`${process.env.GITHUB_WORKSPACE}/${process.env.OUTPUTS_PATH}`);
  for (let i = 0; i < outputs.length; i++) {
    const item = outputs[i];
    const originalCreatedAt = new Date(item[`original_${dateField}`]);
    const fileRelativePath = path.join(
      dest,
      `${originalCreatedAt.getUTCFullYear()}/${
        originalCreatedAt.getUTCMonth() + 1
      }/${item[idField]}.json`
    );
    const hnFilePath = path.resolve(
      process.env.GITHUB_WORKSPACE,
      fileRelativePath
    );
    if (isGetMeta) {
      // get metadata
      const itemUrl = item.url || item.link;
      if (itemUrl) {
        try {
          const meta = await getMeta(itemUrl);
          if (meta && meta.image) {
            item.image = meta.image;
          } else {
            item.image = "";
          }
        } catch (error) {
          console.log("error", error);

          console.warn("get image from ${itemUrl} failed", error);
          item.image = "";
        }
      } else {
        item.image = "";
      }
    }
    console.log(`Write json ${hnFilePath}`);
    // is exist
    const isTargetFileExist = fsPure.existsSync(hnFilePath);
    if (isTargetFileExist) {
      const originalJson = await fs.readFile(hnFilePath, "utf8");
      const originalRedditItem = JSON.parse(originalJson);
      item[dateField] = originalRedditItem[dateField];
      if (originalRedditItem.localize) {
        item.localize = originalRedditItem.localize;
      }
    }
    await fs
      .mkdir(path.dirname(hnFilePath), {
        recursive: true,
      })
      .then(() => {
        return fs
          .writeFile(hnFilePath, JSON.stringify(item, null, 2), {
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
    const targetLink = getTargetLink(type, item);
    if (targetLink) {
      await createSymLink(hnFilePath, targetLink);
    }
    const title = item.title;
    let tags = item.tags || [];

    const locale = "en";
    const utcYear = originalCreatedAt.getUTCFullYear();
    const utcMonth = originalCreatedAt.getUTCMonth() + 1;
    const addZeroUtcMonth = utcMonth < 10 ? `0${utcMonth}` : `${utcMonth}`;

    for (let h = 0; h < translationFields.length; h++) {
      const field = translationFields[h];
      const fieldLocaleFileName = `${type}_--_${name}_--_${field}_--_${utcYear}_--_${addZeroUtcMonth}.json`;
      const filePath = `./i18n/post-resource/${locale}/${fieldLocaleFileName}`;
      const absoluteFilePath = path.resolve(
        process.env.GITHUB_WORKSPACE,
        filePath
      );
      const isExist = fsPure.existsSync(absoluteFilePath);
      if (!isExist) {
        await fs.writeFile(absoluteFilePath, "{}");
      }
      const localeJson = await fs.readFile(absoluteFilePath, "utf8");
      const localeObj = JSON.parse(localeJson);
      if (item[field]) {
        if (localeObj[fileRelativePath] !== item[field]) {
          localeObj[fileRelativePath] = item[field];
          // write
          await fs.writeFile(
            absoluteFilePath,
            JSON.stringify(localeObj, null, 2)
          );
          console.log(`Write ${filePath} success`);
        }
      }
    }

    if (isTranslateTag) {
      const tagFilePath = `./i18n/i18next/${locale}/translation-tag.json`;
      const absoluteTagFilePath = path.resolve(
        process.env.GITHUB_WORKSPACE,
        tagFilePath
      );
      const isTagFileExist = fsPure.existsSync(absoluteTagFilePath);
      if (!isTagFileExist) {
        await fs.writeFile(absoluteTagFilePath, "{}");
      }
      const tagLocaleJson = await fs.readFile(absoluteTagFilePath, "utf8");
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
        await fs.writeFile(
          absoluteTagFilePath,
          JSON.stringify(tagLocaleObj, null, 2)
        );
        console.log(`Write ${tagFilePath} success`);
      } else {
        console.log(`No changes for tags, skip write tag file`);
      }
    }

    console.log("\n");
  }

  return outputs.length;
};
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
  } else {
    return null;
  }
  const targetPath = resolve(
    __dirname,
    "../",
    `ref/${fileType}${slug}data.json`
  );
  return targetPath;
}
module.exports = main;
