# Tests to write: Events list

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-4.1 · Events list

- [ ] Test: Filters: Upcoming / Past / All, and by status
- [ ] Test: Columns: event, date, status, balance due, open tasks; phone shows cards
- [ ] Test: Tap → Event Hub › Overview
- [ ] Test: [+ New event] for events that didn't come from a lead
- [ ] Test: Empty state explains events are created when a contract is signed

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
