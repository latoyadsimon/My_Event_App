# Tests to write: Lead Detail

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-2.3 · Respond to a lead

- [ ] Test: [Send canned reply] opens an editable template before sending
- [ ] Test: [Hold date] soft-holds the date for X days (shown dashed on the Calendar) and auto-expires
- [ ] Test: [Send booking link] emails the public booking page link
- [ ] Test: If the date is taken: suggested reply offers nearby open dates I can insert
- [ ] Test: Two leads want the same date: the first signed contract wins; the other hold expires and I'm prompted to notify that lead
- [ ] Test: Activity log shows every message, hold and booking

## PL-2.5 · Create a proposal from the lead

- [ ] Test: Client name, contact, event type, date, guest count and requested services are prefilled

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
