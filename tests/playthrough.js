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

function answerPerfect(flow, persistent, session) {
  const q = flow.question;
  if (q.correctChoice === 3) return Core.chooseSentence(flow,persistent,session,3);
  const chosen = Core.chooseSentence(flow,persistent,session,q.correctChoice);
  if (chosen.pendingWord) {
    return Core.chooseWord(flow,persistent,session,q.sentences[q.correctChoice].misspelling);
  }
  return chosen;
}

function runScenario({seed, questions, accuracy=1, mode="standard", missWord=null}) {
  const rng = Core.createSeededRng(seed);
  const persistent = Core.createPersistentState({mode});
  const session = Core.createSessionState();
  const flow = Core.createFlowState();
  const exposures = new Map(WORDS.map(w => [w.word,0]));
  let dCount = 0;

  Core.startQuestion(flow, WORDS, persistent, rng);
  for (let i=0;i<questions;i++) {
    const q = flow.question;
    q.sentences.forEach(s => exposures.set(s.target.word, exposures.get(s.target.word)+1));
    if (q.correctChoice === 3) dCount++;

    const forcedTargetCorrupt = missWord && q.hasError && q.sentences[q.errorIndex].target.word === missWord;
    const shouldBeCorrect = !forcedTargetCorrupt && rng() < accuracy;

    if (shouldBeCorrect) {
      answerPerfect(flow,persistent,session);
    } else {
      const wrong = q.correctChoice === 0 ? 1 : 0;
      const first = Core.chooseSentence(flow,persistent,session,wrong);
      if (first.pendingWord) Core.chooseWord(flow,persistent,session,"deliberately-wrong");
    }
    if (i < questions-1) Core.nextQuestion(flow, WORDS, persistent, rng);
  }

  return {persistent,session,exposures,dRate:dCount/questions};
}

const perfect = runScenario({seed:1001,questions:2500,accuracy:1});
const unseen = [...perfect.exposures].filter(([,n]) => n===0);
assert.strictEqual(unseen.length,0,`all words should be exposed; unseen=${unseen.map(x=>x[0]).join(",")}`);
assert.ok(perfect.dRate > 0.20 && perfect.dRate < 0.30,`D rate ${perfect.dRate} should stay near 25%`);
const mastered = WORDS.filter(w => Core.masteryFor(perfect.persistent,w.word).stage===3).length;
assert.ok(mastered > WORDS.length*0.85,`perfect play should master most words; mastered=${mastered}/${WORDS.length}`);

const mixed = runScenario({seed:2002,questions:2500,accuracy:0.82});
assert.ok(mixed.session.correct/mixed.session.answered > 0.70,"mixed scenario should remain playable");
assert.strictEqual([...mixed.exposures].filter(([,n]) => n===0).length,0,"mixed play should still cover every word");

const target = WORDS[0].word;
const baseline = runScenario({seed:3003,questions:1200,accuracy:0.9});
const struggling = runScenario({seed:3003,questions:1200,accuracy:0.9,missWord:target});
assert.ok(struggling.exposures.get(target) > baseline.exposures.get(target), `${target} should surface more when repeatedly missed`);

const oneSided = Core.createPersistentState();
for (let i=0;i<100;i++) Core.recordCorrect(oneSided,target,"error",i);
assert.ok(Core.masteryFor(oneSided,target).stage<3,"one evidence type can never reach Mastered");

console.log("PLAYTHROUGH VALIDATION");
console.log(`  perfect: ${perfect.session.correct}/${perfect.session.answered} correct; ${mastered}/${WORDS.length} mastered; D=${(perfect.dRate*100).toFixed(1)}%`);
console.log(`  mixed:   ${mixed.session.correct}/${mixed.session.answered} correct; D=${(mixed.dRate*100).toFixed(1)}%`);
console.log(`  forced miss target '${target}': baseline exposure=${baseline.exposures.get(target)}, struggling exposure=${struggling.exposures.get(target)}`);
console.log("PASS: deterministic long-run playthrough invariants");
