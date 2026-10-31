# Rivera Wedding Walkthrough — Phase 1 Wireframes

We walked the Rivera wedding (Sat Jun 12, 2027 · 120 guests) through every Phase 1 screen, in order, for every role. At each screen we asked two questions: *"How did I get here?"* and *"Where do I click next?"* A screen that can't answer both is a dead end.

Result: **15 issues found and fixed** in `wireframe.html`. Every screen now shows an **⬅ Arrives from** and a **➡ Next** line. An automated check confirms that every nav item, Event Hub tab and Guests sub-tab leads to a real screen.

## Decisions (made with the product owner)

| Question | Decision |
|---|---|
| When does the client pay the deposit? | **Right after signing**, on the same screen. The planner countersigns afterward; the event becomes Booked on countersign. |
| Can the planner countersign before the deposit is paid? | **No** (confirmed 2026-10-31, QA-009). Countersign is refused until the deposit is paid, or waived for a $0 deposit. `planner_countersign()` enforces it. |
| What does the portal show before the deposit? | Home / Guests / Approvals are **shown locked** ("Unlocks after your deposit"). Messages stays open. |
| Do we wireframe emails and texts? | **Yes, the key ones.** They are the links between screens. |
| Honeymoon fund in Phase 1 | **External link** (e.g. Honeyfund) set in Website & RSVP settings. The in-app fund is Phase 4. |
| Update `user_journeys.md`? | **Yes.** See "Doc changes" below. |

## Issues found → fixes

| # | Type | Problem | Fix |
|---|---|---|---|
| 1 | Dead end | Planner sidebar "Events" had no screen | New **Events list** |
| 2 | Dead end | No way for the planner to send invitations | New **Event Hub › Guests › Invitations** |
| 3 | Dead end | RSVP meals, plus-ones, cutoff and fund link came from nowhere | New **Event Hub › Guests › Website & RSVP** |
| 4 | Dead end | Emails and texts that move people between screens weren't drawn | 8 message frames: 🔔 new lead, ✉ auto-reply, ✉ proposal, ✉ receipt/welcome, 💬 payment reminder, 💬 invitation, ✉ RSVP confirmation, 💬 team invite |
| 5 | Dead end | "Fill questionnaire" action had no screen | New **Portal › Questionnaire**; planner sends it from Tasks; answers show on Event Hub Overview |
| 6 | Dead end | Client nav "Approvals" had no screen of its own | New **Portal › Approvals** (split out of Home) |
| 7 | Next step | Client contract had no step after signing | "✓ Signed! [ Continue to payment → ]" |
| 8 | Next step | Booking page had no confirmation | "✓ You're booked: Mon Nov 2, 2:00 PM · [ Add to calendar ]" |
| 9 | Next step | Planner couldn't see the client's "Request changes" | Proposal Builder shows versions (v1 sent · v2) and Ana's comment |
| 10 | Next step | Dashboard didn't prompt the countersign | Alert "Rivera signed + paid deposit [ Countersign ]" |
| 11 | Next step | No "Lock final headcount" action | Button + "after locking" state on Guests |
| 12 | Next step | Pay screens had no success state | "✓ Paid. Your date is locked! [ Go to your portal → ]" |
| 13 | Mismatch | Dates contradicted each other (consult Nov 2, signed Oct 30) | One timeline (below) used on every screen |
| 14 | Mismatch | Deposit timing: spec said "right after signing", journeys said "after countersign" | Decision above; wireframes and journeys doc now agree |
| 15 | Mismatch | Portal showed planning pages before booking; "Lee wedding" vs "Lee shower"; fund button pointed to a Phase 4 feature; staff tabs for Phase 2 screens | Locked nav items; edge case reworded; fund = external link; staff My Shifts / Day-of / Chat shown locked "Coming in Phase 2" |

## The Rivera timeline

| Date | What happens | Screen(s) |
|---|---|---|
| Wed Oct 28 | Ana submits inquiry → auto-reply → books consult | Inquiry Form, ✉ auto-reply, Booking Page, 🔔 new lead |
| Mon Nov 2 | Consult; planner sends proposal v1 | Lead Detail, Proposal Builder |
| Tue Nov 3 | Ana requests changes (photo magnets optional) | Portal › Proposal |
| Wed Nov 4 | Planner sends v2 | Proposal Builder, ✉ proposal email |
| Thu Nov 5, 4:12 PM | Ana accepts, signs, pays $4,455 deposit | Portal › Proposal → Contract → Pay, ✉ receipt |
| Thu Nov 5, evening | Planner countersigns → Booked | Dashboard alert, Contract, Invoice, Events list |
| Tue Nov 10 | Ana's portal opens; to-dos waiting | Portal › Home |
| Thu Nov 12 | Questionnaire submitted; save-the-date wording approved | Portal › Questionnaire, Approvals |
| Sat Nov 14 | Tasting | Messages |
| Sun Nov 15 | Save-the-dates sent | Invitations |
| Feb 2027 | RSVP settings configured; invitation wording approved Feb 20 | Website & RSVP, Approvals |
| Mon Mar 1 | Invitations sent | Invitations, 💬 invitation text |
| Apr 6 → Apr 12 | Payment 2 reminder → paid ($5,940) | 💬 reminder, Portal › Payments |
| Sat May 1 | RSVP cutoff | RSVP |
| Sat May 29 | Final payment due ($4,455) | Portal › Payments |
| Sat Jun 5 | Final headcount locked | Event Hub › Guests, Portal › Approvals |
| **Sat Jun 12** | **Wedding** | (Phase 2: Day-of Mode) |

Money check: $11,000 package + $2,750 add-ons + 8% tax = **$14,850** = $4,455 + $5,940 + $4,455.

## Doc changes in `app_outline/user_journeys.md`
- Planner Stage 3, steps 3–5: the client signs and pays in one sitting, then the planner countersigns.
- Client Stage 2, steps 3–4: the invoice is created at the client's signature; pay on the same sitting; portal pages locked until the deposit.
- Cross-role triggers: `contract.signed` split into `contract.client_signed` (invoice + deposit) and `contract.countersigned` (Booked, gear, checklist).
- Screen inventory, P1 row: added Events list, Guests › Invitations, Guests › Website & RSVP, Portal › Questionnaire.

## Round 3: gaps found while building `app_outline/pages/`

Building one folder per Phase 1 story turned up 5 stories with no screen. All 5 are now drawn, each with a way in:

| Story | New screen | How you get there |
|---|---|---|
| PL-3.6 | Event Hub › Reschedule | "Change date" button on Event Hub › Overview |
| PL-3.7 | Event Hub › Cancel | "Cancel event" button on Event Hub › Overview |
| CL-3.3 | Portal › Mood Board | New **Mood Board** item in the client portal menu (locked before the deposit) |
| CL-4.4 | Portal › Cancel or postpone | "Request a change" link on Portal › Payments |
| GU-4.1 | ✉ One week to go (+ day-before text) | Automatic, 1 week and 1 day before |

Cancel example (Apr 10, 63 days out): paid $10,395 − non-refundable deposit $4,455 − 50% of payment 2 ($2,970) = **$2,970 refund**. The policy used here is a placeholder until LaToya provides her real contract.

## Still open
- ~~`app_outline/user_stories.md` was a copy of the journeys doc.~~ Done: it now holds the real user stories, which include these decisions.
- Settings sections other than Team & roles reuse the Onboarding forms and aren't drawn separately.
- Calendar Week/Day views show the same data as Month and aren't drawn separately.
