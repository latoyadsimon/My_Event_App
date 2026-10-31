# Event bus (domain events)

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Shared (backend & cross-cutting) · **Phase:** P1 · **Stories:** SYS-1
**Applies to:** Every "→ System" step in the journeys

## Wireframe

Not a screen. This is backend / cross-cutting work that the pages listed under **Applies to** depend on.

## User stories

### SYS-1 · Event bus · P1

As the dev team, we want every cross-role trigger published as a domain event so that one action updates everyone, and the logic doesn't live inside screens.  
- [ ] Job queue / event bus with retries and a dead-letter log
- [ ] Handlers are idempotent (safe to run twice)
- [ ] P1 events and their handlers:
  - lead.created → lead + conflict check + auto-reply + planner push (PL-2.1)
  - proposal.accepted → contract generated (PL-3.3)
  - contract.client_signed → signed PDF stored, invoice + schedule created, planner asked to countersign (CL-2.3, PL-3.5)
  - payment.succeeded → invoice balance, receipt, planner notified, portal unlocked (CL-2.4)
  - payment.failed → client retry prompt; planner alert after 2 failures (CL-2.4)
  - contract.countersigned → event Booked, hold → booking, gear reserved, checklist applied (PL-3.4)
  - event.rescheduled → relative dates shift, everyone rechecked and notified (PL-3.6)
  - rsvp.updated → headcount, meals, seating pool, potluck targets; client sees stats (GU-2.1)
  - headcount.locked → vendors notified, RSVPs closed (PL-5.4)
- [ ] Later phases add: potluck.claimed, shift.assigned/declined, equipment.checked_out/in, timeline.delayed, event.completed (P2); booth.printed, photo.created, karaoke.requested (P3); donation.created, bid.placed (P4)
- [ ] Rule: every "→ System" step in the journeys has an event here. Add the row when you add a step.

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
