# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Design-stage repo for an all-in-one **event planner app** (multi-tenant SaaS for event planners: leads → proposals → contracts → payments → guests/RSVPs, later equipment, staff, photo booth, karaoke, donations). The repo holds the product design, a Supabase Postgres schema with server functions, database tests, and a fresh Vite + React scaffold (`src/`, `package.json`) where the app will be built. The user is a beginner developer (Code Platoon), so explain decisions and keep code commented for learning.

Build phases: **P1** core business (the current focus), P2 event operations, P3 guest experience, P4 growth. Running example used everywhere: the **Rivera wedding** (Sat Jun 12, 2027, 120 guests, total $14,850 = deposit $4,455 + $5,940 + $4,455). Keep new examples consistent with its timeline (see `wireframes/walkthrough_rivera.md`).

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
npm run dev      # local dev server
npm run lint     # ESLint (ignores .claude/ and the generated erd_data.js)
npm run build

# Regenerate ERD data + data dictionary after editing schema.sql
python3 app_outline/erd/build_erd.py

# Regenerate the per-page folders after editing user_stories.md (or PAGES in the script)
python3 app_outline/pages/build_pages.py

# View wireframes / ERD (they load sibling .js files; serve over HTTP for Playwright screenshots)
cd wireframes && python3 -m http.server 8765        # wireframe.html
cd app_outline/erd && python3 -m http.server 8766    # erd.html
```

Environment gotchas (WSL + zsh): `rm` is aliased to `rm -i` (use `command rm`); `diff` is a broken zsh function (use `/usr/bin/diff`); zsh doesn't word-split variables holding commands; Postgres Unix sockets fail on long paths, so start servers with `-k ''` and connect via `-h 127.0.0.1`.

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

## Style system (`app_outline/style_guide.md`)

- **Layers:** app mode (Calm default / Bold opt-in, `data-mode` on `<html>`) → business branding (NFR-15) → per-event theme (`events.theme` stores a theme id) → respectful tone (`data-tone="respectful"`, automatic for `tone: 'respectful'` themes and `memorial` events, also quiets the planner's Event Hub for that event).
- **Code:** `src/styles/tokens.css` (app tokens; keep its `/* @mode … */` comments, the contrast script parses them), `src/styles/themes.js` (27 event themes as data, `themeToCssVars`, status-chip maps, `APP_NAME`), `src/styles/contrast.js`, fonts in `src/assets/fonts/` (self-hosted, licences alongside).
- **Rules:** components use CSS variables only (never raw hex); display fonts only for headings ≥ 24px; errors/money/legal text never playful. Adding a theme = one object in `themes.js`, then `npm run check:contrast` (also runs in CI and fails below WCAG AA).
- **Preview:** `python3 -m http.server 8767` from the repo root → `/app_outline/style_guide/theme_gallery.html` (imports the real tokens and themes). Re-take its `theme_gallery_*.png` screenshots when the look changes.

## Course workflow (`setup.md`) and CI

The intended workflow is: branches `main` / `dev` / `feature/...`; Dockerfiles for running and for testing; write tests first, then code, refactor, document and comment. Work on a `feature/...` branch and open a pull request into `dev`; merge `dev` into `main` when it's stable. There's no Docker setup yet.

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and on pull requests into `main`/`dev`, as three parallel jobs:
- **database:** `run_tests.sh` and `run_qa_db_probes.sh`, using the runner's PostgreSQL 16
- **generators:** `qa/test_generators.py`, so generated files must be committed in sync
- **frontend:** `npm ci`, `npm run lint`, `npm run build`

## Notes

- `.claude/agents/` and `.claude/skills/` were copied from a previous project ("BookWorm"). `front-end-agent.md` still refers to BookWorm's `front-end/` folder, so adapt it before relying on it.
- Root-level `*:Zone.Identifier` files are Windows download metadata; ignore them.
