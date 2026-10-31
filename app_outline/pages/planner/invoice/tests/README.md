# Tests to write: Invoice

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-3.5 · Invoice and payment schedule

- [ ] Test: Created when the client signs (so they can pay the deposit right away), with the schedule from my template (e.g. 30% / 40% at 60 days / 30% at 14 days)
- [ ] Test: Payment status comes only from Stripe/Square webhooks, never from the browser
- [ ] Test: [Record payment] for cash, check, Venmo, Zelle, Cash App
- [ ] Test: Refunds, partial refunds and credits
- [ ] Test: Options: pass card fee to client; late fee (only if the contract allows); client autopay
- [ ] Test: Automatic reminders 7 days and 1 day before each due date, and +1 / +7 days after a missed one; I can pause them
- [ ] Test: I'm alerted after 2 failed payment attempts

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
