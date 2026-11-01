# Phase 16 review: Tickets, floor plan and seating (product P4, part 2)

**Branch:** `feature/frontend-phase-16` (stacked on phase 15)

**Stories:** GU-3.4 Buy tickets · PL-4.12 Floor plan and seating · GU-5.2 Find my seat. Also: NFR-11 (lock while dragging), the ticket part of DN-2, ticket check-in at the door.

**Seeded:**
- **Acme ballroom** (96 × 64 ft): 15 tables, stage, dance floor, KJ, booth, buffet, bar, exits, outlets. 8 households seated. Marcus and Alicia are flagged "don't seat near" and sit together at table 3.
- **Hope dinner tickets:** Dinner $15 · Patron $100 ($85 deductible) · Kids free. Promo `CHOIR` 20% off.

## Passing conditions

| Condition | Result |
|---|---|
| Tiers, quantity, promo code, capacity, waitlist | ✅ `/e/<event>/tickets` (EN/ES, linked from the event site). It won't sell past a tier's capacity; sold out → waitlist |
| QR ticket by email/wallet | ✅ One real QR per ticket on the page; the email links back to the order (`?o=`). Wallet passes are a stand-in |
| A double tap buys once | ✅ An order key, as with donations |
| Patron tickets: only the part above the dinner's value is deductible | ✅ The ticket email states it (charity funds only) |
| Ticket check-in at the door | ✅ Day-of › Door finds tickets by QR code or holder name; a used ticket says so |
| Floor plan: upload the venue plan as background, set the scale | ✅ Room width/depth in feet; an uploaded image sits behind the grid |
| Drag tables, dance floor, stage, buffet, booth, KJ, outlets, exits | ✅ Pointer drag (checked in a real browser: the table follows the mouse), snapped to ½ ft and kept inside the room. **Keyboard:** focus an object, then arrow keys (Shift = 5 ft) |
| Seat guests; flags for "don't seat near", meals and allergies per table | ✅ "Seat at…" menu for every unseated household (works everywhere), or drag a name onto a table with a mouse. Each table shows people/seats; the inspector shows meals, allergies, conflicts and over-capacity, with **Unseat** and **Flag "don't seat near"**. Tables won't overfill |
| Printable escort cards, table numbers, place cards | ✅ `/print/events/<event>/seating` with three layouts |
| Locked while someone is dragging (NFR-11) | ✅ Dragging sets `lockedBy`; others see "Devon is moving things on the plan" and can't drag. It unlocks on release |
| Find my seat on my phone | ✅ `/e/<event>/seat`: name → "Table 9" with the table lit on a mini map; EN/ES |
| Live panel + report | ✅ "Tickets in: used / sold"; tickets line in the event report |
| Tests | ✅ **458 in 37 files** (+10 store, +8 screen) |
| Lint, build, contrast, a11y, scroll, console | ✅ 0 / OK (app chunk 297 kB) / 315 of 315 / Lighthouse 100 (seating editor, ticket page on mobile) / none at 375 or 1280 / 0 |

## Notes
- **Real-time locking:** today it lives in the shared demo store. With Supabase it becomes a presence channel, so two planners on two laptops see each other's lock.
- **One table per household:** seating is by household, matching the guest list; a party sits together.

Screenshots: `qa/frontend/screens/phase-16/`.
