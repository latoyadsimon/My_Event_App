# Tests to write: Public Booking Page

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## CL-1.2 · Book a consult

- [ ] Test: See open slots; book with name and email
- [ ] Test: Confirmation with [Add to calendar]; confirmation email and reminders 24h and 1h before
- [ ] Test: No open times this week → [See next week]

## PL-2.4 · Consult booking

- [ ] Test: Shows only open slots, respecting buffer times, daily limits and external calendar busy times
- [ ] Test: Booking adds the consult to both calendars and to Lead Detail; lead moves to "Consult booked"
- [ ] Test: Reminders go to both people 24 hours and 1 hour before

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
