const sitesInfo = require("./sites.json");
const issueSendInfo = require("../data/db/issue-sent.json");
module.exports = async function ({ helpers }) {
  const { sites } = sitesInfo;
  let items = [];
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    if (site.issueCount > 0) {
      // need push issue
      const siteIssueUrl = `${site.url}/page-data/issues/page-data.json`;
      const issuesInfo = await helpers.axios.get(siteIssueUrl);
      const issues = issuesInfo.data.result.data.allIssue.nodes || [];
      if (issues.length > 0) {
        const issue = issues[0];
        const issuePlainUrl = `${site.url}/plain/issues/${issue.issueNumber}/`;
        const issueUrl = `${site.url}/issues/${issue.issueNumber}/`;
        const ivUrl = `https://t.me/iv?url=${issuePlainUrl}&rhash=c05877946da465`;
        const item = {
          site: site.url,
          issueNumber: issue.issueNumber,
          issueUrl,
          ivUrl,
        };
        if (site.telegram && site.telegram_chat_id) {
          // special telegram
          const specialItem = {
            ...item,
            type: "telegram",
            subtype: site.telegram,
            telegram: site.telegram,
            telegram_chat_id: site.telegram_chat_id,
            message: `${site.name}: <a href="${ivUrl}">每周精选 - 第${issue.issueNumber}期</a>`,
          };

          items.push(specialItem);
        }
        const buzzingccTelegramChatId = "-1001406368978";
        const buzzingccTelegram = "@buzzingcc";
        if (
          site.telegram !== buzzingccTelegram &&
          site.telegram_chat_id !== buzzingccTelegramChatId
        ) {
          // buzzing telegrm message
          const buzzinItem = {
            ...item,
            type: "telegram",
            subtype: buzzingccTelegram,
            telegram: buzzingccTelegram,
            telegram_chat_id: buzzingccTelegramChatId,
            message: `${site.name}: <a href="${ivUrl}">每周精选 - 第${issue.issueNumber}期</a>`,
          };
          items.push(buzzinItem);
        }

        // buzzing tweet message

        const buzzingTweet = {
          ...item,
          type: "ifttt",
          subtype: "theowenyoungbuzzing",
          event: "new_issue",
          message: `${site.name}: 每周精选 - 第${issue.issueNumber}期 ${issueUrl}`,
        };
        items.push(buzzingTweet);
        // todo email
      }
    }
  }
  items = items.map((item) => {
    item.id =
      item.site +
      "/social/" +
      item.type +
      "/" +
      item.subtype +
      "/" +
      item.issueNumber;
    return item;
  });
  items = items.filter((item) => {
    const itemId = item.id;
    if (
      issueSendInfo &&
      issueSendInfo.data &&
      issueSendInfo.data[itemId] &&
      issueSendInfo.data[itemId].s === "success"
    ) {
      console.log(
        `This issue ${itemId} has sent before`,
        issueSendInfo.data[itemId]
      );
      return false;
    }
    return true;
  });
  console.log("items", items);
  // filter deduplication
  return items;
};
