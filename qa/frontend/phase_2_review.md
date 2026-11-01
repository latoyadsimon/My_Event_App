# Phase 2 review: Leads and selling

**Branch:** `feature/frontend-phase-2` (stacked on phase 1) · **Status:** built straight through, as the owner asked; reviewed together before the backend

Phase 2 adds five screens: the Inquiry Form, Booking Page, Leads board, Lead Detail and Proposal Builder. It also adds the 🔔 new-lead push, the ✉ auto-reply, the ✉ consult confirmation and the ✉ proposal email.

## Passing conditions

| Condition | Result |
|---|---|
| New inquiry → auto-reply in the Outbox → consult booked → the lead is on the board | ✅ One Vitest test clicks the whole path (`leads.test.jsx`, "sends an inquiry…") |
| Rivera v2 totals $14,850, split $4,455 / $5,940 / $4,455 | ✅ `lib/proposal.test.js` and the Builder's summary test |
| Sending a version creates a proposal email whose link opens the portal | ✅ Sends v3, opens the email in the Outbox, and the demo switches to the client |
| Vitest | ✅ 133 tests in 10 files (up from 86) |
| Lint / build / contrast | ✅ / ✅ / ✅ 315 of 315 |
| Lighthouse accessibility | ✅ 100 on Leads (desktop), Proposal Builder (mobile), Booking Page (mobile) |
| Console | ✅ 0 errors |
| No sideways scroll at 375, 768 or 1280 | ✅ (fixed two causes, see below) |

## Story coverage

| Story | Status |
|---|---|
| CL-1.1 Inquiry without an account | ✅ All fields; "what happens next" after sending; auto-reply with **Pick a consult time** |
| PL-2.1 Inquiries become leads | ✅ Lead with every detail. The date is checked (the push says "⚠ date taken"), plus the push and a Dashboard alert (existing "New lead" alert) |
| PL-2.2 Leads board | ✅ 6 columns; card shows date, guests, budget, source; **Date taken** badge (Kim wants Acme's Dec 12); drag and drop **plus** a "Move to" menu on every card; source filter; empty board with Copy link; phones show stage tabs. Sending a proposal moves the card on its own |
| PL-2.3 Respond to a lead | ✅ Editable canned reply; Hold date 7 days (badge + release); Send booking link; when the date is taken, nearby open dates (same weekday) and **Insert into reply**; a notice when another lead holds the date; full activity log |
| PL-2.4 / CL-1.2 Consult booking | ✅ Weekdays only, after now, around appointments with a 15-minute buffer, up to 3 consults a day (rules in `business.booking`). Booking adds it to the calendar and Lead Detail, moves the lead to Consult booked, emails both people. **Add to calendar** downloads a real `.ics` file. A month with no times shows "See next month" |
| PL-2.5 Create proposal from the lead | ✅ Requested services become add-ons (chairs = guest count); name, date and guests are shown |
| PL-3.1 Build a proposal | ✅ Packages, add-ons with quantities, discount, 8% tax, live total and deposit; ◇ optional upgrades; gear check with **Reduce / Add partner rental / Override + note** |
| PL-3.2 Send and revise | ✅ Preview as client (the same `ProposalView` the portal will use); each send is a new version and old ones are kept; the change request is shown with "answered in v2"; "sent … · not opened yet" on Lead Detail |

## Wireframe vs build

| Screen | Notes |
|---|---|
| Inquiry Form | Same fields and order. "Not sure yet" is allowed for the date, so a prospect is never blocked |
| Booking Page | Same two-panel layout. It opens on the first open day (Fri Nov 6), because the wireframe's Nov 2 is in the past on our demo "today" |
| Leads | Same toolbar and columns. **Won and Lost show the newest 3** with "Show all 8". Otherwise Won (8 past events) made the board very long |
| Lead Detail | Same blocks. **Added:** a Contact card and "Mark as lost" (needed for the Lost column). Event details are editable and saved with **Save details** |
| Proposal Builder | Same: versions, change request, packages, add-ons table, edge case, summary with Preview / Send. **Added:** Save draft. Gear warnings advise, but don't block sending (the seed's v2 was sent with 140 chairs, as in the wireframe story) |

## Decisions and fixes

1. **The store is split by domain.** `src/store/actions/sales.js` holds Phase 2's handlers; `reducer.js` looks up unknown action types there. Shared helpers moved to `src/store/helpers.js`. Later phases add one file each.
2. **Pricing lives in one place:** `lib/proposal.js` (`priceVersion`, `gearWarnings`), mirroring `_recalc_proposal()` in `functions.sql`.
3. **The portal follows the client the email was for:** a message link can carry `clientId`. `ui.clientId` picks whose portal shows (Ana by default).
4. **Overflow fixes:**
   - The builder's grid columns needed `min-width: 0` at 375.
   - The visually hidden "Move … to" labels escaped the scrolling board at 768. The board is now `position: relative`.
5. **New shared pieces:** `Dialog` (non-destructive modal), `ProposalView`, `useShareInquiryForm` (also used by the Dashboard now).

Screenshots: `qa/frontend/screens/phase-2/` (1280 and 375).
