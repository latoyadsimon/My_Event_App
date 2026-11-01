# Phase 15 review: Fundraising (product P4, part 1)

**Branch:** `feature/frontend-phase-15` (stacked on phase 14)

**Stories:**
- PL-5.6 (fund module, P4) · GU-3.3 Give to a fund.
- DN-1 Donate in under 30 seconds · DN-2 Correct receipt · DN-3 Silent auction · DN-4 Paddle raise · DN-5 Recurring giving · DN-6 Sponsor checkout · DN-7 Recognition screen.
- CL-3.8 (fund totals, P4) · PL-7.2 (donation total) · PL-8.5 (donations in the report).

**Seeded:**
- **Hope Church potluck** (public site): the *Fellowship hall roof* fund (a 501(c)(3), $25k goal), 4 auction items, a paddle raise and sponsor tiers.
- **Garza wedding:** a *Honeymoon in Oaxaca* gift fund.
- **Westlake gala (past):** paddle gifts for the reports phase.

## Passing conditions

| Condition | Result |
|---|---|
| Cause story, goal and progress; suggested or custom amount; monthly; dedication; anonymous; cover fees | ✅ `/e/<event>/give`. "Give: Fellowship hall roof" from the event website; EN/ES |
| Apple Pay / Google Pay / card; name and email for the receipt | ✅ Stand-ins for the wallets; the button needs a name and email |
| Double tap never charges twice; one confirmation | ✅ Each form makes one idempotency key; a second submit with it is ignored (store + screen test with `dblClick`) |
| Receipt: org, tax ID, amount, deductible part (minus value received) | ✅ Charity funds only. Auction wins count the item's value as received (a $160 bid on a $400 quilt: $0 deductible) |
| Gift funds: "gift, not tax-deductible", no tax wording anywhere | ✅ Page, receipt email and planner list (tested: no "tax ID"/"deductible amount" in the email) |
| Refunds are planner-initiated; the receipt is voided and reissued | ✅ Fundraising › Gifts › Refund (confirm) → "Void (refunded)" + a "receipt is void" email |
| Recurring: thank-you with total; year-end summary; expired card → update link | ✅ Monthly gifts are marked. "Card expired" → **Send update link**. **Send year-end summaries** (one per donor, deductible total for charities) |
| Auction: photos, bid with card on file, outbid texts | ✅ Register once (name, mobile, card), bid from the phone; the previous leader gets a text |
| Soft close extends 2 minutes after a late bid | ✅ Per item (tested at 1:29 PM → closes 1:31) |
| Winners charged automatically; declined card → payment link; after 24h offer to the next bidder | ✅ Close the auction (confirm). Linda's card declines in the seed → link + "Offer to the next bidder" |
| Paddle raise: tap the announced amount; names live unless anonymous | ✅ The planner calls a level; guests see "Pledge $250"; the screen hides anonymous names |
| Sponsors: tiers with benefits, company + logo, invoice or pay now; logo after approval; a task per benefit | ✅ Tier limits shown ("2 left"). The planner approves the logo and marks invoices paid; benefits land on the event's Tasks |
| Recognition screen: thermometer, names, moderated messages, hide instantly | ✅ `/screen/giving/<event>` with a QR to give. Messages wait in "Messages waiting for approval"; **Hide now** takes one off |
| Client sees fund total and messages | ✅ Portal › Guests (Garza: "Honeymoon in Oaxaca · $150.00 of $5,000.00") |
| Live panel + report | ✅ "Raised" in Day-of; fundraising line in the event report |
| Tests | ✅ **440 in 35 files** (+15 store, +9 screen). Three clean runs. One earlier run reported 48 "skipped" while another process was busy; it didn't repeat, but I'm watching for it |
| Lint, build, contrast, a11y, scroll, console | ✅ 0 / OK (app chunk 286 kB) / 315 of 315 / Lighthouse 100 (give on mobile, Fundraising tab, recognition screen) / none at 375 or 1280 / 0 |

## Stand-ins
- **Payments:** wallets and cards don't charge real money. Processor webhooks, card updaters and real refunds come with Stripe (SYS-3).
- **Card on file:** a bidder's card is stored as its last 4 digits.

Screenshots: `qa/frontend/screens/phase-15/`.
