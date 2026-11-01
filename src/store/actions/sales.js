// =====================================================================
// Leads and selling (Phase 2): inquiries, lead follow-up, consults, proposals.
// Each handler is (state, action) → new state, and stands in for a backend
// step (lead.created job, send_proposal, …) until Supabase.
// =====================================================================
import { eventTypeLabel, LEAD_STAGES } from '../../data/seed'
import { formatDay, formatTime, formatWeekdayDay, nowStamp, parseDay } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { priceVersion, draftOf } from '../../lib/proposal'
import { dateTakenBy, getCatalog, toDay } from '../selectors'
import { newId, updateById, withActivity, withMessage, withToast, firstName } from '../helpers'

const PLANNER_INBOX = (state) => `${state.team.find((m) => m.role === 'owner')?.name.split(' ')[0] ?? 'You'} (planner)`
const stageLabel = (id) => LEAD_STAGES.find((s) => s.id === id)?.label ?? id
const clientOf = (state, lead) => state.clients.find((c) => c.id === lead.clientId)
const lastName = (name) => name.trim().split(/\s+/).at(-1)
const fill = (template, values) => template.replace(/\{(\w+)\}/g, (all, key) => values[key] ?? all)

/** Early stages move forward when the planner reaches out (never backwards). */
const moveUpTo = (lead, stage) => {
  const order = LEAD_STAGES.map((s) => s.id)
  return order.indexOf(lead.stage) < order.indexOf(stage) && !['won', 'lost'].includes(lead.stage) ? stage : lead.stage
}

/** Find the client by email, or add them. Returns [state, clientId]. */
function upsertClient(state, { name, email, phone }) {
  const found = state.clients.find((c) => c.email.toLowerCase() === email.trim().toLowerCase())
  if (found) return [state, found.id]
  const client = { id: newId('client'), name: name.trim(), email: email.trim(), phone: phone?.trim() ?? '' }
  return [{ ...state, clients: [...state.clients, client] }, client.id]
}

// ---- lead.created: an inquiry (or a lead the planner adds) ----
function createLead(state, a) {
  let next
  let clientId
  ;[next, clientId] = upsertClient(state, a)
  const id = a.id ?? newId('lead')
  const typeWords = eventTypeLabel(a.eventType).toLowerCase()
  const taken = dateTakenBy(next, a.eventDate)
  const lead = {
    id, clientId,
    title: `${lastName(a.name)} ${typeWords}`,
    eventType: a.eventType, eventDate: a.eventDate || null,
    guestCount: Number(a.guestCount) || null, budget: a.budget || 'Not sure yet', services: a.services ?? [],
    venue: a.venue || 'TBD', notes: a.notes ?? '',
    source: a.source || 'Other', stage: 'new', receivedAt: nowStamp(),
    activity: [{ at: nowStamp(), text: a.manual ? 'Lead added by you' : 'Inquiry received from website' }],
  }
  if (taken) lead.activity.push({ at: nowStamp(), text: `Requested date is already booked (${taken.name})` })
  next = { ...next, leads: [...next.leads, lead] }
  if (a.manual) return withToast(next, `Lead added: ${a.name.trim()}`)

  const summary = [eventTypeLabel(a.eventType), a.eventDate && formatDay(a.eventDate), a.guestCount && `${a.guestCount} guests`, a.budget].filter(Boolean).join(' · ')
  const bookingLink = `/b/${next.business.slug}/book?lead=${id}`
  next = withActivity(next, id, 'Auto-reply sent with booking link')
  // Order matters only for the Outbox list: newest first, so the push lands on top.
  next = withMessage(next, {
    type: 'email', to: a.email.trim(), from: next.business.name,
    subject: `Thanks, ${firstName(a.name)}! Let's talk about your ${typeWords}`,
    body: fill(next.business.templates.messages.autoReply, { booking_link: 'the button below', first_name: firstName(a.name) }),
    link: { label: 'Pick a consult time', to: bookingLink, role: 'client', clientId },
  })
  return withMessage(next, {
    type: 'push', to: PLANNER_INBOX(next), from: `${next.business.name} · Crowned`,
    subject: `New lead: ${a.name.trim()}${taken ? ' · ⚠ date taken' : ''}`, body: summary,
    link: { label: 'Open lead', to: `/app/leads/${id}`, role: 'planner' },
  })
}

// ---- consult booked from the public booking page (CL-1.2, PL-2.4) ----
function bookConsult(state, a) {
  if (state.appointments.some((x) => x.at === a.at && x.title === 'Consult')) return state   // someone just took it
  let next = state
  let lead = a.leadId && state.leads.find((l) => l.id === a.leadId)
  if (!lead) {
    const email = a.email.trim().toLowerCase()
    const client = state.clients.find((c) => c.email.toLowerCase() === email)
    lead = client && state.leads.find((l) => l.clientId === client.id && !['won', 'lost'].includes(l.stage))
  }
  if (!lead) {   // booked straight from the link, no inquiry first: start a lead quietly
    next = createLead(next, { id: newId('lead'), name: a.name, email: a.email, eventType: 'other', source: 'Booking page', manual: true })
    next = { ...next, toasts: state.toasts }
    lead = next.leads.at(-1)
  }
  const client = clientOf(next, lead)
  const when = `${formatWeekdayDay(a.at)}, ${formatTime(a.at)}`
  next = {
    ...next,
    appointments: [...next.appointments, { id: newId('appt'), at: a.at, minutes: next.business.booking.consultMinutes, title: 'Consult', with: lead.title, to: `/app/leads/${lead.id}`, leadId: lead.id }],
    leads: updateById(next.leads, lead.id, (l) => ({ stage: moveUpTo(l, 'consult_booked'), consultAt: a.at })),
  }
  next = withActivity(next, lead.id, `Consult booked: ${when}`)
  next = withMessage(next, {
    type: 'email', to: client.email, from: next.business.name,
    subject: `You're booked: ${when}`,
    body: `Your free ${next.business.booking.consultMinutes}-minute consult with ${next.business.name} is set for ${when}. We'll send a reminder 24 hours and 1 hour before.`,
    foot: 'A calendar invite is attached.',
  })
  return withMessage(next, {
    type: 'push', to: PLANNER_INBOX(next), from: `${next.business.name} · Crowned`,
    subject: `Consult booked: ${client.name}`, body: when,
    link: { label: 'Open lead', to: `/app/leads/${lead.id}`, role: 'planner' },
  })
}

// ---- send the proposal (PL-3.2): a new version + a magic-link email ----
function sendProposal(state, a) {
  let next = a.version ? saveDraft(state, a) : state
  const proposal = next.proposals.find((p) => p.leadId === a.leadId)
  const draft = draftOf(proposal)
  if (!draft?.packageId) return state
  const lead = next.leads.find((l) => l.id === a.leadId)
  const client = clientOf(next, lead)
  const priced = priceVersion(draft, getCatalog(next))
  next = {
    ...next,
    proposals: updateById(next.proposals, proposal.id, (p) => ({
      status: 'sent', viewedAt: null,
      versions: p.versions.map((v) => (v.n === draft.n ? { ...v, sentAt: nowStamp(), totalCents: priced.totalCents } : v)),
    })),
    leads: updateById(next.leads, lead.id, (l) => ({ stage: ['won', 'lost'].includes(l.stage) ? l.stage : 'proposal_sent' })),
  }
  next = withActivity(next, lead.id, `Proposal v${draft.n} sent`)
  next = withMessage(next, {
    type: 'email', to: client.email, from: next.business.name,
    subject: `Your proposal (v${draft.n}) is ready`,
    body: `Hi ${firstName(client.name)}, your proposal for ${lead.title} comes to ${formatMoney(priced.totalCents)}, with a ${formatMoney(priced.depositCents)} deposit to book. Review it, then accept, sign and pay your deposit in one sitting.${a.note ? ` ${a.note}` : ''}`,
    link: { label: 'View your proposal', to: '/portal/proposal', role: 'client', clientId: client.id },
    foot: 'This link is just for you and expires in 7 days.',
  })
  return withToast(next, `Proposal v${draft.n} sent to ${firstName(client.name)}`)
}

/** Save the planner's unsent version (one draft at a time, after the last sent one). */
function saveDraft(state, a) {
  const content = { packageId: a.version.packageId, discountCents: a.version.discountCents ?? 0, lines: a.version.lines }
  const existing = state.proposals.find((p) => p.leadId === a.leadId)
  if (!existing) {
    return { ...state, proposals: [...state.proposals, { id: a.leadId, leadId: a.leadId, status: 'draft', versions: [{ n: 1, sentAt: null, ...content }] }] }
  }
  const draft = draftOf(existing)
  const versions = draft
    ? existing.versions.map((v) => (v.n === draft.n ? { ...v, ...content } : v))
    : [...existing.versions, { n: existing.versions.at(-1).n + 1, sentAt: null, ...content }]
  return { ...state, proposals: updateById(state.proposals, existing.id, { versions }) }
}

export const salesActions = {
  'lead/create': createLead,

  'lead/update': (state, a) => ({ ...state, leads: updateById(state.leads, a.leadId, a.changes) }),

  'lead/move': (state, a) => {
    const lead = state.leads.find((l) => l.id === a.leadId)
    if (!lead || lead.stage === a.stage) return state
    const next = { ...state, leads: updateById(state.leads, a.leadId, { stage: a.stage }) }
    return withActivity(next, a.leadId, `Moved to ${stageLabel(a.stage)}`)
  },

  'lead/markLost': (state, a) => {
    const next = { ...state, leads: updateById(state.leads, a.leadId, { stage: 'lost', lostReason: a.reason || null, hold: null }) }
    return withActivity(next, a.leadId, a.reason ? `Marked lost: ${a.reason}` : 'Marked lost')
  },

  // [Send canned reply] after the planner edits it (PL-2.3)
  'lead/reply': (state, a) => {
    const lead = state.leads.find((l) => l.id === a.leadId)
    const client = clientOf(state, lead)
    let next = { ...state, leads: updateById(state.leads, lead.id, (l) => ({ stage: moveUpTo(l, 'contacted') })) }
    next = withActivity(next, lead.id, 'You replied by email')
    next = withMessage(next, { type: 'email', to: client.email, from: state.business.name, subject: a.subject || `About your ${eventTypeLabel(lead.eventType).toLowerCase()}`, body: a.text })
    return withToast(next, `Reply sent to ${firstName(client.name)}`)
  },

  // [Hold date · 7 days]: a soft hold that shows dashed on the Calendar and expires
  'lead/holdDate': (state, a) => {
    const lead = state.leads.find((l) => l.id === a.leadId)
    if (!lead?.eventDate) return state
    const until = parseDay(nowStamp().slice(0, 10))
    until.setDate(until.getDate() + (a.days ?? state.business.holdDays))
    const next = { ...state, leads: updateById(state.leads, lead.id, { hold: { until: toDay(until), since: nowStamp() } }) }
    return withToast(withActivity(next, lead.id, `Date held until ${formatDay(toDay(until))}`), `${formatDay(lead.eventDate)} held for ${a.days ?? state.business.holdDays} days`)
  },

  'lead/releaseHold': (state, a) => {
    const next = { ...state, leads: updateById(state.leads, a.leadId, { hold: null }) }
    return withActivity(next, a.leadId, 'Date hold released')
  },

  // [Send booking link]
  'lead/sendBookingLink': (state, a) => {
    const lead = state.leads.find((l) => l.id === a.leadId)
    const client = clientOf(state, lead)
    let next = { ...state, leads: updateById(state.leads, lead.id, (l) => ({ stage: moveUpTo(l, 'contacted') })) }
    next = withActivity(next, lead.id, 'Booking link sent')
    next = withMessage(next, {
      type: 'email', to: client.email, from: state.business.name, subject: 'Pick a time to talk',
      body: `Hi ${firstName(client.name)}, pick any open time for a free ${state.business.booking.consultMinutes}-minute consult and we'll talk through your ideas.`,
      link: { label: 'Pick a consult time', to: `/b/${state.business.slug}/book?lead=${lead.id}`, role: 'client', clientId: client.id },
    })
    return withToast(next, `Booking link sent to ${firstName(client.name)}`)
  },

  'consult/book': bookConsult,

  'proposal/saveDraft': (state, a) => withToast(saveDraft(state, a), 'Draft saved'),
  'proposal/send': sendProposal,
}
