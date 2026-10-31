# Tests to write: Settings › Team & roles

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-1.6 · Invite staff and set permissions

- [ ] Test: Invite by email or phone; the invite sets a role (coordinator, KJ, booth attendant, server, bartender)
- [ ] Test: Per-person toggles: see event budgets, see profit margins, take payments, edit vendors
- [ ] Test: Staff never see financials unless granted; profit is owner-only
- [ ] Test: [Deactivate] revokes the person's sessions immediately and keeps their history for payroll

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
