# Phase 6 review: Guests and staff

**Branch:** `feature/frontend-phase-6` (stacked on phase 5)

Phase 6 adds:
- **Guest pages:** Invitation, Event Website, RSVP and Confirmation, in the event's theme, in English or Spanish.
- **Messages:** ✉/💬 RSVP confirmations, plus "one week to go" and "see you tomorrow" reminders.
- **Staff pages:** Join with a phone code, and Profile.

Every screen from the wireframes is now built. The `Planned` placeholder page and its registry (`src/routes/screens.js`) were removed.

## Passing conditions

| Condition | Result |
|---|---|
| An RSVP works with no account, in under a minute | ✅ The test clicks the 💬 invitation in the Outbox → invitation → RSVP for two with meals and allergies → confirmation |
| It updates the planner's guest counts | ✅ Same test: Acme goes from 12 → 14 attending in Event Hub › Guests |
| EN/ES toggle works on guest pages | ✅ Every app word and date switches (test). Text the planner wrote (welcome, schedule, FAQ) stays as written |
| The event theme and planner branding apply | ✅ Theme colors, fonts and motif; "Planned by Bella Events · Powered by Crowned" footer; the memorial is respectful (test) |
| Staff invite → join → profile | ✅ 💬 team invite (seeded for Jo Kim) → phone → wrong code → Send a new code → 123456 → Profile; the planner gets "Jo Kim joined your team" |
| Vitest | ✅ 228 tests in 17 files (up from 217) |
| Lint / build / contrast | ✅ / ✅ / ✅ 315 of 315 |
| Lighthouse accessibility | ✅ 100 on the Event Website (mobile) |
| Console / sideways scroll | ✅ 0 errors on a clean load of 9 pages; no overflow at 375 or 1280 |

## Story coverage

| Story | Status |
|---|---|
| GU-1.1 Receive the invitation | ✅ SMS/email preview names the event; the link carries the guest's token. *QR code deferred (as in Phase 4)* |
| GU-1.2 Open the invitation | ✅ Branded card: guest name (+plus-ones), event, hosts, date, time, venue, reply-by, RSVP / See the details; marks "opened" for tracking. *P3 envelope and music not in scope* |
| GU-1.3 Event website | ✅ When & where, Add to calendar (.ics), Directions, schedule, dress code, hotel, FAQ, registry in a new tab (memorial: "In memory" / "Donaciones"), sticky RSVP bar, EN/ES |
| GU-2.1 RSVP | ✅ Prefilled from the token; Attending / Not attending per person; a meal per attendee; allergies; song; custom questions; plus-ones only up to the allowance, then a polite explanation + **Message the host**. *Forwarded-link detection needs device info (backend); the store already records a `forwarded` flag and tells the planner. Child guests: no separate member records yet* |
| GU-2.2 Confirmation and changes | ✅ Summary, Add to calendar, registry, **Change my RSVP** (until the cutoff), confirmation text/email with the same link; after the cutoff "RSVPs closed" + Message the host, unless late RSVPs are allowed (Thompson) |
| GU-2.3 Public / private | ✅ Private without a token → "just for invited guests… ask the host"; password → asked once; public → name + contact creates the guest. The planner's "Preview as guest" bypasses privacy |
| GU-4.1 Reminders | ✅ "One week to go" (directions, dress code) and "see you tomorrow"; skip declined guests and STOP opt-outs. Sent from Hub › Invitations ("Send now" stands in for the scheduler) |
| ST-1.1 Join | ✅ Phone + SMS code, wrong/expired code → Send a new code, linked with the owner's role; the owner can **Sign out everywhere** (Settings › Team) |
| ST-1.2 Profile | ✅ Photo, name, mobile, emergency contact, skills, shirt size; role read-only; My Shifts / Day-of / Chat locked "Coming in Phase 2" |

## Decisions

1. **Demo guest = Dana Lee (Acme).** Dana hasn't replied yet, so "Viewing as Guest" opens her invitation. Rivera's guest pages work once Ana books and the planner sends invitations.
2. **Guest words live in `src/lib/guestText.js`** (EN + ES), with dates formatted per language. Adding a language means adding one block.
3. **`lib/ics.js`** is shared by the booking page and guest pages for "Add to calendar".

Screenshots: `qa/frontend/screens/phase-6/`.
