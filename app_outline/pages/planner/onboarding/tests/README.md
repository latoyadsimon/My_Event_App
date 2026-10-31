# Tests to write: Onboarding Wizard

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-1.2 · Business profile and branding

- [ ] Test: Name, logo upload, brand colors, optional custom domain (e.g. events.mybusiness.com)
- [ ] Test: Branding appears on all client, guest, vendor and donor pages
- [ ] Test: The wizard is skippable and resumable; progress saves after each step

## PL-1.3 · Connect payments

- [ ] Test: Connect via Stripe or Square OAuth; card numbers never touch our servers
- [ ] Test: Until connected, the Dashboard shows a "Payments not connected" banner with [Connect now]
- [ ] Test: Proposals can still be sent without payments; the deposit step offers "pay by check/cash" only

## PL-1.4 · Service packages and add-ons

- [ ] Test: Create, edit and archive packages (e.g. Silver / Gold / Platinum) with price, description and photos
- [ ] Test: Create add-ons with unit price and quantity (photo booth hours, chairs…)
- [ ] Test: Add-ons can be linked to equipment so availability can be checked (see PL-3.1)

## PL-1.5 · Connect my calendar

- [ ] Test: Events, holds and consults appear in my external calendar
- [ ] Test: Busy times from my external calendar block my public booking page

## PL-1.7 · Starter templates

- [ ] Test: Pick starter templates per event type (wedding, birthday, shower, corporate, fundraiser…)
- [ ] Test: Edit templates later; changes apply to new events only
- [ ] Test: Message templates (auto-reply, canned replies, reminders) are editable here too

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
