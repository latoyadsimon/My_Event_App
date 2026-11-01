# Phase 8 review: Logistics (product P2) and the vendor's page

**Branch:** `feature/frontend-phase-8` (stacked on phase 7)
**Stories:** PL-4.9 Budget · PL-4.10 Vendors on an event · PL-4.11 Run-of-show · PL-6.2 Equipment reservations · PL-6.3 Pack list · PL-6.5 Final week · VN-1 to VN-8 (VN-7 = record a payment, P2)

## Passing conditions

| Condition | Result |
|---|---|
| Vendors: directory, magic-link invite, status, contract, money, arrival, COI | ✅ Acme shows HCC confirmed, DJ Rhythm “COI expires before the event” (Dec 1 < Dec 12), Petal & Stem “COI missing”. Adding a vendor sends `/v/<token>`, opens a private thread and a budget line |
| Vendor cancels → alert + other vendors in that category free on the date | ✅ Dashboard alert, and “Book Austin Sound Co.” moves their timeline items and budget line to the replacement |
| Run-of-show: template, owner/location/cue, visibility per item, vendors only see their own, printable | ✅ 11 Acme items; “Preview as” Client / Staff / each vendor; `/print/events/acme/run-of-show`; Patel builds from the General template around 1 PM |
| Budget: estimated vs. actual, vendor invoices attached; profit owner-only | ✅ Money tab: $6,300 actual of $6,825 estimated; profit = price − vendors − staff hours − gear wear (owner only; Devon sees the budget, not profit) |
| Gear: kits reserve every piece; availability with a turnaround buffer; shortages fixed by a partner rental | ✅ 150 chairs vs. 120 owned → “Short 30” → “Rent 30 from Austin Party Rentals”. A booking the day before takes the item (1-day buffer). Countersigning Rivera reserves the booth kit, karaoke kit and 140 chairs |
| Pack list: reserved gear + always-bring + extras; missing flagged | ✅ 17 rows for Acme (only the 120 chairs we own); tick packed, add extras; “missing” status shows a red notice (staff scanning arrives with the staff app) |
| Final week sends final details to client, vendors, staff, guests | ✅ Overview › Logistics › Start final week (confirm): client email, 3 vendor emails, Devon + Sam texts, attending guests’ one-week reminder |
| Vendor page: first-visit profile reused; my part only; confirm; acknowledge changes (past cutoff); arrived; paperwork; payments; own thread | ✅ `/v/v-acme-petal` asks once for COI + W-9; caterers see meals and allergies, others don’t; no client prices anywhere. Headcount lock, timeline moves, reschedule and cancel send “What changed” notices |
| Tests | ✅ **304 tests in 21 files** (+17 store, +24 screen). `testTimeout` raised to 15 s: whole-app tests timed out only when 21 files ran in parallel on a loaded machine |
| Lint, build, contrast | ✅ 0 lint errors; build OK (main 442 kB, no size warning); contrast 315/315 |
| Lighthouse accessibility | ✅ 100: Logistics › Run of show, Vendors (desktop), vendor page (mobile) |
| No sideways scroll at 375 / 1280 | ✅ after wrapping the print table in a scroll box |
| Console errors / dead links | ✅ 0 / 0 (crawl of the new pages) |

Screenshots: `qa/frontend/screens/phase-8/` (1280 and 375).

## Decisions and deviations

- **One Logistics tab** with sub-tabs (Run of show · Vendors · Gear & pack list), like Guests. Ten top-level tabs would scroll on every screen.
- **Run-of-show order = time order.** “Moving” an item is changing its time, which is keyboard-friendly and needs no drag. The NFR-11 “lock while dragging” needs real-time presence and waits for Supabase Realtime.
- **The vendor role** is new in “Viewing as” (Hill Country Catering). The vendor page needs no role (the link is the key), like guest pages.
- **Event-day buttons** (“I’ve arrived”) work any day in the demo, because the demo clock never reaches an event day.
- **Scheduled sends** (COI reminders 30 and 7 days out, escalating acknowledgment reminders) have buttons now. Real scheduling waits for the backend.
- **Staff hours** in profit come from assigned shifts, which arrive in Phase 9 (staff app). Until then they are $0.

## Stand-ins to replace later
- File uploads (COI, W-9, contracts) keep only the file name.
- Vendor payout “in the app” (VN-7, P4).
- Label scanning (staff app).
- Insurance and acknowledgment reminders on a schedule.
