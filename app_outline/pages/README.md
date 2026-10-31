# Pages: one folder per screen / feature

Every Phase 1 screen, message and backend feature has its own folder. Each folder holds:

- `README.md`: route, wireframe, how you get there and where you go next, the full user stories with acceptance criteria, and design notes
- `wireframe.png`: that screen's desktop, tablet and phone views (✏️ = not drawn yet)
- `tests/README.md`: a checklist of tests to write, one per acceptance criterion

## Keeping stories in sync

Stories live in two places: `app_outline/user_stories.md` and the page READMEs.
**Always edit `user_stories.md`**, then run:

```bash
python3 app_outline/pages/build_pages.py
```

The script rewrites every page README from `user_stories.md`, keeps a `Page:` link under each Phase 1 story,
and prints a coverage check. It never overwrites `tests/README.md`.
To add a page, add a line to `PAGES` in `build_pages.py` and run it again.

### Refreshing wireframe images

When `wireframes/wireframe.html` changes: serve the `wireframes/` folder, open it at 1940px wide, and
(1) re-export `_wireframe_screens.json` from the page's `JOURNEYS`, (2) screenshot each `.screen-row`
into its page folder as `wireframe.png`. Then run the script.

## Planner (Owner) (21)

| Page | Stories | Wireframe |
|---|---|---|
| [Sign Up](planner/sign-up/) | PL-1.1 Sign up and create my business account | ✓ |
| [Onboarding Wizard](planner/onboarding/) | PL-1.2 Business profile and branding, PL-1.3 Connect payments, PL-1.4 Service packages and add-ons, PL-1.5 Connect my calendar, PL-1.7 Starter templates | ✓ |
| [Dashboard](planner/dashboard/) | PL-1.8 Getting-started checklist | ✓ |
| [Calendar](planner/calendar/) | PL-4.8 Calendar | ✓ |
| [Leads (kanban)](planner/leads/) | PL-2.2 Leads board | ✓ |
| [Lead Detail](planner/lead-detail/) | PL-2.3 Respond to a lead, PL-2.5 Create a proposal from the lead | ✓ |
| [Proposal Builder](planner/proposal-builder/) | PL-3.1 Build a proposal, PL-3.2 Send a proposal and handle changes | ✓ |
| [Contract (countersign)](planner/contract/) | PL-3.3 Contract generated from my template, PL-3.4 Countersign after the client signs and pays | ✓ |
| [Invoice](planner/invoice/) | PL-3.5 Invoice and payment schedule | ✓ |
| [Events list](planner/events-list/) | PL-4.1 Events list | ✓ |
| [Event Hub › Overview](planner/event-hub-overview/) | PL-4.2 Event Hub overview | ✓ |
| [Event Hub › Tasks](planner/event-hub-tasks/) | PL-4.3 Tasks and checklists, PL-4.4 Send questionnaires | ✓ |
| [Event Hub › Guests](planner/event-hub-guests/) | PL-5.1 Guest list, PL-5.4 Lock the final headcount | ✓ |
| [Event Hub › Guests › Website & RSVP](planner/event-hub-website-rsvp/) | PL-5.2 Event website and RSVP settings | ✓ |
| [Event Hub › Guests › Invitations](planner/event-hub-invitations/) | PL-5.3 Send invitations | ✓ |
| [Event Hub › Money](planner/event-hub-money/) | PL-4.7 Money tab | ✓ |
| [Event Hub › Files + Mood Board](planner/event-hub-files/) | PL-4.5 Files and mood board | ✓ |
| [Event Hub › Messages](planner/event-hub-messages/) | PL-4.6 Messages | ✓ |
| [Settings › Team & roles](planner/settings/) | PL-1.6 Invite staff and set permissions | ✓ |
| [Reschedule event](planner/reschedule-event/) | PL-3.6 Reschedule an event | ✓ |
| [Cancel event](planner/cancel-event/) | PL-3.7 Cancel an event | ✓ |

## Client (Host) (13)

| Page | Stories | Wireframe |
|---|---|---|
| [Inquiry Form](client/inquiry-form/) | CL-1.1 Send an inquiry without an account | ✓ |
| [Public Booking Page](client/booking-page/) | CL-1.2 Book a consult, PL-2.4 Consult booking | ✓ |
| [Portal › Proposal](client/portal-proposal/) | CL-2.1 Open my proposal with a magic link, CL-2.2 Review and customize the proposal | ✓ |
| [Portal › Contract](client/portal-contract/) | CL-2.3 Sign the contract | ✓ |
| [Portal › Pay](client/portal-pay/) | CL-2.4 Pay the deposit right after signing | ✓ |
| [Portal › Home](client/portal-home/) | CL-3.1 Portal home, CL-2.5 First portal visit | ✓ |
| [Portal › Questionnaire](client/portal-questionnaire/) | CL-3.2 Fill a questionnaire | ✓ |
| [Portal › Approvals](client/portal-approvals/) | CL-3.5 Approve invitation wording, CL-3.6 Approvals | ✓ |
| [Portal › Payments](client/portal-payments/) | CL-4.2 Payments page, CL-4.3 Approve a change order | ✓ |
| [Portal › Guests](client/portal-guests/) | CL-3.4 Manage my guest list | ✓ |
| [Portal › Messages](client/portal-messages/) | CL-4.5 Message my planner | ✓ |
| [Portal › Mood Board](client/portal-mood-board/) | CL-3.3 Mood board | ✓ |
| [Portal › Cancel or postpone](client/cancel-or-postpone/) | CL-4.4 Ask to cancel or postpone | ✓ |

## Guest (4)

| Page | Stories | Wireframe |
|---|---|---|
| [Invitation (basic, P1)](guest/invitation/) | GU-1.2 Open the invitation | ✓ |
| [Event Website](guest/event-website/) | GU-1.3 Event website, GU-2.3 Public and private events | ✓ |
| [RSVP](guest/rsvp/) | GU-2.1 RSVP for my household, GU-2.3 Public and private events | ✓ |
| [RSVP Confirmation](guest/rsvp-confirmation/) | GU-2.2 Confirmation and changes | ✓ |

## Staff (2)

| Page | Stories | Wireframe |
|---|---|---|
| [Staff Invite + Sign In](staff/invite-sign-in/) | ST-1.1 Join from an invite | ✓ |
| [Staff Profile](staff/profile/) | ST-1.2 My profile | ✓ |

## Messages (email / text / push) (9)

| Page | Stories | Wireframe |
|---|---|---|
| [🔔 New lead notification](messages/push-new-lead/) | PL-2.1 New inquiries become leads automatically | ✓ |
| [✉ Inquiry auto-reply](messages/email-inquiry-auto-reply/) | CL-1.1 Send an inquiry without an account, PL-2.1 New inquiries become leads automatically | ✓ |
| [✉ Your proposal (magic link)](messages/email-proposal/) | CL-2.1 Open my proposal with a magic link, PL-3.2 Send a proposal and handle changes | ✓ |
| [✉ Receipt + welcome](messages/email-receipt-welcome/) | CL-2.4 Pay the deposit right after signing, CL-2.5 First portal visit | ✓ |
| [💬 Payment reminder](messages/sms-payment-reminder/) | CL-4.1 Payment reminders | ✓ |
| [💬 Invitation text](messages/sms-invitation/) | GU-1.1 Receive my invitation, PL-5.3 Send invitations | ✓ |
| [✉ RSVP confirmation](messages/email-rsvp-confirmation/) | GU-2.2 Confirmation and changes | ✓ |
| [💬 Team invite](messages/sms-team-invite/) | ST-1.1 Join from an invite | ✓ |
| [✉ Guest reminders (1 week + day before)](messages/guest-reminders/) | GU-4.1 Reminders | ✓ |

## Shared (backend & cross-cutting) (14)

| Page | Stories | Wireframe |
|---|---|---|
| [Event bus (domain events)](shared/event-bus/) | SYS-1 Event bus | not a screen |
| [Notifications (email / SMS / push)](shared/notifications/) | SYS-2 Notifications | not a screen |
| [Payments backend](shared/payments-backend/) | SYS-3 Payment webhooks, NFR-6 No double charges | not a screen |
| [Auth and magic links](shared/auth-magic-links/) | NFR-1 Magic links and auth | not a screen |
| [Multi-tenant isolation](shared/multi-tenancy/) | NFR-2 Multi-tenant isolation | not a screen |
| [Permissions](shared/permissions/) | NFR-3 Permissions on the server | not a screen |
| [Time zones](shared/time-zones/) | NFR-5 Time zones | not a screen |
| [Data deletion, export and privacy](shared/data-privacy/) | NFR-7 Data deletion and export, NFR-14 Privacy and minors | not a screen |
| [Large imports](shared/imports/) | NFR-8 Large imports | not a screen |
| [Guest page performance](shared/performance/) | NFR-9 Fast guest pages | not a screen |
| [Accessibility and language](shared/accessibility-language/) | NFR-10 Accessibility and language | not a screen |
| [Concurrent editing](shared/concurrent-editing/) | NFR-11 Concurrent editing | not a screen |
| [Errors and soft delete](shared/errors-soft-delete/) | NFR-12 Errors, NFR-13 Soft delete | not a screen |
| [Branding everywhere](shared/branding/) | NFR-15 Branding everywhere | not a screen |

## ✏️ Wireframe gaps found while building this

None. Every Phase 1 page has a wireframe.
