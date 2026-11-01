# 👑 Crowned

*Brought to you by **Simon Says: Celebrate***

Crowned is an all-in-one app for event planners: leads → proposals → contracts → payments → guests and RSVPs. Each planner's brand appears on everything their clients and guests see. It serves four kinds of people:

- **Planners** run their business in a workspace.
- **Clients** review, sign, pay and plan in a portal.
- **Guests** RSVP from an event website, with no account.
- **Staff** join the team from a text message.

> **Status:** the front end is complete: every screen, for all four roles. There's no backend yet. All data lives in your browser's memory and **resets on refresh**. Supabase comes next. The database design (schema, security rules, server functions and their tests) is already in `app_outline/erd/`.
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
  - **Staff (Sam)**.
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
| `wireframes/` | Lo-fi wireframes for every Phase 1 screen, plus the Rivera walkthrough |
| `qa/frontend/` | One review per build phase, screenshots compared against the wireframes, and `rivera-walkthrough.js` (the whole story, clicked end to end) |
| `documentation/HOW_TO.md` | The user guide for planners, clients, guests and staff |
| `documentation/README.md` | The long-form project guide: how the pieces connect, and how the front end maps onto Supabase |
| `CLAUDE.md` | Architecture notes and commands for AI-assisted development |

## Build phases (front end)

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation: routes, layouts, store, demo bar, Outbox | ✅ |
| 1 | Planner setup: sign up, onboarding, dashboard, settings | ✅ |
| 2 | Leads and selling: inquiry form, booking page, leads, proposals | ✅ |
| 3 | Booking: accept, sign, pay deposit, countersign, invoice, events list | ✅ |
| 4 | Event Hub: tasks, guests, invitations, website, money, files, messages, reschedule, cancel, calendar | ✅ |
| 5 | Client portal after booking | ✅ |
| 6 | Guests (invitation, website, RSVP, EN/ES) and staff | ✅ |
| 7 | Polish: code splitting, error screen, motion, Help + How-To, the full walkthrough | ✅ |
| Next | Supabase: sign-in, the database, server functions, Stripe/Square, email/SMS | |

Each phase ends with a review in `qa/frontend/phase_N_review.md`.

## Workflow

Branches: `main` (stable) ← `dev` ← `feature/...`. Work on a feature branch, write tests first, and open a pull request into `dev`.
