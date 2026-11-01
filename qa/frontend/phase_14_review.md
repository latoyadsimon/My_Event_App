# Phase 14 review: Invitation designer and real QR codes (finishes product P3)

**Branch:** `feature/frontend-phase-14` (stacked on phase 13)

**Stories:** PL-5.5 Invitation designer. QR codes, which were stand-ins since P1, are now real.

## Passing conditions

| Condition | Result |
|---|---|
| Template gallery by event type, plus my branded templates | ✅ Guests › Invitations › **Open the designer**. The 27 event themes, "Best for this event" first, then "More templates". "My templates" holds the planner's own looks (seeded: *Bella signature*). **Save as my template** adds the current design |
| Edit fonts, colors, photos, wording | ✅ Display font (the themes' 12 faces), layout (round photo / photo across the top), accent color, photo upload. Wording stays on Invitations (one source for every invite type) |
| Colors stay readable | ✅ A picked accent is darkened or lightened until it reaches 3:1 on the card (display text). Button text picks black or white for 4.5:1. Tested with a pale yellow on a light card |
| Optional animated envelope and music, always with Skip | ✅ The envelope flap lifts open (no animation for reduced motion). **Skip** goes straight to the card. Music starts only when a guest *taps* Open (never on Skip), with a mute toggle. EN/ES |
| Print-ready card with a QR to the online RSVP | ✅ `/print/events/<event>/invitation`: a 5×7 in `@page` card with a scannable QR to `/e/<event>/rsvp` |
| QR codes everywhere they were promised | ✅ Added the `qrcode-generator` dependency (no dependencies of its own). Real QRs on: the invitation print, the karaoke big screen (request a song), the booth kiosk share step and the slideshow (gallery), and the guest's check-in code after an RSVP (GU-5.1) |
| The Invitations page and the guest invitation show the design | ✅ Both draw the shared `InvitationCard`. The guest invitation keeps its `h1` |
| Tests | ✅ **416 in 33 files** (+3 store, +5 screen) |
| Lint, build, contrast, a11y, scroll, console | ✅ 0 / OK (app chunk 266 kB) / 315 of 315 / Lighthouse 100 (designer, guest envelope on mobile) / none at 375 or 1280 / 0 |

## Fixed during QA
- **Envelope backdrop:** on a dark event page with a light invitation template, the guest's name on the envelope was dark-on-dark. The envelope now carries its own backdrop from the invitation's theme.

## Notes
- **`npm audit`:** 6 moderate warnings, all in eslint dev tooling that was already there. Nothing comes from the new QR library.
- **Music:** a stand-in (the toggle shows the state); audio files come with the backend's storage.

**Product Phase 3's front end is now complete:** phases 12–14.
