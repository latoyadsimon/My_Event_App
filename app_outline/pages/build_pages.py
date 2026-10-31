#!/usr/bin/env python3
"""
Build one folder per screen/feature in app_outline/pages/.

user_stories.md is the place to EDIT stories. This script copies each story
into the README of the page folder(s) it belongs to, so the copies never drift.

    Edit app_outline/user_stories.md  →  run:  python3 app_outline/pages/build_pages.py

What it writes:
  pages/README.md                     index of every page
  pages/<role>/<page>/README.md       the page's stories, wireframe, click path, notes
  pages/<role>/<page>/tests/README.md tests to write (only created once, never overwritten)
  user_stories.md                     a "Page:" line under each Phase 1 story (kept up to date)

Wireframe images (wireframe.png) are cropped from wireframes/wireframe.html with
Playwright; see "Refreshing wireframe images" in pages/README.md.
Standard library only, so no installs are needed.
"""
import json
import re
from pathlib import Path

PAGES_DIR = Path(__file__).resolve().parent
OUTLINE_DIR = PAGES_DIR.parent
STORIES_FILE = OUTLINE_DIR / "user_stories.md"
SCREENS_FILE = PAGES_DIR / "_wireframe_screens.json"   # exported from the wireframe page

ROLES = {
    "planner":  "Planner (Owner)",
    "client":   "Client (Host)",
    "guest":    "Guest",
    "staff":    "Staff",
    "messages": "Messages (email / text / push)",
    "shared":   "Shared (backend & cross-cutting)",
}


def page(role, folder, title, stories, route=None, frm=None, nxt=None, gap=None, applies=None):
    """One page folder. route = the wireframe route it's drawn under (None = not drawn)."""
    return dict(role=role, folder=folder, title=title, stories=stories, route=route,
                frm=frm, nxt=nxt, gap=gap, applies=applies)


# ---------------------------------------------------------------------------
# The folder map: every Phase 1 screen/feature → its stories.
# To add a page: add a line here, then re-run the script.
# ---------------------------------------------------------------------------
PAGES = [
    # ---- Planner ----
    page("planner", "sign-up", "Sign Up", ["PL-1.1"], route="Sign Up"),
    page("planner", "onboarding", "Onboarding Wizard", ["PL-1.2", "PL-1.3", "PL-1.4", "PL-1.5", "PL-1.7"], route="Onboarding"),
    page("planner", "dashboard", "Dashboard", ["PL-1.8"], route="Dashboard"),
    page("planner", "calendar", "Calendar", ["PL-4.8"], route="Calendar"),
    page("planner", "leads", "Leads (kanban)", ["PL-2.2"], route="Leads"),
    page("planner", "lead-detail", "Lead Detail", ["PL-2.3", "PL-2.5"], route="Lead Detail"),
    page("planner", "proposal-builder", "Proposal Builder", ["PL-3.1", "PL-3.2"], route="Proposal Builder"),
    page("planner", "contract", "Contract (countersign)", ["PL-3.3", "PL-3.4"], route="Contract"),
    page("planner", "invoice", "Invoice", ["PL-3.5"], route="Invoice"),
    page("planner", "events-list", "Events list", ["PL-4.1"], route="Events"),
    page("planner", "event-hub-overview", "Event Hub › Overview", ["PL-4.2"], route="Event Hub › Overview"),
    page("planner", "event-hub-tasks", "Event Hub › Tasks", ["PL-4.3", "PL-4.4"], route="Event Hub › Tasks"),
    page("planner", "event-hub-guests", "Event Hub › Guests", ["PL-5.1", "PL-5.4"], route="Event Hub › Guests"),
    page("planner", "event-hub-website-rsvp", "Event Hub › Guests › Website & RSVP", ["PL-5.2"], route="Event Hub › Guests › Website & RSVP"),
    page("planner", "event-hub-invitations", "Event Hub › Guests › Invitations", ["PL-5.3"], route="Event Hub › Guests › Invitations"),
    page("planner", "event-hub-money", "Event Hub › Money", ["PL-4.7"], route="Event Hub › Money"),
    page("planner", "event-hub-files", "Event Hub › Files + Mood Board", ["PL-4.5"], route="Event Hub › Files"),
    page("planner", "event-hub-messages", "Event Hub › Messages", ["PL-4.6"], route="Event Hub › Messages"),
    page("planner", "settings", "Settings › Team & roles", ["PL-1.6"], route="Settings"),
    page("planner", "reschedule-event", "Reschedule event", ["PL-3.6"], route="Event Hub › Reschedule"),
    page("planner", "cancel-event", "Cancel event", ["PL-3.7"], route="Event Hub › Cancel"),

    # ---- Client ----
    page("client", "inquiry-form", "Inquiry Form", ["CL-1.1"], route="Inquiry Form"),
    page("client", "booking-page", "Public Booking Page", ["CL-1.2", "PL-2.4"], route="Public Booking Page"),
    page("client", "portal-proposal", "Portal › Proposal", ["CL-2.1", "CL-2.2"], route="Portal › Proposal"),
    page("client", "portal-contract", "Portal › Contract", ["CL-2.3"], route="Portal › Contract"),
    page("client", "portal-pay", "Portal › Pay", ["CL-2.4"], route="Portal › Pay"),
    page("client", "portal-home", "Portal › Home", ["CL-3.1", "CL-2.5"], route="Portal › Home"),
    page("client", "portal-questionnaire", "Portal › Questionnaire", ["CL-3.2"], route="Portal › Questionnaire"),
    page("client", "portal-approvals", "Portal › Approvals", ["CL-3.5", "CL-3.6"], route="Portal › Approvals"),
    page("client", "portal-payments", "Portal › Payments", ["CL-4.2", "CL-4.3"], route="Portal › Payments"),
    page("client", "portal-guests", "Portal › Guests", ["CL-3.4"], route="Portal › Guests"),
    page("client", "portal-messages", "Portal › Messages", ["CL-4.5"], route="Portal › Messages"),
    page("client", "portal-mood-board", "Portal › Mood Board", ["CL-3.3"], route="Portal › Mood Board"),
    page("client", "cancel-or-postpone", "Portal › Cancel or postpone", ["CL-4.4"], route="Portal › Cancel or postpone"),

    # ---- Guest ----
    page("guest", "invitation", "Invitation (basic, P1)", ["GU-1.2"], route="Invitation"),
    page("guest", "event-website", "Event Website", ["GU-1.3", "GU-2.3"], route="Event Website"),
    page("guest", "rsvp", "RSVP", ["GU-2.1", "GU-2.3"], route="RSVP"),
    page("guest", "rsvp-confirmation", "RSVP Confirmation", ["GU-2.2"], route="RSVP › Confirmation"),

    # ---- Staff ----
    page("staff", "invite-sign-in", "Staff Invite + Sign In", ["ST-1.1"], route="Invite"),
    page("staff", "profile", "Staff Profile", ["ST-1.2"], route="Profile"),

    # ---- Messages (the links between screens) ----
    page("messages", "push-new-lead", "🔔 New lead notification", ["PL-2.1"], route="🔔 lead.created"),
    page("messages", "email-inquiry-auto-reply", "✉ Inquiry auto-reply", ["CL-1.1", "PL-2.1"], route="✉ Inquiry auto-reply"),
    page("messages", "email-proposal", "✉ Your proposal (magic link)", ["CL-2.1", "PL-3.2"], route="✉ Your proposal"),
    page("messages", "email-receipt-welcome", "✉ Receipt + welcome", ["CL-2.4", "CL-2.5"], route="✉ Your date is locked"),
    page("messages", "sms-payment-reminder", "💬 Payment reminder", ["CL-4.1"], route="💬 Payment 2 reminder"),
    page("messages", "sms-invitation", "💬 Invitation text", ["GU-1.1", "PL-5.3"], route="💬 Invitation"),
    page("messages", "email-rsvp-confirmation", "✉ RSVP confirmation", ["GU-2.2"], route="✉ RSVP confirmed"),
    page("messages", "sms-team-invite", "💬 Team invite", ["ST-1.1"], route="💬 Team invite"),
    page("messages", "guest-reminders", "✉ Guest reminders (1 week + day before)", ["GU-4.1"], route="✉ One week to go"),

    # ---- Shared: backend and cross-cutting (not screens) ----
    page("shared", "event-bus", "Event bus (domain events)", ["SYS-1"], applies="Every \"→ System\" step in the journeys"),
    page("shared", "notifications", "Notifications (email / SMS / push)", ["SYS-2"], applies="Every page in messages/"),
    page("shared", "payments-backend", "Payments backend", ["SYS-3", "NFR-6"], applies="Portal › Pay, Portal › Payments, Invoice"),
    page("shared", "auth-magic-links", "Auth and magic links", ["NFR-1"], applies="Sign Up, every client portal page, Staff Invite"),
    page("shared", "multi-tenancy", "Multi-tenant isolation", ["NFR-2"], applies="Every page and API"),
    page("shared", "permissions", "Permissions", ["NFR-3"], applies="Every page and API; see Settings › Team & roles"),
    page("shared", "time-zones", "Time zones", ["NFR-5"], applies="Every date and time shown"),
    page("shared", "data-privacy", "Data deletion, export and privacy", ["NFR-7", "NFR-14"], applies="Guests, clients, photos"),
    page("shared", "imports", "Large imports", ["NFR-8"], applies="Event Hub › Guests, Portal › Guests"),
    page("shared", "performance", "Guest page performance", ["NFR-9"], applies="Every page in guest/"),
    page("shared", "accessibility-language", "Accessibility and language", ["NFR-10"], applies="Every guest and client page"),
    page("shared", "concurrent-editing", "Concurrent editing", ["NFR-11"], applies="Every planner editing screen"),
    page("shared", "errors-soft-delete", "Errors and soft delete", ["NFR-12", "NFR-13"], applies="Every page"),
    page("shared", "branding", "Branding everywhere", ["NFR-15"], applies="Every client, guest, vendor and donor page"),
]

STORY_HEAD = re.compile(r"^((?:PL|CL|GU|ST|VN|DN|SYS|NFR)-[\d.]+) · (.+) · (.+)$")


# ---------------------------------------------------------------------------
# Reading user_stories.md
# ---------------------------------------------------------------------------
def read_stories(lines):
    """Return {id: {title, phase, body: [lines]}}. A story = its heading + the
    non-blank lines under it (stories are separated by blank lines)."""
    stories, current = {}, None
    for line in lines:
        m = STORY_HEAD.match(line)
        if m:
            current = m.group(1)
            stories[current] = {"title": m.group(2), "phase": m.group(3), "body": []}
        elif current and line.strip():
            if not line.startswith("Page:"):
                stories[current]["body"].append(line)
        else:
            current = None
    return stories


def read_definition_of_done(lines):
    start = lines.index("Definition of Done (every story)") + 1
    done = []
    for line in lines[start:]:
        if not line.strip():
            break
        done.append(line)
    return done


def is_phase1(story):
    return story["phase"].startswith("P1")


# ---------------------------------------------------------------------------
# Writing markdown
# ---------------------------------------------------------------------------
def story_markdown(sid, story):
    """Turn one plain-text story into markdown: checkboxes become a task list."""
    out = [f"### {sid} · {story['title']} · {story['phase']}", ""]
    for line in story["body"]:
        if line.startswith("[ ]"):
            out.append("- " + line)
        elif line.startswith("    "):
            out.append("  - " + line.strip())
        elif line.startswith(("Screens:", "Events:")):
            out.append(f"_{line}_  ")
        else:
            out.append(line + "  ")
    return "\n".join(out)


def link(from_page, to_page):
    return f"[{to_page['title']}](../../{to_page['role']}/{to_page['folder']}/)"


def page_readme(p, stories, screen, related):
    lines = [
        f"# {p['title']}",
        "",
        "> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. "
        "**Edit stories there**, then re-run the script; edits made here get overwritten.",
        "",
        f"**Role:** {ROLES[p['role']]} · **Phase:** P1 · **Stories:** {', '.join(p['stories'])}",
    ]
    if screen:
        bits = [f"**Route:** `{screen['route']}`"]
        if screen.get("url"):
            bits.append(f"**URL:** `{screen['url']}`")
        if screen.get("snap"):
            bits.append(f"**Wireframe snapshot:** {screen['snap']}")
        lines.append(" · ".join(bits))
    if p["applies"]:
        lines.append(f"**Applies to:** {p['applies']}")
    lines.append("")

    # Wireframe
    lines.append("## Wireframe")
    lines.append("")
    if screen:
        lines.append("Desktop, tablet and phone views plus design notes, cropped from `wireframes/wireframe.html`.")
        lines.append("")
        lines.append(f"![{p['title']} wireframe](wireframe.png)")
    elif p["role"] == "shared":
        lines.append("Not a screen. This is backend / cross-cutting work that the pages listed under **Applies to** depend on.")
    else:
        lines.append(f"✏️ **Not drawn yet.** {p['gap']}")
    lines.append("")

    # Click path
    frm = screen["from"] if screen else p["frm"]
    nxt = screen["next"] if screen else p["nxt"]
    if frm or nxt:
        lines += ["## How you get here, and where you go next", "",
                  f"- ⬅ **Arrives from:** {frm}", f"- ➡ **Next:** {nxt}", ""]

    # Stories
    lines += ["## User stories", ""]
    for sid in p["stories"]:
        lines += [story_markdown(sid, stories[sid]), ""]

    # Notes from the wireframe stickies
    if screen and screen["notes"]:
        system = [n["text"] for n in screen["notes"] if n["kind"] == "sys"]
        design = [n["text"] for n in screen["notes"] if n["kind"] != "sys"]
        if system:
            lines += ["## → System (backend jobs)", ""] + [f"- {t}" for t in system] + [""]
        if design:
            lines += ["## Design notes", ""] + [f"- {t}" for t in design] + [""]

    if related:
        lines += ["## Related pages", "", "Pages that share a story with this one:", ""]
        lines += [f"- {link(p, r)}" for r in related] + [""]

    lines += ["## Tests", "", "See [`tests/README.md`](tests/README.md): one test per acceptance criterion.", ""]
    return "\n".join(lines)


def tests_readme(p, stories, done):
    lines = [
        f"# Tests to write: {p['title']}",
        "",
        "One test per acceptance criterion. Tick a box when its test exists **and** passes.",
        "This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.",
        "If a story changes in `user_stories.md`, update this list by hand.",
        "",
    ]
    for sid in p["stories"]:
        s = stories[sid]
        lines += [f"## {sid} · {s['title']}", ""]
        for l in s["body"]:
            if l.startswith("[ ]"):
                lines.append("- " + l.replace("[ ] ", "[ ] Test: ", 1))
            elif l.startswith("    "):  # indented sub-item under the criterion above
                lines.append("  - [ ] Test: " + l.strip())
        lines.append("")
    lines += ["## Definition of Done (every story)", ""] + ["- " + l for l in done if l.startswith("[ ]")] + [""]
    return "\n".join(lines)


def index_readme(pages, stories):
    lines = [
        "# Pages: one folder per screen / feature",
        "",
        "Every Phase 1 screen, message and backend feature has its own folder. Each folder holds:",
        "",
        "- `README.md`: route, wireframe, how you get there and where you go next, the full user stories with acceptance criteria, and design notes",
        "- `wireframe.png`: that screen's desktop, tablet and phone views (✏️ = not drawn yet)",
        "- `tests/README.md`: a checklist of tests to write, one per acceptance criterion",
        "",
        "## Keeping stories in sync",
        "",
        "Stories live in two places: `app_outline/user_stories.md` and the page READMEs.",
        "**Always edit `user_stories.md`**, then run:",
        "",
        "```bash",
        "python3 app_outline/pages/build_pages.py",
        "```",
        "",
        "The script rewrites every page README from `user_stories.md`, keeps a `Page:` link under each Phase 1 story,",
        "and prints a coverage check. It never overwrites `tests/README.md`.",
        "To add a page, add a line to `PAGES` in `build_pages.py` and run it again.",
        "",
        "### Refreshing wireframe images",
        "",
        "When `wireframes/wireframe.html` changes: serve the `wireframes/` folder, open it at 1940px wide, and",
        "(1) re-export `_wireframe_screens.json` from the page's `JOURNEYS`, (2) screenshot each `.screen-row`",
        "into its page folder as `wireframe.png`. Then run the script.",
        "",
    ]
    for role, label in ROLES.items():
        rows = [p for p in pages if p["role"] == role]
        lines += [f"## {label} ({len(rows)})", "", "| Page | Stories | Wireframe |", "|---|---|---|"]
        for p in rows:
            if p["route"]:
                wf = "✓"
            elif role == "shared":
                wf = "not a screen"
            else:
                wf = "✏️ not drawn yet"
            ids = ", ".join(f"{sid} {stories[sid]['title']}" for sid in p["stories"])
            lines.append(f"| [{p['title']}]({role}/{p['folder']}/) | {ids} | {wf} |")
        lines.append("")
    gaps = [p for p in pages if not p["route"] and p["role"] != "shared"]
    lines += ["## ✏️ Wireframe gaps found while building this", ""]
    lines += [f"- **[{p['title']}]({p['role']}/{p['folder']}/)**: {p['gap']}" for p in gaps]
    if not gaps:
        lines.append("None. Every Phase 1 page has a wireframe.")
    lines.append("")
    return "\n".join(lines)


def add_page_links(lines, stories, pages):
    """Put (or refresh) a 'Page:' line right under each Phase 1 story heading."""
    homes = {}
    for p in pages:
        for sid in p["stories"]:
            homes.setdefault(sid, []).append(f"pages/{p['role']}/{p['folder']}/")
    out, i = [], 0
    while i < len(lines):
        line = lines[i]
        out.append(line)
        m = STORY_HEAD.match(line)
        if m and is_phase1(stories[m.group(1)]):
            if i + 1 < len(lines) and lines[i + 1].startswith("Page:"):
                i += 1  # drop the old Page line; a fresh one is written below
            out.append("Page: " + ", ".join(homes.get(m.group(1), ["(no page yet)"])))
        i += 1
    return out


def write_if_changed(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return False
    path.write_text(text, encoding="utf-8")
    return True


# ---------------------------------------------------------------------------
def main():
    story_lines = STORIES_FILE.read_text(encoding="utf-8").split("\n")
    stories = read_stories(story_lines)
    done = read_definition_of_done(story_lines)
    screens = json.loads(SCREENS_FILE.read_text(encoding="utf-8"))
    screens_by_route = {s["route"]: s for s in screens}

    # Coverage checks: catch typos and forgotten stories/screens before writing anything
    problems = []
    mapped = {sid for p in PAGES for sid in p["stories"]}
    for sid in sorted(mapped - stories.keys()):
        problems.append(f"Unknown story ID in PAGES: {sid}")
    p1 = {sid for sid, s in stories.items() if is_phase1(s)}
    for sid in sorted(p1 - mapped):
        problems.append(f"Phase 1 story has no page: {sid}")
    routes = {p["route"] for p in PAGES if p["route"]}
    for r in sorted(routes - screens_by_route.keys()):
        problems.append(f"PAGES route not found in the wireframe: {r}")
    for r in sorted(screens_by_route.keys() - routes):
        problems.append(f"Wireframe screen has no page: {r}")
    if problems:
        raise SystemExit("Coverage problems:\n  " + "\n  ".join(problems))

    changed = 0
    for p in PAGES:
        folder = PAGES_DIR / p["role"] / p["folder"]
        screen = screens_by_route.get(p["route"])
        related = [q for q in PAGES if q is not p and set(q["stories"]) & set(p["stories"])]
        changed += write_if_changed(folder / "README.md", page_readme(p, stories, screen, related))
        tests = folder / "tests" / "README.md"
        if not tests.exists():
            changed += write_if_changed(tests, tests_readme(p, stories, done))
        if p["route"] and not (folder / "wireframe.png").exists():
            print(f"  ! missing wireframe.png in {p['role']}/{p['folder']}")
    changed += write_if_changed(PAGES_DIR / "README.md", index_readme(PAGES, stories))
    changed += write_if_changed(STORIES_FILE, "\n".join(add_page_links(story_lines, stories, PAGES)))

    print(f"Pages: {len(PAGES)} folders ({sum(1 for p in PAGES if p['route'])} with wireframes)")
    print(f"Phase 1 stories mapped: {len(p1 & mapped)}/{len(p1)}")
    print(f"Wireframe routes mapped: {len(routes)}/{len(screens_by_route)}")
    print(f"Files written or updated: {changed}")


if __name__ == "__main__":
    main()
