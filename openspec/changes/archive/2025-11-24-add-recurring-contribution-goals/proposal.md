# Change: Add recurring contribution goals

## Why
Parents want weekly contribution goals to persist automatically so they don’t need to recreate them each week.

## What Changes
- Add a recurring toggle to contribution goal create/edit flows on web.
- Persist a `recurring` boolean on contribution goals via API and storage.
- On weekly processing, recreate next week’s goal with same data when `recurring` is true.

## Impact
- Affected specs: contribution-goals, api-contribution-goals, web-contribution-goals.
- Affected code: contribution goals API module (repo/service/scheduler/processor), web contribution goal dialogs + Redux slice, dictionaries/tests.
