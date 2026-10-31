# Tests to write: Contract (countersign)

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-3.3 · Contract generated from my template

- [ ] Test: Generated from my contract template with merge fields filled (names, date, venue, price, deposit, cancellation policy)
- [ ] Test: Merge fields come from the accepted proposal version

## PL-3.4 · Countersign after the client signs and pays

- [ ] Test: Dashboard alert "[Client] signed + paid deposit → [Countersign]" appears as soon as both happen
- [ ] Test: Contract shows client signature, timestamp and "Deposit paid ✓"
- [ ] Test: Countersigning: event status → Booked, hold → confirmed booking, equipment reserved, checklist applied with due dates relative to the event date
- [ ] Test: Signed PDF is stored with timestamps for both parties
- [ ] Test: After countersigning: [Go to Event Hub] and [View invoice]

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
