# Tests to write: Payments backend

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## SYS-3 · Payment webhooks

- [ ] Test: Webhooks idempotent; late or duplicate webhooks are safe
- [ ] Test: Refunds and disputes update the invoice; chargebacks alert the planner with an evidence pack (signed contract, receipts)

## NFR-6 · No double charges

- [ ] Test: Idempotency keys on every payment request

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
