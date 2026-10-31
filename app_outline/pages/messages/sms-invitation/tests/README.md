# Tests to write: 💬 Invitation text

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## GU-1.1 · Receive my invitation

- [ ] Test: Message preview shows host names and event title
- [ ] Test: The link carries my unique token, so I'm recognized without logging in
- [ ] Test: Paper invites and flyers carry a QR code to the same page

## PL-5.3 · Send invitations

- [ ] Test: Types: save-the-date, invitation, reminder, thank-you, all from the same design
- [ ] Test: P1: one simple branded template with editable wording; P3: full Invitation Designer (PL-5.5)
- [ ] Test: [Request client approval] sends the wording to Portal › Approvals; shows "Approved by [name] · date"
- [ ] Test: Channels: email, SMS, shareable link + QR (for print and social); WhatsApp later
- [ ] Test: Audience: everyone not yet invited, or a selection; send now or schedule
- [ ] Test: Tracking per guest: delivered, opened, responded
- [ ] Test: Bounced emails and STOP opt-outs listed with [See who]
- [ ] Test: Automatic "one week to go" reminder with directions, parking and dress code

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
