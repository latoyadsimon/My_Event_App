# Phase 5 review: Client portal (after booking)

**Branch:** `feature/frontend-phase-5` (stacked on phase 4)

Phase 5 adds the client's planning pages:
- Home, with a first-visit tour.
- Questionnaire, Mood board and Approvals.
- Payments (receipts, pay ahead, autopay, change orders) and Cancel or postpone.
- Guests (CSV import with inline fixes, co-host) and Messages (open before booking too).

**New demo option:** **Client (Priya Shah, Acme)** shows an unlocked portal right away. **Client (Ana Rivera)** still shows the pre-deposit portal.

## Passing conditions

| Condition | Result |
|---|---|
| Before the deposit, tabs are locked ("Unlocks after your deposit"); Messages stays open | ✅ Test: Ana sees the locks and can send a message (pre-booking thread keyed by the lead) |
| A questionnaire answer appears on the planner's Overview | ✅ `questionnaire/answer` fills event fields, finishes the task and shows "received" (store and screen tests) |
| Paying installment 2 updates the portal, the Hub's Money tab, the Invoice and the Dashboard | ✅ Test pays Thompson's $1,600: portal balance $1,200, Hub › Money shows Paid. The Invoice and Dashboard read the same rows |
| A portal message appears in the Hub's Messages | ✅ Same thread, plus a push to the planner |
| Vitest | ✅ 217 tests in 16 files (up from 200) |
| Lint / build / contrast | ✅ / ✅ / ✅ 315 of 315 |
| Lighthouse accessibility | ✅ 100 on Portal Home (mobile) |
| Console / sideways scroll | ✅ 0 errors; 7 pages × 2 widths with no overflow |

## Story coverage

| Story | Status |
|---|---|
| CL-2.5 First visit | ✅ 3-screen tour, skippable, ends with an optional passkey prompt; shown once per client |
| CL-3.1 Home | ✅ Countdown, next payment + Pay now, "Needs your action (n)" (questionnaires, approvals, payments due within 14 days, client to-dos with a checkbox, co-host invite), recent messages, "You're all caught up" |
| CL-3.2 Questionnaire | ✅ Parts with progress, saves on every field (quietly), Save & finish later, Submit → Home; the planner sees "received" |
| CL-3.3 Mood board | ✅ Upload photos, paste Pinterest links, comment (the planner gets a push; comments show on Hub › Files) |
| CL-3.4 Guests | ✅ Add, CSV import whose preview **flags bad rows** (no name, bad email), lets them be **fixed inline**, and imports only valid rows; RSVP stats; Invite co-host (same or limited access); locked after the headcount lock |
| CL-3.5 / CL-3.6 Approvals | ✅ Waiting / Done / Coming up (final headcount opens 7 days before, timeline, floor plan); Approve or Request changes with a comment; logged with name and time; invitation wording shown in the event theme. *Co-hosts disagreeing (two responses side by side) needs per-person sign-in, so it's backend work.* |
| CL-4.1 Reminders | ✅ Planner's Send reminder: autopay clients get "we'll charge your card on file … on [date]". *Automatic 7-day / 1-day timing is a backend job.* |
| CL-4.2 Payments | ✅ Balance with progress bar, schedule with receipts (printable), Pay now, **Pay full balance**, autopay toggle |
| CL-4.3 Change orders | ✅ Item and price, Approve / Decline; approving raises the invoice and the final payment |
| CL-4.4 Cancel or postpone | ✅ Policy and refund estimate before submitting; the request becomes a planner Dashboard alert linked to Change date / Cancel event; it closes when the planner acts |
| CL-4.5 Messages | ✅ One thread with the planner, open before booking, attachments; shared vendor threads appear read-only |

## Decisions

1. **The pre-booking thread uses the lead's id as its key.** It becomes the event's thread after booking, because the event takes the lead's id.
2. **`BoardItem` and `Conversation` moved to `src/components/planning/`,** shared by the Hub and the portal.
3. **Client requests are a new `requests` collection** (maps to a `change_requests` table later).

Screenshots: `qa/frontend/screens/phase-5/`.
