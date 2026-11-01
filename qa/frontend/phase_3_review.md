# Phase 3 review: Booking

**Branch:** `feature/frontend-phase-3` (stacked on phase 2)

Phase 3 adds seven screens:
- **Client:** Portal › Proposal, Contract and Pay.
- **Planner:** Contract (countersign), Invoice and the Events list.

It also adds these messages: ✉ "Your date is locked!" receipt and welcome, ✉ "You're officially booked", ✉ payment receipt, 💬 payment reminder, and 🔔 signed / paid / failed-twice pushes.

## Passing conditions

| Condition | Result |
|---|---|
| Full click-through: Ana accepts → signs → pays $4,455 → the portal unlocks | ✅ One Vitest test does it (a declined card, then a good one), and so does a Playwright run at 1280 and 375 |
| Countersigning before the deposit is refused with a plain message | ✅ Store test, plus the Contract screen test: "Ana hasn't paid the deposit yet. You can countersign once it's paid." |
| After countersigning, Rivera is *Booked* on the Events list and the Invoice | ✅ Status Booked, 8 checklist tasks applied, Invoice #1042 balance $10,395 |
| Vitest | ✅ 162 tests in 12 files (up from 133) |
| Lint / build / contrast | ✅ / ✅ / ✅ 315 of 315 |
| Lighthouse accessibility | ✅ 100 on Invoice (mobile) and Contract (desktop) |
| Console / sideways scroll | ✅ 0 errors; no overflow on any of the 14 screenshots |

## Story coverage

| Story | Status |
|---|---|
| CL-2.1 Magic link | ✅ Opens the portal directly. `?expired=1` (or older than 7 days) shows "This link has expired" → **Send me a new link**, sent only to the email on file (masked on screen). Locked tabs before the deposit; Messages open. *A one-time code on a new device is backend work.* |
| CL-2.2 Review and customize | ✅ Package and inclusions, optional upgrades as checkboxes, a live total, Ask a question, Request changes (shown to the planner on the Proposal Builder), Review → Sign → Pay progress |
| CL-2.3 Sign | ✅ The contract with merge fields filled, Download PDF (print), e-sign consent, a **typed** signature by default or **drawn** ("Draw instead"); then "Last step: pay your deposit" |
| CL-2.4 Pay the deposit | ✅ Deposit and full schedule; Card / Apple Pay / Google Pay / ACH; autopay; check/cash instructions when payments aren't connected; a decline says "Nothing was charged" with Try again / Use another method; the planner is alerted after 2 failures; double taps are blocked twice over (busy button, and the store ignores a paid installment); "Your date is locked!" plus the receipt email |
| PL-3.3 Contract from template | ✅ Merge fields come from the accepted version and ticked upgrades; underlined, with "merge fields filled from proposal v2" |
| PL-3.4 Countersign | ✅ Dashboard alert → Countersign; the client's signature and timestamp; Deposit paid ✓; refused until paid; on countersign: Booked, hold released, checklist applied relative to the event date (never in the past), welcome email; Go to Event Hub / View invoice |
| PL-3.5 Invoice | ✅ Created when the client signs (schedule 30% now, 40% at 60 days, 30% at 14 days → Apr 13 and May 29); Record payment for Cash/Check/Venmo/Zelle/Cash App; Refund or credit (capped at what was paid); options for autopay, card fee, late fee (only if the contract allows), pause reminders; Send reminder (SMS template); failed-attempt notice |
| PL-4.1 Events list | ✅ Upcoming / Past / All, status filter, sorted by date, balance and open tasks, cards on phones, + New event, empty state |

## Wireframe vs build

| Screen | Notes |
|---|---|
| Portal › Proposal | Same layout. The "event photo" is a brand-colored banner with the event name, because there are no photo uploads until Files (Phase 4) |
| Portal › Contract | Not in the wireframe set as its own picture. Built from CL-2.3 and the same steps bar |
| Portal › Pay | Same. Card is the default; the demo card numbers are shown as a hint |
| Contract | Same three chips, agreement, Client / You boxes, and the after-countersigning block. The "You" box uses the same signature pad, prefilled with the planner's name |
| Invoice | Same blocks. The "Payments not connected" edge case shows as a banner with **Connect Stripe** |
| Events | Same filters and columns; the "Upcoming / Past / All" pills are a segmented control |

## Decisions

1. **The store mirrors `functions.sql` names:** the handler map in `actions/booking.js` lists them, ready to become Supabase RPC calls.
2. **The invoice is created at client signing, not at countersign,** so the deposit can be paid in the same sitting (as in the ERD design).
3. **Payment success is an action named for the webhook** (`payment/succeeded`). In production only the Stripe/Square webhook may call it; the Pay screen stands in for Stripe Checkout.
4. **For Phase 7:** the Contract page has a layout shift (CLS 0.19) while the script signature font loads. Fix: preload the font, or reserve the line height.

Screenshots: `qa/frontend/screens/phase-3/`.
