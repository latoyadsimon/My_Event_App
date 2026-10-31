# RSVP Confirmation

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Guest · **Phase:** P1 · **Stories:** GU-2.2
**Route:** `RSVP › Confirmation` · **URL:** `events.yourbiz.com/rivera/rsvp/done`

## Wireframe

Desktop, tablet and phone views plus design notes, cropped from `wireframes/wireframe.html`.

![RSVP Confirmation wireframe](wireframe.png)

## How you get here, and where you go next

- ⬅ **Arrives from:** Submit RSVP
- ➡ **Next:** Add to calendar · Honeyfund ↗ · ✉ confirmation email arrives

## User stories

### GU-2.2 · Confirmation and changes · P1

As a guest, I want a confirmation and a way to change my RSVP so that I can fix mistakes.  
_Screens: RSVP Confirmation, ✉ RSVP confirmed_  
- [ ] Confirmation screen summarizes my reply, with [Add to calendar] and links to the fund (and potluck when on)
- [ ] Confirmation email/text with [Change my RSVP], which works until the cutoff
- [ ] After the cutoff: "RSVPs are closed" with [Message the host], unless the host allows late RSVPs

## → System (backend jobs)

- → System (rsvp.updated): headcount, meals, seating pool and potluck targets update; confirmation email/text; host notified if set.

## Related pages

Pages that share a story with this one:

- [✉ RSVP confirmation](../../messages/email-rsvp-confirmation/)

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
