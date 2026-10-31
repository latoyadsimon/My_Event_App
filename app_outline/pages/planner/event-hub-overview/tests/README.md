# Tests to write: Event Hub › Overview

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-4.2 · Event Hub overview

- [ ] Test: Status (Inquiry → Proposal → Booked → In planning → Final week → Event day → Wrap-up → Closed), countdown, balance due, RSVP progress, open/late tasks, next 3 deadlines
- [ ] Test: Questionnaire status and pending approvals with links
- [ ] Test: Venue with map, load-in notes, Wi-Fi
- [ ] Test: Tabs: Overview, Tasks, Guests, Money, Files, Messages (Phase 2+ tabs slot in later)

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
