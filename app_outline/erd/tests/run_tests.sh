#!/usr/bin/env bash
# Runs the database tests on a throwaway PostgreSQL server, then deletes it.
#   bash app_outline/erd/tests/run_tests.sh
# Needs PostgreSQL 15+ installed (initdb, pg_ctl, psql). Each test file gets a fresh
# database with: Supabase stand-in → schema.sql → functions.sql → test helpers.
set -euo pipefail

TESTS_DIR="$(cd "$(dirname "$0")" && pwd)"
ERD_DIR="$(dirname "$TESTS_DIR")"
PORT="${PGTEST_PORT:-54330}"

# Find the newest installed PostgreSQL's server tools (Ubuntu puts them in /usr/lib/postgresql/<ver>/bin).
PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
if [ -n "$PG_BIN" ]; then PATH="$PG_BIN:$PATH"; fi
command -v initdb >/dev/null || { echo "initdb not found: install PostgreSQL server tools"; exit 1; }

WORK="$(mktemp -d)"
cleanup() { pg_ctl -D "$WORK/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

initdb -D "$WORK/data" -U postgres --auth=trust >/dev/null
# -k '' = no Unix socket (avoids path-length limits); connect over TCP instead.
pg_ctl -D "$WORK/data" -o "-p $PORT -k ''" -l "$WORK/server.log" -w start >/dev/null

run_psql() { psql -h 127.0.0.1 -p "$PORT" -U postgres -X -q -v ON_ERROR_STOP=1 "$@"; }

failed=0
for test in "$TESTS_DIR"/test_*.sql; do
  name="$(basename "$test" .sql)"
  run_psql -d postgres -c "create database \"$name\"" >/dev/null   # quoted: file names may contain "-"
  if run_psql -d "$name" -f "$TESTS_DIR/supabase_stub.sql" -f "$ERD_DIR/schema.sql" -f "$ERD_DIR/functions.sql" \
              -f "$TESTS_DIR/helpers.sql" -f "$test" >/dev/null 2>"$WORK/$name.err"; then
    echo "PASS  $name"
  else
    echo "FAIL  $name"
    sed 's/^/      /' "$WORK/$name.err"
    failed=1
  fi
done

exit $failed
