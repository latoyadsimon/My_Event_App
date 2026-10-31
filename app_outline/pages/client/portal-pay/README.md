# Portal › Pay

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Client (Host) · **Phase:** P1 · **Stories:** CL-2.4
**Route:** `Portal › Pay` · **URL:** `events.yourbiz.com/portal/pay` · **Wireframe snapshot:** Thu Nov 5, 4:14 PM

## Wireframe

Desktop, tablet and phone views plus design notes, cropped from `wireframes/wireframe.html`.

![Portal › Pay wireframe](wireframe.png)

## How you get here, and where you go next

- ⬅ **Arrives from:** Contract "Continue to payment" / 💬 payment reminder / Payments "Pay"
- ➡ **Next:** Pay → ✉ receipt + welcome → portal unlocks

## User stories

### CL-2.4 · Pay the deposit right after signing · P1

As a client, I want to pay my deposit on the same visit I sign so that my date is locked immediately.  
_Screens: Portal › Pay, ✉ Your date is locked · Events: payment.succeeded, payment.failed_  
- [ ] Shows the deposit and the full payment schedule
- [ ] Pay by card, Apple Pay, Google Pay or ACH; optional autopay for future payments
- [ ] If payments aren't connected: "pay by check/cash" instructions only
- [ ] Payment fails: plain-language error, "nothing was charged", [Try again] [Use another method]; planner alerted after 2 failures
- [ ] A double tap never charges twice (NFR-6)
- [ ] Success: "Your date is locked!", receipt email, portal unlocks, [Go to your portal]

## → System (backend jobs)

- → System (payment.succeeded): receipt email, planner alerted to countersign, portal unlocks. Planner alerted after 2 failures.

## Design notes

- Payments not connected? Only "pay by check/cash" shows here.

## Related pages

Pages that share a story with this one:

- [✉ Receipt + welcome](../../messages/email-receipt-welcome/)

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
