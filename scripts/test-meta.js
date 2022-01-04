const getMetadata = require("./get-metadata/mac.index");
const url =
  "https://news.google.com/__i/rss/rd/articles/CBMiWGh0dHBzOi8vd3d3Lndvb2R0di5jb20vaGVhbHRoL2Nvcm9uYXZpcnVzL2NhbmFkYS1yZWNvcmRzLTFzdC1jYXNlcy1vZi1uZXctdmlydXMtdmFyaWFudC_SAVxodHRwczovL3d3dy53b29kdHYuY29tL2hlYWx0aC9jb3JvbmF2aXJ1cy9jYW5hZGEtcmVjb3Jkcy0xc3QtY2FzZXMtb2YtbmV3LXZpcnVzLXZhcmlhbnQvYW1wLw?oc=5";

getMetadata(url)
  .then((data) => {
    console.log("data", data);
  })
  .catch((e) => {
    console.log("e", e);
  });
