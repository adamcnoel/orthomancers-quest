# Recency spacing (#42)

Adaptive weights are unchanged: mastery stage × HSPT priority × recent-trouble debt. Spacing is a separate eligibility pass before weighted selection.

Each generated question remembers all three target words, whether clean or corrupted. When selecting the next question, the two most recent question groups are excluded where at least three eligible targets remain. If this is impossible, the oldest group is allowed again first, then the newer group as needed. Within-question target uniqueness is always enforced. Pool sizes below three throw an explicit error.

The history is attached to transient flow state only, not the durable save. Reloads start fresh; Reset Archive clears the spacing history along with the current session.

Regression: `node tests/recency-spacing.js` runs 1,000 deterministically seeded questions and ensures no overlap with the previous two questions across a 40-word pool. Additional tests exercise pools of 3, 4, 5, 6, and 8 words, verify reset and save boundaries, and reject undersized pools. The normal `node tests/run.js` suite also includes the existing 4-profile × 3-seed scheduler analysis and recovery scenario. Those diagnostics should be compared with historical #31 and #5 results to ensure weak-word review remains elevated without permanent overexposure.
