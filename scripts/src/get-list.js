const Youtube = require("youtube-api");
const Reddit = require("reddit");
const axios = require("axios");
const Twit = require("twit");
Youtube.authenticate({
  type: "key",
  key: process.env.YOUTUBE_API_KEY,
});
const redditInit = {
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
  appId: process.env.REDDIT_APP_ID,
  appSecret: process.env.REDDIT_APP_SECRET,
  userAgent: "TopicSource/1.0.0 (https://www.buzzing.cc)",
};

const reddit = new Reddit(redditInit);
exports.getList = async ({ type, params }) => {
  if (type === "youtube") {
    const results = await Youtube.videos.list({
      part: "statistics",
      id: params.map((param) => param.id).join(","),
    });
    return generateObj(results.data.items, "id");
  } else if (type === "reddit") {
    // Submit a link to the /r/BitMidi subreddit
    const res = await reddit.get("/api/info", {
      id: params.map((param) => param.name).join(","),
    });
    return generateObj(
      res.data.children.map((item) => item.data),
      "name"
    );
  } else if (type === "ph") {
    const promises = params
      .map((item) => item.id)
      .map((id) => {
        return axios(`https://api.producthunt.com/v2/api/graphql`, {
          method: "POST",
          data: {
            query: `query {
                post(id: "${id}"){
                  id
                  votesCount
                }
              }`,
            variables: {},
          },
          headers: {
            Authorization: `Bearer ${process.env.PRODUCTHUNT_TOKEN}`,
          },
        })
          .then((data) => {
            return data.data.data.post;
          })
          .catch((e) => null);
      });
    const results = await Promise.all(promises).then((data) => {
      return data.filter((item) => !!item).map((item) => item);
    });
    return generateObj(results, "id");
  } else if (type === "hn") {
    const promises = params
      .map((item) => item.id)
      .map((id) => {
        return axios
          .get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then((data) => {
            return data.data;
          })
          .catch((e) => null);
      });
    const results = await Promise.all(promises).then((data) => {
      return data.filter((item) => !!item).map((item) => item);
    });
    return generateObj(results, "id");
  } else if (type === "tweet") {
    const twitter = new Twit({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token: process.env.TWITTER_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_ACCESS_SECRET,
    });
    const results = await twitter.get("statuses/lookup", {
      id: params.map((item) => item.id).join(","),
    });

    return generateObj(results.data, "id_str");
  } else {
    return {};
  }
};

function generateObj(items, key) {
  const itemsObj = {};
  items.forEach((item) => {
    itemsObj[item[key]] = item;
  });
  return itemsObj;
}
