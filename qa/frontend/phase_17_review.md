# Phase 17 review: Grow (finishes product P4)

**Branch:** `feature/frontend-phase-17` (stacked on phase 16)

**Stories:** PL-9.1 Business reports · PL-9.2 Marketing reminders · PL-9.3 Duplicate an event or save as template · PL-8.4 (P4: review request and survey) · CL-6.4 Review and survey · GU-6.2 Feedback · VN-7 (P4: pay in the app).

## Passing conditions

| Condition | Result |
|---|---|
| Booked vs collected by month | ✅ **Grow › Reports**: a 12-month grouped column chart. Booked = countersigned contract totals by month; collected = payments by paid month |
| Lead sources, best-selling add-ons, gear utilization | ✅ Bar lists: leads per source with "N booked"; add-on revenue on live events; the share of events each gear item went to |
| Sales tax by location; QuickBooks sync | ✅ Tax per city from venue addresses at the business rate. Connect + Sync (stand-in: counts invoices and payments) |
| Charts follow the dataviz method | ✅ One axis. Series colors validated with the skill's `validate_palette.js` on the light surface and Bold's dark surface (**all checks pass**), with Bold's dark steps selected under `data-mode="bold"`. Legend + labels; text in text tokens; keyboard-reachable hover/focus tooltips; **Show as table** on every chart. Phones show every other month label |
| Marketing reminders: opt-in only | ✅ **Grow › Marketing**: due now / coming up / past clients with opt-in switches and "add a date" (yearly or once). "Baby Luis's first birthday is in 6 weeks" goes to Rosa with the inquiry link, once per occurrence. **Memorial families are never marketed to**, even if opted in |
| Duplicate an event; save as template with tasks, timeline and packages | ✅ Hub header: **Duplicate** (new name/date/client → opens the copy) and **Save as template**. Tasks keep their "days before", the run of show keeps its times, booth/karaoke/potluck and gear kits come along; vendors, guests and money don't. **Settings › Templates › Event templates** creates a new event from one |
| Client review request (Google, Yelp, The Knot, WeddingWire) + survey | ✅ Wrap-up › Reviews and feedback. Portal › **Review**: four links (new tab) + a private 1–5 rating and comment. **Memorials:** a private "Thinking of you" note, never public review sites |
| Guest one-question survey | ✅ `/e/<event>/feedback`: 1–5 + optional comment, one answer per guest link, EN/ES. The average shows on Wrap-up and Grow › Reviews |
| Vendor paid in the app | ✅ "Pay in the app (ACH to their bank)" is the default in Record payment; the vendor gets the receipt |
| Tests | ✅ **476 in 39 files** (+8 store, +10 screen). The planner nav test now expects Grow, and "More (2)" on phones |
| Lint, build, contrast, a11y, scroll, console | ✅ 0 / OK (app 68 kB + shared 241 kB + React 258 kB, no warning) / 315 of 315 / Lighthouse 100 (Grow, guest survey on mobile) / none at 375 or 1280 / 0 |

**Product Phase 4's front end is now complete:** phases 15–17. Every story in `user_stories.md` (P1–P4) has a screen.

Screenshots: `qa/frontend/screens/phase-17/` (including `reports-bold-1280.png` for the dark palette).
