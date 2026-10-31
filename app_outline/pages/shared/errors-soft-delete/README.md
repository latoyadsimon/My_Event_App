# Errors and soft delete

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Shared (backend & cross-cutting) · **Phase:** P1 · **Stories:** NFR-12, NFR-13
**Applies to:** Every page

## Wireframe

Not a screen. This is backend / cross-cutting work that the pages listed under **Applies to** depend on.

## User stories

### NFR-12 · Errors · P1

- [ ] Plain-language message, a retry, no lost input; error logged with context

### NFR-13 · Soft delete · P1

- [ ] Deletes are soft with 30-day restore; destructive actions ask for confirmation

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
