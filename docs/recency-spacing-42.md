# Recency spacing (#42)

Adaptive weights are unchanged: mastery stage × HSPT priority × recent-trouble debt. Spacing is a separate eligibility pass before weighted selection.

Each generated question remembers all three target words, whether clean or corrupted. When selecting the next question, the two most recent question groups are excluded where at least three eligible targets remain. If this is impossible, the oldest group is allowed again first, then the newer group as needed. Within-question target uniqueness is always enforced. Pool sizes below three throw an explicit error.

The history is attached to transient flow state only, not the durable save. Reloads start fresh; Reset Archive clears the spacing history along with the current session.

Regression: `node tests/recency-spacing.js` checks 10 deterministic seeds across 11 pool sizes (3–140), both study modes, and over 30,000 questions. Every question is checked against the maximum achievable cooldown given the recent history. The test also verifies no duplicates within questions, tiny-pool fallback, reproducible seeded replay, transient-only history, reset behavior, and rejection of undersized pools. `node tests/run.js` also runs the established 4-profile × 3-seed scheduler analysis and recovery scenarios. GitHub Actions runs both corpus validation and this entire test suite on every PR.
