# Orthomancer's Quest

A simple, browser-based spelling study game designed primarily for **High School Placement Test (HSPT)** preparation.

The name **Orthomancer** comes from **orthography** — the conventional spelling system of a language — plus **-mancer**, matching the naming style of [Etymancer's Quest](https://github.com/adamcnoel/etymancers-quest). An Etymancer studies where words come from; an Orthomancer practices the magic of spelling them correctly.

## Theme: the Corrupted Archive

Orthomancer's Quest takes place in the same broad magical world as Etymancer's Quest, but with a different role and game loop.

The player is an **Orthomancer charged with restoring a vast corrupted archive**. Something has damaged the texts: letters have shifted, spellings have decayed, and errors are spreading through manuscripts that must be repaired before the corruption becomes permanent.

Each spelling question represents a fragment of damaged text. Correct answers restore the archive. Mastering words permanently stabilizes portions of the collection and advances the player deeper into the library.

The theme should support the study mechanic rather than obscure it. Sentence reading and spelling recognition remain the center of the game.

### Prototype scope

The first playable version intentionally does **not** implement archive rooms yet. It runs as a continuous study loop:

**question → answer → feedback → next question**

A lightweight **Archive restoration** meter reflects mastery progress. A later version will divide the archive into rooms or wings with explicit restoration targets and a finite completion goal. That progression layer will use the same per-word mastery data rather than replacing the study loop.

## Core idea

Each question shows three natural sentences. One sentence may contain a plausibly misspelled word, or all three may be correct.

The player chooses:

- **A, B, or C** if that sentence contains the spelling error
- **D** if there are **no mistakes**

The misspellings should be realistic, common errors rather than nonsense typos. The vocabulary and sentence quality should be appropriate for roughly high-school-level study, with HSPT-relevant words prioritized above the broader spelling corpus.

## Difficulty modes

### Standard

Choose **A, B, C, or D**. The answer is scored immediately.

### Advanced

Choose **A, B, C, or D**. If A–C is selected, the player must then click the specific word they believe is misspelled. Both the sentence and the word must be correct.

A future harder mode may require choosing or entering the correct spelling after identifying the error.

## HSPT core corpus

The user-supplied HSPT spelling list is now the primary curriculum.

The current corpus contains **140 HSPT-core words**, transcribed from the supplied study-guide screenshots. Each record currently has:

- the correct spelling
- one or more curated plausible misspellings
- at least two natural example sentences
- the source tag `hspt-core`

That currently works out to **280 sentence variants** and **274 curated misspelling variants** across the 140 words.

The original transcription is preserved in `data/hspt-source.txt` so the canonical source list can be compared against the playable corpus.

Supplemental material can later come from broader lists of commonly misspelled English words and other suitable spelling resources, but HSPT-core material remains the highest priority.

Words are stored as reusable content records in `words.js`. Questions are generated dynamically from those records rather than authored as fixed A/B/C/D question blocks.

## Corpus validation

Run:

```bash
node tools/validate-corpus.js
```

The validator checks for duplicate target words, missing or duplicate misspellings, sentences that do not contain the target word, duplicate sentences, accidental use of a misspelled form in a correct sentence, source-tag problems, and missing HSPT entries.

Content quality still requires human review: a validator can confirm structural correctness, but not whether every distractor is genuinely plausible or every sentence sounds natural. The current HSPT corpus should therefore be treated as a strong first pass pending play-through review and targeted cleanup of any questionable entries.

## State model

The game deliberately separates three kinds of state:

- **Persistent state** — word mastery plus durable preferences such as Standard/Advanced mode. This is what is written to `localStorage`.
- **Session state** — answered count, session accuracy, and streak. This resets when the page session starts over.
- **Flow state** — the active question and logical phase (`idle`, `question`, `word-selection`, or `feedback`), plus the current selection/feedback payload. This is intentionally not persisted.

`game-core.js` owns question generation, mastery, scoring, save parsing/serialization, and state transitions. `app.js` is primarily DOM rendering and event wiring. The rendered DOM is not treated as resumable application state.

The current save key is `orthomancerSave:v3`. Existing `v2` mastery is read and migrated forward automatically, so the state refactor does not intentionally wipe current HSPT progress.

Cold-start/resume behavior is being tracked separately until the equivalent Etymancer's Quest work is finalized; Orthomancer should reuse that settled pattern rather than inventing a competing one.

## Mastery

The game uses the same general adaptive-learning idea as Etymancer's Quest:

**New → Learning → Familiar → Mastered**

The current scheduler tracks two distinct kinds of evidence for each word:

- recognizing a plausible misspelling as wrong
- recognizing the correctly spelled form as correct, especially through "No mistakes" questions

A word cannot become Mastered from only one kind of evidence. Lower-mastery and previously missed words receive more question weight. Mastered words remain eligible for occasional review.

## Testing and playthrough validation

Run the deterministic state/mastery tests and simulated long-run playthrough with:

```bash
node tests/run.js
```

The test suite covers seeded question generation, Standard/Advanced transitions, duplicate-action protection, mode switching without replacing a question, mastery progression/demotion, persistence boundaries, and save parsing.

The playthrough validator runs thousands of generated questions against the real corpus. It checks broad HSPT exposure, approximate D-question frequency, mastery progression, mixed-accuracy behavior, increased exposure for a repeatedly missed target, and the rule that one-sided evidence cannot produce Mastered status. The script prints aggregate statistics so scheduler changes can be evaluated rather than accepted on pass/fail alone.

CI runs both:

```bash
node tools/validate-corpus.js
node tests/run.js
```

## Running it

No build step or server-side application is required. Serve the repository with any simple static web server. To avoid localhost cache/PWA collisions with Etymancer's Quest, use a different port for Orthomancer during local development, for example:

```bash
python3 -m http.server 8001
```

Then open `http://localhost:8001`.

The app is plain HTML/CSS/JavaScript and is intended for eventual GitHub Pages deployment and PWA installation.

## Current files

- `index.html` — prototype UI and versioned asset loading
- `style.css` — Corrupted Archive visual treatment
- `app.js` — DOM rendering and browser interaction
- `game-core.js` — deterministic question/mastery/state engine shared by browser and tests
- `words.js` — 140-word HSPT core corpus
- `data/hspt-source.txt` — canonical transcription of the supplied HSPT word list
- `tools/validate-corpus.js` — structural corpus validator
- `tests/core-state.js` — deterministic state/mastery regression tests
- `tests/playthrough.js` — long-run scheduler/playthrough validation
- `tests/run.js` — simple local test runner

## Status

**First playable prototype is implemented and now uses the actual HSPT core list.**

Current mechanics work is focused on making state transitions and scheduler behavior deterministic and testable before adding more progression or navigation. Archive rooms, supplemental corpus growth, and the retro-terminal visual refinement remain separate backlog items rather than blocking that foundation.
