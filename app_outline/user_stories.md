All-in-One Event Planner App — User Stories
Oct 31, 2026 · built from user_journeys.md, product_spec.md and the Rivera walkthrough (wireframes/walkthrough_rivera.md)

How to use this doc
Every story comes from a numbered step in user_journeys.md, and its acceptance criteria come from that journey's edge-case table. If you pick up a ticket and can't find its story here, the feature isn't designed yet. Talk to the planner before coding.

Format
• ID · title · phase. IDs are ROLE-STAGE.NUMBER, e.g. PL-3.4 = Planner, Stage 3, story 4. Prefixes: PL Planner, CL Client, GU Guest, ST Staff, VN Vendor, DN Donor/Sponsor, SYS backend, NFR non-functional (applies everywhere).
• "As a [role], I want [step] so that [stage goal]."
• Screens: the route names from the wireframes (wireframes/wireframe.html). Events: the domain events from the Cross-role triggers table.
• Acceptance criteria: checkboxes. A story is done when every box is true and tested.
• P1–P4 = build phases. P1 stories have the most detail because we build them first; later phases get refined before they start.

Definition of Done (every story)
[ ] Acceptance criteria pass, with automated tests for each
[ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
[ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
[ ] Every query scoped by tenant (NFR-2)
[ ] Plain-language errors with retry; no lost input (NFR-12)
[ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)

Running example: the Rivera wedding, Sat Jun 12, 2027 · 120 guests · Gold package $11,000 + add-ons $2,750 + 8% tax = $14,850 · schedule $4,455 / $5,940 / $4,455.


═══════════════════════════════════════
PLANNER (OWNER)
═══════════════════════════════════════

Stage 1 — Set up the business

PL-1.1 · Sign up and create my business account · P1
Page: pages/planner/sign-up/
As a planner, I want to sign up with email, Google or Apple so that my business has its own account in the app.
Screens: Sign Up · Events: tenant created
[ ] Sign up works with email + password, Google, or Apple
[ ] Creates a new tenant (business account) with me as Owner
[ ] An email that already has an account shows "Log in" and "Reset password" instead of an error dead end
[ ] Owner must set up a passkey or 2FA before seeing money or settings
[ ] Lands on the Onboarding Wizard

PL-1.2 · Business profile and branding · P1
Page: pages/planner/onboarding/
As a planner, I want to enter my business name, logo, brand colors and (optionally) a custom domain so that everything clients and guests see carries my brand.
Screens: Onboarding Wizard step 1, Settings › Business / Branding
[ ] Name, logo upload, brand colors, optional custom domain (e.g. events.mybusiness.com)
[ ] Branding appears on all client, guest, vendor and donor pages
[ ] The wizard is skippable and resumable; progress saves after each step

PL-1.3 · Connect payments · P1
Page: pages/planner/onboarding/
As a planner, I want to connect Stripe or Square so that clients can pay me online.
Screens: Onboarding Wizard step 2, Settings › Payments
[ ] Connect via Stripe or Square OAuth; card numbers never touch our servers
[ ] Until connected, the Dashboard shows a "Payments not connected" banner with [Connect now]
[ ] Proposals can still be sent without payments; the deposit step offers "pay by check/cash" only

PL-1.4 · Service packages and add-ons · P1
Page: pages/planner/onboarding/
As a planner, I want to set up my packages and add-ons with prices and photos so that I can build proposals in minutes.
Screens: Onboarding Wizard step 3, Settings › Packages
[ ] Create, edit and archive packages (e.g. Silver / Gold / Platinum) with price, description and photos
[ ] Create add-ons with unit price and quantity (photo booth hours, chairs…)
[ ] Add-ons can be linked to equipment so availability can be checked (see PL-3.1)

PL-1.5 · Connect my calendar · P1
Page: pages/planner/onboarding/
As a planner, I want two-way sync with Google, Apple/iCloud or Outlook so that I never double-book myself.
Screens: Onboarding Wizard step 4, Settings › Calendar sync
[ ] Events, holds and consults appear in my external calendar
[ ] Busy times from my external calendar block my public booking page

PL-1.6 · Invite staff and set permissions · P1
Page: pages/planner/settings/
As a planner, I want to invite staff and choose exactly what each person can see so that my team gets access without seeing what they shouldn't.
Screens: Settings › Team & roles · Events: staff invite text
[ ] Invite by email or phone; the invite sets a role (coordinator, KJ, booth attendant, server, bartender)
[ ] Per-person toggles: see event budgets, see profit margins, take payments, edit vendors
[ ] Staff never see financials unless granted; profit is owner-only
[ ] [Deactivate] revokes the person's sessions immediately and keeps their history for payroll

PL-1.7 · Starter templates · P1
Page: pages/planner/onboarding/
As a planner, I want starter checklists, contract and invoice-schedule templates per event type so that new events set themselves up.
Screens: Onboarding Wizard step 6, Settings › Templates
[ ] Pick starter templates per event type (wedding, birthday, shower, corporate, fundraiser…)
[ ] Edit templates later; changes apply to new events only
[ ] Message templates (auto-reply, canned replies, reminders) are editable here too

PL-1.8 · Getting-started checklist · P1
Page: pages/planner/dashboard/
As a new planner, I want a checklist on my Dashboard so that I know what setup is left.
Screens: Dashboard
[ ] Shows until done: add packages, connect payments, share inquiry form
[ ] Each item links to the screen that completes it

PL-1.9 · Transfer ownership · not yet phased
As an owner leaving the business, I want to transfer ownership so that the business keeps running.
[ ] Both people must re-authenticate to complete the transfer
[ ] The old owner becomes a regular user or is removed; history kept


Stage 2 — Capture the lead

PL-2.1 · New inquiries become leads automatically · P1
Page: pages/messages/push-new-lead/, pages/messages/email-inquiry-auto-reply/
As a planner, I want every inquiry form submission to become a lead automatically so that I never miss an inquiry.
Screens: Inquiry Form (client), 🔔 New lead push, Leads · Events: lead.created
[ ] A lead is created with event type, date, guest count, budget, services and source
[ ] The requested date is checked against my calendar
[ ] The prospect gets the auto-reply email with my booking link
[ ] I get a push notification and a Dashboard card; tapping either opens Lead Detail

PL-2.2 · Leads board · P1
Page: pages/planner/leads/
As a planner, I want my leads on a kanban board so that I can see where every prospect stands.
Screens: Leads
[ ] Columns: New, Contacted, Consult booked, Proposal sent, Won, Lost
[ ] Card shows date, event type, guest count, budget and source
[ ] A red "Date taken" badge shows if the requested date is already booked
[ ] Drag cards between columns; cards also move automatically (proposal sent → Proposal sent; contract signed → Won)
[ ] Filter by source (referral, Instagram, Google, The Knot…)
[ ] Empty board says "Share your inquiry form" with [Copy link]
[ ] Phone shows one column at a time with stage tabs

PL-2.3 · Respond to a lead · P1
Page: pages/planner/lead-detail/
As a planner, I want to reply, hold the date, or send my booking link from the lead so that I respond fast.
Screens: Lead Detail, Calendar
[ ] [Send canned reply] opens an editable template before sending
[ ] [Hold date] soft-holds the date for X days (shown dashed on the Calendar) and auto-expires
[ ] [Send booking link] emails the public booking page link
[ ] If the date is taken: suggested reply offers nearby open dates I can insert
[ ] Two leads want the same date: the first signed contract wins; the other hold expires and I'm prompted to notify that lead
[ ] Activity log shows every message, hold and booking

PL-2.4 · Consult booking · P1
Page: pages/client/booking-page/
As a planner, I want prospects to book a consult on my public availability page so that scheduling takes no back-and-forth.
Screens: Public Booking Page
[ ] Shows only open slots, respecting buffer times, daily limits and external calendar busy times
[ ] Booking adds the consult to both calendars and to Lead Detail; lead moves to "Consult booked"
[ ] Reminders go to both people 24 hours and 1 hour before

PL-2.5 · Create a proposal from the lead · P1
Page: pages/planner/lead-detail/
As a planner, I want [Create Proposal] to carry over the lead's details so that I never retype.
Screens: Lead Detail → Proposal Builder
[ ] Client name, contact, event type, date, guest count and requested services are prefilled


Stage 3 — Sell and book

PL-3.1 · Build a proposal · P1
Page: pages/planner/proposal-builder/
As a planner, I want to build a proposal from my packages and add-ons so that a quote takes minutes.
Screens: Proposal Builder · Events: equipment availability check
[ ] Pick a package; toggle add-ons and set quantities; apply discounts; tax calculated by location
[ ] Mark add-ons as "optional upgrade" so the client can tick them in the portal
[ ] Live total and deposit amount update as I edit
[ ] Each add-on is checked against equipment availability on the event date
[ ] If I quote more than I own (e.g. 140 chairs, own 120): warning on that line with [Reduce] [Add partner rental] [Override + note]

PL-3.2 · Send a proposal and handle changes · P1
Page: pages/planner/proposal-builder/, pages/messages/email-proposal/
As a planner, I want to preview, send and revise proposals so that the client always sees the right version.
Screens: Proposal Builder, ✉ Proposal email (client) · Events: proposal sent, proposal opened
[ ] [Preview as client] shows exactly what the client will see
[ ] [Send] emails a magic link; lead moves to "Proposal sent"; I can see when it was opened
[ ] Client change requests appear on the proposal with their comment
[ ] Each send creates a new version (v1, v2…); old versions are kept; the client always sees the latest

PL-3.3 · Contract generated from my template · P1
Page: pages/planner/contract/
As a planner, I want the contract created automatically when the client accepts so that I don't draft it by hand.
Events: proposal.accepted
[ ] Generated from my contract template with merge fields filled (names, date, venue, price, deposit, cancellation policy)
[ ] Merge fields come from the accepted proposal version

PL-3.4 · Countersign after the client signs and pays · P1
Page: pages/planner/contract/
As a planner, I want to countersign once the client has signed and paid the deposit so that the event is officially booked.
Screens: Dashboard alert, Contract (countersign) · Events: contract.countersigned
[ ] Dashboard alert "[Client] signed + paid deposit → [Countersign]" appears as soon as both happen
[ ] Contract shows client signature, timestamp and "Deposit paid ✓"
[ ] Countersign is refused until the deposit is paid (or waived for a $0 deposit), with a plain-language message
[ ] Countersigning: event status → Booked, hold → confirmed booking, equipment reserved, checklist applied with due dates relative to the event date
[ ] Signed PDF is stored with timestamps for both parties
[ ] After countersigning: [Go to Event Hub] and [View invoice]

PL-3.5 · Invoice and payment schedule · P1
Page: pages/planner/invoice/
As a planner, I want an invoice and payment schedule created from the signed proposal so that I get paid on time without chasing.
Screens: Invoice · Events: contract.client_signed, payment.succeeded, payment.failed
[ ] Created when the client signs (so they can pay the deposit right away), with the schedule from my template (e.g. 30% / 40% at 60 days / 30% at 14 days)
[ ] Payment status comes only from Stripe/Square webhooks, never from the browser
[ ] [Record payment] for cash, check, Venmo, Zelle, Cash App
[ ] Refunds, partial refunds and credits
[ ] Options: pass card fee to client; late fee (only if the contract allows); client autopay
[ ] Automatic reminders 7 days and 1 day before each due date, and +1 / +7 days after a missed one; I can pause them
[ ] I'm alerted after 2 failed payment attempts

PL-3.6 · Reschedule an event · P1
Page: pages/planner/reschedule-event/
As a planner, I want a reschedule wizard so that moving a date doesn't break anything.
Events: event.rescheduled
[ ] Checks my calendar, staff and gear for the new date before confirming
[ ] Shifts every relative task due date and payment date
[ ] Notifies everyone affected; logs the change on the event

PL-3.7 · Cancel an event · P1
Page: pages/planner/cancel-event/
As a planner, I want a cancellation flow so that the contract's policy is applied correctly.
[ ] Calculates the refund from the contract's cancellation policy and shows it before confirming
[ ] Releases gear and staff, cancels reminders, archives the event


Stage 4 — Plan the event

PL-4.1 · Events list · P1
Page: pages/planner/events-list/
As a planner, I want a list of all my events so that I can open any Event Hub quickly.
Screens: Events
[ ] Filters: Upcoming / Past / All, and by status
[ ] Columns: event, date, status, balance due, open tasks; phone shows cards
[ ] Tap → Event Hub › Overview
[ ] [+ New event] for events that didn't come from a lead
[ ] Empty state explains events are created when a contract is signed

PL-4.2 · Event Hub overview · P1
Page: pages/planner/event-hub-overview/
As a planner, I want one overview per event so that I see its health at a glance.
Screens: Event Hub › Overview
[ ] Status (Inquiry → Proposal → Booked → In planning → Final week → Event day → Wrap-up → Closed), countdown, balance due, RSVP progress, open/late tasks, next 3 deadlines
[ ] Questionnaire status and pending approvals with links
[ ] Venue with map, load-in notes, Wi-Fi
[ ] Tabs: Overview, Tasks, Guests, Money, Files, Messages (Phase 2+ tabs slot in later)

PL-4.3 · Tasks and checklists · P1
Page: pages/planner/event-hub-tasks/
As a planner, I want an auto-generated checklist I can assign so that nothing falls through the cracks.
Screens: Event Hub › Tasks
[ ] Checklist from the event-type template, with due dates relative to the event ("30 days before")
[ ] Assign to me, a staff member, the client or a vendor; subtasks; attachments; reorder; add custom tasks
[ ] Client-assigned tasks appear in the client's "Needs your action"
[ ] Due-date reminders; late tasks flagged
[ ] Due dates recalculate if the event date moves (PL-3.6)

PL-4.4 · Send questionnaires · P1
Page: pages/planner/event-hub-tasks/
As a planner, I want to send questionnaires at set points so that client answers fill in the event for me.
Screens: Event Hub › Tasks [Send], Portal › Questionnaire (client)
[ ] Send from a task, or automatically at a set point (e.g. "Wedding details" 90 days out)
[ ] Client answers populate event fields; the task is marked done; Overview shows "received"

PL-4.5 · Files and mood board · P1
Page: pages/planner/event-hub-files/
As a planner, I want to share files and a mood board with my client so that we agree on the look.
Screens: Event Hub › Files
[ ] Upload files; mark each Shared (client sees it) or Private
[ ] Mood boards with uploads, Pinterest links, color palette and theme notes; client can comment
[ ] [Request approval] sends the item to Portal › Approvals

PL-4.6 · Messages · P1
Page: pages/planner/event-hub-messages/
As a planner, I want one thread per event with the client and one per vendor so that conversations stay organized.
Screens: Event Hub › Messages
[ ] Client never sees vendor threads unless I share them
[ ] Attach files; send a change order from the thread
[ ] If a message bounces or the recipient texted STOP, I see who didn't receive it and by which channel

PL-4.7 · Money tab · P1
Page: pages/planner/event-hub-money/
As a planner, I want each event's money in one place so that I know what's collected and what's due.
Screens: Event Hub › Money
[ ] Client price, collected, balance due, payment list, [Open invoice]
[ ] Estimated profit is owner-only
[ ] Hidden from staff unless granted (PL-1.6)

PL-4.8 · Calendar · P1
Page: pages/planner/calendar/
As a planner, I want a calendar of everything so that I can plan my weeks.
Screens: Calendar
[ ] Month, week, day and list views (list is the phone default); color-coded by event type and status
[ ] Holds shown dashed with time left; they auto-expire
[ ] Warnings when I or a staff member is double-booked, or travel time between venues is too short
[ ] Tap an event → Event Hub; tap a hold → Lead Detail

PL-4.9 · Budget · P2
As a planner, I want estimated vs. actual costs by category so that I protect my margin.
[ ] Categories with estimated and actual; vendor invoices attach to a category
[ ] Profit view: client price minus vendor costs, staff hours and gear wear (owner-only)

PL-4.10 · Vendors on an event · P2
As a planner, I want to add vendors from my directory and invite them to their portal so that they know their part.
[ ] Add from the directory (category, rates, contacts, ratings, past events)
[ ] Sends the vendor a magic-link invite (VN-1)
[ ] Shows contract status, payment due, arrival time, COI status
[ ] COI missing or expiring before the event: red flag; reminders to the vendor 30 and 7 days before
[ ] Vendor cancels: I'm alerted and shown other vendors in that category available on the date

PL-4.11 · Run-of-show timeline · P2
As a planner, I want a minute-by-minute timeline with owners so that event day runs on time.
[ ] Build from a template; each item has time, owner, location and cue notes
[ ] Visibility per item: client / vendor / staff (vendors see only their items)
[ ] Printable one-page version; feeds Day-of Mode (PL-7.1)
[ ] Locked while someone is dragging items (NFR-11)

PL-4.12 · Floor plan and seating · P4
As a planner, I want a drag-and-drop floor plan and seating chart so that layout and seating are clear to everyone.
[ ] Upload venue plan as background and set the scale; drag tables, dance floor, stage, buffet, booth, KJ station, outlets, exits
[ ] Drag guests to seats; flags for "don't seat near", meals and allergies per table
[ ] Printable escort cards, table numbers and place cards


Stage 5 — Manage guests

PL-5.1 · Guest list · P1
Page: pages/planner/event-hub-guests/
As a planner, I want a live guest list so that headcount, meals and allergies are always accurate.
Screens: Event Hub › Guests › Guest list · Events: rsvp.updated
[ ] Import from CSV/Excel, phone contacts or Google Contacts; the client can add guests too (CL-3.4)
[ ] Group into households; set plus-ones per household
[ ] Tags (family, work, VIP, kids…), notes and gift tracking
[ ] Live counts: attending / declined / maybe / no reply, and meal counts; allergies shown prominently and never dropped on import/export
[ ] [Remind non-responders] sends a one-tap reminder
[ ] Imports of 1,000+ rows run in the background with a progress bar (NFR-8)

PL-5.2 · Event website and RSVP settings · P1
Page: pages/planner/event-hub-website-rsvp/
As a planner, I want to set up the event website and RSVP form so that guests see the right details and questions.
Screens: Event Hub › Guests › Website & RSVP
[ ] Toggle sections: schedule, dress code, hotel block, FAQ; add a registry or fund link (opens in a new tab; in-app funds are P4)
[ ] RSVP cutoff date; meal options; allergies/dietary question; song request; custom questions
[ ] Default plus-ones per household (override per household in the Guest list)
[ ] Privacy: private link, password, or public
[ ] Option to allow late RSVPs after the cutoff
[ ] [Preview as guest] opens the Event Website

PL-5.3 · Send invitations · P1 (simple template) / P3 (designer)
Page: pages/planner/event-hub-invitations/, pages/messages/sms-invitation/
As a planner, I want to send save-the-dates and invitations by email, text or link so that guests get invited without paper chaos.
Screens: Event Hub › Guests › Invitations, 💬 Invitation (guest)
[ ] Types: save-the-date, invitation, reminder, thank-you, all from the same design
[ ] P1: one simple branded template with editable wording; P3: full Invitation Designer (PL-5.5)
[ ] [Request client approval] sends the wording to Portal › Approvals; shows "Approved by [name] · date"
[ ] Channels: email, SMS, shareable link + QR (for print and social); WhatsApp later
[ ] Audience: everyone not yet invited, or a selection; send now or schedule
[ ] Tracking per guest: delivered, opened, responded
[ ] Bounced emails and STOP opt-outs listed with [See who]
[ ] Automatic "one week to go" reminder with directions, parking and dress code

PL-5.4 · Lock the final headcount · P1
Page: pages/planner/event-hub-guests/
As a planner, I want to lock the headcount once the client approves it so that vendors get final numbers.
Screens: Event Hub › Guests, Portal › Approvals · Events: headcount.locked
[ ] [Lock final headcount] is available once the client approves the final headcount
[ ] Locking closes RSVPs, finalizes counts, and notifies vendors with a change summary
[ ] Locked state shows who approved it and when

PL-5.5 · Invitation designer · P3
As a planner, I want a full invitation designer so that invitations look beautiful.
[ ] Template gallery by event type plus my branded templates; edit fonts, colors, photos, wording
[ ] Optional animated envelope and music, always with a Skip button
[ ] Print-ready PDF with a QR code to the online RSVP

PL-5.6 · Turn on potluck or fund modules · P2 / P4
As a planner, I want to enable the potluck organizer or a donation fund per event so that only relevant features appear.
[ ] Potluck (P2): set slot categories; targets auto-scale with headcount
[ ] Fund/donations (P4): set goal, suggested amounts, and whether gifts are tax-deductible


Stage 6 — Prepare logistics (P2)

PL-6.1 · Staff shifts · P2
As a planner, I want to create shifts with roles and assign staff so that the event is fully staffed.
Events: shift.assigned, shift.declined
[ ] Shifts per event (setup, service, teardown) with roles
[ ] Only staff with the right skills and availability are suggested
[ ] Staff accept or decline in the app; declined shifts show as open
[ ] Approve staff swap requests
[ ] Staff no-show: alert 15 minutes after shift start with one tap to message available qualified staff

PL-6.2 · Equipment reservations · P2
As a planner, I want gear reserved to the event automatically so that nothing is double-booked.
[ ] Reserving a kit reserves every piece in it
[ ] Available quantity by date includes a cleaning/turnaround buffer
[ ] Shortages resolved by adding a partner rental

PL-6.3 · Pack list · P2
As a planner, I want an auto-built pack list so that we leave with everything.
[ ] Built from reserved gear plus "always bring" items; I can add extras
[ ] Staff scan items into the van (ST-3.2); missing items flagged to me

PL-6.4 · Booth and KJ setup · P3
As a planner, I want to configure the photo booth and karaoke before the event so that they run themselves.
[ ] Booth: overlay template, print limits, copies per session, magnet count
[ ] KJ: content filter (clean only, explicit blocked), client's do-not-play list
[ ] [Download for offline] puts all event data on the tablets

PL-6.5 · Final week · P2
As a planner, I want the "Final week" status to send final details to everyone so that nobody is surprised.
[ ] Moving to Final week sends final details to client, vendors, staff and guests


Stage 7 — Run the event

PL-7.1 · Day-of Mode · P2
As a planner, I want a big-button now/next view so that I run the event from my phone.
[ ] Now / next items with countdowns; tap to mark done
[ ] [Running late] shifts following times and notifies the team and affected vendors (timeline.delayed)
[ ] Works fully offline (NFR-4)

PL-7.2 · Live panels · P2–P4
As a planner, I want live numbers during the event so that I can react fast.
[ ] Checked-in guests (P2), booth sessions and prints (P3), karaoke queue length (P3), donation total (P4)

PL-7.3 · On-site sales · P2
As a planner, I want tap-to-pay on my phone for add-ons so that I can sell an extra hour on the spot.
[ ] Tap-to-pay; the charge is added to the invoice
[ ] Staff can use it only if granted (PL-1.6)

PL-7.4 · Incident log · P2
As a planner, I want to log incidents with photos so that I have records for insurance.
[ ] Description, time, photos; available offline

PL-7.5 · Teardown gear check · P2
As a planner, I want missing gear flagged before we leave so that nothing is lost.
Events: equipment.checked_in
[ ] Scan gear back in; anything not scanned is listed before teardown can be marked done


Stage 8 — Wrap up

PL-8.1 · Close-out checklist · P2
As a planner, I want a close-out checklist the morning after so that every loose end gets tied.
Events: event.completed
[ ] Final invoice paid, security deposit released, gear checked in, staff hours approved, vendor payments sent

PL-8.2 · Final invoice and deposits · P2
As a planner, I want to send the final invoice and release or charge the security deposit so that the money closes cleanly.
[ ] On-site add-ons and damage charges added to the final invoice
[ ] Damage reports with photos can be billed from the security deposit; otherwise it's released

PL-8.3 · Staff hours and vendor payouts · P2
As a planner, I want to approve hours and pay vendors so that everyone gets paid.
[ ] Approve timesheets → payroll export; record vendor payments

PL-8.4 · Automatic follow-ups · P3 / P4
As a planner, I want thank-yous, review requests and surveys sent automatically so that I get reviews without effort.
[ ] Guest thank-you with gallery link (P3)
[ ] Client review request 3 days later with Google, Yelp, The Knot, WeddingWire links (P4)
[ ] Feedback survey to client and guests (P4)

PL-8.5 · Event report · P2
As a planner, I want an event report so that I know how the event did.
[ ] Revenue, costs, profit, attendance; booth/karaoke stats (P3) and donations (P4) when used
[ ] Status → Closed


Stage 9 — Grow (P4)

PL-9.1 · Business reports · P4
As a planner, I want business reports so that I make better decisions.
[ ] Booked vs. collected by month, lead sources, best-selling add-ons, gear utilization; sales tax by location; QuickBooks sync

PL-9.2 · Marketing reminders · P4
As a planner, I want anniversary and birthday reminders sent to past clients so that they book again.
[ ] Opt-in lists only; e.g. "Your baby's first birthday is in 2 months"

PL-9.3 · Duplicate an event or save as template · P4
As a planner, I want to reuse a great event so that the next one starts ahead.
[ ] Duplicate an event; save it as a template with tasks, timeline and packages


═══════════════════════════════════════
CLIENT (HOST)
═══════════════════════════════════════

Stage 1 — Inquire

CL-1.1 · Send an inquiry without an account · P1
Page: pages/client/inquiry-form/, pages/messages/email-inquiry-auto-reply/
As a prospective client, I want to send my event details through a simple form so that I find out if the planner is available.
Screens: Inquiry Form, ✉ Inquiry auto-reply
[ ] No account; works on the planner's website, Instagram and Facebook
[ ] Fields: name, email, phone, event type, date, guest count, budget range, services, how they heard, notes
[ ] Confirmation explains "what happens next"
[ ] Auto-reply email arrives with a [Pick a consult time] link

CL-1.2 · Book a consult · P1
Page: pages/client/booking-page/
As a prospective client, I want to pick a consult time myself so that I don't wait for emails.
Screens: Public Booking Page
[ ] See open slots; book with name and email
[ ] Confirmation with [Add to calendar]; confirmation email and reminders 24h and 1h before
[ ] No open times this week → [See next week]


Stage 2 — Decide and book

CL-2.1 · Open my proposal with a magic link · P1
Page: pages/client/portal-proposal/, pages/messages/email-proposal/
As a client, I want to open my proposal from an email link with no password so that it's easy.
Screens: ✉ Your proposal, Portal › Proposal
[ ] The link opens the portal directly; it expires in 7 days
[ ] An expired link offers [Send me a new link], which goes only to the email on file
[ ] A forwarded link or new device asks for a one-time code sent to the email/phone on file
[ ] Before the deposit, Home / Guests / Approvals show as locked ("Unlocks after your deposit"); Messages is open

CL-2.2 · Review and customize the proposal · P1
Page: pages/client/portal-proposal/
As a client, I want to see what's included and tick optional upgrades so that I understand the offer.
Screens: Portal › Proposal
[ ] Package photos and inclusions; included add-ons; optional upgrades as checkboxes
[ ] Total (with tax) updates live as I tick upgrades
[ ] [Ask a question] opens Messages
[ ] [Request changes] with a comment sends it to the planner; I always see the latest version
[ ] Progress shown: Review → Sign → Pay deposit

CL-2.3 · Sign the contract · P1
Page: pages/client/portal-contract/
As a client, I want to e-sign the contract on any device so that booking takes minutes.
Screens: Portal › Contract · Events: contract.client_signed
[ ] Read the contract; [Download PDF]; agree to e-sign consent
[ ] Typed signature (default on phones) or drawn signature (landscape draw mode on phones)
[ ] After signing: "✓ Signed! Last step: pay your deposit" with [Continue to payment]

CL-2.4 · Pay the deposit right after signing · P1
Page: pages/client/portal-pay/, pages/messages/email-receipt-welcome/
As a client, I want to pay my deposit on the same visit I sign so that my date is locked immediately.
Screens: Portal › Pay, ✉ Your date is locked · Events: payment.succeeded, payment.failed
[ ] Shows the deposit and the full payment schedule
[ ] Pay by card, Apple Pay, Google Pay or ACH; optional autopay for future payments
[ ] If payments aren't connected: "pay by check/cash" instructions only
[ ] Payment fails: plain-language error, "nothing was charged", [Try again] [Use another method]; planner alerted after 2 failures
[ ] A double tap never charges twice (NFR-6)
[ ] Success: "Your date is locked!", receipt email, portal unlocks, [Go to your portal]

CL-2.5 · First portal visit · P1
Page: pages/client/portal-home/, pages/messages/email-receipt-welcome/
As a new client, I want a short tour so that I know where things are.
[ ] 3-screen tour on first visit; skippable
[ ] Optional prompt to set up a password or passkey


Stage 3 — Plan together

CL-3.1 · Portal home · P1
Page: pages/client/portal-home/
As a client, I want my home screen to tell me what's next and what I owe so that I stop worrying.
Screens: Portal › Home
[ ] Countdown, next payment with [Pay now], "Needs your action (n)" and recent messages
[ ] Every action item links straight to the screen that finishes it
[ ] Nothing pending → "You're all caught up"

CL-3.2 · Fill a questionnaire · P1
Page: pages/client/portal-questionnaire/
As a client, I want to answer the planner's questionnaire in sections so that I can do it in pieces.
Screens: Portal › Questionnaire
[ ] Sections with progress; saves after every field; [Save & finish later]
[ ] Submit returns me to Home; the planner sees "received"

CL-3.3 · Mood board · P1
Page: pages/client/portal-mood-board/
As a client, I want to add inspiration and comment on the planner's ideas so that we agree on the look.
[ ] Upload photos, paste Pinterest links, comment on items

CL-3.4 · Manage my guest list · P1
Page: pages/client/portal-guests/
As a client, I want to add guests and households myself so that the planner doesn't have to retype my list.
Screens: Portal › Guests
[ ] Add guests manually or by CSV; group households; set plus-ones; see RSVP stats
[ ] CSV import preview flags bad rows (missing name, bad email), lets me fix them inline, and imports only valid rows
[ ] [Invite co-host] (partner or parent) with the same or limited access

CL-3.5 · Approve invitation wording · P1
Page: pages/client/portal-approvals/
As a client, I want to approve the invitation before it goes out so that it says what I want.
Screens: Portal › Approvals
[ ] See the design and wording; [Approve] or [Request changes] with a comment

CL-3.6 · Approvals · P1
Page: pages/client/portal-approvals/
As a client, I want one place to approve things so that decisions are clear and recorded.
Screens: Portal › Approvals · Events: headcount.locked (for final headcount)
[ ] Waiting / Done / Coming up lists (e.g. menu, timeline, floor plan, final headcount)
[ ] [Approve] or [Request changes] with comment; each response logged with who and when
[ ] Co-hosts disagree: both names and responses shown; the planner decides; nothing proceeds automatically
[ ] Final headcount approval opens on its date and triggers the planner's lock (PL-5.4)

CL-3.7 · Booth and karaoke choices · P3
As a client, I want to pick the photo booth overlay and magnet frame and give my karaoke lists so that the fun stuff fits our event.
[ ] Choose overlay and magnet frame from options; submit do-not-play and must-play songs

CL-3.8 · See potluck and fund totals · P2 / P4
As a client, I want to see potluck sign-ups and fund totals so that I know what's covered.
[ ] Potluck sign-ups by category (P2); fund total and messages (P4)


Stage 4 — Pay over time

CL-4.1 · Payment reminders · P1
Page: pages/messages/sms-payment-reminder/
As a client, I want reminders before each payment so that I'm never late.
Screens: 💬 Payment reminder
[ ] Email and text 7 days and 1 day before each due date; the link opens Pay directly
[ ] Autopay clients get "we'll charge your card on [date]" instead
[ ] Missed payment: reminders at +1 and +7 days; late fee only if the contract allows

CL-4.2 · Payments page · P1
Page: pages/client/portal-payments/
As a client, I want to see what I've paid and what's left so that there are no surprises.
Screens: Portal › Payments
[ ] Balance with progress bar; schedule with receipts for paid items
[ ] [Pay full balance], [Pay ahead], autopay toggle

CL-4.3 · Approve a change order · P1
Page: pages/client/portal-payments/
As a client, I want to approve upgrades mid-planning (e.g. +1 hour karaoke) so that my invoice stays accurate.
Screens: Portal › Messages, Portal › Payments
[ ] Change order shows item and price; [Approve] or [Decline]
[ ] Approving updates the invoice and the next payment

CL-4.4 · Ask to cancel or postpone · P1
Page: pages/client/cancel-or-postpone/
As a client, I want to request a cancellation or new date from the portal so that I know the consequences first.
[ ] Shows the contract's policy and refund estimate before I submit
[ ] The planner handles it via PL-3.6 / PL-3.7

CL-4.5 · Message my planner · P1
Page: pages/client/portal-messages/
As a client, I want one message thread with my planner so that everything is in one place.
Screens: Portal › Messages
[ ] Available before booking; attach files; email notice of new messages


Stage 5 — Event day

CL-5.1 · Day-of info · P2
As a client, I want only the essentials on event day so that I can enjoy it.
[ ] Morning-of message: arrival time, day-of contact, live gallery link
[ ] Portal › Day-of Info: client version of the timeline and contacts; no tasks


Stage 6 — Relive and wrap

CL-6.1 · Gallery · P3
As a client, I want all photos in one gallery so that I can relive the day.
[ ] Booth photos, magnet scans and guest uploads; [Download all] in full resolution; expiry date set by the planner

CL-6.2 · Thank-you tracker · P3
As a client, I want to track gifts and thank-you notes so that I don't miss anyone.
[ ] Guests with gifts noted; mark thank-you sent

CL-6.3 · Final invoice · P2
As a client, I want to pay for on-site add-ons or damages easily so that I can close out.
[ ] Final invoice with itemized charges; pay from the email link

CL-6.4 · Review and survey · P4
As a client, I want one-tap review links so that leaving a review is easy.
[ ] Links to Google, Yelp, The Knot, WeddingWire; short feedback survey


═══════════════════════════════════════
GUEST
═══════════════════════════════════════

Stage 1 — Get invited

GU-1.1 · Receive my invitation · P1
Page: pages/messages/sms-invitation/
As a guest, I want my invitation by text, email or QR code so that I don't need an app or account.
Screens: 💬 Invitation
[ ] Message preview shows host names and event title
[ ] The link carries my unique token, so I'm recognized without logging in
[ ] Paper invites and flyers carry a QR code to the same page

GU-1.2 · Open the invitation · P1 (basic) / P3 (designed)
Page: pages/guest/invitation/
As a guest, I want a nice-looking invitation so that I'm excited to come.
Screens: Invitation
[ ] P1: branded template with names, date, time, venue, [View details & RSVP], reply-by date
[ ] P3: animated envelope and music, always with Skip

GU-1.3 · Event website · P1
Page: pages/guest/event-website/
As a guest, I want all the details on one page so that I know what, when and where.
Screens: Event Website
[ ] Date, time, map, [Add to calendar], [Directions], schedule, dress code, hotel block, FAQ
[ ] Registry/fund link opens the external site in a new tab (P1)
[ ] [RSVP] always visible (sticky bar on phones)
[ ] English/Spanish, following my browser language, with a toggle
[ ] Loads in under 2 seconds on a phone (NFR-9); WCAG 2.1 AA (NFR-10)


Stage 2 — Respond

GU-2.1 · RSVP for my household · P1
Page: pages/guest/rsvp/
As a guest, I want to RSVP for everyone in my household in one go so that it's quick.
Screens: RSVP · Events: rsvp.updated
[ ] My name and household are prefilled from the token
[ ] Attending / Not attending per member; meal choice per attendee; allergies/dietary notes; song request; custom questions
[ ] Plus-one field appears only if allowed; I can't add more than allowed, with a polite explanation and [Message the host]
[ ] A forwarded link still records the RSVP against the original guest; the host sees a "forwarded link" flag
[ ] Guests marked as children: no data capture from them

GU-2.2 · Confirmation and changes · P1
Page: pages/guest/rsvp-confirmation/, pages/messages/email-rsvp-confirmation/
As a guest, I want a confirmation and a way to change my RSVP so that I can fix mistakes.
Screens: RSVP Confirmation, ✉ RSVP confirmed
[ ] Confirmation screen summarizes my reply, with [Add to calendar] and links to the fund (and potluck when on)
[ ] Confirmation email/text with [Change my RSVP], which works until the cutoff
[ ] After the cutoff: "RSVPs are closed" with [Message the host], unless the host allows late RSVPs

GU-2.3 · Public and private events · P1
Page: pages/guest/event-website/, pages/guest/rsvp/
As a guest who isn't on the list, I want to know what to do so that I'm not stuck.
[ ] Public event: the RSVP form asks for name and contact and creates a guest
[ ] Private event: "Ask the host" message instead


Stage 3 — Contribute

GU-3.1 · Sign up to bring a dish · P2
As a guest, I want to pick a potluck slot so that we don't end up with twelve bags of chips.
Events: potluck.claimed
[ ] Categories with filled/needed counts (targets scale with headcount)
[ ] Dish name, servings, diet tags (vegetarian, vegan, gluten-free, dairy-free, nut-free, halal, kosher, spicy)
[ ] Duplicate dish warning suggests under-filled categories; I can still proceed
[ ] Flags "needs an outlet / warming tray"
[ ] Reminders 3 days and 1 day before, with drop-off time and hot/cold note

GU-3.2 · Volunteer for a shift · P2
As a guest, I want to sign up for a volunteer slot so that I can help.
[ ] Slots: setup, serving, cleanup, greeting, kids' table

GU-3.3 · Give to a fund · P4
As a guest, I want to give a gift or donation in under 30 seconds so that it's easy.
[ ] See DN-1 and DN-2; cash funds (honeymoon, baby) are gifts, never tax-deductible

GU-3.4 · Buy tickets · P4
As a guest at a public event, I want to buy tickets online so that I can get in fast.
[ ] Tiers, quantity, promo code, capacity, waitlist; QR ticket by email/wallet


Stage 4 — Get ready

GU-4.1 · Reminders · P1
Page: pages/messages/guest-reminders/
As a guest, I want reminders before the event so that I know how to get there.
[ ] One week out: directions, parking, dress code (and potluck drop-off when on)
[ ] Day before: reminder; potluck contributors get the hot/cold note


Stage 5 — Attend

GU-5.1 · Check in · P2
As a guest, I want to check in by QR or name so that entry is fast.
[ ] QR from my email or name search by staff (ST-4.3); no smartphone needed

GU-5.2 · Find my seat · P4
As a guest, I want to find my table on my phone so that I don't crowd the seating chart.
[ ] Enter my name → table number and map

GU-5.3 · Photo booth · P3
As a guest, I want to take booth photos and get them my way so that I leave with a souvenir.
[ ] Tap to start, countdown, retake; share by text, email or QR; prints come out
[ ] Sharing is opt-in; "Don't show on slideshow" toggle
[ ] No email capture for guests marked as children

GU-5.4 · Photo magnets · P3
As a guest, I want to request a magnet from my own photo so that I get a keepsake.
[ ] Scan the station QR to upload a phone photo, or be photographed by roaming staff; pick up at the station

GU-5.5 · Request a karaoke song · P3
As a guest, I want to request songs from my phone so that I don't need paper slips.
Events: karaoke.requested
[ ] Scan table QR; search by title or artist; name or stage name; duets/groups
[ ] See my place in line; text when I'm 2 singers away
[ ] Blocked songs show as unavailable without shaming; suggest a clean version if one exists

GU-5.6 · Live gallery · P3
As a guest, I want to see photos on the big screen and my phone so that the fun is shared.


Stage 6 — Remember

GU-6.1 · Thank-you and gallery · P3
As a guest, I want the gallery link the day after so that I can get my photos.
[ ] View and download my photos; upload my own; post a recipe if it was a potluck

GU-6.2 · Feedback · P4
As a guest, I want a one-question survey so that giving feedback takes seconds.


═══════════════════════════════════════
STAFF
═══════════════════════════════════════

Stage 1 — Join the team (P1)

ST-1.1 · Join from an invite · P1
Page: pages/staff/invite-sign-in/, pages/messages/sms-team-invite/
As a staff member, I want to join with my phone number and a code so that I have nothing to remember.
Screens: 💬 Team invite, Invite
[ ] Invite text/email links to app download and sign-in
[ ] Sign in with phone number + SMS code; expired/wrong code → [Send a new code]
[ ] Linked to the business with the role the owner set
[ ] Lost phone: the owner can revoke my sessions remotely

ST-1.2 · My profile · P1
Page: pages/staff/profile/
As a staff member, I want to fill in my profile so that I get the right shifts.
Screens: Profile
[ ] Photo, name, phone, emergency contact, skills (KJ, booth, bartending, serving, coordinator), shirt size
[ ] Role is set by the owner (read-only)
[ ] Phase 2 tabs (My Shifts, Day-of, Chat) show as locked "Coming in Phase 2"

Stage 2 — Get scheduled (P2)

ST-2.1 · Set availability · P2
As a staff member, I want to mark when I'm available so that I'm only offered shifts I can take.
[ ] Day-by-day and recurring rules

ST-2.2 · Accept or decline shifts · P2
As a staff member, I want to accept or decline shifts from a notification so that scheduling is fast.
[ ] Push: event, date, time, role → Shift Detail [Accept] [Decline]

ST-2.3 · Swap a shift · P2
As a staff member, I want to request a swap with a qualified coworker so that I can handle conflicts.
[ ] The planner approves the swap

Stage 3 — Prepare (P2)

ST-3.1 · Call sheet · P2
As a staff member, I want my call sheet so that I know where, when, what to wear and what to do.
[ ] Address with map and parking, arrival time, dress code, on-site contact, my duties, my part of the timeline; day-before reminder

ST-3.2 · Pack the van · P2
As a packer, I want to scan items into the van so that nothing is left behind.
Events: equipment.checked_out
[ ] Scan QR/barcode labels; missing items flagged to the planner

ST-3.3 · Download for offline · P2
As a staff member, I want the event downloaded to my phone so that it works with bad signal.
[ ] Prompt to download; automatic on Wi-Fi

Stage 4 — Work the event (P2–P3)

ST-4.1 · Clock in · P2
As a staff member, I want to clock in at the venue so that my hours are recorded.
[ ] GPS confirms I'm at the venue; mismatch → clock in with a reason, flagged to the planner
[ ] Reminder push at shift start and end

ST-4.2 · My role's day-of view · P2
As a staff member, I want Day-of Mode to show only my role's tools so that I'm not overwhelmed.
[ ] Coordinator: now/next timeline, cue check-offs, vendor arrivals, incident log
[ ] Clear offline indicator; changes sync later

ST-4.3 · Door check-in · P2
As door staff, I want to scan or search guests so that entry is fast.
[ ] QR scan and name search; walk-in add; live attendance count
[ ] Two devices checking in offline merge by guest ID, with no duplicates

ST-4.4 · Booth attendant panel · P3
As a booth attendant, I want to control the booth and print queue so that it keeps running.
Events: booth.printed, photo.created
[ ] Unlock kiosk with PIN; print queue, reprint, paper/ink levels; hide a photo from the slideshow; magnet queue (pick, crop, print)
[ ] Printer jam or out of paper: printing pauses, the queue holds, I'm alerted; inventory updated
[ ] Tablet dies: another device signs in and picks up the session

ST-4.5 · KJ console · P3
As a KJ, I want a live, fair queue so that the night runs smoothly.
[ ] Set event filter and banned list; start background music
[ ] Requests arrive from phones; add paper/verbal requests manually
[ ] Fair rotation; drag to adjust; bump VIPs; [Next singer] updates the screens and texts the next guest
[ ] No-shows move to the end once, then are removed
[ ] Contest mode: judge scoring and results on screen

ST-4.6 · Team chat and alerts · P2
As a staff member, I want event chat, alerts and voice notes so that the team stays in sync.

ST-4.7 · Log an incident · P2
As a staff member, I want to log incidents with photos so that there's a record.

Stage 5 — Close out (P2)

ST-5.1 · Gear check-in · P2
As a staff member, I want to scan gear back in so that nothing is lost.
[ ] Can't mark teardown done until missing items are listed

ST-5.2 · Clock out and timesheet · P2
As a staff member, I want to clock out and see my hours so that I know I'll be paid right.
[ ] Clock out with notes (breaks, mileage); forgot to clock in/out → manual time request for planner approval
[ ] Timesheet: pending → approved → paid


═══════════════════════════════════════
VENDOR (P2)
═══════════════════════════════════════

VN-1 · Join from a magic link · P2
As a vendor, I want to accept a booking without creating an account so that working with this planner is easy.
[ ] Magic link by email/text; first time: company info, contacts, COI with expiry, W-9, payment details
[ ] Profile and documents reused on future events; only event-specific items requested

VN-2 · See my part of the event · P2
As a vendor, I want only what I need so that I don't dig through someone else's plan.
[ ] My timeline items, venue info, final headcount and meal counts (caterers), floor plan with my area, client-approved notes, contacts
[ ] Never shows client prices, other vendors' costs, or guest contact details (names, meals and allergies only where needed)

VN-3 · Upload paperwork and confirm · P2
As a vendor, I want to upload my contract and invoice and confirm so that the planner knows I'm booked.
[ ] Upload contract, invoice, COI; [Confirm booking] → planner sees "Confirmed"

VN-4 · Acknowledge changes · P2
As a vendor, I want a "what changed" summary when headcount, timeline or layout changes so that I'm never caught off guard.
[ ] [Acknowledge] → planner sees it; unacknowledged → escalating reminders and a yellow badge for the planner
[ ] Changes after my cutoff are marked "past your cutoff" and must be acknowledged

VN-5 · Message the planner · P2
[ ] My own thread; clients never see it unless the planner shares it

VN-6 · Event day check-in · P2
[ ] Day-of view with load-in door and on-site contact; [I've arrived] (or staff marks me) with a timestamp

VN-7 · Get paid · P2 (record) / P4 (in-app)
[ ] Payment recorded by the planner (P2) or paid in the app (P4); receipt sent

VN-8 · After the event · P2
[ ] Planner rates me privately; I receive photos of my work if the planner shares them


═══════════════════════════════════════
DONOR AND SPONSOR (P4)
═══════════════════════════════════════

DN-1 · Donate in under 30 seconds · P4
As a donor, I want to give quickly from a link or table QR so that I can act while I'm moved.
Events: donation.created
[ ] Cause story, goal and progress; suggested amounts or custom; recurring monthly; dedication; anonymous toggle; cover-fees checkbox
[ ] Apple Pay / Google Pay / card; name and email required for the receipt
[ ] Double tap never charges twice; one confirmation

DN-2 · Correct receipt · P4
As a donor, I want a correct receipt so that I can claim my deduction.
[ ] Organization name, tax ID, amount and deductible portion (ticket value subtracted)
[ ] Non-501(c)(3) funds (honeymoon, baby): "gift, not tax-deductible", with no tax wording anywhere
[ ] Refunds are planner-initiated; the receipt is voided and reissued

DN-3 · Silent auction · P4
As a donor, I want to bid from my phone so that I don't hover by the table.
Events: bid.placed
[ ] Browse items with photos; bid with card on file; outbid texts
[ ] Optional soft close: extends 2 minutes after a late bid
[ ] Winners charged automatically; declined card → payment link; after 24h the planner may offer it to the next bidder

DN-4 · Paddle raise · P4
[ ] Tap the announced amount; names shown live unless anonymous

DN-5 · Recurring giving · P4
[ ] Thank-you with total raised; year-end summary; expired card → card updater or update-link email

DN-6 · Sponsor checkout · P4
As a sponsor, I want to pick a tier and pay or get invoiced so that sponsoring is simple.
[ ] Tiers with benefits; company info and logo upload; invoice or pay now
[ ] Logo goes to the sponsor wall/slideshow after planner approval; the planner gets a task per benefit

DN-7 · Recognition screen · P4
[ ] Live thermometer and donor names; messages moderated before showing; attendant can hide instantly


═══════════════════════════════════════
BACKEND (SYS) — from the Cross-role triggers table
═══════════════════════════════════════

SYS-1 · Event bus · P1
Page: pages/shared/event-bus/
As the dev team, we want every cross-role trigger published as a domain event so that one action updates everyone, and the logic doesn't live inside screens.
[ ] Job queue / event bus with retries and a dead-letter log
[ ] Handlers are idempotent (safe to run twice)
[ ] P1 events and their handlers:
    lead.created → lead + conflict check + auto-reply + planner push (PL-2.1)
    proposal.accepted → contract generated (PL-3.3)
    contract.client_signed → signed PDF stored, invoice + schedule created, planner asked to countersign (CL-2.3, PL-3.5)
    payment.succeeded → invoice balance, receipt, planner notified, portal unlocked (CL-2.4)
    payment.failed → client retry prompt; planner alert after 2 failures (CL-2.4)
    contract.countersigned → event Booked, hold → booking, gear reserved, checklist applied (PL-3.4)
    event.rescheduled → relative dates shift, everyone rechecked and notified (PL-3.6)
    rsvp.updated → headcount, meals, seating pool, potluck targets; client sees stats (GU-2.1)
    headcount.locked → vendors notified, RSVPs closed (PL-5.4)
[ ] Later phases add: potluck.claimed, shift.assigned/declined, equipment.checked_out/in, timeline.delayed, event.completed (P2); booth.printed, photo.created, karaoke.requested (P3); donation.created, bid.placed (P4)
[ ] Rule: every "→ System" step in the journeys has an event here. Add the row when you add a step.

SYS-2 · Notifications · P1
Page: pages/shared/notifications/
As the dev team, we want one notification service for email, SMS and push so that delivery rules live in one place.
[ ] Email (e.g. SendGrid), SMS (e.g. Twilio), push; templates editable by the planner
[ ] Bounces and STOP opt-outs mark the contact undeliverable; opt-outs honored; the planner sees who didn't receive what
[ ] Scheduled sends (reminders, invitations)

SYS-3 · Payment webhooks · P1
Page: pages/shared/payments-backend/
As the dev team, we want payment status to come only from processor webhooks so that money is always correct.
[ ] Webhooks idempotent; late or duplicate webhooks are safe
[ ] Refunds and disputes update the invoice; chargebacks alert the planner with an evidence pack (signed contract, receipts)


═══════════════════════════════════════
NON-FUNCTIONAL (NFR) — apply to every story
═══════════════════════════════════════

NFR-1 · Magic links and auth · P1
Page: pages/shared/auth-magic-links/
[ ] Client/vendor magic links expire in 7 days; new links go only to the contact on file; a new device needs a one-time code
[ ] Owner requires passkey or 2FA; the owner can revoke any session remotely

NFR-2 · Multi-tenant isolation · P1
Page: pages/shared/multi-tenancy/
[ ] Every query scoped by tenant ID; automated tests prove one business can't see another's data

NFR-3 · Permissions on the server · P1
Page: pages/shared/permissions/
[ ] Every request checks role and per-person permissions; blocked screens show a friendly "no access" page

NFR-4 · Offline-first for event day · P2
[ ] Local database is the on-device source of truth; writes queue with timestamps; clear offline banner; sync on reconnect
[ ] Conflicts merge by field; append-only records (check-ins, prints, song requests) never conflict; true conflicts go to the planner

NFR-5 · Time zones · P1
Page: pages/shared/time-zones/
[ ] Each event stores its own time zone; times shown in event time with the viewer's local time on hover

NFR-6 · No double charges · P1
Page: pages/shared/payments-backend/
[ ] Idempotency keys on every payment request

NFR-7 · Data deletion and export · P1
Page: pages/shared/data-privacy/
[ ] Guest/client data-deletion request flow; keep only what's legally required (payment records)
[ ] Automatic backups; the owner can export all their data

NFR-8 · Large imports · P1
Page: pages/shared/imports/
[ ] 1,000+ row imports run in the background with a progress bar; no timeouts

NFR-9 · Fast guest pages · P1
Page: pages/shared/performance/
[ ] Guest pages load in under 2 seconds on a phone; lightweight and cached
[ ] 300 guests scanning a QR at once is fine; queue writes rate-limited per device (P3 karaoke)

NFR-10 · Accessibility and language · P1
Page: pages/shared/accessibility-language/
[ ] All guest and client flows meet WCAG 2.1 AA (screen readers, large text, contrast)
[ ] English and Spanish; guest pages follow the browser language with a toggle

NFR-11 · Concurrent editing · P1
Page: pages/shared/concurrent-editing/
[ ] Last write wins per field, with an "updated by X just now" toast
[ ] Timeline and seating lock while someone is dragging

NFR-12 · Errors · P1
Page: pages/shared/errors-soft-delete/
[ ] Plain-language message, a retry, no lost input; error logged with context

NFR-13 · Soft delete · P1
Page: pages/shared/errors-soft-delete/
[ ] Deletes are soft with 30-day restore; destructive actions ask for confirmation

NFR-14 · Privacy and minors · P1 (P3 for photos)
Page: pages/shared/data-privacy/
[ ] No data capture from guests marked as children; booth email capture disabled for them
[ ] Photo sharing and data capture need consent; kids' party galleries default to private

NFR-15 · Branding everywhere · P1
Page: pages/shared/branding/
[ ] Planner's logo, colors and custom domain on every client, guest, vendor and donor page


═══════════════════════════════════════
PHASE 1 AT A GLANCE
═══════════════════════════════════════
Planner: PL-1.1–1.8, PL-2.1–2.5, PL-3.1–3.7, PL-4.1–4.8, PL-5.1–5.4 (32 stories)
Client: CL-1.1–1.2, CL-2.1–2.5, CL-3.1–3.6, CL-4.1–4.5 (18 stories)
Guest: GU-1.1–1.3, GU-2.1–2.3, GU-4.1 (7 stories)
Staff: ST-1.1–1.2 (2 stories)
Backend and cross-cutting: SYS-1–3, NFR-1–3, NFR-5–15 (17 stories)
Total Phase 1: 76 stories. Suggested build order: NFR-2/3 + PL-1.1 (foundation) → SYS-1/2/3 → the Rivera path in order: PL-2.x → PL-3.x / CL-2.x → PL-4.x → PL-5.x / CL-3.x → GU-x.
