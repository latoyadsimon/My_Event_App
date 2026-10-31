# Tests to write: 🔔 New lead notification

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-2.1 · New inquiries become leads automatically

- [ ] Test: A lead is created with event type, date, guest count, budget, services and source
- [ ] Test: The requested date is checked against my calendar
- [ ] Test: The prospect gets the auto-reply email with my booking link
- [ ] Test: I get a push notification and a Dashboard card; tapping either opens Lead Detail

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
