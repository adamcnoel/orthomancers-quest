const {spawnSync} = require("child_process");
const path = require("path");
const tests = ["core-state.js","playthrough.js"];
for (const file of tests) {
  const result = spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:"inherit"});
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("PASS: all Orthomancer tests");
