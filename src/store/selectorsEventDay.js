// =====================================================================
// Read-only helpers for event day and wrap-up (product Phase 2):
// now/next, door check-in, live panels, the close-out checklist and the
// event report. Re-exported from selectors.js.
// =====================================================================
import { budgetFor, getEventVendors, getTimeline, packList } from './selectorsLogistics'
import { karaokeStats } from './selectorsKaraoke'
import { boothStats } from './selectorsBooth'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const sum = (list, f) => list.reduce((t, x) => t + f(x), 0)

/** Day-of Mode (PL-7.1): the first item not done is "now", the one after is "next". */
export function nowNext(state, eventId, audience = 'planner') {
  const items = getTimeline(state, eventId, audience)
  const i = items.findIndex((t) => !t.done)
  return { items, now: i < 0 ? null : items[i], next: i < 0 ? null : items[i + 1] ?? null, doneCount: items.filter((t) => t.done).length }
}

/** The code on a guest's invitation that door staff can scan or type: "ACME-G8". GU-5.1 */
export const checkInCode = (guest) => guest.token.replace(/-t$/, '').toUpperCase()

/** Door check-in (ST-4.3): people expected vs. in, households in, walk-ins. */
export function checkInCounts(state, eventId) {
  const list = state.guests.filter((g) => g.eventId === eventId && !g.removed)
  const coming = list.filter((g) => g.rsvp === 'attending' || g.walkIn)
  return {
    expected: sum(coming, (g) => g.attending || 1),
    checkedIn: sum(list, (g) => g.checkedIn ?? 0),
    households: list.filter((g) => g.checkedIn).length,
    walkIns: list.filter((g) => g.walkIn).length,
  }
}

/** Search by name or check-in code; attending households first. */
export function findGuests(state, eventId, query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return state.guests
    .filter((g) => g.eventId === eventId && !g.removed && (g.name.toLowerCase().includes(q) || checkInCode(g).toLowerCase() === q))
    .sort((a, b) => Number(b.rsvp === 'attending') - Number(a.rsvp === 'attending') || a.name.localeCompare(b.name))
    .slice(0, 8)
}

export const getIncidents = (state, eventId) => (state.incidents ?? []).filter((x) => x.eventId === eventId).sort((a, b) => b.at.localeCompare(a.at))

/** Live numbers during the event (PL-7.2, the P2 panels). */
export function livePanel(state, eventId) {
  const vendors = getEventVendors(state, eventId).filter((v) => v.status === 'confirmed')
  const invoice = state.invoices.find((i) => i.eventId === eventId)
  return {
    ...checkInCounts(state, eventId),
    vendorsArrived: vendors.filter((v) => v.arrivedAt).length, vendorsTotal: vendors.length,
    incidents: getIncidents(state, eventId).length,
    onsiteCents: sum((invoice?.installments ?? []).filter((p) => p.extra === 'onsite'), (p) => p.amountCents),
    karaoke: eventOf(state, eventId)?.karaoke?.enabled ? karaokeStats(state, eventId) : null,   // P3 panel: queue length
    booth: eventOf(state, eventId)?.booth?.enabled ? boothStats(state, eventId) : null,         // P3 panel: sessions and prints
  }
}

/** Close-out checklist (PL-8.1). Each item links to where it's fixed. */
export function closeOut(state, eventId) {
  const event = eventOf(state, eventId)
  const invoice = state.invoices.find((i) => i.eventId === eventId)
  const pack = packList(state, eventId)
  const crew = (state.shifts ?? []).filter((s) => s.eventId === eventId && !s.removed && s.status === 'accepted')
  const vendors = getEventVendors(state, eventId).filter((v) => v.status === 'confirmed')
  const base = `/app/events/${eventId}`
  const items = [
    { id: 'invoice', label: 'Final invoice paid', done: !invoice || invoice.installments.every((p) => p.paidAt || p.voided), to: `${base}/wrap-up` },
    { id: 'deposit', label: 'Security deposit released or applied', done: !invoice?.securityDeposit || invoice.securityDeposit.status !== 'held', to: `${base}/wrap-up` },
    { id: 'gear', label: 'Gear checked in', done: Boolean(event.teardownAt) || pack.rows.length === 0, to: `/app/day-of/${eventId}` },
    { id: 'hours', label: 'Staff hours approved', done: crew.every((s) => ['approved', 'paid'].includes(s.timesheet)), to: `${base}/logistics/staff` },
    { id: 'vendors', label: 'Vendor payments sent', done: vendors.every((v) => v.balanceCents === 0), to: `${base}/logistics/vendors` },
  ]
  return { items, doneCount: items.filter((x) => x.done).length, allDone: items.every((x) => x.done) }
}

/** The event report (PL-8.5): money, attendance and how the day went. */
export function eventReport(state, eventId) {
  const budget = budgetFor(state, eventId)
  const invoice = state.invoices.find((i) => i.eventId === eventId)
  const guests = state.guests.filter((g) => g.eventId === eventId && !g.removed)
  const counts = checkInCounts(state, eventId)
  const vendors = getEventVendors(state, eventId).filter((v) => v.status === 'confirmed')
  return {
    ...budget,
    collectedCents: sum((invoice?.installments ?? []).filter((p) => p.paidAt), (p) => p.amountCents) - sum(invoice?.refunds ?? [], (r) => r.amountCents),
    onsiteCents: sum((invoice?.installments ?? []).filter((p) => p.extra === 'onsite'), (p) => p.amountCents),
    damageCents: sum((invoice?.installments ?? []).filter((p) => p.extra === 'damage'), (p) => p.amountCents),
    invitedPeople: sum(guests.filter((g) => !g.walkIn), (g) => 1 + (g.plusOnes ?? 0)),
    attendingPeople: sum(guests.filter((g) => g.rsvp === 'attending'), (g) => g.attending),
    checkedIn: counts.checkedIn, walkIns: counts.walkIns,
    incidents: getIncidents(state, eventId).length,
    vendorsOnTime: vendors.filter((v) => v.arrivedAt).length, vendorsTotal: vendors.length,
    karaoke: eventOf(state, eventId)?.karaoke?.enabled ? karaokeStats(state, eventId) : null,
    booth: eventOf(state, eventId)?.booth?.enabled ? boothStats(state, eventId) : null,
  }
}

// ---------------------------------------------------------------------
// Potluck and volunteers (PL-5.6, GU-3.1, GU-3.2, CL-3.8)
// ---------------------------------------------------------------------
/** How many people to plan food for: the locked headcount, else RSVPs, else the estimate. */
export function potluckHeadcount(state, event) {
  if (event.headcount?.lockedAt) return event.headcount.count
  const attending = state.guests.filter((g) => g.eventId === event.id && !g.removed && g.rsvp === 'attending').reduce((t, g) => t + g.attending, 0)
  return attending || event.guestCount || 0
}

/** Each category with its target (scales with headcount), dishes signed up and what's missing. */
export function potluckBoard(state, eventId) {
  const event = eventOf(state, eventId)
  const people = potluckHeadcount(state, event)
  const signups = (state.potluckSignups ?? []).filter((x) => x.eventId === eventId)
  const categories = (event.potluck?.categories ?? []).map((c) => {
    const dishes = signups.filter((x) => x.categoryId === c.id)
    const target = Math.max(1, Math.ceil(people / c.per))
    return { ...c, dishes, target, filled: dishes.length, servings: sum(dishes, (d) => d.servings), short: Math.max(0, target - dishes.length) }
  })
  return { people, categories, total: signups.length, needed: sum(categories, (c) => c.target) }
}

const words = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter((w) => w.length > 2)
/** "Mac and cheese" twice? Returns the similar dish already signed up (GU-3.1), or null. */
export function similarDish(state, eventId, categoryId, dish) {
  const mine = new Set(words(dish))
  if (!mine.size) return null
  return (state.potluckSignups ?? []).find((x) => x.eventId === eventId && x.categoryId === categoryId && words(x.dish).some((w) => mine.has(w))) ?? null
}

/** Volunteer slots with who signed up (GU-3.2). A group sign-up can count as several people. */
export function volunteerBoard(state, eventId) {
  const event = eventOf(state, eventId)
  const signups = (state.volunteerSignups ?? []).filter((x) => x.eventId === eventId)
  return (event.volunteer?.slots ?? []).map((s) => {
    const people = signups.filter((x) => x.slotId === s.id)
    const filled = sum(people, (x) => x.people ?? 1)
    return { ...s, people, filled, open: Math.max(0, s.needed - filled) }
  })
}
