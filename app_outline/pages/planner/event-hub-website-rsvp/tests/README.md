# Tests to write: Event Hub › Guests › Website & RSVP

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-5.2 · Event website and RSVP settings

- [ ] Test: Toggle sections: schedule, dress code, hotel block, FAQ; add a registry or fund link (opens in a new tab; in-app funds are P4)
- [ ] Test: RSVP cutoff date; meal options; allergies/dietary question; song request; custom questions
- [ ] Test: Default plus-ones per household (override per household in the Guest list)
- [ ] Test: Privacy: private link, password, or public
- [ ] Test: Option to allow late RSVPs after the cutoff
- [ ] Test: [Preview as guest] opens the Event Website

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
