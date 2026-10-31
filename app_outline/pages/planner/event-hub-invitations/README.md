# Event Hub › Guests › Invitations

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Planner (Owner) · **Phase:** P1 · **Stories:** PL-5.3
**Route:** `Event Hub › Guests › Invitations` · **URL:** `app/events/rivera/guests/invitations` · **Wireframe snapshot:** Snapshot: Mar 1, 2027

## Wireframe

Desktop, tablet and phone views plus design notes, cropped from `wireframes/wireframe.html`.

![Event Hub › Guests › Invitations wireframe](wireframe.png)

## How you get here, and where you go next

- ⬅ **Arrives from:** Guests sub-tab
- ➡ **Next:** Request client approval → Portal › Approvals · Send → 💬 invitation text (Guest journey)

## User stories

### PL-5.3 · Send invitations · P1 (simple template) / P3 (designer)

As a planner, I want to send save-the-dates and invitations by email, text or link so that guests get invited without paper chaos.  
_Screens: Event Hub › Guests › Invitations, 💬 Invitation (guest)_  
- [ ] Types: save-the-date, invitation, reminder, thank-you, all from the same design
- [ ] P1: one simple branded template with editable wording; P3: full Invitation Designer (PL-5.5)
- [ ] [Request client approval] sends the wording to Portal › Approvals; shows "Approved by [name] · date"
- [ ] Channels: email, SMS, shareable link + QR (for print and social); WhatsApp later
- [ ] Audience: everyone not yet invited, or a selection; send now or schedule
- [ ] Tracking per guest: delivered, opened, responded
- [ ] Bounced emails and STOP opt-outs listed with [See who]
- [ ] Automatic "one week to go" reminder with directions, parking and dress code

## → System (backend jobs)

- → System: tracks delivered / opened / responded per guest; honors STOP opt-outs.

## Design notes

- Was missing in round 1. P1 = one simple branded template; the full Invitation Designer is Phase 3.

## Related pages

Pages that share a story with this one:

- [💬 Invitation text](../../messages/sms-invitation/)

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
