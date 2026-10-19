const {spawnSync} = require("child_process");
const path = require("path");
const tests = ["core-state.js","startup-state.js","startup-ui.js","recency-spacing.js","playthrough.js","scheduler-analysis.js","scheduler-recovery-analysis.js"];
for (const file of tests) {
  const result = spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:"inherit"});
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("PASS: all Orthomancer tests");
