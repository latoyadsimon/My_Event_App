# Phase 13 review: Photo booth, magnets, galleries and thank-yous (product P3, part 2)

**Branch:** `feature/frontend-phase-13` (stacked on phase 12)

**Stories:**
- **Setup and choices:** PL-6.4 (booth part) · CL-3.7 (overlay, magnet frame).
- **At the venue:** GU-5.3 Photo booth · GU-5.4 Photo magnets · GU-5.6 Live gallery · ST-4.4 Booth attendant panel.
- **Afterwards:** CL-6.1 Gallery · CL-6.2 Thank-you tracker · GU-6.1 Thank-you and gallery · PL-8.4 (guest thank-you with the gallery link).
- **Panels and privacy:** PL-7.2 / PL-8.5 (booth numbers) · NFR-14 (kids' photos).

## Passing conditions

| Condition | Result |
|---|---|
| Booth setup: overlay, print limits, copies, magnets | ✅ Logistics › Booth & karaoke › Photo booth. Also: gallery closing date, private gallery, offline download, and links to the kiosk, slideshow, guest gallery and magnet page |
| Client picks overlay + magnet frame | ✅ Portal › Booth & karaoke, with a live preview tile |
| Kiosk: tap to start, countdown, retake; share by text/email/QR; prints come out | ✅ `/booth/<event>` in the event theme: 3-2-1 → three shots → Retake / Looks great → share (optional) → "Your prints are coming out!" |
| Sharing is opt-in; "Don't show on slideshow" | ✅ Contact is optional and used only to send the photos. The toggle keeps them in the gallery but off the big screen |
| No email capture for children | ✅ "Is anyone in these photos under 13?" → Yes: no contact field, photos private (off the slideshow and the guest gallery; the hosts still see them, marked private) |
| Magnets: phone upload at the station QR, or roaming staff; pick up at the station | ✅ `/e/<event>/magnet` → the attendant's magnet queue → crop (center / faces / whole) → Print magnet. Stops when the included magnets run out |
| Attendant: PIN, print queue, reprint, paper/ink, hide from slideshow | ✅ `/app/booth/<event>` (and the staff app). Demo PIN 2468 |
| Printer jam / out of paper: pause, queue holds, alert; inventory updated | ✅ Prints are "held". The planner gets a push. "Fixed: resume printing" prints what was held. Paper and ink count down per copy; the printer goes "out" at 0 sheets |
| Tablet dies: another device picks up | ✅ "Take over here" on a second device; the data is shared, so nothing is lost |
| Live gallery on the big screen | ✅ `/screen/gallery/<event>`: newest 12, without hidden or kids' photos |
| Client gallery: booth, magnets, guest uploads; Download all; expiry | ✅ Portal › Gallery (from the event day on), with source filters, "Download all" (zip stand-in) and the closing date |
| Thank-you tracker | ✅ Portal › Thank-yous: gifts per guest (editable), tick when sent, "1 of 3 sent". Seeded with Thompson sympathy gifts |
| Guests: view/download, upload their own, post a recipe (potluck) | ✅ `/e/<event>/gallery` (EN/ES). The booth's text opens "Your booth photos" first. Private galleries need the guest's link; closed galleries say so |
| Thank-you with the gallery link | ✅ Wrap-up › "Send thank-you + gallery link" to everyone who came |
| Booth numbers in Day-of and the report | ✅ Sessions, prints, magnets, photos |
| Tests | ✅ **408 in 31 files** (+12 store, +13 screen) |
| Lint, contrast, scroll, console | ✅ 0 / 315 of 315 / none at 375 or 1280 / 0 (dev and production build) |
| Lighthouse a11y | ✅ 100: kiosk (share step), slideshow, guest gallery (mobile) |

## Fixed during QA
- **Skip link:** the "Skip to content" link had no target on full-screen pages (kiosk, slideshow, karaoke screen, print). They now have `id="main"` (98 → 100).
- **Dark event themes:** form fields and outline buttons on the kiosk didn't follow the theme (input text 1.1:1). The venue screens now map the app tokens onto the theme like guest pages do.
- **Bundle size:** the main bundle crossed 500 kB. React and the router are now their own chunk (Vite 8 `codeSplitting` groups): app 243 kB + react 258 kB, and no warning.

## Stand-ins
- **Camera and printer:** there are none. Shots are drawn tiles in the event's overlay; guest and magnet uploads show the real image (kept in the tab).
- **Downloads:** "Download all" prepares a stand-in zip.

Screenshots: `qa/frontend/screens/phase-13/`.
