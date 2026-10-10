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

## Content strategy

The HSPT word list is the primary curriculum. Supplemental material can come from broader lists of commonly misspelled English words and other suitable spelling resources.

Words are stored as reusable content records with:

- correct spelling
- one or more plausible misspellings
- multiple natural example sentences
- source tags such as `hspt-core` or `common-misspelling`
- optional difficulty and spelling-pattern tags

Questions are generated dynamically from those records rather than authored as fixed A/B/C/D question blocks.

The current playable build contains a **30-word provisional prototype corpus** so the game mechanics can be tested before the user-supplied HSPT list is imported. Those words are deliberately tagged `prototype`, not `hspt-core`.

## Mastery

The game uses the same general adaptive-learning idea as Etymancer's Quest:

**New → Learning → Familiar → Mastered**

The prototype already tracks two distinct kinds of evidence for each word:

- recognizing a plausible misspelling as wrong
- recognizing the correctly spelled form as correct, especially through "No mistakes" questions

A word cannot advance to the higher mastery stages from only one kind of evidence. Lower-mastery and previously missed words receive more question weight. The selection engine also already supports a stronger weighting boost for records tagged `hspt-core`, ready for the HSPT list.

Progress and the selected mode are stored in browser `localStorage`.

## Running it

No build step or server-side application is required. Serve the repository with any simple static web server, for example:

```bash
python3 -m http.server
```

Then open `http://localhost:8000`.

The app is plain HTML/CSS/JavaScript and is intended for eventual GitHub Pages deployment and PWA installation.

## Current files

- `index.html` — prototype UI
- `style.css` — Corrupted Archive visual treatment
- `app.js` — question generation, Standard/Advanced interaction, mastery, adaptive weighting, and local persistence
- `words.js` — provisional 30-word spelling corpus

## Status

**First playable prototype is implemented.**

Immediate next priorities are to import the actual HSPT core list, validate/expand the corpus, test the mastery weighting against real study sessions, and then decide how much game progression to layer on top. Archive rooms are intentionally deferred to the dedicated backlog item rather than blocking the prototype.
