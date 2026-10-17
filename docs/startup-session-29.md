# Startup, session, and reset behavior (#29)

This behavior follows the current Etymancer's Quest architecture rather than the earlier PR #26 snapshot alone. In particular, it incorporates the later onboarding/reset consolidation and first-render ownership work from Etymancer PRs #37 and #39.

## State boundaries

Orthomancer keeps three state lifetimes separate:

- **Persistent:** Standard/Advanced preference and per-word mastery. Stored under the app-specific `orthomancerSave:v3` localStorage key.
- **Session:** answered count, accuracy inputs, and streak. Created fresh on every page load.
- **Flow:** active question, word-selection phase, and feedback. Created fresh on every page load and never serialized.

Rendered HTML is never used as resumable state.

## Startup states

The browser save is classified before the first application screen is rendered.

- **Fresh:** no current or legacy save exists. The home screen offers `Begin restoration`. Merely loading the page does not create a save.
- **Returning:** a valid v3 save exists. Durable mastery/mode are loaded; session stats and question flow begin fresh.
- **Migrated:** no v3 save exists, but a valid v2 save exists. It is normalized into v3, saved under the current key, and the migrated legacy key is removed.
- **Recovered:** a current save (or the only legacy save) is malformed or has an invalid top-level shape. Orthomancer initializes clean persistent state rather than guessing at damaged progress.
- **Reset:** after an explicit reset, the player returns to the home screen with clean mastery/session/flow state and the existing difficulty preference preserved.

A cold reload therefore never pretends that an old question or feedback screen is still resumable. It returns to the home/session gate with durable mastery intact.

## First visible render

`index.html` starts in a neutral `booting` state. The app loads/classifies persistent data, binds controls, calculates the initial status, and then reveals the application once. This avoids transient startup screens based on incomplete state.

## Begin Study vs resume

Orthomancer currently has no side-screen navigation that suspends gameplay. `Begin study` always starts a fresh in-memory question flow for the current page session. Within that session, `Next fragment` advances the existing flow normally.

If later navigation screens are added, resumability should remain session-only and should be represented by explicit logical flow state rather than DOM snapshots.

## Reset Archive

The previous `Reset progress` control is replaced by `Reset archive`.

The confirmation states exactly what happens:

- all word mastery is permanently cleared on this device;
- current session statistics are cleared;
- active question/feedback flow is cleared;
- Standard/Advanced preference is preserved.

After reset, the player returns to the home screen rather than being dropped directly into a new question.

## Cache/origin hygiene

Orthomancer keeps app-specific localStorage keys. Asset URLs now also include an explicit `app=orthomancer` query token plus the build version, reducing the chance of stale sibling-app assets being reused when projects have been served from the same origin.

For local development, continue serving Orthomancer on a different localhost port from Etymancer (for example Orthomancer on `:8001`).

## Regression coverage

`tests/startup-state.js` covers:

- fresh startup;
- valid returning save;
- legacy migration;
- corrupt current and legacy saves;
- reset semantics;
- cold reload preserving durable mastery while creating fresh session/flow state.
