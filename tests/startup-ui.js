const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

let checks = 0;
function check(condition, message) {
  assert.ok(condition, message);
  checks += 1;
}

check(/<body class="booting">/.test(html), "page should begin in neutral booting state");
check(html.includes('id="home-card"'), "startup home/session gate should exist");
check(html.includes('id="study-card"'), "study workspace should remain separate from startup home");
check(html.includes('id="reset-archive"'), "Reset Archive control should exist");
check(!html.includes('id="reset-progress"'), "old Reset progress control should be removed");
check(html.indexOf("startup-state.js") < html.indexOf("app.js"), "startup classifier must load before app rendering");
check((html.match(/app=orthomancer/g) || []).length >= 6, "versioned assets should carry an Orthomancer-specific cache token");
check(app.includes('window.addEventListener("DOMContentLoaded", init, { once: true })'), "startup should have a single explicit initialization entry point");
check(app.includes('document.body.classList.remove("booting")'), "app should reveal UI only after initialization");
check(app.includes('state.screen = "home"'), "cold startup should land at the stable home/session gate");
check(app.includes("Core.resetAll"), "Reset Archive should use the canonical state reset path");

console.log(`PASS: startup UI contract (${checks} checks)`);
