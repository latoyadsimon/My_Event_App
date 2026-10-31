# Tests to write: Leads (kanban)

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-2.2 · Leads board

- [ ] Test: Columns: New, Contacted, Consult booked, Proposal sent, Won, Lost
- [ ] Test: Card shows date, event type, guest count, budget and source
- [ ] Test: A red "Date taken" badge shows if the requested date is already booked
- [ ] Test: Drag cards between columns; cards also move automatically (proposal sent → Proposal sent; contract signed → Won)
- [ ] Test: Filter by source (referral, Instagram, Google, The Knot…)
- [ ] Test: Empty board says "Share your inquiry form" with [Copy link]
- [ ] Test: Phone shows one column at a time with stage tabs

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
