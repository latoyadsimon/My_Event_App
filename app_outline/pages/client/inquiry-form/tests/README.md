# Tests to write: Inquiry Form

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## CL-1.1 · Send an inquiry without an account

- [ ] Test: No account; works on the planner's website, Instagram and Facebook
- [ ] Test: Fields: name, email, phone, event type, date, guest count, budget range, services, how they heard, notes
- [ ] Test: Confirmation explains "what happens next"
- [ ] Test: Auto-reply email arrives with a [Pick a consult time] link

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
