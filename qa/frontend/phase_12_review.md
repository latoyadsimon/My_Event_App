# Phase 12 review: Karaoke (product P3, part 1)

**Branch:** `feature/frontend-phase-12` (stacked on phase 11)

**Stories:**
- PL-6.4 Booth and KJ setup (KJ part) · CL-3.7 Karaoke lists · GU-5.5 Request a karaoke song · ST-4.5 KJ console.
- PL-7.2 (karaoke queue panel) · PL-8.5 (karaoke stats).

## Passing conditions

| Condition | Result |
|---|---|
| KJ setup: content filter, client's do-not-play list, offline download | ✅ Logistics › **Booth & karaoke**: on/off, Clean only / All songs, KJ (staff with the KJ skill), songs per singer, contest mode, must-play / do-not-play / banned pickers, "Download for offline", links to the console, big screen and guest page. Karaoke on a proposal turns this on at countersign |
| Client picks must-play and do-not-play songs | ✅ Portal › **Karaoke** (shown when the event has karaoke). Saving pushes the planner |
| Guest: table QR, search by title/artist, name/stage name, duets | ✅ `/e/<event>/karaoke`. No privacy gate, because its QR is only at the venue. EN/ES |
| Blocked songs unavailable without shaming; clean version suggested | ✅ "Not available tonight · Try the clean version: Forget You". Both the explicit filter and the client's list block a song |
| My place in line; text when 2 singers away | ✅ Each of this phone's requests shows "You're up next!" / "You're #3 in line" / "You're on!", live. *Next singer* texts the guest who is now 2 away (once) |
| Requests from phones + manual (paper/verbal) | ✅ Console › "Add a paper or verbal request". Phones are limited to 2 waiting songs per singer (NFR-9 rate limit) |
| Fair rotation; drag to adjust; bump VIPs | ✅ A 2nd song waits until everyone ahead has had a first. ↑ ↓ (keyboard-friendly instead of drag), **VIP** jumps to next, remove with Undo |
| Next singer updates the screens | ✅ `/screen/karaoke/<event>`: now singing, up next 3, how to request, all in the event theme at huge sizes |
| No-shows to the end once, then removed | ✅ For the singer or whoever is up next |
| Contest mode: judge scoring and results on screen | ✅ 3 judges score 1–10, averaged; leaderboard on the console and big screen |
| Background music | ✅ A toggle (a stand-in: no audio in the demo) |
| Live panel + report | ✅ "Karaoke line: 2 waiting · 1 sung" in Day-of; report: songs, singers, most sung (Okafor: 6 songs, 5 singers, "September") |
| Staff KJ | ✅ Staff › Day-of for the KJ shift → "Open the KJ console" (`/app/staff/kj/<event>`) |
| Tests | ✅ **383 in 29 files** (+10 store, +8 screen) |
| Lint, build, contrast, a11y, scroll, console | ✅ 0 / OK / 315 of 315 / Lighthouse 100 (guest request, KJ console) / none at 375 or 1280 / 0 |

**Fixed during QA:** the outline buttons on the dark "Now singing" card were dark-on-dark. They're now light outlines.

Screenshots: `qa/frontend/screens/phase-12/`.

## Notes
- **Song catalog:** 36 songs seeded (licensing and a real catalog come with the backend). Explicit songs point at their clean edit when there is one.
- **Practice mode:** the console works before the event day so the KJ can rehearse; a notice says so.
