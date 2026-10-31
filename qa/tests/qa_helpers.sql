-- QA audit helpers (loaded after schema.sql, functions.sql and the project's tests/helpers.sql).
-- Every probe records PASS/FAIL in qa.results instead of stopping the run, and any rows a
-- probe changes are rolled back, so one defect can't contaminate the next probe.
create schema qa;
create table qa.results (id text primary key, title text not null, outcome text not null, detail text);
grant usage on schema qa to anon, authenticated, service_role;
grant all on qa.results to anon, authenticated, service_role;

-- PASS when p_sql returns true (= correct behavior). Runs as the current role, so RLS applies.
create function qa.expect_true(p_id text, p_title text, p_sql text) returns void language plpgsql as $$
declare v boolean;
begin
  begin
    execute p_sql into v;
    raise exception using errcode = 'QA001', message = coalesce(v::text, 'null');  -- undo any writes
  exception
    when sqlstate 'QA001' then
      insert into qa.results values (p_id, p_title,
        case when sqlerrm = 'true' then 'PASS' else 'FAIL' end,
        case when sqlerrm = 'true' then '' else 'check returned ' || sqlerrm end);
    when others then
      insert into qa.results values (p_id, p_title, 'FAIL', 'error: ' || sqlerrm);
  end;
end $$;

-- PASS when p_sql raises an error (containing p_fragment, if given). Writes are always undone.
create function qa.expect_error(p_id text, p_title text, p_sql text, p_fragment text default null) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
    raise exception using errcode = 'QA002', message = 'no error';
  exception
    when sqlstate 'QA002' then
      insert into qa.results values (p_id, p_title, 'FAIL', 'succeeded: no error was raised');
    when others then
      if p_fragment is null or position(lower(p_fragment) in lower(sqlerrm)) > 0 then
        insert into qa.results values (p_id, p_title, 'PASS', 'refused: ' || sqlerrm);
      else
        insert into qa.results values (p_id, p_title, 'FAIL', 'wrong/unfriendly error: ' || sqlerrm);
      end if;
  end;
end $$;

-- PASS when a forbidden change is refused EITHER way: RLS filters the row out (p_sql returns
-- true, e.g. "0 rows updated"), or a guard trigger/constraint raises an error. Writes are undone.
create function qa.expect_refused(p_id text, p_title text, p_sql text) returns void language plpgsql as $$
declare v boolean;
begin
  begin
    execute p_sql into v;
    raise exception using errcode = 'QA001', message = coalesce(v::text, 'null');
  exception
    when sqlstate 'QA001' then
      insert into qa.results values (p_id, p_title,
        case when sqlerrm = 'true' then 'PASS' else 'FAIL' end,
        case when sqlerrm = 'true' then 'refused: no rows changed' else 'the change went through' end);
    when others then
      insert into qa.results values (p_id, p_title, 'PASS', 'refused: ' || sqlerrm);
  end;
end $$;

-- Setup shortcut (run as the database owner): a lead plus a sent proposal.
create function qa.make_proposal(p_business uuid, p_client uuid, p_type text, p_date date, p_package uuid,
                                 p_discount numeric default 0, p_deposit numeric default 30) returns uuid
language plpgsql as $$
declare v_lead uuid; v_prop uuid;
begin
  insert into leads (business_id, client_id, event_type, requested_date, guest_count, stage)
  values (p_business, p_client, p_type, p_date, 50, 'proposal_sent') returning id into v_lead;
  insert into proposals (business_id, lead_id, version, status, package_id, discount, tax_rate, deposit_percent, sent_at)
  values (p_business, v_lead, 1, 'sent', p_package, p_discount, 0.08, p_deposit, now()) returning id into v_prop;
  return v_prop;
end $$;

grant execute on all functions in schema qa to anon, authenticated, service_role;
