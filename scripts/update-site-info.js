const axios = require("axios");
const fs = require("fs");
const { resolve } = require("path");
const { readFile, writeFile } = fs.promises;
async function main() {
  const sitesJsonPath = resolve(__dirname, "./sites.json");
  const sitesJson = await readFile(sitesJsonPath, "utf8");
  const sitesObj = JSON.parse(sitesJson);
  const sites = sitesObj.sites;

  // update info
  const apis = [];
  sites.forEach((site) => {
    let apiPath = "/manifest.webmanifest";
    apis.push(`${site.url}${apiPath}`);
  });
  const promises = apis.map((api) => {
    return axios(api).then((result) => result.data);
  });
  const results = await Promise.all(promises);
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const issuesInfo = await axios.get(
      `${sites[i].url}/page-data/issues/page-data.json`
    );
    const issues = issuesInfo.data.result.data.allIssue.nodes || [];
    sites[i] = {
      ...sites[i],
      ...result,
      issueCount: issues.length,
    };
  }
  sitesObj.sites = sites;
  // write
  await writeJson(sitesJsonPath, sitesObj);
}

async function writeJson(filePath, obj) {
  console.log(`write ${filePath}`);
  obj.source_updated_at = new Date().getTime();
  await writeFile(filePath, JSON.stringify(obj, null, 2));
}

main().catch((e) => {
  console.error("e", e);
});
