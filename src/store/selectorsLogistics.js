// =====================================================================
// Read-only helpers for logistics (product Phase 2): vendors, the
// run-of-show, budget + profit, gear availability and the pack list.
// Re-exported from selectors.js, so screens import from one place.
// =====================================================================
import { daysUntil, parseDay } from '../lib/clock'

const pad = (n) => String(n).padStart(2, '0')
const dayOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (day, n) => { const d = parseDay(day); d.setDate(d.getDate() + n); return dayOf(d) }
const sum = (list, f) => list.reduce((t, x) => t + f(x), 0)
const eventOf = (state, id) => state.events.find((e) => e.id === id)
const isLive = (e) => e && !['cancelled', 'closed'].includes(e.status)

// ---------------------------------------------------------------------
// Vendors (PL-4.10, VN-1 to VN-8)
// ---------------------------------------------------------------------
export const getVendor = (state, id) => state.vendors.find((v) => v.id === id)
export const getEventVendor = (state, id) => state.eventVendors.find((ev) => ev.id === id)
export const eventVendorByToken = (state, token) => state.eventVendors.find((ev) => ev.token === token)

/** 'missing' | 'expires' (before the event) | 'soon' (within 30 days of today) | 'ok' */
export function coiStatus(vendor, eventDate) {
  if (!vendor.coiExpiresOn) return 'missing'
  if (eventDate && vendor.coiExpiresOn < eventDate) return 'expires'
  if (daysUntil(vendor.coiExpiresOn) <= 30) return 'soon'
  return 'ok'
}

/** The vendors on one event, with the directory profile, money and flags joined in. */
export function getEventVendors(state, eventId) {
  const event = eventOf(state, eventId)
  return state.eventVendors.filter((ev) => ev.eventId === eventId).map((ev) => {
    const vendor = getVendor(state, ev.vendorId)
    const paidCents = sum(ev.payments, (p) => p.amountCents)
    return {
      ...ev, vendor, paidCents, balanceCents: Math.max(0, ev.amountCents - paidCents),
      coi: coiStatus(vendor, event?.date),
      unacked: ev.changes.filter((c) => !c.acknowledgedAt),
      hasDoc: (kind) => ev.docs.some((d) => d.kind === kind),
    }
  })
}

/** Other directory vendors in the same category who are free on the event's date (vendor cancelled). */
export function vendorAlternatives(state, eventVendorId) {
  const ev = getEventVendor(state, eventVendorId)
  const event = eventOf(state, ev.eventId)
  const vendor = getVendor(state, ev.vendorId)
  const busy = new Set(state.eventVendors
    .filter((x) => x.status !== 'cancelled' && eventOf(state, x.eventId)?.date === event.date)
    .map((x) => x.vendorId))
  return state.vendors.filter((v) => v.id !== vendor.id && v.category === vendor.category && !busy.has(v.id))
}

/** Past events a vendor worked (directory "past events"). */
export const vendorHistory = (state, vendorId) => state.eventVendors
  .filter((ev) => ev.vendorId === vendorId && ev.status === 'confirmed')
  .map((ev) => ({ ...ev, event: eventOf(state, ev.eventId) }))
  .filter((x) => x.event)

// ---------------------------------------------------------------------
// Run-of-show (PL-4.11)
// ---------------------------------------------------------------------
export const minutesOf = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
export const hhmm = (mins) => `${pad(Math.floor(((mins % 1440) + 1440) % 1440 / 60))}:${pad(((mins % 60) + 60) % 60)}`
/** '19:30' → '7:30 PM' */
export function formatClock(time) {
  const [h, m] = time.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`
}

/** The event's timeline in time order. audience: 'planner' (all) | 'client' | 'staff' | { vendor: eventVendorId } */
export function getTimeline(state, eventId, audience = 'planner') {
  const list = state.timeline.filter((t) => t.eventId === eventId && !t.removed)
  const seen = audience === 'planner' ? list
    : audience.vendor ? list.filter((t) => t.owner === `v:${audience.vendor}`)
      : list.filter((t) => t.visibility.includes(audience))
  return [...seen].sort((a, b) => minutesOf(a.time) - minutesOf(b.time))
}

/** "Sam", "Client", "Hill Country Catering" */
export function ownerLabel(state, owner) {
  if (owner === 'client') return 'Client'
  if (owner?.startsWith('v:')) {
    const ev = getEventVendor(state, owner.slice(2))
    return ev ? getVendor(state, ev.vendorId)?.name : 'Vendor'
  }
  return state.team.find((m) => m.id === owner)?.name.split(' ')[0] ?? 'Unassigned'
}

// ---------------------------------------------------------------------
// Gear (PL-6.2, PL-6.3)
// ---------------------------------------------------------------------
export const getItem = (state, id) => state.equipment.find((i) => i.id === id)

/**
 * How many of an item are free on a day: owned minus what live events reserve
 * within the turnaround buffer (an event the day before still has it in cleaning).
 */
export function gearAvailable(state, itemId, day, exceptEventId) {
  const item = getItem(state, itemId)
  const buffer = state.business.gearBufferDays ?? 0
  const from = addDays(day, -buffer)
  const to = addDays(day, buffer)
  const taken = sum(state.reservations.filter((r) => {
    if (r.itemId !== itemId || r.eventId === exceptEventId) return false
    const e = eventOf(state, r.eventId)
    return isLive(e) && e.date >= from && e.date <= to
  }), (r) => r.qty - (r.partner?.qty ?? 0))
  return Math.max(0, (item?.owned ?? 0) - taken)
}

/** The event's reserved gear, grouped (kit pieces together), with shortages. */
export function getReservations(state, eventId) {
  const event = eventOf(state, eventId)
  return state.reservations.filter((r) => r.eventId === eventId).map((r) => {
    const item = getItem(state, r.itemId)
    const free = gearAvailable(state, r.itemId, event.date, eventId)
    const fromUs = r.qty - (r.partner?.qty ?? 0)
    const shortage = Math.max(0, fromUs - free)
    // ours = the pieces we actually own and bring (pack list, gear wear)
    return { ...r, item, free, shortage, ours: fromUs - shortage, kit: state.kits.find((k) => k.id === r.kitId) ?? null }
  })
}

/** Pack list: reserved gear we own + "always bring" + this event's extras. key → packed? */
export function packList(state, eventId) {
  const event = eventOf(state, eventId)
  const packed = event.packed ?? {}
  const rows = [
    ...getReservations(state, eventId).filter((r) => r.ours > 0).map((r) => ({
      key: r.id, name: r.item.name, qty: r.ours, label: r.item.label, group: r.kit?.name ?? r.item.category,
    })),
    ...(state.business.alwaysBring ?? []).map((name) => ({ key: `always:${name}`, name, qty: 1, group: 'Always bring' })),
    ...(event.packExtras ?? []).map((x) => ({ key: x.id, name: x.name, qty: x.qty, group: 'Extras', extra: true })),
  ].map((r) => ({ ...r, status: packed[r.key] ?? null }))     // null | 'packed' | 'missing' | 'returned'
  return { rows, packedCount: rows.filter((r) => r.status === 'packed' || r.status === 'returned').length }
}

// ---------------------------------------------------------------------
// Budget and profit (PL-4.9). Profit = client price − vendor costs −
// staff hours − gear wear (owner-only on screen).
// ---------------------------------------------------------------------
export function budgetFor(state, eventId) {
  const event = eventOf(state, eventId)
  const lines = state.budgetLines.filter((b) => b.eventId === eventId)
  const invoice = state.invoices.find((i) => i.eventId === eventId)
  const cost = (b) => b.actualCents || b.estimatedCents
  const vendorCents = lines.length ? sum(lines, cost) : (event.costsCents ?? 0)
  const staffCents = sum((state.shifts ?? []).filter((s) => s.eventId === eventId && s.memberId), (s) => {
    const member = state.team.find((m) => m.id === s.memberId)
    return Math.round(((minutesOf(s.end) - minutesOf(s.start) + 1440) % 1440) / 60 * (member?.hourlyCents ?? 0))
  })
  const gearCents = event ? sum(getReservations(state, eventId), (r) => r.ours * (r.item?.wearCents ?? 0)) : 0
  const priceCents = (invoice?.totalCents ?? 0) - sum(invoice?.refunds ?? [], (r) => r.amountCents)
  return {
    lines,
    estimatedCents: sum(lines, (b) => b.estimatedCents),
    actualCents: sum(lines, (b) => b.actualCents),
    priceCents, vendorCents, staffCents, gearCents,
    profitCents: priceCents - vendorCents - staffCents - gearCents,
  }
}

// ---------------------------------------------------------------------
// Dashboard alerts for logistics (added after the Phase 1 alerts)
// ---------------------------------------------------------------------
export function logisticsAlerts(state) {
  const alerts = []
  for (const event of state.events.filter((e) => isLive(e) && daysUntil(e.date) >= 0 && daysUntil(e.date) <= 45)) {
    for (const ev of getEventVendors(state, event.id)) {
      const to = `/app/events/${event.id}/logistics/vendors`
      if (ev.status === 'cancelled') alerts.push({ id: `vc-${ev.id}`, tone: 'danger', text: `${event.name}: ${ev.vendor.name} cancelled`, action: 'Find a replacement', to })
      else if (ev.coi === 'missing' || ev.coi === 'expires') alerts.push({ id: `coi-${ev.id}`, tone: 'danger', text: `${event.name}: ${ev.vendor.name}'s insurance (COI) ${ev.coi === 'missing' ? 'is missing' : 'expires before the event'}`, to })
      if (ev.unacked.length) alerts.push({ id: `ack-${ev.id}`, tone: 'warning', text: `${event.name}: ${ev.vendor.name} hasn't acknowledged ${ev.unacked.length} change${ev.unacked.length > 1 ? 's' : ''}`, to })
    }
    const short = getReservations(state, event.id).filter((r) => r.shortage > 0)
    const staffTo = `/app/events/${event.id}/logistics/staff`
    const crew = (state.shifts ?? []).filter((x) => x.eventId === event.id && !x.removed)
    const swaps = crew.filter((x) => x.swap).length
    if (swaps) alerts.push({ id: `swap-${event.id}`, tone: 'warning', text: `${event.name}: ${swaps} shift swap${swaps > 1 ? 's' : ''} to approve`, action: 'Review', to: staffTo })
    const open = crew.filter((x) => x.status === 'open').length
    if (open) alerts.push({ id: `open-${event.id}`, tone: 'warning', text: `${event.name}: ${open} open shift${open > 1 ? 's' : ''}`, action: 'Staff it', to: staffTo })
    if (short.length) alerts.push({ id: `gear-${event.id}`, tone: 'warning', text: `${event.name}: short ${short.map((r) => `${r.shortage} ${r.item.name.toLowerCase()}${r.shortage > 1 ? 's' : ''}`).join(', ')}`, action: 'Add a rental', to: `/app/events/${event.id}/logistics/gear` })
  }
  const sheets = (state.shifts ?? []).filter((x) => x.timesheet === 'pending' && !x.removed)
  for (const eventId of new Set(sheets.map((x) => x.eventId))) {
    const n = sheets.filter((x) => x.eventId === eventId).length
    alerts.push({ id: `hours-${eventId}`, tone: 'info', text: `${eventOf(state, eventId).name}: ${n} timesheet${n > 1 ? 's' : ''} to approve`, to: `/app/events/${eventId}/logistics/staff` })
  }
  return alerts
}

// ---------------------------------------------------------------------
// Staff shifts (PL-6.1, ST-2.x to ST-5.x)
// ---------------------------------------------------------------------
const SKILL_FOR = {
  'Setup crew': 'Setup crew', Coordinator: 'Coordinator', KJ: 'KJ', 'Photo booth attendant': 'Photo booth',
  Server: 'Serving', Bartender: 'Bartending', 'Door / check-in': null, Teardown: 'Setup crew',
}
export const skillFor = (role) => SKILL_FOR[role] ?? null
export const getShift = (state, id) => state.shifts.find((s) => s.id === id)
/** Scheduled length in minutes (a shift ending after midnight wraps). */
export const shiftMinutes = (s) => ((minutesOf(s.end) - minutesOf(s.start) + 1440) % 1440) || 1440
/** Minutes actually worked (clock in → out, minus breaks), or null before clock-out. */
export function workedMinutes(s) {
  if (!s.clockIn || !s.clockOut) return null
  return Math.max(0, Math.round((parseDay(s.clockOut.at) - parseDay(s.clockIn.at)) / 60000) - (s.clockOut.breakMinutes ?? 0))
}
export const formatHours = (mins) => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`

export const getShifts = (state, eventId) => state.shifts.filter((s) => s.eventId === eventId && !s.removed)
  .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))

/** Free on that date by their availability (weekly days + days off). ST-2.1 */
export function isAvailable(member, day) {
  const a = member.availability
  if (!a) return true
  return a.weekdays.includes(parseDay(day).getDay()) && !a.off.includes(day)
}

/** Already on another shift that overlaps this one (offered or accepted). */
export function isBusy(state, memberId, shift) {
  const start = minutesOf(shift.start)
  const end = start + shiftMinutes(shift)
  return state.shifts.some((s) => s.id !== shift.id && !s.removed && s.memberId === memberId && s.date === shift.date && s.status !== 'open' && (() => {
    const s0 = minutesOf(s.start)
    return s0 < end && start < s0 + shiftMinutes(s)
  })())
}

/** Who could take a shift: qualified, available and free come first ("suggested"). PL-6.1 */
export function suggestStaff(state, shiftId) {
  const shift = getShift(state, shiftId)
  const skill = skillFor(shift.role)
  return state.team.filter((m) => m.status === 'active' && m.role !== 'owner' && !shift.declinedBy.includes(m.id)).map((m) => {
    const qualified = !skill || (m.skills ?? []).includes(skill)
    const available = isAvailable(m, shift.date)
    const busy = isBusy(state, m.id, shift)
    return { member: m, qualified, available, busy, suggested: qualified && available && !busy }
  }).sort((a, b) => Number(b.suggested) - Number(a.suggested) || a.member.name.localeCompare(b.member.name))
}

/** A staff member's shifts with the event joined, soonest first. */
export const myShifts = (state, memberId) => state.shifts
  .filter((s) => s.memberId === memberId && !s.removed)
  .map((s) => ({ ...s, event: eventOf(state, s.eventId) }))
  .filter((s) => s.event && s.event.status !== 'cancelled')
  .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))

/** Accepted, not clocked in, 15+ minutes after the start (PL-6.1 no-show). `now` = a timestamp. */
export const isNoShow = (s, now) => s.status === 'accepted' && !s.clockIn && parseDay(now) - parseDay(`${s.date}T${s.start}:00`) >= 15 * 60000
