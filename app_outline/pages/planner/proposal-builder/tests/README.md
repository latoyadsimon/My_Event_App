# Tests to write: Proposal Builder

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-3.1 · Build a proposal

- [ ] Test: Pick a package; toggle add-ons and set quantities; apply discounts; tax calculated by location
- [ ] Test: Mark add-ons as "optional upgrade" so the client can tick them in the portal
- [ ] Test: Live total and deposit amount update as I edit
- [ ] Test: Each add-on is checked against equipment availability on the event date
- [ ] Test: If I quote more than I own (e.g. 140 chairs, own 120): warning on that line with [Reduce] [Add partner rental] [Override + note]

## PL-3.2 · Send a proposal and handle changes

- [ ] Test: [Preview as client] shows exactly what the client will see
- [ ] Test: [Send] emails a magic link; lead moves to "Proposal sent"; I can see when it was opened
- [ ] Test: Client change requests appear on the proposal with their comment
- [ ] Test: Each send creates a new version (v1, v2…); old versions are kept; the client always sees the latest

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
