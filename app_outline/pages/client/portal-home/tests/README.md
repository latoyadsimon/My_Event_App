# Tests to write: Portal › Home

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## CL-3.1 · Portal home

- [ ] Test: Countdown, next payment with [Pay now], "Needs your action (n)" and recent messages
- [ ] Test: Every action item links straight to the screen that finishes it
- [ ] Test: Nothing pending → "You're all caught up"

## CL-2.5 · First portal visit

- [ ] Test: 3-screen tour on first visit; skippable
- [ ] Test: Optional prompt to set up a password or passkey

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
