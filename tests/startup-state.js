const assert = require("assert");
const Startup = require("../startup-state.js");
const Core = require("../game-core.js");

let checks = 0;
function check(condition, message) {
  assert.ok(condition, message);
  checks += 1;
}

const fresh = Startup.resolvePersistentSave(null, []);
check(fresh.status === "fresh", "missing saves should classify as fresh");
check(fresh.parsed === null, "fresh startup should not invent persisted data");

const currentRaw = JSON.stringify({ version: 3, mode: "advanced", mastery: { separate: { stage: 2 } } });
const returning = Startup.resolvePersistentSave(currentRaw, []);
check(returning.status === "returning", "current save should classify as returning");
const returningState = Core.createPersistentState(returning.parsed);
check(returningState.mode === "advanced", "returning save should preserve mode");
check(returningState.mastery.separate.stage === 2, "returning save should preserve mastery");

const legacyRaw = JSON.stringify({ mode: "standard", mastery: { accommodate: { stage: 1, correctForm: 1 } } });
const migrated = Startup.resolvePersistentSave(null, [{ key: "orthomancerSave:v2", raw: legacyRaw }]);
check(migrated.status === "migrated", "valid legacy save should classify as migrated");
check(migrated.legacyKey === "orthomancerSave:v2", "migration should identify source key");
check(Core.createPersistentState(migrated.parsed).mastery.accommodate.stage === 1, "migration should preserve mastery");

const recoveredCurrent = Startup.resolvePersistentSave("{not-json", [{ key: "orthomancerSave:v2", raw: legacyRaw }]);
check(recoveredCurrent.status === "recovered", "corrupt current save should fail safe instead of falling back ambiguously");
check(Object.keys(Core.createPersistentState(recoveredCurrent.parsed).mastery).length === 0, "corrupt current save should initialize clean mastery");

const recoveredLegacy = Startup.resolvePersistentSave(null, [{ key: "orthomancerSave:v2", raw: "[]" }]);
check(recoveredLegacy.status === "recovered", "invalid legacy shape should fail safe");

const persistent = Core.createPersistentState({ mode: "advanced" });
const session = Core.createSessionState();
const flow = Core.createFlowState();
persistent.mastery.test = { stage: 3, correctForm: 4, errorForm: 4, misses: 1, reviewDebt: 0, lastSeen: 1 };
session.answered = 8;
session.correct = 7;
session.streak = 4;
flow.phase = "feedback";
flow.question = { id: "temporary" };
Core.resetAll(persistent, session, flow);
check(persistent.mode === "advanced", "reset should preserve Standard/Advanced preference");
check(Object.keys(persistent.mastery).length === 0, "reset should clear all mastery");
check(session.answered === 0 && session.correct === 0 && session.streak === 0, "reset should clear session statistics");
check(flow.phase === "idle" && flow.question === null, "reset should clear transient flow state");

const serialized = Core.serializePersistent(Core.createPersistentState({
  mode: "standard",
  mastery: { testimony: { stage: 2, correctForm: 2, errorForm: 1 } }
}));
const coldReload = Core.parsePersistent(serialized);
const newSession = Core.createSessionState();
const newFlow = Core.createFlowState();
check(coldReload.mastery.testimony.stage === 2, "cold reload should preserve durable mastery");
check(newSession.answered === 0 && newFlow.phase === "idle", "cold reload should start a fresh session and flow");

console.log(`PASS: startup/session/reset (${checks} checks)`);
