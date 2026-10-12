# Adaptive review tuning — issue #5

Issue #31 established that the existing scheduler was broadly healthy: corpus coverage was fast, the 25% D/no-mistake rate was stable, mastery thresholds behaved well, and missed words resurfaced much sooner than Mastered words. The main defect was permanent over-weighting from lifetime cumulative misses.

## Change

Lifetime `misses` remains a statistic, but it no longer directly changes scheduling weight.

Scheduling now uses bounded `reviewDebt`:
- each miss adds `0.40` review debt;
- each subsequent correct evidence event removes `0.25`;
- review debt is capped at `1.50`;
- scheduler weight multiplier is `1 + reviewDebt`.

A miss still immediately demotes mastery by one stage, so the existing stage weights provide a strong additional short-term review effect. Review debt supplements that effect without making old misses permanent.

Existing saves are normalized in place. Records without `reviewDebt` load with debt `0`; lifetime misses and existing mastery evidence are preserved. The save key/schema remains v3 because the added field is backward-compatible and does not require wiping progress.

## Validation

The deterministic learner simulations continue to use the same 5,000-question horizon and seeds from #31.

After this change:
- Near-perfect learner miss-to-repeat median: 8–9 questions; Mastered repeat median: 33–34.
- Solid learner miss-to-repeat median: 8–9; Mastered repeat median: 38–39.
- Persistent trouble words: miss-to-repeat median 7–8; Mastered repeat median 35–36.
- Persistent trouble words still receive about 1.50–1.60× normal exposure while genuinely difficult.
- In the recovery scenario, former trouble words receive only 0.89–0.95× normal exposure in questions 3,001–5,000 after recovery, versus 1.66–1.77× before this change.
- All recovered trouble words reach Mastered and finish with zero average review debt in all three seeds.
- Corpus validation and the full deterministic test suite pass.

## Parameters intentionally unchanged

- 25% D/no-mistake rate.
- New → Learning → Familiar → Mastered thresholds.
- Stage weights `[6, 5, 2.5, 0.8]`.
- HSPT-core source priority.
- Separate correct-form and error-form evidence requirements.

These parameters should only be revisited if later real-world playtesting or expanded-corpus simulations show a concrete problem.
