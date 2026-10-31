# Tests to write: Event bus (domain events)

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## SYS-1 · Event bus

- [ ] Test: Job queue / event bus with retries and a dead-letter log
- [ ] Test: Handlers are idempotent (safe to run twice)
- [ ] Test: P1 events and their handlers:
  - [ ] Test: lead.created → lead + conflict check + auto-reply + planner push (PL-2.1)
  - [ ] Test: proposal.accepted → contract generated (PL-3.3)
  - [ ] Test: contract.client_signed → signed PDF stored, invoice + schedule created, planner asked to countersign (CL-2.3, PL-3.5)
  - [ ] Test: payment.succeeded → invoice balance, receipt, planner notified, portal unlocked (CL-2.4)
  - [ ] Test: payment.failed → client retry prompt; planner alert after 2 failures (CL-2.4)
  - [ ] Test: contract.countersigned → event Booked, hold → booking, gear reserved, checklist applied (PL-3.4)
  - [ ] Test: event.rescheduled → relative dates shift, everyone rechecked and notified (PL-3.6)
  - [ ] Test: rsvp.updated → headcount, meals, seating pool, potluck targets; client sees stats (GU-2.1)
  - [ ] Test: headcount.locked → vendors notified, RSVPs closed (PL-5.4)
- [ ] Test: Later phases add: potluck.claimed, shift.assigned/declined, equipment.checked_out/in, timeline.delayed, event.completed (P2); booth.printed, photo.created, karaoke.requested (P3); donation.created, bid.placed (P4)
- [ ] Test: Rule: every "→ System" step in the journeys has an event here. Add the row when you add a step.

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
