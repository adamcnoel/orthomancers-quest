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

The move from the 30-word mechanics prototype to the real HSPT corpus intentionally bumped the local save key to `orthomancerSave:v2`, so prototype mastery does not carry into the actual study set.

## Corpus validation

Run:

```bash
node tools/validate-corpus.js
```

The validator checks for duplicate target words, missing or duplicate misspellings, sentences that do not contain the target word, duplicate sentences, accidental use of a misspelled form in a correct sentence, source-tag problems, and missing HSPT entries.

Content quality still requires human review: a validator can confirm structural correctness, but not whether every distractor is genuinely plausible or every sentence sounds natural. The current HSPT corpus should therefore be treated as a strong first pass pending play-through review and targeted cleanup of any questionable entries.

## Mastery

The game uses the same general adaptive-learning idea as Etymancer's Quest:

**New → Learning → Familiar → Mastered**

The prototype tracks two distinct kinds of evidence for each word:

- recognizing a plausible misspelling as wrong
- recognizing the correctly spelled form as correct, especially through "No mistakes" questions

A word cannot advance to the higher mastery stages from only one kind of evidence. Lower-mastery and previously missed words receive more question weight. HSPT-core records also receive the strongest source weighting.

Progress and the selected mode are stored in browser `localStorage`.

## Running it

No build step or server-side application is required. Serve the repository with any simple static web server. To avoid localhost cache/PWA collisions with Etymancer's Quest, use a different port for Orthomancer during local development, for example:

```bash
python3 -m http.server 8001
```

Then open `http://localhost:8001`.

The app is plain HTML/CSS/JavaScript and is intended for eventual GitHub Pages deployment and PWA installation.

## Current files

- `index.html` — prototype UI
- `style.css` — Corrupted Archive visual treatment
- `app.js` — question generation, Standard/Advanced interaction, mastery, adaptive weighting, and local persistence
- `words.js` — 140-word HSPT core corpus
- `data/hspt-source.txt` — canonical transcription of the supplied HSPT word list
- `tools/validate-corpus.js` — structural corpus validator

## Status

**First playable prototype is implemented and now uses the actual HSPT core list.**

Immediate next priorities are content review/cleanup, evaluating the mastery scheduler against the larger corpus, deciding whether the no-mistake rate feels right in real use, and then expanding with supplemental high-value spelling material. Archive rooms and the retro-terminal visual refinement remain deliberately separate backlog items rather than blocking mechanics work.
