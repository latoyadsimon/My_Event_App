# Tests to write: Portal › Approvals

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## CL-3.5 · Approve invitation wording

- [ ] Test: See the design and wording; [Approve] or [Request changes] with a comment

## CL-3.6 · Approvals

- [ ] Test: Waiting / Done / Coming up lists (e.g. menu, timeline, floor plan, final headcount)
- [ ] Test: [Approve] or [Request changes] with comment; each response logged with who and when
- [ ] Test: Co-hosts disagree: both names and responses shown; the planner decides; nothing proceeds automatically
- [ ] Test: Final headcount approval opens on its date and triggers the planner's lock (PL-5.4)

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
