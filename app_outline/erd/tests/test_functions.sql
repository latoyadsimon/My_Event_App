-- Server function tests: the Rivera wedding booking flow, end to end, plus what must be refused.
-- Users: Latoya (owner), Jo (coordinator), Sam (staff, no money access), Ana (client), Bea (another client).
\set ON_ERROR_STOP 1
\set QUIET 1

\set latoya '''00000000-0000-0000-0000-00000000000a'''
\set sam    '''00000000-0000-0000-0000-00000000000c'''
\set ana    '''00000000-0000-0000-0000-00000000000d'''
\set jo     '''00000000-0000-0000-0000-00000000000e'''
\set bea    '''00000000-0000-0000-0000-00000000000f'''

-- ---------- Setup (as the database owner) ----------
insert into auth.users (id, email) values
  (:latoya, 'latoya@biz.test'), (:sam, 'sam@biz.test'), (:ana, 'ana@client.test'),
  (:jo, 'jo@biz.test'), (:bea, 'bea@client.test');
insert into businesses (id, name, slug, time_zone) values
  ('10000000-0000-0000-0000-00000000000a', 'Bella Events', 'bella', 'America/Chicago');
insert into memberships (business_id, user_id, role, status) values
  ('10000000-0000-0000-0000-00000000000a', :latoya, 'owner', 'active'),
  ('10000000-0000-0000-0000-00000000000a', :jo, 'coordinator', 'active'),
  ('10000000-0000-0000-0000-00000000000a', :sam, 'staff', 'active');
insert into clients (id, business_id, user_id, first_name, last_name, email) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', :ana, 'Ana', 'Rivera', 'ana@client.test'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000a', :bea, 'Bea', 'Lee', 'bea@client.test');

-- Templates: contract text, 30/40/30 schedule, wedding checklist.
insert into templates (business_id, kind, event_type, name, body) values
  ('10000000-0000-0000-0000-00000000000a', 'contract', null, 'Standard contract',
   '{"text": "Agreement between {{business}} and {{client}} for a {{event_type}} on {{event_date}}. Total {{total}}; deposit {{deposit}}."}'),
  ('10000000-0000-0000-0000-00000000000a', 'payment_schedule', null, '30/40/30',
   '{"installments": [{"label": "Deposit 30%", "percent": 30, "due": "at_signing"},
                      {"label": "Payment 2 · 40%", "percent": 40, "days_before": 60},
                      {"label": "Final · 30%", "percent": 30, "days_before": 14}]}'),
  ('10000000-0000-0000-0000-00000000000a', 'checklist', 'wedding', 'Wedding checklist',
   '{"tasks": [{"title": "Send save-the-dates", "days_before": 209},
               {"title": "Fill \"Wedding details\" questionnaire", "days_before": 90, "assignee": "client"},
               {"title": "Order cake", "days_before": 30}]}');

insert into packages (id, business_id, name, base_price) values
  ('70000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Gold', 11000);
insert into leads (id, business_id, client_id, event_type, requested_date, guest_count, stage) values
  ('80000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a',
   'wedding', '2027-06-12', 120, 'proposal_sent');
insert into date_holds (business_id, lead_id, hold_date, expires_at) values
  ('10000000-0000-0000-0000-00000000000a', '80000000-0000-0000-0000-00000000000a', '2027-06-12', now() + interval '7 days');

-- Proposal v1 (sent): Ana will ask for changes.
insert into proposals (id, business_id, lead_id, version, status, package_id, tax_rate, sent_at) values
  ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', '80000000-0000-0000-0000-00000000000a',
   1, 'sent', '70000000-0000-0000-0000-00000000000a', 0.08, now());
-- A draft v3 the client must never see or accept.
insert into proposals (id, business_id, lead_id, version, status, package_id) values
  ('90000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000a', '80000000-0000-0000-0000-00000000000a',
   3, 'draft', '70000000-0000-0000-0000-00000000000a');

-- ---------- 1. Proposal: viewed, changes requested ----------
set role authenticated;
set request.jwt.claim.sub = :ana;
select client_mark_proposal_viewed('90000000-0000-0000-0000-000000000001');
select test.eq('1a v1 viewed', (select status from proposals where version = 1), 'viewed');
select test.expect_error($$select client_request_proposal_changes('90000000-0000-0000-0000-000000000001', '  ')$$, 'tell us what');
select client_request_proposal_changes('90000000-0000-0000-0000-000000000001', 'Can photo magnets be optional?');
select test.eq('1b v1 changes requested', (select status from proposals where version = 1), 'changes_requested');
select test.expect_error($$select client_accept_proposal('90000000-0000-0000-0000-000000000003')$$, 'couldn''t find');

-- The planner sends v2: booth, karaoke and chairs included; magnets and an extra hour optional.
reset role;
insert into proposals (id, business_id, lead_id, version, status, package_id, tax_rate, sent_at) values
  ('90000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', '80000000-0000-0000-0000-00000000000a',
   2, 'sent', '70000000-0000-0000-0000-00000000000a', 0.08, now());
insert into proposal_items (id, business_id, proposal_id, description, quantity, unit_price, is_optional, is_selected) values
  (gen_random_uuid(), '10000000-0000-0000-0000-00000000000a', '90000000-0000-0000-0000-000000000002', 'Photo booth (4 hrs)', 1, 1500, false, true),
  (gen_random_uuid(), '10000000-0000-0000-0000-00000000000a', '90000000-0000-0000-0000-000000000002', 'Karaoke + KJ (3 hrs)', 1, 900, false, true),
  (gen_random_uuid(), '10000000-0000-0000-0000-00000000000a', '90000000-0000-0000-0000-000000000002', 'Chairs', 140, 2.50, false, true),
  ('a0000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '90000000-0000-0000-0000-000000000002', 'Photo magnets', 1, 600, true, true),
  ('a0000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000a', '90000000-0000-0000-0000-000000000002', 'Extra karaoke hour', 1, 250, true, true);

-- ---------- 2. Accept v2 ----------
set role authenticated;
set request.jwt.claim.sub = :bea;
select test.expect_error($$select client_accept_proposal('90000000-0000-0000-0000-000000000002')$$, 'couldn''t find');  -- not Bea's
set request.jwt.claim.sub = :ana;
select test.expect_error($$select client_accept_proposal('90000000-0000-0000-0000-000000000001')$$, 'can''t be accepted');
-- Ana ticks no upgrades → $11,000 + $2,750 = $13,750 + 8% tax = $14,850
select client_accept_proposal('90000000-0000-0000-0000-000000000002', '{}') as contract_id \gset
select test.eq('2a v2 accepted', (select status from proposals where version = 2), 'accepted');
select test.eq('2b total', (select total from proposals where version = 2), 14850.00::numeric);
select test.eq('2c v1 superseded', (select status from proposals where version = 1), 'superseded');
select test.eq('2d unticked upgrades excluded', (select count(*) from proposal_items where is_optional and is_selected), 0::bigint);
select test.eq('2e contract merged', (select body from contracts where id = :'contract_id'),
  'Agreement between Bella Events and Ana Rivera for a wedding on June 12, 2027. Total $14,850.00; deposit $4,455.00.');
select test.expect_error($$select client_accept_proposal('90000000-0000-0000-0000-000000000002')$$, 'can''t be accepted');

-- ---------- 3. Sign → event, invoice, schedule ----------
select test.expect_error(format('select client_sign_contract(%L, %L, false)', :'contract_id', 'Ana Rivera'), 'agree to sign');
select test.expect_error(format('select client_sign_contract(%L, %L, true)', :'contract_id', ' '), 'signature');
select client_sign_contract(:'contract_id', 'Ana Rivera', true, '203.0.113.7') as signed \gset
select (:'signed'::jsonb ->> 'event_id') as event_id, (:'signed'::jsonb ->> 'invoice_id') as invoice_id,
       (:'signed'::jsonb ->> 'deposit_installment_id') as deposit_id \gset
select test.eq('3a deposit amount', (:'signed'::jsonb ->> 'deposit_amount')::numeric, 4455.00::numeric);
select test.expect_error(format('select client_sign_contract(%L, %L, true)', :'contract_id', 'Ana Rivera'), 'already been signed');
reset role;
select test.eq('3b event awaiting countersign', (select status from events where id = :'event_id'), 'awaiting_countersign');
select test.eq('3c event date in its time zone', (select (starts_at at time zone time_zone)::date from events where id = :'event_id'), '2027-06-12'::date);
select test.eq('3d event name', (select name from events where id = :'event_id'), 'Rivera wedding');
select test.eq('3e invoice number', (select number from invoices where id = :'invoice_id'), '1001');
select test.eq('3f schedule amounts', (select string_agg(amount::text, ' / ' order by sort_order) from installments where invoice_id = :'invoice_id'),
               '4455.00 / 5940.00 / 4455.00');
select test.eq('3g schedule dates', (select string_agg(due_date::text, ' / ' order by sort_order) from installments
                                     where invoice_id = :'invoice_id' and sort_order > 1), '2027-04-13 / 2027-05-29');
select test.eq('3h lead won', (select stage from leads where id = '80000000-0000-0000-0000-00000000000a'), 'won');
select test.eq('3i portal still locked', (select portal_unlocked_at from events where id = :'event_id'), null::timestamptz);
select test.eq('3j Ana is the primary host', (select role from event_hosts where event_id = :'event_id'), 'primary');

-- ---------- 4. Deposit: only the webhook records payments; failures counted; duplicates ignored ----------
set role authenticated;
set request.jwt.claim.sub = :ana;
select test.expect_error(format($$select record_payment(%L, %L, 4455, 'card', 'succeeded', 'stripe', 'pi_fake')$$,
                                :'invoice_id', :'deposit_id'), 'permission denied');
reset role;
set role service_role;
select record_payment(:'invoice_id', :'deposit_id', 4455, 'card', 'failed', 'stripe', 'pi_declined_1', 'checkout-a', 'Your card was declined.');
select record_payment(:'invoice_id', :'deposit_id', 4455, 'card', 'failed', 'stripe', 'pi_declined_2', 'checkout-b', 'Your card was declined.');
select test.eq('4a second failure flagged', (select (payload ->> 'failures')::int from domain_events
                                             where type = 'payment.failed' order by id desc limit 1), 2);
select record_payment(:'invoice_id', :'deposit_id', 4455, 'apple_pay', 'succeeded', 'stripe', 'pi_deposit', 'checkout-c');
select record_payment(:'invoice_id', :'deposit_id', 4455, 'apple_pay', 'succeeded', 'stripe', 'pi_deposit', 'checkout-c');  -- webhook retry
reset role;
select test.eq('4b paid once', (select amount_paid from invoices where id = :'invoice_id'), 4455.00::numeric);
select test.eq('4c one succeeded row', (select count(*) from payments where status = 'succeeded'), 1::bigint);
select test.eq('4d invoice partially paid', (select status from invoices where id = :'invoice_id'), 'partially_paid');
select test.eq('4e deposit installment paid', (select status from installments where id = :'deposit_id'), 'paid');
select test.eq('4f portal unlocked', (select portal_unlocked_at is not null from events where id = :'event_id'), true);

-- ---------- 5. Countersign: staff refused; owner books the event ----------
set role authenticated;
set request.jwt.claim.sub = :sam;
select test.expect_error(format('select planner_countersign(%L, %L)', :'contract_id', 'Sam'), 'owner or coordinator');
set request.jwt.claim.sub = :bea;
select test.expect_error(format('select planner_countersign(%L, %L)', :'contract_id', 'Bea'), 'couldn''t find');
set request.jwt.claim.sub = :latoya;
select planner_countersign(:'contract_id', 'LaToya');
select test.expect_error(format('select planner_countersign(%L, %L)', :'contract_id', 'LaToya'), 'already countersigned');
reset role;
select test.eq('5a event booked', (select status from events where id = :'event_id'), 'booked');
select test.eq('5b contract countersigned', (select status from contracts where id = :'contract_id'), 'countersigned');
select test.eq('5c hold converted', (select status from date_holds where lead_id = '80000000-0000-0000-0000-00000000000a'), 'converted');
select test.eq('5d checklist applied', (select count(*) from tasks where event_id = :'event_id'), 3::bigint);
select test.eq('5e relative due date', (select due_date from tasks where title = 'Order cake'), '2027-05-13'::date);
select test.eq('5f client task assigned to Ana', (select assignee_client_id from tasks where assignee_kind = 'client'),
               '20000000-0000-0000-0000-00000000000a'::uuid);

-- ---------- 6. Change order: +1 hr karaoke ----------
insert into change_orders (id, business_id, event_id, invoice_id, description, amount) values
  ('b0000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', :'event_id', :'invoice_id', '+1 hour karaoke', 250);
set role authenticated;
set request.jwt.claim.sub = :bea;
select test.expect_error($$select client_decide_change_order('b0000000-0000-0000-0000-00000000000a', 'approved')$$, 'couldn''t find');
set request.jwt.claim.sub = :ana;
select test.expect_error($$select client_decide_change_order('b0000000-0000-0000-0000-00000000000a', 'maybe')$$, 'approve or decline');
select client_decide_change_order('b0000000-0000-0000-0000-00000000000a', 'approved');
select test.expect_error($$select client_decide_change_order('b0000000-0000-0000-0000-00000000000a', 'declined')$$, 'already approved');
reset role;
select test.eq('6a invoice total', (select total from invoices where id = :'invoice_id'), 15100.00::numeric);
select test.eq('6b added to final payment', (select amount from installments where invoice_id = :'invoice_id' and sort_order = 3), 4705.00::numeric);

-- ---------- 7. Manual payment: staff refused; owner records a check ----------
set role authenticated;
set request.jwt.claim.sub = :sam;
select test.expect_error(format($$select planner_record_manual_payment(%L, null, 5940, 'check')$$, :'invoice_id'), 'access');
set request.jwt.claim.sub = :latoya;
select test.expect_error(format($$select planner_record_manual_payment(%L, null, 5940, 'card')$$, :'invoice_id'), 'cash, check');
select planner_record_manual_payment(:'invoice_id',
  (select id from installments where invoice_id = :'invoice_id' and sort_order = 2), 5940, 'check');
reset role;
select test.eq('7a amount paid', (select amount_paid from invoices where id = :'invoice_id'), 10395.00::numeric);
select test.eq('7b payment 2 paid', (select status from installments where invoice_id = :'invoice_id' and sort_order = 2), 'paid');

-- ---------- 8. The event bus saw every step ----------
select test.eq('8 domain events', (select string_agg(type, ', ' order by id) from domain_events),
  'proposal.viewed, proposal.changes_requested, proposal.accepted, contract.client_signed, payment.failed, payment.failed, '
  'payment.succeeded, contract.countersigned, change_order.decided, payment.succeeded');

\echo 'test_functions.sql: all tests passed'
