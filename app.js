(() => {
  const APP_VERSION = "0.3.0";
  const SAVE_KEY = "orthomancerSave:v3";
  const LEGACY_SAVE_KEYS = ["orthomancerSave:v2"];
  const Core = window.OrthomancerCore;

  const state = {
    persistent: null,
    session: Core.createSessionState(),
    flow: Core.createFlowState()
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function loadPersistent() {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      for (const key of LEGACY_SAVE_KEYS) {
        raw = localStorage.getItem(key);
        if (raw) break;
      }
    }
    state.persistent = Core.parsePersistent(raw);
  }

  function savePersistent() {
    localStorage.setItem(SAVE_KEY, Core.serializePersistent(state.persistent));
  }

  function updateStats() {
    const summary = Core.stageSummary(SPELLING_WORDS, state.persistent);
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

  function updateModeButtons() {
    const mode = state.persistent.mode;
    els.modeStandard.classList.toggle("active", mode === "standard");
    els.modeAdvanced.classList.toggle("active", mode === "advanced");
  }

  function updatePrompt() {
    if (state.flow.phase === "word-selection") {
      els.prompt.textContent = "Now click the word you believe is spelled incorrectly.";
      return;
    }
    if (state.flow.phase === "question") {
      els.prompt.textContent = state.persistent.mode === "advanced"
        ? "Which fragment is corrupted? If you choose A–C, identify the word."
        : "Which fragment contains a spelling error?";
    }
  }

  function setMode(mode) {
    if (!Core.setMode(state.persistent, mode)) return;
    updateModeButtons();
    updatePrompt();
    savePersistent();
  }

  function renderQuestion() {
    const q = state.flow.question;
    if (!q) return;

    els.feedback.className = "feedback hidden";
    els.feedback.innerHTML = "";
    els.nextButton.classList.add("hidden");
    els.sentences.innerHTML = "";

    q.sentences.forEach((sentence, index) => {
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

    updatePrompt();
    updateStats();
  }

  function startQuestion() {
    if (state.flow.phase === "idle") {
      Core.startQuestion(state.flow, SPELLING_WORDS, state.persistent);
    } else if (state.flow.phase === "feedback") {
      Core.nextQuestion(state.flow, SPELLING_WORDS, state.persistent);
    } else {
      return;
    }
    renderQuestion();
  }

  function chooseSentence(index) {
    const result = Core.chooseSentence(state.flow, state.persistent, state.session, index);
    if (!result.accepted) return;

    if (result.pendingWord) {
      renderWordPicker(index);
      return;
    }

    savePersistent();
    renderFeedback();
  }

  function renderWordPicker(index) {
    const buttons = [...els.sentences.querySelectorAll(".sentence-choice")];
    buttons.forEach((button, i) => {
      if (i !== index) button.disabled = true;
    });

    const selected = buttons[index];
    selected.classList.add("selected");
    const textContainer = selected.querySelector(".sentence-text");
    const sentence = state.flow.question.sentences[index].display;
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

    updatePrompt();
  }

  function chooseWord(token, button) {
    const result = Core.chooseWord(state.flow, state.persistent, state.session, token);
    if (!result.accepted) return;
    button.classList.add(result.correct ? "token-correct" : "token-wrong");
    savePersistent();
    renderFeedback();
  }

  function correctLetter(feedback) {
    return feedback.hasError ? String.fromCharCode(65 + feedback.correctChoice) : "D";
  }

  function renderFeedback() {
    const feedback = state.flow.feedback;
    if (!feedback || state.flow.phase !== "feedback") return;

    [...els.sentences.querySelectorAll(".sentence-choice")].forEach((button) => {
      button.disabled = true;
    });

    let heading;
    let detail;

    if (feedback.correct && !feedback.hasError) {
      heading = "Archive fragment stable.";
      detail = "No corruption detected. All three sentences are spelled correctly.";
    } else if (feedback.hasError) {
      if (feedback.correct) {
        heading = "Corruption repaired.";
        detail = `<strong>${feedback.badWord}</strong> → <strong>${feedback.correctWord}</strong> <span class="mastery-note">${feedback.stage}</span>`;
      } else {
        heading = `The corrupted fragment was ${correctLetter(feedback)}.`;
        detail = `<strong>${feedback.badWord}</strong> should be <strong>${feedback.correctWord}</strong>. <span class="mastery-note">${feedback.stage}</span>`;
      }
    } else {
      heading = "That fragment was clean.";
      detail = "The correct answer was D: there were no spelling mistakes.";
    }

    els.feedback.className = `feedback ${feedback.correct ? "correct" : "wrong"}`;
    els.feedback.innerHTML = `<div class="feedback-heading">${heading}</div><div>${detail}</div>`;
    els.nextButton.classList.remove("hidden");
    els.nextButton.focus();
    updateStats();
  }

  function resetProgress() {
    if (!confirm("Reset all mastery progress for this browser?")) return;
    Core.resetAll(state.persistent, state.session, state.flow);
    savePersistent();
    startQuestion();
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
    els.buildVersion = $("build-version");
    els.corpusStatus = $("corpus-status");

    els.nextButton.addEventListener("click", startQuestion);
    els.modeStandard.addEventListener("click", () => setMode("standard"));
    els.modeAdvanced.addEventListener("click", () => setMode("advanced"));
    $("reset-progress").addEventListener("click", resetProgress);

    document.addEventListener("keydown", (event) => {
      if (state.flow.phase === "feedback" && event.key === "Enter") {
        startQuestion();
        return;
      }
      if (state.flow.phase !== "question") return;
      const key = event.key.toLowerCase();
      const index = { a: 0, b: 1, c: 2, d: 3 }[key];
      if (index !== undefined) chooseSentence(index);
    });
  }

  function init() {
    loadPersistent();
    bind();
    els.buildVersion.textContent = `v${APP_VERSION}`;
    const hsptCount = SPELLING_WORDS.filter((entry) => entry.sources.includes("hspt-core")).length;
    els.corpusStatus.textContent = `${SPELLING_WORDS.length} words loaded · ${hsptCount} HSPT-core`;
    updateModeButtons();
    SPELLING_WORDS.forEach((entry) => Core.masteryFor(state.persistent, entry.word));
    savePersistent();
    startQuestion();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
