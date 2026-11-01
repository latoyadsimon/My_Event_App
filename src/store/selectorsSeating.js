// =====================================================================
// Read-only helpers for tickets and seating (product Phase 4).
// Re-exported from selectors.js.
// =====================================================================

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const sum = (list, f) => list.reduce((t, x) => t + f(x), 0)

// ---- Tickets (GU-3.4) ----
/** Each tier: sold, left, revenue. */
export function ticketSales(state, eventId) {
  const event = eventOf(state, eventId)
  const sold = state.tickets.filter((t) => t.eventId === eventId && !t.refunded)
  const tiers = (event.ticketing?.tiers ?? []).map((tier) => {
    const mine = sold.filter((t) => t.tierId === tier.id)
    return { ...tier, sold: mine.length, left: Math.max(0, tier.capacity - mine.length), revenueCents: sum(mine, (t) => t.paidCents), checkedIn: mine.filter((t) => t.checkedInAt).length }
  })
  return { tiers, sold: sold.length, revenueCents: sum(sold, (t) => t.paidCents), checkedIn: sold.filter((t) => t.checkedInAt).length, waitlist: state.waitlist.filter((w) => w.eventId === eventId).length }
}
export const promoFor = (event, code) => event.ticketing?.promos.find((p) => p.code.toUpperCase() === code?.trim().toUpperCase()) ?? null
export const ticketByCode = (state, code) => state.tickets.find((t) => t.code.toUpperCase() === code?.trim().toUpperCase())

// ---- Seating (PL-4.12, GU-5.2) ----
const people = (g) => (g.rsvp === 'attending' ? g.attending : 1 + (g.plusOnes ?? 0))

/** The tables on the plan, each with who's seated, meals, allergies, conflicts and room left. */
export function getTables(state, eventId) {
  const event = eventOf(state, eventId)
  const guests = state.guests.filter((g) => g.eventId === eventId && !g.removed && g.rsvp !== 'declined')
  return (event.floorPlan?.objects ?? []).filter((o) => o.kind.startsWith('table')).map((t) => {
    const here = guests.filter((g) => g.tableId === t.id)
    const meals = {}
    for (const g of here) for (const [m, n] of Object.entries(g.meals ?? {})) meals[m] = (meals[m] ?? 0) + n
    const ids = new Set(here.map((g) => g.id))
    const conflicts = here.filter((g) => (g.avoid ?? []).some((id) => ids.has(id)))
    const filled = sum(here, people)
    return { ...t, guests: here, filled, left: t.seats - filled, meals, allergies: here.filter((g) => g.allergies?.trim()), conflicts }
  })
}

/** Attending households (and walk-ins) without a table yet. */
export const unseated = (state, eventId) => state.guests
  .filter((g) => g.eventId === eventId && !g.removed && (g.rsvp === 'attending' || g.walkIn) && !g.tableId)
  .sort((a, b) => a.name.localeCompare(b.name))

/** GU-5.2: type your name → your table. */
export function findSeat(state, eventId, name) {
  const q = name.trim().toLowerCase()
  if (q.length < 2) return []
  const tables = getTables(state, eventId)
  return state.guests.filter((g) => g.eventId === eventId && !g.removed && g.tableId && g.name.toLowerCase().includes(q))
    .map((g) => ({ guest: g, table: tables.find((t) => t.id === g.tableId) })).filter((x) => x.table)
}
