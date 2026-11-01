// =====================================================================
// Read-only helpers for growing the business (product Phase 4):
// business reports (PL-9.1), marketing reminders that are due (PL-9.2),
// and feedback (PL-8.4, CL-6.4, GU-6.2). Re-exported from selectors.js.
// =====================================================================
import { TODAY, daysUntil, parseDay } from '../lib/clock'

const sum = (list, f) => list.reduce((t, x) => t + f(x), 0)
const pad = (n) => String(n).padStart(2, '0')
const monthKey = (stamp) => stamp.slice(0, 7)
const isLive = (e) => e.status !== 'cancelled'

/** The last 12 months, oldest first: 'YYYY-MM'. */
export function lastMonths(n = 12, today = TODAY) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (n - 1 - i), 1)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
  })
}

/** Which add-ons an event used: the accepted proposal, or what it has turned on. */
function addonsOf(state, event) {
  const proposal = state.proposals.find((p) => p.leadId === event.leadId && p.status === 'accepted')
  const version = proposal?.versions.find((v) => v.n === proposal.acceptedVersion)
  if (version) return version.lines.filter((l) => !l.optional || proposal.chosen?.includes(l.addonId)).map((l) => ({ addonId: l.addonId, qty: l.qty }))
  const used = []
  if (event.booth?.enabled) used.push({ addonId: 'photo-booth', qty: 1 })
  if (event.karaoke?.enabled) used.push({ addonId: 'karaoke', qty: 1 })
  if (event.booth?.magnets) used.push({ addonId: 'photo-magnets', qty: 1 })
  const chairs = state.reservations.find((r) => r.eventId === event.id && r.itemId === 'chairs')
  if (chairs) used.push({ addonId: 'chairs', qty: chairs.qty })
  return used
}

/** Everything on the Reports page (PL-9.1). */
export function businessReport(state) {
  const months = lastMonths()
  const invoiceFor = (eventId) => state.invoices.find((i) => i.eventId === eventId)
  const booked = Object.fromEntries(months.map((m) => [m, 0]))
  const collected = Object.fromEntries(months.map((m) => [m, 0]))
  for (const c of state.contracts.filter((x) => x.plannerSignedAt)) {
    const m = monthKey(c.plannerSignedAt)
    if (m in booked) booked[m] += invoiceFor(c.eventId)?.totalCents ?? 0
  }
  for (const i of state.invoices) for (const p of i.installments.filter((x) => x.paidAt)) {
    const m = monthKey(p.paidAt)
    if (m in collected) collected[m] += p.amountCents
  }

  const sources = {}
  for (const l of state.leads) {
    sources[l.source] ??= { source: l.source, leads: 0, won: 0 }
    sources[l.source].leads++
    if (l.stage === 'won') sources[l.source].won++
  }

  const addons = {}
  const events = state.events.filter(isLive)
  for (const e of events) for (const { addonId, qty } of addonsOf(state, e)) {
    const a = state.addons.find((x) => x.id === addonId)
    if (!a) continue
    addons[addonId] ??= { addon: a, events: 0, revenueCents: 0 }
    addons[addonId].events++
    addons[addonId].revenueCents += a.priceCents * qty
  }

  // Gear utilization: share of live events each item went out on
  const gear = state.equipment.map((item) => {
    const used = new Set(state.reservations.filter((r) => r.itemId === item.id && events.some((e) => e.id === r.eventId)).map((r) => r.eventId))
    return { item, events: used.size, percent: events.length ? Math.round((used.size / events.length) * 100) : 0 }
  }).sort((a, b) => b.percent - a.percent)

  // Sales tax by location: the city in the venue address, else the business's city
  const rate = (state.business.taxRatePercent ?? 0) / 100
  const tax = {}
  for (const e of events) {
    const inv = invoiceFor(e.id)
    if (!inv) continue
    const place = e.venueInfo?.address?.match(/,\s*([^,]+),\s*([A-Z]{2})\b/)?.slice(1).join(', ') ?? state.business.city
    tax[place] ??= { place, salesCents: 0, taxCents: 0 }
    tax[place].salesCents += inv.totalCents
    tax[place].taxCents += Math.round(inv.totalCents - inv.totalCents / (1 + rate))
  }

  const scores = state.feedback.filter((f) => f.from === 'client')
  return {
    months: months.map((m) => ({ month: m, bookedCents: booked[m], collectedCents: collected[m] })),
    bookedCents: sum(Object.values(booked), (x) => x), collectedCents: sum(Object.values(collected), (x) => x),
    sources: Object.values(sources).sort((a, b) => b.leads - a.leads),
    addons: Object.values(addons).sort((a, b) => b.revenueCents - a.revenueCents),
    gear,
    tax: Object.values(tax).sort((a, b) => b.salesCents - a.salesCents),
    givingCents: sum(state.donations.filter((d) => d.status === 'paid'), (d) => d.amountCents),
    rating: scores.length ? Math.round((sum(scores, (f) => f.score) / scores.length) * 10) / 10 : null,
    reviews: scores.length,
  }
}

/** The next time a key date comes around (yearly dates roll forward). */
export function nextOccurrence(date, yearly, today = TODAY) {
  if (!yearly || daysUntil(date) >= 0) return date
  const d = parseDay(date)
  let y = today.getFullYear()
  if (new Date(y, d.getMonth(), d.getDate()) < today) y++
  return `${y}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Marketing reminders (PL-9.2): every upcoming key date, soonest first (isDue picks the ones to send).
 * Memorial clients are never included.
 */
export function marketingList(state) {
  const memorialClients = new Set(state.events.filter((e) => e.type === 'memorial').map((e) => e.clientId))
  return state.clients.flatMap((c) => (c.marketing?.dates ?? []).map((d) => {
    const next = nextOccurrence(d.date, d.yearly)
    return { client: c, date: d, next, daysAway: daysUntil(next), sent: c.marketing.sent.some((s) => s.dateId === d.id && s.for === next), excluded: memorialClients.has(c.id) }
  })).filter((x) => x.daysAway >= 0).sort((a, b) => a.daysAway - b.daysAway)
}
export const isDue = (x, windowDays = 61) => x.client.marketing.optIn && !x.excluded && !x.sent && x.daysAway <= windowDays

/** Feedback for one event: the client's review and the guests' one-question scores. */
export function feedbackFor(state, eventId) {
  const list = state.feedback.filter((f) => f.eventId === eventId)
  const guests = list.filter((f) => f.from === 'guest')
  return { client: list.find((f) => f.from === 'client') ?? null, guests, guestAverage: guests.length ? Math.round((sum(guests, (f) => f.score) / guests.length) * 10) / 10 : null }
}
