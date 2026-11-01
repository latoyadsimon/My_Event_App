# Phase 9 review: Staff shifts and the staff app (product P2)

**Branch:** `feature/frontend-phase-9` (stacked on phase 8)

**Stories:**
- **Planner:** PL-6.1 Staff shifts; PL-8.3 approve hours and the payroll export.
- **Staff:** ST-2.1 Availability, ST-2.2 Accept/decline, ST-2.3 Swap; ST-3.1 Call sheet, ST-3.2 Pack the van, ST-3.3 Offline; ST-4.1 Clock in, ST-4.6 Team chat; ST-5.2 Clock out and timesheet.

## Passing conditions

| Condition | Result |
|---|---|
| Shifts per event with roles; only qualified + available + free staff suggested | ✅ Acme has 6 shifts. Teardown suggests **Sam**; Devon is "on another shift" and Keisha has "no skill". Marcus isn't suggested again because he declined. Marcus is "not available" on Nov 14 (day off) |
| Staff accept/decline from a push; declined shows open | ✅ Offering pushes `New shift: …`, and the link opens the staff app *as that person* (`staffId`). Declining reopens the shift and pushes the planner |
| Swap requests approved by the planner | ✅ Sam → Marcus (seeded) shows on Logistics › Staff and the Dashboard. Approving moves the shift and tells both |
| No-show 15 min after the start → one tap to message qualified staff | ✅ `isNoShow` + "Ask who can cover" texts every suggested person. The demo clock never reaches a shift start, so this is covered by tests |
| Availability: day-by-day and recurring | ✅ Weekly days + days off. The planner's suggestions respect them |
| Call sheet: map, parking, arrival, dress code, contact, duties, my timeline | ✅ My own items are highlighted. The staff dress code is a business setting |
| Pack the van: scan labels, missing flagged | ✅ Unique labels match exactly; bulk labels (`CR-CH-##`) match any number. "Done packing" marks the rest missing and pushes the planner. The planner's pack list shows them in red |
| Download for offline | ✅ The stand-in records the download time (a real offline store comes with the backend; NFR-4) |
| Clock in at the venue, or away with a reason (flagged) | ✅ A reason is required when away, and the planner gets a push. In the demo, GPS is assumed |
| Clock out with breaks + mileage; forgot → manual request; timesheet pending → approved → paid | ✅ Logistics › Staff › Timesheets: Approve hours, then **Export payroll** downloads a CSV and marks them Paid |
| Team chat with alerts and voice notes | ✅ One thread per event (the planner sees it in Messages). "Alert the whole crew" pushes everyone accepted. The voice note is a stand-in attachment |
| Profit counts staff hours | ✅ Scheduled hours × each person's rate for assigned shifts |
| Tests | ✅ **326 in 23 files** (+12 store, +10 screen). Vitest now runs on half the cores with a 30 s limit: one long click-through hit 15 s when 16 workers fought for CPU. Three runs in a row: green, ~10 s |
| Lint, build, contrast, a11y | ✅ 0 / OK / 315 of 315 / Lighthouse 100 (Logistics › Staff desktop, staff shift mobile) |
| No sideways scroll, console errors | ✅ 375 + 1280 on 9 screens; 0 errors |

Screenshots: `qa/frontend/screens/phase-9/`.

## Decisions
- **One person per shift** (the ERD's `shift_assignments` is simplified). Add two shifts if two servers are needed.
- **The staff app starts on My Shifts.** **Day-of** stays locked ("Coming soon") until the event-day build (Phase 10).
- **New crew in the seed:** Marcus (server) and Keisha (KJ). Each teammate has `hourlyCents` and `availability`.
