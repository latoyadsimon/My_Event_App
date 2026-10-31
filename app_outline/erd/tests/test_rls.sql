-- Row-level security tests: who can see which rows.
\set ON_ERROR_STOP 1
\set QUIET 1

-- Two businesses, one owner each, staff without money permission in business A, and client Ana.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'latoya@a.test'),
  ('00000000-0000-0000-0000-00000000000b', 'owner@b.test'),
  ('00000000-0000-0000-0000-00000000000c', 'sam@a.test'),
  ('00000000-0000-0000-0000-00000000000d', 'ana@client.test');
insert into businesses (id, name, slug) values
  ('10000000-0000-0000-0000-00000000000a', 'Business A', 'biz-a'),
  ('10000000-0000-0000-0000-00000000000b', 'Business B', 'biz-b');
insert into memberships (business_id, user_id, role, status) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'owner', 'active'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'owner', 'active'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'staff', 'active');
insert into clients (id, business_id, user_id, first_name, email) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000d', 'Ana', 'ana@client.test'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', null, 'Bea', 'bea@client.test');
insert into leads (business_id, client_id, event_type) values
  ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 'wedding'),
  ('10000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000b', 'birthday');
insert into events (id, business_id, client_id, name, event_type, starts_at, time_zone) values
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a',
   'Rivera wedding', 'wedding', '2027-06-12 16:00-05', 'America/Chicago');
insert into event_hosts (business_id, event_id, client_id, role) values
  ('10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', 'primary');
insert into invoices (id, business_id, event_id, number, total) values
  ('40000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', '1042', 14850);
insert into event_websites (business_id, event_id, slug, rsvp_cutoff) values
  ('10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 'rivera', '2099-05-01');
insert into households (id, business_id, event_id, name, invite_token) values
  ('50000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 'Rivera family', 'token-rivera'),
  ('50000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 'Chen household', 'token-chen');
insert into guests (id, business_id, event_id, household_id, first_name) values
  ('60000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-00000000000a', 'Lucia'),
  ('60000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-00000000000b', 'Wei');

-- 1. Multi-tenancy (NFR-2): each owner sees only their own business.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select test.eq('1a owner A sees 1 lead', (select count(*) from leads), 1::bigint);
select test.eq('1b owner A sees no business B rows', (select count(*) from leads where business_id = '10000000-0000-0000-0000-00000000000b'), 0::bigint);
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select test.eq('1c owner B sees only their client', (select count(*) from clients), 1::bigint);

-- 2. Permissions (PL-1.6): staff without see_budgets sees leads but not invoices.
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select test.eq('2a staff sees leads', (select count(*) from leads), 1::bigint);
select test.eq('2b staff sees no invoices', (select count(*) from invoices), 0::bigint);

-- 3. Client Ana: her own event and invoice; guest list locked until the deposit.
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select test.eq('3a client sees her event', (select count(*) from events), 1::bigint);
select test.eq('3b client sees her invoice', (select count(*) from invoices), 1::bigint);
select test.eq('3c client sees only her own lead', (select count(*) from leads), 1::bigint);
select test.eq('3d guests locked before deposit', (select count(*) from guests), 0::bigint);
reset role;
update events set portal_unlocked_at = now() where id = '30000000-0000-0000-0000-00000000000a';
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select test.eq('3e guests unlocked after deposit', (select count(*) from guests), 2::bigint);

-- 4. Clients can't write payments (only the webhook can).
select test.expect_error($$insert into payments (business_id, invoice_id, method, amount)
  values ('10000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-00000000000a', 'card', 1)$$, 'row-level security');

-- 5. Guests (anon): the token reaches one household only; no direct table access.
reset role;
set role anon;
reset request.jwt.claim.sub;
select test.eq('5a token returns its household only', jsonb_array_length(guest_household('token-rivera') -> 'guests'), 1);
select test.eq('5b wrong token returns nothing', guest_household('wrong-token'), null::jsonb);
select test.expect_error('select * from guests', 'permission denied');
select guest_submit_rsvp('token-rivera', '[{"guest_id":"60000000-0000-0000-0000-00000000000a","rsvp_status":"attending"},
                                          {"guest_id":"60000000-0000-0000-0000-00000000000b","rsvp_status":"declined"}]');
reset role;
select test.eq('5c own RSVP saved', (select rsvp_status from guests where first_name = 'Lucia'), 'attending');
select test.eq('5d other household untouched', (select rsvp_status from guests where first_name = 'Wei'), 'no_reply');
select test.eq('5e rsvp.updated event written', (select count(*) from domain_events where type = 'rsvp.updated'), 1::bigint);

-- 6. No double charges (NFR-6): a duplicate idempotency_key is rejected.
insert into payments (business_id, invoice_id, method, amount, idempotency_key) values
  ('10000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-00000000000a', 'card', 4455, 'checkout-1');
select test.expect_error($$insert into payments (business_id, invoice_id, method, amount, idempotency_key)
  values ('10000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-00000000000a', 'card', 4455, 'checkout-1')$$, 'duplicate key');

-- 7. updated_at keeps itself current.
update leads set stage = 'contacted', updated_at = '2000-01-01' where business_id = '10000000-0000-0000-0000-00000000000a';
select test.eq('7 updated_at trigger', (select updated_at > now() - interval '1 minute' from leads
                                        where business_id = '10000000-0000-0000-0000-00000000000a'), true);

\echo 'test_rls.sql: all tests passed'
