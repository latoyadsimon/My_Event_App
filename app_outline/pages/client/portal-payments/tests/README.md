# Tests to write: Portal › Payments

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## CL-4.2 · Payments page

- [ ] Test: Balance with progress bar; schedule with receipts for paid items
- [ ] Test: [Pay full balance], [Pay ahead], autopay toggle

## CL-4.3 · Approve a change order

- [ ] Test: Change order shows item and price; [Approve] or [Decline]
- [ ] Test: Approving updates the invoice and the next payment

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
