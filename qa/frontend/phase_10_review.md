# Phase 10 review: Event day and wrap-up (product P2)

**Branch:** `feature/frontend-phase-10` (stacked on phase 9)

**Stories:**
- **Planner:** PL-7.1 Day-of Mode · PL-7.2 Live panels (P2) · PL-7.3 On-site sales · PL-7.4 Incident log · PL-7.5 Teardown gear check · PL-8.1 Close-out · PL-8.2 Final invoice and deposits · PL-8.5 Event report.
- **Staff:** ST-4.2 My role's day-of · ST-4.3 Door check-in · ST-4.7 Log an incident · ST-5.1 Gear check-in.
- **Guest and client:** GU-5.1 Check in · CL-5.1 Day-of info · CL-6.3 Final invoice.

## Passing conditions

| Condition | Result |
|---|---|
| Big-button now/next; tap to mark done | ✅ `/app/day-of/:eventId`, opened from the hub header in the final week. "Now" is the first item not done |
| Running late shifts the following times and tells the team + affected vendors | ✅ +5/+10/+15/+30. Items not done from "now" on move. Vendors with moved items get a "what changed" notice (to acknowledge), and the crew gets a team-chat alert |
| Works offline | ✅ The offline banner follows the browser's online state. Data is on the device (stand-in until a real offline store). Check-ins and incidents are append-only, so two phones can't double-count a household |
| Live panels (P2) | ✅ Checked in / expected, vendors arrived, incidents, on-site sales (money only with "See event budgets") |
| On-site sales: tap-to-pay, added to the invoice, permission-gated | ✅ Paid and added as its own invoice line, plus a receipt to the client. Sam (no "Take payments") is refused |
| Incident log with photos | ✅ Planner and staff. A staff incident pushes the planner |
| Teardown: scan gear back in; can't finish until missing items are listed | ✅ The confirm dialog names every item not back ("Report 6 missing and finish"), then the status moves to **Wrap-up** |
| Door check-in: QR/code or name, walk-ins, live count | ✅ The check-in code (e.g. `ACME-G1`) shows on the guest's RSVP confirmation (EN/ES). Search by name or code; party size; walk-ins are added already checked in |
| Staff day-of shows only my role | ✅ Coordinator: now/next, cues, vendor arrivals. Door: check-in. Setup/teardown: gear. Everyone: my timeline, incidents, chat. No event today → "No event today" + the next call sheet |
| Client day-of info; morning-of message | ✅ "Start event day" emails the client (start time, day-of contact) linking to **Portal › Day-of** (client-visible timeline, contacts, map, no tasks). It's in the portal menu from the final week |
| Final invoice: on-site add-ons + damage; security deposit release or apply | ✅ Wrap-up tab: add a damage charge (with a photo), "Pay damage from the deposit" (the rest is released), or release it. "Send final invoice" emails the itemized balance; the client pays in the portal |
| Close-out checklist; Status → Closed | ✅ Five items, each with "Fix this". **Close event** is disabled until all are done. The action refuses too |
| Event report | ✅ Revenue, collected, costs, profit (owner only), attendance (checked in / said yes / invited / walk-ins), on-site sales, damage, vendor arrivals, incidents |
| Tests | ✅ **351 in 25 files** (+12 store, +13 screen) |
| Lint, build, contrast, a11y | ✅ 0 / OK / 315 of 315 / Lighthouse 100 (Day-of on mobile, Wrap-up on desktop) |
| No sideways scroll · console errors | ✅ 375 and 1280 after two fixes (long "Done" label, tab text) · 0 |

Screenshots: `qa/frontend/screens/phase-10/`.

## Decisions
- **"Start event day" is a button** because the demo clock never reaches an event day. In production it starts in the morning by itself.
- **The countdown is shown as times** (Now · 9:30 AM, Next · 10:00 AM), not a ticking timer, for the same reason.
- **Extra charges are invoice lines.** On-site add-ons (paid) and damage (due) are extra lines on the same invoice, so balances, the portal and the Dashboard stay correct without a second invoice.
- **The Wrap-up tab** appears after teardown (and on closed events, for the report).
