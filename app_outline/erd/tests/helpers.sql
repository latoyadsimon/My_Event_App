-- Test helpers, loaded after schema.sql and functions.sql.
-- (Table grants come from supabase_stub.sql, BEFORE schema.sql, as in Supabase, so that
-- schema.sql's own revokes, e.g. businesses.payment_account_id, stay in force.)

create schema test;
grant usage on schema test to anon, authenticated, service_role;

-- Fails the test run unless running p_sql raises an error whose message contains p_expected.
create function test.expect_error(p_sql text, p_expected text) returns void language plpgsql as $$
declare
  v_failed boolean := false;
begin
  begin
    execute p_sql;
  exception when others then
    v_failed := true;
    if position(lower(p_expected) in lower(sqlerrm)) = 0 then
      raise exception 'FAIL: expected an error containing "%", got "%"', p_expected, sqlerrm;
    end if;
  end;
  if not v_failed then
    raise exception 'FAIL: expected an error containing "%", but it succeeded: %', p_expected, p_sql;
  end if;
end $$;

-- Fails the test run unless p_actual = p_expected.
create function test.eq(p_label text, p_actual anyelement, p_expected anyelement) returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL %: expected %, got %', p_label, p_expected, p_actual;
  end if;
end $$;

grant execute on all functions in schema test to anon, authenticated, service_role;
