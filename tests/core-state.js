const assert = require("assert");
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const Core = require("../game-core.js");

function loadWords() {
  const src = fs.readFileSync(path.join(__dirname, "..", "words.js"), "utf8") + "\n;globalThis.__WORDS = SPELLING_WORDS;";
  const context = {};
  vm.createContext(context);
  vm.runInContext(src, context);
  return context.__WORDS;
}

const WORDS = loadWords();
let checks = 0;
function ok(condition, message) { checks++; assert.ok(condition, message); }
function eq(a,b,message) { checks++; assert.strictEqual(a,b,message); }

(function seededQuestionDeterminism() {
  const p1 = Core.createPersistentState();
  const p2 = Core.createPersistentState();
  const q1 = Core.buildQuestion(WORDS, p1, Core.createSeededRng(42));
  const q2 = Core.buildQuestion(WORDS, p2, Core.createSeededRng(42));
  eq(JSON.stringify(q1.sentences.map(s => [s.target.word,s.display])), JSON.stringify(q2.sentences.map(s => [s.target.word,s.display])), "seeded questions should match");
  eq(q1.correctChoice, q2.correctChoice, "seeded correct choice should match");
})();

(function modeSwitchDoesNotReplaceQuestion() {
  const persistent = Core.createPersistentState();
  const session = Core.createSessionState();
  const flow = Core.createFlowState();
  Core.startQuestion(flow, WORDS, persistent, Core.createSeededRng(7));
  const before = JSON.stringify(flow.question);
  Core.setMode(persistent, "advanced");
  eq(JSON.stringify(flow.question), before, "mode switch must not replace current question");
  eq(flow.phase, "question", "mode switch must not change phase");
})();

(function advancedRequiresWordSelection() {
  const persistent = Core.createPersistentState({mode:"advanced"});
  const session = Core.createSessionState();
  const flow = Core.createFlowState();
  Core.startQuestion(flow, WORDS, persistent, Core.createSeededRng(9), {noMistakeRate:0});
  const idx = flow.question.errorIndex;
  const first = Core.chooseSentence(flow, persistent, session, idx, 1);
  ok(first.pendingWord, "advanced A-C should require word selection");
  eq(session.answered, 0, "pending word selection should not score");
  const bad = flow.question.sentences[idx].misspelling;
  const second = Core.chooseWord(flow, persistent, session, bad, 2);
  ok(second.correct, "correct corrupted word should score");
  eq(session.answered, 1, "question should score once");
  const duplicate = Core.chooseWord(flow, persistent, session, bad, 3);
  ok(!duplicate.accepted, "duplicate scoring must be rejected");
  eq(session.answered, 1, "duplicate action must not increment answered");
})();

(function masteryNeedsBothEvidenceTypes() {
  const persistent = Core.createPersistentState();
  for (let i=0;i<20;i++) Core.recordCorrect(persistent, "example", "error", i);
  ok(Core.masteryFor(persistent,"example").stage < 3, "error-form-only evidence must not master");
  for (let i=0;i<2;i++) Core.recordCorrect(persistent, "example", "correct", 100+i);
  eq(Core.masteryFor(persistent,"example").stage, 3, "mixed evidence can master");
})();

(function missDemotes() {
  const persistent = Core.createPersistentState();
  for (let i=0;i<3;i++) {
    Core.recordCorrect(persistent,"example","error",i);
    Core.recordCorrect(persistent,"example","correct",10+i);
  }
  eq(Core.masteryFor(persistent,"example").stage,3,"setup reaches mastered");
  Core.recordMiss(persistent,"example",99);
  eq(Core.masteryFor(persistent,"example").stage,2,"miss demotes mastered word");
})();

(function transitionMatrix() {
  const modes = ["standard","advanced"];
  for (const mode of modes) {
    const persistent = Core.createPersistentState({mode});
    const session = Core.createSessionState();
    const flow = Core.createFlowState();
    const rng = Core.createSeededRng(mode === "standard" ? 21 : 22);
    ok(Core.startQuestion(flow, WORDS, persistent, rng), `${mode}: can start from idle`);
    ok(!Core.startQuestion(flow, WORDS, persistent, rng), `${mode}: cannot replace active question`);
    if (mode === "advanced") {
      Core.chooseSentence(flow,persistent,session,0,1);
      eq(flow.phase,"word-selection","advanced A-C enters word-selection");
      ok(!Core.nextQuestion(flow,WORDS,persistent,rng), "cannot advance before scoring");
      Core.chooseWord(flow,persistent,session,"not-the-word",2);
      eq(flow.phase,"feedback","advanced word choice reaches feedback");
    } else {
      Core.chooseSentence(flow,persistent,session,3,1);
      eq(flow.phase,"feedback","standard choice reaches feedback");
    }
    ok(Core.nextQuestion(flow,WORDS,persistent,rng), `${mode}: next works from feedback`);
    eq(flow.phase,"question",`${mode}: next returns to question`);
  }
})();

(function saveBoundary() {
  const persistent = Core.createPersistentState({mode:"advanced"});
  Core.recordCorrect(persistent,"example","error",1);
  const raw = Core.serializePersistent(persistent);
  const loaded = Core.parsePersistent(raw);
  eq(loaded.mode,"advanced","mode persists");
  eq(loaded.mastery.example.errorForm,1,"mastery persists");
  const flow = Core.createFlowState();
  eq(flow.phase,"idle","session flow is not part of persistent save");
})();

console.log(`PASS: ${checks} state/mastery checks`);
