# Tests to write: Portal › Pay

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## CL-2.4 · Pay the deposit right after signing

- [ ] Test: Shows the deposit and the full payment schedule
- [ ] Test: Pay by card, Apple Pay, Google Pay or ACH; optional autopay for future payments
- [ ] Test: If payments aren't connected: "pay by check/cash" instructions only
- [ ] Test: Payment fails: plain-language error, "nothing was charged", [Try again] [Use another method]; planner alerted after 2 failures
- [ ] Test: A double tap never charges twice (NFR-6)
- [ ] Test: Success: "Your date is locked!", receipt email, portal unlocks, [Go to your portal]

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
