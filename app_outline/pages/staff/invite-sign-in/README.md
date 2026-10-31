# Staff Invite + Sign In

> Generated from `app_outline/user_stories.md` by `pages/build_pages.py`. **Edit stories there**, then re-run the script; edits made here get overwritten.

**Role:** Staff · **Phase:** P1 · **Stories:** ST-1.1
**Route:** `Invite` · **URL:** `events.yourbiz.com/join/xyz789`

## Wireframe

Desktop, tablet and phone views plus design notes, cropped from `wireframes/wireframe.html`.

![Staff Invite + Sign In wireframe](wireframe.png)

## How you get here, and where you go next

- ⬅ **Arrives from:** 💬 team invite text
- ➡ **Next:** Download app → sign in with code → Profile

## User stories

### ST-1.1 · Join from an invite · P1

As a staff member, I want to join with my phone number and a code so that I have nothing to remember.  
_Screens: 💬 Team invite, Invite_  
- [ ] Invite text/email links to app download and sign-in
- [ ] Sign in with phone number + SMS code; expired/wrong code → [Send a new code]
- [ ] Linked to the business with the role the owner set
- [ ] Lost phone: the owner can revoke my sessions remotely

## → System (backend jobs)

- → System: links the staff member to the business with the role the owner set.

## Design notes

- No password to remember. Phone number + SMS code only.

## Related pages

Pages that share a story with this one:

- [💬 Team invite](../../messages/sms-team-invite/)

## Tests

See [`tests/README.md`](tests/README.md): one test per acceptance criterion.
