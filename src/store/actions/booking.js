// =====================================================================
// Booking (Phase 3): the client accepts, signs and pays; the planner
// countersigns. Each handler mirrors a server function in
// app_outline/erd/functions.sql, so Supabase can take over one by one:
//
//   proposal/view            → client_mark_proposal_viewed
//   proposal/requestChanges  → client_request_proposal_changes
//   proposal/accept          → client_accept_proposal   (contract generated)
//   contract/clientSign      → client_sign_contract     (event + invoice created)
//   payment/succeeded        → record_payment           (Stripe/Square webhook)
//   payment/failed           → payment.failed event
//   payment/recordManual     → planner_record_manual_payment
//   contract/countersign     → planner_countersign      (refused until the deposit is paid)
// =====================================================================
import { CHECKLIST_ITEMS, withPlanning } from '../../data/seed'
import { DEFAULT_THEME_FOR_EVENT_TYPE } from '../../styles/themes'
import { formatDay, formatWeekdayDay, nowStamp, parseDay } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { priceVersion, latestSent } from '../../lib/proposal'
import { getCatalog, getProposal, toDay } from '../selectors'
import { newId, updateById, withActivity, withMessage, withToast, firstName } from '../helpers'

const today = () => nowStamp().slice(0, 10)
const shiftDay = (day, n) => { const d = parseDay(day); d.setDate(d.getDate() + n); return toDay(d) }
const plannerInbox = (state) => `${firstName(state.team.find((m) => m.role === 'owner')?.name)} (planner)`
const pushToPlanner = (state, subject, body, to) => withMessage(state, {
  type: 'push', to: plannerInbox(state), from: `${state.business.name} · Crowned`, subject, body,
  link: { label: 'Open', to, role: 'planner' },
})

const leadOf = (state, leadId) => state.leads.find((l) => l.id === leadId)
const clientOf = (state, clientId) => state.clients.find((c) => c.id === clientId)

/** Due dates from the schedule: deposit today, then N days before the event (never in the past). */
function scheduleDates(schedule, eventDate) {
  return schedule.map((s) => (s.daysBefore == null || !eventDate ? today() : [shiftDay(eventDate, -s.daysBefore), today()].sort().at(-1)))
}

/** Apply a successful payment: the installment is paid; the deposit unlocks the portal. */
function applyPayment(state, invoiceId, installmentId, method) {
  const invoice = state.invoices.find((i) => i.id === invoiceId)
  const installment = invoice?.installments.find((p) => p.id === installmentId)
  if (!installment || installment.paidAt) return null           // never charge twice (NFR-6)
  const isDeposit = invoice.installments[0].id === installmentId
  let next = {
    ...state,
    invoices: updateById(state.invoices, invoiceId, (i) => ({
      failedAttempts: 0,
      installments: i.installments.map((p) => (p.id === installmentId ? { ...p, paidAt: nowStamp(), method } : p)),
    })),
  }
  if (isDeposit) next = { ...next, events: updateById(next.events, invoice.eventId, (e) => ({ portalUnlockedAt: e.portalUnlockedAt ?? nowStamp() })) }
  return { next, invoice, installment, isDeposit, event: next.events.find((e) => e.id === invoice.eventId) }
}

export const bookingActions = {
  'proposal/view': (state, a) => {
    const proposal = getProposal(state, a.leadId)
    if (!proposal || proposal.viewedAt) return state
    const n = latestSent(proposal)?.n
    const next = { ...state, proposals: updateById(state.proposals, proposal.id, { viewedAt: nowStamp() }) }
    return withActivity(next, a.leadId, `Client opened proposal v${n}`)
  },

  // CL-2.2 [Request changes]: the comment lands on the proposal for the planner
  'proposal/requestChanges': (state, a) => {
    const proposal = getProposal(state, a.leadId)
    const sent = latestSent(proposal)
    if (!sent || !a.text?.trim()) return state
    const lead = leadOf(state, a.leadId)
    const client = clientOf(state, lead.clientId)
    let next = {
      ...state,
      proposals: updateById(state.proposals, proposal.id, (p) => ({
        status: 'changes_requested',
        versions: p.versions.map((v) => (v.n === sent.n ? { ...v, changeRequest: { by: firstName(client.name), at: nowStamp(), text: a.text.trim() } } : v)),
      })),
    }
    next = withActivity(next, lead.id, `${firstName(client.name)} requested changes to the proposal`)
    next = pushToPlanner(next, `${client.name} requested changes`, `“${a.text.trim()}”`, `/app/proposals/${lead.id}`)
    return withToast(next, `Sent to ${state.business.name}. You'll get an updated proposal by email.`)
  },

  // CL-2.2 [Accept proposal] → the contract is generated from the template (PL-3.3)
  'proposal/accept': (state, a) => {
    const proposal = getProposal(state, a.leadId)
    const version = latestSent(proposal)
    if (!version || state.contracts.some((c) => c.leadId === a.leadId)) return state
    const chosen = (a.chosen ?? []).filter((id) => version.lines.some((l) => l.addonId === id && l.optional))
    const priced = priceVersion(version, getCatalog(state), chosen)
    const contract = {
      id: a.leadId, leadId: a.leadId, eventId: null, versionN: version.n, chosen,
      totalCents: priced.totalCents, depositCents: priced.depositCents,
      clientSignedAt: null, clientSignature: null, plannerSignedAt: null, plannerSignature: null,
    }
    const next = {
      ...state,
      contracts: [...state.contracts, contract],
      proposals: updateById(state.proposals, proposal.id, { status: 'accepted', acceptedAt: nowStamp(), acceptedVersion: version.n, chosen }),
    }
    return withActivity(next, a.leadId, `Proposal v${version.n} accepted (${formatMoney(priced.totalCents)})`)
  },

  // CL-2.3 sign → the event (awaiting countersign), invoice and payment schedule are created now,
  // so the client can pay the deposit in the same sitting (functions.sql: client_sign_contract)
  'contract/clientSign': (state, a) => {
    const contract = state.contracts.find((c) => c.id === a.contractId)
    if (!contract || contract.clientSignedAt || !a.consent || !a.signature?.trim()) return state
    const lead = leadOf(state, contract.leadId)
    const client = clientOf(state, lead.clientId)
    const eventId = lead.id
    const event = {
      id: eventId, leadId: lead.id, clientId: lead.clientId, name: lead.title.replace(/^./, (c) => c.toUpperCase()),
      type: lead.eventType, date: lead.eventDate, startTime: '17:00', venue: lead.venue, status: 'awaiting_countersign',
      guestCount: lead.guestCount, theme: DEFAULT_THEME_FOR_EVENT_TYPE[lead.eventType] ?? 'party-pop', portalUnlockedAt: null,
    }
    const dues = scheduleDates(state.business.paymentSchedule, lead.eventDate)
    const priced = priceVersion(latestSent(getProposal(state, lead.id)), getCatalog(state), contract.chosen)
    const number = Math.max(1000, ...state.invoices.map((i) => i.number)) + 1
    const invoice = {
      id: eventId, number, eventId, totalCents: contract.totalCents, refunds: [], failedAttempts: 0,
      options: { autopay: false, passCardFee: false, lateFee: false, remindersPaused: false },
      installments: priced.schedule.map((s, i) => ({ id: `${eventId}-${i + 1}`, label: s.label, dueDate: dues[i], amountCents: s.amountCents, paidAt: null, method: null })),
    }
    let next = {
      ...state,
      contracts: updateById(state.contracts, contract.id, { clientSignedAt: nowStamp(), clientSignature: a.signature.trim(), eventId }),
      events: [...state.events.filter((e) => e.id !== eventId), withPlanning(event)],
      invoices: [...state.invoices, invoice],
      leads: updateById(state.leads, lead.id, { stage: 'won', hold: null }),
    }
    next = withActivity(next, lead.id, `${firstName(client.name)} signed the contract`)
    return pushToPlanner(next, `${client.name} signed the contract`, `${event.name} · waiting for the ${formatMoney(invoice.installments[0].amountCents)} deposit`, `/app/contracts/${contract.id}`)
  },

  // Stripe/Square webhook stand-in: payment.succeeded (CL-2.4, PL-3.5)
  'payment/succeeded': (state, a) => {
    const done = applyPayment(state, a.invoiceId, a.installmentId, a.method ?? 'Visa ·4242')
    if (!done) return state
    let { next } = done
    const { invoice, installment, isDeposit, event } = done
    const client = clientOf(next, event.clientId)
    if (a.autopay) next = { ...next, invoices: updateById(next.invoices, invoice.id, (i) => ({ options: { ...i.options, autopay: true } })) }
    if (event.leadId) next = withActivity(next, event.leadId, `${installment.label} paid (${formatMoney(installment.amountCents)})`)
    next = withMessage(next, isDeposit
      ? {
          type: 'email', to: client.email, from: next.business.name, subject: 'Your date is locked! 🎉',
          body: `Hi ${firstName(client.name)}, we received your ${formatMoney(installment.amountCents)} deposit. ${formatDay(event.date)} is yours. Your planning portal is now open: to-dos, guests, mood board and messages, all in one place. Receipt #${invoice.number}-1 is attached.`,
          link: { label: 'Go to your portal', to: '/portal', role: 'client', clientId: client.id },
        }
      : {
          type: 'email', to: client.email, from: next.business.name, subject: `Receipt: ${formatMoney(installment.amountCents)} paid`,
          body: `Thanks, ${firstName(client.name)}! We received ${formatMoney(installment.amountCents)} for ${event.name} (${installment.label}).`,
          link: { label: 'See your payments', to: '/portal/payments', role: 'client', clientId: client.id },
        })
    if (isDeposit && event.status === 'awaiting_countersign') {
      next = pushToPlanner(next, `${client.name} signed and paid the deposit`, `${event.name} · countersign to book it`, `/app/contracts/${state.contracts.find((c) => c.eventId === event.id)?.id ?? event.id}`)
    } else {
      next = pushToPlanner(next, `Payment received: ${formatMoney(installment.amountCents)}`, `${event.name} · ${installment.label}`, `/app/invoices/${invoice.id}`)
    }
    return next
  },

  // payment.failed: nothing charged; the planner is alerted after 2 failures
  'payment/failed': (state, a) => {
    const invoice = state.invoices.find((i) => i.id === a.invoiceId)
    if (!invoice) return state
    const failedAttempts = (invoice.failedAttempts ?? 0) + 1
    const next = { ...state, invoices: updateById(state.invoices, invoice.id, { failedAttempts }) }
    if (failedAttempts !== 2) return next
    const event = next.events.find((e) => e.id === invoice.eventId)
    return pushToPlanner(next, `Payment failed twice: ${event.name}`, 'The card was declined two times. Nothing was charged. You may want to reach out.', `/app/invoices/${invoice.id}`)
  },

  // [Record payment] for cash, check, Venmo, Zelle, Cash App (PL-3.5)
  'payment/recordManual': (state, a) => {
    const done = applyPayment(state, a.invoiceId, a.installmentId, a.method)
    if (!done) return state
    let { next } = done
    const { installment, event, isDeposit } = done
    if (event.leadId) next = withActivity(next, event.leadId, `${installment.label} recorded (${a.method})`)
    if (isDeposit && event.status === 'awaiting_countersign') next = withToast(next, 'Deposit recorded. You can countersign now.')
    else next = withToast(next, `${formatMoney(installment.amountCents)} recorded (${a.method})`)
    return next
  },

  // PL-3.4: refused until the deposit is paid, with a plain message (functions.sql: planner_countersign)
  'contract/countersign': (state, a) => {
    const contract = state.contracts.find((c) => c.id === a.contractId)
    if (!contract || contract.plannerSignedAt) return state
    if (!contract.clientSignedAt) return withToast(state, 'The client hasn\'t signed yet. You can countersign after they do.', 'danger')
    const invoice = state.invoices.find((i) => i.eventId === contract.eventId)
    const deposit = invoice?.installments[0]
    if (deposit && deposit.amountCents > 0 && !deposit.paidAt) {
      return withToast(state, 'The client hasn\'t paid the deposit yet. You can countersign once it\'s paid.', 'danger')
    }
    if (!a.signature?.trim()) return state
    const event = state.events.find((e) => e.id === contract.eventId)
    const client = clientOf(state, event.clientId)
    const owner = state.team.find((m) => m.role === 'owner')
    const items = CHECKLIST_ITEMS[event.type] ?? CHECKLIST_ITEMS.default
    const soonest = shiftDay(today(), 2)
    const tasks = items.map(([title, daysBefore]) => ({
      id: newId('task'), eventId: event.id, title, assignee: owner?.id ?? 'owner', done: false,
      due: [shiftDay(event.date, -daysBefore), soonest].sort().at(-1),
    }))
    let next = {
      ...state,
      contracts: updateById(state.contracts, contract.id, { plannerSignedAt: nowStamp(), plannerSignature: a.signature.trim() }),
      events: updateById(state.events, event.id, { status: 'booked' }),
      leads: updateById(state.leads, event.leadId, { hold: null }),
      tasks: [...state.tasks, ...tasks],
    }
    if (event.leadId) next = withActivity(next, event.leadId, 'You countersigned: booked')
    next = withMessage(next, {
      type: 'email', to: client.email, from: state.business.name, subject: `You're officially booked: ${event.name}`,
      body: `Hi ${firstName(client.name)}, ${firstName(owner?.name)} countersigned your contract. ${formatWeekdayDay(event.date)} is confirmed. A copy of the signed contract is attached.`,
      link: { label: 'Open your portal', to: '/portal', role: 'client', clientId: client.id },
    })
    return withToast(next, `${event.name} is booked`)
  },

  // ---- Invoice tools (PL-3.5) ----
  'invoice/setOption': (state, a) => ({
    ...state, invoices: updateById(state.invoices, a.invoiceId, (i) => ({ options: { ...i.options, [a.key]: a.value } })),
  }),

  'invoice/refund': (state, a) => {
    const invoice = state.invoices.find((i) => i.id === a.invoiceId)
    const paid = invoice.installments.filter((p) => p.paidAt).reduce((s, p) => s + p.amountCents, 0)
    const refunded = invoice.refunds.reduce((s, r) => s + r.amountCents, 0)
    if (!(a.amountCents > 0) || a.amountCents > paid - refunded) return state
    const next = {
      ...state,
      invoices: updateById(state.invoices, invoice.id, (i) => ({ refunds: [...i.refunds, { id: newId('refund'), at: nowStamp(), amountCents: a.amountCents, kind: a.kind ?? 'refund', reason: a.reason ?? '' }] })),
    }
    return withToast(next, `${a.kind === 'credit' ? 'Credit' : 'Refund'} of ${formatMoney(a.amountCents)} recorded`)
  },

  // [Send reminder]: the payment-reminder template as a text message
  'invoice/sendReminder': (state, a) => {
    const invoice = state.invoices.find((i) => i.id === a.invoiceId)
    const due = invoice.installments.find((p) => !p.paidAt)
    if (!due) return state
    const event = state.events.find((e) => e.id === invoice.eventId)
    const client = clientOf(state, event.clientId)
    const body = invoice.options?.autopay
      ? `Hi ${firstName(client.name)}, heads up: we'll charge your card on file ${formatMoney(due.amountCents)} for ${event.name} on ${formatWeekdayDay(due.dueDate)}. Nothing to do.`
      : state.business.templates.messages.paymentReminder
      .replace('{first_name}', firstName(client.name)).replace('{amount}', formatMoney(due.amountCents))
      .replace('{event}', event.name).replace('{due_date}', formatWeekdayDay(due.dueDate)).replace('{pay_link}', '')
      .trim()
    const next = withMessage(state, {
      type: 'sms', to: client.phone || client.email, from: state.business.name, subject: 'Payment reminder', body,
      link: { label: 'Pay now', to: '/portal/pay', role: 'client', clientId: client.id },
    })
    return withToast(next, `Reminder sent to ${firstName(client.name)}`)
  },

  // [+ New event] for events that didn't come from a lead (PL-4.1)
  'event/create': (state, a) => {
    const email = a.email.trim().toLowerCase()
    let client = state.clients.find((c) => c.email.toLowerCase() === email)
    let next = state
    if (!client) {
      client = { id: newId('client'), name: a.clientName.trim(), email: a.email.trim(), phone: '' }
      next = { ...next, clients: [...next.clients, client] }
    }
    const event = {
      id: a.id ?? newId('event'), leadId: null, clientId: client.id, name: a.name.trim(), type: a.eventType, date: a.date,
      startTime: a.startTime || '17:00', venue: a.venue?.trim() || 'TBD', status: 'booked', guestCount: Number(a.guestCount) || null,
      theme: DEFAULT_THEME_FOR_EVENT_TYPE[a.eventType] ?? 'party-pop', portalUnlockedAt: nowStamp(),
    }
    return withToast({ ...next, events: [...next.events, withPlanning(event)] }, `${event.name} added`)
  },
}
