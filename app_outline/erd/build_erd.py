#!/usr/bin/env python3
"""
Build the ERD data and the data dictionary from schema.sql.

schema.sql is the single source of truth. After editing it, run:

    python3 app_outline/erd/build_erd.py

It writes:
  erd_data.js         tables, columns and links that erd.html draws
  data_dictionary.md  one section per table: purpose, stories, RLS rule, every column

Standard library only. The parser relies on schema.sql's house style:
an "-- @table" header above each table, and one column per line.
"""
import json
import re
from pathlib import Path

ERD_DIR = Path(__file__).resolve().parent
SCHEMA = ERD_DIR / "schema.sql"

# ---------------------------------------------------------------------------
# Diagram layout: which tables go in which area, and in which column.
# Every table in schema.sql must appear exactly once (checked below).
# ---------------------------------------------------------------------------
AREAS = [
    {"id": "identity", "title": "Identity & tenancy", "blurb": "Who the business is, who works there, and who its clients are.",
     "columns": [["businesses"], ["memberships", "clients"], ["auth.users", "profiles"]]},
    {"id": "sales", "title": "Sales", "blurb": "Lead → proposal → contract. Clients see only their own leads and sent proposals.",
     "columns": [["date_holds", "appointments"], ["leads", "packages"], ["proposals", "contracts"], ["proposal_items", "add_ons"]]},
    {"id": "events", "title": "Events & money", "blurb": "The Event Hub plus the invoice, payment schedule and payments. Money needs see_budgets.",
     "columns": [["event_hosts"], ["events"], ["invoices", "change_orders"], ["installments", "payments"]]},
    {"id": "planning", "title": "Planning", "blurb": "Tasks, questionnaires, files and mood boards, approvals and messages.",
     "columns": [["templates", "tasks", "questionnaires"], ["mood_boards", "files", "comments"],
                 ["approvals", "approval_responses"], ["message_threads", "messages"]]},
    {"id": "guests", "title": "Guests & RSVPs", "blurb": "Event website, households, guests and invitations. Guests reach this only through their invite token.",
     "columns": [["households", "event_websites"], ["guests"], ["meal_options", "invitations"]]},
    {"id": "system", "title": "System", "blurb": "Notifications, the event-bus outbox and the activity history. Written by the server.",
     "columns": [["deliveries"], ["opt_outs", "domain_events"], ["activity_log"]]},
]

# Supabase creates auth.users; it isn't in schema.sql, so describe it here.
AUTH_USERS = {
    "name": "auth.users", "description": "Managed by Supabase Auth: planners, staff and clients who sign in. Guests never do.",
    "stories": ["PL-1.1", "ST-1.1", "CL-2.1", "NFR-1"], "rls": "managed by Supabase; passwords stored hashed",
    "external": True, "uniques": [], "checks": [],
    "columns": [
        {"name": "id", "type": "uuid", "pk": True, "fk": None, "unique": False, "required": True, "comment": "the user id every other table points to", "values": []},
        {"name": "email", "type": "varchar", "pk": False, "fk": None, "unique": True, "required": False, "comment": "magic links go here", "values": []},
        {"name": "phone", "type": "text", "pk": False, "fk": None, "unique": True, "required": False, "comment": "staff sign in with an SMS code", "values": []},
        {"name": "created_at", "type": "timestamptz", "pk": False, "fk": None, "unique": False, "required": True, "comment": "sign-up time", "values": []},
    ],
}

# Phase 2–4 tables: sketched only (dashed boxes). Refine before those phases start.
LATER = [
    ("P2", "vendors", ["id uuid", "business_id → businesses", "category text", "coi_expires_on date"]),
    ("P2", "event_vendors", ["id uuid", "event_id → events", "vendor_id → vendors", "status text", "arrival_at timestamptz"]),
    ("P2", "timeline_items", ["id uuid", "event_id → events", "starts_at timestamptz", "owner_id → auth.users", "visibility text[]"]),
    ("P2", "budget_lines", ["id uuid", "event_id → events", "category text", "estimated numeric", "actual numeric"]),
    ("P2", "equipment_items", ["id uuid", "business_id → businesses", "name text", "quantity_owned int", "kit_id → kits"]),
    ("P2", "kits", ["id uuid", "business_id → businesses", "name text"]),
    ("P2", "reservations", ["id uuid", "event_id → events", "equipment_item_id → equipment_items", "quantity int"]),
    ("P2", "equipment_scans", ["id uuid", "event_id → events", "equipment_item_id → equipment_items", "direction text"]),
    ("P2", "shifts", ["id uuid", "event_id → events", "role text", "starts_at timestamptz"]),
    ("P2", "shift_assignments", ["id uuid", "shift_id → shifts", "membership_id → memberships", "status text"]),
    ("P2", "time_entries", ["id uuid", "shift_assignment_id → shift_assignments", "clock_in timestamptz", "clock_out timestamptz"]),
    ("P2", "incidents", ["id uuid", "event_id → events", "description text", "photo_paths text[]"]),
    ("P2", "potluck_slots", ["id uuid", "event_id → events", "category text", "target int"]),
    ("P2", "potluck_signups", ["id uuid", "slot_id → potluck_slots", "guest_id → guests", "dish text", "diet_tags text[]"]),
    ("P3", "photos", ["id uuid", "event_id → events", "storage_path text", "hidden boolean"]),
    ("P3", "booth_sessions", ["id uuid", "event_id → events", "mode text", "shared_to text"]),
    ("P3", "prints", ["id uuid", "photo_id → photos", "size text", "copies int"]),
    ("P3", "songs", ["id uuid", "business_id → businesses", "title text", "artist text", "explicit boolean"]),
    ("P3", "song_requests", ["id uuid", "event_id → events", "song_id → songs", "singer_name text", "position int"]),
    ("P4", "donations", ["id uuid", "event_id → events", "amount numeric", "deductible numeric", "anonymous boolean"]),
    ("P4", "auction_items", ["id uuid", "event_id → events", "title text", "closes_at timestamptz"]),
    ("P4", "bids", ["id uuid", "auction_item_id → auction_items", "amount numeric"]),
    ("P4", "ticket_tiers", ["id uuid", "event_id → events", "name text", "price numeric", "capacity int"]),
    ("P4", "tickets", ["id uuid", "ticket_tier_id → ticket_tiers", "qr_code text", "checked_in_at timestamptz"]),
    ("P4", "floor_plans", ["id uuid", "event_id → events", "layout jsonb"]),
    ("P4", "seat_assignments", ["id uuid", "floor_plan_id → floor_plans", "guest_id → guests", "table_label text"]),
]

TABLE_BLOCK = re.compile(
    # [^\n]* keeps each header line on one line; only the body ((?s:.*?)) may span lines.
    r"^-- @table (?P<meta>[^\n]+)\n(?P<desc>(?:-- [^\n]*\n)*)create table public\.(?P<name>\w+) \(\n(?P<body>(?s:.*?))\n\);",
    re.M)
COLUMN = re.compile(r"^(?P<name>\w+)\s+(?P<type>(?:timestamptz|[a-z]+)(?:\(\d+(?:,\d+)?\))?(?:\[\])?)")


def parse_schema(sql):
    """Return {table_name: table dict} for every '-- @table' block in schema.sql."""
    tables = {}
    for m in TABLE_BLOCK.finditer(sql):
        meta = [part.strip() for part in m.group("meta").split("|")]
        if len(meta) != 4 or not meta[2].startswith("stories:") or not meta[3].startswith("rls:"):
            raise SystemExit(f"Bad '-- @table' header for {m.group('name')}: expected "
                             f"'-- @table <name> | <area> | stories: <IDs> | rls: <who>', got '-- @table {m.group('meta')}'")
        table = {
            "name": m.group("name"),
            "description": " ".join(l[3:].strip() for l in m.group("desc").splitlines()),
            "stories": [s.strip() for s in meta[2].removeprefix("stories:").split(",")],
            "rls": meta[3].removeprefix("rls:").strip(),
            "external": False, "columns": [], "uniques": [], "checks": [],
        }
        for raw in m.group("body").splitlines():
            line = raw.strip()
            if not line:
                continue
            definition, _, comment = line.partition("  -- ")
            definition = definition.rstrip(",").strip()
            if definition.startswith("unique ("):
                table["uniques"].append(definition[len("unique "):])
                continue
            if definition.startswith("check ("):
                table["checks"].append(definition[len("check "):])
                continue
            col = COLUMN.match(definition)
            if not col:
                raise SystemExit(f"Can't parse a column in {table['name']}: {line}")
            ref = re.search(r"references\s+(\w+)\.(\w+)", definition)
            allowed = re.search(r"check \(\w+ in \(([^)]*)\)\)", definition)
            table["columns"].append({
                "name": col.group("name"),
                "type": col.group("type"),
                "pk": "primary key" in definition,
                "fk": None if not ref else (f"auth.{ref.group(2)}" if ref.group(1) == "auth" else ref.group(2)),
                "unique": bool(re.search(r"\bunique\b", definition)),
                "required": "not null" in definition or "primary key" in definition,
                "comment": comment.strip(),
                "values": [v.strip(" '") for v in allowed.group(1).split(",")] if allowed else [],
            })
        tables[table["name"]] = table
    return tables


def check_layout(tables):
    placed = [t for a in AREAS for col in a["columns"] for t in col]
    problems = [f"Placed twice in AREAS: {t}" for t in sorted({t for t in placed if placed.count(t) > 1})]
    problems += [f"In schema.sql but not in AREAS: {t}" for t in sorted(set(tables) - set(placed))]
    problems += [f"In AREAS but not in schema.sql: {t}" for t in sorted(set(placed) - set(tables))]
    for t in tables.values():
        for c in t["columns"]:
            if c["fk"] and c["fk"] not in tables:
                problems.append(f"{t['name']}.{c['name']} references unknown table {c['fk']}")
    if problems:
        raise SystemExit("Layout problems:\n  " + "\n  ".join(problems))


def write_erd_data(tables):
    area_of = {t: a["id"] for a in AREAS for col in a["columns"] for t in col}
    for t in tables.values():
        t["area"] = area_of[t["name"]]
    data = {"areas": AREAS, "tables": tables,
            "later": [{"phase": p, "name": n, "columns": cols} for p, n, cols in LATER]}
    text = "// Generated by build_erd.py from schema.sql. Do not edit by hand.\nconst ERD = " + json.dumps(data, indent=1) + ";\n"
    (ERD_DIR / "erd_data.js").write_text(text, encoding="utf-8")


def write_dictionary(tables):
    total_cols = sum(len(t["columns"]) for t in tables.values())
    out = [
        "# Data dictionary: Event Planner (Phase 1)",
        "",
        "> Generated from `schema.sql` by `build_erd.py`. **Edit `schema.sql`**, then run "
        "`python3 app_outline/erd/build_erd.py`; edits made here get overwritten.",
        "",
        f"**{len(tables) - 1} tables in `public` + Supabase's `auth.users` · {total_cols} columns.** "
        "Diagram: [`erd.html`](erd.html) · SQL: [`schema.sql`](schema.sql) · Stories: [`../user_stories.md`](../user_stories.md)",
        "",
        "## Rules that apply to every table",
        "",
        "- **Multi-tenant:** every business table has `business_id → businesses`. Row-level security (RLS) is on for every table (NFR-2, NFR-3).",
        "- **Members:** people in `memberships` with status `active` can work with their business's rows (`is_member()`). "
        "Money tables (`invoices`, `installments`, `payments`, `change_orders`) also need the `see_budgets` permission; owners always have it.",
        "- **Clients (hosts):** see only their own lead, sent proposals and event. Planning pages unlock when the deposit is paid "
        "(`events.portal_unlocked_at`, `host_can_plan()`). Messages stay open before that.",
        "- **Guests:** never sign in and can't read tables. They use `guest_household(token)` and `guest_submit_rsvp(token, replies)` with `households.invite_token`.",
        "- **Server only:** `payments` are written by the payment webhook; `deliveries`, `opt_outs`, `domain_events` and `activity_log` by server jobs.",
        "- **Conventions:** ids are `uuid`; money is `numeric(10,2)`; times are `timestamptz`, and each event stores its own `time_zone`; "
        "`deleted_at` = soft delete (restore within 30 days); statuses are `text` with the allowed values listed below.",
        "",
        "## Contents",
        "",
    ]
    for a in AREAS:
        names = [t for col in a["columns"] for t in col]
        out.append(f"- **{a['title']}:** " + ", ".join(f"[{n}](#{n.replace('.', '')})" for n in names))
    out.append("")
    for a in AREAS:
        out += [f"## {a['title']}", "", a["blurb"], ""]
        for name in [t for col in a["columns"] for t in col]:
            t = tables[name]
            out += [f"### {name}", "", t["description"], "",
                    f"- **Stories:** {', '.join(t['stories'])}",
                    f"- **Who can see it (RLS):** {t['rls']}"]
            if t["uniques"]:
                out.append(f"- **Unique together:** {'; '.join('`' + u + '`' for u in t['uniques'])}")
            if t["checks"]:
                out.append(f"- **Rules:** {'; '.join('`' + c + '`' for c in t['checks'])}")
            out += ["", "| Column | Type | Key | Required | Meaning |", "|---|---|---|---|---|"]
            for c in t["columns"]:
                key = " ".join(filter(None, ["PK" if c["pk"] else "", f"FK → {c['fk']}" if c["fk"] else "", "unique" if c["unique"] and not c["pk"] else ""]))
                meaning = c["comment"] or ("unique id for this row (auto-generated)" if c["pk"] else "")
                if c["values"]:
                    meaning += f" · One of: {', '.join('`' + v + '`' for v in c['values'])}"
                out.append(f"| `{c['name']}` | {c['type']} | {key} | {'yes' if c['required'] else ''} | {meaning} |")
            out.append("")
    out += ["## Later phases (sketched in the diagram, not in schema.sql yet)", "",
            "| Phase | Table | Key columns |", "|---|---|---|"]
    out += [f"| {p} | {n} | {', '.join(cols)} |" for p, n, cols in LATER]
    out.append("")
    (ERD_DIR / "data_dictionary.md").write_text("\n".join(out), encoding="utf-8")
    return total_cols


def main():
    tables = parse_schema(SCHEMA.read_text(encoding="utf-8"))
    tables = {"auth.users": AUTH_USERS, **tables}
    check_layout(tables)
    write_erd_data(tables)
    total_cols = write_dictionary(tables)
    links = sum(1 for t in tables.values() for c in t["columns"] if c["fk"])
    print(f"Tables: {len(tables)} ({len(tables) - 1} in public + auth.users) · columns: {total_cols} · foreign keys: {links}")
    print(f"Later-phase sketches: {len(LATER)}")
    print("Wrote erd_data.js and data_dictionary.md")


if __name__ == "__main__":
    main()
