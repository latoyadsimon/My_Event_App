# Tests to write: Calendar

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-4.8 · Calendar

- [ ] Test: Month, week, day and list views (list is the phone default); color-coded by event type and status
- [ ] Test: Holds shown dashed with time left; they auto-expire
- [ ] Test: Warnings when I or a staff member is double-booked, or travel time between venues is too short
- [ ] Test: Tap an event → Event Hub; tap a hold → Lead Detail

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
