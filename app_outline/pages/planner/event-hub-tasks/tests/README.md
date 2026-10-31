# Tests to write: Event Hub › Tasks

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-4.3 · Tasks and checklists

- [ ] Test: Checklist from the event-type template, with due dates relative to the event ("30 days before")
- [ ] Test: Assign to me, a staff member, the client or a vendor; subtasks; attachments; reorder; add custom tasks
- [ ] Test: Client-assigned tasks appear in the client's "Needs your action"
- [ ] Test: Due-date reminders; late tasks flagged
- [ ] Test: Due dates recalculate if the event date moves (PL-3.6)

## PL-4.4 · Send questionnaires

- [ ] Test: Send from a task, or automatically at a set point (e.g. "Wedding details" 90 days out)
- [ ] Test: Client answers populate event fields; the task is marked done; Overview shows "received"

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
