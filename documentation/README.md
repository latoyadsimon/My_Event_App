# Event Planner App: Project Documentation

## 1. What this project is

This is an all-in-one event planner app called **Crowned** (brought to you by Simon Says: Celebrate). It is a multi-tenant SaaS: each planning business is a "tenant" with its own private data. The app is meant to run a planner's whole business: leads, proposals, contracts, payments, then guests and RSVPs. Later phases add vendors, equipment, staff, the event day, potluck, karaoke, photo booth, an invitation designer, fundraising, tickets and seating, and business reports.

**The front end is complete; the back end is next.** The repository holds:

- written designs, clickable wireframes and one folder per screen
- **the front-end app** (`src/`): a React single-page app with every screen of product phases P1–P4, for all five roles (planner, client, guest, staff, vendor). Its data lives in the browser and resets on refresh (section 3.5)
- a Supabase Postgres database design (tables, security rules and server functions) for P1, not connected yet; the P2–P4 tables are sketched
- automated tests: 502 front-end tests (Vitest) and the database tests
- a user guide: [`HOW_TO.md`](HOW_TO.md), also inside the app at `/help`

Product phases are P1 core business, P2 event operations, P3 guest experience and P4 growth. The owner's build order is: the whole front end first (done), then the database, then the APIs. The running example in every document is the **Rivera wedding**: Sat Jun 12, 2027, 120 guests, total $14,850, paid as $4,455 + $5,940 + $4,455 (`wireframes/walkthrough_rivera.md`).

## 2. Folder layout

```
event_planning_app01/
├── CLAUDE.md                       Architecture summary and commands (a map; verify against files)
├── setup.md                        Course workflow notes (branches, Docker, test-first); not reviewed in detail here
├── app_outline/
│   ├── product_spec.md             The owner's spec: roles, modules, phases, integrations
│   ├── user_journeys.md            Per-role stages, steps, edge cases, cross-role triggers
│   ├── user_stories.md             Stories (IDs like PL-3.4) with acceptance checkboxes
│   ├── pages/
│   │   ├── build_pages.py          Generator for the page folders
│   │   ├── _wireframe_screens.json Screen export from the wireframe (input to the generator)
│   │   ├── README.md               Generated index of pages
│   │   └── <role>/<page>/          One folder per screen: README.md, wireframe.png, tests/README.md
│   │       (roles: planner, client, guest, staff, messages, shared)
│   └── erd/
│       ├── schema.sql              Tables + row-level security + guest RSVP functions
│       ├── functions.sql           Server functions for the booking flow
│       ├── build_erd.py            Generator: schema.sql to erd_data.js + data_dictionary.md
│       ├── erd.html                Draws the diagram from erd_data.js
│       ├── erd_data.js             Generated
│       ├── data_dictionary.md      Generated
│       ├── README.md               Function table, test notes, how to change the data model
│       └── tests/                  run_tests.sh, supabase_stub.sql, helpers.sql,
│                                   test_rls.sql, test_functions.sql
└── wireframes/
    ├── wireframe.html              Lo-fi wireframes (JOURNEYS data array + JS helpers)
    └── walkthrough_rivera.md       Log of the end-to-end walkthrough and decisions
```

Not covered in this document: PNG images, `.claude/skills/`, `.playwright-mcp/` and `*:Zone.Identifier` files. `.claude/agents/` and `.claude/skills/` were copied from an earlier project ("BookWorm"). CLAUDE.md says `front-end-agent.md` still refers to that project's folders.

Front-end files (inside `My_Event_App/`):

```
My_Event_App/
├── src/
│   ├── App.jsx                     Every route (pages load on first visit: lib/lazyPage.js)
│   ├── layouts/                    The frame per area: planner, Event Hub, portal, public, guest, staff
│   ├── pages/<role>/               The screens (planner/, client/, guest/, staff/, shared/)
│   ├── components/                 Shared UI: ui/, shell/ (app frame, demo bar, toasts), booking/,
│   │                               proposal/, guests/, planning/ (mood board, conversations), brand/
│   ├── store/                      reducer.js + actions/*.js (every change), selectors.js (every lookup)
│   ├── data/                       seed.js + seedPlanning.js (the demo world), howTo.js (the guide)
│   └── lib/                        clock (the demo's "today"), money, proposal math, csv, ics, guest words
├── qa/frontend/                    One review per build phase, screenshots, the Rivera walkthrough script
├── scripts/                        check_contrast.mjs, build_howto.mjs
└── documentation/                  This file, HOW_TO.md and its screenshots (how_to/)
```

## 3. Where each feature lives

### 3.1 Design documents (`app_outline/`)

| Need | File |
|---|---|
| Roles, modules, phases, open questions | `app_outline/product_spec.md` (roles table near the top, from line 13) |
| What each role does step by step, edge cases, and "→ System" triggers | `app_outline/user_journeys.md` (planner steps start around line 72) |
| Requirements as stories | `app_outline/user_stories.md` (how-to-read and Definition of Done at lines 1-22; planner stories start at line 25) |

Story ID prefixes are PL planner, CL client, GU guest, ST staff, VN vendor, DN donor, SYS backend and NFR non-functional. Each journey step became a story, and each edge case became an acceptance-criteria checkbox. If a story is missing, the feature is not designed yet (`user_stories.md:5`). Under each P1 story, a `Page:` line is written by `build_pages.py`.

### 3.2 Wireframes (`wireframes/wireframe.html`)

| Piece | Location |
|---|---|
| HTML-string helpers (`X`, `btn`, `field`, `card`, `state`, `grid`, `row`, `pill`, `list`, `seg`, `steps`) | `wireframes/wireframe.html:294-308` |
| `NAV` (nav items per role) and `shell()` (the app frame around each screen) | `wireframes/wireframe.html:311`, `wireframes/wireframe.html:319` |
| `msg()` (email, text and push message frames) | `wireframes/wireframe.html:355` |
| Role presets `P`, `C`, `PRE`, `G` (`PRE` is the locked portal before booking) | `wireframes/wireframe.html:390-394` |
| `JOURNEYS` array (the screen definitions) | starts at `wireframes/wireframe.html:403`; first journey is planner, first screen is Sign Up at line 426 |
| Renderer: `frame()`, `renderJourney()`, final render into `#app` | `wireframes/wireframe.html:1384`, `:1393`, `:1416` |

Each journey has an `id`, `title`, `meta`, device `order`, a `flow` (steps with `edge` cases) and `screens`. Each screen has `name`, `route`, `url`, `from` and `next` (its click path), a `render(d)` function, and `notes`. Here `d` is `desktop`, `tablet` or `phone`. A note with `k: 'sys'` marks a "→ System" trigger. A screen with `kind` of email, sms or push is a message frame rather than an app screen.

`wireframes/walkthrough_rivera.md` records the decisions made while walking the Rivera wedding through every screen:

- Decisions table at line 7. It includes "the client pays the deposit right after signing".
- Timeline at line 37.
- Still-open list at line 81.

### 3.3 Page folders (`app_outline/pages/`)

- The folder map is the `PAGES` list in `app_outline/pages/build_pages.py:49`, with one `page(role, folder, title, [story IDs], route=...)` entry per screen. The `page()` helper is at line 39 and the `ROLES` table at line 29.
- Story parsing is `read_stories` (line 132). Page text is built by `page_readme` (line 185), `tests_readme` (line 247) and `index_readme` (line 269). `add_page_links` (line 321) writes the `Page:` lines back into `user_stories.md`.
- An example output is `app_outline/pages/guest/rsvp/README.md`: role, phase, stories, route, URL, wireframe image, "arrives from / next", story text with checkboxes, and design notes.

### 3.4 Database (`app_outline/erd/`)

**Tables (`schema.sql`).** Each table has an `-- @table` header comment, which `build_erd.py` parses.

| Area | Lines |
|---|---|
| Identity and tenancy: `businesses`, `profiles`, `memberships`, `clients` | `schema.sql:31-77` |
| Sales: `templates`, `leads`, `date_holds`, `packages`, `add_ons`, `proposals`, `proposal_items` | `schema.sql:101-201` |
| Booking: `events`, `event_hosts`, `contracts`, `appointments` | `schema.sql:222-283` |
| Money: `invoices`, `installments`, `payments`, `change_orders` | `schema.sql:306-360` |
| Planning and collaboration: tasks, questionnaires, mood boards, files, comments, approvals, messages | `schema.sql:381-497` |
| Guests: `event_websites`, `meal_options`, `households`, `guests`, `invitations` | `schema.sql:516-586` |
| Delivery and system: `deliveries`, `opt_outs`, `domain_events`, `activity_log` | `schema.sql:609-655` |
| Indexes and `updated_at` triggers (loops over `information_schema`) | `schema.sql:667-702` |

Key columns:

- `events.portal_unlocked_at` is at `schema.sql:240`.
- `payments.processor_payment_id` (unique) and `payments.idempotency_key` (unique) are at `schema.sql:349-350`.
- `households.invite_token` is at `schema.sql:552`.

**Row-level security helpers** (`schema.sql`, section 10 starting at line 705):

| Helper | Line | Checks |
|---|---|---|
| `is_member(b)` | 716 | Active member of the business |
| `has_permission(b, perm)` | 723 | Owner, or a member whose `permissions` JSON grants `perm` |
| `is_owner(b)` | 730 | Active owner |
| `is_event_host(e)` | 737 | Signed-in client or co-host of the event |
| `host_can_plan(e)` | 744 | Host and the deposit is paid (`portal_unlocked_at` is set) |
| `is_lead_client(l)` | 751 | Client on a lead, used before an event exists |

RLS is switched on for every `public` table by a loop (`schema.sql:758`). The policies come in patterns:

- **Pattern 1** (`schema.sql:766`): members manage most tables.
- **Pattern 2** (`schema.sql:780`): money tables need `see_budgets`. `payments` is read-only for people (line 791).
- **Pattern 3** (`schema.sql:794`): members read-only, server writes. `domain_events` deliberately has no user policy at all (line 798).
- **Identity tables** (`schema.sql:800-811`).
- **Pattern 4** (`schema.sql:813-868`): clients and hosts see only their own things.

**Guest RSVP access (`schema.sql:873-934`).** Guests never sign in and have no table access.

- `guest_household(p_token)` (line 878) returns one JSON bundle: the household, event, website settings, meal options and guests.
- `guest_submit_rsvp(p_token, p_replies)` (line 900) refuses when RSVPs are closed (line 913). It updates only guests in that household (line 925), then writes an `rsvp.updated` domain event (line 927).
- The grants at lines 931-934 allow `anon` and `authenticated`.

**Booking functions (`functions.sql`):**

| Function | Line |
|---|---|
| `_emit` (internal event writer) | 32 |
| `_recalc_proposal` | 41 |
| `_apply_payment` | 63 |
| `client_mark_proposal_viewed` | 103 |
| `client_request_proposal_changes` | 119 |
| `client_accept_proposal` | 140 |
| `client_sign_contract` | 206 |
| `record_payment` | 330 |
| `planner_record_manual_payment` | 387 |
| `planner_countersign` | 421 |
| `client_decide_change_order` | 480 |
| revoke/grant section ("who may call what") | 528-553 |

**Generators and viewer.**

- `build_erd.py`: `AREAS` layout (line 27), `AUTH_USERS` (44), `LATER` phase 2-4 sketches (57), `parse_schema` (93), `check_layout` (136), `write_erd_data` (149), `write_dictionary` (159), `main` (216).
- `erd.html` loads `erd_data.js` at line 91. It then draws with `drawArea`, `drawOverview` and `drawAll` (lines 167, 195, 280).

**Tests (`app_outline/erd/tests/`).**

- `run_tests.sh`: the runner.
- `supabase_stub.sql`: fakes `auth.users`, `auth.uid()` and the anon/authenticated/service_role roles.
- `helpers.sql`: `test.eq(label, actual, expected)` at line 29 and `test.expect_error(sql, fragment)` at line 11.
- `test_rls.sql`: seven numbered checks covering tenants, staff permissions, client unlock, clients unable to write payments, guest token, duplicate `idempotency_key`, and `updated_at`.
- `test_functions.sql`: the Rivera booking from start to finish, plus cases that must be refused.

### 3.5 The front end (`src/`)

A React 19 + Vite single-page app with React Router. It was built in nineteen phases (0–7 = P1, 8–11 = P2, 12–14 = P3, 15–17 = P4, 18 = docs), each with a review in `qa/frontend/phase_N_review.md`. Only P1 screens have wireframes; P2–P4 screens were designed straight from the user stories.

**What a visitor can do.**
- **Planner:** set up, leads, proposals, contracts, invoices, events, the Event Hub's tabs, calendar and settings (P1). Logistics (run of show, vendors, staff, gear), day-of mode and wrap-up, potluck (P2). The KJ console, photo booth and invitation designer (P3). Fundraising, tickets and seating, and Grow (reports, marketing, templates, reviews) (P4).
- **Client:** inquiry, booking a consult, and the portal before and after the deposit; later the day-of view, entertainment, gallery, thank-yous and a review.
- **Guest:** invitation, event website, RSVP and confirmation, in English or Spanish; potluck sign-up, song requests, gallery and magnets, giving and bidding, tickets, find my seat and a one-question survey.
- **Staff:** join by phone code, a profile, then shifts, swaps, availability, clock in/out, packing and team chat.
- **Vendor:** a magic link with their details, paperwork and messages.
- **Venue screens** with no app frame: the karaoke screen, the booth kiosk, the live gallery and the giving total.

A **demo bar** switches who you're viewing as. An **Outbox** shows every email, text and push the app "sent", with buttons that open the real screen.

**Where data lives.** One in-memory store (React `useReducer` + Context), seeded with Bella Events on Thu Nov 5, 2026 (`src/lib/clock.js`). Money is in cents. Calendar days are `'YYYY-MM-DD'` and are read as local days. A refresh starts over.

**How it maps to Supabase.** Screens only `dispatch` actions and read through `selectors.js`. Each action handler is named after the server step it stands in for, so the backend can replace them one at a time:

| Front-end action | Becomes (Supabase) |
|---|---|
| `lead/create` | insert into `leads` + `lead.created` event (push, auto-reply) |
| `proposal/send`, `proposal/saveDraft` | `proposal_versions` insert + email with a magic link |
| `proposal/view`, `proposal/requestChanges`, `proposal/accept` | `client_mark_proposal_viewed`, `client_request_proposal_changes`, `client_accept_proposal` |
| `contract/clientSign` | `client_sign_contract` (creates the event, invoice and schedule) |
| `payment/succeeded`, `payment/failed` | `record_payment`, called only by the Stripe/Square webhook |
| `payment/recordManual` | `planner_record_manual_payment` |
| `contract/countersign` | `planner_countersign` (refused until the deposit is paid) |
| `approval/decide` (change orders) | `client_decide_change_order` |
| `rsvp/submit` | `guest_submit_rsvp` |
| everything else (tasks, guests, files, threads…) | plain inserts/updates under row-level security |

**P2–P4 actions.** These handler files have no server functions yet. The tables are the sketches in `data_dictionary.md` › "Later phases"; the right-hand column is a proposal for the database step, not a decision.

| Front-end actions (`src/store/actions/`) | Tables (sketched) | Likely server functions / notes |
|---|---|---|
| `logistics.js`: `vendor/*`, `eventVendor/*`, `timeline/*`, `budget/*`, `equipment/save`, `kit/save`, `gear/*`, `pack/*` | `vendors`, `event_vendors`, `timeline_items`, `budget_lines`, `equipment_items`, `kits`, `reservations` | Vendor pages use a token, like guests (`vendor_*` functions). `gear/reserve` runs inside `planner_countersign` (PL-3.4). `eventVendor/recordPayment` needs a vendor-payments table |
| `staff.js`: `shift/*`, `staff/setAvailability`, `pack/scan`, `timesheet/*`, `thread/postTeam` | `shifts`, `shift_assignments`, `time_entries`, `equipment_scans` | `staff_clock_in/out` with a location check; availability and team chat need tables |
| `eventDay.js`: `event/startDay`, `guest/checkIn`, `sale/onsite`, `incident/log`, `event/teardownDone`, `deposit/*`, `event/close` | `incidents`, `equipment_scans`, plus columns on `guests`/`events` | Security-deposit release/apply go through the payment processor, like refunds |
| `potluck.js`: `potluck/*`, `volunteer/*` | `potluck_slots`, `potluck_signups` | Guests sign up through token functions, like `guest_submit_rsvp` |
| `karaoke.js`: `karaoke/*` | `songs`, `song_requests` | The queue needs Realtime (KJ console ↔ screen ↔ phones) |
| `booth.js`: `booth/*`, `photo/*`, `magnet/*`, `gallery/*`, `guest/thankYou` | `photos`, `booth_sessions`, `prints` | Photos go to Storage; booth settings, gifts and thank-yous need tables or columns |
| `designer.js`: `invitation/design`, `invitation/*Template` | (none yet) | Probably a jsonb design on the event's invitation, plus business templates |
| `giving.js`: `donation/*`, `bidder/register`, `bid/place`, `auction/*`, `paddle/*`, `sponsor/*` | `donations`, `auction_items`, `bids` | Every charge is idempotent (`idempotency_key`), like `record_payment`. Paddle pledges and sponsors need tables |
| `seating.js`: `ticketing/configure`, `ticket/*`, `waitlist/join`, `floor/*`, `seat/assign`, `guest/avoid` | `ticket_tiers`, `tickets`, `floor_plans`, `seat_assignments` | `floor/lock` becomes a Realtime presence channel; the waitlist and promo codes need tables |
| `grow.js`: `quickbooks/*`, `marketing/*`, `event/duplicate`, `template/*`, `review/request`, `survey/send`, `feedback/submit` | (none yet) | Reports are read-only queries over existing tables; marketing dates, feedback and event templates need tables |

The pricing rules in `src/lib/proposal.js` mirror `_recalc_proposal()`. The front end can keep them for live previews; the server's numbers stay the source of truth.

**Quality gates (every phase, in CI):**
- `npm test`, `npm run lint`, `npm run build` and `npm run check:contrast`;
- Playwright screenshots compared with the wireframes;
- Lighthouse accessibility 100 on every page type checked;
- no sideways scroll at 375, 768 and 1280.

`qa/frontend/rivera-walkthrough.js` clicks the whole Rivera story end to end, as every role.

## 4. How the pieces connect

```
product_spec.md ──► user_journeys.md ──► user_stories.md ──► pages/<role>/<page>/README.md
                                              ▲                        ▲
                                              │ (Page: lines written   │
                                              └── back by generator)   │
wireframe.html (JOURNEYS) ──► _wireframe_screens.json ──► build_pages.py ┘
        └──► wireframe.png crops (by hand, Playwright)

schema.sql ──► build_erd.py ──► erd_data.js ──► erd.html (diagram)
                          └──► data_dictionary.md

supabase_stub.sql + schema.sql + functions.sql + helpers.sql + test_*.sql ──► run_tests.sh
```

**Design chain.** The spec is the owner's intent. The journeys turn it into steps and edge cases. The stories turn those into checkable requirements. The page folders regroup the P1 stories by screen.

**Wireframe chain.**

1. The `JOURNEYS` array in `wireframe.html` defines the screens.
2. A per-screen export is saved as `_wireframe_screens.json`. CLAUDE.md says this and the PNG crops are made "by Playwright, by hand". No export script is in the repo, so how the JSON is produced is not documented here.
3. `build_pages.py` reads the JSON by `route`.
4. `build_pages.py` stops with an error if any P1 story has no page, any story ID is unknown, any page route is missing from the wireframe, or any wireframe screen has no page (`build_pages.py:356-370`).

**Database chain.** `build_erd.py` parses `schema.sql`. It requires the `-- @table` header and one column per line with a trailing comment. It also requires every table to be placed in `AREAS`, otherwise it stops with an error (`build_erd.py:136-146`).

**Tests.** For each `tests/test_*.sql` file, `run_tests.sh` creates a fresh database and loads the stub, `schema.sql`, `functions.sql`, `helpers.sql`, then the test (`run_tests.sh:28-32`). Tests switch identity with `set role authenticated` plus `set request.jwt.claim.sub = '<uuid>'` (per CLAUDE.md).

### Sources of truth versus generated files

| Source of truth (edit these) | Generated (do not hand-edit) |
|---|---|
| `product_spec.md`, `user_journeys.md` | none |
| `user_stories.md` (except the `Page:` lines) | `Page:` lines in `user_stories.md`, `pages/README.md`, every `pages/<role>/<page>/README.md` |
| `wireframes/wireframe.html` | `pages/_wireframe_screens.json`, `wireframe.png` files |
| `erd/schema.sql`, `erd/functions.sql` | `erd/erd_data.js`, `erd/data_dictionary.md` |
| `PAGES` in `build_pages.py`, `AREAS` in `build_erd.py` | n/a (these are config inside the generators) |
| `pages/**/tests/README.md` (developers tick the boxes) | created once, then never overwritten (`build_pages.py:378-380`) |

`app_outline/erd/README.md` calls `schema.sql` "the source of truth".

## 5. The booking flow and the event bus

The sequence below is from the header of `functions.sql:20-23` and the function bodies. The key design decision is that the client accepts, signs and pays the deposit in one sitting. The planner countersigns afterwards (`wireframes/walkthrough_rivera.md:11`).

1. **Client views.** `client_mark_proposal_viewed` changes the proposal from `sent` to `viewed` and emits `proposal.viewed`. Optionally, `client_request_proposal_changes` sets `changes_requested` and emits `proposal.changes_requested`.
2. **Client accepts.** `client_accept_proposal` (`functions.sql:140`):
   - Refuses if there is a newer version (line 158).
   - Counts only the ticked optional upgrades, then recalculates totals via `_recalc_proposal` (lines 163-165).
   - Marks the proposal `accepted` and older ones `superseded`.
   - Builds a contract from the business's contract template, filling merge fields such as `{{business}}`, `{{total}}` and `{{deposit}}` (lines 179-187).
   - Emits `proposal.accepted` and returns the contract id.
3. **Client signs.** `client_sign_contract` (`functions.sql:206`) checks the caller via `is_lead_client`, then in one transaction:
   - Creates the event with status `awaiting_countersign` and a primary `event_hosts` row (lines 257-264).
   - Creates the invoice, numbered from 1001 (lines 267-271).
   - Creates installments from the business's `payment_schedule` template, or a default of deposit, then 40%, then the remainder (lines 276-305). The last installment absorbs rounding so the schedule always sums to the total.
   - Records the signature and sets the lead to `won` (lines 308-312).
   - Emits `contract.client_signed`, and returns the event, invoice and deposit installment ids and the deposit amount for the Pay screen.
4. **Payment webhook records the deposit.** `record_payment` (`functions.sql:330`) is granted only to `service_role` (line 553). It is meant to be called by the Stripe/Square webhook; that webhook function is not written yet (`erd/README.md`, "Open questions").
   - It is idempotent on `processor_payment_id` (line 353). A duplicate returns the existing payment and changes nothing.
   - On success it calls `_apply_payment` (line 63). That updates the invoice balance and status, marks the installment `paid`, and if it is the first installment sets `events.portal_unlocked_at` (lines 84-88). It then emits `payment.succeeded`.
   - On failure it emits `payment.failed` with a 24-hour failure count (lines 376-381).
   - Planners can record cash, check, Venmo, Zelle or Cash App via `planner_record_manual_payment` (line 387). It needs `see_budgets` and also goes through `_apply_payment`.
5. **Planner countersigns.** `planner_countersign` (`functions.sql:421`) is limited to owners and coordinators (line 435):
   - Sets the contract to `countersigned` and the event to `booked`.
   - Converts the date hold.
   - Creates checklist tasks from the template, with due dates relative to the event date (lines 455-466).
   - Emits `contract.countersigned`.
6. **Afterwards.** `client_decide_change_order` (line 480) handles approvals. Only hosts with `full` access can use it. Approving adds the amount to the invoice and to the next unpaid installment.

### How `domain_events` ties actions together

`_emit()` (`functions.sql:32`) is called by almost every function. It writes two rows:

- A `domain_events` row, which is the machine-readable "outbox" (`schema.sql:642`): `type`, `payload`, `processed_at`, `attempts` and `last_error`.
- An `activity_log` row, which is the human-readable history shown on Lead Detail and events (`schema.sql:655`).

Event types seen in the code:

- `proposal.viewed`
- `proposal.changes_requested`
- `proposal.accepted`
- `contract.client_signed`
- `payment.succeeded`
- `payment.failed`
- `contract.countersigned`
- `change_order.decided`
- `rsvp.updated` (written directly by `guest_submit_rsvp`, not via `_emit`)

CLAUDE.md says every "→ System" step in the journeys should map to a domain event. The schema defines the outbox columns for retries, but **no worker that reads and processes these events exists in the repo**, so what reacts to them (emails, alerts) is still to be built. `domain_events` has no user-facing policy, so only the server can read or write it.

## 6. Analogies for non-technical teammates

| Technical piece | Everyday picture |
|---|---|
| **Multi-tenant** (`business_id` on every table) | An apartment building. Every planning business has its own locked apartment. They share plumbing and the lobby, but nobody can walk into a neighbor's home. |
| **Row-level security** (`schema.sql:705-868`) | A security guard who checks your badge on every single page of the filing cabinet, not just at the front door. Hiding a button is a "Staff Only" sign; this is the actual lock. |
| **Permissions** (`has_permission`, `see_budgets`) | Keys on a keyring. Owners have the master key. Staff get only the keys the owner hands out, for example the key to the money room. |
| **Client portal unlock** (`host_can_plan`, `portal_unlocked_at`) | A VIP lounge that opens once the deposit is paid. Before that, the client can see the locked door and use the front-desk chat. |
| **Invite token** (`households.invite_token`) | A ticket with a secret code printed on it. Whoever holds it can enter that one family's section of the venue and nowhere else, with no account needed. If it is forwarded, it still works for the same household. |
| **Guest functions** (`guest_household`, `guest_submit_rsvp`) | A ticket window with a small slot in the glass. Guests pass their code through, and only the answers for their own household come back. |
| **Server functions** (`functions.sql`) | A checklist run by a trained clerk. You hand over a form and the clerk does every step in order, or does none of it. You cannot skip a step. |
| **Transaction ("all or nothing")** | Writing a cheque and updating the ledger together. If the ledger update fails, the cheque is torn up. |
| **Security definer** | The clerk has the vault key, but will only open the vault after checking who is asking and why. |
| **`record_payment` and `processor_payment_id`** | The bank's own receipt. The app trusts the bank's receipt, not the customer saying "I paid". If the bank sends the same receipt twice, it is filed once. |
| **Idempotency key** | A unique number on a restaurant order slip, so tapping "Pay" twice does not bring two meals. |
| **Event bus** (`domain_events`) | A noticeboard in the office kitchen. Each action pins a note ("contract signed!"). Other helpers read the board and act, so the person who signed does not have to call everyone. |
| **Activity log** | The guest book at the front desk: who did what, and when, in plain words. |
| **Wireframes** (`wireframe.html`) | Architect's paper floor plans. They show where rooms and doors go, with no paint or furniture. The Rivera walkthrough is walking the plan with a client to check every door leads somewhere. |
| **Journeys, stories, pages** | Journeys are the travel itinerary. Stories are individual to-do items with checkboxes. Page folders are one folder per room in the house, holding that room's to-dos. |
| **Generated files** (`erd_data.js`, `data_dictionary.md`, page READMEs) | Photocopies of a master document. If you want a change, fix the master (`schema.sql`, `user_stories.md`) and run the copier. Scribbling on a copy gets erased the next time the copier runs. |
| **ERD diagram** | A subway map of the data. Stations are tables, lines are the links between them. |
| **Test stub** (`supabase_stub.sql`) | A film-set facade of the real town (Supabase), built so the tests can run on a normal computer. |
| **Rivera tests** (`test_functions.sql`) | A full dress rehearsal of the Rivera wedding booking, plus checks that the wrong person gets turned away at every door. |

## 7. Running the app, the generators and the tests

The front end (from `My_Event_App/`):

```bash
npm install
npm run dev              # the app at http://localhost:5173 (Help is at /help)
npm test                 # 263 Vitest tests
npm run lint
npm run build            # production build into dist/
npm run check:contrast   # WCAG AA for every color pair and all 27 event themes
npm run docs:howto       # rebuild documentation/HOW_TO.md from src/data/howTo.js
```

The design tools below are run from the repository root, `/home/ldsimon/CodePlatoon/event_planning_app01`.

```bash
# Database tests (needs PostgreSQL 15+ server tools: initdb, pg_ctl, psql)
bash app_outline/erd/tests/run_tests.sh
#   prints PASS or FAIL per test file; PGTEST_PORT overrides the port (default 54330)

# Regenerate ERD data and the data dictionary after editing schema.sql
python3 app_outline/erd/build_erd.py

# Regenerate the page folders after editing user_stories.md or PAGES
python3 app_outline/pages/build_pages.py

# View the wireframes and the ERD (they load sibling .js files, so serve over HTTP)
cd wireframes && python3 -m http.server 8765         # open wireframe.html
cd app_outline/erd && python3 -m http.server 8766     # open erd.html
```

Notes:

- Both generators use only the Python standard library.
- Each `test_*.sql` runs in a fresh throwaway database, which is deleted afterwards. To run one test file, CLAUDE.md suggests temporarily moving the others or copying the runner loop.
- To add a table, follow the house style in `schema.sql` (the `-- @table` header, one column per line with a trailing comment, statuses as `text` with a `check`). Then add it to `AREAS` in `build_erd.py` and run the script.
- To add a page, add a `page(...)` entry to `PAGES` in `build_pages.py`. Every P1 story and every wireframe route must be mapped, or the script fails.
- To add a server function, add the matching `revoke` and `grant` lines at the bottom of `functions.sql`, as the existing functions have.
- WSL and zsh quirks from CLAUDE.md:
  - Use `command rm`, because `rm` is aliased to `rm -i`.
  - Use `/usr/bin/diff`, because `diff` is a broken zsh function.
  - Postgres sockets fail on long paths, so start servers with `-k ''` and connect to `127.0.0.1`.

## 8. Known gaps and unclear points

- The front end is not connected to a backend yet: no real sign-in, email, SMS, payments, file storage or calendar sync. Each is simulated in the browser, and the stand-ins are listed in the phase reviews (`qa/frontend/`).
- The Stripe/Square webhook function and the checkout function are not written (`app_outline/erd/README.md`, "Open questions").
- Front-end items deferred to the backend or later phases:
  - QR codes on invitations;
  - forwarded-link detection on RSVPs;
  - co-hosts disagreeing on an approval;
  - automatic reminder timing (7 days / 1 day);
  - task attachments.
- There is no worker that processes `domain_events`.
- `client_sign_contract` sets the event start to noon on the requested date, because leads store only a date. The planner is expected to set the real time (`functions.sql:256`).
- Equipment reservation at countersign (PL-3.4) works in the front end, but the database still waits for the P2 equipment tables.
- The RSVP cutoff check in `guest_submit_rsvp` compares against `current_date`. Its own comment says the real function should use the event's time zone (`schema.sql:912`).
- The P2–P4 tables are sketches only (`LATER` in `build_erd.py`, not in `schema.sql`), and the front end needs a few more than the sketch has (see the P2–P4 table in section 3.5). Adding them is the next build step.
- P2–P4 stand-ins (camera, printer, GPS, audio, QuickBooks, wallet passes, Realtime) are listed in `qa/frontend/phase_8_review.md` to `phase_17_review.md`.
- The script or procedure that exports `_wireframe_screens.json` and the PNG crops is not in the repo. CLAUDE.md describes it only as "Playwright, by hand". `pages/README.md` is said to document "Refreshing wireframe images", but that section was not reviewed.
- Figures such as "37 tables" and "67 policies" in `app_outline/erd/README.md` were not re-verified here.
- `setup.md` (course workflow) and `product_spec.md` beyond its first 25 lines were not reviewed in detail. Docker is not set up yet.
