const core = require("@actions/core");
const path = require("path");
const fs = require("fs").promises;
const githubWorkspace =
  process.env.GITHUB_WORKSPACE || path.resolve(__dirname, "../../../../");
async function main() {
  const formatFunction = core.getInput("function") || "reddit";
  const outputsFile = `${githubWorkspace}/${process.env.OUTPUTS_PATH}`;
  const outputsContent = await fs.readFile(outputsFile, "utf8");
  const outputs = JSON.parse(outputsContent);
  // change
  const formatOutputs = require(`./format/${formatFunction}`)(outputs);
  // write
  await fs.writeFile(outputsFile, JSON.stringify(formatOutputs, null, 2));
}

main()
  .catch((e) => {
    core.setFailed(e);
  })
  .then(() => {
    core.setOutput("success", true);
  });
