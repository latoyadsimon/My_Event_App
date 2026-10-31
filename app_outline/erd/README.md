# ERD: Event Planner data model (Phase 1)

Supabase Postgres · 37 tables + Supabase's `auth.users` · row-level security on every table.

| File | What it is |
|---|---|
| `schema.sql` | **The source of truth.** CREATE TABLE statements, keys, constraints, indexes, RLS policies and the guest RSVP functions. |
| `erd.html` | The diagram (open it in a browser). Overview, one detailed diagram per area, and Phase 2–4 sketches. Hover any column for its meaning. |
| `erd.png` | Overview image. `erd_<area>.png` = detailed diagram per area; `erd_later_phases.png` = Phase 2–4 sketches. |
| `data_dictionary.md` | Every table and column explained, with its user stories and who can see it. |
| `erd_data.js` | Generated data that `erd.html` draws. Don't edit it. |
| `build_erd.py` | Regenerates `erd_data.js` and `data_dictionary.md` from `schema.sql`. |
| `functions.sql` | Server functions for actions with business rules (load after `schema.sql`). |
| `tests/` | Database tests: `run_tests.sh` runs them on a throwaway Postgres. |

## Server functions (`functions.sql`)
The front end calls these with `supabase.rpc('name', {...})`. Each one checks who is calling, runs in one transaction (all or nothing), and writes `domain_events` for the event bus.

| Function | Who calls it | What it does | Stories |
|---|---|---|---|
| `client_mark_proposal_viewed(proposal)` | client | First open: sent → viewed (planner sees "opened") | PL-3.2 |
| `client_request_proposal_changes(proposal, comment)` | client | Status → changes_requested with the comment | CL-2.2, PL-3.2 |
| `client_accept_proposal(proposal, ticked_upgrade_ids)` | client | Counts only ticked upgrades, recalculates totals, supersedes older versions, generates the contract from the template | CL-2.2, PL-3.3 |
| `client_sign_contract(contract, signature, consent, ip)` | client | Records the e-signature and creates the **event** (awaiting_countersign), host row, **invoice** and **payment schedule**; lead → won. Returns the deposit to pay. | CL-2.3, CL-2.4, PL-3.5 |
| `record_payment(...)` | **payment webhook only** | Saves a charge from Stripe/Square; ignores duplicate webhooks; updates balance and installments; **unlocks the portal** when the deposit is paid; counts failures | CL-2.4, SYS-3, NFR-6 |
| `planner_record_manual_payment(invoice, installment, amount, method)` | planner with see_budgets | Cash, check, Venmo, Zelle, Cash App | PL-3.5 |
| `planner_countersign(contract, signature)` | owner or coordinator, after the deposit is paid | Event → booked, hold → converted, checklist tasks created with due dates relative to the event | PL-3.4, PL-4.3 |
| `client_decide_change_order(change_order, 'approved' \| 'declined')` | host with full access | Approving adds the amount to the invoice and the next unpaid payment | CL-4.3 |

Errors are plain language (e.g. "Please agree to sign electronically first."), so the app can show them as-is.

## Running the tests
```bash
bash app_outline/erd/tests/run_tests.sh
```
Needs PostgreSQL 15+ installed. For each `tests/test_*.sql` file it creates a fresh database (Supabase stand-in → `schema.sql` → `functions.sql` → helpers), runs it, and prints PASS/FAIL. The temporary server is deleted afterward.
- `test_rls.sql` covers who can see which rows: tenants, staff permissions, client unlock, guests, double charges.
- `test_functions.sql` walks the whole Rivera booking: view, request changes, accept, sign, failed and duplicate payments, deposit, countersign, change order, manual check, and the event-bus log. It also checks every case that must be refused, such as another client accepting, staff countersigning, or the browser recording a payment.

## Changing the data model
1. Edit `schema.sql`. Keep its house style: an `-- @table name | area | stories: … | rls: …` header and one column per line with a `-- comment`.
2. Put any new table in `AREAS` in `build_erd.py` (the script tells you if you forget).
3. Run `python3 app_outline/erd/build_erd.py`.
4. Open `erd.html` to check the diagram, then re-take the PNGs if you need them.

## How it was checked
`schema.sql` was run on a fresh PostgreSQL 18 database, with a small stand-in for Supabase (the `auth.users` table, `auth.uid()`, and the anon/authenticated roles). All 37 tables were created, RLS is on for every table, and 149 policies were created. Smoke tests then confirmed:
- one business can't see another business's rows
- staff without `see_budgets` can't see invoices
- a client sees only their own event, and their guest list unlocks only after the deposit
- clients can't write payments
- a guest's invite token reaches only that household
- the same `idempotency_key` can't be charged twice
- `updated_at` updates itself

The QA audit (`QA_REPORT.md`, probes in `qa/`) then found rules that the first policies didn't enforce, and they were fixed:
- **Separate read / add / edit / delete policies** instead of one "can do anything" policy. Records we keep (clients, leads, events, files, contracts, proposals, approval responses, messages) can't be hard-deleted.
- **Prices need `see_budgets`** (packages, add-ons, proposals and their items, contracts), and limited co-hosts see no money (`is_full_host`).
- **Guard triggers (section 10b)** stop app users from changing what only the server functions may change: countersigning, unlocking the portal, marking things paid, accepting proposals, deciding change orders, and removing the last owner. They tell the server apart by `current_user` (server functions run as the database owner, the webhook as `service_role`).
- **Same-business trigger**: a row can only point at parent rows in its own business.
- Clients can read their planner's branding (not `payment_account_id`, which is hidden by column privileges) and the package on their proposal.
- RSVPs close when the headcount is locked or the event is cancelled or deleted. The cutoff uses the event's time zone, and errors are plain language.

Re-run them with `bash qa/run_qa_db_probes.sh` (61 checks, including controls that normal work still succeeds).

The generated column and foreign-key counts (408 / 107) match the live database.

## Open questions for later
- Phase 2–4 tables are sketches only; design them properly before each phase.
- The Stripe/Square **webhook Edge Function** (which verifies the signature and then calls `record_payment`) and the checkout Edge Function aren't written yet.
- `client_sign_contract` sets the event start to noon on the requested date (leads only store a date); the planner sets the real time.
- Gear reservations at countersign (PL-3.4) wait for the Phase 2 equipment tables.
- Voiding a contract or invoice is a direct owner update today; a `planner_void_*` function with refunds would be better.
- Proposal totals are recalculated only when the client accepts; planner screens that edit drafts should call a recalc function.
