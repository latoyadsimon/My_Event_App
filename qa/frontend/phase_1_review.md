# Phase 1 review: Planner setup

**Branch:** `feature/frontend-phase-1` (stacked on phase 0) · **Date:** 2026-10-31 · **Status:** waiting for the owner's approval

Phase 1 adds four screens: Sign Up, the Onboarding wizard, the Dashboard and Settings, with 9 sections. The setup forms are built once (`src/pages/planner/setup/`) and used by both the wizard and Settings, as the design note asks.

## Passing conditions

| Condition (from the approved plan) | Result |
|---|---|
| Sign up → finish or skip onboarding → land on the Dashboard with its checklist | ✅ Vitest (`planner-setup.test.jsx`) + Playwright run (`signup-secure`, `onboarding-business-new`, `dashboard-new-business` screenshots) |
| Packages made in onboarding show in Settings | ✅ The same `PackagesManager` and the same store; Vitest covers the starter packages |
| Dashboard alerts link to real screens | ✅ Every alert has `to` (tested); the link crawl visited 71 pages and found 0 dead links |
| Vitest | ✅ 86 tests in 7 files (up from 29) |
| Lint / build / contrast | ✅ / ✅ / ✅ 315 of 315 |
| Lighthouse accessibility ≥ 95 | ✅ 100 on Dashboard (mobile), Settings › Team (desktop), Onboarding (mobile) |
| Console | ✅ 0 errors |
| No sideways scroll at 375, 768 or 1280 | ✅ 11 pages × 3 widths |

## Story coverage

| Story | Acceptance criteria | Status |
|---|---|---|
| PL-1.1 Sign up | Email + password, Google or Apple · creates a business with me as Owner · an existing email shows Log in / Reset password · the owner sets up a passkey or 2FA before settings or money · lands on onboarding | ✅ All, simulated (no real Google/Apple/passkey until the backend exists) |
| PL-1.2 Business and branding | Name, logo upload, brand colors, optional custom domain · branding on client and guest pages · the wizard is skippable and resumable | ✅ The logo and color show on portal, guest and public pages (`BusinessMark`). A light color is darkened automatically with `brandInk`, and the page says so |
| PL-1.3 Payments | Stripe or Square · "Payments not connected" banner with Connect now · check/cash only until then | ✅ The banner shows on the Dashboard and in the wizard. Disconnecting asks first |
| PL-1.4 Packages and add-ons | Create, edit, archive packages and add-ons (price, unit, how many you own) | ✅ Archive and restore, never delete. "Start with Silver, Gold and Platinum" when empty. Photos are deferred (see below) |
| PL-1.5 Calendar | Google, Apple or Outlook two-way sync | ✅ Connect/disconnect is simulated; the sync itself is backend work |
| PL-1.6 Team and permissions | Invite by email or phone with a role · per-person switches · profit owner-only · Deactivate keeps history | ✅ Invites land in the Outbox with a `/join/…` link. Deactivate asks first |
| PL-1.7 Templates | Starter checklists per event type · editable message templates | ✅ Checklists per event type, auto-reply and payment reminder |
| PL-1.8 Getting-started checklist | Shown until done · each item links to its fix | ✅ Copy link marks "Share your inquiry form" done |

## Wireframe vs build

| Screen | Wireframe | Build | Notes |
|---|---|---|---|
| Sign Up | Headline, Google, Apple, or email + password, "Log in" link; error state for an existing email | Same. A second step, "Protect your account", follows | The passkey/2FA step comes from the wireframe's yellow note and PL-1.1 |
| Onboarding | Banner until payments connect; 6 numbered steps; "Step 2 of 6"; Back / Skip for now / Next | Same 6 steps in the same order. On phones only numbers show, plus the current step's name | Step 1 holds business details and branding together, as in the wireframe's card |
| Dashboard | 4 KPIs · Today & this week · Alerts (4) with Countersign · Pipeline (4) · empty-state checklist | Same blocks | **Deviations:** Alerts sits on the left, because it answers the screen's question ("what needs me?"). The checklist is first for a new business and last for an established one. KPIs are honest, computed numbers, so they differ from the wireframe's sample figures |
| Settings › Team & roles | Section list on the left; team table (Name, Role, Access); permissions card; Deactivate edge case | Same, plus a Status column (Invited / Active / Deactivated) | On phones the sections become a scrolling row, as the wireframe shows |

## Decisions and deviations

1. **Sign up replaces the demo business.** A new business starts empty, so you see the real first-run experience. **Reset demo** brings Bella Events back.
2. **Pretend connections:** Google, Apple, passkeys, Stripe, Square and calendars are stand-ins. Each "connect" takes half a second and shows "Connecting…", so the UI is ready for the real sign-in screens (OAuth).
3. **Package photos (PL-1.4) are deferred** to the Proposal Builder phase, where they're shown. The logo upload proves the upload pattern now.
4. **The demo data gained:**
   - the **Garza wedding**, booked Nov 2, so "Booked in November" is $9,650 and becomes $24,500 after Rivera, matching the wireframe;
   - 3 past events;
   - 14 tasks (1 late);
   - this week's appointments.
5. **Dev server gotcha (WSL):** files changed from the shell sometimes aren't noticed by the running Vite server. If the browser shows old code, `touch` the file or restart `npm run dev`. Noted in CLAUDE.md.

## Next: Phase 2 (Leads and selling)

Inquiry Form, Booking Page, Leads kanban, Lead Detail and Proposal Builder, plus the new-lead push, auto-reply and proposal emails.
