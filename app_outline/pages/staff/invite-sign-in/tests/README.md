# Tests to write: Staff Invite + Sign In

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## ST-1.1 · Join from an invite

- [ ] Test: Invite text/email links to app download and sign-in
- [ ] Test: Sign in with phone number + SMS code; expired/wrong code → [Send a new code]
- [ ] Test: Linked to the business with the role the owner set
- [ ] Test: Lost phone: the owner can revoke my sessions remotely

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
