## Context
Recurring contribution goals should recreate automatically after weekly processing so parents don't have to manually set them up each week.

## Goals / Non-Goals
- Goals: Add `recurring` flag; recreate next week's goal with same fields and zero deductions after weekly award/deletion; keep existing weekly processing timing.
- Non-Goals: Historical tracking beyond current/next week; multiple concurrent goals per member; UI scheduling beyond weekly cadence.

## Decisions
- Persist boolean `recurring` on goal documents and DTOs; default false.
- During weekly processor, after awarding (or zero award), if `recurring` true create new goal for next week with identical title/description/maxKarma/recurring; deductions reset.
- If original goal was deleted mid-week, no recreation occurs.
- If parent updates recurring flag mid-week, processor uses stored flag at processing time.

## Risks / Trade-offs
- Duplicate creation risk if processor reruns: mitigate by unique (familyId, memberId, weekStartDate) index; creation uses next week's start date so collision risk minimal unless already created manually.
- Cron failure before creation: next week's goal missing; acceptable; future work could add idempotent upsert.

## Migration Plan
- No data migration; new goals default recurring=false. Update validators and DTOs.

## Open Questions
- Should UI default recurring to off? (assume off)
- Should awards copy over if deductions exceeded maxKarma? (copy settings regardless)
