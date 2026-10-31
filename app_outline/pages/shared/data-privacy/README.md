# Data deletion, export and privacy

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Shared (backend & cross-cutting) · **Phase:** P1 · **Stories:** NFR-7, NFR-14
**Applies to:** Guests, clients, photos

## Wireframe

Not a screen. This is backend / cross-cutting work that the pages listed under **Applies to** depend on.

## User stories

### NFR-7 · Data deletion and export · P1

- [ ] Guest/client data-deletion request flow; keep only what's legally required (payment records)
- [ ] Automatic backups; the owner can export all their data

### NFR-14 · Privacy and minors · P1 (P3 for photos)

- [ ] No data capture from guests marked as children; booth email capture disabled for them
- [ ] Photo sharing and data capture need consent; kids' party galleries default to private

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
