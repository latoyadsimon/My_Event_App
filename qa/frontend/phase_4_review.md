# Phase 4 review: Event Hub

**Branch:** `feature/frontend-phase-4` (stacked on phase 3)

Phase 4 builds every Event Hub tab:
- Overview and Tasks.
- Guests, with its Guest list, Invitations and Website & RSVP sub-tabs.
- Money, Files with the mood board, and Messages.

It also adds Change date, Cancel event and the Calendar.

**New demo data:** the Acme holiday party (Dec 12, 5 weeks out) is the busy event, with:
- 16 households, invitations sent Nov 1, 9 replies, meals and allergies;
- one bounced email and one STOP;
- files and a mood board, client and vendor threads;
- a pending menu approval.

The Thompson memorial shows the respectful tone. All of this lives in `src/data/seedPlanning.js`.

## Passing conditions

| Condition | Result |
|---|---|
| Every Hub tab works on the mid-planning event | ✅ 17 screen tests (`hub.test.jsx`) on Acme, Garza, Patel and Thompson; Rivera's hub works after booking (Phase 3 flow) |
| Sending invitations writes messages to the Outbox | ✅ One per household, by text when there's a phone, otherwise email, with a `/i/<token>` link |
| Lock headcount shows its locked state | ✅ Needs the client's approval first ("Ask client to approve headcount"). Locking closes RSVPs, disables edits, and posts the count to every vendor thread |
| Memorial hub is quiet | ✅ `data-tone="respectful"` on Thompson (test) |
| Reschedule / Cancel ask for confirmation | ✅ Reschedule checks the calendar, staff and gear, and shows what shifts, before **Confirm**. Cancel shows the refund from the policy and needs **CANCEL** typed |
| A staff viewer can't see profit | ✅ New demo option **Coordinator (Devon)**: Devon sees money but not profit. Sam (no "See budgets") sees "Money is private for this event" |
| Vitest | ✅ 200 tests in 15 files (up from 162) |
| Lint / build / contrast | ✅ / ✅ (bundle-size warning, fixed in Phase 7) / ✅ 315 of 315 |
| Lighthouse accessibility | ✅ 100 on Guests (mobile) and Calendar (desktop) |
| Console / sideways scroll | ✅ 0 errors; 12 pages × 3 widths with no overflow (after the fix below) |

## Story coverage

| Story | Status |
|---|---|
| PL-4.2 Overview | ✅ Status path, days to go, balance, RSVPs, open/late tasks, next 3 deadlines (tasks, payments, RSVP cutoff, headcount lock), venue with Open in Maps, load-in and Wi-Fi (editable), questionnaire status with View answers, approvals, history log |
| PL-4.3 Tasks | ✅ Checklist due dates read "N days before"; assign to me / teammate / client / vendor; client tasks marked "In the client's portal"; subtasks; reorder ↑ ↓; remove with **Undo**; late flagged; dates shift on reschedule. *Attachments on tasks are deferred (Files covers uploads).* |
| PL-4.4 Questionnaires | ✅ Send from the task or Overview → email with a portal link; answers fill event fields (start time, guest count), finish the task, and show "received" |
| PL-4.5 Files & mood board | ✅ Upload (kept in the tab's memory), Shared/Private, mood board with images, links, palettes and notes, comments, Request approval |
| PL-4.6 Messages | ✅ Client thread plus vendor threads (private unless shared), attachments, change order from the thread (approved → added to the final payment), "Not delivered to … by SMS (replied STOP)" |
| PL-4.7 Money | ✅ Price, collected, balance, payment list, Open invoice; profit owner-only; hidden without "See event budgets" |
| PL-4.8 Calendar | ✅ Month / week / day / list (list is the phone default); events, consults and **dashed holds with days left**; travel-time / double-booking warnings (seeded: Nov 14, memorial → Garza site visit); event → Hub, hold → Lead |
| PL-5.1 Guest list | ✅ Households and plus-ones, tags, notes, gifts, live counts, meals, ⚠ allergies; CSV import (loose column names, allergies kept, 1,000+ rows in chunks with a progress bar); remind non-responders; remove with Undo |
| PL-5.2 Website & RSVP | ✅ Sections (schedule, dress code, hotel, FAQ), fund link (validated), cutoff, meals, allergies, song, custom questions, default plus-ones, privacy (private / password / public), late RSVPs, Preview as guest |
| PL-5.3 Invitations | ✅ 4 types, one branded design in the event theme, editable wording, client approval, email/SMS/link, audience, now or scheduled, tracking (delivered / opened / responded / not delivered), See who. *QR code deferred (needs a QR library); the link is copyable.* |
| PL-5.4 Lock headcount | ✅ Client approves → Lock → locked banner with who and when |
| PL-3.6 Reschedule | ✅ Checks, shift preview, confirm, client + staff notified, logged |
| PL-3.7 Cancel | ✅ Refund per policy (90+ / 30–89 / <30 days), type CANCEL, archive: tasks released, unpaid payments voided, reminders paused, client told |

## Fixes and decisions

1. **The Guests table at 375 overflowed by 202px.** On phones it now stacks each household. The table wrapper is `position: relative`, so visually hidden header text stays inside the scroll box (same cause as Phase 2's board).
2. **The invitation preview's theme motif ran through the words.** The wording now sits on a solid panel, with the motif as a frame.
3. **Toasts can carry Undo** (`toast/show` with `undo: action`). Tasks, guests and files use soft delete + Undo (NFR-13).
4. **The demo bar can view the planner app as a teammate** (`ui.memberId`), so permissions are visible without a backend.
5. **Guest RSVP pages are Phase 6.** Invitation links already point at `/i/<token>`.

Screenshots: `qa/frontend/screens/phase-4/` (1280 and 375; 768 was checked for overflow).
