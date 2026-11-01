// =====================================================================
// Selectors: small functions that read answers out of the state, so screens
// don't repeat the same lookups. Pure functions → easy to test.
// =====================================================================
import { TODAY, daysUntil, parseDay, formatWeekdayDay } from '../lib/clock'
import { formatMoney } from '../lib/money'
import { eventTypeLabel } from '../data/seed'
import { logisticsAlerts } from './selectorsLogistics'
import { closeOut } from './selectorsEventDay'

export * from './selectorsLogistics'
export * from './selectorsEventDay'
export * from './selectorsKaraoke'
export * from './selectorsBooth'
export * from './selectorsGiving'
export * from './selectorsSeating'

export const getLead = (state, id) => state.leads.find((l) => l.id === id)
export const getEvent = (state, id) => state.events.find((e) => e.id === id)
export const getClient = (state, id) => state.clients.find((c) => c.id === id)
export const getInvoiceForEvent = (state, eventId) => state.invoices.find((i) => i.eventId === eventId)

/**
 * The client portal's world for one client (the demo client is Ana).
 * Before the deposit there's a lead but no unlocked event, so planning pages stay locked.
 */
export function getPortal(state, clientId = state.ui?.clientId ?? 'ana') {
  const client = getClient(state, clientId)
  const lead = state.leads.find((l) => l.clientId === clientId && l.stage !== 'lost')
  const event = lead && state.events.find((e) => e.leadId === lead.id)
  return { client, lead, event, unlocked: Boolean(event?.portalUnlockedAt) }
}

// ---------------------------------------------------------------------
// Onboarding (PL-1.2 to PL-1.7): the wizard's steps, in the wireframe's order.
// ---------------------------------------------------------------------
export const ONBOARDING_STEPS = [
  { id: 'business', label: 'Business' },
  { id: 'payments', label: 'Payments' },
  { id: 'packages', label: 'Packages' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'team', label: 'Team' },
  { id: 'templates', label: 'Templates' },
]

/** The first step not done yet, or null when setup is finished. */
export function nextOnboardingStep(state) {
  return ONBOARDING_STEPS.find((s) => !state.business.onboarding[s.id])?.id ?? null
}

/** The person signed in on the planner side: the owner, unless the demo bar picked a teammate. */
export const getMe = (state) =>
  state.team.find((m) => m.id === state.ui?.memberId) ?? state.team.find((m) => m.role === 'owner')

/** Can the signed-in team member do this? (PL-1.6 permissions; owners can do everything) */
export const can = (state, permission) => {
  const me = getMe(state)
  return me?.role === 'owner' || Boolean(me?.permissions[permission] && !(permission === 'see_profit'))
}

// ---------------------------------------------------------------------
// Getting-started checklist (PL-1.8): shows until done; each item links to its fix.
// ---------------------------------------------------------------------
export function getChecklist(state) {
  const b = state.business
  const items = [
    { id: 'packages', label: 'Add your packages', done: state.packages.some((p) => !p.archived), to: '/app/settings/packages' },
    { id: 'payments', label: 'Connect payments', done: Boolean(b.paymentProvider), to: '/app/settings/payments' },
    { id: 'calendar', label: 'Connect your calendar', done: Boolean(b.calendarProvider), to: '/app/settings/calendar' },
    { id: 'inquiry', label: 'Share your inquiry form', done: b.inquiryFormShared, to: `/b/${b.slug}/inquire` },
  ]
  return { items, doneCount: items.filter((i) => i.done).length, allDone: items.every((i) => i.done) }
}

// ---------------------------------------------------------------------
// Dashboard: "what needs me today?" (success metric #1). All numbers are
// computed from the rows, so they always agree with the other screens.
// ---------------------------------------------------------------------
const OPEN_STAGES = ['new', 'contacted', 'consult_booked']
const isOpenEvent = (e) => !['closed', 'cancelled'].includes(e.status)
const inMonth = (stamp, today) => {
  const d = parseDay(stamp)
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
}
const typeWords = (t) => t.replaceAll('_', ' ')

export function getDashboard(state) {
  const eventById = Object.fromEntries(state.events.map((e) => [e.id, e]))
  const invoiceFor = (eventId) => state.invoices.find((i) => i.eventId === eventId)
  const openInvoices = state.invoices.filter((i) => eventById[i.eventId] && isOpenEvent(eventById[i.eventId]))
  const sum = (list, f) => list.reduce((total, x) => total + f(x), 0)

  // ---- Key numbers ----
  const countersignedThisMonth = state.contracts.filter((c) => c.plannerSignedAt && inMonth(c.plannerSignedAt, TODAY))
  const openTasks = state.tasks.filter((t) => !t.done)
  const kpis = {
    bookedThisMonthCents: sum(countersignedThisMonth, (c) => invoiceFor(c.eventId)?.totalCents ?? 0),
    collectedThisMonthCents: sum(state.invoices, (i) => sum(i.installments.filter((p) => p.paidAt && inMonth(p.paidAt, TODAY)), (p) => p.amountCents)),
    balanceDueCents: sum(openInvoices, (i) => sum(i.installments.filter((p) => !p.paidAt), (p) => p.amountCents)),
    openTasks: openTasks.length,
    lateTasks: openTasks.filter((t) => daysUntil(t.due) < 0).length,
  }

  // ---- Today and the next 6 days ----
  const week = state.appointments
    .filter((a) => { const d = daysUntil(a.at.slice(0, 10)); return d >= 0 && d <= 6 })
    .sort((a, b) => a.at.localeCompare(b.at))

  // ---- Alerts, most urgent first. Each links to the screen that fixes it. ----
  const alerts = []
  for (const c of state.contracts.filter((x) => x.clientSignedAt && !x.plannerSignedAt)) {
    const event = eventById[c.eventId]
    const deposit = invoiceFor(c.eventId)?.installments[0]
    if (deposit?.paidAt) alerts.push({ id: `sign-${c.id}`, tone: 'warning', text: `${event.name}: signed and paid the deposit`, action: 'Countersign', to: `/app/contracts/${c.id}` })
    else alerts.push({ id: `wait-${c.id}`, tone: 'neutral', text: `${event.name}: signed, waiting for the deposit`, to: `/app/contracts/${c.id}` })
  }
  for (const i of openInvoices) {
    for (const p of i.installments.filter((x) => !x.paidAt)) {
      const days = daysUntil(p.dueDate)
      if (days > 7) continue
      const event = eventById[i.eventId]
      alerts.push(days < 0
        ? { id: `due-${p.id}`, tone: 'danger', text: `${event.name}: ${formatMoney(p.amountCents)} overdue since ${formatWeekdayDay(p.dueDate)}`, to: `/app/invoices/${i.id}` }
        : { id: `due-${p.id}`, tone: 'warning', text: `${event.name}: ${formatMoney(p.amountCents)} due ${formatWeekdayDay(p.dueDate)}`, to: `/app/invoices/${i.id}` })
    }
  }
  for (const l of state.leads.filter((x) => x.stage === 'new')) {
    const client = getClient(state, l.clientId)
    alerts.push({ id: `lead-${l.id}`, tone: 'info', text: `New lead: ${client?.name ?? l.title} · ${typeWords(l.eventType)}`, to: `/app/leads/${l.id}` })
  }
  for (const r of (state.requests ?? []).filter((x) => x.status === 'open')) {
    const event = eventById[r.eventId]
    alerts.unshift({ id: `req-${r.id}`, tone: 'warning', text: `${event.name}: client asked to ${r.kind}`, action: r.kind === 'cancel' ? 'Review' : 'Change date', to: `/app/events/${r.eventId}/${r.kind === 'cancel' ? 'cancel' : 'reschedule'}` })
  }
  const lateByEvent = {}
  for (const t of openTasks.filter((x) => daysUntil(x.due) < 0)) lateByEvent[t.eventId] = (lateByEvent[t.eventId] ?? 0) + 1
  for (const [eventId, n] of Object.entries(lateByEvent)) {
    alerts.push({ id: `late-${eventId}`, tone: 'warning', text: `${eventById[eventId].name}: ${n} late task${n > 1 ? 's' : ''}`, to: `/app/events/${eventId}/tasks` })
  }

  alerts.push(...logisticsAlerts(state))
  for (const e of state.events.filter((x) => x.status === 'wrap_up')) {
    const c = closeOut(state, e.id)
    alerts.push({ id: `close-${e.id}`, tone: 'info', text: `${e.name}: close-out ${c.doneCount} of ${c.items.length} done`, action: 'Wrap up', to: `/app/events/${e.id}/wrap-up` })
  }

  // ---- Pipeline ----
  const pipeline = {
    inquiries: state.leads.filter((l) => OPEN_STAGES.includes(l.stage)).length,
    proposalsSent: state.leads.filter((l) => l.stage === 'proposal_sent').length,
    booked: state.events.filter((e) => isOpenEvent(e) && e.status !== 'awaiting_countersign').length,
    completed: state.events.filter((e) => e.status === 'closed').length,
  }

  return { kpis, week, alerts, pipeline }
}

// ---------------------------------------------------------------------
// Leads and selling (Phase 2)
// ---------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0')
/** A Date → 'YYYY-MM-DD' (local calendar day). */
export const toDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (day, n) => { const d = parseDay(day); d.setDate(d.getDate() + n); return toDay(d) }

/** What priceVersion() needs: packages, add-ons, tax rate and payment schedule. */
export const getCatalog = (state) => ({
  packages: state.packages, addons: state.addons,
  taxRatePercent: state.business.taxRatePercent, paymentSchedule: state.business.paymentSchedule,
})

/** "Rivera · Wedding": the client's last name and the event type. */
export const leadName = (state, lead) =>
  `${getClient(state, lead.clientId)?.name.split(' ').at(-1) ?? lead.title} · ${eventTypeLabel(lead.eventType)}`

export const getProposal = (state, leadId) => state.proposals.find((p) => p.leadId === leadId)

/**
 * Is this day already booked by another event? (PL-2.2 "Date taken", PL-2.3)
 * Returns the event that has it, or null.
 */
export function dateTakenBy(state, day, exceptLeadId) {
  if (!day) return null
  return state.events.find((e) => e.date === day && e.leadId !== exceptLeadId && !['cancelled', 'closed'].includes(e.status)) ?? null
}

/** Another lead holding this day (a soft, dashed hold on the Calendar). */
export function dateHeldBy(state, day, exceptLeadId) {
  if (!day) return null
  return state.leads.find((l) => l.id !== exceptLeadId && l.eventDate === day && l.hold && daysUntil(l.hold.until) >= 0) ?? null
}

/** Open dates near a taken one, same weekday: 1 week before, then 1 and 2 weeks after… */
export function nearbyOpenDates(state, day, count = 3) {
  return [-7, 7, 14, -14, 21, -21, 28]
    .map((n) => addDays(day, n))
    .filter((d) => daysUntil(d) > 0 && !dateTakenBy(state, d))
    .slice(0, count)
    .sort()
}

/** 'Instagram' → leads from Instagram; 'all' → every lead. Grouped by stage, newest first. */
export function getLeadBoard(state, source = 'all') {
  const shown = state.leads
    .filter((l) => source === 'all' || l.source === source)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
  const byStage = {}
  for (const l of shown) (byStage[l.stage] ??= []).push(l)
  return byStage
}

// ---- Public booking page (PL-2.4): open consult times, like Calendly ----
const stampMinutes = (stamp) => { const d = parseDay(stamp); return d.getHours() * 60 + d.getMinutes() }

/** Open consult start times ('2026-11-09T14:00:00') on one day. */
export function openSlots(state, day) {
  const rules = state.business.booking
  const date = parseDay(day)
  if (!rules.weekdays.includes(date.getDay())) return []
  const days = daysUntil(day)
  if (days < 0 || days > 60) return []

  const sameDay = state.appointments.filter((a) => a.at.slice(0, 10) === day)
  if (sameDay.filter((a) => a.title === 'Consult').length >= rules.dailyLimit) return []

  return rules.times
    .map((t) => `${day}T${t}:00`)
    .filter((stamp) => parseDay(stamp) > TODAY)
    .filter((stamp) => {
      const start = stampMinutes(stamp)
      const end = start + rules.consultMinutes
      return !sameDay.some((a) => {
        const aStart = stampMinutes(a.at)
        const aEnd = aStart + (a.minutes ?? 60)
        return start < aEnd + rules.bufferMinutes && aStart < end + rules.bufferMinutes
      })
    })
}

/** The first day from `fromDay` (inclusive) with an open consult time, within 60 days. */
export function firstOpenDay(state, fromDay = toDay(TODAY)) {
  for (let i = 0; i <= 60; i++) {
    const d = addDays(fromDay, i)
    if (openSlots(state, d).length) return d
  }
  return null
}


// ---------------------------------------------------------------------
// Booking (Phase 3): contracts, invoices, the Events list
// ---------------------------------------------------------------------
export const getContract = (state, id) => state.contracts.find((c) => c.id === id)
export const getContractForLead = (state, leadId) => state.contracts.find((c) => c.leadId === leadId)
export const getInvoice = (state, id) => state.invoices.find((i) => i.id === id)

/** paid · overdue · due, for one installment */
export const installmentStatus = (p) => (p.paidAt ? 'paid' : daysUntil(p.dueDate) < 0 ? 'overdue' : 'due')

/** Money totals for one invoice: total, paid, refunded, balance, and a status word. */
export function invoiceTotals(invoice) {
  const paid = invoice.installments.filter((p) => p.paidAt).reduce((s, p) => s + p.amountCents, 0)
  const refunded = (invoice.refunds ?? []).reduce((s, r) => s + r.amountCents, 0)
  const balance = invoice.totalCents - paid
  const overdue = invoice.installments.some((p) => installmentStatus(p) === 'overdue')
  const status = balance <= 0 ? 'paid' : overdue ? 'overdue' : paid > 0 ? 'partially_paid' : 'open'
  return { totalCents: invoice.totalCents, paidCents: paid, refundedCents: refunded, balanceCents: balance, status }
}

/** The next unpaid installment (what Portal › Pay asks for). */
export const nextDue = (invoice) => invoice?.installments.find((p) => !p.paidAt) ?? null

/**
 * Where the client is in booking: review → sign → pay → done.
 * Mirrors the portal's progress bar (CL-2.2).
 */
export function getBookingStep(state, clientId = state.ui?.clientId ?? 'ana') {
  const { lead, event } = getPortal(state, clientId)
  if (!lead) return { step: 'none' }
  const proposal = getProposal(state, lead.id)
  const contract = getContractForLead(state, lead.id)
  const invoice = event && getInvoiceForEvent(state, event.id)
  if (!contract) return { step: 'review', lead, proposal }
  if (!contract.clientSignedAt) return { step: 'sign', lead, proposal, contract }
  if (!invoice?.installments[0].paidAt) return { step: 'pay', lead, proposal, contract, event, invoice }
  return { step: 'done', lead, proposal, contract, event, invoice }
}

const CLOSED_EVENT = ['closed', 'cancelled']
/** Events list rows (PL-4.1): sorted by date, with balance due and open tasks. */
export function getEventRows(state, { when = 'upcoming', status = 'all' } = {}) {
  return state.events
    .filter((e) => (when === 'all' ? true : when === 'upcoming' ? !CLOSED_EVENT.includes(e.status) && daysUntil(e.date) >= 0 : CLOSED_EVENT.includes(e.status) || daysUntil(e.date) < 0))
    .filter((e) => status === 'all' || e.status === status)
    .sort((a, b) => (when === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))
    .map((event) => {
      const invoice = getInvoiceForEvent(state, event.id)
      return {
        event,
        balanceCents: invoice ? invoiceTotals(invoice).balanceCents : null,
        openTasks: state.tasks.filter((t) => t.eventId === event.id && !t.done).length,
      }
    })
}

// ---------------------------------------------------------------------
// Event Hub (Phase 4)
// ---------------------------------------------------------------------
export const getEventGuests = (state, eventId) => state.guests.filter((g) => g.eventId === eventId && !g.removed)
export const getEventTasks = (state, eventId) => state.tasks.filter((t) => t.eventId === eventId && !t.removed)

/** Live guest counts (PL-5.1): people attending, households declined/maybe/no reply, meals, allergies, tracking. */
export function guestCounts(list) {
  const meals = {}
  for (const g of list.filter((x) => x.rsvp === 'attending')) {
    for (const [meal, n] of Object.entries(g.meals ?? {})) meals[meal] = (meals[meal] ?? 0) + n
  }
  const invited = list.filter((g) => g.invite !== 'not_sent')
  return {
    households: list.length,
    invitedPeople: list.reduce((sum, g) => sum + 1 + (g.plusOnes ?? 0), 0),
    attending: list.filter((g) => g.rsvp === 'attending').reduce((sum, g) => sum + g.attending, 0),
    declined: list.filter((g) => g.rsvp === 'declined').length,
    maybe: list.filter((g) => g.rsvp === 'maybe').length,
    noReply: list.filter((g) => !g.rsvp).length,
    responded: list.filter((g) => g.rsvp).length,
    meals,
    allergies: list.filter((g) => g.allergies?.trim()),
    notInvited: list.filter((g) => g.invite === 'not_sent').length,
    tracking: {
      delivered: invited.filter((g) => !['bounced', 'stopped'].includes(g.invite)).length,
      opened: invited.filter((g) => g.invite === 'opened' || g.rsvp).length,
      responded: invited.filter((g) => g.rsvp).length,
      notDelivered: invited.filter((g) => ['bounced', 'stopped'].includes(g.invite)),
    },
  }
}

/** The next deadlines for an event (Overview): tasks, payments, RSVP cutoff, headcount lock. */
export function nextDeadlines(state, event, count = 3) {
  const items = [
    ...getEventTasks(state, event.id).filter((t) => !t.done).map((t) => ({ day: t.due, text: t.title, late: daysUntil(t.due) < 0, to: 'tasks' })),
    ...(getInvoiceForEvent(state, event.id)?.installments ?? []).filter((p) => !p.paidAt && !p.voided).map((p) => ({ day: p.dueDate, text: `${p.label}: ${formatMoney(p.amountCents)}`, late: daysUntil(p.dueDate) < 0, to: 'money' })),
    ...(event.site?.rsvpCutoff && !event.headcount?.lockedAt ? [{ day: event.site.rsvpCutoff, text: 'RSVP cutoff', to: 'guests' }] : []),
  ]
  if (event.date && !event.headcount?.lockedAt) {
    const lock = parseDay(event.date)
    lock.setDate(lock.getDate() - 7)
    items.push({ day: toDay(lock), text: 'Lock final headcount', to: 'guests' })
  }
  return items.filter((x) => x.day).sort((a, b) => a.day.localeCompare(b.day)).filter((x) => x.late || daysUntil(x.day) >= 0).slice(0, count)
}

/** Status path for the Overview (PL-4.2). */
export const STATUS_PATH = ['booked', 'in_planning', 'final_week', 'event_day', 'wrap_up', 'closed']

/** What cancelling would refund, from the contract's policy (PL-3.7). */
export function cancellationQuote(state, eventId) {
  const event = getEvent(state, eventId)
  const invoice = getInvoiceForEvent(state, eventId)
  const daysOut = daysUntil(event.date)
  const paid = invoice ? invoice.installments.filter((p) => p.paidAt) : []
  const depositCents = paid[0] === invoice?.installments[0] && paid[0] ? paid[0].amountCents : 0
  const paidCents = paid.reduce((s, p) => s + p.amountCents, 0)
  const afterDeposit = paidCents - depositCents
  const alreadyRefunded = (invoice?.refunds ?? []).reduce((s, r) => s + r.amountCents, 0)
  const [percent, rule] = daysOut >= 90 ? [100, '90 or more days before: payments after the deposit are refunded in full']
    : daysOut >= 30 ? [50, '30–89 days before: half of the payments after the deposit are refunded']
      : [0, 'Under 30 days before: nothing is refunded']
  const refundCents = Math.max(0, Math.round((afterDeposit * percent) / 100) - alreadyRefunded)
  const unpaidCents = invoice ? invoice.installments.filter((p) => !p.paidAt).reduce((s, p) => s + p.amountCents, 0) : 0
  return { daysOut, paidCents, depositCents, refundCents, keptCents: paidCents - refundCents - alreadyRefunded, unpaidCents, rule }
}

/** Checks before moving an event (PL-3.6): calendar, staff and gear on the new date, and what shifts. */
export function rescheduleCheck(state, eventId, newDate) {
  const event = getEvent(state, eventId)
  const delta = Math.round((parseDay(newDate) - parseDay(event.date)) / 86400000)
  const taken = dateTakenBy(state, newDate, event.leadId)
  const held = state.leads.find((l) => l.hold && l.eventDate === newDate && l.id !== event.leadId && daysUntil(l.hold.until) >= 0)
  const sameDay = state.events.filter((e) => e.id !== eventId && e.date === newDate && !['cancelled', 'closed'].includes(e.status))
  const busyStaff = state.team.filter((m) => m.status === 'active' && state.tasks.some((t) => sameDay.some((e) => e.id === t.eventId) && t.assignee === m.id))
  const proposal = event.leadId && getProposal(state, event.leadId)
  const lines = proposal ? (proposal.versions.find((v) => v.n === proposal.acceptedVersion) ?? proposal.versions.at(-1)).lines : []
  const gear = lines.filter((l) => {
    const addon = state.addons.find((a) => a.id === l.addonId)
    return addon?.owned != null && sameDay.length > 0 && l.qty > addon.owned / 2
  }).map((l) => state.addons.find((a) => a.id === l.addonId).name)
  return {
    delta,
    inPast: daysUntil(newDate) <= 0,
    calendar: taken ? `${taken.name} is already booked that day` : held ? `${held.title} is holding that date` : null,
    staff: busyStaff.map((m) => m.name),
    gear,
    tasksShifting: getEventTasks(state, eventId).filter((t) => !t.done).length,
    paymentsShifting: (getInvoiceForEvent(state, eventId)?.installments ?? []).filter((p) => !p.paidAt && !p.voided).length,
  }
}

// ---- Calendar (PL-4.8) ----
const EVENT_MINUTES = 240
const TRAVEL_MINUTES = 45

/** Everything on the calendar between two days (inclusive): events, appointments, holds. */
export function calendarItems(state, fromDay, toDayIncl) {
  const inRange = (day) => day >= fromDay && day <= toDayIncl
  const items = [
    ...state.events.filter((e) => e.status !== 'cancelled' && inRange(e.date)).map((e) => ({
      id: `e-${e.id}`, kind: 'event', day: e.date, at: `${e.date}T${e.startTime ?? '17:00'}:00`, minutes: e.minutes ?? EVENT_MINUTES,
      title: e.name, place: e.venue, status: e.status, type: e.type, to: `/app/events/${e.id}`,
    })),
    ...state.appointments.filter((a) => inRange(a.at.slice(0, 10))).map((a) => ({
      id: a.id, kind: 'appointment', day: a.at.slice(0, 10), at: a.at, minutes: a.minutes ?? 60, title: `${a.title} · ${a.with}`, place: a.place ?? a.with, to: a.to,
    })),
    ...state.leads.filter((l) => l.hold && l.eventDate && inRange(l.eventDate) && daysUntil(l.hold.until) >= 0).map((l) => ({
      id: `h-${l.id}`, kind: 'hold', day: l.eventDate, at: null, title: `Hold · ${l.title}`, daysLeft: daysUntil(l.hold.until), to: `/app/leads/${l.id}`,
    })),
  ]
  return items.sort((a, b) => (a.at ?? `${a.day}T00`).localeCompare(b.at ?? `${b.day}T00`))
}

/** Double-bookings and too-short travel between places on the same day. */
export function calendarWarnings(items) {
  const warnings = []
  const byDay = {}
  for (const i of items.filter((x) => x.at)) (byDay[i.day] ??= []).push(i)
  for (const [day, list] of Object.entries(byDay)) {
    for (let k = 1; k < list.length; k++) {
      const a = list[k - 1]
      const b = list[k]
      const end = parseDay(a.at).getTime() + a.minutes * 60000
      const gap = Math.round((parseDay(b.at).getTime() - end) / 60000)
      if (gap < 0) warnings.push({ day, text: `${a.title} and ${b.title} overlap`, items: [a, b] })
      else if (gap < TRAVEL_MINUTES && a.place !== b.place) warnings.push({ day, text: `Only ${gap} min between ${a.title} and ${b.title}, but travel takes about ${TRAVEL_MINUTES} min`, items: [a, b] })
    }
  }
  return warnings
}
