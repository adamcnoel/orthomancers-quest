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
const TROUBLE = new Set(WORDS.slice(0, 12).map(w => w.word));
const SEEDS = [1101, 2202, 3303];
const HORIZON = 5000;
const TROUBLE_PHASE_END = 1000;
const LATE_WINDOW_START = 3001;

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function answer(flow, persistent, session, correct) {
  const q = flow.question;
  if (correct) {
    if (q.correctChoice === 3) return Core.chooseSentence(flow, persistent, session, 3);
    const first = Core.chooseSentence(flow, persistent, session, q.correctChoice);
    if (first.pendingWord) return Core.chooseWord(flow, persistent, session, q.sentences[q.correctChoice].misspelling);
    return first;
  }
  const wrongIndex = q.correctChoice === 0 ? 1 : 0;
  const first = Core.chooseSentence(flow, persistent, session, wrongIndex);
  if (first.pendingWord) return Core.chooseWord(flow, persistent, session, "not-the-target");
  return first;
}

function run(seed) {
  const rng = Core.createSeededRng(seed);
  const persistent = Core.createPersistentState();
  const session = Core.createSessionState();
  const flow = Core.createFlowState();
  const total = new Map(WORDS.map(w => [w.word, 0]));
  const late = new Map(WORDS.map(w => [w.word, 0]));

  Core.startQuestion(flow, WORDS, persistent, rng);
  for (let i = 1; i <= HORIZON; i++) {
    const q = flow.question;
    q.sentences.forEach(s => {
      total.set(s.target.word, total.get(s.target.word) + 1);
      if (i >= LATE_WINDOW_START) late.set(s.target.word, late.get(s.target.word) + 1);
    });

    const corrupted = q.hasError ? q.sentences[q.errorIndex].target.word : null;
    let p = 0.98;
    if (i <= TROUBLE_PHASE_END && corrupted && TROUBLE.has(corrupted)) p = 0.45;
    const result = answer(flow, persistent, session, rng() < p);
    assert.ok(result.accepted, `answer rejected seed=${seed} q=${i}`);
    if (i < HORIZON) Core.nextQuestion(flow, WORDS, persistent, rng);
  }

  const troubleLate = [...TROUBLE].map(w => late.get(w));
  const otherLate = WORDS.filter(w => !TROUBLE.has(w.word)).map(w => late.get(w.word));
  const troubleTotal = [...TROUBLE].map(w => total.get(w));
  const otherTotal = WORDS.filter(w => !TROUBLE.has(w.word)).map(w => total.get(w.word));
  const troubleRecords = [...TROUBLE].map(w => Core.masteryFor(persistent, w));

  return {
    seed,
    accuracy: session.correct / session.answered,
    totalRatio: mean(troubleTotal) / mean(otherTotal),
    lateRatio: mean(troubleLate) / mean(otherLate),
    avgTroubleMisses: mean(troubleRecords.map(r => r.misses)),
    avgReviewDebt: mean(troubleRecords.map(r => r.reviewDebt)),
    masteredTrouble: troubleRecords.filter(r => r.stage === 3).length
  };
}

const results = SEEDS.map(run);
console.log("RECOVERED-TROUBLE REGRESSION (#5)");
console.log(`First ${TROUBLE_PHASE_END} questions: designated trouble words answer at 45% when corrupted; afterward learner is 98% accurate.`);
console.log(`Late exposure window: questions ${LATE_WINDOW_START}-${HORIZON}.`);
for (const r of results) {
  console.log(`  seed ${r.seed}: acc=${(r.accuracy*100).toFixed(1)}% totalTroubleRatio=${r.totalRatio.toFixed(2)} lateTroubleRatio=${r.lateRatio.toFixed(2)} avgHistoricalMisses=${r.avgTroubleMisses.toFixed(1)} avgReviewDebt=${r.avgReviewDebt.toFixed(2)} masteredTrouble=${r.masteredTrouble}/${TROUBLE.size}`);
  assert.strictEqual(r.masteredTrouble, TROUBLE.size, `seed ${r.seed}: recovered trouble words should all be Mastered`);
  assert.ok(r.lateRatio <= 1.20, `seed ${r.seed}: recovered words should return close to normal exposure; late ratio=${r.lateRatio.toFixed(2)}`);
  assert.ok(r.avgReviewDebt <= 0.10, `seed ${r.seed}: old trouble debt should substantially clear; avg=${r.avgReviewDebt.toFixed(2)}`);
}
console.log(`  avg late trouble exposure ratio after recovery: ${mean(results.map(r => r.lateRatio)).toFixed(2)}`);
console.log("PASS: historical misses no longer create permanent scheduler weight");
