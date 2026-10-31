# Tests to write: Sign Up

One test per acceptance criterion. Tick a box when its test exists **and** passes.
This file is created once and never overwritten by `build_pages.py`, so your ticks are safe.
If a story changes in `user_stories.md`, update this list by hand.

## PL-1.1 · Sign up and create my business account

- [ ] Test: Sign up works with email + password, Google, or Apple
- [ ] Test: Creates a new tenant (business account) with me as Owner
- [ ] Test: An email that already has an account shows "Log in" and "Reset password" instead of an error dead end
- [ ] Test: Owner must set up a passkey or 2FA before seeing money or settings
- [ ] Test: Lands on the Onboarding Wizard

## Definition of Done (every story)

- [ ] Acceptance criteria pass, with automated tests for each
- [ ] Works at phone, tablet and desktop widths (see the 3 device views in the wireframes)
- [ ] Permissions checked on the server, not only by hiding buttons (NFR-3)
- [ ] Every query scoped by tenant (NFR-2)
- [ ] Plain-language errors with retry; no lost input (NFR-12)
- [ ] Guest and client screens meet WCAG 2.1 AA (NFR-10)
