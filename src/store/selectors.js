// =====================================================================
// Selectors: small functions that read answers out of the state, so screens
// don't repeat the same lookups. Pure functions → easy to test.
// =====================================================================
import { TODAY, daysUntil, parseDay, formatWeekdayDay } from '../lib/clock'
import { formatMoney } from '../lib/money'
import { eventTypeLabel } from '../data/seed'

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

/** The person signed in on the planner side (the demo's planner is the owner). */
export const getMe = (state) => state.team.find((m) => m.role === 'owner')

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
  const lateByEvent = {}
  for (const t of openTasks.filter((x) => daysUntil(x.due) < 0)) lateByEvent[t.eventId] = (lateByEvent[t.eventId] ?? 0) + 1
  for (const [eventId, n] of Object.entries(lateByEvent)) {
    alerts.push({ id: `late-${eventId}`, tone: 'warning', text: `${eventById[eventId].name}: ${n} late task${n > 1 ? 's' : ''}`, to: `/app/events/${eventId}/tasks` })
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
