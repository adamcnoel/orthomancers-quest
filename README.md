# Orthomancer's Quest

A simple, browser-based spelling study game designed primarily for **High School Placement Test (HSPT)** preparation.

The name **Orthomancer** comes from **orthography** — the conventional spelling system of a language — plus **-mancer**, matching the naming style of [Etymancer's Quest](https://github.com/adamcnoel/etymancers-quest). An Etymancer studies where words come from; an Orthomancer practices the magic of spelling them correctly.

## Theme: the Corrupted Archive

Orthomancer's Quest takes place in the same broad magical world as Etymancer's Quest, but with a different role and game loop.

The player is an **Orthomancer charged with restoring a vast corrupted archive**. Something has damaged the texts: letters have shifted, spellings have decayed, and errors are spreading through manuscripts that must be repaired before the corruption becomes permanent.

Each spelling question represents a fragment of damaged text. Correct answers restore the archive. Mastering words permanently stabilizes portions of the collection and advances the player deeper into the library.

The theme should support the study mechanic rather than obscure it. Sentence reading and spelling recognition remain the center of the game; progression, streaks, restoration effects, archive rooms, books, and other rewards provide the sense of forward motion.

## Core idea

Each question shows three natural sentences. One sentence may contain a plausibly misspelled word, or all three may be correct.

The player chooses:

- **A, B, or C** if that sentence contains the spelling error
- **D** if there are **no mistakes**

The misspellings should be realistic, common errors rather than nonsense typos. The vocabulary and sentence quality should be appropriate for roughly high-school-level study, with HSPT-relevant words prioritized above the broader spelling corpus.

## Planned difficulty modes

### Standard

Choose **A, B, C, or D**.

### Advanced

Choose **A, B, C, or D**. If A-C is selected, the player must then click the specific word they believe is misspelled.

A future harder mode may require choosing or entering the correct spelling after identifying the error.

## Content strategy

The HSPT word list is the primary curriculum. Supplemental material can come from broader lists of commonly misspelled English words and other suitable spelling resources.

Words should be stored as reusable content records with:

- correct spelling
- one or more plausible misspellings
- multiple natural example sentences
- source tags such as `hspt` or `common-misspelling`
- optional difficulty and spelling-pattern tags

Questions should be generated dynamically from those records rather than authored as fixed A/B/C/D question blocks.

## Mastery

The game should reuse the general adaptive-learning approach from Etymancer's Quest:

**New → Learning → Familiar → Mastered**

HSPT words should be strongly prioritized until they are well learned. The system should separately reinforce both:

- recognizing a plausible misspelling as wrong
- recognizing the correctly spelled form as correct, including in "No mistakes" questions

Within the archive theme, mastery should have visible permanence: a mastered word helps stabilize or restore part of the archive rather than merely increasing a number.

## Technical direction

Like Etymancer's Quest, this should remain deliberately simple:

- static HTML/CSS/JavaScript
- no server-side processing
- no build step if practical
- progress stored locally in the browser
- installable as a PWA
- works well on desktop and mobile

## Status

Design and backlog planning phase. The **Corrupted Archive** theme is selected. The initial prototype will follow after the core mechanics, mastery behavior, content schema, and archive-progression model are defined.
