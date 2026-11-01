# 👑 Crowned

*Brought to you by **Simon Says: Celebrate***

Crowned is an all-in-one app for event planners: leads → proposals → contracts → payments → guests and RSVPs, then the event itself (vendors, gear, staff, run of show, day-of mode), the guest experience (invitation designer, photo booth, karaoke) and growth (fundraising, tickets, seating, reports). Each planner's brand appears on everything their clients and guests see. It serves five kinds of people:

- **Planners** run their business in a workspace.
- **Clients** review, sign, pay and plan in a portal.
- **Guests** RSVP from an event website, with no account.
- **Staff** pick up shifts, clock in and pack gear from their phone.
- **Vendors** get their details and paperwork from a magic link.

> **Status:** the front end is complete for every product phase (P1–P4): every screen, for all five roles. There's no backend yet. All data lives in your browser's memory and **resets on refresh**. Supabase comes next. The database design (schema, security rules, server functions and their tests) is already in `app_outline/erd/`.
>
> **New here?** Read the **[How-To guide](documentation/HOW_TO.md)**, or open **Help** in the app's top bar.

## Try it

```bash
npm install
npm run dev        # http://localhost:5173
```

The demo always lives on **Thursday, Nov 5, 2026**, in the middle of the Rivera wedding story (Sat Jun 12, 2027 · 120 guests · $14,850). Use the **demo bar** at the top:

- **Viewing as** switches who you are. All of them share the same data:
  - **Planner (LaToya)**, the owner;
  - **Coordinator (Devon)**, to see permissions at work;
  - **Client (Ana Rivera)**, before booking;
  - **Client (Priya Shah, Acme)**, with an unlocked portal;
  - **Guest (Dana)**;
  - **Staff (Sam)**;
  - **Vendor (Hill Country Catering)**.
- **Outbox** shows every email, text and push notification the app "sent". Their buttons open the real screens as the person they were sent to.
- **Help** is the How-To guide, with a "Show me" button on every step.
- **Reset demo** starts over.

**Try the whole story:**
1. Open the Outbox → "Your proposal (v2) is ready" → View your proposal.
2. Accept, sign, and pay with card `4242 4242 4242 4242`.
3. Switch to the planner and press **Countersign** on the Dashboard.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit and component tests (Vitest + React Testing Library) |
| `npm run lint` | ESLint |
| `npm run check:contrast` | Checks every color pair in the app and the 27 event themes against WCAG AA |
| `npm run build` | Production build into `dist/` (pages are code-split and load on first visit) |
| `npm run docs:howto` | Rebuilds `documentation/HOW_TO.md` from `src/data/howTo.js` (the same words as the in-app Help) |
| `bash app_outline/erd/tests/run_tests.sh` | Database tests (needs PostgreSQL 15+ server tools) |

All of these run in CI (GitHub Actions) on every push and pull request.

## Tech

- **Front end:** React 19, Vite, React Router 7 (`BrowserRouter`), and CSS Modules on design tokens.
- **Testing:** Vitest and Testing Library, with Playwright and Lighthouse checks for each phase.
- **Database (designed, not connected yet):** Supabase Postgres with row-level security on every table.

## Where things are

| Path | What's there |
|---|---|
| `src/` | The single-page app. Routes are in `src/App.jsx`; every change to data is an action in `src/store/actions/`; demo data is in `src/data/` |
| `app_outline/` | Product spec, user journeys, 151 user stories, one folder per screen (`pages/`), the style guide, and the database design (`erd/`) |
| `wireframes/` | Lo-fi wireframes for every P1 screen, plus the Rivera walkthrough (P2–P4 screens were designed from the stories) |
| `qa/frontend/` | One review per build phase, screenshots (compared against the wireframes for P1), and `rivera-walkthrough.js` (the whole story, clicked end to end) |
| `documentation/HOW_TO.md` | The user guide for planners, clients, guests, staff and vendors |
| `documentation/README.md` | The long-form project guide: how the pieces connect, and how the front end maps onto Supabase |
| `CLAUDE.md` | Architecture notes and commands for AI-assisted development |

## Build phases (front end)

"Phase" here means the order the screens were built in. Product phases P1–P4 (what features) come from `app_outline/product_spec.md`.

| Phase | Product | Scope | Status |
|---|---|---|---|
| 0 | P1 | Foundation: routes, layouts, store, demo bar, Outbox | ✅ |
| 1 | P1 | Planner setup: sign up, onboarding, dashboard, settings | ✅ |
| 2 | P1 | Leads and selling: inquiry form, booking page, leads, proposals | ✅ |
| 3 | P1 | Booking: accept, sign, pay deposit, countersign, invoice, events list | ✅ |
| 4 | P1 | Event Hub: tasks, guests, invitations, website, money, files, messages, reschedule, cancel, calendar | ✅ |
| 5 | P1 | Client portal after booking | ✅ |
| 6 | P1 | Guests (invitation, website, RSVP, EN/ES) and staff | ✅ |
| 7 | P1 | Polish: code splitting, error screen, motion, Help + How-To, the full walkthrough | ✅ |
| 8 | P2 | Logistics: vendors (and the vendor's magic link), run of show, budget, gear | ✅ |
| 9 | P2 | Staff app: shifts, swaps, availability, clock in/out, packing, team chat | ✅ |
| 10 | P2 | Event day: day-of mode, check-in, sales, incidents, teardown, wrap-up | ✅ |
| 11 | P2 | Potluck and volunteer sign-ups | ✅ |
| 12 | P3 | Karaoke: song requests, KJ console, venue screen | ✅ |
| 13 | P3 | Photo booth: kiosk, attendant, magnets, live and client galleries, thank-yous | ✅ |
| 14 | P3 | Invitation designer (envelope, email, print) | ✅ |
| 15 | P4 | Fundraising: donations, silent auction, paddle raise, sponsors | ✅ |
| 16 | P4 | Tickets, floor plan and seating, find my seat | ✅ |
| 17 | P4 | Grow: reports, marketing reminders, duplicate and templates, reviews | ✅ |
| 18 | | Docs: the How-To for P2–P4, these READMEs | ✅ |
| Next | | The database: add the later-phase tables to `schema.sql`, then the APIs (Stripe/Square, email/SMS, calendars) | |

Each phase ends with a review in `qa/frontend/phase_N_review.md`.

## Workflow

Branches: `main` (stable) ← `dev` ← `feature/...`. Work on a feature branch, write tests first, and open a pull request into `dev`.
