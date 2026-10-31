# Payments backend

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Shared (backend & cross-cutting) · **Phase:** P1 · **Stories:** SYS-3, NFR-6
**Applies to:** Portal › Pay, Portal › Payments, Invoice

## Wireframe

Not a screen. This is backend / cross-cutting work that the pages listed under **Applies to** depend on.

## User stories

### SYS-3 · Payment webhooks · P1

As the dev team, we want payment status to come only from processor webhooks so that money is always correct.  
- [ ] Webhooks idempotent; late or duplicate webhooks are safe
- [ ] Refunds and disputes update the invoice; chargebacks alert the planner with an evidence pack (signed contract, receipts)

### NFR-6 · No double charges · P1

- [ ] Idempotency keys on every payment request

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
