// =====================================================================
// Event day and wrap-up (product Phase 2): start the day (morning-of
// message), cue items done, running late, door check-in and walk-ins,
// on-site sales, incidents, the teardown gear check, then the final
// invoice, the security deposit and closing the event.
// Check-ins and incidents are append-only, so two phones checking in
// the same household can't double-count it (NFR-4).
// =====================================================================
import { formatDay, nowStamp } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { closeOut, formatClock, hhmm, minutesOf, packList } from '../selectors'
import { newId, updateById, withMessage, withToast, firstName } from '../helpers'
import { notifyVendors } from './logistics'
import { staffActions } from './staff'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const owner = (state) => state.team.find((m) => m.role === 'owner')
const withLog = (state, eventId, text) => ({
  ...state, events: updateById(state.events, eventId, (e) => ({ log: [...(e.log ?? []), { at: nowStamp(), text }] })),
})
const pushToPlanner = (state, subject, body, to) => withMessage(state, {
  type: 'push', to: `${firstName(owner(state)?.name)} (planner)`, from: `${state.business.name} · Crowned`,
  subject, body, link: { label: 'Open', to, role: 'planner' },
})
const emailClient = (state, event, subject, body, link) => {
  const client = state.clients.find((c) => c.id === event.clientId)
  return withMessage(state, { type: 'email', to: client.email, from: state.business.name, subject, body, link: link && { ...link, role: 'client', clientId: client.id } })
}
const invoiceFor = (state, eventId) => state.invoices.find((i) => i.eventId === eventId)
const today = () => nowStamp().slice(0, 10)

/** Add a charge to the invoice as its own line (on-site add-on or damage). */
function addCharge(state, invoice, { label, amountCents, extra, paid, method }) {
  const line = { id: newId(`${invoice.id}-x`), label, dueDate: today(), amountCents, extra, paidAt: paid ? nowStamp() : null, method: paid ? method : null }
  return { ...state, invoices: updateById(state.invoices, invoice.id, (i) => ({ totalCents: i.totalCents + amountCents, installments: [...i.installments, line] })) }
}

export const eventDayActions = {
  // The day starts: status Event day; the client gets the essentials (CL-5.1)
  'event/startDay': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event || !['booked', 'in_planning', 'final_week'].includes(event.status)) return state
    const lead = state.team.find((m) => m.role === 'coordinator' && m.status === 'active') ?? owner(state)
    const first = state.timeline.filter((t) => t.eventId === event.id && !t.removed && t.visibility.includes('client')).sort((x, y) => minutesOf(x.time) - minutesOf(y.time))[0]
    let next = { ...state, events: updateById(state.events, event.id, { status: 'event_day', dayStartedAt: nowStamp() }) }
    next = emailClient(next, event, `Today's the day: ${event.name}`,
      `Good morning! ${first ? `Things start at ${formatClock(first.time)} (${first.title}).` : ''} Your day-of contact is ${lead.name}, ${lead.phone}. Relax and enjoy it; we've got it from here.`,
      { label: 'Day-of info', to: '/portal/day-of' })
    return withToast(withLog(next, event.id, 'Event day started'), 'Event day started. The client got the morning-of message.')
  },

  'timeline/toggleDone': (state, a) => ({ ...state, timeline: updateById(state.timeline, a.id, (t) => ({ done: !t.done, doneAt: t.done ? null : nowStamp() })) }),

  // Running late: every item from this one on moves; affected vendors and the crew hear about it
  'timeline/delay': (state, a) => {
    const from = state.timeline.find((t) => t.id === a.fromId)
    if (!from || !a.minutes) return state
    const start = minutesOf(from.time)
    const moved = state.timeline.filter((t) => t.eventId === from.eventId && !t.removed && !t.done && minutesOf(t.time) >= start)
    const ids = new Set(moved.map((t) => t.id))
    let next = { ...state, timeline: state.timeline.map((t) => (ids.has(t.id) ? { ...t, time: hhmm(minutesOf(t.time) + a.minutes) } : t)) }
    const vendorIds = [...new Set(moved.filter((t) => t.owner?.startsWith('v:')).map((t) => t.owner.slice(2)))]
    if (vendorIds.length) next = notifyVendors(next, from.eventId, `Running ${a.minutes} minutes late: ${from.title} is now at ${formatClock(hhmm(start + a.minutes))}, and everything after moves too.`, vendorIds)
    next = staffActions['thread/postTeam'](next, { eventId: from.eventId, memberId: a.memberId ?? owner(state).id, text: `Running ${a.minutes} min late. ${from.title} now ${formatClock(hhmm(start + a.minutes))}; the rest of the timeline moved.`, alert: true })
    return withToast(withLog(next, from.eventId, `Running ${a.minutes} min late from “${from.title}”`), `Moved ${moved.length} item${moved.length === 1 ? '' : 's'} by ${a.minutes} min. Team and ${vendorIds.length} vendor${vendorIds.length === 1 ? '' : 's'} told.`)
  },

  // ---- Door check-in (ST-4.3, GU-5.1) ----
  'guest/checkIn': (state, a) => {
    const g = state.guests.find((x) => x.id === a.guestId)
    if (!g) return state
    if (g.checkedIn) return withToast(state, `${g.name} is already checked in (${g.checkedIn})`, 'warning')
    const people = Math.max(1, Number(a.people) || g.attending || 1)
    return withToast({ ...state, guests: updateById(state.guests, g.id, { checkedIn: people, checkedInAt: nowStamp(), checkedInBy: a.by ?? null }) }, `Checked in: ${g.name}${people > 1 ? ` + ${people - 1}` : ''}`)
  },
  'guest/walkIn': (state, a) => {
    if (!a.name?.trim()) return state
    const people = Math.max(1, Number(a.people) || 1)
    const id = newId('walk')
    const guest = {
      id, eventId: a.eventId, name: a.name.trim(), email: '', phone: '', group: 'Walk-ins', plusOnes: people - 1, tags: ['walk-in'], notes: '', gift: '', allergies: '', songRequest: '', answers: {},
      invite: 'not_sent', rsvp: 'attending', attending: people, meals: {}, respondedAt: nowStamp(), addedBy: 'door', token: `${id}-t`, walkIn: true, checkedIn: people, checkedInAt: nowStamp(),
    }
    return withToast({ ...state, guests: [...state.guests, guest] }, `Walk-in added: ${guest.name}`)
  },

  // ---- On-site sales (PL-7.3): tap-to-pay, added to the invoice; staff need "Take payments" ----
  'sale/onsite': (state, a) => {
    const member = state.team.find((m) => m.id === a.memberId) ?? owner(state)
    if (member.role !== 'owner' && !member.permissions?.take_payments) return withToast(state, 'You need “Take payments” to sell on site.', 'danger')
    const event = eventOf(state, a.eventId)
    const invoice = invoiceFor(state, event.id)
    if (!invoice || !a.amountCents) return state
    let next = addCharge(state, invoice, { label: `On site: ${a.label}`, amountCents: a.amountCents, extra: 'onsite', paid: true, method: 'Tap to pay' })
    next = emailClient(next, event, `Receipt: ${a.label}`, `Thanks! ${formatMoney(a.amountCents)} for ${a.label} was paid by tap-to-pay and added to invoice #${invoice.number}.`, { label: 'See your payments', to: '/portal/payments' })
    return withToast(withLog(next, event.id, `On-site sale: ${a.label} (${formatMoney(a.amountCents)})`), `${formatMoney(a.amountCents)} paid · added to the invoice`)
  },

  // ---- Incidents (PL-7.4, ST-4.7): append-only, with photos ----
  'incident/log': (state, a) => {
    if (!a.text?.trim()) return state
    const by = state.team.find((m) => m.id === a.memberId) ?? owner(state)
    const event = eventOf(state, a.eventId)
    let next = { ...state, incidents: [...(state.incidents ?? []), { id: newId('inc'), eventId: a.eventId, at: nowStamp(), by: by.name, text: a.text.trim(), photos: a.photos ?? [] }] }
    if (by.role !== 'owner') next = pushToPlanner(next, `Incident logged by ${firstName(by.name)}`, `${event.name}: ${a.text.trim()}`, `/app/day-of/${event.id}`)
    return withToast(next, 'Incident logged')
  },

  // ---- Teardown (PL-7.5, ST-5.1): scan gear back in ----
  'pack/scanIn': (state, a) => {
    const code = a.code.trim().toUpperCase()
    const matches = (label) => label && (label.endsWith('##') ? code.startsWith(label.slice(0, -2)) : code === label)
    const row = packList(state, a.eventId).rows.find((r) => r.key === a.code || matches(r.label))
    if (!row) return withToast(state, `No item with label ${a.code} on this event`, 'danger')
    const next = { ...state, events: updateById(state.events, a.eventId, (e) => ({ packed: { ...(e.packed ?? {}), [row.key]: 'returned' } })) }
    return withToast(next, `Checked in: ${row.qty > 1 ? `${row.qty} × ` : ''}${row.name}`)
  },
  // Teardown is done only after the missing items are listed; they go to the planner
  'event/teardownDone': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event || event.teardownAt) return state
    const missing = packList(state, event.id).rows.filter((r) => r.status !== 'returned')
    let next = { ...state, events: updateById(state.events, event.id, (e) => ({
      teardownAt: nowStamp(), status: 'wrap_up',
      packed: { ...(e.packed ?? {}), ...Object.fromEntries(missing.map((r) => [r.key, 'missing'])) },
    })) }
    if (missing.length) next = pushToPlanner(next, `Missing after teardown: ${missing.length}`, `${event.name}: ${missing.map((r) => r.name).join(', ')}`, `/app/events/${event.id}/logistics/gear`)
    next = withLog(next, event.id, missing.length ? `Teardown done; missing: ${missing.map((r) => r.name).join(', ')}` : 'Teardown done; all gear checked in')
    return withToast(next, missing.length ? `Teardown done. ${missing.length} missing item${missing.length > 1 ? 's' : ''} reported.` : 'Teardown done. Everything is back.', missing.length ? 'warning' : 'success')
  },

  // ---- Final invoice and deposits (PL-8.2, CL-6.3) ----
  'invoice/addCharge': (state, a) => {
    const invoice = state.invoices.find((i) => i.id === a.invoiceId)
    if (!invoice || !a.label?.trim() || !a.amountCents) return state
    const next = addCharge(state, invoice, { label: `${a.kind === 'damage' ? 'Damage' : 'On site'}: ${a.label.trim()}`, amountCents: a.amountCents, extra: a.kind ?? 'damage' })
    return withToast(next, `Added ${formatMoney(a.amountCents)} to invoice #${invoice.number}`)
  },
  'invoice/sendFinal': (state, a) => {
    const invoice = state.invoices.find((i) => i.id === a.invoiceId)
    const event = eventOf(state, invoice.eventId)
    const open = invoice.installments.filter((p) => !p.paidAt && !p.voided)
    const due = open.reduce((t, p) => t + p.amountCents, 0)
    const lines = open.map((p) => `${p.label} ${formatMoney(p.amountCents)}`).join('; ')
    const next = emailClient(state, event, `Final invoice #${invoice.number}: ${formatMoney(due)}`, `Thank you for ${event.name}! Here's what's left: ${lines}.`, { label: 'Pay now', to: '/portal/payments' })
    return withToast({ ...next, invoices: updateById(next.invoices, invoice.id, { finalSentAt: nowStamp() }) }, 'Final invoice sent')
  },
  'deposit/release': (state, a) => {
    const invoice = state.invoices.find((i) => i.id === a.invoiceId)
    if (invoice?.securityDeposit?.status !== 'held') return state
    const event = eventOf(state, invoice.eventId)
    let next = { ...state, invoices: updateById(state.invoices, invoice.id, (i) => ({ securityDeposit: { ...i.securityDeposit, status: 'released', settledAt: nowStamp() } })) }
    next = emailClient(next, event, 'Security deposit released', `Good news: the ${formatMoney(invoice.securityDeposit.amountCents)} hold on your card is released. Everything came back in great shape.`)
    return withToast(next, 'Security deposit released')
  },
  // Damage is paid from the deposit first; anything left of the deposit is released
  'deposit/apply': (state, a) => {
    const invoice = state.invoices.find((i) => i.id === a.invoiceId)
    const dep = invoice?.securityDeposit
    if (dep?.status !== 'held') return state
    let left = dep.amountCents
    const installments = invoice.installments.map((p) => {
      if (p.extra !== 'damage' || p.paidAt || left < p.amountCents) return p
      left -= p.amountCents
      return { ...p, paidAt: nowStamp(), method: 'Security deposit' }
    })
    const used = dep.amountCents - left
    const event = eventOf(state, invoice.eventId)
    let next = { ...state, invoices: updateById(state.invoices, invoice.id, { installments, securityDeposit: { ...dep, status: 'applied', usedCents: used, settledAt: nowStamp() } }) }
    next = emailClient(next, event, 'Your security deposit', `${formatMoney(used)} of your ${formatMoney(dep.amountCents)} deposit covered damage (see your invoice).${left ? ` The other ${formatMoney(left)} is released.` : ''}`, { label: 'See your invoice', to: '/portal/payments' })
    return withToast(next, `${formatMoney(used)} applied from the deposit${left ? `, ${formatMoney(left)} released` : ''}`)
  },

  // ---- Close (PL-8.1, PL-8.5): only when the close-out checklist is done ----
  'event/close': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event || event.status === 'closed') return state
    const check = closeOut(state, event.id)
    if (!check.allDone) return withToast(state, `Finish the close-out first: ${check.items.filter((x) => !x.done).map((x) => x.label.toLowerCase()).join(', ')}.`, 'danger')
    const next = withLog({ ...state, events: updateById(state.events, event.id, { status: 'closed', closedAt: nowStamp() }) }, event.id, `Closed (${formatDay(nowStamp())})`)
    return withToast(next, `${event.name} is closed`)
  },
}
