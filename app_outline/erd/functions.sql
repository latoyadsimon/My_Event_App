-- =====================================================================
-- Event Planner App · Phase 1 server functions (Supabase Postgres) · DRAFT
-- =====================================================================
-- Load AFTER schema.sql. The front end calls these with supabase.rpc('name', {...}).
--
-- Why functions instead of plain table updates?
--   Booking touches many tables at once (proposal → contract → event → invoice →
--   payment schedule → tasks). Doing it in one function means the business rules
--   live in ONE place, run in ONE transaction (all or nothing), and can't be
--   skipped by a clever client. RLS still protects the tables themselves.
--
-- Conventions
--   • client_*  = called by a signed-in client (checked with is_lead_client / is_event_host)
--   • planner_* = called by a signed-in member of the business
--   • record_payment = called ONLY by the payment webhook (service role)
--   • _name     = internal helper; nobody can call it directly
--   • Errors are plain language (NFR-12), so the app can show them as-is.
--   • Every important step writes a domain_events row (the event bus, SYS-1).
--
-- The booking flow (Rivera wedding):
--   client_mark_proposal_viewed → client_request_proposal_changes (optional)
--   → client_accept_proposal → client_sign_contract → record_payment (deposit)
--   → planner_countersign → client_decide_change_order / planner_record_manual_payment
-- =====================================================================


-- ---------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------

-- Write one event-bus row (SYS-1) and one human-readable activity row.
create or replace function public._emit(p_business uuid, p_type text, p_payload jsonb,
                                        p_entity_type text, p_entity_id uuid, p_action text)
returns void language sql security definer set search_path = public as $$
  insert into domain_events (business_id, type, payload) values (p_business, p_type, p_payload);
  insert into activity_log (business_id, actor_id, entity_type, entity_id, action, details)
  values (p_business, auth.uid(), p_entity_type, p_entity_id, p_action, p_payload);
$$;

-- Recalculate a proposal's totals from its package and selected items.
create or replace function public._recalc_proposal(p_proposal uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_subtotal numeric(10,2);
begin
  select coalesce(pk.base_price, 0)
         + coalesce((select sum(i.quantity * i.unit_price) from proposal_items i
                     where i.proposal_id = p.id and i.is_selected), 0)
         - p.discount
    into v_subtotal
    from proposals p left join packages pk on pk.id = p.package_id
   where p.id = p_proposal;
  if v_subtotal < 0 then
    raise exception 'The discount is larger than the proposal''s price. Please lower the discount.';
  end if;

  update proposals
     set subtotal = v_subtotal,
         tax      = round(v_subtotal * tax_rate, 2),
         total    = v_subtotal + round(v_subtotal * tax_rate, 2)
   where id = p_proposal;
end $$;

-- Apply a succeeded payment: invoice balance, installment status, and unlock the
-- client's portal when the first installment (the deposit) is paid.
-- payments.amount is always positive; a refund (kind = 'refund') takes money OUT.
create or replace function public._apply_payment(p_payment uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  pay payments%rowtype;
  inv invoices%rowtype;
  v_change numeric(10,2);
  v_first_installment uuid;
begin
  select * into pay from payments where id = p_payment;
  v_change := case when pay.kind = 'refund' then -pay.amount else pay.amount end;
  update invoices
     set amount_paid = amount_paid + v_change,
         status = case when amount_paid + v_change >= total then 'paid'
                       when amount_paid + v_change > 0 then 'partially_paid'
                       else 'open' end
   where id = pay.invoice_id
  returning * into inv;

  if pay.installment_id is not null and pay.kind <> 'refund' then
    update installments i
       set status = 'paid'
     where i.id = pay.installment_id
       and (select coalesce(sum(amount), 0) from payments
            where installment_id = i.id and status = 'succeeded' and kind <> 'refund') >= i.amount;

    select id into v_first_installment from installments
     where invoice_id = inv.id order by sort_order limit 1;
    if pay.installment_id = v_first_installment then
      update events set portal_unlocked_at = coalesce(portal_unlocked_at, now()) where id = inv.event_id;
    end if;
  end if;

  perform _emit(pay.business_id, case when pay.kind = 'refund' then 'payment.refunded' else 'payment.succeeded' end,
                jsonb_build_object('payment_id', pay.id, 'invoice_id', inv.id, 'amount', pay.amount,
                                   'invoice_status', inv.status),
                'invoice', inv.id, case when pay.kind = 'refund' then 'refund_issued' else 'payment_received' end);
end $$;


-- ---------------------------------------------------------------------
-- Client: proposal
-- ---------------------------------------------------------------------

-- Ana opens the proposal link. First open moves it from sent → viewed (planner sees "opened").
create or replace function public.client_mark_proposal_viewed(p_proposal_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p proposals%rowtype;
begin
  select * into p from proposals where id = p_proposal_id;
  if not found or p.status = 'draft' or not is_lead_client(p.lead_id) then
    raise exception 'We couldn''t find that proposal.';
  end if;
  if p.status = 'sent' then
    update proposals set status = 'viewed', viewed_at = now() where id = p.id;
    perform _emit(p.business_id, 'proposal.viewed', jsonb_build_object('proposal_id', p.id),
                  'proposal', p.id, 'viewed');
  end if;
end $$;

-- "Request changes" with a comment (CL-2.2). The planner makes a new version.
create or replace function public.client_request_proposal_changes(p_proposal_id uuid, p_comment text) returns void
language plpgsql security definer set search_path = public as $$
declare p proposals%rowtype;
begin
  select * into p from proposals where id = p_proposal_id for update;
  if not found or p.status = 'draft' or not is_lead_client(p.lead_id) then
    raise exception 'We couldn''t find that proposal.';
  end if;
  if p.status not in ('sent','viewed') then
    raise exception 'This proposal can''t be changed right now (it is %).', replace(p.status, '_', ' ');
  end if;
  if coalesce(trim(p_comment), '') = '' then
    raise exception 'Please tell us what you''d like changed.';
  end if;
  update proposals set status = 'changes_requested', change_request = trim(p_comment) where id = p.id;
  perform _emit(p.business_id, 'proposal.changes_requested',
                jsonb_build_object('proposal_id', p.id, 'comment', trim(p_comment)), 'proposal', p.id, 'changes_requested');
end $$;

-- Accept the proposal (CL-2.2, PL-3.3). p_selected_optional_ids = the optional upgrades Ana ticked.
-- Returns the new contract's id, which the app opens next.
create or replace function public.client_accept_proposal(p_proposal_id uuid, p_selected_optional_ids uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  p proposals%rowtype;
  l leads%rowtype;
  cl clients%rowtype;
  b businesses%rowtype;
  t templates%rowtype;
  v_text text;
  v_contract uuid;
begin
  select * into p from proposals where id = p_proposal_id for update;
  if not found or p.status = 'draft' or not is_lead_client(p.lead_id) then
    raise exception 'We couldn''t find that proposal.';
  end if;
  if p.status not in ('sent','viewed') then
    raise exception 'This proposal can''t be accepted (it is %).', replace(p.status, '_', ' ');
  end if;
  if exists (select 1 from proposals where lead_id = p.lead_id and version > p.version and status <> 'draft') then
    raise exception 'There''s a newer version of this proposal. Please review the latest one.';
  end if;

  -- Optional upgrades count only if ticked. (Ids from other proposals are simply ignored.)
  update proposal_items set is_selected = (id = any(coalesce(p_selected_optional_ids, '{}')))
   where proposal_id = p.id and is_optional;
  perform _recalc_proposal(p.id);
  update proposals set status = 'accepted', accepted_at = now() where id = p.id returning * into p;
  update proposals set status = 'superseded'
   where lead_id = p.lead_id and id <> p.id and status in ('sent','viewed','changes_requested');

  -- Build the contract from the business's contract template (merge fields filled in).
  select * into l from leads where id = p.lead_id;
  select * into cl from clients where id = l.client_id;
  select * into b from businesses where id = p.business_id;
  select * into t from templates
   where business_id = p.business_id and kind = 'contract' and is_active
     and (event_type = l.event_type or event_type is null)
   order by (event_type is null), created_at desc limit 1;

  v_text := coalesce(t.body ->> 'text',
    'This agreement is between {{business}} and {{client}} for a {{event_type}} on {{event_date}}. '
    'Total {{total}}; deposit {{deposit}}.');
  v_text := replace(v_text, '{{business}}', b.name);
  v_text := replace(v_text, '{{client}}', trim(cl.first_name || ' ' || coalesce(cl.last_name, '')));
  v_text := replace(v_text, '{{event_type}}', replace(l.event_type, '_', ' '));
  v_text := replace(v_text, '{{event_date}}', coalesce(to_char(l.requested_date, 'FMMonth FMDD, YYYY'), 'a date to be confirmed'));
  v_text := replace(v_text, '{{total}}', to_char(p.total, 'FM$999,999,990.00'));
  v_text := replace(v_text, '{{deposit}}', to_char(round(p.total * p.deposit_percent / 100, 2), 'FM$999,999,990.00'));

  insert into contracts (business_id, proposal_id, template_id, body, status)
  values (p.business_id, p.id, t.id, v_text, 'sent')
  returning id into v_contract;

  perform _emit(p.business_id, 'proposal.accepted',
                jsonb_build_object('proposal_id', p.id, 'contract_id', v_contract, 'total', p.total),
                'proposal', p.id, 'accepted');
  return v_contract;
end $$;


-- ---------------------------------------------------------------------
-- Client: sign the contract → event, invoice and payment schedule appear
-- ---------------------------------------------------------------------
-- Decision (walkthrough): Ana pays the deposit right after signing, so the event,
-- invoice and schedule are created HERE, not at countersign. The event starts as
-- awaiting_countersign. Returns what the Pay screen needs.
create or replace function public.client_sign_contract(p_contract_id uuid, p_signature text, p_consent boolean,
                                                       p_ip inet default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c contracts%rowtype;
  p proposals%rowtype;
  l leads%rowtype;
  cl clients%rowtype;
  b businesses%rowtype;
  v_signer uuid;
  v_event uuid;
  v_invoice uuid;
  v_number int;
  v_schedule jsonb;
  v_item jsonb;
  v_n int;
  v_i int := 0;
  v_amount numeric(10,2);
  v_allocated numeric(10,2) := 0;
  v_due date;
  v_deposit_id uuid;
  v_deposit_amount numeric(10,2);
  v_installment uuid;
begin
  select * into c from contracts where id = p_contract_id for update;
  if not found then
    raise exception 'We couldn''t find that contract.';
  end if;
  select * into p from proposals where id = c.proposal_id;
  if not is_lead_client(p.lead_id) then
    raise exception 'We couldn''t find that contract.';
  end if;
  if c.status <> 'sent' then
    raise exception 'This contract has already been signed.';
  end if;
  if not coalesce(p_consent, false) then
    raise exception 'Please agree to sign electronically first.';
  end if;
  if coalesce(trim(p_signature), '') = '' then
    raise exception 'Please type or draw your signature.';
  end if;

  select * into l from leads where id = p.lead_id;
  select * into cl from clients where id = l.client_id;
  select * into b from businesses where id = c.business_id for update;  -- lock: invoice numbers stay unique
  if l.requested_date is null then
    raise exception 'Your event date is missing. Please message % so they can add it.', b.name;
  end if;
  if l.requested_date < (now() at time zone b.time_zone)::date then
    raise exception 'Your event date (%) has already passed. Please message % to update it.',
      to_char(l.requested_date, 'FMMonth FMDD, YYYY'), b.name;
  end if;
  select id into v_signer from clients where business_id = c.business_id and user_id = auth.uid();

  -- 1. The event. Start time defaults to noon in the business time zone; the planner sets the real time.
  insert into events (business_id, client_id, lead_id, name, event_type, status, starts_at, time_zone, guest_count_estimate)
  values (c.business_id, cl.id, l.id,
          coalesce(cl.last_name, cl.first_name) || ' ' || replace(l.event_type, '_', ' '),
          l.event_type, 'awaiting_countersign',
          (l.requested_date + time '12:00') at time zone b.time_zone, b.time_zone, l.guest_count)
  returning id into v_event;
  insert into event_hosts (business_id, event_id, client_id, role, access)
  values (c.business_id, v_event, cl.id, 'primary', 'full');

  -- 2. The invoice (next number for this business, starting at 1001).
  select coalesce(max(number::int), 1000) + 1 into v_number
    from invoices where business_id = c.business_id and number ~ '^\d+$';
  insert into invoices (business_id, event_id, contract_id, number, total)
  values (c.business_id, v_event, c.id, v_number::text, p.total)
  returning id into v_invoice;

  -- 3. The payment schedule, from the business's template or a 30/40/30 default.
  --    Template body: {"installments": [{"label": "Deposit 30%", "percent": 30, "due": "at_signing"},
  --                                     {"label": "Payment 2 · 40%", "percent": 40, "days_before": 60}, ...]}
  select body -> 'installments' into v_schedule from templates
   where business_id = c.business_id and kind = 'payment_schedule' and is_active
     and (event_type = l.event_type or event_type is null)
   order by (event_type is null), created_at desc limit 1;
  -- Default: deposit, 40% sixty days before, the rest two weeks before. A deposit of 60% or
  -- more leaves no room for the middle payment, so then it's just deposit + final payment.
  if v_schedule is null then
    v_schedule := jsonb_build_array(jsonb_build_object('label', 'Deposit', 'percent', p.deposit_percent, 'due', 'at_signing'));
    if p.deposit_percent < 60 then
      v_schedule := v_schedule || jsonb_build_object('label', 'Payment 2', 'percent', 40, 'days_before', 60);
    end if;
    if p.deposit_percent < 100 then
      v_schedule := v_schedule || jsonb_build_object('label', 'Final payment',
                      'percent', 100 - p.deposit_percent - case when p.deposit_percent < 60 then 40 else 0 end,
                      'days_before', 14);
    end if;
  end if;
  -- coalesce: an EMPTY schedule sums to NULL, which must fail too.
  if jsonb_typeof(v_schedule) <> 'array'
     or coalesce((select sum((x ->> 'percent')::numeric) from jsonb_array_elements(v_schedule) x), 0) <> 100
     or exists (select 1 from jsonb_array_elements(v_schedule) x where (x ->> 'percent')::numeric < 0) then
    raise exception 'The payment schedule template doesn''t add up to 100%%. Please ask % to fix it.', b.name;
  end if;

  v_n := jsonb_array_length(v_schedule);
  for v_item in select * from jsonb_array_elements(v_schedule) loop
    v_i := v_i + 1;
    -- the last installment takes any rounding remainder, so the schedule always equals the total
    v_amount := case when v_i = v_n then p.total - v_allocated
                     else round(p.total * (v_item ->> 'percent')::numeric / 100, 2) end;
    v_allocated := v_allocated + v_amount;
    v_due := case when v_item ->> 'due' = 'at_signing' then current_date
                  else greatest(current_date, l.requested_date - (v_item ->> 'days_before')::int) end;
    -- A $0 installment (free event, 0% deposit) can't be paid (payments must be > 0), so it's waived.
    insert into installments (business_id, invoice_id, label, amount, due_rule, due_date, sort_order, status)
    values (c.business_id, v_invoice, v_item ->> 'label', v_amount,
            coalesce(v_item ->> 'due', (v_item ->> 'days_before') || '_days_before'), v_due, v_i,
            case when v_amount = 0 then 'waived' else 'due' end)
    returning id into v_installment;
    if v_i = 1 then
      v_deposit_id := v_installment;
      v_deposit_amount := v_amount;
    end if;
  end loop;

  -- Nothing to pay up front (a $0 deposit): the portal unlocks right away, and a $0 invoice is paid.
  if v_deposit_amount = 0 then
    update events set portal_unlocked_at = now() where id = v_event;
  end if;
  if p.total = 0 then
    update invoices set status = 'paid' where id = v_invoice;
  end if;

  -- 4. Record the signature; the lead is won.
  update contracts
     set status = 'client_signed', event_id = v_event, client_signer_id = coalesce(v_signer, cl.id),
         client_signature = trim(p_signature), client_signed_at = now(), client_signed_ip = p_ip
   where id = c.id;
  update leads set stage = 'won' where id = l.id;

  perform _emit(c.business_id, 'contract.client_signed',
                jsonb_build_object('contract_id', c.id, 'event_id', v_event, 'invoice_id', v_invoice),
                'contract', c.id, 'client_signed');

  return jsonb_build_object('event_id', v_event, 'invoice_id', v_invoice,
                            'deposit_installment_id', v_deposit_id, 'deposit_amount', v_deposit_amount);
end $$;


-- ---------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------

-- Called ONLY by the Stripe/Square webhook Edge Function (service role), never by the browser:
-- payment status comes from the processor (SYS-3). Safe to call twice for the same
-- processor_payment_id: webhooks can arrive late or more than once.
create or replace function public.record_payment(
  p_invoice_id uuid, p_installment_id uuid, p_amount numeric, p_method text, p_status text,
  p_processor text, p_processor_payment_id text, p_idempotency_key text default null,
  p_failure_reason text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  inv invoices%rowtype;
  existing payments%rowtype;
  v_payment uuid;
  v_failures int;
begin
  if p_status not in ('succeeded','failed') then
    raise exception 'Unknown payment status: %', p_status;
  end if;
  -- "for update" locks the invoice row, so two copies of the same webhook arriving at the same
  -- moment take turns: the second one waits here, then finds the payment the first one saved.
  select * into inv from invoices where id = p_invoice_id for update;
  if not found then
    raise exception 'Invoice % not found', p_invoice_id;
  end if;
  if p_installment_id is not null
     and not exists (select 1 from installments where id = p_installment_id and invoice_id = inv.id) then
    raise exception 'Installment % is not on invoice %', p_installment_id, inv.id;
  end if;

  select * into existing from payments where processor_payment_id = p_processor_payment_id for update;
  if found then
    if existing.status = 'succeeded' or existing.status = p_status then
      return existing.id;  -- duplicate webhook: already handled, change nothing
    end if;
    update payments
       set status = p_status, failure_reason = p_failure_reason,
           paid_at = case when p_status = 'succeeded' then now() end
     where id = existing.id;
    v_payment := existing.id;
  else
    insert into payments (business_id, invoice_id, installment_id, kind, method, amount, status, processor,
                          processor_payment_id, idempotency_key, failure_reason, paid_at)
    values (inv.business_id, inv.id, p_installment_id, 'charge', p_method, p_amount, p_status, p_processor,
            p_processor_payment_id, p_idempotency_key, p_failure_reason,
            case when p_status = 'succeeded' then now() end)
    returning id into v_payment;
  end if;

  if p_status = 'succeeded' and inv.status = 'void' then
    -- The money was really taken, so keep the record, but don't count it toward a void invoice:
    -- flag it so the planner refunds it.
    perform _emit(inv.business_id, 'payment.needs_refund',
                  jsonb_build_object('payment_id', v_payment, 'invoice_id', inv.id, 'amount', p_amount,
                                     'reason', 'invoice is void'),
                  'invoice', inv.id, 'payment_on_void_invoice');
  elsif p_status = 'succeeded' then
    perform _apply_payment(v_payment);
  else
    -- The planner is alerted after 2 failures in a day (CL-2.4); the handler reads "failures".
    select count(*) into v_failures from payments
     where invoice_id = inv.id and status = 'failed' and created_at > now() - interval '1 day';
    perform _emit(inv.business_id, 'payment.failed',
                  jsonb_build_object('payment_id', v_payment, 'invoice_id', inv.id,
                                     'reason', p_failure_reason, 'failures', v_failures),
                  'invoice', inv.id, 'payment_failed');
  end if;
  return v_payment;
end $$;

-- Planner records cash, check, Venmo, Zelle or Cash App (PL-3.5). Needs the see_budgets permission.
create or replace function public.planner_record_manual_payment(p_invoice_id uuid, p_installment_id uuid,
                                                                p_amount numeric, p_method text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  inv invoices%rowtype;
  v_payment uuid;
begin
  select * into inv from invoices where id = p_invoice_id for update;
  if not found or not has_permission(inv.business_id, 'see_budgets') then
    raise exception 'You don''t have access to this invoice.';
  end if;
  if p_method not in ('cash','check','venmo','zelle','cash_app') then
    raise exception 'Manual payments are cash, check, Venmo, Zelle or Cash App.';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'Please enter an amount greater than zero.';
  end if;
  if p_installment_id is not null
     and not exists (select 1 from installments where id = p_installment_id and invoice_id = inv.id) then
    raise exception 'That payment isn''t on this invoice.';
  end if;
  if inv.status = 'void' then
    raise exception 'This invoice is void, so it can''t take payments.';
  end if;
  if p_amount > inv.total - inv.amount_paid then
    raise exception 'That''s more than the % still owed on this invoice.',
      to_char(inv.total - inv.amount_paid, 'FM$999,999,990.00');
  end if;
  insert into payments (business_id, invoice_id, installment_id, kind, method, amount, status, recorded_by, paid_at)
  values (inv.business_id, inv.id, p_installment_id, 'manual', p_method, p_amount, 'succeeded', auth.uid(), now())
  returning id into v_payment;
  perform _apply_payment(v_payment);
  return v_payment;
end $$;


-- ---------------------------------------------------------------------
-- Planner: countersign → Booked
-- ---------------------------------------------------------------------
-- Owners and coordinators can countersign (staff can't), once the deposit is paid (journeys
-- step 4 → 5: "signed + paid deposit, countersign now"). Applies the checklist template:
-- {"tasks": [{"title": "Order cake", "days_before": 30, "assignee": "planner"}, ...]}
create or replace function public.planner_countersign(p_contract_id uuid, p_signature text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  c contracts%rowtype;
  e events%rowtype;
  v_event_date date;
  v_tasks jsonb;
  v_task jsonb;
  v_order int := 0;
begin
  select * into c from contracts where id = p_contract_id for update;
  if not found or not is_member(c.business_id) then
    raise exception 'We couldn''t find that contract.';
  end if;
  if not is_manager(c.business_id) then
    raise exception 'Only an owner or coordinator can countersign contracts.';
  end if;
  if c.status = 'sent' then
    raise exception 'The client hasn''t signed yet.';
  elsif c.status <> 'client_signed' then
    raise exception 'This contract is already %.', replace(c.status, '_', ' ');
  end if;
  -- The deposit is the first installment; "waived" covers a $0 deposit.
  if exists (select 1 from invoices i
               join lateral (select s.status from installments s where s.invoice_id = i.id
                             order by s.sort_order limit 1) first_one on true
              where i.contract_id = c.id and first_one.status not in ('paid','waived')) then
    raise exception 'The client hasn''t paid the deposit yet. You can countersign once it''s paid.';
  end if;
  if coalesce(trim(p_signature), '') = '' then
    raise exception 'Please type or draw your signature.';
  end if;

  update contracts set status = 'countersigned', planner_signer_id = auth.uid(), planner_signed_at = now()
   where id = c.id;
  update events set status = 'booked' where id = c.event_id returning * into e;
  update date_holds set status = 'converted' where lead_id = e.lead_id and status = 'active';

  -- Checklist tasks with due dates relative to the event date (PL-4.3).
  v_event_date := (e.starts_at at time zone e.time_zone)::date;
  select body -> 'tasks' into v_tasks from templates
   where business_id = c.business_id and kind = 'checklist' and is_active
     and (event_type = e.event_type or event_type is null)
   order by (event_type is null), created_at desc limit 1;
  for v_task in select * from jsonb_array_elements(coalesce(v_tasks, '[]'::jsonb)) loop
    v_order := v_order + 1;
    insert into tasks (business_id, event_id, title, assignee_kind, assignee_client_id,
                       due_offset_days, due_date, sort_order)
    values (c.business_id, e.id, v_task ->> 'title', coalesce(v_task ->> 'assignee', 'planner'),
            case when v_task ->> 'assignee' = 'client' then e.client_id end,
            -(v_task ->> 'days_before')::int, v_event_date - (v_task ->> 'days_before')::int, v_order);
  end loop;

  perform _emit(c.business_id, 'contract.countersigned',
                jsonb_build_object('contract_id', c.id, 'event_id', e.id, 'tasks_created', v_order),
                'event', e.id, 'booked');
  return e.id;
end $$;


-- ---------------------------------------------------------------------
-- Client: approve or decline a change order (CL-4.3)
-- ---------------------------------------------------------------------
-- Approving adds the amount to the invoice and to the last unpaid installment. A credit (negative
-- amount) comes off the unpaid installments, last one first, and can't exceed what's still owed.
-- Only hosts with full access (not "limited" co-hosts) can make money decisions.
create or replace function public.client_decide_change_order(p_change_order_id uuid, p_decision text)
returns void language plpgsql security definer set search_path = public as $$
declare
  co change_orders%rowtype;
  v_client uuid;
  v_installment uuid;
  v_credit_left numeric(10,2);
  v_unpaid numeric(10,2);
  s installments%rowtype;
begin
  select * into co from change_orders where id = p_change_order_id for update;
  if found then
    select h.client_id into v_client
      from event_hosts h join clients c on c.id = h.client_id
     where h.event_id = co.event_id and c.user_id = auth.uid() and h.access = 'full';
  end if;
  if not found or v_client is null then
    raise exception 'We couldn''t find that change order.';
  end if;
  if co.status <> 'pending' then
    raise exception 'This change order was already %.', co.status;
  end if;
  if p_decision not in ('approved','declined') then
    raise exception 'Please choose Approve or Decline.';
  end if;
  if p_decision = 'approved' and co.amount < 0 then
    select coalesce(sum(amount), 0) into v_unpaid from installments
     where invoice_id = co.invoice_id and status in ('due','overdue');
    if -co.amount > v_unpaid then
      raise exception 'This credit (%) is more than the % still owed. Please ask your planner to refund the difference instead.',
        to_char(-co.amount, 'FM$999,999,990.00'), to_char(v_unpaid, 'FM$999,999,990.00');
    end if;
  end if;

  update change_orders set status = p_decision, decided_by = v_client, decided_at = now() where id = co.id;

  if p_decision = 'approved' then
    update invoices
       set total = total + co.amount,
           status = case when amount_paid >= total + co.amount then 'paid'
                         when amount_paid > 0 then 'partially_paid'
                         else 'open' end
     where id = co.invoice_id;
    if co.amount < 0 then
      -- Take the credit off unpaid installments, last first. One that reaches $0 is waived.
      v_credit_left := -co.amount;
      for s in select * from installments where invoice_id = co.invoice_id and status in ('due','overdue')
               order by sort_order desc loop
        exit when v_credit_left = 0;
        update installments
           set amount = amount - least(v_credit_left, s.amount),
               status = case when amount - least(v_credit_left, s.amount) = 0 then 'waived' else status end
         where id = s.id;
        v_credit_left := v_credit_left - least(v_credit_left, s.amount);
      end loop;
    else
      -- An extra charge goes on the last unpaid installment, or a new one if everything is paid.
      select id into v_installment from installments
       where invoice_id = co.invoice_id and status in ('due','overdue')
       order by sort_order desc limit 1;
      if v_installment is not null then
        update installments set amount = amount + co.amount where id = v_installment;
      else
        insert into installments (business_id, invoice_id, label, amount, due_rule, due_date, sort_order)
        values (co.business_id, co.invoice_id, co.description, co.amount, 'change_order', current_date,
                (select coalesce(max(sort_order), 0) + 1 from installments where invoice_id = co.invoice_id));
      end if;
    end if;
  end if;

  perform _emit(co.business_id, 'change_order.decided',
                jsonb_build_object('change_order_id', co.id, 'decision', p_decision, 'amount', co.amount),
                'event', co.event_id, 'change_order_' || p_decision);
end $$;


-- ---------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------
-- Postgres lets everyone run new functions by default, so start from "nobody".
revoke all on function public._emit(uuid, text, jsonb, text, uuid, text) from public, anon, authenticated;
revoke all on function public._recalc_proposal(uuid) from public, anon, authenticated;
revoke all on function public._apply_payment(uuid) from public, anon, authenticated;
revoke all on function public.client_mark_proposal_viewed(uuid) from public, anon;
revoke all on function public.client_request_proposal_changes(uuid, text) from public, anon;
revoke all on function public.client_accept_proposal(uuid, uuid[]) from public, anon;
revoke all on function public.client_sign_contract(uuid, text, boolean, inet) from public, anon;
revoke all on function public.client_decide_change_order(uuid, text) from public, anon;
revoke all on function public.planner_countersign(uuid, text) from public, anon;
revoke all on function public.planner_record_manual_payment(uuid, uuid, numeric, text) from public, anon;
revoke all on function public.record_payment(uuid, uuid, numeric, text, text, text, text, text, text) from public, anon, authenticated;

-- Signed-in users (each function checks WHO they are inside).
grant execute on function public.client_mark_proposal_viewed(uuid) to authenticated;
grant execute on function public.client_request_proposal_changes(uuid, text) to authenticated;
grant execute on function public.client_accept_proposal(uuid, uuid[]) to authenticated;
grant execute on function public.client_sign_contract(uuid, text, boolean, inet) to authenticated;
grant execute on function public.client_decide_change_order(uuid, text) to authenticated;
grant execute on function public.planner_countersign(uuid, text) to authenticated;
grant execute on function public.planner_record_manual_payment(uuid, uuid, numeric, text) to authenticated;
-- The payment webhook only.
grant execute on function public.record_payment(uuid, uuid, numeric, text, text, text, text, text, text) to service_role;
