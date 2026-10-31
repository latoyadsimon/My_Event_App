# Guest page performance

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Shared (backend & cross-cutting) · **Phase:** P1 · **Stories:** NFR-9
**Applies to:** Every page in guest/

## Wireframe

Not a screen. This is backend / cross-cutting work that the pages listed under **Applies to** depend on.

## User stories

### NFR-9 · Fast guest pages · P1

- [ ] Guest pages load in under 2 seconds on a phone; lightweight and cached
- [ ] 300 guests scanning a QR at once is fine; queue writes rate-limited per device (P3 karaoke)

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
