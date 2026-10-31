# Multi-tenant isolation

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Shared (backend & cross-cutting) · **Phase:** P1 · **Stories:** NFR-2
**Applies to:** Every page and API

## Wireframe

Not a screen. This is backend / cross-cutting work that the pages listed under **Applies to** depend on.

## User stories

### NFR-2 · Multi-tenant isolation · P1

- [ ] Every query scoped by tenant ID; automated tests prove one business can't see another's data

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
