# Tests to write: RSVP Confirmation

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## GU-2.2 · Confirmation and changes

- [ ] Test: Confirmation screen summarizes my reply, with [Add to calendar] and links to the fund (and potluck when on)
- [ ] Test: Confirmation email/text with [Change my RSVP], which works until the cutoff
- [ ] Test: After the cutoff: "RSVPs are closed" with [Message the host], unless the host allows late RSVPs

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
