const { format } = require("../format");
const { getMockJson } = require("../fs");
describe("format", () => {
  test("format reddit", async () => {
    const newJson = format("reddit", await getMockJson("reddit1.json"));
    console.log("newJson", newJson);

    expect(newJson.title).toBe(
      "[May 5th, 1920] Lenin speaks to Red Army troops leaving for the front at Moscow’s Sverdlov Square"
    );
  });
});
