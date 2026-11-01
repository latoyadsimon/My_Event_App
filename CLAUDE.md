# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Repo for **Crowned**, an all-in-one **event planner app** (multi-tenant SaaS for event planners: leads → proposals → contracts → payments → guests/RSVPs, later equipment, staff, photo booth, karaoke, donations). The repo holds the product design, a Supabase Postgres schema with server functions (product Phase 1 tables only), database tests, and the front end (`src/`, React + Vite) for **every product phase (P1–P4)**, running on in-memory demo data. The user is a beginner developer (Code Platoon), so explain decisions and keep code commented for learning.

Running example used everywhere: the **Rivera wedding** (Sat Jun 12, 2027, 120 guests, total $14,850 = deposit $4,455 + $5,940 + $4,455). Keep new examples consistent with its timeline (see `wireframes/walkthrough_rivera.md`).

## "Phase" means three different things here

Say which one you mean; mixing them up has confused the owner before.

- **Product phases (P1–P4), what features:** from `app_outline/product_spec.md` ("Suggested phases"). P1 core business; P2 event operations (equipment, staff shifts, run-of-show, day-of mode, vendors, potluck); P3 guest experience (invitation designer, photo booth, live gallery, karaoke jockey); P4 growth (ticketing, donations/auctions, floor plans and seating, rental store, reports). Every story in `app_outline/user_stories.md` is tagged on its header line (`· P1`, `· P2`, `· P2 / P4`…).
- **Build steps, how we build:** the owner's order is **(1) all the front end → (2) the database attached to the ERD → (3) the APIs** (payments, email/SMS, calendars…). The owner chose to finish step 1 for *every* product phase before starting the database.
- **Front-end build phases 0–18:** the order the screens were built in, one stacked PR and one `qa/frontend/phase_N_review.md` each. 0–7 = P1, 8–11 = P2 (logistics, staff app, event day, potluck), 12–14 = P3 (karaoke, photo booth, invitation designer), 15–17 = P4 (fundraising, tickets/seating, Grow), 18 = docs.

**Status:** the front end covers P1–P4 (stacked PRs #3–#20 into `dev`, merge in order; #21 = docs). **Next:** build step 2, the database: add the later-phase tables (sketched in `data_dictionary.md` › "Later phases") to `schema.sql` and map the store actions to functions. Wait for the owner's go-ahead.

## Commands

```bash
# Database tests (throwaway Postgres; needs PostgreSQL 15+ server tools: initdb/pg_ctl/psql)
bash app_outline/erd/tests/run_tests.sh
#   Each tests/test_*.sql runs in a fresh DB: supabase_stub.sql → schema.sql → functions.sql → helpers.sql → test file.
#   (Table grants live in supabase_stub.sql as default privileges, like Supabase; don't re-grant in helpers.sql,
#    or you undo schema.sql's column revokes.)

# QA regression probes (61 checks incl. "normal work still succeeds" controls; exit 1 on any FAIL)
bash qa/run_qa_db_probes.sh
python3 -B qa/test_generators.py -v     # generators in sync, counts, Markdown links
#   Run one test file: temporarily move/rename the others, or copy the runner loop for a single file.
#   PGTEST_PORT overrides the port (default 54330). PG_BIN=/usr/lib/postgresql/16/bin picks a PostgreSQL version.

# Front end (Vite + React)
npm run dev      # local dev server (http://localhost:5173)
npm test         # Vitest + React Testing Library (npm run test:watch while coding)
npx vitest run src/App.test.jsx -t "phone bar"   # one file / one test by name
npm run lint     # ESLint (ignores .claude/ and the generated erd_data.js)
npm run build
npm run docs:howto   # regenerate documentation/HOW_TO.md from src/data/howTo.js (same words as the /help page)

# Regenerate ERD data + data dictionary after editing schema.sql
python3 app_outline/erd/build_erd.py

# Regenerate the per-page folders after editing user_stories.md (or PAGES in the script)
python3 app_outline/pages/build_pages.py

# View wireframes / ERD (they load sibling .js files; serve over HTTP for Playwright screenshots)
cd wireframes && python3 -m http.server 8765        # wireframe.html
cd app_outline/erd && python3 -m http.server 8766    # erd.html
```

Environment gotchas (WSL + zsh): the Vite dev server sometimes misses files changed from the shell (sed/python), so `touch` the file or restart `npm run dev` if the browser shows stale code; `rm` is aliased to `rm -i` (use `command rm`); `diff` is a broken zsh function (use `/usr/bin/diff`); zsh doesn't word-split variables holding commands; Postgres Unix sockets fail on long paths, so start servers with `-k ''` and connect via `-h 127.0.0.1`.

## Sources of truth and generated files

Several files are **generated**. Edit the source, then re-run the generator:

| Edit this | Generator | It writes (don't hand-edit) |
|---|---|---|
| `app_outline/erd/schema.sql` | `build_erd.py` | `erd/erd_data.js`, `erd/data_dictionary.md` |
| `app_outline/user_stories.md` | `pages/build_pages.py` | every `pages/<role>/<page>/README.md`, `pages/README.md`, the `Page:` lines in user_stories.md |
| `wireframes/wireframe.html` (`JOURNEYS` array) | Playwright, by hand | `pages/_wireframe_screens.json`, each page's `wireframe.png`, `wireframes/wireframe_*.png` |

- `build_pages.py` never overwrites an existing `pages/**/tests/README.md` (developers tick those boxes).
- `schema.sql` house style is **parsed** by `build_erd.py`, so keep it: an `-- @table name | area | stories: IDs | rls: …` header plus a description comment above each `create table public.X (`, **one column per line** with a trailing `  -- comment`, and statuses as `text` + `check (col in (...))`. A new table must also be placed in `AREAS` in `build_erd.py` (the script errors if you forget).
- A new page needs an entry in `PAGES` in `build_pages.py`. The script fails unless every P1 story ID and every wireframe route is mapped.

## Design documents (`app_outline/`)

- `product_spec.md`: the owner's spec (roles, modules, phases, integrations, open questions).
- `user_journeys.md`: stages, numbered steps, edge cases and **cross-role triggers** (domain events) per role. Screen names in code style are the route names.
- `user_stories.md`: 151 stories (76 P1). IDs are `ROLE-STAGE.N`: PL planner, CL client, GU guest, ST staff, VN vendor, DN donor, SYS backend, NFR non-functional. Each step became a story and each edge case an acceptance-criteria checkbox. When work is ambiguous, find its story first; a missing story means the feature isn't designed yet.
- `documentation/README.md`: the long-form project guide (folder layout, how the pieces connect, booking flow and event bus, known gaps). `QA_REPORT.md` is the earlier QA audit.
- `pages/`: one folder per P1 screen/feature (grouped `planner/ client/ guest/ staff/ messages/ shared/`), with the story copy, a cropped wireframe, and a tests checklist.
- `wireframes/wireframe.html`: lo-fi wireframes for every P1 screen in desktop, tablet and phone views, built from a `JOURNEYS` data array with small HTML-string helpers (`shell`, `card`, `state`, `msg`…). Every screen has `from`/`next` fields (its click path), and the page's nav items must each map to a screen route (no dead ends). `walkthrough_rivera.md` logs the end-to-end walkthrough and the decisions made.

## Data model architecture (`app_outline/erd/`)

Supabase Postgres, verified on Postgres 16 (CI) and 18. Read `erd/README.md` and `data_dictionary.md` for details. The cross-file ideas:

- **Multi-tenant:** every business table has `business_id → businesses`. RLS is enabled on every table, with helper functions `is_member`, `has_permission(b, 'see_budgets'|…)`, `is_owner`, `is_manager` (owner/coordinator), `is_event_host`, `is_full_host` (money), `host_can_plan`, `is_lead_client`. Policies are split per command (read/add/edit/delete); records we keep have no delete policy (soft delete). A `_check_same_business` trigger on every child table keeps references inside one tenant.
- **Guard triggers (schema.sql section 10b):** policies pick rows, not columns, so `_guard_*` triggers stop app users (`current_user` = `authenticated`/`anon`) from changing server-owned state: contract signatures, `portal_unlocked_at`, Booked status, invoice totals/paid, installment paid/amount, proposal accepted, change-order decisions, the last owner. `is_server()` is true inside `security definer` functions and for `service_role`, so functions and the webhook pass. New server-owned columns need a guard too.
- **Who signs in:** planners and staff via `memberships` (role + per-person `permissions` jsonb); clients via magic link (`clients.user_id`); **guests never sign in**. Guests use `households.invite_token` through `guest_household()` / `guest_submit_rsvp()` only, with no table access.
- **Booking flow (decided with the user):** the client accepts, signs **and pays the deposit in one sitting**; the planner countersigns afterwards, and only once the deposit is paid (or waived for a $0 deposit). So `client_sign_contract()` creates the event (`awaiting_countersign`), invoice and installments. A paid deposit sets `events.portal_unlocked_at`, which unlocks the client's planning pages. Countersigning sets the event to `booked` and applies the checklist template.
- **Money:** payments are written only by `record_payment()` (service role, called by the payment webhook), which is idempotent on `processor_payment_id`. `idempotency_key` is unique. Money tables need `see_budgets`.
- **Event bus:** business actions write `domain_events` (outbox, e.g. `contract.client_signed`, `rsvp.updated`) plus `activity_log`, via the internal `_emit()`. Every "→ System" step in the journeys should map to a domain event.
- **`functions.sql`:** `client_*` / `planner_*` functions check the caller inside (`security definer`), run in one transaction, and raise plain-language errors meant to be shown to users. `_name` helpers are not callable. Grants are explicit at the bottom of the file; give new functions the same treatment.
- **Tests:** `tests/helpers.sql` provides `test.eq(label, actual, expected)` and `test.expect_error(sql, fragment)`. Tests switch identity with `set role authenticated; set request.jwt.claim.sub = '<uuid>';` (`supabase_stub.sql` fakes `auth.uid()` and the anon/authenticated/service_role roles).

## Front-end SPA (`src/`)

React 19 + Vite + React Router 7 (declarative `BrowserRouter`). **No backend yet:** all data lives in memory and a refresh resets it (no localStorage) until Supabase is connected. Each front-end phase has `qa/frontend/phase_N_review.md` (stories covered, decisions, stand-ins) and screenshots in `qa/frontend/screens/phase-N/`. Only P1 screens have wireframes/`pages/` folders; P2–P4 screens were designed from the stories directly. Stand-ins for real services (payments, camera, printer, GPS, audio, QuickBooks, wallets) are listed in each review.

- **Routes:** `src/App.jsx`.
  - Areas: `/app/*` planner (incl. `/app/day-of/:id`, `/app/kj/:id`, `/app/booth/:id`, `/app/grow`), `/app/staff/*` staff, `/portal/*` client, `/b/:biz/*` public inquiry/booking, `/i/:token` and `/e/:slug/*` guests (no account; the guest's token is `?t=`; give/auction/tickets/karaoke/gallery… pages skip the site's privacy gate, see `GuestLayout`), `/v/:token/*` vendors (magic link), `/join/:token` staff invite, `/print/events/:id/*` and `/screen/*/:id` and `/booth/:id` (no app frame), `/outbox` demo messages, `/help` the How-To.
  - Event Hub tabs: Overview · [Wrap-up after teardown] · Tasks · Guests (list, invitations, design, website, potluck, seating, tickets) · Logistics (run of show, vendors, staff, booth & karaoke, gear) · Fundraising · Money · Files · Messages.
  - Pages are code-split with `lazyPage()` (`src/lib/lazyPage.js`, uses React `use()`; call it on every render). Layouts stay eager.
  - Every layout wraps its `<Outlet>` in `PageFrame` (`components/shell/PageFrame.jsx`): Suspense fallback, an error boundary with "Try again", and the page fade (off for reduced motion and the respectful tone).
- **State:**
  - `src/store/reducer.js` handles app-level actions and dispatches everything else to the domain handler maps in `src/store/actions/`:
    - `sales.js` (leads, consults, proposals);
    - `booking.js` (accept, sign, pay, countersign, invoice);
    - `hub.js` (tasks, guests, website, invitations, files, approvals, threads, reschedule, cancel, client requests);
    - `guests.js` (RSVP, reminders, staff join);
    - P2–P4: `logistics.js` (vendors, run of show, budget, gear, final week), `staff.js` (shifts, clock, packing, team chat), `eventDay.js` (day-of, check-in, sales, incidents, teardown, close-out), `potluck.js`, `karaoke.js`, `booth.js` (booth, magnets, galleries, thank-yous), `designer.js` (invitation designer), `giving.js` (donations, auction, paddle, sponsors), `seating.js` (tickets, floor plan), `grow.js` (QuickBooks, marketing, templates, reviews).
  - Handler names mirror `functions.sql` (the mapping table is in `documentation/README.md` §3.5); keep the same rules (e.g. countersign needs the deposit). Shared helpers (`newId`, `updateById`, `withMessage`, `withActivity`, `withToast`) are in `store/helpers.js`. All lookups go through `selectors.js`, which re-exports the per-area files `selectorsLogistics/EventDay/Karaoke/Booth/Giving/Seating/Grow.js` (import from `selectors.js` in screens).
  - Seed: `src/data/seed.js` (business, team, catalog, leads, proposals, contracts, events, invoices, tasks, Outbox) + `seedPlanning.js` (guests, files, approvals, questionnaires, threads, per-event website/invitation details) + one file per later area (`seedLogistics`, `seedKaraoke`, `seedBooth`, `seedGiving`, `seedSeating`, `seedGrow`). `withPlanning(event)` gives every event its defaults (`site`, `invitation`, `potluck`, `karaoke`, `booth`, `fund`, `auction`, `floorPlan`, `ticketing`…). Demo events per area: Acme (logistics, karaoke, booth, seating), Thompson (memorial, event day), Hope (potluck, fundraising, tickets), Okafor/Westlake (closed: reports, galleries). "Today" is **Thu Nov 5, 2026, 6 PM** (`src/lib/clock.js`; never call `new Date()` for today).
  - Money is in cents (`lib/money.js`; proposal math in `lib/proposal.js`). Calendar days are `'YYYY-MM-DD'`, read as local days with `parseDay`.
  - Soft delete + Undo: `toast/show` takes `undo: <action>` (e.g. `{ type: 'guest/restore', guestId }`).
  - **Action payloads can't use a `type` field for data** (it's the action name); use `eventType` etc.
- **Demo:**
  - The demo bar's "Viewing as" sets `ui.role` plus who: `ui.memberId` (planner as a teammate, e.g. `planner:devon` to show permissions via `can(state, perm)`), `ui.clientId` (which client's portal: `ana` before booking, `acme` after), `ui.staffId`.
  - Outbox messages carry `link.role` / `link.clientId` / `link.staffId`, and opening the link switches to that person. A `vendor` role exists for `/v/` pages.
  - Double-tap safety: charging actions (donations, tickets) take an idempotency `key` and ignore a repeat.
  - The demo clock never reaches an event day, so day-of features have "Start event day" / practice-mode buttons.
  - `RequireRole` shows the friendly no-access page otherwise. Demo codes: card 4242… works, 4000…0002 declines; staff SMS code 123456.
- **Guest pages:** all words come from `src/lib/guestText.js` (EN + ES, `guestT(lang)`, `guestDate`). `GuestLayout` finds the event from the token or slug and gates private/password sites. `?preview=1` (or the planner role) bypasses the gate.
- **QR codes:** `components/ui/QrCode.jsx` (dependency `qrcode-generator`). **Charts:** `components/charts/BarChart.jsx`; series colors were validated with the dataviz skill's palette validator for light and Bold-dark surfaces.
- **Help / How-To:** `src/data/howTo.js` is the single source for the `/help` page and `documentation/HOW_TO.md` (screenshots in `documentation/how_to/`). Edit the data, then run `npm run docs:howto`.
- **Styling:** `src/main.jsx` imports `index.css` (which imports `tokens.css`) *before* any component, so CSS-module styles load after the tokens and win ties. `GuestLayout` remaps the app tokens (`--color-*`, `--font-display`) onto the event theme's `--theme-*` variables, so shared components wear the event theme on guest pages.
- **Layouts:** `AppShell` (sidebar ≥1024px, top tabs 768–1023, phone bottom bar with 4 items + "More (n)") is shared by the planner, portal and staff layouts.
  - The portal locks Home/Guests/Mood Board/Approvals until the deposit.
  - `EventHubLayout` passes `{ event }` as outlet context (`GuestSubTabs` forwards it) and sets `data-tone="respectful"` for memorials.
- **Overflow gotcha:** `.visually-hidden` is `position: absolute`, so inside a horizontally scrolling box it can widen the page. Give the scroll container `position: relative`.
- **Tests:**
  - `src/test/renderApp.jsx` renders the whole app at a URL as a role (optionally with a modified `initialState()`). Write tests first, and query by role/label.
  - Vitest runs with `maxWorkers: '50%'` and a 30 s `testTimeout` (`vite.config.js`): whole-app click-through tests timed out when every core ran in parallel.
  - `src/test/setup.js` preloads every lazy page (so queries work right after render), adds jest-dom, and stubs `<dialog>` and `scrollTo`. Use fake timers (`vi.useFakeTimers({ shouldAdvanceTime: true })` + `vi.advanceTimersByTimeAsync`) for the 600 ms "processing" steps.
  - Accessible names join adjacent elements without spaces, so put a real `{' '}` between a visually-hidden prefix and the label.
  - `qa/frontend/rivera-walkthrough.js` clicks the whole story in a real browser (run it with the Playwright MCP `browser_run_code_unsafe`, `filename`).
- **Lint rule to know:** `react-refresh/only-export-components`. A `.jsx` file should export only components, so shared constants and helpers live in `src/lib/` or `store/selectors.js`.
- **Browser checks (Playwright/Chrome DevTools):** a full page load resets the store, including the demo role. Change the demo bar's select, then navigate client-side (links or `history.pushState` + `popstate`). Measure performance on `npx vite preview` (a production build), not the dev server.
- **Design skills** in `.claude/skills/` (frontend-design, ui-ux-pro-max, taste-skill: read `references/app-screens.md` for workspace screens, design-motion-principles). Where they conflict with `style_guide.md`, the style guide wins.

## Style system (`app_outline/style_guide.md`)

- **Layers:** app mode (Calm default / Bold opt-in, `data-mode` on `<html>`) → business branding (NFR-15) → per-event theme (`events.theme` stores a theme id) → respectful tone (`data-tone="respectful"`, automatic for `tone: 'respectful'` themes and `memorial` events, also quiets the planner's Event Hub for that event).
- **Code:** `src/styles/tokens.css` (app tokens; keep its `/* @mode … */` comments, the contrast script parses them), `src/styles/themes.js` (27 event themes as data, `themeToCssVars`, status-chip maps, `APP_NAME` / `BRAND_NAME` / `APP_BYLINE`: the app is "Crowned", brought to you by Simon Says: Celebrate), `src/styles/contrast.js`, fonts in `src/assets/fonts/` (self-hosted, licences alongside).
- **Rules:** components use CSS variables only (never raw hex); display fonts only for headings ≥ 24px; errors/money/legal text never playful. Adding a theme = one object in `themes.js`, then `npm run check:contrast` (also runs in CI and fails below WCAG AA).
- **Preview:** `python3 -m http.server 8767` from the repo root → `/app_outline/style_guide/theme_gallery.html` (imports the real tokens and themes). Re-take its `theme_gallery_*.png` screenshots when the look changes.

## Course workflow (`setup.md`) and CI

The intended workflow is: branches `main` / `dev` / `feature/...`; Dockerfiles for running and for testing; write tests first, then code, refactor, document and comment. Work on a `feature/...` branch and open a pull request into `dev`; merge `dev` into `main` when it's stable. There's no Docker setup yet.

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and on pull requests into `main`/`dev`, as three parallel jobs:
- **database:** `run_tests.sh` and `run_qa_db_probes.sh`, using the runner's PostgreSQL 16
- **generators:** `qa/test_generators.py`, so generated files must be committed in sync
- **frontend:** `npm ci`, `npm run lint`, `npm test`, `npm run check:contrast`, `npm run build`

## Notes

- `.claude/agents/` and `.claude/skills/` were copied from a previous project ("BookWorm"). `front-end-agent.md` still refers to BookWorm's `front-end/` folder, so adapt it before relying on it.
- Root-level `*:Zone.Identifier` files are Windows download metadata; ignore them.
- `README.md` is the short intro (try it, commands, phases); `documentation/README.md` is the long-form guide; `documentation/HOW_TO.md` is the user guide (generated).
- `prompt-claude-master.md` (untracked) is the owner's front-end build prompt; its HTML comment about building the front end only, before the backend, is intentional and should stay.
