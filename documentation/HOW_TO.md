# How to use Crowned

> Generated from `src/data/howTo.js` by `npm run docs:howto`. The in-app **Help** page (`/help`) shows the same guide, with a "Show me" button on every step. Edit the words there, then re-run the script.

Crowned runs an event business from the first inquiry to the last thank-you. This guide walks through it the way you’ll use it: as the planner, as a client, as a guest and as a team member.

## About this demo

- This is a demo with no backend yet. Everything you do lives in your browser and resets when you refresh, so try anything.
- The demo always lives on Thursday, November 5, 2026. Bella Events is the business; LaToya Simon is the owner.
- Use the **Viewing as** menu in the dark bar at the top to switch between the planner (LaToya), a coordinator (Devon), two clients (Ana, before booking; Priya, after), a guest (Dana) and a staff member (Sam).
- Every email, text and notification the app "sends" lands in the **Outbox** (top bar). Their buttons open the real screen as the person it was sent to.

## Contents

1. [Set up your business](#setup) · *Planner*
2. [Turn an inquiry into a proposal](#leads) · *Planner*
3. [Book: accept, sign and pay (the client’s side)](#booking) · *Client*
4. [Countersign, invoice and see all events](#countersign) · *Planner*
5. [Plan the event (Event Hub)](#hub) · *Planner*
6. [Plan together (the client’s portal)](#portal) · *Client*
7. [RSVP (the guest’s side)](#guests) · *Guest*
8. [Run your team](#team) · *Planner & staff*
9. [Tips](#tips)

<a id="setup"></a>

## Set up your business

*Planner.* About 10 minutes. You can skip any step and come back from the Dashboard checklist.

### 1. Create your account

Sign up with Google, Apple or an email and password, then protect the account with a passkey or an authenticator app. Owners must, because the account holds money.

**Try it:** open `/app/signup`, or use **Show me** on the Help page.

![Create your account](how_to/signup.png)

### 2. Walk through the setup steps

Business details and branding (logo and brand color appear on everything clients and guests see), payments (Stripe or Square), packages and add-ons, calendar, team, and message templates.

**Try it:** open `/app/onboarding/business`, or use **Show me** on the Help page.

![Walk through the setup steps](how_to/onboarding.png)

### 3. Share your inquiry form

On the Dashboard, “Copy link” under Getting started copies your public inquiry form. Put it on your website, Instagram and Facebook. Every submission becomes a lead.

**Try it:** open `/app/dashboard`, or use **Show me** on the Help page.

![Share your inquiry form](how_to/dashboard.png)

### 4. Change anything later in Settings

Settings uses the same forms as setup: business, branding, packages, payments, calendar, team and roles, templates, export, and Calm or Bold appearance.

**Try it:** open `/app/settings/business`, or use **Show me** on the Help page.

<a id="leads"></a>

## Turn an inquiry into a proposal

*Planner.* Inquiries arrive on their own; you decide the next step.

### 1. Watch leads arrive

A new inquiry sends you a notification, emails the prospect an auto-reply with your booking link, and lands in the New column of Leads. A red “Date taken” badge means that date is already booked.

**Try it:** open `/app/leads`, or use **Show me** on the Help page.

![Watch leads arrive](how_to/leads.png)

### 2. Move leads along

Drag a card to another column, or use its “Move to” menu (works with a keyboard and on phones). Sending a proposal and signing a contract move cards for you.

**Try it:** open `/app/leads`, or use **Show me** on the Help page.

### 3. Reply, hold the date, or send your booking link

Open a lead. “Send canned reply” opens your template so you can edit it first. “Hold date” blocks the date for 7 days. If the date is taken, Crowned suggests nearby open dates you can drop into the reply.

**Try it:** open `/app/leads/kim`, or use **Show me** on the Help page.

![Reply, hold the date, or send your booking link](how_to/lead-detail.png)

### 4. Let prospects book a consult

Your booking page only shows times you’re free (weekdays, a buffer around your appointments, at most three consults a day). Booking adds it to your calendar and the lead.

**Try it:** open `/b/bella-events/book` (viewing as client), or use **Show me** on the Help page.

![Let prospects book a consult](how_to/booking.png)

### 5. Build and send the proposal

Pick a package, tick add-ons and set quantities, mark upgrades the client can choose (◇), add a discount. Tax, total and deposit update as you go. If you quote more gear than you own, fix it right on the line. “Preview as client” shows exactly what they’ll see; each send is a new version.

**Try it:** open `/app/proposals/rivera`, or use **Show me** on the Help page.

![Build and send the proposal](how_to/proposal.png)

<a id="booking"></a>

## Book: accept, sign and pay (the client’s side)

*Client.* Clients do it all in one sitting from the proposal email. No password.

### 1. Review and accept

The proposal shows what’s included; ticking an optional upgrade updates the total. Ask a question, request changes, or accept.

**Try it:** open `/portal/proposal` (viewing as ana), or use **Show me** on the Help page.

![Review and accept](how_to/portal-proposal.png)

### 2. Sign the contract

Read it (or download it), agree to sign electronically, and type your name or draw a signature.

**Try it:** open `/portal/proposal` (viewing as ana), or use **Show me** on the Help page.

### 3. Pay the deposit

Card, Apple Pay, Google Pay or bank transfer, with optional autopay. In the demo, card 4242 4242 4242 4242 works and 4000 0000 0000 0002 is declined (nothing is charged). Paying the deposit locks the date and opens the rest of the portal.

**Try it:** open `/portal/proposal` (viewing as ana), or use **Show me** on the Help page.

![Pay the deposit](how_to/portal-pay.png)

<a id="countersign"></a>

## Countersign, invoice and see all events

*Planner.* Once the client has signed and paid, it’s your turn.

### 1. Countersign from the Dashboard alert

“Signed and paid the deposit → Countersign” appears on your Dashboard. Countersigning books the event and adds the checklist for that event type, with due dates counted back from the event. Crowned won’t let you countersign before the deposit is paid.

**Try it:** open `/app/dashboard`, or use **Show me** on the Help page.

![Countersign from the Dashboard alert](how_to/contract.png)

### 2. Manage the invoice

See the payment schedule, record cash, check, Venmo, Zelle or Cash App payments, refund or credit, send a reminder, and choose autopay, card-fee and late-fee options. Card payments are marked paid by Stripe or Square, never by hand.

**Try it:** open `/app/invoices/acme`, or use **Show me** on the Help page.

![Manage the invoice](how_to/invoice.png)

### 3. Find any event

Events lists upcoming, past or all events, with balance and open tasks. “+ New event” is for events that didn’t start as a lead.

**Try it:** open `/app/events`, or use **Show me** on the Help page.

<a id="hub"></a>

## Plan the event (Event Hub)

*Planner.* Everything about one event, in tabs. The Acme holiday party is the busiest demo event.

### 1. Overview

Countdown, balance, RSVPs, tasks, the next three deadlines, venue details, the questionnaire and approvals, and the event’s history.

**Try it:** open `/app/events/acme`, or use **Show me** on the Help page.

![Overview](how_to/hub-overview.png)

### 2. Tasks and questionnaires

Assign tasks to yourself, a teammate, the client (it shows in their portal) or a vendor. Add subtasks, reorder, and undo a removal. “Send questionnaire” emails the client a form whose answers fill in the event.

**Try it:** open `/app/events/acme/tasks`, or use **Show me** on the Help page.

### 3. Guests

Households with plus-ones, tags and notes; live counts, meals and allergies. Import a spreadsheet (CSV), remind people who haven’t replied, and lock the final headcount once the client approves it.

**Try it:** open `/app/events/acme/guests`, or use **Show me** on the Help page.

![Guests](how_to/hub-guests.png)

### 4. Website & RSVP, then invitations

Choose what the event website shows and what the RSVP asks (meals, allergies, songs, your own questions, plus-ones, privacy). Then write the invitation, get the client’s OK, and send it by email and text, now or scheduled. Tracking shows who got it, opened it and replied, and who didn’t get it.

**Try it:** open `/app/events/acme/guests/invitations`, or use **Show me** on the Help page.

![Website & RSVP, then invitations](how_to/hub-invitations.png)

### 5. Money, files and messages

Money shows price, collected and balance (profit is owner-only). Files holds documents (shared or private) and the mood board. Messages has one thread with the client and one per vendor; send a change order right from the thread.

**Try it:** open `/app/events/acme/money`, or use **Show me** on the Help page.

### 6. Change the date or cancel

Change date checks your calendar, team and gear first, then moves every open task and payment date. Cancel shows the refund from your contract’s policy and asks you to type CANCEL.

**Try it:** open `/app/events/patel/reschedule`, or use **Show me** on the Help page.

### 7. Calendar

Month, week, day or list. Events, consults and dashed date holds, with a warning when you’re double-booked or travel time is too short.

**Try it:** open `/app/calendar`, or use **Show me** on the Help page.

![Calendar](how_to/calendar.png)

<a id="portal"></a>

## Plan together (the client’s portal)

*Client.* After the deposit, clients get their own planning space. Priya (Acme) shows a portal in full swing.

### 1. Home: what’s next and what do I owe

A countdown, the next payment, and “Needs your action”, where every item links to the screen that finishes it. The first visit starts with a short tour.

**Try it:** open `/portal` (viewing as acme), or use **Show me** on the Help page.

![Home: what’s next and what do I owe](how_to/portal-home.png)

### 2. Questionnaire, mood board and approvals

Answers save as you go. Add photos and Pinterest links to the mood board and comment. Approve or request changes on the menu, invitation wording and final headcount.

**Try it:** open `/portal/approvals` (viewing as acme), or use **Show me** on the Help page.

### 3. Payments

See the balance and receipts, pay the next payment or the full balance, turn on autopay, and approve change orders.

**Try it:** open `/portal/payments` (viewing as acme), or use **Show me** on the Help page.

### 4. Guests and co-hosts

Add guests or import a spreadsheet; rows with problems are flagged so you can fix them before importing. Invite a partner or parent as a co-host.

**Try it:** open `/portal/guests` (viewing as acme), or use **Show me** on the Help page.

### 5. Messages, or a change of plans

Message the planner any time, even before booking. “Cancel or postpone” shows the policy and refund estimate before you ask.

**Try it:** open `/portal/messages` (viewing as acme), or use **Show me** on the Help page.

<a id="guests"></a>

## RSVP (the guest’s side)

*Guest.* Guests never make an account. Their invitation link knows who they are.

### 1. Open the invitation

The text or email opens a card in the event’s theme with the date, time, place and reply-by date.

**Try it:** open `/i/acme-g8-t` (viewing as guest), or use **Show me** on the Help page.

![Open the invitation](how_to/guest-invitation.png)

### 2. Read the event website

When and where with directions and Add to calendar, schedule, dress code, hotel, FAQ and registry. English or Spanish with one tap.

**Try it:** open `/e/acme?t=acme-g8-t` (viewing as guest), or use **Show me** on the Help page.

![Read the event website](how_to/guest-website.png)

### 3. Reply for the household

Attending or not for each person, a meal each, allergies, a song request. Plus-ones only up to what the host allowed. The confirmation has “Change my RSVP”, which works until the cutoff.

**Try it:** open `/e/acme/rsvp?t=acme-g8-t` (viewing as guest), or use **Show me** on the Help page.

![Reply for the household](how_to/guest-rsvp.png)

<a id="team"></a>

## Run your team

*Planner & staff.* Owners decide who sees what.

### 1. Invite and set permissions

Settings › Team & roles: invite by text or email with a role and job. Turn on budgets, payments or vendor editing per person. Profit is always owner-only. Deactivate keeps history; “Sign out everywhere” handles a lost phone.

**Try it:** open `/app/settings/team`, or use **Show me** on the Help page.

![Invite and set permissions](how_to/team.png)

### 2. See what a teammate sees

Switch “Viewing as” to Coordinator (Devon): the Money tab hides profit. Sam (staff) can’t see money at all.

**Try it:** open `/app/events/acme/money` (viewing as devon), or use **Show me** on the Help page.

### 3. Join as staff

The invite text opens a sign-in with a phone number and a 6-digit code (demo code 123456), then the profile: photo, emergency contact, skills and shirt size.

**Try it:** open `/join/inv-jo` (viewing as staff), or use **Show me** on the Help page.

![Join as staff](how_to/staff-join.png)

<a id="tips"></a>

## Tips

- The Outbox is your best friend in the demo: open any message and press its button to see the screen as that person.
- “Reset demo” in the top bar starts over. So does refreshing the page.
- Try the whole Rivera story: Outbox → “Your proposal (v2) is ready” → accept, sign, pay → switch to the planner → Countersign on the Dashboard.
- Calm or Bold? Settings › Appearance switches the whole app’s look; guest pages always wear the event’s own theme.
- Everything works on a phone: the menu moves to the bottom bar, with “More” for the rest.
