const assert = require("assert");
const Core = require("../game-core.js");

const words = Array.from({length: 40}, (_, i) => ({
  word: "word" + i,
  sources: ["hspt-core"],
  misspellings: ["wrod" + i],
  sentences: ["The word" + i + " appears here.", "Here is word" + i + "."]
}));
function start(flow, persistent, rng) {
  const ok = flow.phase === "idle"
    ? Core.startQuestion(flow, words, persistent, rng)
    : Core.nextQuestion(flow, words, persistent, rng);
  assert.ok(ok);
  return new Set(flow.question.sentences.map(s => s.target.word));
}
const p = Core.createPersistentState();
const f = Core.createFlowState();
const s = Core.createSessionState();
const rng = Core.createSeededRng(12345);
let last = [];
for (let i = 0; i < 1000; i++) {
  const current = start(f, p, rng);
  for (const prev of last) for (const w of current) assert.ok(!prev.has(w), "repeat within two prior questions: " + w);
  assert.strictEqual(current.size, 3);
  const q = f.question;
  const answer = Core.chooseSentence(f, p, s, q.correctChoice);
  if (answer.pendingWord) Core.chooseWord(f, p, s, q.sentences[q.correctChoice].misspelling);
  last.push(current);
  if (last.length > 2) last.shift();
}
assert.strictEqual(s.answered, 1000);
assert.strictEqual(f.recentTargets.length, 2);
assert.strictEqual(Core.serializePersistent(p).includes("recentTargets"), false, "spacing must stay session-only");
Core.resetAll(p, s, f);
assert.deepStrictEqual(f.recentTargets, [], "reset clears recent history");
assert.strictEqual(s.answered, 0);

// 3-word pools must remain playable, without accidentally selecting duplicates.
for (const size of [3,4,5,6,8]) {
  const tiny = words.slice(0,size);
  const pp = Core.createPersistentState();
  const ff = Core.createFlowState();
  const ss = Core.createSessionState();
  const rr = Core.createSeededRng(size);
  for (let i = 0; i < 80; i++) {
    assert.ok(i === 0 ? Core.startQuestion(ff,tiny,pp,rr) : Core.nextQuestion(ff,tiny,pp,rr));
    assert.strictEqual(new Set(ff.question.sentences.map(x => x.target.word)).size,3);
    const result = Core.chooseSentence(ff,pp,ss,ff.question.correctChoice);
    if (result.pendingWord) Core.chooseWord(ff,pp,ss,ff.question.sentences[ff.question.correctChoice].misspelling);
  }
}
assert.throws(() => Core.buildQuestion(words.slice(0,2),Core.createPersistentState(),Core.createSeededRng(1)),RangeError);
console.log("PASS: recency spacing, deterministic play, fallback, persistence, reset");
