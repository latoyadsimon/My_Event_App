# Phase 18 review: documentation for P2–P4

**Branch:** `feature/frontend-phase-18` (stacked on phase 17)

**Scope:** the How-To guide and in-app Help now cover every product phase. The READMEs and CLAUDE.md describe the P1–P4 front end, and how its P2–P4 actions map onto the database step that comes next.

## Passing conditions

| Condition | Result |
|---|---|
| How-To covers P2–P4 | ✅ 10 new sections in `src/data/howTo.js`: vendors/gear/run of show, staff app, event day and wrap-up, potluck, karaoke, photo booth and galleries, invitation designer, fundraising, tickets/floor plan/seating, Grow. **18 sections, 59 steps** |
| One source for both | ✅ `/help` renders it; `npm run docs:howto` regenerated `documentation/HOW_TO.md`. The script refuses to run if a screenshot is missing |
| Every "Show me" opens a real screen | ✅ `help.test.jsx` checks each step's link (no "We couldn't find that" or "This page is part of"). Clicked in a real browser too: "Book and pay vendors" → the Acme Vendors tab as the planner |
| New screenshots | ✅ 16 at 1280 × 800 in `documentation/how_to/` (run-of-show, vendors, gear, staff-shifts, staff-app, day-of, wrap-up, potluck, kj-console, booth, gallery, designer, fundraising, tickets, seating, grow) |
| Words match the screens | ✅ Checked against the screenshots; the Day-of step was rewritten to name its real tabs (Run, Door, Sell, Incidents, Teardown) |
| `README.md` | ✅ Five roles, P1–P4 status, the vendor in "Viewing as", build phases 0–18 with their product phase, and "Next: the database" |
| `documentation/README.md` | ✅ Sections 1, 3.5 and 8: what each role can do in P2–P4, the venue screens, and a **P2–P4 action → table → likely server function** table. It also lists the tables the front end needs that the sketch lacks (vendor payments, availability, team chat, paddle pledges, sponsors, waitlist, marketing dates, feedback, templates) |
| `CLAUDE.md` | ✅ Refreshed with /init: product vs build phases, P2–P4 routes, action and selector files, seeds, demo events per area |
| Help page layout | ✅ No sideways scroll at 375 or 1280, 0 console errors (`screens/phase-18/help-375.png`) |
| Tests | ✅ **502 in 39 files** (the Help test's per-step check grew by 26) |
| Lint, build, contrast | ✅ 0 / OK / 315 of 315 |

## Notes
- The P2–P4 mapping in `documentation/README.md` is a **proposal** for the database step, not a decision. The owner reviews it before tables are added to `schema.sql`.
