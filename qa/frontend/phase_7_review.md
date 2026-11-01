# Phase 7 review: Polish, the full walkthrough, and the docs

**Branch:** `feature/frontend-phase-7` (stacked on phase 6)

## Passing conditions

| Condition | Result |
|---|---|
| The whole Rivera timeline, end to end, as each role | ✅ `qa/frontend/rivera-walkthrough.js`: **11 of 11 steps pass**, 0 console errors (screenshots in `screens/walkthrough/`). The steps: Ana opens the v2 email → accepts, signs, pays $4,455 → LaToya countersigns → adds Lucia and texts the invitation → Lucia RSVPs for two with meals → the planner sees 2 attending and asks for headcount approval → Ana approves → LaToya locks → Ana pays $5,940 → Money shows $4,455 left → Jo joins by phone code |
| Empty, error, loading and undo states | ✅ Every list has an empty state; forms keep input and say what to fix; **new:** a page crash shows "Something went wrong on this page" + Try again (error boundary), and lazy pages show a slim loading bar; soft delete + **Undo** for tasks, guests and files |
| Motion pass | ✅ A 180 ms fade-and-lift on page change and an unfolding invitation card. Both are off for `prefers-reduced-motion` and for the respectful tone (memorials). The booking slots, steps and toasts use the existing tokens |
| Lighthouse accessibility ≥ 95 | ✅ **100** on every page type checked across phases 2–7: leads, proposal builder, booking page, invoice, contract, guests, calendar, portal home, event website, help |
| Guest-page performance | ✅ A cold load of `/i/<token>` on the production build: **LCP 181 ms, CLS 0.00**. *Lighthouse here reports accessibility, not performance, so the trace stands in for the ≥ 90 score* |
| Code splitting | ✅ Main bundle **557 kB → 409 kB**; each page is its own chunk (1–20 kB), so a guest no longer downloads the planner app. The Vite size warning is gone |
| 0 console errors | ✅ Walkthrough and crawl |
| No sideways scroll | ✅ Checked in every phase; Help at 375 too |
| Link crawl | ✅ **97 pages, 0 dead links.** No `Planned` placeholders remain (the component was removed in Phase 6). Staff Phase-2 tabs stay locked by design |
| README and CLAUDE.md updated | ✅ Plus `documentation/README.md` (front end, and how its actions map to Supabase) and the new **How-To guide** |
| Vitest | ✅ **263 tests in 18 files**: the Help page, every "Show me" link opening a real screen, and the crash screen |

## What changed

1. **`lib/lazyPage.js`:** pages load on first visit. Tests preload them all (`src/test/setup.js`).
   - **Bug the walkthrough caught:** the first version called `use()` only while loading. React requires a hook on every render, and logged a warning. It now always calls `use()`, on a promise marked fulfilled once loaded.
2. **`components/shell/PageFrame.jsx`:** the Suspense fallback, the error boundary and the page fade, in every layout.
3. **Help + How-To:**
   - `src/data/howTo.js` is the one source for the `/help` page and `documentation/HOW_TO.md` (8 sections, 33 steps, 22 screenshots in `documentation/how_to/`).
   - Every step has a **Show me** button that opens that screen as the right person. A test checks each one.
   - Help is linked from the demo bar and the planner sidebar.
4. **Contract layout shift:** the signature lines reserve their height, so the script font no longer pushes content when it loads.

## For the joint review before Supabase

- **Stand-ins to replace**, each listed in the phase reviews:
  - Google/Apple sign-in, passkeys and SMS codes;
  - Stripe/Square checkout and webhooks;
  - email/SMS/push (the Outbox);
  - file storage (uploads live in the tab);
  - calendar sync;
  - scheduled reminders.
- **Deferred features:**
  - QR codes;
  - forwarded-link detection;
  - co-host disagreement on approvals;
  - task attachments;
  - P3 Invitation Designer;
  - translating the planner's own text into Spanish (the app's words are translated; the host's welcome/FAQ stay as written).
- **The hand-off map:** `documentation/README.md` §3.5 lists which front-end action becomes which Supabase function.
