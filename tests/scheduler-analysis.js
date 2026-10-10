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
const HORIZON = 5000;
const SEEDS = [1101, 2202, 3303];
const TROUBLE = new Set(WORDS.slice(0, 12).map(w => w.word));

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b) => a-b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}

function mean(values) {
  return values.length ? values.reduce((a,b) => a+b, 0) / values.length : null;
}

function answerCorrect(flow, persistent, session) {
  const q = flow.question;
  if (q.correctChoice === 3) return Core.chooseSentence(flow, persistent, session, 3);
  const first = Core.chooseSentence(flow, persistent, session, q.correctChoice);
  if (first.pendingWord) return Core.chooseWord(flow, persistent, session, q.sentences[q.correctChoice].misspelling);
  return first;
}

function answerWrong(flow, persistent, session) {
  const q = flow.question;
  const wrongIndex = q.correctChoice === 0 ? 1 : 0;
  const first = Core.chooseSentence(flow, persistent, session, wrongIndex);
  if (first.pendingWord) return Core.chooseWord(flow, persistent, session, "definitely-not-the-word");
  return first;
}

const profiles = {
  nearPerfect: {
    label: "Near-perfect (97%)",
    probability({rng}) { return 0.97; }
  },
  solid: {
    label: "Solid (82%)",
    probability({rng}) { return 0.82; }
  },
  variable: {
    label: "Variable accuracy",
    probability({questionIndex}) {
      const block = Math.floor((questionIndex - 1) / 500) % 3;
      return [0.95, 0.70, 0.85][block];
    }
  },
  persistentTrouble: {
    label: "Persistent trouble set",
    probability({question}) {
      if (question.hasError && TROUBLE.has(question.sentences[question.errorIndex].target.word)) return 0.45;
      return 0.95;
    }
  }
};

function runProfile(profileName, seed) {
  const profile = profiles[profileName];
  const rng = Core.createSeededRng(seed);
  const persistent = Core.createPersistentState({mode: "standard"});
  const session = Core.createSessionState();
  const flow = Core.createFlowState();
  const stats = new Map(WORDS.map(w => [w.word, {
    exposures: 0,
    firstSeen: null,
    lastSeen: null,
    firstRepeatGap: null,
    reached: [null,null,null,null],
    masteredExposureGaps: [],
    lastMasteredExposure: null,
    pendingMissAt: null,
    missRepeatGaps: []
  }]));
  let dCount = 0;

  Core.startQuestion(flow, WORDS, persistent, rng);

  for (let i = 1; i <= HORIZON; i++) {
    const q = flow.question;
    if (q.correctChoice === 3) dCount++;

    for (const sentence of q.sentences) {
      const word = sentence.target.word;
      const s = stats.get(word);
      const stageBefore = Core.masteryFor(persistent, word).stage;
      s.exposures++;
      if (s.firstSeen === null) s.firstSeen = i;
      else if (s.firstRepeatGap === null) s.firstRepeatGap = i - s.firstSeen;
      if (s.pendingMissAt !== null) {
        s.missRepeatGaps.push(i - s.pendingMissAt);
        s.pendingMissAt = null;
      }
      if (stageBefore === 3) {
        if (s.lastMasteredExposure !== null) s.masteredExposureGaps.push(i - s.lastMasteredExposure);
        s.lastMasteredExposure = i;
      }
      s.lastSeen = i;
    }

    const targetWord = q.hasError ? q.sentences[q.errorIndex].target.word : null;
    const p = profile.probability({rng, questionIndex: i, question: q, targetWord});
    const correct = rng() < p;
    const beforeStage = targetWord ? Core.masteryFor(persistent, targetWord).stage : null;
    const result = correct ? answerCorrect(flow, persistent, session) : answerWrong(flow, persistent, session);
    assert.ok(result.accepted, `answer rejected in ${profileName} seed=${seed} q=${i}`);

    if (!correct && targetWord) stats.get(targetWord).pendingMissAt = i;

    // Record first question at which each word enters a mastery stage.
    for (const sentence of q.sentences) {
      const word = sentence.target.word;
      const rec = Core.masteryFor(persistent, word);
      const s = stats.get(word);
      for (let stage = 1; stage <= rec.stage; stage++) {
        if (s.reached[stage] === null) s.reached[stage] = i;
      }
    }

    if (i < HORIZON) {
      const ok = Core.nextQuestion(flow, WORDS, persistent, rng);
      assert.ok(ok, `nextQuestion failed in ${profileName} seed=${seed} q=${i}`);
    }
  }

  const exposureCounts = [...stats.values()].map(s => s.exposures);
  const firstSeen = [...stats.values()].map(s => s.firstSeen).filter(v => v !== null);
  const firstRepeatGaps = [...stats.values()].map(s => s.firstRepeatGap).filter(v => v !== null);
  const missRepeatGaps = [...stats.values()].flatMap(s => s.missRepeatGaps);
  const masteredRepeatGaps = [...stats.values()].flatMap(s => s.masteredExposureGaps);
  const masteredAt = [...stats.values()].map(s => s.reached[3]).filter(v => v !== null);
  const familiarAt = [...stats.values()].map(s => s.reached[2]).filter(v => v !== null);
  const learningAt = [...stats.values()].map(s => s.reached[1]).filter(v => v !== null);
  const records = WORDS.map(w => ({word:w.word, ...Core.masteryFor(persistent,w.word), exposures:stats.get(w.word).exposures}));
  const evidenceCorrect = records.reduce((sum,r) => sum + r.correctForm, 0);
  const evidenceError = records.reduce((sum,r) => sum + r.errorForm, 0);
  const stages = [0,0,0,0];
  records.forEach(r => stages[r.stage]++);
  const allSeenBy = Math.max(...firstSeen);
  const maxExposure = records.reduce((a,b) => b.exposures > a.exposures ? b : a);
  const minExposure = records.reduce((a,b) => b.exposures < a.exposures ? b : a);
  const troubleExp = records.filter(r => TROUBLE.has(r.word)).map(r => r.exposures);
  const normalExp = records.filter(r => !TROUBLE.has(r.word)).map(r => r.exposures);

  return {
    profileName,
    label: profile.label,
    seed,
    accuracy: session.correct/session.answered,
    dRate: dCount/HORIZON,
    allSeenBy,
    stages,
    exposure: {
      min: Math.min(...exposureCounts),
      p50: percentile(exposureCounts,0.50),
      p90: percentile(exposureCounts,0.90),
      p95: percentile(exposureCounts,0.95),
      max: Math.max(...exposureCounts),
      minWord: minExposure.word,
      maxWord: maxExposure.word
    },
    firstRepeat: {p50:percentile(firstRepeatGaps,0.50), p90:percentile(firstRepeatGaps,0.90), max:Math.max(...firstRepeatGaps)},
    missRepeat: {count:missRepeatGaps.length, p50:percentile(missRepeatGaps,0.50), p90:percentile(missRepeatGaps,0.90), max:missRepeatGaps.length ? Math.max(...missRepeatGaps) : null},
    masteredRepeat: {count:masteredRepeatGaps.length, p50:percentile(masteredRepeatGaps,0.50), p90:percentile(masteredRepeatGaps,0.90), max:masteredRepeatGaps.length ? Math.max(...masteredRepeatGaps) : null},
    progression: {
      learningP50: percentile(learningAt,0.50),
      familiarP50: percentile(familiarAt,0.50),
      masteredP50: percentile(masteredAt,0.50),
      masteredP90: percentile(masteredAt,0.90),
      masteredCount: masteredAt.length
    },
    evidence: {correct:evidenceCorrect,error:evidenceError,ratio:evidenceError ? evidenceCorrect/evidenceError : null},
    troubleExposureRatio: mean(normalExp) ? mean(troubleExp)/mean(normalExp) : null,
    records
  };
}

const runs = [];
for (const profileName of Object.keys(profiles)) {
  for (const seed of SEEDS) runs.push(runProfile(profileName, seed));
}

function averageMetric(profileName, getter) {
  const vals = runs.filter(r => r.profileName === profileName).map(getter).filter(v => v !== null && Number.isFinite(v));
  return mean(vals);
}

console.log("SCHEDULER ANALYSIS (#31)");
console.log(`Corpus: ${WORDS.length} HSPT words; horizon=${HORIZON} questions; seeds=${SEEDS.join(",")}`);
console.log("");
for (const profileName of Object.keys(profiles)) {
  console.log(profiles[profileName].label);
  for (const r of runs.filter(x => x.profileName === profileName)) {
    console.log(`  seed ${r.seed}: acc=${(r.accuracy*100).toFixed(1)}% D=${(r.dRate*100).toFixed(1)}% allSeenBy=${r.allSeenBy} exp=${r.exposure.min}/${r.exposure.p50}/${r.exposure.p95}/${r.exposure.max} stages=${r.stages.join("/")} missGap50=${r.missRepeat.p50} masteredGap50=${r.masteredRepeat.p50} masterP50=${r.progression.masteredP50}`);
  }
  console.log(`  avg: allSeenBy=${averageMetric(profileName,r=>r.allSeenBy).toFixed(1)} D=${(averageMetric(profileName,r=>r.dRate)*100).toFixed(1)}% missGap50=${averageMetric(profileName,r=>r.missRepeat.p50)?.toFixed(1)} masteredGap50=${averageMetric(profileName,r=>r.masteredRepeat.p50)?.toFixed(1)} troubleExposureRatio=${averageMetric(profileName,r=>r.troubleExposureRatio).toFixed(2)}`);
  console.log("");
}

// Guardrails: these are intentionally broad; #31 measures scheduler quality rather than silently tuning it.
for (const r of runs) {
  assert.ok(r.allSeenBy <= 1500, `${r.profileName}/${r.seed}: full HSPT exposure should occur by 1500 questions (actual ${r.allSeenBy})`);
  assert.ok(r.dRate >= 0.22 && r.dRate <= 0.28, `${r.profileName}/${r.seed}: D rate ${(r.dRate*100).toFixed(1)}% outside 22-28%`);
  assert.ok(r.exposure.min > 0, `${r.profileName}/${r.seed}: no word may be starved completely`);
}

const troubleRuns = runs.filter(r => r.profileName === "persistentTrouble");
const weakResurfacesSooner = troubleRuns.every(r => r.missRepeat.p50 !== null && r.masteredRepeat.p50 !== null && r.missRepeat.p50 < r.masteredRepeat.p50);
console.log(`Diagnostic: trouble-word miss repeat median < mastered-word repeat median in all seeds: ${weakResurfacesSooner ? "YES" : "NO"}`);
console.log(`Diagnostic: persistent trouble set exposure ratio vs other words: ${troubleRuns.map(r => r.troubleExposureRatio.toFixed(2)).join(", ")}`);
console.log("PASS: scheduler analysis completed across 4 learner profiles x 3 seeds");
