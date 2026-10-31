#!/usr/bin/env bash
# QA audit: runs qa/tests/qa_db_probes.sql on a throwaway PostgreSQL and prints a PASS/FAIL table.
#   bash qa/run_qa_db_probes.sh
# Loads: the project's Supabase stand-in + schema.sql + functions.sql + test helpers, then the QA helpers and probes.
# Exit code 1 if any probe FAILs (each FAIL is a defect or gap; see QA_REPORT.md).
set -euo pipefail

QA_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$QA_DIR")"
ERD="$ROOT/app_outline/erd"
PORT="${PGTEST_PORT:-54331}"

PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
if [ -n "$PG_BIN" ]; then PATH="$PG_BIN:$PATH"; fi
command -v initdb >/dev/null || { echo "initdb not found: install PostgreSQL server tools"; exit 1; }

WORK="$(mktemp -d)"
cleanup() { pg_ctl -D "$WORK/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
initdb -D "$WORK/data" -U postgres --auth=trust >/dev/null
pg_ctl -D "$WORK/data" -o "-p $PORT -k ''" -l "$WORK/server.log" -w start >/dev/null

run_psql() { psql -h 127.0.0.1 -p "$PORT" -U postgres -X -v ON_ERROR_STOP=1 "$@"; }
run_psql -q -d postgres -c "create database qa_probes" >/dev/null
OUT="$(run_psql -q -d qa_probes -f "$ERD/tests/supabase_stub.sql" -f "$ERD/schema.sql" -f "$ERD/functions.sql" \
         -f "$ERD/tests/helpers.sql" -f "$QA_DIR/tests/qa_helpers.sql" -f "$QA_DIR/tests/qa_db_probes.sql" 2>&1)" || {
  echo "Probe run aborted (setup error):"; echo "$OUT"; exit 2; }
echo "$OUT"

# Cross-check: what build_erd.py parses vs. what Postgres actually created.
echo
echo "Live database: $(run_psql -q -At -d qa_probes -c "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'") tables," \
     "$(run_psql -q -At -d qa_probes -c "select count(*) from information_schema.columns where table_schema='public'") columns," \
     "$(run_psql -q -At -d qa_probes -c "select count(*) from information_schema.table_constraints where table_schema='public' and constraint_type='FOREIGN KEY'") foreign keys," \
     "$(run_psql -q -At -d qa_probes -c "select count(*) from pg_policies where schemaname='public'") RLS policies," \
     "$(run_psql -q -At -d qa_probes -c "select count(*) from pg_tables where schemaname='public' and not rowsecurity") tables without RLS"

grep -q "| FAIL" <<<"$OUT" && exit 1 || exit 0
