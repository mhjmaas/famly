# Proposal: Update Task Completion Credit Rules

## Summary
Task completion today always attributes karma and completion metadata to the person who toggles the checkbox. This proposal updates both API and web behavior so that tasks assigned to a specific family member award karma to that assignee even if a parent marks the task complete. Parents gain the ability to mark tasks on behalf of their kids (or other members), while children continue to complete only their own or unassigned tasks.

## Motivation
Families asked for a way for parents to check off chores for younger kids who cannot access the app yet. Right now doing so incorrectly rewards the parent with karma and activity history while also letting any child complete someone else’s assignments with no restriction. This creates inaccurate balances, makes rewards harder to track, and opens abuse vectors.

## Goals
- Enforce that karma and completion metadata for member-assigned tasks always target the assignee, not the actor who toggles completion.
- Require parent role to mark tasks that belong to another member, while keeping current behavior for unassigned and role-based tasks.
- Keep UI feedback aligned: karma toasts, badges, and Redux karma state must reflect the credited member so balances stay correct in real time.
- Provide automated coverage on both API (Jest e2e) and web (Playwright) layers for the new rules.

## Non-Goals
- Reworking task claiming flows or introducing new assignment types.
- Changing existing karma grant calculations for manual grants or reward claims beyond necessary plumbing for crediting the correct user.
- Altering notification frequency or schedule generation behavior.

## Success Metrics
- All new and existing task completion e2e tests pass with assignments credited to the proper member.
- Playwright tests prove that children cannot complete siblings’ tasks while parents can complete tasks for any member.
- Karma balances remain consistent when viewing dashboard or tasks page, even after parents complete tasks on behalf of kids.

## Affected Areas
- API `tasks` module (service logic, validators, events, hooks) and related `karma` integration.
- API e2e suites under `tests/e2e/tasks` and `tests/e2e/karma`.
- Web Redux slices for tasks/karma plus UI components on tasks page and dashboard.
- Playwright page objects + specs covering tasks interactions and dashboard pending tasks.

## Risks & Mitigations
- **Risk:** Breaking backward compatibility on `task.completed` event payloads. *Mitigation:* Version the payload by adding fields rather than changing semantics of existing ones, and cover with real-time tests.
- **Risk:** Confusing UX when parent toggles a task but toast references someone else. *Mitigation:* Update copy and show assignee context so behavior is explicit.
- **Risk:** Regressions in karma totals if Redux updates the wrong user locally. *Mitigation:* Add selectors/helpers to compute karma recipient and extend unit tests around `tasks.slice` and `karma.slice` interactions.

## Open Questions
- None. Requirements are clear from the request.
