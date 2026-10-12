# HSPT corpus quality review — issue #32

## Scope

All 140 HSPT-core records were reviewed against the gameplay quality criteria: at least two natural sentence variants, at least one realistic misspelling, no second apparent spelling error, no valid alternate English word used as a fake misspelling, and safe target replacement for Standard and Advanced modes.

The original transcription in `data/hspt-source.txt` remains unchanged. Playable corrections are isolated in `corpus-curation.js`, which is loaded immediately after `words.js`.

## Misspelling research method

The review did not require every word to have the same number of distractors. The rule is: at least one high-confidence realistic misspelling; add more only when they remain plausible.

Sources used to judge or replace distractors:

- PlainSpell's October 2026 measured-misspelling data, which combines published wrong spellings from Wiktionary, Wikipedia common-misspelling lists, and codespell, then measures U.S. Bing search frequency. This was the strongest signal when a corpus word had a measured form.
- PlainSpell/Wiktionary spelling-variant pages for less common words where search measurements are unavailable; these were treated as plausibility evidence, not proof that every generated variant is common.
- The documented Wikipedia list of commonly misspelled English words as a secondary cross-check for classic traps such as accommodate, aggressive, arctic, beginning, humorous, jewelry, judgment, library, license, miniature, mischievous, necessary, noticeable, occasion, receive, receipt, sergeant, tyranny, and weird.
- Oxford Learner's Dictionaries as a dictionary cross-check; for example, Oxford explicitly identifies `accomodate` as a very common misspelling of `accommodate`.

When a source had no measured misspelling for a word, the existing distractor was kept only if it represented a recognizable spelling process (missing/doubled consonant, vowel substitution, transposition, dropped silent letter, or suffix error) and did not create a valid alternate word.

## Findings

The corpus was already substantially usable: all 140 records had at least two sentences and at least one distractor, and many existing variants line up with measured high-frequency errors. Examples include `acess` for **access**, `accomodate` for **accommodate**, `calculater` for **calculator**, `reciept` for **receipt**, `refridgerator` for **refrigerator**, and `wierd` for **weird**.

The main weakness was a small set of distractors that looked generated rather than student-like (extra trailing letters, triple consonants, etc.). Two distractors were more serious because they were valid English words rather than misspellings: `complement` under **compliment** and `preformed` under **performed**. Those were removed.

## Changes

21 records received playable-data overrides.

Misspelling cleanup:
- **accuracy**: kept the measured `acuracy`; removed the synthetic-looking second form.
- **adjective**: replaced trailing-letter noise with `adjetive` / `adjectve`.
- **aerobic**: replaced `aerobik` with the more plausible transposition `areobic`.
- **aggressive**: replaced triple-s noise with `aggresive`; retained `agressive`.
- **ambiguous**: replaced trailing-s noise with `ambigious`; retained `ambigous`.
- **acquit**: reduced to the straightforward `aquit`.
- **compliment**: removed valid-word `complement`; now uses nonword spelling errors only.
- **concerned**: replaced doubled/trailing-letter forms with measured `concered` and `conserned`.
- **critique**: removed trailing-e noise; retained `critque`.
- **deficit**: retained measured `defecit`; removed triple-t noise.
- **hatched**: replaced trailing-d noise with `hatchd`.
- **insatiable**: uses `insataible` and `insatiabel`, both represented in spelling-variant research.
- **minimizing**: removed trailing-g noise; uses `minimizeing` / `minimzing`.
- **novelist**: replaced trailing-t noise with `novellist` / `novalist`.
- **performed**: removed valid-word `preformed`; uses `performmed` / `perfomed`.
- **perturbed**: uses `perterbed` / `peturbed` rather than a clipped ending.
- **possessive**: replaced triple-s noise with measured `possesive`; retained `posessive`.
- **radioactive**: replaced clipped `radioactiv` with measured `radiactive`; retained `radioacive`.
- **recite**: retained plausible `reciete` / `resite`.
- **testimony**: replaced trailing-y noise with measured `testomony` plus `testamony`.

Sentence cleanup:
- **acquit**: rewrote the second sentence so the legal usage is natural.
- **minimizing**: rewrote the second sentence to avoid the awkward phrase “helps with minimizing”.
- **partial**: rewrote the eclipse sentence to sound natural.

## Judgment calls

A few low-frequency HSPT words do not have a search-measured misspelling in the current data. For those, the game still needs a distractor, so the review uses conservative orthographic errors rather than random keyboard slips. These should be considered plausible instructional distractors, not claims about population-wide misspelling frequency.

Regional or accepted variants are deliberately excluded as wrong answers. In particular, British spellings such as `licence`, `jewellery`, `judgement`, `minimising`, and `neighbourhood` are not used as misspellings.

Per-variant source/confidence metadata would be useful if we later want to distinguish measured/documented forms from inferred instructional distractors inside the data itself; that follow-up is tracked separately in #35.

## Result

- 140/140 HSPT-core records reviewed.
- Every record retains at least 2 sentence variants.
- Every record retains at least 1 plausible misspelling.
- Valid-word distractors identified during review were removed.
- Source transcription remains unchanged.
- Curated corpus is validated by `tools/validate-corpus.js` before CI passes.
