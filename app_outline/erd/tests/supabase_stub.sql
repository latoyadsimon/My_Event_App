-- Minimal stand-in for what Supabase provides, so schema.sql and functions.sql
-- can run on plain Postgres for testing. NOT for production.
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, created_at timestamptz default now());

-- Supabase's auth.uid() reads the signed-in user's id from the request token.
-- Here tests fake it with:  set request.jwt.claim.sub = '<user uuid>';
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

-- Roles belong to the whole server, not one database, so only create them once.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to authenticated;

-- Supabase grants table access by default when a table is created; RLS then decides which
-- rows each role sees. (anon gets nothing here: guests only call the guest_* functions.)
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to authenticated, service_role;
alter default privileges in schema public grant all on sequences to authenticated, service_role;
