# Tests to write: RSVP

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## GU-2.1 · RSVP for my household

- [ ] Test: My name and household are prefilled from the token
- [ ] Test: Attending / Not attending per member; meal choice per attendee; allergies/dietary notes; song request; custom questions
- [ ] Test: Plus-one field appears only if allowed; I can't add more than allowed, with a polite explanation and [Message the host]
- [ ] Test: A forwarded link still records the RSVP against the original guest; the host sees a "forwarded link" flag
- [ ] Test: Guests marked as children: no data capture from them

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
