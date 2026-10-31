# Auth and magic links

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Shared (backend & cross-cutting) · **Phase:** P1 · **Stories:** NFR-1
**Applies to:** Sign Up, every client portal page, Staff Invite

## Wireframe

Not a screen. This is backend / cross-cutting work that the pages listed under **Applies to** depend on.

## User stories

### NFR-1 · Magic links and auth · P1

- [ ] Client/vendor magic links expire in 7 days; new links go only to the contact on file; a new device needs a one-time code
- [ ] Owner requires passkey or 2FA; the owner can revoke any session remotely

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
