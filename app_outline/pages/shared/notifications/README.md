# Notifications (email / SMS / push)

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Shared (backend & cross-cutting) · **Phase:** P1 · **Stories:** SYS-2
**Applies to:** Every page in messages/

## Wireframe

Not a screen. This is backend / cross-cutting work that the pages listed under **Applies to** depend on.

## User stories

### SYS-2 · Notifications · P1

As the dev team, we want one notification service for email, SMS and push so that delivery rules live in one place.  
- [ ] Email (e.g. SendGrid), SMS (e.g. Twilio), push; templates editable by the planner
- [ ] Bounces and STOP opt-outs mark the contact undeliverable; opt-outs honored; the planner sees who didn't receive what
- [ ] Scheduled sends (reminders, invitations)

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
