const assert = require("assert");
const Core = require("../game-core.js");

const WORDS = Array.from({length: 140}, (_, i) => ({
  word: "word" + i,
  sources: ["hspt-core"],
  misspellings: ["wrod" + i],
  sentences: ["The word" + i + " appears here.", "Here is word" + i + "."]
}));
const SEEDS = [1, 2, 7, 42, 101, 777, 12345, 424242, 999991, 4294967295];
const SIZES = [3, 4, 5, 6, 7, 8, 9, 10, 12, 40, 140];
let totalQuestions = 0;

function answer(flow, persistent, session) {
  const q = flow.question;
  const first = Core.chooseSentence(flow, persistent, session, q.correctChoice);
  const result = first.pendingWord
    ? Core.chooseWord(flow, persistent, session, q.sentences[q.correctChoice].misspelling)
    : first;
  assert.strictEqual(result.accepted, true, "answer accepted");
  assert.strictEqual(result.correct, true, "answer scored correctly");
}

function run(seed, size, mode, count) {
  const words = WORDS.slice(0, size);
  const persistent = Core.createPersistentState({mode});
  const session = Core.createSessionState();
  const flow = Core.createFlowState();
  const rng = Core.createSeededRng(seed);
  const previous = [];
  const trace = [];
  let relaxed = 0;
  for (let i = 0; i < count; i++) {
    const ok = i === 0
      ? Core.startQuestion(flow, words, persistent, rng)
      : Core.nextQuestion(flow, words, persistent, rng);
    assert.strictEqual(ok, true, "question generated");
    const actual = flow.question.sentences.map(s => s.target.word);
    const chosen = new Set(actual);
    assert.strictEqual(chosen.size, 3, "three distinct words");
    const excluded = new Set();
    // The scheduler should exclude as much recent history as the pool allows.
    let expectedWindow = 0;
    for (let window = Math.min(2, previous.length); window >= 0; window--) {
      const blocked = new Set(previous.slice(-window).flat());
      if (words.filter(word => !blocked.has(word.word)).length >= 3) {
        expectedWindow = window;
        for (const word of blocked) excluded.add(word);
        break;
      }
    }
    if (expectedWindow < Math.min(2, previous.length)) relaxed++;
    for (const word of actual) {
      assert.ok(!excluded.has(word), `seed=${seed} size=${size} q=${i}: premature recent-target repeat ${word}`);
    }
    trace.push(actual.join("|") + ":" + flow.question.correctChoice);
    answer(flow, persistent, session);
    previous.push(actual);
    if (previous.length > 2) previous.shift();
  }
  assert.strictEqual(session.answered, count);
  assert.ok(flow.recentTargets.length <= 2);
  assert.ok(!Core.serializePersistent(persistent).includes("recentTargets"),
    "ephemeral spacing must never enter durable saves");
  totalQuestions += count;
  return {trace, relaxed, flow, session, persistent};
}

// Repeated randomized-looking deterministic paths, both answering modes and all
// constrained pool sizes. Sizes >= 9 must never repeat within the last two questions.
for (const size of SIZES) {
  for (const seed of SEEDS) {
    const iterations = size >= 40 ? 1000 : 120;
    const mode = seed % 2 ? "standard" : "advanced";
    const result = run(seed, size, mode, iterations);
    if (size >= 9) assert.strictEqual(result.relaxed, 0, "large pools never relax cooldown");
    if (size === 3) assert.ok(result.relaxed > 0, "tiny pools must relax cooldown");
  }
}

// Identical initial states and RNG seeds must generate identical playthroughs.
const replay1 = run(54321, 40, "advanced", 150);
const replay2 = run(54321, 40, "advanced", 150);
assert.deepStrictEqual(replay1.trace, replay2.trace, "seeded sequence must be reproducible");
Core.resetAll(replay1.persistent, replay1.session, replay1.flow);
assert.deepStrictEqual(replay1.flow.recentTargets, [], "reset must clear spacing");
assert.strictEqual(replay1.session.answered, 0);
assert.strictEqual(Core.createFlowState().recentTargets.length, 0, "fresh page has no recent history");
assert.throws(() => Core.buildQuestion(WORDS.slice(0,2), Core.createPersistentState(), Core.createSeededRng(1)), RangeError);

console.log(`PASS: recency invariants over ${totalQuestions} seeded questions; ${SIZES.length} pool sizes, ${SEEDS.length} seeds, both modes, deterministic replay and reset`);
