# Scheduler analysis — issue #31

## Scope

The current scheduler was measured without changing any scheduler parameters. Simulations use the full 140-word HSPT corpus, 5,000 questions per run, and three deterministic seeds (`1101`, `2202`, `3303`).

Learner profiles:

1. Near-perfect learner: 97% accuracy.
2. Solid learner: 82% accuracy.
3. Variable learner: alternating 500-question blocks at 95%, 70%, and 85% accuracy.
4. Persistent-trouble learner: 12 designated words answered at 45% accuracy when corrupted; all other questions at 95%.
5. Recovery diagnostic: the same 12 words are difficult only for the first 1,000 questions, then the learner improves to 98% accuracy through question 5,000.

The analysis reports corpus coverage, exposure distribution, no-mistake/D frequency, progression timing, repeat spacing after misses, repeat spacing while mastered, and trouble-word exposure weighting.

## Observed results

### Coverage and D-question rate

All 140 HSPT words were seen very quickly in every run. The slowest full-corpus exposure occurred by question 290, far inside the 1,500-question guardrail.

The configured 25% no-mistake rate was extremely stable: every 5,000-question run landed between 25.0% and 25.2%.

Conclusion: there is no evidence that corpus coverage or the current 25% D-question rate needs tuning.

### Normal learners

Near-perfect learner:
- Full corpus seen by questions 222–290.
- Median per-word exposure after 5,000 questions: 104–106.
- Median miss-to-next-exposure gap: 9–12 questions.
- Median mastered-word repeat gap: 33 questions.
- Median question where a word first reached Mastered: 522–543.
- 139–140 of 140 words were Mastered at the end of each run.

Solid learner (about 82% accuracy):
- Full corpus seen by questions 230–249.
- Median per-word exposure: 102–105.
- Median miss-to-next-exposure gap: 10 questions.
- Median mastered-word repeat gap: 36–38 questions.
- Median first-Mastered point: 605–678.
- 131–136 of 140 words were Mastered at the end of each run.

Variable learner:
- Full corpus seen by questions 222–290.
- Median per-word exposure: 100–102.
- Median miss-to-next-exposure gap: 9–10 questions.
- Median mastered-word repeat gap: 36 questions.
- Median first-Mastered point: 574–595.
- 138–140 of 140 words were Mastered at the end.

Conclusion: the current stage weights and evidence thresholds produce broad coverage, retain mastered words in rotation, and bring misses back materially sooner than mastered items.

### Persistent trouble words

The 12 designated trouble words behaved as intended in one important respect:
- Median miss-to-next-exposure gap: 6–7 questions.
- Median mastered-word repeat gap across the corpus: 34–35 questions.
- Trouble words received 2.38–2.53× the exposure of other words.

This confirms that weak words are resurfacing substantially sooner than stable mastered words without starving the rest of the corpus; all 140 words were still seen by question 248 or earlier in these runs.

The 2.4× exposure multiplier is aggressive, but it is plausible while the words remain genuinely troublesome.

### Recovery diagnostic: historical misses never decay

This revealed the main scheduler weakness.

The 12 designated words were difficult only during questions 1–1,000, then the learner improved to 98% accuracy. By the end, all 12 trouble words were Mastered in every seed.

Despite recovery, during the late window (questions 3,001–5,000) those already-recovered words still received:
- 1.66× normal exposure (seed 1101)
- 1.71× normal exposure (seed 2202)
- 1.77× normal exposure (seed 3303)
- Average: **1.71× normal exposure**

The reason is structural: `missBoost` is based on the lifetime cumulative `record.misses` count. A miss permanently raises future selection weight, even after long-term successful performance and full mastery.

## Recommendation

Keep these parts of the current scheduler unchanged for now:
- 25% no-mistake/D-question rate.
- Stage thresholds for New → Learning → Familiar → Mastered.
- Current stage-selection weights.
- Periodic recurrence of Mastered words.
- Strong short-term prioritization of genuinely weak words.

Change one thing in #5: **replace the permanent cumulative miss boost with a decaying/recent-trouble mechanism.**

Desired behavior for #5:
- A recent miss should still increase review priority enough to produce the current roughly 6–10-question median resurfacing interval.
- Repeated recent misses may increase that priority further, with a cap.
- Correct evidence and/or elapsed successful exposures should reduce the trouble boost.
- Once a word is stable and Mastered, old historical misses should no longer cause a persistent 1.7× exposure penalty.
- Lifetime misses may remain as a statistic, but should not directly determine permanent scheduling weight.

A good implementation could use a separate decaying `reviewDebt` / `recentMisses` value, or a `lastMiss` plus successful-review counter. The exact mechanism should be selected and validated in #5 against these baseline results.

## Done criteria assessment for #31

- 4+ deterministic learner profiles: complete.
- 3 seeds per profile: complete.
- Full HSPT exposure measured: complete; all words seen by question 290 or earlier.
- Missed words resurface sooner than mastered words: complete and confirmed.
- Mastered words continue to recur: complete and confirmed.
- D-question frequency measured: complete; 25.0–25.2%.
- Starvation/overexposure checked: no starvation; intentional persistent-trouble overexposure observed.
- Pathological historical weighting checked: issue found; recovered words remain ~1.71× overweighted.
- Explicit recommendation: change miss weighting to decay with recovery; leave other scheduler parameters unchanged pending #5.
