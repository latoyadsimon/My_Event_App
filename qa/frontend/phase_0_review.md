# Phase 0 review: Foundation

**Branch:** `feature/frontend-phase-0` · **Date:** 2026-10-31 · **Status:** waiting for the owner's approval

Phase 0 builds the frame every later phase fills in:
- the router with every route;
- the layouts for each audience;
- the in-memory store and seed data;
- the demo role switcher and the Outbox;
- Calm/Bold;
- the test setup.

Screens a later phase builds show a placeholder that names the phase and keeps the click path working.

## Passing conditions

| Condition (from the approved plan) | Result |
|---|---|
| Every route renders (a placeholder is OK) | ✅ 61 URLs visited by the Playwright crawl |
| Automated link crawl finds 0 dead links | ✅ 0 dead links, 0 console errors |
| Shells match the wireframe chrome (sidebar, bottom bar "More (n)", portal tabs) | ✅ see the comparison below |
| Calm/Bold switches live | ✅ Settings › Appearance (Vitest + screenshot) |
| Vitest is in CI | ✅ `npm test` step added to the `frontend` job |
| Vitest passes | ✅ 29 tests in 3 files |
| `npm run lint` / `build` / `check:contrast` | ✅ / ✅ / ✅ 315 of 315 |
| Lighthouse accessibility ≥ 95 | ✅ 100 on all 5 pages tested: landing, memorial Event Hub, guest page, Outbox, client portal |
| Chrome DevTools console | ✅ 0 errors, 0 warnings |
| No sideways scroll at 375, 768 or 1280 | ✅ 13 pages × 3 widths |

## Wireframe vs build (structure, not looks)

| Area | Wireframe (`wireframes/wireframe.html` `shell()`) | Build | Screens |
|---|---|---|---|
| Planner nav | Dashboard · Leads · Calendar · Events · Settings | Same 5, same order | `planner-dashboard-*.png` |
| Desktop | Left sidebar | Sidebar: Crowned wordmark, business name, nav; byline in the footer | `*-1280.png` |
| Tablet | Top tabs | Top bar plus a row of tabs | `*-768.png` |
| Phone | Bottom bar with 4 items + More; the active item takes the 4th slot | Same rule (`AppShell` `BottomBar`), tested in Vitest | `planner-more-open-bold-375.png` |
| Client portal | Home · Proposal · Payments · Guests · Mood Board · Approvals · Messages. Before the deposit: Home, Guests, Mood Board and Approvals locked, "Unlocks after your deposit" | Same, with a lock icon and the note. Messages stays open | `portal-before-deposit-*.png` |
| Event Hub | Header with Change date / Cancel event; tabs Overview · Tasks · Guests · Money · Files · Messages; Guests sub-tabs | Same. The memorial event is in the respectful tone | `event-hub-*.png` |
| Guest pages | No app nav, EN \| ES, planner's logo in the footer | Same. Event theme colors and fonts; "Planned by Bella Events" plus "Powered by Crowned" | `guest-website-*.png` |
| Staff | My Shifts · Day-of · Chat · Profile; Phase 2 items locked | Same: 3 locked "Coming in Phase 2" | `staff-profile-*.png` |
| Messages | 8 email / text / push frames | Outbox page draws each type, and its button opens the real screen as that person | `outbox-*.png` |

## Decisions and deviations (with reasons)

1. **The demo bar** (Viewing as · Outbox · Reset) sits above every page.
   - It isn't in the wireframes: it's a demo tool, and it uses plain inverted colors so it never reads as part of the product.
   - It goes away when real sign-in arrives.
2. **"Today" is fixed at Thu Nov 5, 2026, 6 PM** (`src/lib/clock.js`).
   - Rivera is seeded at "proposal v2 sent", so you can play the booking yourself.
   - A mid-planning event (Acme holiday party, Dec 12) and a memorial (Thompson, Nov 14) give the Event Hub and the respectful tone real content.
3. **Active nav** uses the accent fill, as the style guide says (§4/§7).
   - The taste skill prefers a neutral active item.
   - The plan says the style guide wins when they conflict.
4. **KPIs are type, not tiles.** The `Kpis` component draws one panel split by hairlines, with no icons or sparklines (taste skill, app screens). It's ready for the Phase 1 Dashboard.
5. **Appearance previews use fixed colors.** They are pictures of the *other* mode, so they can't use the current mode's variables. They're decorative and hidden from screen readers.
6. **SEO:** `public/robots.txt` keeps the demo out of search engines (Lighthouse SEO shows "blocked from indexing" by design). A meta description was added.

## What's in the code

- **Entry and routes:** `src/main.jsx` (BrowserRouter + StoreProvider); `src/App.jsx` (every route); `src/routes/screens.js` (each screen's phase, design folder and next links).
- **Store:** `src/store/` holds `reducer.js` (pure, tested), `StoreContext.jsx` and `selectors.js`; `src/data/seed.js` holds the Nov 5 world.
- **Layouts:** `src/layouts/` holds Root, RequireRole, Planner, EventHub (+ GuestSubTabs), Portal, Public, Guest, Staff and Crowned.
- **Components:** `src/components/` holds `shell/` (AppShell, DemoBar, Toasts), `brand/` (Lockup, BusinessMark, PoweredBy) and `ui/` (Button, Card, PageHeader, StatusChip, Kpis, Money, Field, EmptyState, Icon).
- **Pages:** `src/pages/shared/` holds Landing, SignIn, Outbox, NoAccess, NotFound and Planned; `src/pages/planner/settings/` holds SettingsLayout and Appearance.
- **Tests:** `src/lib/lib.test.js`, `src/store/reducer.test.js`, `src/App.test.jsx`.

## Next: Phase 1 (Planner setup)

Sign Up, Onboarding (5 steps, skip/resume), Dashboard, and Settings (Business, Branding, Packages, Payments, Team & roles).
