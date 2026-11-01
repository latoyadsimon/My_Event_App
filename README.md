# 👑 Crowned

*Brought to you by **Simon Says: Celebrate***

Crowned is an all-in-one app for event planners: leads → proposals → contracts → payments → guests and RSVPs. Each planner's brand appears on everything their clients and guests see. It serves four kinds of people:

- **Planners** run their business in a workspace.
- **Clients** review, sign, pay and plan in a portal.
- **Guests** RSVP from an event website, with no account.
- **Staff** join the team from a text message.

> **Status:** front end in progress, with no backend yet. All data lives in your browser's memory and **resets on refresh**. Supabase comes later. The database design (schema, security rules, server functions and their tests) is already in `app_outline/erd/`.

## Try it

```bash
npm install
npm run dev        # http://localhost:5173
```

The demo always lives on **Thursday, Nov 5, 2026**, in the middle of the Rivera wedding story (Sat Jun 12, 2027 · 120 guests · $14,850). Use the **demo bar** at the top:

- **Viewing as** switches between Planner, Client (Ana Rivera), Guest and Staff. All roles share the same data.
- **Outbox** shows every email, text and push notification the app "sent". Their buttons open the real screens.
- **Reset demo** starts over.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit and component tests (Vitest + React Testing Library) |
| `npm run lint` | ESLint |
| `npm run check:contrast` | Checks every color pair in the app and the 27 event themes against WCAG AA |
| `npm run build` | Production build into `dist/` |
| `bash app_outline/erd/tests/run_tests.sh` | Database tests (needs PostgreSQL 15+ server tools) |

All of these run in CI (GitHub Actions) on every push and pull request.

## Tech

- **Front end:** React 19, Vite, React Router 7 (`BrowserRouter`), and CSS Modules on design tokens.
- **Testing:** Vitest and Testing Library, with Playwright and Lighthouse checks for each phase.
- **Database (designed, not connected yet):** Supabase Postgres with row-level security on every table.

## Where things are

| Path | What's there |
|---|---|
| `src/` | The single-page app. Routes are in `src/App.jsx`; demo data is in `src/data/seed.js` |
| `app_outline/` | Product spec, user journeys, 151 user stories, one folder per screen (`pages/`), the style guide, and the database design (`erd/`) |
| `wireframes/` | Lo-fi wireframes for every Phase 1 screen, plus the Rivera walkthrough |
| `qa/frontend/` | One review per build phase, with screenshots compared against the wireframes |
| `documentation/README.md` | The long-form project guide: how the pieces connect |
| `CLAUDE.md` | Architecture notes and commands for AI-assisted development |

## Build phases (front end)

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation: routes, layouts, store, demo bar, Outbox | ✅ |
| 1 | Planner setup: sign up, onboarding, dashboard, settings | ✅ |
| 2 | Leads and selling: inquiry form, booking page, leads, proposals | Next |
| 3 | Booking: accept, sign, pay deposit, countersign, invoice | |
| 4 | Event Hub: tasks, guests, invitations, money, files, messages | |
| 5 | Client portal after booking | |
| 6 | Guests and staff | |
| 7 | Polish and the full end-to-end walkthrough | |

Each phase ends with a review in `qa/frontend/phase_N_review.md` and waits for the owner's approval.

## Workflow

Branches: `main` (stable) ← `dev` ← `feature/...`. Work on a feature branch, write tests first, and open a pull request into `dev`.
