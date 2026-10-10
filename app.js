(() => {
  const SAVE_KEY = "orthomancerSave:v1";
  const STAGES = ["New", "Learning", "Familiar", "Mastered"];
  const NO_MISTAKE_RATE = 0.25;

  const state = {
    mode: "standard",
    mastery: {},
    session: { answered: 0, correct: 0, streak: 0 },
    question: null,
    phase: "question",
    selectedSentence: null
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function masteryFor(word) {
    if (!state.mastery[word]) {
      state.mastery[word] = {
        stage: 0,
        correctForm: 0,
        errorForm: 0,
        misses: 0,
        lastSeen: 0
      };
    }
    return state.mastery[word];
  }

  function recalculateStage(record) {
    const total = record.correctForm + record.errorForm;
    let stage = 0;
    if (total >= 1) stage = 1;
    if (total >= 3 && record.correctForm >= 1 && record.errorForm >= 1) stage = 2;
    if (total >= 6 && record.correctForm >= 2 && record.errorForm >= 2) stage = 3;
    record.stage = Math.min(record.stage + 1, stage);
    if (record.stage === 0 && stage > 0) record.stage = stage;
  }

  function recordCorrect(word, evidence) {
    const record = masteryFor(word);
    if (evidence === "correct") record.correctForm += 1;
    if (evidence === "error") record.errorForm += 1;
    record.lastSeen = Date.now();
    recalculateStage(record);
  }

  function recordMiss(word) {
    const record = masteryFor(word);
    record.misses += 1;
    record.lastSeen = Date.now();
    record.stage = Math.max(0, record.stage - 1);
  }

  function weightedPick(pool) {
    const weighted = pool.map((entry) => {
      const record = masteryFor(entry.word);
      const stageWeights = [6, 5, 2.5, 0.8];
      const hsptBoost = entry.sources.includes("hspt-core") ? 3 : 1;
      const missBoost = Math.min(2.5, 1 + record.misses * 0.2);
      return { entry, weight: stageWeights[record.stage] * hsptBoost * missBoost };
    });

    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.entry;
    }
    return weighted[weighted.length - 1].entry;
  }

  function pickThreeTargets() {
    const available = [...SPELLING_WORDS];
    const result = [];
    while (result.length < 3) {
      const picked = weightedPick(available);
      result.push(picked);
      available.splice(available.indexOf(picked), 1);
    }
    return result;
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

  function buildQuestion() {
    const targets = pickThreeTargets();
    const hasError = Math.random() >= NO_MISTAKE_RATE;
    const errorIndex = hasError ? Math.floor(Math.random() * 3) : -1;

    const sentences = targets.map((target, index) => {
      const original = randomItem(target.sentences);
      const isCorrupt = index === errorIndex;
      const misspelling = isCorrupt ? randomItem(target.misspellings) : null;
      const display = isCorrupt
        ? replaceTarget(original, target.word, misspelling)
        : original;
      return { target, original, display, isCorrupt, misspelling };
    });

    return {
      sentences,
      hasError,
      errorIndex,
      correctChoice: hasError ? errorIndex : 3
    };
  }

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!parsed) return;
      if (parsed.mastery && typeof parsed.mastery === "object") state.mastery = parsed.mastery;
      if (parsed.mode === "standard" || parsed.mode === "advanced") state.mode = parsed.mode;
    } catch (error) {
      console.warn("Ignoring unreadable Orthomancer save.", error);
    }
  }

  function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 1,
      mode: state.mode,
      mastery: state.mastery
    }));
  }

  function stageSummary() {
    const counts = [0, 0, 0, 0];
    let totalPoints = 0;
    SPELLING_WORDS.forEach((entry) => {
      const stage = masteryFor(entry.word).stage;
      counts[stage] += 1;
      totalPoints += stage;
    });
    return {
      counts,
      percent: Math.round((totalPoints / (SPELLING_WORDS.length * 3)) * 100)
    };
  }

  function updateStats() {
    const summary = stageSummary();
    const accuracy = state.session.answered
      ? Math.round((state.session.correct / state.session.answered) * 100)
      : 0;
    els.answered.textContent = state.session.answered;
    els.accuracy.textContent = `${accuracy}%`;
    els.streak.textContent = state.session.streak;
    els.mastered.textContent = summary.counts[3];
    els.masteredTotal.textContent = SPELLING_WORDS.length;
    els.restorationPercent.textContent = `${summary.percent}%`;
    els.restorationFill.style.width = `${summary.percent}%`;
  }

  function setMode(mode) {
    state.mode = mode;
    els.modeStandard.classList.toggle("active", mode === "standard");
    els.modeAdvanced.classList.toggle("active", mode === "advanced");
    save();
  }

  function renderQuestion() {
    state.question = buildQuestion();
    state.phase = "question";
    state.selectedSentence = null;
    els.prompt.textContent = state.mode === "advanced"
      ? "Which fragment is corrupted? If you choose A–C, identify the word."
      : "Which fragment contains a spelling error?";
    els.feedback.className = "feedback hidden";
    els.feedback.innerHTML = "";
    els.nextButton.classList.add("hidden");
    els.sentences.innerHTML = "";

    state.question.sentences.forEach((sentence, index) => {
      const button = document.createElement("button");
      button.className = "sentence-choice";
      button.dataset.index = index;
      button.innerHTML = `<span class="choice-letter">${String.fromCharCode(65 + index)}</span><span class="sentence-text"></span>`;
      button.querySelector(".sentence-text").textContent = sentence.display;
      button.addEventListener("click", () => chooseSentence(index));
      els.sentences.appendChild(button);
    });

    const d = document.createElement("button");
    d.className = "sentence-choice no-mistakes";
    d.dataset.index = 3;
    d.innerHTML = `<span class="choice-letter">D</span><span class="sentence-text">There are no spelling mistakes.</span>`;
    d.addEventListener("click", () => chooseSentence(3));
    els.sentences.appendChild(d);

    updateStats();
  }

  function chooseSentence(index) {
    if (state.phase !== "question") return;

    if (state.mode === "advanced" && index < 3) {
      if (index !== state.question.correctChoice) {
        finishAnswer(false, index, null);
        return;
      }
      state.phase = "word";
      state.selectedSentence = index;
      renderWordPicker(index);
      return;
    }

    finishAnswer(index === state.question.correctChoice, index, null);
  }

  function renderWordPicker(index) {
    const buttons = [...els.sentences.querySelectorAll(".sentence-choice")];
    buttons.forEach((button, i) => {
      if (i !== index) button.disabled = true;
    });

    const selected = buttons[index];
    selected.classList.add("selected");
    const textContainer = selected.querySelector(".sentence-text");
    const sentence = state.question.sentences[index].display;
    textContainer.innerHTML = "";

    const tokens = sentence.match(/\S+/g) || [];
    tokens.forEach((token, tokenIndex) => {
      const tokenButton = document.createElement("button");
      tokenButton.type = "button";
      tokenButton.className = "word-token";
      tokenButton.textContent = token;
      tokenButton.addEventListener("click", (event) => {
        event.stopPropagation();
        chooseWord(token, tokenButton);
      });
      textContainer.appendChild(tokenButton);
      if (tokenIndex < tokens.length - 1) textContainer.append(" ");
    });

    els.prompt.textContent = "Now click the word that is spelled incorrectly.";
  }

  function normalizedToken(token) {
    return token.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "");
  }

  function chooseWord(token, button) {
    if (state.phase !== "word") return;
    const sentence = state.question.sentences[state.selectedSentence];
    const correct = normalizedToken(token) === sentence.misspelling.toLowerCase();
    button.classList.add(correct ? "token-correct" : "token-wrong");
    finishAnswer(correct, state.selectedSentence, token);
  }

  function correctLetter() {
    return state.question.hasError
      ? String.fromCharCode(65 + state.question.errorIndex)
      : "D";
  }

  function applyMastery(correct, chosenIndex) {
    const q = state.question;
    if (correct) {
      if (q.hasError) {
        recordCorrect(q.sentences[q.errorIndex].target.word, "error");
      } else {
        q.sentences.forEach((sentence) => recordCorrect(sentence.target.word, "correct"));
      }
      return;
    }

    if (q.hasError) {
      recordMiss(q.sentences[q.errorIndex].target.word);
    } else if (chosenIndex >= 0 && chosenIndex < 3) {
      recordMiss(q.sentences[chosenIndex].target.word);
    }
  }

  function finishAnswer(correct, chosenIndex, chosenWord) {
    state.phase = "feedback";
    state.session.answered += 1;
    if (correct) {
      state.session.correct += 1;
      state.session.streak += 1;
    } else {
      state.session.streak = 0;
    }

    applyMastery(correct, chosenIndex);
    save();

    [...els.sentences.querySelectorAll(".sentence-choice")].forEach((button) => {
      button.disabled = true;
    });

    const q = state.question;
    let heading;
    let detail;

    if (correct && !q.hasError) {
      heading = "Archive fragment stable.";
      detail = "No corruption detected. All three sentences are spelled correctly.";
    } else if (q.hasError) {
      const bad = q.sentences[q.errorIndex];
      const stage = STAGES[masteryFor(bad.target.word).stage];
      if (correct) {
        heading = "Corruption repaired.";
        detail = `<strong>${bad.misspelling}</strong> → <strong>${bad.target.word}</strong> <span class="mastery-note">${stage}</span>`;
      } else {
        heading = `The corrupted fragment was ${correctLetter()}.`;
        detail = `<strong>${bad.misspelling}</strong> should be <strong>${bad.target.word}</strong>. <span class="mastery-note">${stage}</span>`;
      }
    } else {
      heading = "That fragment was clean.";
      detail = "The correct answer was D: there were no spelling mistakes.";
    }

    els.feedback.className = `feedback ${correct ? "correct" : "wrong"}`;
    els.feedback.innerHTML = `<div class="feedback-heading">${heading}</div><div>${detail}</div>`;
    els.nextButton.classList.remove("hidden");
    els.nextButton.focus();
    updateStats();
  }

  function resetProgress() {
    if (!confirm("Reset all mastery progress for this browser?")) return;
    state.mastery = {};
    state.session = { answered: 0, correct: 0, streak: 0 };
    save();
    renderQuestion();
  }

  function bind() {
    els.sentences = $("sentences");
    els.prompt = $("prompt");
    els.feedback = $("feedback");
    els.nextButton = $("next-button");
    els.modeStandard = $("mode-standard");
    els.modeAdvanced = $("mode-advanced");
    els.answered = $("answered");
    els.accuracy = $("accuracy");
    els.streak = $("streak");
    els.mastered = $("mastered");
    els.masteredTotal = $("mastered-total");
    els.restorationPercent = $("restoration-percent");
    els.restorationFill = $("restoration-fill");

    els.nextButton.addEventListener("click", renderQuestion);
    els.modeStandard.addEventListener("click", () => {
      setMode("standard");
      renderQuestion();
    });
    els.modeAdvanced.addEventListener("click", () => {
      setMode("advanced");
      renderQuestion();
    });
    $("reset-progress").addEventListener("click", resetProgress);

    document.addEventListener("keydown", (event) => {
      if (state.phase === "feedback" && event.key === "Enter") {
        renderQuestion();
        return;
      }
      if (state.phase !== "question") return;
      const key = event.key.toLowerCase();
      const index = { a: 0, b: 1, c: 2, d: 3 }[key];
      if (index !== undefined) chooseSentence(index);
    });
  }

  function init() {
    load();
    bind();
    setMode(state.mode);
    SPELLING_WORDS.forEach((entry) => masteryFor(entry.word));
    renderQuestion();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
