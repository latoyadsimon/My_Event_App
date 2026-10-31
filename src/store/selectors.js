// =====================================================================
// Selectors: small functions that read answers out of the state, so screens
// don't repeat the same lookups. Pure functions → easy to test.
// =====================================================================
import { TODAY, daysUntil, parseDay, formatWeekdayDay } from '../lib/clock'
import { formatMoney } from '../lib/money'

export const getLead = (state, id) => state.leads.find((l) => l.id === id)
export const getEvent = (state, id) => state.events.find((e) => e.id === id)
export const getClient = (state, id) => state.clients.find((c) => c.id === id)
export const getInvoiceForEvent = (state, eventId) => state.invoices.find((i) => i.eventId === eventId)

/**
 * The client portal's world for one client (the demo client is Ana).
 * Before the deposit there's a lead but no unlocked event, so planning pages stay locked.
 */
export function getPortal(state, clientId = 'ana') {
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
