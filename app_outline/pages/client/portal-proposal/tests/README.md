# Tests to write: Portal › Proposal

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## CL-2.1 · Open my proposal with a magic link

- [ ] Test: The link opens the portal directly; it expires in 7 days
- [ ] Test: An expired link offers [Send me a new link], which goes only to the email on file
- [ ] Test: A forwarded link or new device asks for a one-time code sent to the email/phone on file
- [ ] Test: Before the deposit, Home / Guests / Approvals show as locked ("Unlocks after your deposit"); Messages is open

## CL-2.2 · Review and customize the proposal

- [ ] Test: Package photos and inclusions; included add-ons; optional upgrades as checkboxes
- [ ] Test: Total (with tax) updates live as I tick upgrades
- [ ] Test: [Ask a question] opens Messages
- [ ] Test: [Request changes] with a comment sends it to the planner; I always see the latest version
- [ ] Test: Progress shown: Review → Sign → Pay deposit

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
