-- =====================================================================
-- Event Planner App · Phase 1 schema (Supabase Postgres) · DRAFT
-- =====================================================================
-- Source of truth for the ERD (erd.html) and the data dictionary.
-- After editing, run:  python3 app_outline/erd/build_erd.py
--
-- How to read this file
--   • Each table starts with a header comment the build script reads:
--       -- @table <name> | <area> | stories: <IDs> | rls: <who can see it>
--       -- <one-line description>
--   • Each column sits on ONE line, and its "-- comment" explains it.
--   • Statuses are text + CHECK (allowed values are listed right there).
--   • Every business table has business_id → businesses (multi-tenant, NFR-2),
--     and row-level security (RLS) is turned on for every table (bottom of file).
--   • Money is numeric(10,2) (never float). Times are timestamptz.
--
-- Who signs in
--   • Planners and staff: Supabase Auth users, linked to a business by memberships.
--   • Clients: Supabase magic link → auth.users, linked by clients.user_id.
--   • Guests: never sign in. They use households.invite_token through the
--     guest_* functions at the bottom. Guests have NO direct table access.
-- =====================================================================


-- =====================================================================
-- 1. IDENTITY & TENANCY
-- =====================================================================

-- @table businesses | identity | stories: PL-1.1, PL-1.2, PL-1.3, NFR-2, NFR-15 | rls: members read; clients read their planner's branding; owner updates; payment_account_id hidden from app users; created by the sign-up server function
-- One row per planner business (the "tenant"). Almost every other table points here.
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),  -- shown to clients and guests
  slug text not null unique,  -- used in public links, e.g. events.yourbiz.com/<slug>
  logo_path text,  -- Supabase Storage path of the logo
  brand_colors text[] not null default '{}',  -- hex colors, e.g. {#2b2b2b,#d6e5fc}
  custom_domain text unique,  -- optional, e.g. events.mybusiness.com
  time_zone text not null default 'America/Chicago',  -- default for new events
  payment_provider text check (payment_provider in ('stripe','square')),  -- null = payments not connected
  payment_account_id text,  -- connected Stripe/Square account id (never card numbers)
  created_at timestamptz not null default now(),  -- when the business signed up
  updated_at timestamptz not null default now()  -- last change
);

-- @table profiles | identity | stories: PL-1.1, ST-1.2 | rls: you edit your own; members of the same business can read
-- Public info about a signed-in person. Same id as their auth.users row (one-to-one).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,  -- same id as the login
  display_name text not null check (char_length(display_name) between 1 and 80),  -- name shown in the app
  phone text,  -- for SMS codes and alerts
  avatar_path text,  -- Supabase Storage path of the photo
  created_at timestamptz not null default now(),  -- when the profile was made
  updated_at timestamptz not null default now()  -- last change
);

-- @table memberships | identity | stories: PL-1.6, ST-1.1, ST-1.2, NFR-3 | rls: members read; owner invites, edits and deactivates; a business always keeps one active owner
-- Who works for which business, their role and their per-person permissions.
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the business
  user_id uuid references auth.users(id) on delete cascade,  -- null until the invite is accepted
  invite_contact text,  -- email or phone the invite was sent to
  role text not null check (role in ('owner','coordinator','staff')),  -- owner = everything
  job_title text,  -- e.g. Photo booth attendant, KJ, Bartender
  permissions jsonb not null default '{}'::jsonb,  -- e.g. {"see_budgets":true,"see_profit":false,"take_payments":true,"edit_vendors":true}
  skills text[] not null default '{}',  -- photo_booth, kj, bartending, serving, coordinator
  shirt_size text,  -- for event-day uniforms
  emergency_contact jsonb,  -- {"name": "...", "phone": "..."}
  status text not null default 'invited' check (status in ('invited','active','deactivated')),  -- deactivated = sessions revoked, history kept
  created_at timestamptz not null default now(),  -- when invited
  deactivated_at timestamptz,  -- when the owner deactivated them
  unique (business_id, user_id)
);

-- @table clients | identity | stories: CL-1.1, CL-2.1, CL-3.4, PL-2.1, PL-9.2 | rls: members read, add and edit (no hard delete: soft delete); a client can read their own row
-- People who hire the planner. Kept across events (baby shower, then first birthday).
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  user_id uuid references auth.users(id) on delete set null,  -- set when they first sign in with a magic link
  first_name text not null,  -- e.g. Ana
  last_name text,  -- e.g. Rivera
  email text,  -- magic links and receipts go here
  phone text,  -- texts and one-time codes
  notes text,  -- preferences, allergies, anything to remember
  important_dates jsonb not null default '[]'::jsonb,  -- birthdays/anniversaries for marketing (P4)
  marketing_opt_in boolean not null default false,  -- may we send rebooking emails?
  created_at timestamptz not null default now(),  -- first contact
  updated_at timestamptz not null default now(),  -- last change
  deleted_at timestamptz  -- soft delete (restore within 30 days); email is unique per business, ignoring case (index in section 9)
);


-- =====================================================================
-- 2. TEMPLATES (used by sales and planning)
-- =====================================================================

-- @table templates | planning | stories: PL-1.7, PL-3.3, PL-4.3, PL-4.4, PL-5.3 | rls: members of the business
-- Reusable starting points: checklists, contract text, payment schedules, messages, questionnaires, invitations.
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- owner of the template
  kind text not null check (kind in ('checklist','contract','payment_schedule','message','questionnaire','invitation')),  -- what it is for
  event_type text,  -- null = any event type
  name text not null,  -- e.g. Wedding checklist
  body jsonb not null,  -- the content; shape depends on kind (tasks with day offsets, contract text with merge fields…)
  is_active boolean not null default true,  -- hidden from pickers when false
  created_at timestamptz not null default now()  -- when created
);


-- =====================================================================
-- 3. SALES: lead → proposal → contract
-- =====================================================================

-- @table leads | sales | stories: PL-2.1, PL-2.2, PL-2.3, PL-2.5, CL-1.1 | rls: members read, add and edit (no hard delete: soft delete); the client can read their own
-- An inquiry from a prospect. Moves across the Leads board.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  client_id uuid not null references public.clients(id),  -- who inquired
  event_type text not null check (event_type in ('wedding','birthday','baby_shower','bridal_shower','corporate','school','church','fundraiser','reunion','holiday','memorial','potluck','other')),  -- kind of event
  requested_date date,  -- date they asked for
  guest_count int check (guest_count > 0),  -- expected guests
  budget_range text,  -- e.g. $15–20k
  services text[] not null default '{}',  -- planning, photo_booth, karaoke, rentals, potluck, donations
  source text check (source in ('website','instagram','facebook','google','the_knot','referral','other')),  -- where they found us
  message text,  -- "Anything else?" from the form
  stage text not null default 'new' check (stage in ('new','contacted','consult_booked','proposal_sent','won','lost')),  -- Leads board column
  lost_reason text,  -- why it was lost
  created_at timestamptz not null default now(),  -- when the inquiry arrived
  updated_at timestamptz not null default now(),  -- last change
  deleted_at timestamptz  -- soft delete
);

-- @table date_holds | sales | stories: PL-2.3, PL-4.8 | rls: members of the business
-- A soft hold on a date for a prospect. Expires automatically.
create table public.date_holds (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  lead_id uuid not null references public.leads(id) on delete cascade,  -- the prospect holding the date
  hold_date date not null,  -- the date being held
  expires_at timestamptz not null,  -- auto-expire time
  status text not null default 'active' check (status in ('active','expired','released','converted')),  -- converted = became a booking
  created_at timestamptz not null default now()  -- when placed
);

-- @table packages | sales | stories: PL-1.4, PL-3.1 | rls: members with see_budgets manage; a client reads the package on a proposal they can see
-- Service packages a proposal starts from (Silver, Gold, Platinum).
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  name text not null,  -- e.g. Gold
  description text,  -- what's included
  base_price numeric(10,2) not null check (base_price >= 0),  -- e.g. 11000.00
  photo_paths text[] not null default '{}',  -- Storage paths shown on the proposal
  is_active boolean not null default true,  -- can be added to new proposals
  sort_order int not null default 0,  -- display order
  created_at timestamptz not null default now()  -- when created
);

-- @table add_ons | sales | stories: PL-1.4, PL-3.1 | rls: members with see_budgets manage
-- Extras priced per item or per hour (photo booth hours, chairs, karaoke).
create table public.add_ons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  name text not null,  -- e.g. Chairs
  unit text not null default 'each' check (unit in ('each','hour')),  -- how it's priced
  unit_price numeric(10,2) not null check (unit_price >= 0),  -- e.g. 2.50 per chair
  is_active boolean not null default true,  -- can be added to new proposals
  created_at timestamptz not null default now()  -- when created
);

-- @table proposals | sales | stories: PL-3.1, PL-3.2, CL-2.1, CL-2.2 | rls: members with see_budgets manage (no hard delete); only the client accepts; the client reads non-draft versions of their own lead
-- One version of a quote. Every send is a new version; the client always sees the latest.
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  lead_id uuid not null references public.leads(id) on delete cascade,  -- the lead it's for
  version int not null default 1 check (version > 0),  -- v1, v2…
  status text not null default 'draft' check (status in ('draft','sent','viewed','changes_requested','accepted','superseded','declined')),  -- where it stands
  package_id uuid references public.packages(id),  -- chosen package
  discount numeric(10,2) not null default 0 check (discount >= 0),  -- flat discount
  tax_rate numeric(5,4) not null default 0,  -- e.g. 0.0800 = 8%
  subtotal numeric(10,2) not null default 0,  -- package + selected items − discount
  tax numeric(10,2) not null default 0,  -- subtotal × tax_rate
  total numeric(10,2) not null default 0 check (total >= 0),  -- what the client pays
  deposit_percent numeric(5,2) not null default 30 check (deposit_percent between 0 and 100),  -- e.g. 30 = 30%
  change_request text,  -- the client's "Request changes" comment
  created_by uuid references auth.users(id),  -- planner who built it
  sent_at timestamptz,  -- emailed to the client
  viewed_at timestamptz,  -- first opened by the client
  accepted_at timestamptz,  -- client clicked Accept
  created_at timestamptz not null default now(),  -- when drafted
  unique (lead_id, version)
);

-- @table proposal_items | sales | stories: PL-3.1, CL-2.2 | rls: members with see_budgets manage; the client reads items of proposals they can see
-- Lines on a proposal: add-ons with quantity, and optional upgrades the client can tick.
create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  proposal_id uuid not null references public.proposals(id) on delete cascade,  -- the proposal
  add_on_id uuid references public.add_ons(id),  -- null for a custom line
  description text not null,  -- e.g. Photo booth (4 hrs)
  quantity numeric(10,2) not null default 1 check (quantity > 0),  -- e.g. 140 chairs
  unit_price numeric(10,2) not null check (unit_price >= 0),  -- price at the time of the quote
  is_optional boolean not null default false,  -- an upgrade the client can tick
  is_selected boolean not null default true,  -- included in the total?
  override_note text,  -- why it was quoted above owned stock
  sort_order int not null default 0  -- display order
);


-- =====================================================================
-- 4. EVENTS
-- =====================================================================

-- @table events | events | stories: PL-3.4, PL-3.6, PL-3.7, PL-4.1, PL-4.2, PL-5.4, CL-2.4, NFR-5 | rls: members read, add and edit (no hard delete); portal unlock and Booked come from the server functions; owner/coordinator cancel or delete; hosts read their own
-- The Event Hub. Created when the client signs (awaiting_countersign); Booked on countersign.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  client_id uuid not null references public.clients(id),  -- primary client
  lead_id uuid references public.leads(id),  -- the lead it came from (null for manual events)
  parent_event_id uuid references public.events(id),  -- sub-events: rehearsal dinner, ceremony, brunch
  name text not null,  -- e.g. Rivera wedding
  event_type text not null check (event_type in ('wedding','birthday','baby_shower','bridal_shower','corporate','school','church','fundraiser','reunion','holiday','memorial','potluck','other')),  -- same values as leads.event_type
  status text not null default 'awaiting_countersign' check (status in ('awaiting_countersign','booked','in_planning','final_week','event_day','wrap_up','closed','cancelled')),  -- Event Hub status path
  starts_at timestamptz not null,  -- e.g. 2027-06-12 16:00 in the event's time zone
  ends_at timestamptz,  -- end time
  time_zone text not null,  -- the event's own time zone, e.g. America/Chicago
  venue_name text,  -- e.g. Hacienda Venue
  venue_address text,  -- for maps and directions
  venue_notes jsonb not null default '{}'::jsonb,  -- {"parking": "...", "load_in": "side door", "wifi": "..."}
  guest_count_estimate int,  -- before RSVPs come in
  theme text,  -- e.g. Garden
  colors text[] not null default '{}',  -- theme colors
  portal_unlocked_at timestamptz,  -- set when the deposit is paid; unlocks the client's planning pages
  headcount_locked_at timestamptz,  -- final headcount locked
  headcount_locked_count int,  -- e.g. 112
  cancelled_at timestamptz,  -- when cancelled
  created_at timestamptz not null default now(),  -- when the client signed
  updated_at timestamptz not null default now(),  -- last change
  deleted_at timestamptz  -- soft delete (restore within 30 days)
);

-- @table event_hosts | events | stories: CL-3.4, CL-3.6 | rls: members manage; hosts read their own event's hosts
-- Clients on an event: the primary client and any co-hosts (partner, parent).
create table public.event_hosts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  client_id uuid not null references public.clients(id) on delete cascade,  -- the host
  role text not null default 'co_host' check (role in ('primary','co_host')),  -- primary = signed the contract
  access text not null default 'full' check (access in ('full','limited')),  -- limited = no money
  unique (event_id, client_id)
);

-- @table contracts | sales | stories: PL-3.3, PL-3.4, CL-2.3 | rls: members with see_budgets read; created and signed only through the server functions (owner may void); the client reads their own (before and after signing); limited co-hosts can't
-- The signed agreement, generated from the accepted proposal.
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  proposal_id uuid not null unique references public.proposals(id),  -- the accepted proposal version (one contract each)
  event_id uuid references public.events(id),  -- set when the client signs
  template_id uuid references public.templates(id),  -- contract template used
  body text not null,  -- contract text with merge fields filled in
  pdf_path text,  -- Storage path of the signed PDF
  status text not null default 'sent' check (status in ('sent','client_signed','countersigned','void')),  -- signing progress
  client_signer_id uuid references public.clients(id),  -- who signed for the client
  client_signature text,  -- typed name or drawn-signature image path
  client_signed_at timestamptz,  -- timestamp for the e-sign record
  client_signed_ip inet,  -- IP address for the e-sign record
  planner_signer_id uuid references auth.users(id),  -- who countersigned
  planner_signed_at timestamptz,  -- countersign time
  created_at timestamptz not null default now()  -- when generated
);

-- @table appointments | sales | stories: PL-2.4, CL-1.2, PL-1.8, PL-4.8 | rls: members manage
-- Calendar items that aren't events: consults, site visits, tastings, calls, deliveries.
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  lead_id uuid references public.leads(id) on delete cascade,  -- for consults before booking
  event_id uuid references public.events(id) on delete cascade,  -- for tastings and site visits after booking
  kind text not null check (kind in ('consult','site_visit','tasting','call','delivery','pickup')),  -- what it is
  starts_at timestamptz not null,  -- start
  ends_at timestamptz not null,  -- end
  location text,  -- address or "Phone"
  status text not null default 'scheduled' check (status in ('scheduled','done','cancelled','no_show')),  -- outcome
  booked_by_client boolean not null default false,  -- booked from the public booking page
  external_calendar_id text,  -- id in Google/Apple/Outlook after sync
  created_at timestamptz not null default now(),  -- when booked
  check (ends_at > starts_at)
);


-- =====================================================================
-- 5. MONEY (staff need the see_budgets permission)
-- =====================================================================

-- @table invoices | money | stories: PL-3.5, PL-4.7, CL-2.4, CL-4.2 | rls: owner + members with see_budgets; totals and paid amounts update only from payments and change orders; owner may void; full-access hosts read their own
-- One invoice per event, created when the client signs (so the deposit can be paid right away).
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  contract_id uuid references public.contracts(id),  -- the contract it came from
  number text not null,  -- e.g. 1042
  status text not null default 'open' check (status in ('open','partially_paid','paid','void')),  -- payment state
  total numeric(10,2) not null check (total >= 0),  -- contract total + approved change orders
  amount_paid numeric(10,2) not null default 0,  -- kept in sync from payments by the server; people can't edit it (guard trigger)
  autopay boolean not null default false,  -- charge saved card on due dates
  pass_card_fee boolean not null default false,  -- client pays the card fee
  late_fee_allowed boolean not null default false,  -- only if the contract allows it
  created_at timestamptz not null default now(),  -- when created
  unique (business_id, number)
);

-- @table installments | money | stories: PL-3.5, CL-2.4, CL-4.1, CL-4.2 | rls: owner + members with see_budgets; paid only via payments, amounts only via change orders; full-access hosts read their own
-- The payment schedule: deposit, payment 2, final payment.
create table public.installments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  invoice_id uuid not null references public.invoices(id) on delete cascade,  -- the invoice
  label text not null,  -- e.g. Deposit 30%
  amount numeric(10,2) not null check (amount >= 0),  -- e.g. 4455.00
  due_rule text,  -- how the date was set, e.g. at_signing, 60_days_before (shifts on reschedule)
  due_date date not null,  -- e.g. 2027-04-13
  status text not null default 'due' check (status in ('due','paid','overdue','waived')),  -- payment state
  reminders_paused boolean not null default false,  -- planner paused reminders
  sort_order int not null default 0  -- 1 = deposit
);

-- @table payments | money | stories: PL-3.5, CL-2.4, CL-4.2, SYS-3, NFR-6 | rls: owner + members with see_budgets read; full-access hosts read their own; ONLY the webhook/server writes
-- Money in (charges, manual cash/check) and out (refunds). Status comes only from processor webhooks.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  invoice_id uuid not null references public.invoices(id),  -- what it pays
  installment_id uuid references public.installments(id),  -- which scheduled payment, if any
  kind text not null default 'charge' check (kind in ('charge','manual','refund')),  -- manual = cash/check/Venmo recorded by the planner
  method text not null check (method in ('card','apple_pay','google_pay','ach','cash','check','venmo','zelle','cash_app','tap_to_pay')),  -- how it was paid
  amount numeric(10,2) not null check (amount > 0),  -- always positive; kind says the direction
  status text not null default 'pending' check (status in ('pending','succeeded','failed')),  -- from the processor
  processor text check (processor in ('stripe','square')),  -- null for manual
  processor_payment_id text unique,  -- Stripe/Square id; unique so a webhook can't double-record
  idempotency_key text unique,  -- one per checkout attempt; stops double-tap charges
  refund_of uuid references public.payments(id),  -- for refunds: the original charge
  failure_reason text,  -- plain-language reason shown to the client
  recorded_by uuid references auth.users(id),  -- planner who recorded a manual payment
  paid_at timestamptz,  -- when it succeeded
  created_at timestamptz not null default now()  -- when attempted
);

-- @table change_orders | money | stories: CL-4.3, PL-4.6 | rls: members with see_budgets send (pending) or withdraw; only the client decides; full-access hosts read their own
-- Mid-planning upgrades (e.g. +1 hour karaoke) the client approves.
create table public.change_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  invoice_id uuid not null references public.invoices(id),  -- invoice to update when approved
  description text not null,  -- e.g. +1 hour karaoke
  amount numeric(10,2) not null,  -- e.g. 250.00 (negative for a credit)
  status text not null default 'pending' check (status in ('pending','approved','declined')),  -- client decision
  requested_by uuid references auth.users(id),  -- planner who sent it
  decided_by uuid references public.clients(id),  -- client who decided
  decided_at timestamptz,  -- when decided
  created_at timestamptz not null default now()  -- when sent
);


-- =====================================================================
-- 6. PLANNING
-- =====================================================================

-- @table tasks | planning | stories: PL-4.3, PL-4.4, CL-3.1 | rls: members manage; a client reads tasks assigned to them
-- Checklist items for an event; due dates can be relative to the event date.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  parent_task_id uuid references public.tasks(id) on delete cascade,  -- subtasks
  template_id uuid references public.templates(id),  -- checklist it came from
  title text not null,  -- e.g. Order cake
  notes text,  -- details
  assignee_kind text not null default 'planner' check (assignee_kind in ('planner','staff','client','vendor')),  -- who it's for
  assignee_user_id uuid references auth.users(id),  -- planner/staff assignee
  assignee_client_id uuid references public.clients(id),  -- client assignee (shows in "Needs your action")
  due_offset_days int,  -- e.g. -30 = 30 days before the event; recalculated on reschedule
  due_date date,  -- the actual due date
  status text not null default 'open' check (status in ('open','done')),  -- progress
  sort_order int not null default 0,  -- drag-to-reorder position
  completed_at timestamptz,  -- when done
  created_at timestamptz not null default now()  -- when created
);

-- @table questionnaires | planning | stories: PL-4.4, CL-3.2 | rls: members manage; hosts read and fill in answers after the deposit (they can't create, rename or delete)
-- A questionnaire sent to a client; answers fill in event details.
create table public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  template_id uuid references public.templates(id),  -- questions come from here
  title text not null,  -- e.g. Wedding details
  status text not null default 'sent' check (status in ('sent','in_progress','submitted')),  -- progress
  answers jsonb not null default '{}'::jsonb,  -- saved after every field
  sent_at timestamptz not null default now(),  -- when sent
  submitted_at timestamptz  -- when the client submitted
);

-- @table mood_boards | planning | stories: PL-4.5, CL-3.3 | rls: members manage; hosts read after the deposit
-- A mood board for an event; its items are rows in files.
create table public.mood_boards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  name text not null,  -- e.g. Garden
  palette text[] not null default '{}',  -- e.g. {sage,blush,ivory}
  created_at timestamptz not null default now()  -- when created
);

-- @table files | planning | stories: PL-4.5, CL-3.3, PL-4.6 | rls: members manage (no hard delete: soft delete); hosts read shared files and upload after the deposit
-- Uploaded files (stored in Supabase Storage) and mood board items.
create table public.files (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid references public.events(id) on delete cascade,  -- null for business-wide files
  mood_board_id uuid references public.mood_boards(id) on delete cascade,  -- set if it's a mood board item
  storage_path text,  -- Supabase Storage path (null for a Pinterest-only item)
  pinterest_url text,  -- for pasted Pinterest links
  name text not null,  -- e.g. Signed contract.pdf
  mime_type text,  -- e.g. application/pdf
  size_bytes bigint,  -- file size
  visibility text not null default 'private' check (visibility in ('shared','private')),  -- shared = client can see it
  uploaded_by uuid references auth.users(id),  -- planner or client who uploaded it
  created_at timestamptz not null default now(),  -- when uploaded
  deleted_at timestamptz  -- soft delete
);

-- @table comments | planning | stories: PL-4.5, CL-3.3 | rls: members manage; hosts read comments on shared files and edit or delete only their own
-- Comments on files and mood board items ("Love the peonies!").
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  file_id uuid not null references public.files(id) on delete cascade,  -- what it's about
  author_id uuid not null references auth.users(id),  -- who wrote it
  body text not null check (char_length(body) between 1 and 2000),  -- the comment
  created_at timestamptz not null default now()  -- when written
);

-- @table approvals | planning | stories: CL-3.5, CL-3.6, PL-4.5, PL-5.3, PL-5.4 | rls: members manage; hosts read after the deposit
-- Something the planner asks the client to approve (menu, invitation wording, final headcount…).
create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  subject text not null check (subject in ('menu','timeline','invitation','mood_board','final_headcount','floor_plan','other')),  -- what kind
  title text not null,  -- e.g. Menu v2
  file_id uuid references public.files(id),  -- the thing being approved, if it's a file
  status text not null default 'pending' check (status in ('pending','approved','changes_requested','conflict')),  -- conflict = co-hosts disagree
  opens_at timestamptz,  -- e.g. final headcount opens Jun 5
  requested_by uuid references auth.users(id),  -- planner who asked
  requested_at timestamptz not null default now(),  -- when asked
  resolved_at timestamptz  -- when settled
);

-- @table approval_responses | planning | stories: CL-3.6 | rls: members read and add (never deleted: it's the log); hosts add their own response
-- Each host's answer to an approval. The log of who approved what and when.
create table public.approval_responses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  approval_id uuid not null references public.approvals(id) on delete cascade,  -- the approval
  client_id uuid not null references public.clients(id),  -- the host who answered
  decision text not null check (decision in ('approved','changes_requested')),  -- their answer
  comment text,  -- e.g. "more veg options"
  responded_at timestamptz not null default now(),  -- when
  unique (approval_id, client_id)
);

-- @table message_threads | planning | stories: PL-4.6, CL-4.5 | rls: members manage; hosts read their event's client thread (even before the deposit)
-- One conversation: the client thread for an event, or one per vendor (Phase 2).
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid references public.events(id) on delete cascade,  -- null for pre-booking lead threads
  lead_id uuid references public.leads(id) on delete cascade,  -- questions asked from a proposal before booking
  kind text not null default 'client' check (kind in ('client','vendor','internal')),  -- clients never see vendor threads
  title text,  -- e.g. Ana & Marco
  created_at timestamptz not null default now()  -- when started
);

-- @table messages | planning | stories: PL-4.6, CL-4.3, CL-4.5 | rls: anyone in the thread; never hard-deleted
-- A single message in a thread.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  thread_id uuid not null references public.message_threads(id) on delete cascade,  -- the conversation
  sender_id uuid not null references auth.users(id),  -- planner, staff or client
  body text not null check (char_length(body) between 1 and 5000),  -- the message
  file_id uuid references public.files(id),  -- attachment
  change_order_id uuid references public.change_orders(id),  -- a change order sent in the thread
  created_at timestamptz not null default now(),  -- when sent
  read_at timestamptz  -- when the other side read it
);


-- =====================================================================
-- 7. GUESTS: website, households, RSVPs, invitations
-- =====================================================================

-- @table event_websites | guests | stories: PL-5.2, GU-1.3, GU-2.2, GU-2.3 | rls: members manage; hosts read; guests read via guest_household()
-- Settings for the guest-facing event website and RSVP form.
create table public.event_websites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null unique references public.events(id) on delete cascade,  -- one website per event
  slug text not null unique,  -- e.g. rivera → events.yourbiz.com/rivera
  privacy text not null default 'private' check (privacy in ('private','password','public')),  -- who can open it
  password_hash text,  -- only for password mode
  rsvp_cutoff date,  -- e.g. 2027-05-01
  allow_late_rsvps boolean not null default false,  -- accept RSVPs after the cutoff
  default_plus_ones int not null default 0 check (default_plus_ones >= 0),  -- per household unless overridden
  sections jsonb not null default '{}'::jsonb,  -- {"schedule": [...], "dress_code": "...", "hotel": {...}, "faq": [...]}
  registry_url text,  -- external registry or fund link (in-app funds are Phase 4)
  custom_questions jsonb not null default '[]'::jsonb,  -- extra RSVP questions
  created_at timestamptz not null default now(),  -- when created
  updated_at timestamptz not null default now()  -- last change
);

-- @table meal_options | guests | stories: PL-5.2, GU-2.1 | rls: members manage; hosts read; guests read via guest_household()
-- Meal choices offered on the RSVP form.
create table public.meal_options (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  name text not null,  -- e.g. Chicken
  sort_order int not null default 0,  -- display order
  unique (event_id, name)
);

-- @table households | guests | stories: PL-5.1, GU-1.1, GU-2.1, CL-3.4 | rls: members manage; hosts manage after the deposit; guests via their invite_token only
-- One invitation per household. Its invite_token is the guest's "login".
create table public.households (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  name text not null,  -- e.g. Rivera family
  plus_ones_allowed int not null default 0 check (plus_ones_allowed >= 0),  -- e.g. 1
  invite_token text not null unique default replace(gen_random_uuid()::text, '-', ''),  -- secret in the invite link
  tags text[] not null default '{}',  -- family, work, bride's side…
  created_at timestamptz not null default now()  -- when added
);

-- @table guests | guests | stories: PL-5.1, PL-5.4, GU-2.1, GU-2.2, CL-3.4, NFR-14 | rls: members manage; hosts manage after the deposit; guests via guest_* functions
-- A person invited to an event, with their RSVP.
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  household_id uuid not null references public.households(id) on delete cascade,  -- their household
  first_name text not null,  -- e.g. Lucia
  last_name text,  -- e.g. Rivera
  email text,  -- for email invites
  phone text,  -- for text invites
  is_child boolean not null default false,  -- children: no data capture (NFR-14)
  is_plus_one boolean not null default false,  -- added by the guest as their plus-one
  tags text[] not null default '{}',  -- VIP, kids…
  notes text,  -- planner notes
  gift_note text,  -- for the thank-you tracker
  rsvp_status text not null default 'no_reply' check (rsvp_status in ('no_reply','attending','declined','maybe')),  -- their answer
  meal_option_id uuid references public.meal_options(id),  -- meal choice
  dietary_notes text,  -- allergies; never dropped on import/export
  song_request text,  -- e.g. September – Earth, Wind & Fire
  answers jsonb not null default '{}'::jsonb,  -- answers to custom questions
  responded_at timestamptz,  -- last RSVP change
  via_forwarded_link boolean not null default false,  -- answered from a forwarded link (host sees a flag)
  created_at timestamptz not null default now(),  -- when added
  updated_at timestamptz not null default now()  -- last change
);

-- @table invitations | guests | stories: PL-5.3, CL-3.5, GU-1.1, GU-4.1 | rls: members manage; hosts read (to approve wording)
-- A send: save-the-date, invitation, reminder, change notice or thank-you.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid not null references public.events(id) on delete cascade,  -- the event
  kind text not null check (kind in ('save_the_date','invitation','reminder','change_notice','thank_you')),  -- what it is
  template_id uuid references public.templates(id),  -- design used (P1: basic branded template)
  wording text not null,  -- the message
  channels text[] not null default '{email,sms}',  -- email, sms, link
  audience text not null default 'not_yet_invited' check (audience in ('not_yet_invited','all','selected')),  -- who gets it
  approval_id uuid references public.approvals(id),  -- the client's approval of the wording
  status text not null default 'draft' check (status in ('draft','scheduled','sent','cancelled')),  -- progress
  scheduled_at timestamptz,  -- e.g. Mar 1, 9:00 AM
  sent_at timestamptz,  -- when it went out
  created_at timestamptz not null default now()  -- when drafted
);


-- =====================================================================
-- 8. SYSTEM: notifications, event bus, activity
-- =====================================================================

-- @table deliveries | system | stories: SYS-2, PL-4.6, PL-5.3 | rls: members read; written only by the notification service
-- Every email, text and push we send, and what happened to it (delivered, opened, bounced, STOP).
create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  event_id uuid references public.events(id) on delete cascade,  -- related event, if any
  invitation_id uuid references public.invitations(id) on delete cascade,  -- set for invitation sends
  guest_id uuid references public.guests(id) on delete cascade,  -- recipient if a guest
  client_id uuid references public.clients(id) on delete cascade,  -- recipient if a client
  user_id uuid references auth.users(id) on delete cascade,  -- recipient if planner/staff
  channel text not null check (channel in ('email','sms','push')),  -- how
  to_address text not null,  -- email address, phone number or device
  template_key text not null,  -- e.g. proposal_sent, payment_reminder, invitation
  status text not null default 'queued' check (status in ('queued','sent','delivered','opened','bounced','opted_out','failed')),  -- latest provider status
  provider_message_id text unique,  -- SendGrid/Twilio id, for webhooks
  error text,  -- failure detail
  sent_at timestamptz,  -- handed to the provider
  opened_at timestamptz,  -- first open (email)
  created_at timestamptz not null default now()  -- queued at
);

-- @table opt_outs | system | stories: SYS-2, PL-5.3 | rls: members read; written by the notification service
-- Addresses that bounced or replied STOP. We never send to them on that channel.
create table public.opt_outs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  channel text not null check (channel in ('email','sms')),  -- which channel
  address text not null,  -- email or phone
  source text not null check (source in ('stop_reply','unsubscribe_link','bounce')),  -- why
  opted_out_at timestamptz not null default now(),  -- when
  unique (business_id, channel, address)
);

-- @table domain_events | system | stories: SYS-1 | rls: none for users; written and read by the server only
-- The event bus "outbox": lead.created, contract.client_signed, rsvp.updated… Workers process each row once.
create table public.domain_events (
  id bigint generated always as identity primary key,  -- increasing number = processing order
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  type text not null,  -- e.g. rsvp.updated
  payload jsonb not null default '{}'::jsonb,  -- ids the handlers need
  created_at timestamptz not null default now(),  -- when it happened
  processed_at timestamptz,  -- when handlers finished
  attempts int not null default 0,  -- retries so far
  last_error text  -- last failure, for the dead-letter log
);

-- @table activity_log | system | stories: PL-2.3, PL-3.6, CL-3.6, NFR-13 | rls: members read; written by the server
-- Human-readable history shown on Lead Detail and events (who did what, when).
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,  -- the planner's business
  actor_id uuid references auth.users(id),  -- who did it (null = the system)
  entity_type text not null,  -- e.g. lead, event, proposal
  entity_id uuid not null,  -- id of that row
  action text not null,  -- e.g. hold_placed, rescheduled, approved
  details jsonb not null default '{}'::jsonb,  -- e.g. {"from": "2027-06-12", "to": "2027-07-03"}
  created_at timestamptz not null default now()  -- when
);


-- =====================================================================
-- 9. INDEXES AND updated_at TRIGGERS
-- =====================================================================
-- Postgres doesn't index foreign keys automatically. This loop adds an index
-- for the columns we filter on most. (Same as writing one "create index" per row.)
do $$
declare r record;
begin
  for r in
    select table_name, column_name from information_schema.columns
    where table_schema = 'public'
      and column_name in ('business_id','event_id','lead_id','client_id','invoice_id','proposal_id','household_id','thread_id','approval_id','file_id')
  loop
    execute format('create index if not exists %I on public.%I (%I)',
                   r.table_name || '_' || r.column_name || '_idx', r.table_name, r.column_name);
  end loop;
end $$;

-- A client's email is unique within a business, ignoring letter case (Ana@x.com = ana@x.com).
create unique index clients_business_email_unique on public.clients (business_id, lower(email));

-- Keep updated_at current on every table that has it.
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  for t in select table_name from information_schema.columns
           where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
                   t || '_updated_at', t);
  end loop;
end $$;


-- =====================================================================
-- 10. ROW-LEVEL SECURITY
-- =====================================================================
-- RLS = Postgres checks every row against these policies on every query, so
-- security doesn't depend on hiding buttons (NFR-3).
-- No policy = no access. The server's service role (webhooks, Edge Functions)
-- bypasses RLS, which is how payments, deliveries and domain_events get written.

-- ---- Helper functions (security definer = they can read memberships even though RLS is on)

-- Is the signed-in user an active member of this business?
create or replace function public.is_member(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m
                 where m.business_id = b and m.user_id = auth.uid() and m.status = 'active');
$$;

-- Owner, or a member granted this permission (see_budgets, see_profit, take_payments, edit_vendors).
create or replace function public.has_permission(b uuid, perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m
                 where m.business_id = b and m.user_id = auth.uid() and m.status = 'active'
                   and (m.role = 'owner' or coalesce((m.permissions ->> perm)::boolean, false)));
$$;

create or replace function public.is_owner(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m
                 where m.business_id = b and m.user_id = auth.uid() and m.status = 'active' and m.role = 'owner');
$$;

-- Is the signed-in user a host (client or co-host) of this event?
create or replace function public.is_event_host(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from event_hosts h join clients c on c.id = h.client_id
                 where h.event_id = e and c.user_id = auth.uid());
$$;

-- Host AND the deposit is paid (planning pages unlock after the deposit).
create or replace function public.host_can_plan(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_event_host(e)
     and exists (select 1 from events where id = e and portal_unlocked_at is not null);
$$;

-- Is the signed-in user the client on this lead? (proposals before an event exists)
create or replace function public.is_lead_client(l uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from leads ld join clients c on c.id = ld.client_id
                 where ld.id = l and c.user_id = auth.uid());
$$;

-- Owner or coordinator (the people who run events; staff can't cancel, delete or countersign).
create or replace function public.is_manager(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m
                 where m.business_id = b and m.user_id = auth.uid() and m.status = 'active'
                   and m.role in ('owner','coordinator'));
$$;

-- A host with FULL access (event_hosts.access = 'full'). Limited co-hosts see no money.
create or replace function public.is_full_host(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from event_hosts h join clients c on c.id = h.client_id
                 where h.event_id = e and c.user_id = auth.uid() and h.access = 'full');
$$;

-- ---- Turn RLS on for every table in public
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---- Pattern 1: members of the business read, add and edit.
-- Tables with prices (packages, add_ons, proposals, proposal_items, contracts) need
-- see_budgets instead, because staff get "no access to financials unless I grant it" (spec).
-- Hard deletes are allowed only where losing the row loses nothing important. Records we must
-- keep (clients, leads, events, files: soft delete with deleted_at; contracts, proposal versions,
-- approval responses and messages: history) have NO delete policy.
-- Contracts have no insert policy: client_accept_proposal() creates them.
do $$
declare
  t text;
  v_who text;
  v_price_tables text[] := array['packages','add_ons','proposals','proposal_items','contracts'];
  v_keep text[] := array['clients','leads','events','files','contracts','proposals','approval_responses','messages'];
begin
  foreach t in array array['clients','templates','leads','date_holds','packages','add_ons','proposals','proposal_items',
                           'events','event_hosts','contracts','appointments','tasks','questionnaires','mood_boards','files',
                           'comments','approvals','approval_responses','message_threads','messages',
                           'event_websites','meal_options','households','guests','invitations']
  loop
    v_who := case when t = any(v_price_tables) then 'public.has_permission(business_id, ''see_budgets'')'
                  else 'public.is_member(business_id)' end;
    execute format('create policy "members read" on public.%I for select to authenticated using (%s)', t, v_who);
    execute format('create policy "members edit" on public.%I for update to authenticated using (%s) with check (%s)', t, v_who, v_who);
    if t <> 'contracts' then
      execute format('create policy "members add" on public.%I for insert to authenticated with check (%s)', t, v_who);
    end if;
    if not t = any(v_keep) then
      execute format('create policy "members delete" on public.%I for delete to authenticated using (%s)', t, v_who);
    end if;
  end loop;
end $$;

-- ---- Pattern 2: money needs see_budgets (owners always have it).
-- Invoices and installments are never hard-deleted (void them instead); a pending change order can be withdrawn.
do $$
declare t text;
begin
  foreach t in array array['invoices','installments','change_orders'] loop
    execute format('create policy "budget members read" on public.%I for select to authenticated
                    using (public.has_permission(business_id, ''see_budgets''))', t);
    execute format('create policy "budget members add" on public.%I for insert to authenticated
                    with check (public.has_permission(business_id, ''see_budgets''))', t);
    execute format('create policy "budget members edit" on public.%I for update to authenticated
                    using (public.has_permission(business_id, ''see_budgets''))
                    with check (public.has_permission(business_id, ''see_budgets''))', t);
  end loop;
end $$;
create policy "budget members withdraw pending" on public.change_orders for delete to authenticated
  using (status = 'pending' and public.has_permission(business_id, 'see_budgets'));
-- payments: read-only for people; only the webhook/server (service role) writes.
create policy "budget members read" on public.payments for select to authenticated
  using (public.has_permission(business_id, 'see_budgets'));

-- ---- Pattern 3: read-only for members; the server writes
create policy "members read" on public.deliveries for select to authenticated using (public.is_member(business_id));
create policy "members read" on public.opt_outs for select to authenticated using (public.is_member(business_id));
create policy "members read" on public.activity_log for select to authenticated using (public.is_member(business_id));
-- domain_events: no user policies at all (server only).

-- ---- Identity tables
create policy "members read" on public.businesses for select to authenticated using (public.is_member(id));
-- Clients see their planner's name, logo and colors in the portal (NFR-15).
create policy "clients read their planner" on public.businesses for select to authenticated
  using (exists (select 1 from clients c where c.business_id = businesses.id and c.user_id = auth.uid()));
create policy "owner updates" on public.businesses for update to authenticated using (public.is_owner(id)) with check (public.is_owner(id));
-- RLS picks rows, not columns, so the payment account id is hidden with column privileges:
-- signed-in users may read every column EXCEPT payment_account_id (only the server uses it).
revoke select on public.businesses from authenticated;
grant select (id, name, slug, logo_path, brand_colors, custom_domain, time_zone, payment_provider, created_at, updated_at)
  on public.businesses to authenticated;

create policy "read own and teammates" on public.profiles for select to authenticated
  using (id = auth.uid() or exists (select 1 from memberships a join memberships b on a.business_id = b.business_id
                                    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy "edit own" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "members read" on public.memberships for select to authenticated using (public.is_member(business_id) or user_id = auth.uid());
create policy "owner manages" on public.memberships for all to authenticated
  using (public.is_owner(business_id)) with check (public.is_owner(business_id));

-- ---- Pattern 4: clients (hosts) see only their own things.
-- Money (invoices, payments, change orders, the contract with its total) needs a FULL-access host:
-- a "limited" co-host sees no money (event_hosts.access).
create policy "client reads own" on public.clients for select to authenticated using (user_id = auth.uid());
create policy "client reads own" on public.leads for select to authenticated using (public.is_lead_client(id));
create policy "client reads sent versions" on public.proposals for select to authenticated
  using (status <> 'draft' and public.is_lead_client(lead_id));
create policy "client reads items" on public.proposal_items for select to authenticated
  using (exists (select 1 from proposals p where p.id = proposal_id and p.status <> 'draft' and public.is_lead_client(p.lead_id)));
-- The package named on a proposal the client can see (Portal › Proposal shows its name and photos).
create policy "client reads quoted package" on public.packages for select to authenticated
  using (exists (select 1 from proposals p where p.package_id = packages.id and p.status <> 'draft' and public.is_lead_client(p.lead_id)));
create policy "host reads" on public.events for select to authenticated using (public.is_event_host(id));
create policy "host reads" on public.event_hosts for select to authenticated using (public.is_event_host(event_id));
-- Contracts: the client must read it BEFORE signing, when no event exists yet, so check through the proposal's lead.
create policy "client reads own" on public.contracts for select to authenticated
  using (public.is_full_host(event_id)
         or exists (select 1 from proposals p where p.id = proposal_id and public.is_lead_client(p.lead_id)));
create policy "full host reads" on public.invoices for select to authenticated using (public.is_full_host(event_id));
create policy "full host reads" on public.installments for select to authenticated
  using (exists (select 1 from invoices i where i.id = invoice_id and public.is_full_host(i.event_id)));
create policy "full host reads" on public.payments for select to authenticated
  using (exists (select 1 from invoices i where i.id = invoice_id and public.is_full_host(i.event_id)));
create policy "full host reads" on public.change_orders for select to authenticated using (public.is_full_host(event_id));
create policy "client reads own tasks" on public.tasks for select to authenticated
  using (public.host_can_plan(event_id) and assignee_client_id in (select id from clients where user_id = auth.uid()));
-- Questionnaires: hosts read and fill in answers; only the planner creates or deletes them.
-- (The guard trigger in section 10b lets a host change only answers, status and submitted_at.)
create policy "host reads" on public.questionnaires for select to authenticated using (public.host_can_plan(event_id));
create policy "host fills in" on public.questionnaires for update to authenticated
  using (public.host_can_plan(event_id)) with check (public.host_can_plan(event_id));
create policy "host reads" on public.mood_boards for select to authenticated using (public.host_can_plan(event_id));
create policy "host reads shared" on public.files for select to authenticated
  using (visibility = 'shared' and public.host_can_plan(event_id));
create policy "host uploads shared" on public.files for insert to authenticated
  with check (visibility = 'shared' and uploaded_by = auth.uid() and public.host_can_plan(event_id)
              and business_id = (select e.business_id from events e where e.id = event_id));
-- Comments: hosts read every comment on a shared file, but edit or delete only their OWN.
create policy "host reads comments" on public.comments for select to authenticated
  using (exists (select 1 from files f where f.id = file_id and f.visibility = 'shared' and public.host_can_plan(f.event_id)));
create policy "host comments" on public.comments for insert to authenticated
  with check (author_id = auth.uid()
              and exists (select 1 from files f where f.id = file_id and f.visibility = 'shared' and public.host_can_plan(f.event_id)));
create policy "host edits own comment" on public.comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "host deletes own comment" on public.comments for delete to authenticated
  using (author_id = auth.uid());
create policy "host reads" on public.approvals for select to authenticated using (public.host_can_plan(event_id));
create policy "host reads" on public.approval_responses for select to authenticated
  using (exists (select 1 from approvals a where a.id = approval_id and public.host_can_plan(a.event_id)));
create policy "host answers" on public.approval_responses for insert to authenticated
  with check (client_id in (select id from clients where user_id = auth.uid())
              and exists (select 1 from approvals a where a.id = approval_id and public.host_can_plan(a.event_id)));
-- Messages stay open before the deposit, so threads use is_event_host / is_lead_client, not host_can_plan.
create policy "client thread" on public.message_threads for select to authenticated
  using (kind = 'client' and (public.is_event_host(event_id) or public.is_lead_client(lead_id)));
create policy "client messages" on public.messages for select to authenticated
  using (exists (select 1 from message_threads t where t.id = thread_id and t.kind = 'client'
                 and (public.is_event_host(t.event_id) or public.is_lead_client(t.lead_id))));
create policy "client sends" on public.messages for insert to authenticated
  with check (sender_id = auth.uid()
              and exists (select 1 from message_threads t where t.id = thread_id and t.kind = 'client'
                          and (public.is_event_host(t.event_id) or public.is_lead_client(t.lead_id))));
create policy "host reads" on public.event_websites for select to authenticated using (public.is_event_host(event_id));
create policy "host reads" on public.meal_options for select to authenticated using (public.is_event_host(event_id));
create policy "host manages guests" on public.households for all to authenticated
  using (public.host_can_plan(event_id)) with check (public.host_can_plan(event_id));
create policy "host manages guests" on public.guests for all to authenticated
  using (public.host_can_plan(event_id)) with check (public.host_can_plan(event_id));
create policy "host reads" on public.invitations for select to authenticated using (public.host_can_plan(event_id));
-- Client actions with business rules (accept proposal, tick upgrades, sign, pay, approve a change
-- order) go through server functions so the rules live in one place, not in policies.


-- =====================================================================
-- 10b. GUARD TRIGGERS: rules that policies can't express
-- =====================================================================
-- A policy decides WHICH ROWS someone may change, not WHICH COLUMNS or what values.
-- So "staff may edit an event, but not unlock the client portal" needs a trigger.
--
-- The trick: server functions are "security definer", so inside them current_user is the
-- database owner, and the payment webhook runs as service_role. App users run as
-- "authenticated" (or "anon"). The guards below only stop app users, so the booking
-- functions, the webhook and admins can still do their jobs.

-- Is this change coming from the server (a server function, the webhook or an admin)?
create or replace function public.is_server() returns boolean
language sql stable as $$
  select current_user not in ('authenticated', 'anon');
$$;

-- Which columns differ between the old and new row? (Used by every guard.)
create or replace function public._changed_columns(o jsonb, n jsonb) returns text[]
language sql immutable as $$
  select coalesce(array_agg(k), '{}') from jsonb_object_keys(n) k where (o -> k) is distinct from (n -> k);
$$;

-- Events: the portal unlocks when the deposit is paid; Booked comes from countersigning;
-- only an owner or coordinator can cancel, delete or move an event along its status path.
create or replace function public._guard_events() returns trigger
language plpgsql as $$
declare v_changed text[];
begin
  if public.is_server() then return new; end if;
  if tg_op = 'INSERT' then
    if new.portal_unlocked_at is not null and new.lead_id is not null then
      raise exception 'The client portal unlocks when the deposit is paid.';
    end if;
    return new;
  end if;
  v_changed := public._changed_columns(to_jsonb(old), to_jsonb(new));
  if v_changed && array['lead_id','business_id'] then
    raise exception 'An event can''t be moved to another lead or business.';
  end if;
  -- Manual events (no lead, so no deposit) can be unlocked by an owner or coordinator.
  if 'portal_unlocked_at' = any(v_changed) and not (new.lead_id is null and public.is_manager(new.business_id)) then
    raise exception 'The client portal unlocks when the deposit is paid.';
  end if;
  if 'status' = any(v_changed)
     and (old.status = 'awaiting_countersign' or new.status = 'awaiting_countersign')
     and new.status <> 'cancelled' then
    raise exception 'An event is booked when you countersign its contract.';
  end if;
  if v_changed && array['status','cancelled_at','deleted_at'] and not public.is_manager(new.business_id) then
    raise exception 'Only an owner or coordinator can cancel, delete or change the status of an event.';
  end if;
  return new;
end $$;

-- Contracts: signatures and status change only through the signing functions.
-- An owner may void a contract that isn't countersigned yet; the PDF path may be updated.
create or replace function public._guard_contracts() returns trigger
language plpgsql as $$
declare v_changed text[];
begin
  if public.is_server() then return new; end if;
  v_changed := public._changed_columns(to_jsonb(old), to_jsonb(new));
  if v_changed = array['status'] and new.status = 'void' and old.status <> 'countersigned'
     and public.is_owner(new.business_id) then
    return new;
  end if;
  if not v_changed <@ array['pdf_path','template_id'] then
    raise exception 'Contracts are signed in the app''s signing steps and can''t be edited directly.';
  end if;
  return new;
end $$;

-- Invoices: the total and amount paid follow the contract, change orders and payments.
-- People may change settings (autopay, card fee, late fee) and an owner may void an invoice.
create or replace function public._guard_invoices() returns trigger
language plpgsql as $$
declare v_changed text[];
begin
  if public.is_server() then return new; end if;
  if tg_op = 'INSERT' then
    if new.amount_paid <> 0 or new.status <> 'open' then
      raise exception 'A new invoice starts open with nothing paid; payments are recorded separately.';
    end if;
    return new;
  end if;
  v_changed := public._changed_columns(to_jsonb(old), to_jsonb(new));
  if 'status' = any(v_changed) and not (new.status = 'void' and public.is_owner(new.business_id)) then
    raise exception 'An invoice''s status updates itself from payments; an owner can void it.';
  end if;
  if v_changed && array['amount_paid','total','event_id','contract_id','business_id'] then
    raise exception 'Invoice totals update themselves from payments and change orders.';
  end if;
  return new;
end $$;

-- Installments: "paid" comes only from a recorded payment, and amounts change through change orders.
create or replace function public._guard_installments() returns trigger
language plpgsql as $$
declare v_changed text[];
begin
  if public.is_server() then return new; end if;
  if tg_op = 'INSERT' then
    if new.status = 'paid' then
      raise exception 'An installment is marked paid when its payment is recorded.';
    end if;
    return new;
  end if;
  v_changed := public._changed_columns(to_jsonb(old), to_jsonb(new));
  if 'status' = any(v_changed) and 'paid' in (old.status, new.status) then
    raise exception 'An installment is marked paid when its payment is recorded.';
  end if;
  if v_changed && array['amount','invoice_id','business_id'] then
    raise exception 'To change what the client owes, send a change order.';
  end if;
  return new;
end $$;

-- Proposals: only the client accepts (client_accept_proposal).
create or replace function public._guard_proposals() returns trigger
language plpgsql as $$
begin
  if public.is_server() then return new; end if;
  if (tg_op = 'INSERT' and (new.status = 'accepted' or new.accepted_at is not null))
     or (tg_op = 'UPDATE' and ((new.status is distinct from old.status and 'accepted' in (old.status, new.status))
                               or new.accepted_at is distinct from old.accepted_at)) then
    raise exception 'Only the client can accept a proposal.';
  end if;
  return new;
end $$;

-- Change orders: only the client decides (client_decide_change_order); the planner sends them as pending.
create or replace function public._guard_change_orders() returns trigger
language plpgsql as $$
begin
  if public.is_server() then return new; end if;
  if (tg_op = 'INSERT' and (new.status <> 'pending' or new.decided_by is not null or new.decided_at is not null))
     or (tg_op = 'UPDATE' and public._changed_columns(to_jsonb(old), to_jsonb(new))
                              && array['status','decided_by','decided_at','amount','invoice_id','event_id']) then
    raise exception 'The client approves or declines a change order in their portal. To change it, withdraw it and send a new one.';
  end if;
  return new;
end $$;

-- Questionnaires: a host (not a member) may only fill in answers and submit.
create or replace function public._guard_questionnaires() returns trigger
language plpgsql as $$
begin
  if public.is_server() or public.is_member(new.business_id) then return new; end if;
  if not (public._changed_columns(to_jsonb(old), to_jsonb(new)) <@ array['answers','status','submitted_at'])
     or (new.status = 'sent' and old.status <> 'sent') then
    raise exception 'You can fill in the answers, but the questions come from your planner.';
  end if;
  return new;
end $$;

-- Memberships: a business always keeps at least one active owner (ownership transfer is PL-1.9).
create or replace function public._guard_last_owner() returns trigger
language plpgsql as $$
begin
  if public.is_server() then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if old.role = 'owner' and old.status = 'active'
     and (tg_op = 'DELETE' or new.role <> 'owner' or new.status <> 'active')
     and not exists (select 1 from memberships m where m.business_id = old.business_id and m.id <> old.id
                     and m.role = 'owner' and m.status = 'active') then
    raise exception 'A business needs at least one owner. Make someone else an owner first.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger events_guard before insert or update on public.events for each row execute function public._guard_events();
create trigger contracts_guard before update on public.contracts for each row execute function public._guard_contracts();
create trigger invoices_guard before insert or update on public.invoices for each row execute function public._guard_invoices();
create trigger installments_guard before insert or update on public.installments for each row execute function public._guard_installments();
create trigger proposals_guard before insert or update on public.proposals for each row execute function public._guard_proposals();
create trigger change_orders_guard before insert or update on public.change_orders for each row execute function public._guard_change_orders();
create trigger questionnaires_guard before update on public.questionnaires for each row execute function public._guard_questionnaires();
create trigger memberships_last_owner before update or delete on public.memberships for each row execute function public._guard_last_owner();

-- ---- Same business: a row may only point at parents in its OWN business (NFR-2).
-- Example: a task with business_id = A can't use business B's event_id, and a guest can't
-- be "moved" to business B while its event stays in business A.
-- The trigger gets pairs of arguments: (column, parent table), (column, parent table)…
create or replace function public._check_same_business() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_row jsonb := to_jsonb(new);
  v_parent_business uuid;
  i int := 0;
begin
  while i < tg_nargs loop
    if v_row ->> tg_argv[i] is not null then
      execute format('select business_id from public.%I where id = $1', tg_argv[i + 1])
        into v_parent_business using (v_row ->> tg_argv[i])::uuid;
      if v_parent_business is distinct from new.business_id then
        -- "meal_options" → "meal option"
        raise exception 'That % belongs to a different business.', replace(regexp_replace(tg_argv[i + 1], 's$', ''), '_', ' ');
      end if;
    end if;
    i := i + 2;
  end loop;
  return new;
end $$;

-- Attach it to every table, using the foreign keys Postgres already knows about
-- (every FK from a table with business_id to another table with business_id).
do $$
declare
  r record;
begin
  for r in
    select c.conrelid::regclass::text as child,
           string_agg(format('%L, %L', a.attname, p.relname), ', ' order by a.attname) as args
      from pg_constraint c
      join pg_class p on p.oid = c.confrelid
      join pg_namespace n on n.oid = p.relnamespace and n.nspname = 'public'
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f' and array_length(c.conkey, 1) = 1
       and p.relname <> 'businesses'
       and exists (select 1 from pg_attribute x where x.attrelid = c.conrelid and x.attname = 'business_id')
       and exists (select 1 from pg_attribute x where x.attrelid = c.confrelid and x.attname = 'business_id')
     group by c.conrelid
  loop
    execute format('create trigger %I before insert or update on %s for each row execute function public._check_same_business(%s)',
                   replace(r.child, 'public.', '') || '_same_business', r.child, r.args);
  end loop;
end $$;


-- =====================================================================
-- 11. GUEST ACCESS (no login): only through these functions
-- =====================================================================

-- Everything the RSVP page needs for one household, looked up by the invite token.
create or replace function public.guest_household(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'household', jsonb_build_object('id', h.id, 'name', h.name, 'plus_ones_allowed', h.plus_ones_allowed),
    'event',     jsonb_build_object('name', e.name, 'starts_at', e.starts_at, 'time_zone', e.time_zone,
                                    'venue_name', e.venue_name, 'venue_address', e.venue_address),
    'website',   jsonb_build_object('rsvp_cutoff', w.rsvp_cutoff, 'sections', w.sections,
                                    'registry_url', w.registry_url, 'custom_questions', w.custom_questions),
    'meal_options', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name) order by m.sort_order)
                              from meal_options m where m.event_id = e.id), '[]'::jsonb),
    'guests',    coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'first_name', g.first_name,
                                    'rsvp_status', g.rsvp_status, 'meal_option_id', g.meal_option_id) order by g.created_at)
                           from guests g where g.household_id = h.id), '[]'::jsonb))
  from households h
  join events e on e.id = h.event_id
  left join event_websites w on w.event_id = e.id
  where h.invite_token = p_token and e.deleted_at is null;
$$;

-- Save RSVPs for a household. p_replies is a JSON array:
--   [{"guest_id": "...", "rsvp_status": "attending", "meal_option_id": "...", "dietary_notes": "...", "song_request": "..."}]
-- Adding a plus-one is done by the RSVP Edge Function (it checks plus_ones_allowed first).
create or replace function public.guest_submit_rsvp(p_token text, p_replies jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  h households%rowtype;
  e events%rowtype;
  w event_websites%rowtype;
begin
  select * into h from households where invite_token = p_token;
  if found then
    select * into e from events where id = h.event_id;
  end if;
  -- A deleted event looks exactly like a wrong link (guest_household() hides it too).
  if h.id is null or e.deleted_at is not null then
    raise exception 'Invitation not found';
  end if;
  if e.status = 'cancelled' then
    raise exception 'This event has been cancelled, so RSVPs are closed.';
  end if;
  -- PL-5.4: locking the final headcount closes RSVPs. (The planner can still edit guests.)
  if e.headcount_locked_at is not null then
    raise exception 'RSVPs are closed: the final headcount has been sent. Please contact the hosts.';
  end if;

  select * into w from event_websites where event_id = h.event_id;
  -- "Today" in the EVENT's time zone (NFR-5), not the server's (Supabase runs in UTC).
  if w.rsvp_cutoff is not null and (now() at time zone e.time_zone)::date > w.rsvp_cutoff and not w.allow_late_rsvps then
    raise exception 'RSVPs are closed';
  end if;

  -- Check every reply first, so the guest gets a plain-language message (NFR-12).
  if exists (select 1 from jsonb_to_recordset(p_replies) as r(rsvp_status text)
             where r.rsvp_status is null or r.rsvp_status not in ('attending','declined','maybe')) then
    raise exception 'Please choose attending, declined or maybe for each guest.';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_replies) as r(meal_option_id uuid)
             where r.meal_option_id is not null
               and not exists (select 1 from meal_options m where m.id = r.meal_option_id and m.event_id = h.event_id)) then
    raise exception 'Please choose one of the meal options listed.';
  end if;

  update guests g
     set rsvp_status    = r.rsvp_status,
         meal_option_id = r.meal_option_id,
         dietary_notes  = r.dietary_notes,
         song_request   = r.song_request,
         responded_at   = now()
    from jsonb_to_recordset(p_replies)
         as r(guest_id uuid, rsvp_status text, meal_option_id uuid, dietary_notes text, song_request text)
   where g.id = r.guest_id and g.household_id = h.id;   -- can't touch other households

  insert into domain_events (business_id, type, payload)
  values (h.business_id, 'rsvp.updated', jsonb_build_object('household_id', h.id, 'event_id', h.event_id));
end $$;

revoke all on function public.guest_household(text) from public;
revoke all on function public.guest_submit_rsvp(text, jsonb) from public;
grant execute on function public.guest_household(text) to anon, authenticated;
grant execute on function public.guest_submit_rsvp(text, jsonb) to anon, authenticated;
