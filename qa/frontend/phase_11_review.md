# Phase 11 review: Potluck and volunteers (finishes product P2)

**Branch:** `feature/frontend-phase-11` (stacked on phase 10)

**Stories:**
- PL-5.6 Turn on potluck/fund modules (P2 part: potluck; the fund is P4).
- GU-3.1 Bring a dish · GU-3.2 Volunteer for a shift.
- CL-3.8 See potluck totals (P2 part).
- GU-4.1 Reminders (adds the potluck drop-off).

## Passing conditions

| Condition | Result |
|---|---|
| Modules per event: only relevant features appear | ✅ Guests › Potluck & volunteers: two switches, off by default. The guest site shows "Bring a dish or lend a hand" only when one is on. The Hope Church potluck is seeded with both on (public site) |
| Categories with filled/needed; targets scale with headcount | ✅ "One dish per N people". People = locked headcount → RSVPs → the planner's estimate (Hope: 200 → mains 20, sides 25…). Changing N or locking the headcount rescales |
| Dish, servings, diet tags (8), hot/cold, needs an outlet | ✅ Guest form, no account. A `?t=` guest link fills in name and contact |
| Duplicate dish warning suggests under-filled categories; can still proceed | ✅ "Someone is already bringing Mac and cheese. Main dishes, Desserts could use more. You can still add yours." |
| Reminders 3 days and 1 day before with drop-off time and hot/cold note | ✅ Buttons for both (scheduled sends come with the backend). Only cooks who left a phone or email get them. The guests' one-week/day-before message adds "Drop-off is by 11:15 AM" when the potluck is on |
| Volunteer slots: setup, serving, cleanup, greeting, kids' table | ✅ Time + people needed per slot; group sign-ups count as several people; full slots drop out of the form |
| Client sees potluck totals | ✅ Portal › Guests: dishes per category vs. needed, plus volunteer counts |
| EN / ES | ✅ Every word on the sign-up page, including diet tags. Category names stay as the planner wrote them (same rule as other planner text) |
| Tests | ✅ **365 in 27 files** (+6 store, +8 screen) |
| Lint, build, contrast, a11y, scroll, console | ✅ 0 / OK / 315 of 315 / Lighthouse 100 (guest sign-up, mobile) / none at 375 or 1280 / 0 |

Screenshots: `qa/frontend/screens/phase-11/`.

**Product Phase 2's front end is now complete:** phases 8–11 cover every P2 story.
