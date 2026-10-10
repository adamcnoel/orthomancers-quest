(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.OrthomancerCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STAGES = ["New", "Learning", "Familiar", "Mastered"];
  const NO_MISTAKE_RATE = 0.25;

  function createSeededRng(seed = 1) {
    let value = (seed >>> 0) || 1;
    return function rng() {
      value = (value + 0x6D2B79F5) >>> 0;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function blankMastery() {
    return { stage: 0, correctForm: 0, errorForm: 0, misses: 0, lastSeen: 0 };
  }

  function createPersistentState(saved = null) {
    const mode = saved?.mode === "advanced" ? "advanced" : "standard";
    return {
      mode,
      mastery: saved?.mastery && typeof saved.mastery === "object" ? structuredCloneSafe(saved.mastery) : {}
    };
  }

  function createSessionState() {
    return { answered: 0, correct: 0, streak: 0 };
  }

  function createFlowState() {
    return { phase: "idle", question: null, selectedSentence: null, selectedWord: null, feedback: null };
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function masteryFor(persistent, word) {
    if (!persistent.mastery[word]) persistent.mastery[word] = blankMastery();
    return persistent.mastery[word];
  }

  function recalculateStage(record) {
    const total = record.correctForm + record.errorForm;
    let targetStage = 0;
    if (total >= 1) targetStage = 1;
    if (total >= 3 && record.correctForm >= 1 && record.errorForm >= 1) targetStage = 2;
    if (total >= 6 && record.correctForm >= 2 && record.errorForm >= 2) targetStage = 3;
    record.stage = Math.min(record.stage + 1, targetStage);
    if (record.stage === 0 && targetStage > 0) record.stage = targetStage;
    return record.stage;
  }

  function recordCorrect(persistent, word, evidence, now = Date.now()) {
    const record = masteryFor(persistent, word);
    if (evidence === "correct") record.correctForm += 1;
    if (evidence === "error") record.errorForm += 1;
    record.lastSeen = now;
    recalculateStage(record);
    return record;
  }

  function recordMiss(persistent, word, now = Date.now()) {
    const record = masteryFor(persistent, word);
    record.misses += 1;
    record.lastSeen = now;
    record.stage = Math.max(0, record.stage - 1);
    return record;
  }

  function weightedPick(pool, persistent, rng) {
    const weighted = pool.map((entry) => {
      const record = masteryFor(persistent, entry.word);
      const stageWeights = [6, 5, 2.5, 0.8];
      const hsptBoost = entry.sources.includes("hspt-core") ? 3 : 1;
      const missBoost = Math.min(2.5, 1 + record.misses * 0.2);
      return { entry, weight: stageWeights[record.stage] * hsptBoost * missBoost };
    });
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = rng() * total;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.entry;
    }
    return weighted[weighted.length - 1].entry;
  }

  function pickThreeTargets(words, persistent, rng) {
    const available = [...words];
    const result = [];
    while (result.length < 3) {
      const picked = weightedPick(available, persistent, rng);
      result.push(picked);
      available.splice(available.indexOf(picked), 1);
    }
    return result;
  }

  function randomItem(items, rng) {
    return items[Math.floor(rng() * items.length)];
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function replaceTarget(sentence, correctWord, replacement) {
    const pattern = new RegExp(`\\b${escapeRegex(correctWord)}\\b`, "i");
    return sentence.replace(pattern, (matched) => {
      if (matched[0] === matched[0].toUpperCase()) {
        return replacement[0].toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  function buildQuestion(words, persistent, rng = Math.random, options = {}) {
    const noMistakeRate = options.noMistakeRate ?? NO_MISTAKE_RATE;
    const targets = pickThreeTargets(words, persistent, rng);
    const hasError = rng() >= noMistakeRate;
    const errorIndex = hasError ? Math.floor(rng() * 3) : -1;
    const sentences = targets.map((target, index) => {
      const original = randomItem(target.sentences, rng);
      const isCorrupt = index === errorIndex;
      const misspelling = isCorrupt ? randomItem(target.misspellings, rng) : null;
      const display = isCorrupt ? replaceTarget(original, target.word, misspelling) : original;
      return { target, original, display, isCorrupt, misspelling };
    });
    return {
      id: `q-${Math.floor(rng() * 1e9)}`,
      sentences,
      hasError,
      errorIndex,
      correctChoice: hasError ? errorIndex : 3,
      scored: false
    };
  }

  function startQuestion(flow, words, persistent, rng = Math.random, options = {}) {
    if (flow.phase !== "idle" && flow.phase !== "feedback") return false;
    flow.phase = "question";
    flow.question = buildQuestion(words, persistent, rng, options);
    flow.selectedSentence = null;
    flow.selectedWord = null;
    flow.feedback = null;
    return true;
  }

  function setMode(persistent, mode) {
    if (mode !== "standard" && mode !== "advanced") return false;
    persistent.mode = mode;
    return true;
  }

  function chooseSentence(flow, persistent, session, index, now = Date.now()) {
    if (flow.phase !== "question" || !flow.question || flow.question.scored) return { accepted: false };
    if (![0,1,2,3].includes(index)) return { accepted: false };
    if (persistent.mode === "advanced" && index < 3) {
      flow.phase = "word-selection";
      flow.selectedSentence = index;
      return { accepted: true, pendingWord: true };
    }
    return scoreAnswer(flow, persistent, session, index === flow.question.correctChoice, index, null, now);
  }

  function normalizeToken(token) {
    return String(token).toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
  }

  function chooseWord(flow, persistent, session, token, now = Date.now()) {
    if (flow.phase !== "word-selection" || !flow.question || flow.question.scored) return { accepted: false };
    const selectedIndex = flow.selectedSentence;
    const selected = flow.question.sentences[selectedIndex];
    const isCorrectSentence = selectedIndex === flow.question.correctChoice;
    const isCorrectWord = selected.misspelling
      ? normalizeToken(token) === selected.misspelling.toLowerCase()
      : false;
    flow.selectedWord = token;
    return scoreAnswer(flow, persistent, session, isCorrectSentence && isCorrectWord, selectedIndex, token, now);
  }

  function applyMastery(flow, persistent, correct, chosenIndex, now) {
    const q = flow.question;
    if (correct) {
      if (q.hasError) recordCorrect(persistent, q.sentences[q.errorIndex].target.word, "error", now);
      else q.sentences.forEach((sentence) => recordCorrect(persistent, sentence.target.word, "correct", now));
      return;
    }
    if (q.hasError) recordMiss(persistent, q.sentences[q.errorIndex].target.word, now);
    else if (chosenIndex >= 0 && chosenIndex < 3) recordMiss(persistent, q.sentences[chosenIndex].target.word, now);
  }

  function scoreAnswer(flow, persistent, session, correct, chosenIndex, chosenWord, now) {
    const q = flow.question;
    if (!q || q.scored) return { accepted: false };
    q.scored = true;
    session.answered += 1;
    if (correct) {
      session.correct += 1;
      session.streak += 1;
    } else {
      session.streak = 0;
    }
    applyMastery(flow, persistent, correct, chosenIndex, now);
    const bad = q.hasError ? q.sentences[q.errorIndex] : null;
    flow.phase = "feedback";
    flow.feedback = {
      correct,
      chosenIndex,
      chosenWord,
      correctChoice: q.correctChoice,
      hasError: q.hasError,
      badWord: bad?.misspelling || null,
      correctWord: bad?.target.word || null,
      stage: bad ? STAGES[masteryFor(persistent, bad.target.word).stage] : null
    };
    return { accepted: true, scored: true, correct, feedback: flow.feedback };
  }

  function nextQuestion(flow, words, persistent, rng = Math.random, options = {}) {
    if (flow.phase !== "feedback") return false;
    return startQuestion(flow, words, persistent, rng, options);
  }

  function resetAll(persistent, session, flow) {
    persistent.mastery = {};
    session.answered = 0;
    session.correct = 0;
    session.streak = 0;
    flow.phase = "idle";
    flow.question = null;
    flow.selectedSentence = null;
    flow.selectedWord = null;
    flow.feedback = null;
  }

  function stageSummary(words, persistent) {
    const counts = [0,0,0,0];
    let totalPoints = 0;
    words.forEach((entry) => {
      const stage = masteryFor(persistent, entry.word).stage;
      counts[stage] += 1;
      totalPoints += stage;
    });
    return { counts, percent: Math.round((totalPoints / (words.length * 3)) * 100) };
  }

  function serializePersistent(persistent) {
    return JSON.stringify({ version: 3, mode: persistent.mode, mastery: persistent.mastery });
  }

  function parsePersistent(raw) {
    if (!raw) return createPersistentState();
    try {
      const parsed = JSON.parse(raw);
      return createPersistentState(parsed);
    } catch {
      return createPersistentState();
    }
  }

  return {
    STAGES,
    NO_MISTAKE_RATE,
    createSeededRng,
    createPersistentState,
    createSessionState,
    createFlowState,
    masteryFor,
    recalculateStage,
    recordCorrect,
    recordMiss,
    buildQuestion,
    startQuestion,
    setMode,
    chooseSentence,
    chooseWord,
    nextQuestion,
    resetAll,
    stageSummary,
    serializePersistent,
    parsePersistent,
    normalizeToken
  };
});
