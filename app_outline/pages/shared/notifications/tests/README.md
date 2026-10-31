# Tests to write: Notifications (email / SMS / push)

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## SYS-2 · Notifications

- [ ] Test: Email (e.g. SendGrid), SMS (e.g. Twilio), push; templates editable by the planner
- [ ] Test: Bounces and STOP opt-outs mark the contact undeliverable; opt-outs honored; the planner sees who didn't receive what
- [ ] Test: Scheduled sends (reminders, invitations)

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
