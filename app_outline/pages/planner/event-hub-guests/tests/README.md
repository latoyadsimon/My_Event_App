# Tests to write: Event Hub › Guests

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-5.1 · Guest list

- [ ] Test: Import from CSV/Excel, phone contacts or Google Contacts; the client can add guests too (CL-3.4)
- [ ] Test: Group into households; set plus-ones per household
- [ ] Test: Tags (family, work, VIP, kids…), notes and gift tracking
- [ ] Test: Live counts: attending / declined / maybe / no reply, and meal counts; allergies shown prominently and never dropped on import/export
- [ ] Test: [Remind non-responders] sends a one-tap reminder
- [ ] Test: Imports of 1,000+ rows run in the background with a progress bar (NFR-8)

## PL-5.4 · Lock the final headcount

- [ ] Test: [Lock final headcount] is available once the client approves the final headcount
- [ ] Test: Locking closes RSVPs, finalizes counts, and notifies vendors with a change summary
- [ ] Test: Locked state shows who approved it and when

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
