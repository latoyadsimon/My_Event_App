-- QA audit probes for schema.sql + functions.sql.
-- Each probe asserts the CORRECT behavior (per user_stories.md / product_spec.md / walkthrough decisions).
-- FAIL = the current code does something else. C-xx probes are controls expected to PASS.
\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null

\set biz_a '''10000000-0000-0000-0000-00000000000a'''
\set biz_b '''10000000-0000-0000-0000-00000000000b'''
\set latoya '''00000000-0000-0000-0000-00000000000a'''
\set bowner '''00000000-0000-0000-0000-00000000000b'''
\set sam    '''00000000-0000-0000-0000-00000000000c'''
\set ana    '''00000000-0000-0000-0000-00000000000d'''
\set marco  '''00000000-0000-0000-0000-000000000011'''
\set zed    '''00000000-0000-0000-0000-000000000012'''

-- =================== Setup (database owner) ===================
insert into auth.users (id, email) values (:latoya, 'latoya@a.test'), (:bowner, 'owner@b.test'), (:sam, 'sam@a.test'),
  (:ana, 'ana@client.test'), (:marco, 'marco@client.test'), (:zed, 'zed@client.test');
insert into businesses (id, name, slug) values (:biz_a, 'Bella Events', 'bella'), (:biz_b, 'Other Co', 'other');
insert into memberships (business_id, user_id, role, status) values
  (:biz_a, :latoya, 'owner', 'active'), (:biz_b, :bowner, 'owner', 'active'), (:biz_a, :sam, 'staff', 'active');
insert into clients (id, business_id, user_id, first_name, last_name, email) values
  ('20000000-0000-0000-0000-00000000000a', :biz_a, :ana, 'Ana', 'Rivera', 'ana@client.test'),
  ('20000000-0000-0000-0000-00000000000c', :biz_a, :marco, 'Marco', 'Rivera', 'marco@client.test'),
  ('20000000-0000-0000-0000-00000000000d', :biz_b, :zed, 'Zed', 'Ng', 'zed@client.test');
insert into packages (id, business_id, name, base_price) values
  ('70000000-0000-0000-0000-00000000000a', :biz_a, 'Gold', 11000),
  ('70000000-0000-0000-0000-00000000000b', :biz_a, 'Free community', 0),
  ('70000000-0000-0000-0000-00000000000c', :biz_b, 'B Gold', 5000),
  ('70000000-0000-0000-0000-00000000000f', :biz_a, 'Fuzz', 1);
insert into templates (business_id, kind, event_type, name, body) values
  (:biz_a, 'contract', null, 'Contract', '{"text": "{{business}} / {{client}} / {{total}}"}'),
  (:biz_a, 'payment_schedule', null, '30/40/30', '{"installments": [{"label": "Deposit", "percent": 30, "due": "at_signing"},
     {"label": "P2", "percent": 40, "days_before": 60}, {"label": "Final", "percent": 30, "days_before": 14}]}'),
  (:biz_a, 'payment_schedule', 'corporate', 'thirds', '{"installments": [{"label": "Deposit", "percent": 33.33, "due": "at_signing"},
     {"label": "P2", "percent": 33.33, "days_before": 60}, {"label": "Final", "percent": 33.34, "days_before": 14}]}'),
  (:biz_a, 'payment_schedule', 'reunion', 'broken (empty)', '{"installments": []}'),
  (:biz_a, 'checklist', 'wedding', 'Wedding', '{"tasks": [{"title": "Order cake", "days_before": 30}]}');

-- Main Rivera booking: accept → sign → deposit → countersign.
select qa.make_proposal(:biz_a, '20000000-0000-0000-0000-00000000000a', 'wedding', '2027-06-12', '70000000-0000-0000-0000-00000000000a') as prop1 \gset
insert into proposal_items (business_id, proposal_id, description, quantity, unit_price) values
  (:biz_a, :'prop1', 'Photo booth', 1, 1500), (:biz_a, :'prop1', 'Karaoke', 1, 900), (:biz_a, :'prop1', 'Chairs', 140, 2.5);
-- Second booking for Ana: signed, deposit NOT paid, not countersigned.
select qa.make_proposal(:biz_a, '20000000-0000-0000-0000-00000000000a', 'birthday', '2027-09-04', '70000000-0000-0000-0000-00000000000a') as prop2 \gset

set role authenticated;
set request.jwt.claim.sub = :ana;
select client_accept_proposal(:'prop1') as contract1 \gset
select client_sign_contract(:'contract1', 'Ana Rivera', true) as s1 \gset
select client_accept_proposal(:'prop2') as contract2 \gset
select client_sign_contract(:'contract2', 'Ana Rivera', true) as s2 \gset
reset role;
select :'s1'::jsonb ->> 'event_id' as event1, :'s1'::jsonb ->> 'invoice_id' as invoice1, :'s1'::jsonb ->> 'deposit_installment_id' as deposit1,
       :'s2'::jsonb ->> 'event_id' as event2, :'s2'::jsonb ->> 'invoice_id' as invoice2 \gset
set role service_role;
select record_payment(:'invoice1', :'deposit1', 4455, 'card', 'succeeded', 'stripe', 'pi_dep_1', 'ck-1');
reset role;
set role authenticated;
set request.jwt.claim.sub = :latoya;
select planner_countersign(:'contract1', 'LaToya');
reset role;

-- Co-host Marco with LIMITED access (product_spec: limited = no money).
insert into event_hosts (business_id, event_id, client_id, role, access)
  values (:biz_a, :'event1', '20000000-0000-0000-0000-00000000000c', 'co_host', 'limited');
-- Business B's own event.
insert into events (id, business_id, client_id, name, event_type, starts_at, time_zone)
  values ('30000000-0000-0000-0000-0000000000bb', :biz_b, '20000000-0000-0000-0000-00000000000d', 'Ng party', 'birthday', '2027-08-01 18:00-05', 'America/Chicago');
insert into meal_options (id, business_id, event_id, name) values
  ('c0000000-0000-0000-0000-00000000000a', :biz_a, :'event1', 'Chicken'),
  ('c0000000-0000-0000-0000-00000000000b', :biz_b, '30000000-0000-0000-0000-0000000000bb', 'B-only fish');
-- Planner content on event1.
insert into files (id, business_id, event_id, name, visibility, uploaded_by) values
  ('d0000000-0000-0000-0000-00000000000a', :biz_a, :'event1', 'Menu.pdf', 'shared', :latoya);
insert into comments (id, business_id, file_id, author_id, body) values
  ('e0000000-0000-0000-0000-00000000000a', :biz_a, 'd0000000-0000-0000-0000-00000000000a', :latoya, 'Planner note');
insert into questionnaires (id, business_id, event_id, title) values
  ('f0000000-0000-0000-0000-00000000000a', :biz_a, :'event1', 'Wedding details');
insert into event_websites (business_id, event_id, slug, rsvp_cutoff) values (:biz_a, :'event1', 'rivera', '2099-05-01');
insert into households (id, business_id, event_id, name, invite_token) values
  ('50000000-0000-0000-0000-00000000000a', :biz_a, :'event1', 'Rivera family', 'tok-h1'),
  ('50000000-0000-0000-0000-00000000000b', :biz_a, :'event1', 'Chen family', 'tok-h2');
insert into guests (id, business_id, event_id, household_id, first_name) values
  ('60000000-0000-0000-0000-00000000000a', :biz_a, :'event1', '50000000-0000-0000-0000-00000000000a', 'Lucia'),
  ('60000000-0000-0000-0000-00000000000b', :biz_a, :'event1', '50000000-0000-0000-0000-00000000000b', 'Wei');
insert into change_orders (id, business_id, event_id, invoice_id, description, amount) values
  ('b0000000-0000-0000-0000-00000000000a', :biz_a, :'event1', :'invoice1', '+1 hr karaoke', 250),
  ('b0000000-0000-0000-0000-00000000000b', :biz_a, :'event1', :'invoice1', 'Goodwill credit', -5000);

-- Refund probe needs a helper (runs as owner; probe rolls it back).
create function qa.refund_lowers_balance(p_invoice uuid) returns boolean language plpgsql as $$
declare before numeric; after numeric; p uuid;
begin
  select amount_paid into before from invoices where id = p_invoice;
  insert into payments (business_id, invoice_id, kind, method, amount, status, paid_at)
  select business_id, id, 'refund', 'card', 100, 'succeeded', now() from invoices where id = p_invoice returning id into p;
  perform _apply_payment(p);
  select amount_paid into after from invoices where id = p_invoice;
  return after < before;
end $$;

-- Calls a void function, THEN reads the result in a later statement (a single SQL statement
-- can't see its own writes, and "void IS NULL" is false, so probes need these wrappers).
create function qa.submit_then_status(p_token text, p_replies jsonb, p_guest uuid) returns text
language plpgsql security definer as $$
begin
  perform guest_submit_rsvp(p_token, p_replies);
  return (select rsvp_status from guests where id = p_guest);
end $$;
create function qa.sign_then_schedule_ok(p_contract uuid, p_signature text) returns boolean language plpgsql as $$
declare v jsonb;
begin
  v := client_sign_contract(p_contract, p_signature, true);
  return (select sum(amount) = (select total from invoices where id = (v ->> 'invoice_id')::uuid) and min(amount) >= 0
            from installments where invoice_id = (v ->> 'invoice_id')::uuid);
end $$;
create function qa.void_payment_flagged(p_invoice uuid) returns boolean language plpgsql as $$
begin
  perform record_payment(p_invoice, null, 100, 'card', 'succeeded', 'stripe', 'pi_void_1');
  return (select amount_paid = 0 from invoices where id = p_invoice)
     and exists (select 1 from payments where processor_payment_id = 'pi_void_1')
     and exists (select 1 from domain_events where type = 'payment.needs_refund');
end $$;
create function qa.approve_then_no_negatives(p_change_order uuid) returns boolean language plpgsql as $$
begin
  perform client_decide_change_order(p_change_order, 'approved');
  return not exists (select 1 from installments where amount < 0);
end $$;

-- A manually created event (no lead, no contract) with a guest list, for the hard-delete probe.
insert into events (id, business_id, client_id, name, event_type, starts_at, time_zone)
  values ('30000000-0000-0000-0000-0000000000ee', :biz_a, '20000000-0000-0000-0000-00000000000a', 'Manual event', 'other', '2027-10-01 18:00-05', 'America/Chicago');
insert into households (business_id, event_id, name) values (:biz_a, '30000000-0000-0000-0000-0000000000ee', 'Manual household');

-- =================== Probes ===================
-- ---- Staff (Sam: staff role, NO see_budgets) ----
set role authenticated;
set request.jwt.claim.sub = :sam;
select qa.expect_true('C-01', 'Control: staff without see_budgets cannot read invoices', 'select count(*) = 0 from invoices');
select qa.expect_true('T-01', 'Staff without see_budgets cannot read prices (proposals, proposal_items, contracts)',
  'select not exists (select 1 from proposals) and not exists (select 1 from proposal_items) and not exists (select 1 from contracts)');
select qa.expect_refused('T-02', 'Staff cannot mark a contract countersigned by updating the table (planner_countersign refuses staff)',
  format($$with u as (update contracts set status = 'countersigned', planner_signed_at = now() where id = %L returning 1) select count(*) = 0 from u$$, :'contract2'));
select qa.expect_refused('T-03', 'Staff cannot unlock a client portal without a paid deposit',
  format($$with u as (update events set portal_unlocked_at = now() where id = %L returning 1) select count(*) = 0 from u$$, :'event2'));
select qa.expect_refused('T-04', 'Staff cannot hard-delete an event (cascades to its guest list; bypasses 30-day soft delete, NFR-13)',
  $$with d as (delete from events where id = '30000000-0000-0000-0000-0000000000ee' returning 1) select count(*) = 0 from d$$);

-- ---- Owner (LaToya) ----
set request.jwt.claim.sub = :latoya;
select qa.expect_error('T-05', 'A member cannot attach a row to ANOTHER business''s event (cross-tenant reference)',
  format($$insert into tasks (business_id, event_id, title) values (%L, '30000000-0000-0000-0000-0000000000bb', 'x')$$, :biz_a));
select qa.expect_error('T-06', 'Countersign is refused while the deposit is unpaid (journeys: deposit paid → "countersign now")',
  format($$select planner_countersign(%L, 'LaToya')$$, :'contract2'));
select qa.expect_error('T-07', 'A manual payment larger than the remaining balance is refused',
  format($$select planner_record_manual_payment(%L, null, 999999, 'cash')$$, :'invoice1'));
select qa.expect_refused('T-08', 'invoices.amount_paid cannot be edited directly (should stay in sync with payments)',
  format($$with u as (update invoices set amount_paid = total where id = %L returning 1) select count(*) = 0 from u$$, :'invoice1'));
select qa.expect_refused('T-09', 'The only owner cannot demote themselves (business left with no owner)',
  format($$with u as (update memberships set role = 'staff' where user_id = %L returning 1) select count(*) = 0 from u$$, :latoya));

-- ---- Business B owner ----
set request.jwt.claim.sub = :bowner;
select qa.expect_true('C-02', 'Control: business B owner cannot read business A leads', format('select count(*) = 0 from leads where business_id = %L', :biz_a));

-- ---- Client Ana (deposit paid on event1) ----
set request.jwt.claim.sub = :ana;
select qa.expect_true('C-03', 'Control: client can read her contract', format('select count(*) = 1 from contracts where id = %L', :'contract1'));
select qa.expect_error('C-04', 'Control: client cannot call record_payment', format($$select record_payment(%L, null, 1, 'card', 'succeeded', 'stripe', 'pi_x')$$, :'invoice1'), 'permission denied');
select qa.expect_true('T-10', 'Client can read her planner''s business name/branding (portal shows [Business] branding)', 'select count(*) = 1 from businesses');
select qa.expect_true('T-11', 'Client can read the package on her proposal (Portal › Proposal shows package name/photos)', 'select count(*) >= 1 from packages');
select qa.expect_refused('T-12', 'Client cannot delete the planner''s comment',
  $$with d as (delete from comments where id = 'e0000000-0000-0000-0000-00000000000a' returning 1) select count(*) = 0 from d$$);
select qa.expect_refused('T-13', 'Client cannot rewrite the planner''s comment and claim authorship',
  format($$with u as (update comments set body = 'edited', author_id = %L where id = 'e0000000-0000-0000-0000-00000000000a' returning 1) select count(*) = 0 from u$$, :ana));
select qa.expect_refused('T-14', 'Client cannot delete the planner''s questionnaire',
  $$with d as (delete from questionnaires where id = 'f0000000-0000-0000-0000-00000000000a' returning 1) select count(*) = 0 from d$$);
select qa.expect_refused('T-15', 'Client cannot move a guest row into another business (business_id must match the event)',
  format($$with u as (update guests set business_id = %L where id = '60000000-0000-0000-0000-00000000000a' returning 1) select count(*) = 0 from u$$, :biz_b));
select qa.expect_true('T-16', 'Approving a credit larger than the unpaid installment works without negative installments',
  $$select qa.approve_then_no_negatives('b0000000-0000-0000-0000-00000000000b')$$);

-- ---- Co-host Marco (LIMITED access) ----
set request.jwt.claim.sub = :marco;
select qa.expect_error('C-05', 'Control: limited co-host cannot decide a change order',
  $$select client_decide_change_order('b0000000-0000-0000-0000-00000000000a', 'approved')$$, 'couldn''t find');
select qa.expect_true('T-17', 'Limited co-host cannot see money (invoices, installments, payments)',
  'select (select count(*) from invoices) + (select count(*) from installments) + (select count(*) from payments) = 0');

-- ---- Guests (anon) ----
reset role;
set role anon;
reset request.jwt.claim.sub;
select qa.expect_error('C-06', 'Control: anon cannot read the households table', 'select * from households', 'permission denied');
select qa.expect_true('C-07', 'Control: guest token cannot change another household',
  $$select qa.submit_then_status('tok-h1', '[{"guest_id":"60000000-0000-0000-0000-00000000000b","rsvp_status":"declined"}]',
                                 '60000000-0000-0000-0000-00000000000b') = 'no_reply'$$);
select qa.expect_error('T-18', 'Guest cannot pick a meal option belonging to a different event',
  $$select guest_submit_rsvp('tok-h1', '[{"guest_id":"60000000-0000-0000-0000-00000000000a","rsvp_status":"attending","meal_option_id":"c0000000-0000-0000-0000-00000000000b"}]')$$);
select qa.expect_error('T-19', 'An invalid RSVP value gets a plain-language error (NFR-12)',
  $$select guest_submit_rsvp('tok-h1', '[{"guest_id":"60000000-0000-0000-0000-00000000000a","rsvp_status":"yes"}]')$$, 'please');
reset role;
update events set headcount_locked_at = now(), headcount_locked_count = 2 where id = :'event1';
set role anon;
select qa.expect_error('T-20', 'RSVPs are closed once the final headcount is locked (PL-5.4)',
  $$select guest_submit_rsvp('tok-h1', '[{"guest_id":"60000000-0000-0000-0000-00000000000a","rsvp_status":"declined"}]')$$);
reset role;
update events set headcount_locked_at = null, headcount_locked_count = null, status = 'cancelled', cancelled_at = now() where id = :'event1';
set role anon;
select qa.expect_error('T-21', 'Guests cannot RSVP to a cancelled event',
  $$select guest_submit_rsvp('tok-h1', '[{"guest_id":"60000000-0000-0000-0000-00000000000a","rsvp_status":"attending"}]')$$);
reset role;
update events set status = 'booked', cancelled_at = null, deleted_at = now() where id = :'event1';
set role anon;
select qa.expect_true('C-08', 'Control: guest_household returns nothing for a deleted event', $$select guest_household('tok-h1') is null$$);
select qa.expect_error('T-22', 'Guests cannot RSVP to a deleted event',
  $$select guest_submit_rsvp('tok-h1', '[{"guest_id":"60000000-0000-0000-0000-00000000000a","rsvp_status":"attending"}]')$$);
reset role;
update events set deleted_at = null where id = :'event1';

-- ---- Booking edge cases (client calls, as Ana / Zed) ----
select qa.make_proposal(:biz_a, '20000000-0000-0000-0000-00000000000a', 'birthday', '2028-01-15', '70000000-0000-0000-0000-00000000000b') as prop_free \gset
select qa.make_proposal(:biz_a, '20000000-0000-0000-0000-00000000000a', 'reunion', '2028-03-01', '70000000-0000-0000-0000-00000000000a') as prop_reunion \gset
select qa.make_proposal(:biz_a, '20000000-0000-0000-0000-00000000000a', 'other', '2028-06-01', '70000000-0000-0000-0000-00000000000a', 20000) as prop_discount \gset
select qa.make_proposal(:biz_a, '20000000-0000-0000-0000-00000000000a', 'other', '2020-01-01', '70000000-0000-0000-0000-00000000000a') as prop_past \gset
select qa.make_proposal(:biz_b, '20000000-0000-0000-0000-00000000000d', 'birthday', '2028-05-01', '70000000-0000-0000-0000-00000000000c', 0, 70) as prop_b70 \gset

set role authenticated;
set request.jwt.claim.sub = :ana;
select client_accept_proposal(:'prop_free') as contract_free \gset
select client_sign_contract(:'contract_free', 'Ana Rivera', true) as s_free \gset
select client_accept_proposal(:'prop_reunion') as contract_reunion \gset
select client_accept_proposal(:'prop_past') as contract_past \gset
select qa.expect_true('T-23', 'A $0 booking unlocks the portal (a $0 deposit can never be paid: payments.amount must be > 0)',
  format('select portal_unlocked_at is not null from events where id = %L', :'s_free'::jsonb ->> 'event_id'));
select qa.expect_error('T-24', 'A payment-schedule template with no installments is rejected at signing',
  format($$select client_sign_contract(%L, 'Ana Rivera', true)$$, :'contract_reunion'), 'payment schedule');
select qa.expect_error('T-25', 'A discount larger than the subtotal is refused (no negative totals)',
  format('select client_accept_proposal(%L)', :'prop_discount'));
select qa.expect_error('T-26', 'A contract for a date in the past cannot be signed',
  format($$select client_sign_contract(%L, 'Ana Rivera', true)$$, :'contract_past'));
set request.jwt.claim.sub = :zed;
select client_accept_proposal(:'prop_b70') as contract_b70 \gset
select qa.expect_true('T-27', 'Default schedule with a 70% deposit gives a valid schedule (sums to the total, no negatives)',
  format($$select qa.sign_then_schedule_ok(%L, 'Zed Ng')$$, :'contract_b70'));
reset role;

-- ---- Payments (webhook) ----
update invoices set status = 'void' where id = :'invoice2';
set role service_role;
select qa.expect_true('T-28', 'A payment on a void invoice is not counted toward it and is flagged for refund',
  format($$select qa.void_payment_flagged(%L)$$, :'invoice2'));
select record_payment(:'invoice1', :'deposit1', 4455, 'card', 'succeeded', 'stripe', 'pi_dep_1', 'ck-1');  -- duplicate webhook
reset role;
update invoices set status = 'open' where id = :'invoice2';
select qa.expect_true('C-09', 'Control: duplicate webhook does not double-count the deposit',
  format('select amount_paid = 4455 from invoices where id = %L', :'invoice1'));
select qa.expect_true('T-29', 'A succeeded refund lowers amount_paid (_apply_payment treats every kind as money IN)',
  format('select qa.refund_lowers_balance(%L)', :'invoice1'));

-- ---- Data integrity (owner-level writes) ----
select qa.expect_error('T-30', 'Client emails are unique per business regardless of letter case',
  format($$insert into clients (business_id, first_name, email) values (%L, 'Dup', 'ANA@client.test')$$, :biz_a));
select qa.expect_error('T-31', 'events.event_type only accepts known event types (leads.event_type has a CHECK, events does not)',
  format($$insert into events (business_id, client_id, name, event_type, starts_at, time_zone)
           values (%L, '20000000-0000-0000-0000-00000000000a', 'x', 'banana', now(), 'UTC')$$, :biz_a));

-- ---- Guard triggers, tested by people who CAN see the rows (added in Repair Mode) ----
set role authenticated;
set request.jwt.claim.sub = :latoya;
select qa.expect_refused('T-32', 'Owner cannot countersign by updating the contracts table (only planner_countersign)',
  format($$with u as (update contracts set status = 'countersigned', planner_signed_at = now() where id = %L returning 1) select count(*) = 0 from u$$, :'contract2'));
select qa.expect_refused('T-33', 'Owner cannot mark an installment paid without a payment',
  format($$with u as (update installments set status = 'paid' where invoice_id = %L and status = 'due' returning 1) select count(*) = 0 from u$$, :'invoice1'));
select qa.expect_refused('T-34', 'Owner cannot approve a change order on the client''s behalf',
  $$with u as (update change_orders set status = 'approved' where id = 'b0000000-0000-0000-0000-00000000000a' returning 1) select count(*) = 0 from u$$);
select qa.expect_refused('T-35', 'Owner cannot mark a proposal accepted (only the client accepts)',
  format($$with u as (update proposals set status = 'accepted' where id = %L returning 1) select count(*) = 0 from u$$, :'prop_discount'));
select qa.expect_refused('T-36', 'Owner cannot set events.portal_unlocked_at on a booked (lead) event',
  format($$with u as (update events set portal_unlocked_at = now() where id = %L returning 1) select count(*) = 0 from u$$, :'event2'));
select qa.expect_true('C-10', 'Control: owner edits an event''s venue', format($$with u as (update events set venue_name = 'Hacienda' where id = %L returning 1) select count(*) = 1 from u$$, :'event1'));
select qa.expect_true('C-11', 'Control: owner soft-deletes an event (deleted_at)', $$with u as (update events set deleted_at = now() where id = '30000000-0000-0000-0000-0000000000ee' returning 1) select count(*) = 1 from u$$);
select qa.expect_true('C-12', 'Control: owner unlocks the portal of a MANUAL event (no lead, no deposit)', $$with u as (update events set portal_unlocked_at = now() where id = '30000000-0000-0000-0000-0000000000ee' returning 1) select count(*) = 1 from u$$);
select qa.expect_true('C-13', 'Control: owner voids an invoice', format($$with u as (update invoices set status = 'void' where id = %L returning 1) select count(*) = 1 from u$$, :'invoice2'));
select qa.expect_true('C-14', 'Control: owner pauses reminders and moves a due date', format($$with u as (update installments set reminders_paused = true, due_date = due_date + 1 where invoice_id = %L and status = 'due' returning 1) select count(*) >= 1 from u$$, :'invoice1'));
select qa.expect_true('C-15', 'Control: owner sends a change order (pending)', format($$with i as (insert into change_orders (business_id, event_id, invoice_id, description, amount) values (%L, %L, %L, 'Extra chairs', 50) returning 1) select count(*) = 1 from i$$, :biz_a, :'event1', :'invoice1'));
select qa.expect_true('C-16', 'Control: owner updates the contract PDF path', format($$with u as (update contracts set pdf_path = 'contracts/x.pdf' where id = %L returning 1) select count(*) = 1 from u$$, :'contract1'));
select qa.expect_true('C-17', 'Control: owner reads the business name', 'select count(*) = 1 from (select name from businesses) b');
set request.jwt.claim.sub = :sam;
select qa.expect_refused('T-37', 'Staff cannot cancel an event (owner/coordinator only)',
  format($$with u as (update events set status = 'cancelled', cancelled_at = now() where id = %L returning 1) select count(*) = 0 from u$$, :'event1'));
select qa.expect_true('C-18', 'Control: staff edits a checklist task', format($$with u as (update tasks set notes = 'Call baker' where event_id = %L returning 1) select count(*) >= 1 from u$$, :'event1'));
set request.jwt.claim.sub = :ana;
select qa.expect_refused('T-38', 'Client cannot read the business''s payment account id', 'select count(payment_account_id) = -1 from businesses');
select qa.expect_refused('T-39', 'Client cannot rename the planner''s questionnaire',
  $$with u as (update questionnaires set title = 'Mine now' where id = 'f0000000-0000-0000-0000-00000000000a' returning 1) select count(*) = 0 from u$$);
select qa.expect_true('C-19', 'Control: client fills in questionnaire answers', $$with u as (update questionnaires set answers = '{"colors":"sage"}', status = 'in_progress' where id = 'f0000000-0000-0000-0000-00000000000a' returning 1) select count(*) = 1 from u$$);
select qa.expect_true('C-20', 'Control: client comments on a shared file', format($$with i as (insert into comments (business_id, file_id, author_id, body) values (%L, 'd0000000-0000-0000-0000-00000000000a', %L, 'Love it') returning 1) select count(*) = 1 from i$$, :biz_a, :ana));
select qa.expect_true('C-21', 'Control: client adds a guest to her own household', format($$with i as (insert into guests (business_id, event_id, household_id, first_name) values (%L, %L, '50000000-0000-0000-0000-00000000000a', 'Tia') returning 1) select count(*) = 1 from i$$, :biz_a, :'event1'));
reset role;

-- ---- Property / fuzz: payment schedules always add up (seeded, reproducible) ----
do $$
declare
  v_prices numeric[] := array[0.01, 0.03, 1, 10, 33.33, 99999.99, 12345.67];
  v_price numeric; v_type text; v_prop uuid; v_contract uuid; v_sign jsonb; v_total numeric; v_sum numeric;
  v_first numeric; v_pct numeric; v_neg int; v_bad text := null; i int;
begin
  perform setseed(0.4242);
  for i in 1..60 loop
    v_price := case when i <= array_length(v_prices, 1) then v_prices[i] else round((random() * 99999 + 0.01)::numeric, 2) end;
    v_type := case when i % 2 = 0 then 'corporate' else 'wedding' end;   -- thirds template vs 30/40/30
    v_pct := case when v_type = 'corporate' then 33.33 else 30 end;
    update packages set base_price = v_price where id = '70000000-0000-0000-0000-00000000000f';
    v_prop := qa.make_proposal('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a',
                               v_type, date '2030-01-01' + i, '70000000-0000-0000-0000-00000000000f');
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
    execute 'set role authenticated';
    v_contract := client_accept_proposal(v_prop);
    v_sign := client_sign_contract(v_contract, 'Ana Rivera', true);
    execute 'reset role';
    select total into v_total from invoices where id = (v_sign ->> 'invoice_id')::uuid;
    select sum(amount), count(*) filter (where amount < 0) into v_sum, v_neg from installments where invoice_id = (v_sign ->> 'invoice_id')::uuid;
    v_first := (v_sign ->> 'deposit_amount')::numeric;
    if v_sum <> v_total or v_neg > 0 or v_first <> round(v_total * v_pct / 100, 2)
       or v_total <> (select total from proposals where id = v_prop) then
      v_bad := format('price %s (%s): total %s, schedule sum %s, deposit %s, negatives %s', v_price, v_type, v_total, v_sum, v_first, v_neg);
      exit;
    end if;
  end loop;
  insert into qa.results values ('P-01', 'Property (60 seeded cases incl. 0.01 and 99,999.99): schedule sums to the total, deposit = total × %, no negatives',
    case when v_bad is null then 'PASS' else 'FAIL' end, coalesce(v_bad, 'all 60 cases held'));
end $$;

-- =================== Report ===================
\o
\pset format aligned
\pset border 2
\pset tuples_only off
\pset footer off
select id, outcome, title, detail from qa.results order by left(id, 1) desc, id;
select count(*) filter (where outcome = 'PASS') as passed, count(*) filter (where outcome = 'FAIL') as failed, count(*) as total from qa.results;
