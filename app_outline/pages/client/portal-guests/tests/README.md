# Tests to write: Portal › Guests

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## CL-3.4 · Manage my guest list

- [ ] Test: Add guests manually or by CSV; group households; set plus-ones; see RSVP stats
- [ ] Test: CSV import preview flags bad rows (missing name, bad email), lets me fix them inline, and imports only valid rows
- [ ] Test: [Invite co-host] (partner or parent) with the same or limited access

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
