All-in-One Event Planner App — User Journeys
Oct 30, 2026 · @LaToya
These journeys trace all six roles through every phase of the app, from first inquiry to post-event wrap-up, and are the blueprint for our screens, data model and test cases.
How to read this
Each role gets the same three levels, so you can zoom in as far as the task needs.
1. Stages (a table): the big moments in that role's relationship with the app, the goal at each, and which build phase it lands in. Use this to explain the product to anyone.
2. Steps (numbered lists): screen by screen, what the user sees and does, and what the system does in response. Use this to design screens and write user stories.
3. Edge cases (a table): what goes wrong or gets unusual, and how the app must respond. Use this to write acceptance criteria and test cases.
Conventions used throughout:
• Screen names are in code style, for example Event Hub › Guests. These become our route names and the screen inventory at the end.
• → System: marks something the app does automatically (a notification, a recalculation, a record created). Every one of these is a backend job or event handler we have to build.
• P1–P4 refer to the four build phases in the spec: P1 Core business, P2 Event operations, P3 Guest experience, P4 Growth.
• I use one running example where it helps: the Rivera wedding, 120 guests, with photo booth, karaoke and a honeymoon fund.
A tip from experience: when you pick up a ticket, find its step here first. If you can't find the step, the feature probably isn't designed yet, and that's a conversation to have before coding.
At a glance
The planner (highlighted) is active at every point; the other five roles join at specific moments, which is where their journeys below begin and end.
Planner (owner) journey
The planner touches every module, so this journey is the backbone; every other role's journey plugs into one of its stages.
Stages
#
Stage
Planner's goal
Key screens
Phase
1
Set up the business
Get branding, packages, payments and team in place once
Onboarding, Settings
P1
2
Capture the lead
Never miss an inquiry; respond fast
Leads, Inquiry Form
P1
3
Sell and book
Proposal → contract → deposit in one sitting
Proposal Builder, Contract, Invoice
P1
4
Plan the event
Tasks, vendors, budget, timeline, layout
Event Hub tabs
P1–P2, P4
5
Manage guests
Invites out, RSVPs in, headcount accurate
Guests, Invitation Designer, Potluck
P1–P3
6
Prepare logistics
Gear reserved and packed, staff scheduled
Equipment, Pack List, Staff Schedule
P2
7
Run the event
Everything on time, nothing forgotten
Day-of Mode, Booth, KJ Console
P2–P3
8
Wrap up
Get paid in full, gear back, reviews in
Close-out, Event Report
P2–P4
9
Grow
Repeat clients, referrals, insights
Dashboard, Reports, Marketing
P4
Steps
Stage 1 — Set up the business (first launch)
1. Sign Up: email or Google/Apple sign-in. → System: creates a tenant (business account) with the user as Owner.
2. Onboarding Wizard (skippable, resumable):
    1. Business name, logo, brand colors, custom domain (optional).
    2. Connect payments (Stripe/Square OAuth). Shows a "payments not connected" banner on the dashboard until done.
    3. Add service packages and add-ons with prices.
    4. Connect calendar (Google/Apple/Outlook).
    5. Invite staff by email/phone and set their roles.
    6. Pick starter templates: checklists, contract, invoice schedule per event type.
3. Lands on Dashboard with a "Getting started" checklist showing progress.
Stage 2 — Capture the lead
1. Prospect submits the Inquiry Form on the planner's website. → System: creates a Lead, checks calendar for the requested date, sends the prospect an auto-reply, pushes a notification to the planner.
2. Planner opens Leads (kanban: New, Contacted, Consult booked, Proposal sent, Won, Lost). Card shows date, event type, guest count, budget and a conflict badge if the date is taken.
3. Planner taps the lead → Lead Detail: send a canned reply, place a date hold (expires in X days), or send the booking link for a consult.
4. Consult booked through Public Booking Page. → System: adds to both calendars, sends reminders 24h and 1h before.
5. After the consult, planner taps Create Proposal. Lead data carries over; no retyping.
Stage 3 — Sell and book
1. Proposal Builder: pick a package, toggle add-ons (photo booth, karaoke, rentals), set quantities, discounts and tax. → System: checks equipment availability for each add-on on that date and warns if short.
2. Preview as client → Send. → System: emails the client a portal link; status becomes Proposal sent; tracks when it's opened.
3. Client accepts, signs and pays the deposit in one sitting (see Client journey). → System: generates the contract from the template with merge fields filled; when the client signs, creates the invoice with its payment schedule so the deposit can be paid on the same screen.
4. Deposit paid. → System: marks invoice partially paid, sends client a receipt and a welcome email with portal tour, and alerts the planner on the Dashboard: "signed + paid deposit, countersign now."
5. Planner reviews and countersigns in Contract. → System: creates the Event in status Booked, turns the hold into a confirmed booking, reserves the equipment, and applies the checklist template with due dates relative to the event date.
Stage 4 — Plan the event
1. Event Hub › Overview: status, countdown, balance due, RSVP progress, open tasks, next 3 deadlines.
2. Tasks: work the auto-generated checklist; assign tasks to staff, client or vendor; reorder; add custom tasks.
3. Vendors: add vendors from the directory; send each a vendor portal invite (see Vendor journey); track contract and COI.
4. Budget: estimated vs. actual by category; attach vendor invoices; see profit.
5. Timeline: build the run-of-show from a template; set owners and visibility (client/vendor/staff).
6. Floor Plan (P4): upload venue plan, set scale, drag tables and stations; Seating drags guests to seats.
7. Files and Mood Board: share with client, collect comments and approvals.
8. Messages: one thread per event with the client; separate threads per vendor.
Stage 5 — Manage guests
1. Guests: import CSV/contacts or let the client add guests; group into households; set plus-ones.
2. Invitation Designer (P3; P1 uses a simple branded template): choose design, edit text, preview on phone.
3. Send save-the-dates, then invitations by email/SMS/link. → System: tracks delivered, opened, responded.
4. Watch Guests dashboard: responses, meal counts, dietary flags. Tap Remind non-responders.
5. Enable Potluck or Donations modules for the event if needed and set slot targets or fund goals.
6. Lock the final headcount on the client's approval. → System: sends final numbers to caterer, updates seating and potluck targets.
Stage 6 — Prepare logistics
1. Staff Schedule: create shifts (setup, service, teardown) with roles. → System: notifies staff to accept.
2. Equipment › Reservations: confirm reserved kits; resolve shortages by adding a vendor rental.
3. Pack List: auto-built; planner adds extras. Day before: staff scan items into the van.
4. Booth and KJ setup: choose photo overlay template, print limits, magnet count, karaoke content filter. Download event data to tablets for offline use.
5. Final Week status. → System: sends final details to client, vendors, staff and guests.
Stage 7 — Run the event
1. Day-of Mode: now/next timeline, check off cues, "running late" shifts times and alerts the team.
2. Monitor live panels: checked-in guests, booth sessions and prints, karaoke queue length, donation total.
3. Handle on-site sales with tap-to-pay (extra karaoke hour, extra prints). → System: adds to invoice.
4. Log incidents with photos.
5. Teardown: scan gear back in; app flags anything missing before leaving.
Stage 8 — Wrap up
1. Close-out checklist appears the morning after.
2. Final invoice and any damage charges sent; security deposit released.
3. Approve staff hours → payroll export. Pay vendors.
4. → System: sends guest thank-yous with gallery link, client review request after 3 days, feedback survey.
5. Event Report: revenue, costs, profit, attendance, booth and karaoke stats, donations. Status → Closed.
Stage 9 — Grow
1. Dashboard and Reports: booked vs. collected by month, lead sources, best-selling add-ons, gear utilization.
2. Marketing: anniversary and birthday reminders trigger rebooking emails.
3. Save a great event as a template for next time.
Edge cases
Situation
What the app does
Inquiry for a date that's already booked
Lead card shows a red conflict badge; suggested reply offers nearby open dates.
Two leads want the same date
First signed contract wins; the other hold auto-expires and the planner is prompted to notify that lead.
Proposal includes more gear than owned
Warning at the line item; options: reduce quantity, add partner rental, or override with a note.
Event date changes after booking
Reschedule wizard: checks calendar, staff and gear for the new date; shifts every relative due date and payment date; notifies everyone affected; logs the change.
Client cancels
Cancellation flow applies the contract's policy (refund amount calculated), releases gear and staff, cancels reminders, archives the event.
Planner deletes something by mistake
Soft delete with 30-day restore; destructive actions ask for confirmation.
Payments not connected
Proposals can still be sent, but the deposit step shows "pay by check/cash" only and a banner prompts setup.
Planner on two devices editing the same event
Last-write-wins per field with an "updated by X just now" toast; timeline and seating use locking while dragging.
Owner leaves the business / transfers ownership
Ownership transfer flow requiring re-authentication of both people.
Client (host) journey
The client lives in a web portal reached by magic link; their main feelings are excitement and worry about money and details, so the portal should always answer "what's next and what do I owe?"
Stages
#
Stage
Client's goal
Key screens
Phase
1
Inquire
Find out if the planner is available and affordable
Inquiry Form, Public Booking Page
P1
2
Decide and book
Understand the offer, sign, pay deposit
Portal › Proposal, Contract, Pay
P1
3
Plan together
Share ideas, approve choices, add guests
Portal › Home, Mood Board, Guests, Approvals
P1–P4
4
Pay over time
Keep on track without surprises
Portal › Payments
P1
5
Event day
Enjoy it; know who to contact
Portal › Day-of Info
P2
6
Relive and wrap
Photos, thank-yous, final bill, review
Gallery, Thank-you Tracker, Review
P3–P4
Steps
Stage 1 — Inquire
1. Fills the Inquiry Form (no account). Sees a confirmation page with "what happens next." → System: auto-reply email.
2. Gets a reply with a booking link; picks a consult slot on Public Booking Page. → System: calendar invite + reminders.
Stage 2 — Decide and book
1. Email: "Your proposal from [Business]" → magic link opens Portal › Proposal (no password).
2. Reviews packages with photos; ticks optional upgrades; total updates live. Can ask a question in-line (opens Messages).
3. Taps Accept. → Contract: reads, types/draws signature, agrees to e-sign consent. → System: stores signed PDF, creates the invoice and payment schedule, notifies planner to countersign.
4. Pay (right after signing, same sitting): sees deposit amount and the full schedule; pays by card/Apple Pay/ACH, or chooses autopay. → System: receipt email; portal unlocks the planning area. Before the deposit, Home, Guests and Approvals are shown locked ("Unlocks after your deposit"); Messages stays open.
5. First portal visit shows a 3-screen tour and a prompt to set up a password or passkey (optional).
Stage 3 — Plan together
1. Portal › Home: countdown, next payment, items needing their action (badge count), recent messages.
2. Fills questionnaires sent by the planner. → System: answers populate event fields.
3. Mood Board: uploads photos, pastes Pinterest links, comments on planner's ideas.
4. Guests: adds guests (manual or CSV), groups households, sets plus-ones; sees RSVP stats. Optional co-host invite (e.g. partner or parent) with the same or limited access.
5. Approves invitation design and wording → planner sends.
6. Approvals: menu, floor plan, seating chart, timeline, final headcount. Each has Approve / Request changes with comment. → System: logs who approved what and when.
7. Chooses photo booth overlay and magnet frame from options; submits karaoke do-not-play list and must-play songs.
8. If potluck or fund is enabled: sees sign-ups and fund totals.
Stage 4 — Pay over time
1. Reminder 7 days and 1 day before each due date. Link opens Pay directly.
2. Can pay ahead or pay the full balance early.
3. Adds an upgrade mid-planning (e.g. +1 hour karaoke). → System: change order created; client approves; invoice updated.
Stage 5 — Event day
1. Morning-of message: arrival time for the couple/host, day-of contact, link to live gallery.
2. Portal › Day-of Info: timeline (client version), contacts. No tasks; the app should stay out of their way.
Stage 6 — Relive and wrap
1. Day after: "Your gallery is ready" → Gallery with booth photos, magnets scans, guest uploads; download all.
2. Thank-you Tracker: list of guests with gifts noted; mark thank-you sent.
3. Receives final invoice for on-site add-ons or damages; pays.
4. Review request with one-tap links; feedback survey.
5. Months later: anniversary/birthday email offering to book again.
Edge cases
Situation
What the app does
Magic link expired or forwarded
Link expires in 7 days; requesting a new one sends it only to the email on file. Forwarded links prompt a one-time code.
Client wants changes to the proposal
Request changes with comment; planner gets a new version; versions are kept and the client always sees the current one.
Signature on a phone with small screen
Typed signature option; landscape draw mode.
Payment fails
Clear error in plain language, retry, try another method; planner notified after 2 failures.
Client misses a payment
Reminders at +1 and +7 days; late fee applied only if the contract allows it; planner can pause.
Two hosts disagree (co-host approves, other requests changes)
Approvals show both names; planner decides; nothing auto-proceeds on conflicting responses.
Client uploads a guest CSV with bad rows
Import preview shows errors per row (missing name, bad email), fixes inline, imports only valid rows.
Client wants to cancel or postpone
Request from portal; planner handles via the reschedule/cancel flow; client sees policy and refund estimate first.
Guest journey
Guests are our largest and least patient audience: no account, no app download, phone-first, and every extra tap loses some of them. Each guest has a unique token in their invite link so we know who they are without a login.
Stages
#
Stage
Guest's goal
Key screens
Phase
1
Get invited
Know what, when, where
Invitation, Event Website
P1 (basic), P3 (designed)
2
Respond
RSVP quickly, tell meal and needs
RSVP
P1
3
Contribute
Sign up for a dish, give a gift or donation, buy a ticket
Potluck, Fund, Tickets
P2–P4
4
Get ready
Reminders, directions, what to bring
Reminder messages, Event Website
P1
5
Attend
Check in, photo booth, karaoke, find seat
Check-in, Booth, Song Request, Find My Seat
P2–P4
6
Remember
Get photos, share, say thanks
Gallery, thank-you message
P3
Steps
Stage 1 — Get invited
1. Receives a text or email (or scans a QR on a paper invite or flyer). Message preview shows host names and event title.
2. Opens Invitation (P3: animated envelope and music, with a skip button). Taps View details & RSVP.
3. Event Website: date, time, map, dress code, schedule, hotel block, FAQ, registry/fund link, add-to-calendar.
Stage 2 — Respond
1. RSVP: name prefilled from the token; household members listed with Attending / Not attending toggles.
2. Plus-one: name field appears only if allowed.
3. Meal choice and dietary/allergy notes per attendee; song request; custom questions.
4. Submit → confirmation screen with add-to-calendar and "Want to bring a dish?" / "Contribute to the fund?" links if enabled. → System: updates headcount, meal counts, seating pool, potluck targets; notifies host if set; confirmation email/text.
5. Can change the RSVP until the cutoff date via the same link.
Stage 3 — Contribute
1. Potluck (P2): sees categories with filled/needed counts; picks a slot; enters dish name, servings, diet tags. Duplicate warning if the same dish exists. → System: reminder schedule set.
2. Fund / Donate (P4): suggested amounts, optional message, cover-fees checkbox, Apple/Google Pay. → System: receipt; adds to thermometer total; message saved for the host.
3. Tickets (P4, public events): choose tier, quantity, promo code, pay → QR ticket in email/wallet.
4. Volunteer slots (P2): pick a shift.
Stage 4 — Get ready
1. One week out: reminder with directions, parking, dress code, potluck drop-off time.
2. Day before: reminder; potluck contributors get "bring it hot/cold" note.
Stage 5 — Attend
1. Check-in (P2): shows QR from email or gives name at the door. Staff scans. → System: marks attended; walk-ins added.
2. Find My Seat (P4): enter name → table number and map.
3. Photo booth (P3): taps Start on the kiosk, poses, picks share method (text, email, QR). Prints come out.
4. Photo magnets (P3): scans QR at the magnet station to submit a phone photo, or is photographed by roaming staff; picks up the magnet.
5. Karaoke (P3): scans table QR → Song Request: search, pick song, enter name, join duet. Sees place in line. → System: text when 2 singers away.
6. Live donations (P4): scans table QR to give or bid in the silent auction; sees thermometer on the big screen.
7. Live gallery: sees photos appear on the TV slideshow.
Stage 6 — Remember
1. Day after: thank-you message from the host with gallery link.
2. Gallery: views, downloads their own photos, uploads their phone photos, posts a recipe if potluck.
3. Optional feedback survey (one question, star rating).
Edge cases
Situation
What the app does
Guest forwards their invite link
RSVP still tied to the original guest; host can see a "responded from a forwarded link" flag. Option for the host to require name verification.
Guest not on the list (public link)
For public events, RSVP form asks for name and contact and creates a guest. For private events, "Ask the host" message instead.
Guest RSVPs after the cutoff
Shows "RSVPs are closed" with a message-the-host option; host can allow late RSVPs.
Plus-one count exceeded
Form prevents adding more than allowed; explains politely.
Guest has no smartphone
Every step has a fallback: paper invite with phone number, staff check-in by name, booth prints, KJ can add requests manually.
Allergies flagged
Shown prominently to caterer and on potluck dish labels; never dropped on import/export.
Duplicate potluck dish
Warning with suggestion of under-filled categories; guest can still proceed.
Photo booth guest doesn't want photos shared
Share step is opt-in; "Don't show on slideshow" toggle; attendant can hide any photo.
Karaoke request blocked by content filter
Song shows as unavailable without shaming; suggest clean version if one exists.
Minors at the event
No data capture from guests marked as children; booth email capture disabled for them; gallery privacy defaults to private for kids' parties.
Language
Guest pages show in the guest's browser language when we support it (English/Spanish first), with a toggle.
Staff journey
Staff use the mobile app mostly on event days, often in a loud, dark room with bad signal, so their screens need big buttons, few choices and full offline support.
Stages
#
Stage
Staff member's goal
Key screens
Phase
1
Join the team
Get access with no fuss
Invite, Profile
P1
2
Get scheduled
See and accept shifts
My Shifts, Availability
P2
3
Prepare
Know where, when, what to wear and bring
Call Sheet, Pack List
P2
4
Work the event
Do their role well
Day-of Mode, Check-in, Booth Attendant, KJ Console
P2–P3
5
Close out
Gear back, hours in, get paid
Gear Check-in, Timesheet
P2
Steps
Stage 1 — Join the team
1. Receives an invite text/email → downloads the app → signs in with phone number (SMS code). → System: links them to the business with the role the owner set.
2. Profile: photo, emergency contact, skills (KJ, booth, bartending), shirt size.
Stage 2 — Get scheduled
1. Availability: marks days available/unavailable; recurring rules.
2. Push notification: "New shift: Rivera wedding, Sat, 2–11 PM, Photo booth attendant." → Shift Detail: Accept / Decline. → System: planner notified; if declined, planner sees open shift.
3. Can request a swap with another qualified staff member; planner approves.
Stage 3 — Prepare
1. My Shifts lists upcoming shifts. Day-before reminder.
2. Call Sheet: address with map and parking, arrival time, dress code, on-site contact, their duties, their part of the timeline.
3. Assigned packers open Pack List and scan items into the van. → System: items marked checked-out; missing items flagged to planner.
4. App prompts: "Download event for offline use" (auto on Wi-Fi).
Stage 4 — Work the event
1. Arrives → Clock in (GPS confirms they're at the venue).
2. Day-of Mode shows only their role's view:
    ◦ Coordinator: full now/next timeline, cue check-offs, vendor arrivals, incident log.
    ◦ Door staff: Check-in scanner and name search, walk-in add, attendance count.
    ◦ Booth attendant: Booth Attendant panel: unlock kiosk, print queue, reprint, paper/ink levels, hide photo from slideshow, magnet queue (pick, crop, print).
    ◦ KJ: KJ Console (see below).
3. Team chat and push alerts from coordinator; voice notes.
4. Logs incidents with photos.
KJ Console flow
1. Opens console → sets event filter (clean only, banned list from client) → starts background music.
2. Requests arrive in the queue from guest phones; KJ adds paper/verbal requests manually.
3. Fair rotation orders the queue; KJ drags to adjust, bumps the birthday person.
4. Taps Next singer: "Now singing" screen updates; song loads with key/tempo controls; next guest gets a text.
5. Marks no-shows (moved to end once, then removed).
6. Runs a contest: opens judge scoring, shows results.
Stage 5 — Close out
1. Teardown: Gear Check-in scan; app lists anything not scanned before they can mark teardown done.
2. Clock out; adds notes (breaks, mileage).
3. Timesheet: sees hours pending → approved → paid.
Edge cases
Situation
What the app does
No signal at the venue
Everything works offline; changes queue and sync later; a clear offline indicator. Check-in from two devices offline is merged by guest ID.
Staff forgets to clock in/out
Reminder push at shift start/end; manual time request needing planner approval.
GPS doesn't match venue
Allow clock-in with a reason; flag for planner.
Staff no-show
Planner alerted 15 minutes after shift start; one-tap to message qualified available staff.
Printer jams or runs out of paper
Booth pauses printing, shows attendant alert; queue holds; inventory updated with remaining stock.
Tablet battery dies mid-event
Data is local + synced; another device can pick up the booth or KJ session by signing in.
Staff should not see financials
Role permissions hide money everywhere except tap-to-pay screen if granted.
Staff member leaves the company
Owner deactivates; their sessions are revoked instantly; history kept for payroll.
Vendor journey
Vendors (caterer, DJ, florist, venue) are busy people who use many planners' systems, so their portal must be quick, need no account, and show only their part of the event.
Stages
#
Stage
Vendor's goal
Key screens
Phase
1
Get added
Accept the booking, share paperwork
Vendor Invite, Vendor Profile
P2
2
Coordinate
Know times, headcount, layout, contacts
Vendor Portal › Event
P2
3
Event day
Arrive, set up, check in
Vendor Portal › Day-of
P2
4
Get paid
Invoice and receive payment
Vendor Portal › Payments
P2
Steps
1. Planner adds vendor to an event → vendor gets email/text with magic link.
2. Vendor Profile (first time only): company info, contacts, upload COI with expiry date, W-9 (US), payment details.
3. Vendor Portal › Event: their timeline items (load-in, service, teardown), venue info, final headcount and meal counts (caterer), floor plan with their area highlighted, client-approved notes (e.g. florist sees mood board), contacts.
4. Uploads their contract and invoice; confirms booking. → System: planner notified; vendor appears as Confirmed.
5. Receives updates when headcount, timeline or layout changes, with a "what changed" summary. Taps Acknowledge. → System: planner sees acknowledgement.
6. Messages planner in their own thread (clients never see vendor threads unless planner shares).
7. Event day: Day-of shows load-in door and on-site contact; taps I've arrived (or staff marks them).
8. Payment recorded by planner or paid through the app (P4). → System: vendor receipt.
9. After event: planner rates vendor privately; vendor gets photos featuring their work if planner shares.
Edge cases
Situation
What the app does
COI missing or expiring before event
Red flag on the event's vendor list; reminders to vendor 30 and 7 days before.
Headcount changes after vendor's cutoff
Change is sent with a "past your cutoff" warning; vendor must acknowledge; planner sees if not acknowledged.
Vendor cancels
Planner alerted; directory suggests other vendors in that category available on the date.
Vendor not acknowledging updates
Escalating reminders; planner sees a yellow badge until acknowledged.
Vendor works with the same planner often
Profile and documents are reused across events; only event-specific items are requested.
Sensitive info
Vendors never see prices the client pays, other vendors' costs, or guest contact details (only names, meals, allergies where needed).
Donor and sponsor journey
Donors arrive from a link or a table QR code, often mid-event and mid-emotion, so giving must take under 30 seconds and the receipt must be correct for taxes. This whole module is P4.
Stages
#
Stage
Donor's goal
Key screens
1
Discover
Understand the cause and the ask
Donate Page, Sponsor Page
2
Give
Donate, bid or sponsor fast
Donate, Auction, Paddle Raise, Sponsor Checkout
3
Be recognized
See their impact; get credit if wanted
Thermometer screen, sponsor wall
4
Receipt and follow-up
Tax receipt, updates, give again
Email receipt, Donor History
Steps
Donor
1. Opens Donate Page from an invitation, social post or table QR: cause story, goal and progress, suggested amounts.
2. Picks amount or enters custom; optional recurring monthly; optional dedication ("in memory of"); anonymity toggle; cover-fees checkbox.
3. Pays with Apple/Google Pay or card (name and email required for the receipt). → System: thermometer updates in real time; donor appears on the recognition screen unless anonymous.
4. Receipt by email with the organization's name, tax ID, amount and the deductible portion (ticket value subtracted when applicable).
5. Silent auction: browses items with photos, enters a bid with card on file; gets texts when outbid; winners notified at close and charged automatically.
6. Paddle raise: host announces a level; donors tap the matching amount on their phone; screen shows names live.
7. Thank-you email after the event with total raised and impact message; year-end giving summary for recurring donors.
Sponsor
1. Opens Sponsor Page: tiers with benefits (logo on screen, table, mention).
2. Picks tier → Sponsor Checkout: company info, logo upload, invoice or pay now.
3. → System: logo goes to the sponsor wall and slideshow after planner approval; planner gets tasks for each benefit (e.g. reserve table).
Edge cases
Situation
What the app does
Donation for a non-501(c)(3) (e.g. honeymoon fund)
Receipt says gift, not tax-deductible; no tax wording anywhere.
Card declined during auction close
Winner gets a payment link; after 24h, item offered to next-highest bidder at planner's choice.
Bid war in final seconds
Optional soft close: auction extends 2 minutes after a late bid.
Duplicate donation (double tap)
Idempotency key on payment; second charge prevented; donor shown one confirmation.
Donor wants a refund
Planner-initiated refund; receipt voided and reissued.
Inappropriate name or message on the live screen
Messages are moderated before showing; attendant can hide instantly.
Recurring donor's card expires
Card updater where supported; otherwise email with update link.
Cross-role triggers
The app's real value is that one person's action updates everyone else, so each row below is a domain event we publish and the handlers that subscribe to it. Build these as an event bus (e.g. a job queue), not as code buried inside screens.
Trigger (who does what)
Domain event
Who is affected and how
Prospect submits inquiry
lead.created
Planner: push + dashboard card. Calendar: conflict check. Prospect: auto-reply.
Client accepts proposal
proposal.accepted
Contract generated; planner asked to countersign.
Client signs contract
contract.client_signed
Signed PDF stored; invoice + payment schedule created; deposit step shown to client; planner asked to countersign.
Planner countersigns
contract.countersigned
Event created/booked; hold becomes booking; equipment reserved; checklist applied.
Payment succeeds
payment.succeeded
Invoice balance; client receipt; planner notified; dashboard revenue.
Payment fails
payment.failed
Client retry prompt; planner alert after 2 failures.
Event date changes
event.rescheduled
All relative task and payment dates shift; staff, gear and vendors rechecked; everyone notified.
Guest RSVPs or edits RSVP
rsvp.updated
Headcount, meal counts, seating pool, potluck targets; client sees stats; caterer sees counts after lock.
Final headcount approved
headcount.locked
Vendors notified with change summary; seating finalized; RSVPs closed.
Guest signs up for potluck
potluck.claimed
Slot counts; duplicate check; reminders scheduled; equipment flags (outlet, warmer).
Shift assigned / declined
shift.assigned / shift.declined
Staff push; planner sees open shifts.
Gear scanned out / in
equipment.checked_out / .checked_in
Inventory location; missing items flagged; maintenance counters.
Booth prints
booth.printed
Print count vs. package limit; consumables stock; reorder alert.
Booth photo taken
photo.created
Live slideshow (unless hidden); gallery; guest share.
Song requested
karaoke.requested
KJ queue; guest place-in-line; text when 2 away.
Donation / bid made
donation.created / bid.placed
Thermometer; recognition screen; outbid texts; receipts.
Timeline item marked late
timeline.delayed
Following items shift; team push; vendors with affected items notified.
Event marked complete
event.completed
Close-out checklist; thank-you emails; review request scheduled; gallery published.
The rule of thumb: if a step in a journey says "→ System," there should be a row here. If you add one, add the row too.
System-wide edge cases
These cut across every journey; solve each once, in shared code, rather than per screen.
Area
Situation
Required behavior
Offline
Device loses connection
Local database is the source of truth on-device; writes queue with timestamps; clear offline banner; sync on reconnect.
Offline
Two devices change the same record offline
Merge by field; append-only records (check-ins, prints, song requests) never conflict; true conflicts show to the planner to resolve.
Payments
Webhook arrives late or twice
Webhooks are idempotent; payment status comes from the processor, never from the client app.
Payments
Refund or dispute (chargeback)
Invoice updated; planner alerted with evidence pack (signed contract, receipts).
Auth
Magic link opened on a different device
One-time code to the email/phone on file.
Auth
Lost phone (staff or owner)
Owner revokes sessions remotely; passkey/2FA required for owner.
Permissions
A role tries to open a screen it can't see
Server-side checks on every request, not just hidden buttons; friendly "no access" page.
Multi-tenant
Data from one business visible to another
Every query scoped by tenant ID; automated tests for cross-tenant access.
Time zones
Destination event in another time zone
Event stores its own time zone; times shown in event time with the viewer's local time on hover.
Messaging
Email bounces or SMS opt-out (STOP)
Mark contact undeliverable; honor opt-outs; show the planner who didn't receive it.
Data
Guest or client asks to delete their data
Deletion request flow; keep only what's legally required (payment records).
Data
Large imports (1,000+ guests)
Background job with progress bar; no timeouts.
Performance
300 guests scan the karaoke QR at once
Guest pages are lightweight and cached; queue writes are rate-limited per device.
Accessibility
Screen reader or large text users
All guest and client flows meet WCAG 2.1 AA.
Errors
Anything unexpected
Plain-language message, a retry, no lost input, and the error logged with context for us.
Screen inventory and next steps
The journeys above name about 50 screens across four surfaces; this table is our build checklist.
Phase
Planner (web + mobile)
Staff (mobile)
Client / Vendor (web portal)
Guest / Donor (mobile web)
P1
Sign Up, Onboarding Wizard, Dashboard, Leads, Lead Detail, Proposal Builder, Contract, Invoice, Events list, Event Hub (Overview, Tasks, Guests, Guests › Invitations, Guests › Website & RSVP, Money, Files, Messages), Calendar, Settings
Invite, Profile
Portal › Home, Proposal, Contract, Pay, Payments, Guests, Approvals, Questionnaire, Messages
Inquiry Form, Public Booking Page, Invitation (basic), Event Website, RSVP
P2
Vendors, Budget, Timeline, Staff Schedule, Equipment, Reservations, Pack List, Day-of Mode, Close-out, Event Report
My Shifts, Availability, Shift Detail, Call Sheet, Pack List, Day-of Mode, Check-in, Gear Check-in, Timesheet
Vendor Profile, Vendor Portal (Event, Day-of, Payments), Portal › Day-of Info
Potluck, volunteer slots
P3
Invitation Designer, Booth Setup, KJ Setup
Booth kiosk, Booth Attendant, KJ Console
Gallery, Thank-you Tracker
Invitation (designed), Song Request, Gallery, live slideshow
P4
Floor Plan, Seating, Reports, Marketing, Rental Store admin
—
Review, Sponsor Page
Donate Page, Auction, Paddle Raise, Tickets, Find My Seat, Sponsor Checkout
How we turn this into work
[ ] Turn each numbered step into a user story: "As a [role], I want [step] so that [stage goal]."
[ ] Turn each edge-case row into acceptance criteria on the matching story.
[ ] Turn each cross-role trigger into a backend event and handler ticket.
[ ] Sketch low-fidelity wireframes for the P1 screens and click through the Rivera wedding end to end before coding.
[ ] Draft the data model from the nouns in these journeys (Tenant, User, Role, Lead, Event, Proposal, Contract, Invoice, Payment, Guest, Household, RSVP, Task, Vendor, Shift, Equipment, Reservation, Photo, SongRequest, Donation).
[ ] Review this doc with the planner and mark anything they'd change.