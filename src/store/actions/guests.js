// =====================================================================
// Guests and staff (Phase 6): what happens when a guest opens their
// invitation or RSVPs (no account: their link carries a token), the
// "one week to go" / "day before" reminders, and a staff member joining.
//   rsvp/submit  → functions.sql submit_rsvp (rsvp.updated)
// =====================================================================
import { formatDay, nowStamp } from '../../lib/clock'
import { formatClock } from '../selectors'
import { newId, updateById, withMessage, withToast, firstName } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const pushToPlanner = (state, subject, body, to) => withMessage(state, {
  type: 'push', to: `${firstName(state.team.find((m) => m.role === 'owner')?.name)} (planner)`, from: `${state.business.name} · Crowned`,
  subject, body, link: { label: 'Open', to, role: 'planner' },
})

export const guestActions = {
  // Opening the invitation counts as "opened" for the planner's tracking
  'guest/opened': (state, a) => {
    const g = state.guests.find((x) => x.token === a.token)
    if (!g || g.invite === 'opened' || g.rsvp) return state
    return { ...state, guests: updateById(state.guests, g.id, { invite: 'opened' }) }
  },

  // GU-2.1: the household's reply. A public event with no token creates the guest first (GU-2.3).
  'rsvp/submit': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event || event.headcount?.lockedAt) return state
    let next = state
    let guest = a.guestId && state.guests.find((g) => g.id === a.guestId)
    if (!guest) {
      if (event.site.privacy !== 'public' || !a.name?.trim()) return state
      const id = newId('guest')
      const contact = a.contact?.trim() ?? ''
      guest = {
        id, eventId: event.id, name: a.name.trim(), email: contact.includes('@') ? contact : '', phone: contact.includes('@') ? '' : contact,
        plusOnes: event.site.defaultPlusOnes, tags: ['website'], notes: '', gift: '', allergies: '', songRequest: '', answers: {},
        invite: 'opened', rsvp: null, attending: 0, meals: {}, respondedAt: null, addedBy: 'website', token: `${id}-t`,
      }
      next = { ...next, guests: [...next.guests, guest] }
    }
    const going = a.members.filter((m) => m.attending)
    const meals = {}
    for (const m of going.filter((x) => x.meal)) meals[m.meal] = (meals[m.meal] ?? 0) + 1
    const firstTime = !guest.respondedAt
    next = {
      ...next,
      guests: updateById(next.guests, guest.id, {
        rsvp: going.length ? 'attending' : 'declined', attending: going.length, meals, members: a.members,
        allergies: a.allergies ?? guest.allergies, songRequest: a.songRequest ?? '', answers: a.answers ?? {},
        respondedAt: nowStamp(), invite: 'opened', forwarded: Boolean(a.forwarded) || guest.forwarded,
      }),
    }
    const summary = going.length ? `${going.length} attending${Object.keys(meals).length ? ` · ${Object.entries(meals).map(([m, n]) => `${m} ${n}`).join(', ')}` : ''}` : 'not attending'
    // Confirmation by text or email, with "Change my RSVP" (GU-2.2)
    next = withMessage(next, {
      type: guest.phone ? 'sms' : 'email', to: `${guest.name} · ${guest.phone || guest.email}`, from: state.business.name,
      subject: going.length ? `You're confirmed: ${event.name}` : `Reply received: ${event.name}`,
      body: going.length ? `Thanks, ${firstName(guest.name)}! You're confirmed for ${event.name} on ${formatDay(event.date)}: ${summary}.` : `Thanks for letting us know, ${firstName(guest.name)}. You'll be missed!`,
      link: { label: 'Change my RSVP', to: `/e/${event.id}/rsvp?t=${guest.token}`, role: 'guest' },
    })
    next = pushToPlanner(next, `RSVP${firstTime ? '' : ' changed'}: ${guest.name}${a.forwarded ? ' (forwarded link)' : ''}`, `${event.name} · ${summary}`, `/app/events/${event.id}/guests`)
    return { ...next, lastRsvp: { guestId: guest.id, token: guest.token } }
  },

  // GU-4.1: "one week to go" and "see you tomorrow" (skips declined guests and STOP opt-outs)
  'guestReminders/send': (state, a) => {
    const event = eventOf(state, a.eventId)
    const targets = state.guests.filter((g) => g.eventId === event.id && !g.removed && g.rsvp !== 'declined' && g.invite !== 'stopped' && g.invite !== 'not_sent')
    const site = event.site
    const body = a.kind === 'week'
      ? `One week to go! ${event.name} is ${formatDay(event.date)} at ${event.venue}${event.venueInfo?.address ? `, ${event.venueInfo.address}` : ''}.${site.dressCode ? ` Dress code: ${site.dressCode}.` : ''} Parking and directions are on the event page.`
      : `See you tomorrow at ${event.venue}! Directions are on the event page.`
    // Potluck on: the drop-off time rides along (GU-4.1)
    const potluck = event.potluck?.enabled && event.potluck.dropOff ? ` Bringing a dish? Drop-off is by ${formatClock(event.potluck.dropOff)}.` : ''
    let next = state
    for (const g of targets) {
      next = withMessage(next, {
        type: g.phone ? 'sms' : 'email', to: `${g.name} · ${g.phone || g.email}`, from: state.business.name,
        subject: a.kind === 'week' ? 'One week to go' : 'See you tomorrow', body: body + potluck,
        link: { label: 'Event page', to: `/e/${event.id}?t=${g.token}`, role: 'guest' },
      })
    }
    return withToast(next, `Reminder sent to ${targets.length} household${targets.length === 1 ? '' : 's'}`)
  },

  // A guest writes to the host from a guest page (limit reached, RSVPs closed…)
  'guest/messageHost': (state, a) => {
    const event = eventOf(state, a.eventId)
    return pushToPlanner(state, `Message from ${a.name || 'a guest'}`, `${event.name}: “${a.text.trim()}”`, `/app/events/${event.id}/guests`)
  },

  // ---- Staff (ST-1.1, ST-1.2) ----
  'team/join': (state, a) => {
    const member = state.team.find((m) => m.inviteToken === a.token)
    if (!member || member.status === 'deactivated') return state
    const next = {
      ...state,
      team: updateById(state.team, member.id, { status: 'active', joinedAt: member.joinedAt ?? nowStamp(), phone: a.phone || member.phone }),
      ui: { ...state.ui, role: 'staff', staffId: member.id },
    }
    return pushToPlanner(next, `${member.name} joined your team`, `${member.jobTitle} · signed in by phone`, '/app/settings/team')
  },
  'team/updateProfile': (state, a) => withToast({ ...state, team: updateById(state.team, a.memberId, a.changes) }, 'Profile saved'),
  'team/signOutEverywhere': (state, a) => {
    const member = state.team.find((m) => m.id === a.memberId)
    return withToast({ ...state, team: updateById(state.team, member.id, { sessionsRevokedAt: nowStamp() }) }, `${member.name} is signed out on every device`)
  },
}
