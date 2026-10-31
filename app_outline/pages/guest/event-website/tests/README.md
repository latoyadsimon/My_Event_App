# Tests to write: Event Website

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## GU-1.3 · Event website

- [ ] Test: Date, time, map, [Add to calendar], [Directions], schedule, dress code, hotel block, FAQ
- [ ] Test: Registry/fund link opens the external site in a new tab (P1)
- [ ] Test: [RSVP] always visible (sticky bar on phones)
- [ ] Test: English/Spanish, following my browser language, with a toggle
- [ ] Test: Loads in under 2 seconds on a phone (NFR-9); WCAG 2.1 AA (NFR-10)

## GU-2.3 · Public and private events

- [ ] Test: Public event: the RSVP form asks for name and contact and creates a guest
- [ ] Test: Private event: "Ask the host" message instead

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
