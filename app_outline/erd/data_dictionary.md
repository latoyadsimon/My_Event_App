# Data dictionary: Event Planner (Phase 1)

> Generated from `schema.sql` by `build_erd.py`. **Edit `schema.sql`**, then run `python3 app_outline/erd/build_erd.py`; edits made here get overwritten.

**37 tables in `public` + Supabase's `auth.users` · 412 columns.** Diagram: [`erd.html`](erd.html) · SQL: [`schema.sql`](schema.sql) · Stories: [`../user_stories.md`](../user_stories.md)

## Rules that apply to every table

- **Multi-tenant:** every business table has `business_id → businesses`. Row-level security (RLS) is on for every table (NFR-2, NFR-3).
- **Members:** people in `memberships` with status `active` can work with their business's rows (`is_member()`). Money tables (`invoices`, `installments`, `payments`, `change_orders`) also need the `see_budgets` permission; owners always have it.
- **Clients (hosts):** see only their own lead, sent proposals and event. Planning pages unlock when the deposit is paid (`events.portal_unlocked_at`, `host_can_plan()`). Messages stay open before that.
- **Guests:** never sign in and can't read tables. They use `guest_household(token)` and `guest_submit_rsvp(token, replies)` with `households.invite_token`.
- **Server only:** `payments` are written by the payment webhook; `deliveries`, `opt_outs`, `domain_events` and `activity_log` by server jobs.
- **Conventions:** ids are `uuid`; money is `numeric(10,2)`; times are `timestamptz`, and each event stores its own `time_zone`; `deleted_at` = soft delete (restore within 30 days); statuses are `text` with the allowed values listed below.

## Contents

- **Identity & tenancy:** [businesses](#businesses), [memberships](#memberships), [clients](#clients), [auth.users](#authusers), [profiles](#profiles)
- **Sales:** [date_holds](#date_holds), [appointments](#appointments), [leads](#leads), [packages](#packages), [proposals](#proposals), [contracts](#contracts), [proposal_items](#proposal_items), [add_ons](#add_ons)
- **Events & money:** [event_hosts](#event_hosts), [events](#events), [invoices](#invoices), [change_orders](#change_orders), [installments](#installments), [payments](#payments)
- **Planning:** [templates](#templates), [tasks](#tasks), [questionnaires](#questionnaires), [mood_boards](#mood_boards), [files](#files), [comments](#comments), [approvals](#approvals), [approval_responses](#approval_responses), [message_threads](#message_threads), [messages](#messages)
- **Guests & RSVPs:** [households](#households), [event_websites](#event_websites), [guests](#guests), [meal_options](#meal_options), [invitations](#invitations)
- **System:** [deliveries](#deliveries), [opt_outs](#opt_outs), [domain_events](#domain_events), [activity_log](#activity_log)

## Identity & tenancy

Who the business is, who works there, and who its clients are.

### businesses

One row per planner business (the "tenant"). Almost every other table points here.

- **Stories:** PL-1.1, PL-1.2, PL-1.3, NFR-2, NFR-15
- **Who can see it (RLS):** members read; clients read their planner's branding; owner updates; payment_account_id hidden from app users; created by the sign-up server function

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `name` | text |  | yes | shown to clients and guests |
| `slug` | text | unique | yes | used in public links, e.g. events.yourbiz.com/<slug> |
| `logo_path` | text |  |  | Supabase Storage path of the logo |
| `brand_colors` | text[] |  | yes | hex colors, e.g. {#2b2b2b,#d6e5fc} |
| `custom_domain` | text | unique |  | optional, e.g. events.mybusiness.com |
| `time_zone` | text |  | yes | default for new events |
| `payment_provider` | text |  |  | null = payments not connected · One of: `stripe`, `square` |
| `payment_account_id` | text |  |  | connected Stripe/Square account id (never card numbers) |
| `created_at` | timestamptz |  | yes | when the business signed up |
| `updated_at` | timestamptz |  | yes | last change |

### memberships

Who works for which business, their role and their per-person permissions.

- **Stories:** PL-1.6, ST-1.1, ST-1.2, NFR-3
- **Who can see it (RLS):** members read; owner invites, edits and deactivates; a business always keeps one active owner
- **Unique together:** `(business_id, user_id)`

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the business |
| `user_id` | uuid | FK → auth.users |  | null until the invite is accepted |
| `invite_contact` | text |  |  | email or phone the invite was sent to |
| `role` | text |  | yes | owner = everything · One of: `owner`, `coordinator`, `staff` |
| `job_title` | text |  |  | e.g. Photo booth attendant, KJ, Bartender |
| `permissions` | jsonb |  | yes | e.g. {"see_budgets":true,"see_profit":false,"take_payments":true,"edit_vendors":true} |
| `skills` | text[] |  | yes | photo_booth, kj, bartending, serving, coordinator |
| `shirt_size` | text |  |  | for event-day uniforms |
| `emergency_contact` | jsonb |  |  | {"name": "...", "phone": "..."} |
| `status` | text |  | yes | deactivated = sessions revoked, history kept · One of: `invited`, `active`, `deactivated` |
| `created_at` | timestamptz |  | yes | when invited |
| `deactivated_at` | timestamptz |  |  | when the owner deactivated them |

### clients

People who hire the planner. Kept across events (baby shower, then first birthday).

- **Stories:** CL-1.1, CL-2.1, CL-3.4, PL-2.1, PL-9.2
- **Who can see it (RLS):** members read, add and edit (no hard delete: soft delete); a client can read their own row

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `user_id` | uuid | FK → auth.users |  | set when they first sign in with a magic link |
| `first_name` | text |  | yes | e.g. Ana |
| `last_name` | text |  |  | e.g. Rivera |
| `email` | text |  |  | magic links and receipts go here |
| `phone` | text |  |  | texts and one-time codes |
| `notes` | text |  |  | preferences, allergies, anything to remember |
| `important_dates` | jsonb |  | yes | birthdays/anniversaries for marketing (P4) |
| `marketing_opt_in` | boolean |  | yes | may we send rebooking emails? |
| `created_at` | timestamptz |  | yes | first contact |
| `updated_at` | timestamptz |  | yes | last change |
| `deleted_at` | timestamptz |  |  | soft delete (restore within 30 days); email is unique per business, ignoring case (index in section 9) |

### auth.users

Managed by Supabase Auth: planners, staff and clients who sign in. Guests never do.

- **Stories:** PL-1.1, ST-1.1, CL-2.1, NFR-1
- **Who can see it (RLS):** managed by Supabase; passwords stored hashed

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | the user id every other table points to |
| `email` | varchar | unique |  | magic links go here |
| `phone` | text | unique |  | staff sign in with an SMS code |
| `created_at` | timestamptz |  | yes | sign-up time |

### profiles

Public info about a signed-in person. Same id as their auth.users row (one-to-one).

- **Stories:** PL-1.1, ST-1.2
- **Who can see it (RLS):** you edit your own; members of the same business can read

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK FK → auth.users | yes | same id as the login |
| `display_name` | text |  | yes | name shown in the app |
| `phone` | text |  |  | for SMS codes and alerts |
| `avatar_path` | text |  |  | Supabase Storage path of the photo |
| `created_at` | timestamptz |  | yes | when the profile was made |
| `updated_at` | timestamptz |  | yes | last change |

## Sales

Lead → proposal → contract. Clients see only their own leads and sent proposals.

### date_holds

A soft hold on a date for a prospect. Expires automatically.

- **Stories:** PL-2.3, PL-4.8
- **Who can see it (RLS):** members of the business

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `lead_id` | uuid | FK → leads | yes | the prospect holding the date |
| `hold_date` | date |  | yes | the date being held |
| `expires_at` | timestamptz |  | yes | auto-expire time |
| `status` | text |  | yes | converted = became a booking · One of: `active`, `expired`, `released`, `converted` |
| `created_at` | timestamptz |  | yes | when placed |

### appointments

Calendar items that aren't events: consults, site visits, tastings, calls, deliveries.

- **Stories:** PL-2.4, CL-1.2, PL-1.8, PL-4.8
- **Who can see it (RLS):** members manage
- **Rules:** `(ends_at > starts_at)`

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `lead_id` | uuid | FK → leads |  | for consults before booking |
| `event_id` | uuid | FK → events |  | for tastings and site visits after booking |
| `kind` | text |  | yes | what it is · One of: `consult`, `site_visit`, `tasting`, `call`, `delivery`, `pickup` |
| `starts_at` | timestamptz |  | yes | start |
| `ends_at` | timestamptz |  | yes | end |
| `location` | text |  |  | address or "Phone" |
| `status` | text |  | yes | outcome · One of: `scheduled`, `done`, `cancelled`, `no_show` |
| `booked_by_client` | boolean |  | yes | booked from the public booking page |
| `external_calendar_id` | text |  |  | id in Google/Apple/Outlook after sync |
| `created_at` | timestamptz |  | yes | when booked |

### leads

An inquiry from a prospect. Moves across the Leads board.

- **Stories:** PL-2.1, PL-2.2, PL-2.3, PL-2.5, CL-1.1
- **Who can see it (RLS):** members read, add and edit (no hard delete: soft delete); the client can read their own

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `client_id` | uuid | FK → clients | yes | who inquired |
| `event_type` | text |  | yes | kind of event · One of: `wedding`, `birthday`, `baby_shower`, `bridal_shower`, `corporate`, `school`, `church`, `fundraiser`, `reunion`, `holiday`, `memorial`, `potluck`, `other` |
| `requested_date` | date |  |  | date they asked for |
| `guest_count` | int |  |  | expected guests |
| `budget_range` | text |  |  | e.g. $15–20k |
| `services` | text[] |  | yes | planning, photo_booth, karaoke, rentals, potluck, donations |
| `source` | text |  |  | where they found us · One of: `website`, `instagram`, `facebook`, `google`, `the_knot`, `referral`, `other` |
| `message` | text |  |  | "Anything else?" from the form |
| `stage` | text |  | yes | Leads board column · One of: `new`, `contacted`, `consult_booked`, `proposal_sent`, `won`, `lost` |
| `lost_reason` | text |  |  | why it was lost |
| `created_at` | timestamptz |  | yes | when the inquiry arrived |
| `updated_at` | timestamptz |  | yes | last change |
| `deleted_at` | timestamptz |  |  | soft delete |

### packages

Service packages a proposal starts from (Silver, Gold, Platinum).

- **Stories:** PL-1.4, PL-3.1
- **Who can see it (RLS):** members with see_budgets manage; a client reads the package on a proposal they can see

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `name` | text |  | yes | e.g. Gold |
| `description` | text |  |  | what's included |
| `base_price` | numeric(10,2) |  | yes | e.g. 11000.00 |
| `photo_paths` | text[] |  | yes | Storage paths shown on the proposal |
| `is_active` | boolean |  | yes | can be added to new proposals |
| `sort_order` | int |  | yes | display order |
| `created_at` | timestamptz |  | yes | when created |

### proposals

One version of a quote. Every send is a new version; the client always sees the latest.

- **Stories:** PL-3.1, PL-3.2, CL-2.1, CL-2.2
- **Who can see it (RLS):** members with see_budgets manage (no hard delete); only the client accepts; the client reads non-draft versions of their own lead
- **Unique together:** `(lead_id, version)`

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `lead_id` | uuid | FK → leads | yes | the lead it's for |
| `version` | int |  | yes | v1, v2… |
| `status` | text |  | yes | where it stands · One of: `draft`, `sent`, `viewed`, `changes_requested`, `accepted`, `superseded`, `declined` |
| `package_id` | uuid | FK → packages |  | chosen package |
| `discount` | numeric(10,2) |  | yes | flat discount |
| `tax_rate` | numeric(5,4) |  | yes | e.g. 0.0800 = 8% |
| `subtotal` | numeric(10,2) |  | yes | package + selected items − discount |
| `tax` | numeric(10,2) |  | yes | subtotal × tax_rate |
| `total` | numeric(10,2) |  | yes | what the client pays |
| `deposit_percent` | numeric(5,2) |  | yes | e.g. 30 = 30% |
| `change_request` | text |  |  | the client's "Request changes" comment |
| `created_by` | uuid | FK → auth.users |  | planner who built it |
| `sent_at` | timestamptz |  |  | emailed to the client |
| `viewed_at` | timestamptz |  |  | first opened by the client |
| `accepted_at` | timestamptz |  |  | client clicked Accept |
| `created_at` | timestamptz |  | yes | when drafted |

### contracts

The signed agreement, generated from the accepted proposal.

- **Stories:** PL-3.3, PL-3.4, CL-2.3
- **Who can see it (RLS):** members with see_budgets read; created and signed only through the server functions (owner may void); the client reads their own (before and after signing); limited co-hosts can't

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `proposal_id` | uuid | FK → proposals unique | yes | the accepted proposal version (one contract each) |
| `event_id` | uuid | FK → events |  | set when the client signs |
| `template_id` | uuid | FK → templates |  | contract template used |
| `body` | text |  | yes | contract text with merge fields filled in |
| `pdf_path` | text |  |  | Storage path of the signed PDF |
| `status` | text |  | yes | signing progress · One of: `sent`, `client_signed`, `countersigned`, `void` |
| `client_signer_id` | uuid | FK → clients |  | who signed for the client |
| `client_signature` | text |  |  | typed name or drawn-signature image path |
| `client_signed_at` | timestamptz |  |  | timestamp for the e-sign record |
| `client_signed_ip` | inet |  |  | IP address for the e-sign record |
| `planner_signer_id` | uuid | FK → auth.users |  | who countersigned |
| `planner_signed_at` | timestamptz |  |  | countersign time |
| `created_at` | timestamptz |  | yes | when generated |

### proposal_items

Lines on a proposal: add-ons with quantity, and optional upgrades the client can tick.

- **Stories:** PL-3.1, CL-2.2
- **Who can see it (RLS):** members with see_budgets manage; the client reads items of proposals they can see

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `proposal_id` | uuid | FK → proposals | yes | the proposal |
| `add_on_id` | uuid | FK → add_ons |  | null for a custom line |
| `description` | text |  | yes | e.g. Photo booth (4 hrs) |
| `quantity` | numeric(10,2) |  | yes | e.g. 140 chairs |
| `unit_price` | numeric(10,2) |  | yes | price at the time of the quote |
| `is_optional` | boolean |  | yes | an upgrade the client can tick |
| `is_selected` | boolean |  | yes | included in the total? |
| `override_note` | text |  |  | why it was quoted above owned stock |
| `sort_order` | int |  | yes | display order |

### add_ons

Extras priced per item or per hour (photo booth hours, chairs, karaoke).

- **Stories:** PL-1.4, PL-3.1
- **Who can see it (RLS):** members with see_budgets manage

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `name` | text |  | yes | e.g. Chairs |
| `unit` | text |  | yes | how it's priced · One of: `each`, `hour` |
| `unit_price` | numeric(10,2) |  | yes | e.g. 2.50 per chair |
| `is_active` | boolean |  | yes | can be added to new proposals |
| `created_at` | timestamptz |  | yes | when created |

## Events & money

The Event Hub plus the invoice, payment schedule and payments. Money needs see_budgets.

### event_hosts

Clients on an event: the primary client and any co-hosts (partner, parent).

- **Stories:** CL-3.4, CL-3.6
- **Who can see it (RLS):** members manage; hosts read their own event's hosts
- **Unique together:** `(event_id, client_id)`

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `client_id` | uuid | FK → clients | yes | the host |
| `role` | text |  | yes | primary = signed the contract · One of: `primary`, `co_host` |
| `access` | text |  | yes | limited = no money · One of: `full`, `limited` |

### events

The Event Hub. Created when the client signs (awaiting_countersign); Booked on countersign.

- **Stories:** PL-3.4, PL-3.6, PL-3.7, PL-4.1, PL-4.2, PL-5.4, CL-2.4, NFR-5
- **Who can see it (RLS):** members read, add and edit (no hard delete); portal unlock and Booked come from the server functions; owner/coordinator cancel or delete; hosts read their own

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `client_id` | uuid | FK → clients | yes | primary client |
| `lead_id` | uuid | FK → leads |  | the lead it came from (null for manual events) |
| `parent_event_id` | uuid | FK → events |  | sub-events: rehearsal dinner, ceremony, brunch |
| `name` | text |  | yes | e.g. Rivera wedding |
| `event_type` | text |  | yes | same values as leads.event_type · One of: `wedding`, `birthday`, `baby_shower`, `bridal_shower`, `corporate`, `school`, `church`, `fundraiser`, `reunion`, `holiday`, `memorial`, `potluck`, `other` |
| `status` | text |  | yes | Event Hub status path · One of: `awaiting_countersign`, `booked`, `in_planning`, `final_week`, `event_day`, `wrap_up`, `closed`, `cancelled` |
| `starts_at` | timestamptz |  | yes | e.g. 2027-06-12 16:00 in the event's time zone |
| `ends_at` | timestamptz |  |  | end time |
| `time_zone` | text |  | yes | the event's own time zone, e.g. America/Chicago |
| `venue_name` | text |  |  | e.g. Hacienda Venue |
| `venue_address` | text |  |  | for maps and directions |
| `venue_notes` | jsonb |  | yes | {"parking": "...", "load_in": "side door", "wifi": "..."} |
| `guest_count_estimate` | int |  |  | before RSVPs come in |
| `theme` | text |  |  | e.g. Garden |
| `colors` | text[] |  | yes | theme colors |
| `portal_unlocked_at` | timestamptz |  |  | set when the deposit is paid; unlocks the client's planning pages |
| `headcount_locked_at` | timestamptz |  |  | final headcount locked |
| `headcount_locked_count` | int |  |  | e.g. 112 |
| `cancelled_at` | timestamptz |  |  | when cancelled |
| `created_at` | timestamptz |  | yes | when the client signed |
| `updated_at` | timestamptz |  | yes | last change |
| `deleted_at` | timestamptz |  |  | soft delete (restore within 30 days) |

### invoices

One invoice per event, created when the client signs (so the deposit can be paid right away).

- **Stories:** PL-3.5, PL-4.7, CL-2.4, CL-4.2
- **Who can see it (RLS):** owner + members with see_budgets; totals and paid amounts update only from payments and change orders; owner may void; full-access hosts read their own
- **Unique together:** `(business_id, number)`

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `contract_id` | uuid | FK → contracts |  | the contract it came from |
| `number` | text |  | yes | e.g. 1042 |
| `status` | text |  | yes | payment state · One of: `open`, `partially_paid`, `paid`, `void` |
| `total` | numeric(10,2) |  | yes | contract total + approved change orders |
| `amount_paid` | numeric(10,2) |  | yes | kept in sync from payments by the server; people can't edit it (guard trigger) |
| `autopay` | boolean |  | yes | charge saved card on due dates |
| `pass_card_fee` | boolean |  | yes | client pays the card fee |
| `late_fee_allowed` | boolean |  | yes | only if the contract allows it |
| `created_at` | timestamptz |  | yes | when created |

### change_orders

Mid-planning upgrades (e.g. +1 hour karaoke) the client approves.

- **Stories:** CL-4.3, PL-4.6
- **Who can see it (RLS):** members with see_budgets send (pending) or withdraw; only the client decides; full-access hosts read their own

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `invoice_id` | uuid | FK → invoices | yes | invoice to update when approved |
| `description` | text |  | yes | e.g. +1 hour karaoke |
| `amount` | numeric(10,2) |  | yes | e.g. 250.00 (negative for a credit) |
| `status` | text |  | yes | client decision · One of: `pending`, `approved`, `declined` |
| `requested_by` | uuid | FK → auth.users |  | planner who sent it |
| `decided_by` | uuid | FK → clients |  | client who decided |
| `decided_at` | timestamptz |  |  | when decided |
| `created_at` | timestamptz |  | yes | when sent |

### installments

The payment schedule: deposit, payment 2, final payment.

- **Stories:** PL-3.5, CL-2.4, CL-4.1, CL-4.2
- **Who can see it (RLS):** owner + members with see_budgets; paid only via payments, amounts only via change orders; full-access hosts read their own

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `invoice_id` | uuid | FK → invoices | yes | the invoice |
| `label` | text |  | yes | e.g. Deposit 30% |
| `amount` | numeric(10,2) |  | yes | e.g. 4455.00 |
| `due_rule` | text |  |  | how the date was set, e.g. at_signing, 60_days_before (shifts on reschedule) |
| `due_date` | date |  | yes | e.g. 2027-04-13 |
| `status` | text |  | yes | payment state · One of: `due`, `paid`, `overdue`, `waived` |
| `reminders_paused` | boolean |  | yes | planner paused reminders |
| `sort_order` | int |  | yes | 1 = deposit |

### payments

Money in (charges, manual cash/check) and out (refunds). Status comes only from processor webhooks.

- **Stories:** PL-3.5, CL-2.4, CL-4.2, SYS-3, NFR-6
- **Who can see it (RLS):** owner + members with see_budgets read; full-access hosts read their own; ONLY the webhook/server writes

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `invoice_id` | uuid | FK → invoices | yes | what it pays |
| `installment_id` | uuid | FK → installments |  | which scheduled payment, if any |
| `kind` | text |  | yes | manual = cash/check/Venmo recorded by the planner · One of: `charge`, `manual`, `refund` |
| `method` | text |  | yes | how it was paid · One of: `card`, `apple_pay`, `google_pay`, `ach`, `cash`, `check`, `venmo`, `zelle`, `cash_app`, `tap_to_pay` |
| `amount` | numeric(10,2) |  | yes | always positive; kind says the direction |
| `status` | text |  | yes | from the processor · One of: `pending`, `succeeded`, `failed` |
| `processor` | text |  |  | null for manual · One of: `stripe`, `square` |
| `processor_payment_id` | text | unique |  | Stripe/Square id; unique so a webhook can't double-record |
| `idempotency_key` | text | unique |  | one per checkout attempt; stops double-tap charges |
| `refund_of` | uuid | FK → payments |  | for refunds: the original charge |
| `failure_reason` | text |  |  | plain-language reason shown to the client |
| `recorded_by` | uuid | FK → auth.users |  | planner who recorded a manual payment |
| `paid_at` | timestamptz |  |  | when it succeeded |
| `created_at` | timestamptz |  | yes | when attempted |

## Planning

Tasks, questionnaires, files and mood boards, approvals and messages.

### templates

Reusable starting points: checklists, contract text, payment schedules, messages, questionnaires, invitations.

- **Stories:** PL-1.7, PL-3.3, PL-4.3, PL-4.4, PL-5.3
- **Who can see it (RLS):** members of the business

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | owner of the template |
| `kind` | text |  | yes | what it is for · One of: `checklist`, `contract`, `payment_schedule`, `message`, `questionnaire`, `invitation` |
| `event_type` | text |  |  | null = any event type |
| `name` | text |  | yes | e.g. Wedding checklist |
| `body` | jsonb |  | yes | the content; shape depends on kind (tasks with day offsets, contract text with merge fields…) |
| `is_active` | boolean |  | yes | hidden from pickers when false |
| `created_at` | timestamptz |  | yes | when created |

### tasks

Checklist items for an event; due dates can be relative to the event date.

- **Stories:** PL-4.3, PL-4.4, CL-3.1
- **Who can see it (RLS):** members manage; a client reads tasks assigned to them

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `parent_task_id` | uuid | FK → tasks |  | subtasks |
| `template_id` | uuid | FK → templates |  | checklist it came from |
| `title` | text |  | yes | e.g. Order cake |
| `notes` | text |  |  | details |
| `assignee_kind` | text |  | yes | who it's for · One of: `planner`, `staff`, `client`, `vendor` |
| `assignee_user_id` | uuid | FK → auth.users |  | planner/staff assignee |
| `assignee_client_id` | uuid | FK → clients |  | client assignee (shows in "Needs your action") |
| `due_offset_days` | int |  |  | e.g. -30 = 30 days before the event; recalculated on reschedule |
| `due_date` | date |  |  | the actual due date |
| `status` | text |  | yes | progress · One of: `open`, `done` |
| `sort_order` | int |  | yes | drag-to-reorder position |
| `completed_at` | timestamptz |  |  | when done |
| `created_at` | timestamptz |  | yes | when created |

### questionnaires

A questionnaire sent to a client; answers fill in event details.

- **Stories:** PL-4.4, CL-3.2
- **Who can see it (RLS):** members manage; hosts read and fill in answers after the deposit (they can't create, rename or delete)

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `template_id` | uuid | FK → templates |  | questions come from here |
| `title` | text |  | yes | e.g. Wedding details |
| `status` | text |  | yes | progress · One of: `sent`, `in_progress`, `submitted` |
| `answers` | jsonb |  | yes | saved after every field |
| `sent_at` | timestamptz |  | yes | when sent |
| `submitted_at` | timestamptz |  |  | when the client submitted |

### mood_boards

A mood board for an event; its items are rows in files.

- **Stories:** PL-4.5, CL-3.3
- **Who can see it (RLS):** members manage; hosts read after the deposit

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `name` | text |  | yes | e.g. Garden |
| `palette` | text[] |  | yes | e.g. {sage,blush,ivory} |
| `created_at` | timestamptz |  | yes | when created |

### files

Uploaded files (stored in Supabase Storage) and mood board items.

- **Stories:** PL-4.5, CL-3.3, PL-4.6
- **Who can see it (RLS):** members manage (no hard delete: soft delete); hosts read shared files and upload after the deposit

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events |  | null for business-wide files |
| `mood_board_id` | uuid | FK → mood_boards |  | set if it's a mood board item |
| `storage_path` | text |  |  | Supabase Storage path (null for a Pinterest-only item) |
| `pinterest_url` | text |  |  | for pasted Pinterest links |
| `name` | text |  | yes | e.g. Signed contract.pdf |
| `mime_type` | text |  |  | e.g. application/pdf |
| `size_bytes` | bigint |  |  | file size |
| `visibility` | text |  | yes | shared = client can see it · One of: `shared`, `private` |
| `uploaded_by` | uuid | FK → auth.users |  | planner or client who uploaded it |
| `created_at` | timestamptz |  | yes | when uploaded |
| `deleted_at` | timestamptz |  |  | soft delete |

### comments

Comments on files and mood board items ("Love the peonies!").

- **Stories:** PL-4.5, CL-3.3
- **Who can see it (RLS):** members manage; hosts read comments on shared files and edit or delete only their own

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `file_id` | uuid | FK → files | yes | what it's about |
| `author_id` | uuid | FK → auth.users | yes | who wrote it |
| `body` | text |  | yes | the comment |
| `created_at` | timestamptz |  | yes | when written |

### approvals

Something the planner asks the client to approve (menu, invitation wording, final headcount…).

- **Stories:** CL-3.5, CL-3.6, PL-4.5, PL-5.3, PL-5.4
- **Who can see it (RLS):** members manage; hosts read after the deposit

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `subject` | text |  | yes | what kind · One of: `menu`, `timeline`, `invitation`, `mood_board`, `final_headcount`, `floor_plan`, `other` |
| `title` | text |  | yes | e.g. Menu v2 |
| `file_id` | uuid | FK → files |  | the thing being approved, if it's a file |
| `status` | text |  | yes | conflict = co-hosts disagree · One of: `pending`, `approved`, `changes_requested`, `conflict` |
| `opens_at` | timestamptz |  |  | e.g. final headcount opens Jun 5 |
| `requested_by` | uuid | FK → auth.users |  | planner who asked |
| `requested_at` | timestamptz |  | yes | when asked |
| `resolved_at` | timestamptz |  |  | when settled |

### approval_responses

Each host's answer to an approval. The log of who approved what and when.

- **Stories:** CL-3.6
- **Who can see it (RLS):** members read and add (never deleted: it's the log); hosts add their own response
- **Unique together:** `(approval_id, client_id)`

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `approval_id` | uuid | FK → approvals | yes | the approval |
| `client_id` | uuid | FK → clients | yes | the host who answered |
| `decision` | text |  | yes | their answer · One of: `approved`, `changes_requested` |
| `comment` | text |  |  | e.g. "more veg options" |
| `responded_at` | timestamptz |  | yes | when |

### message_threads

One conversation: the client thread for an event, or one per vendor (Phase 2).

- **Stories:** PL-4.6, CL-4.5
- **Who can see it (RLS):** members manage; hosts read their event's client thread (even before the deposit)

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events |  | null for pre-booking lead threads |
| `lead_id` | uuid | FK → leads |  | questions asked from a proposal before booking |
| `kind` | text |  | yes | clients never see vendor threads · One of: `client`, `vendor`, `internal` |
| `title` | text |  |  | e.g. Ana & Marco |
| `created_at` | timestamptz |  | yes | when started |

### messages

A single message in a thread.

- **Stories:** PL-4.6, CL-4.3, CL-4.5
- **Who can see it (RLS):** anyone in the thread; never hard-deleted

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `thread_id` | uuid | FK → message_threads | yes | the conversation |
| `sender_id` | uuid | FK → auth.users | yes | planner, staff or client |
| `body` | text |  | yes | the message |
| `file_id` | uuid | FK → files |  | attachment |
| `change_order_id` | uuid | FK → change_orders |  | a change order sent in the thread |
| `created_at` | timestamptz |  | yes | when sent |
| `read_at` | timestamptz |  |  | when the other side read it |

## Guests & RSVPs

Event website, households, guests and invitations. Guests reach this only through their invite token.

### households

One invitation per household. Its invite_token is the guest's "login".

- **Stories:** PL-5.1, GU-1.1, GU-2.1, CL-3.4
- **Who can see it (RLS):** members manage; hosts manage after the deposit; guests via their invite_token only

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `name` | text |  | yes | e.g. Rivera family |
| `plus_ones_allowed` | int |  | yes | e.g. 1 |
| `invite_token` | text | unique | yes | secret in the invite link |
| `tags` | text[] |  | yes | family, work, bride's side… |
| `created_at` | timestamptz |  | yes | when added |

### event_websites

Settings for the guest-facing event website and RSVP form.

- **Stories:** PL-5.2, GU-1.3, GU-2.2, GU-2.3
- **Who can see it (RLS):** members manage; hosts read; guests read via guest_household()

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events unique | yes | one website per event |
| `slug` | text | unique | yes | e.g. rivera → events.yourbiz.com/rivera |
| `privacy` | text |  | yes | who can open it · One of: `private`, `password`, `public` |
| `password_hash` | text |  |  | only for password mode |
| `rsvp_cutoff` | date |  |  | e.g. 2027-05-01 |
| `allow_late_rsvps` | boolean |  | yes | accept RSVPs after the cutoff |
| `default_plus_ones` | int |  | yes | per household unless overridden |
| `sections` | jsonb |  | yes | {"schedule": [...], "dress_code": "...", "hotel": {...}, "faq": [...]} |
| `registry_url` | text |  |  | external registry or fund link (in-app funds are Phase 4) |
| `custom_questions` | jsonb |  | yes | extra RSVP questions |
| `created_at` | timestamptz |  | yes | when created |
| `updated_at` | timestamptz |  | yes | last change |

### guests

A person invited to an event, with their RSVP.

- **Stories:** PL-5.1, PL-5.4, GU-2.1, GU-2.2, CL-3.4, NFR-14
- **Who can see it (RLS):** members manage; hosts manage after the deposit; guests via guest_* functions

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `household_id` | uuid | FK → households | yes | their household |
| `first_name` | text |  | yes | e.g. Lucia |
| `last_name` | text |  |  | e.g. Rivera |
| `email` | text |  |  | for email invites |
| `phone` | text |  |  | for text invites |
| `is_child` | boolean |  | yes | children: no data capture (NFR-14) |
| `is_plus_one` | boolean |  | yes | added by the guest as their plus-one |
| `tags` | text[] |  | yes | VIP, kids… |
| `notes` | text |  |  | planner notes |
| `gift_note` | text |  |  | for the thank-you tracker |
| `rsvp_status` | text |  | yes | their answer · One of: `no_reply`, `attending`, `declined`, `maybe` |
| `meal_option_id` | uuid | FK → meal_options |  | meal choice |
| `dietary_notes` | text |  |  | allergies; never dropped on import/export |
| `song_request` | text |  |  | e.g. September – Earth, Wind & Fire |
| `answers` | jsonb |  | yes | answers to custom questions |
| `responded_at` | timestamptz |  |  | last RSVP change |
| `via_forwarded_link` | boolean |  | yes | answered from a forwarded link (host sees a flag) |
| `created_at` | timestamptz |  | yes | when added |
| `updated_at` | timestamptz |  | yes | last change |

### meal_options

Meal choices offered on the RSVP form.

- **Stories:** PL-5.2, GU-2.1
- **Who can see it (RLS):** members manage; hosts read; guests read via guest_household()
- **Unique together:** `(event_id, name)`

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `name` | text |  | yes | e.g. Chicken |
| `sort_order` | int |  | yes | display order |

### invitations

A send: save-the-date, invitation, reminder, change notice or thank-you.

- **Stories:** PL-5.3, CL-3.5, GU-1.1, GU-4.1
- **Who can see it (RLS):** members manage; hosts read (to approve wording)

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events | yes | the event |
| `kind` | text |  | yes | what it is · One of: `save_the_date`, `invitation`, `reminder`, `change_notice`, `thank_you` |
| `template_id` | uuid | FK → templates |  | design used (P1: basic branded template) |
| `wording` | text |  | yes | the message |
| `channels` | text[] |  | yes | email, sms, link |
| `audience` | text |  | yes | who gets it · One of: `not_yet_invited`, `all`, `selected` |
| `approval_id` | uuid | FK → approvals |  | the client's approval of the wording |
| `status` | text |  | yes | progress · One of: `draft`, `scheduled`, `sent`, `cancelled` |
| `scheduled_at` | timestamptz |  |  | e.g. Mar 1, 9:00 AM |
| `sent_at` | timestamptz |  |  | when it went out |
| `created_at` | timestamptz |  | yes | when drafted |

## System

Notifications, the event-bus outbox and the activity history. Written by the server.

### deliveries

Every email, text and push we send, and what happened to it (delivered, opened, bounced, STOP).

- **Stories:** SYS-2, PL-4.6, PL-5.3
- **Who can see it (RLS):** members read; written only by the notification service

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `event_id` | uuid | FK → events |  | related event, if any |
| `invitation_id` | uuid | FK → invitations |  | set for invitation sends |
| `guest_id` | uuid | FK → guests |  | recipient if a guest |
| `client_id` | uuid | FK → clients |  | recipient if a client |
| `user_id` | uuid | FK → auth.users |  | recipient if planner/staff |
| `channel` | text |  | yes | how · One of: `email`, `sms`, `push` |
| `to_address` | text |  | yes | email address, phone number or device |
| `template_key` | text |  | yes | e.g. proposal_sent, payment_reminder, invitation |
| `status` | text |  | yes | latest provider status · One of: `queued`, `sent`, `delivered`, `opened`, `bounced`, `opted_out`, `failed` |
| `provider_message_id` | text | unique |  | SendGrid/Twilio id, for webhooks |
| `error` | text |  |  | failure detail |
| `sent_at` | timestamptz |  |  | handed to the provider |
| `opened_at` | timestamptz |  |  | first open (email) |
| `created_at` | timestamptz |  | yes | queued at |

### opt_outs

Addresses that bounced or replied STOP. We never send to them on that channel.

- **Stories:** SYS-2, PL-5.3
- **Who can see it (RLS):** members read; written by the notification service
- **Unique together:** `(business_id, channel, address)`

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `channel` | text |  | yes | which channel · One of: `email`, `sms` |
| `address` | text |  | yes | email or phone |
| `source` | text |  | yes | why · One of: `stop_reply`, `unsubscribe_link`, `bounce` |
| `opted_out_at` | timestamptz |  | yes | when |

### domain_events

The event bus "outbox": lead.created, contract.client_signed, rsvp.updated… Workers process each row once.

- **Stories:** SYS-1
- **Who can see it (RLS):** none for users; written and read by the server only

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | bigint | PK | yes | increasing number = processing order |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `type` | text |  | yes | e.g. rsvp.updated |
| `payload` | jsonb |  | yes | ids the handlers need |
| `created_at` | timestamptz |  | yes | when it happened |
| `processed_at` | timestamptz |  |  | when handlers finished |
| `attempts` | int |  | yes | retries so far |
| `last_error` | text |  |  | last failure, for the dead-letter log |

### activity_log

Human-readable history shown on Lead Detail and events (who did what, when).

- **Stories:** PL-2.3, PL-3.6, CL-3.6, NFR-13
- **Who can see it (RLS):** members read; written by the server

| Column | Type | Key | Required | Meaning |
|---|---|---|---|---|
| `id` | uuid | PK | yes | unique id for this row (auto-generated) |
| `business_id` | uuid | FK → businesses | yes | the planner's business |
| `actor_id` | uuid | FK → auth.users |  | who did it (null = the system) |
| `entity_type` | text |  | yes | e.g. lead, event, proposal |
| `entity_id` | uuid |  | yes | id of that row |
| `action` | text |  | yes | e.g. hold_placed, rescheduled, approved |
| `details` | jsonb |  | yes | e.g. {"from": "2027-06-12", "to": "2027-07-03"} |
| `created_at` | timestamptz |  | yes | when |

## Later phases (sketched in the diagram, not in schema.sql yet)

| Phase | Table | Key columns |
|---|---|---|
| P2 | vendors | id uuid, business_id → businesses, category text, coi_expires_on date |
| P2 | event_vendors | id uuid, event_id → events, vendor_id → vendors, status text, arrival_at timestamptz |
| P2 | timeline_items | id uuid, event_id → events, starts_at timestamptz, owner_id → auth.users, visibility text[] |
| P2 | budget_lines | id uuid, event_id → events, category text, estimated numeric, actual numeric |
| P2 | equipment_items | id uuid, business_id → businesses, name text, quantity_owned int, kit_id → kits |
| P2 | kits | id uuid, business_id → businesses, name text |
| P2 | reservations | id uuid, event_id → events, equipment_item_id → equipment_items, quantity int |
| P2 | equipment_scans | id uuid, event_id → events, equipment_item_id → equipment_items, direction text |
| P2 | shifts | id uuid, event_id → events, role text, starts_at timestamptz |
| P2 | shift_assignments | id uuid, shift_id → shifts, membership_id → memberships, status text |
| P2 | time_entries | id uuid, shift_assignment_id → shift_assignments, clock_in timestamptz, clock_out timestamptz |
| P2 | incidents | id uuid, event_id → events, description text, photo_paths text[] |
| P2 | potluck_slots | id uuid, event_id → events, category text, target int |
| P2 | potluck_signups | id uuid, slot_id → potluck_slots, guest_id → guests, dish text, diet_tags text[] |
| P3 | photos | id uuid, event_id → events, storage_path text, hidden boolean |
| P3 | booth_sessions | id uuid, event_id → events, mode text, shared_to text |
| P3 | prints | id uuid, photo_id → photos, size text, copies int |
| P3 | songs | id uuid, business_id → businesses, title text, artist text, explicit boolean |
| P3 | song_requests | id uuid, event_id → events, song_id → songs, singer_name text, position int |
| P4 | donations | id uuid, event_id → events, amount numeric, deductible numeric, anonymous boolean |
| P4 | auction_items | id uuid, event_id → events, title text, closes_at timestamptz |
| P4 | bids | id uuid, auction_item_id → auction_items, amount numeric |
| P4 | ticket_tiers | id uuid, event_id → events, name text, price numeric, capacity int |
| P4 | tickets | id uuid, ticket_tier_id → ticket_tiers, qr_code text, checked_in_at timestamptz |
| P4 | floor_plans | id uuid, event_id → events, layout jsonb |
| P4 | seat_assignments | id uuid, floor_plan_id → floor_plans, guest_id → guests, table_label text |
