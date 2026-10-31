# Tests to write: 💬 Payment reminder

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## CL-4.1 · Payment reminders

- [ ] Test: Email and text 7 days and 1 day before each due date; the link opens Pay directly
- [ ] Test: Autopay clients get "we'll charge your card on [date]" instead
- [ ] Test: Missed payment: reminders at +1 and +7 days; late fee only if the contract allows

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
