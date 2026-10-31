# Tests to write: Data deletion, export and privacy

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## NFR-7 · Data deletion and export

- [ ] Test: Guest/client data-deletion request flow; keep only what's legally required (payment records)
- [ ] Test: Automatic backups; the owner can export all their data

## NFR-14 · Privacy and minors

- [ ] Test: No data capture from guests marked as children; booth email capture disabled for them
- [ ] Test: Photo sharing and data capture need consent; kids' party galleries default to private

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
