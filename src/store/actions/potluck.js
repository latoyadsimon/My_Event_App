// =====================================================================
// Potluck and volunteers (product Phase 2): the planner turns the modules
// on per event (PL-5.6); guests claim a dish or a volunteer slot without
// an account (GU-3.1, GU-3.2); reminders 3 days and 1 day before carry the
// drop-off time and a hot/cold note.
// =====================================================================
import { formatDay, nowStamp } from '../../lib/clock'
import { formatClock } from '../selectors'
import { newId, updateById, withMessage, withToast, isEmailContact } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const TEMP_NOTE = { hot: 'Bring it hot (we have outlets and warming trays if you asked for one).', cold: 'Keep it cold until you arrive.', room: '' }
/** A text or email to someone who signed up, if they left a phone or email. */
const toContact = (state, contact, subject, body, link) => (contact?.trim()
  ? withMessage(state, { type: isEmailContact(contact) ? 'email' : 'sms', to: contact, from: state.business.name, subject, body, link })
  : state)

export const potluckActions = {
  // Turn modules on/off, change the drop-off time, categories or slots
  'potluck/configure': (state, a) => ({ ...state, events: updateById(state.events, a.eventId, (e) => ({ potluck: { ...e.potluck, ...a.changes } })) }),
  'volunteer/configure': (state, a) => ({ ...state, events: updateById(state.events, a.eventId, (e) => ({ volunteer: { ...e.volunteer, ...a.changes } })) }),

  'potluck/claim': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event?.potluck?.enabled || !a.name?.trim() || !a.dish?.trim()) return state
    const category = event.potluck.categories.find((c) => c.id === a.categoryId)
    if (!category) return state
    const signup = {
      id: newId('dish'), eventId: event.id, categoryId: category.id, guestId: a.guestId ?? null, name: a.name.trim(), contact: a.contact?.trim() ?? '',
      dish: a.dish.trim(), servings: Math.max(1, Number(a.servings) || 1), diet: a.diet ?? [], outlet: Boolean(a.outlet), temp: a.temp ?? 'room', at: nowStamp(),
    }
    let next = { ...state, potluckSignups: [...state.potluckSignups, signup] }
    next = toContact(next, signup.contact, `You're bringing ${signup.dish}`,
      `Thanks, ${signup.name.split(' ')[0]}! ${event.name} · ${formatDay(event.date)}.${event.potluck.dropOff ? ` Drop-off by ${formatClock(event.potluck.dropOff)}.` : ''} We'll remind you 3 days and 1 day before.`,
      { label: 'See the sign-up', to: `/e/${event.id}/potluck`, role: 'guest' })
    return withToast(next, `Thanks! ${signup.dish} is on the list.`)
  },
  'potluck/remove': (state, a) => ({ ...state, potluckSignups: state.potluckSignups.filter((x) => x.id !== a.id) }),

  'volunteer/signUp': (state, a) => {
    const event = eventOf(state, a.eventId)
    const slot = event?.volunteer?.slots.find((s) => s.id === a.slotId)
    if (!event?.volunteer?.enabled || !slot || !a.name?.trim()) return state
    const signup = { id: newId('vol'), eventId: event.id, slotId: slot.id, name: a.name.trim(), contact: a.contact?.trim() ?? '', at: nowStamp() }
    let next = { ...state, volunteerSignups: [...state.volunteerSignups, signup] }
    next = toContact(next, signup.contact, `You're helping with ${slot.name.toLowerCase()}`,
      `Thank you! ${event.name} · ${formatDay(event.date)}${slot.time ? `, ${formatClock(slot.time)}` : ''}.`, { label: 'See the sign-up', to: `/e/${event.id}/potluck`, role: 'guest' })
    return withToast(next, `Thanks! You're on ${slot.name.toLowerCase()}.`)
  },
  'volunteer/remove': (state, a) => ({ ...state, volunteerSignups: state.volunteerSignups.filter((x) => x.id !== a.id) }),

  // GU-3.1: reminders 3 days and 1 day before, with the drop-off time and the hot/cold note
  'potluck/remind': (state, a) => {
    const event = eventOf(state, a.eventId)
    const list = state.potluckSignups.filter((x) => x.eventId === event.id && x.contact)
    let next = state
    for (const s of list) {
      next = toContact(next, s.contact, a.kind === 'day' ? `Tomorrow: bring ${s.dish}` : `3 days to go: ${s.dish}`,
        `${event.name} is ${a.kind === 'day' ? 'tomorrow' : formatDay(event.date)}.${event.potluck.dropOff ? ` Please drop off by ${formatClock(event.potluck.dropOff)}.` : ''} ${TEMP_NOTE[s.temp]}`.trim(),
        { label: 'See the sign-up', to: `/e/${event.id}/potluck`, role: 'guest' })
    }
    return withToast(next, `Reminder sent to ${list.length} cook${list.length === 1 ? '' : 's'} (the rest left no phone or email)`)
  },
}
