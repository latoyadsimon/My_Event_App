// Phase 4: Event Hub data rules.
import { reducer, initialState } from './reducer'
import {
  getEventGuests, guestCounts, nextDeadlines, cancellationQuote, rescheduleCheck, calendarItems, calendarWarnings, can, getEvent,
} from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)
const acme = (s) => getEvent(s, 'acme')

describe('guests (PL-5.1)', () => {
  it('counts Acme live: people attending, households declined / maybe / no reply, meals, allergies', () => {
    const c = guestCounts(getEventGuests(initialState(), 'acme'))
    expect(c).toMatchObject({ households: 16, attending: 12, declined: 1, maybe: 1, noReply: 7 })
    expect(c.meals).toEqual({ Chicken: 5, Vegetarian: 3, Fish: 4 })
    expect(c.allergies.map((g) => g.allergies)).toEqual(['Peanuts', 'Shellfish', 'Gluten-free'])
    expect(c.tracking.notDelivered.map((g) => g.invite)).toEqual(['bounced', 'stopped'])
  })

  it('imports a CSV without dropping allergies', () => {
    const s = run(initialState(), { type: 'guest/import', eventId: 'acme', rows: [{ name: 'New Person', email: 'n@p.com', allergies: 'Dairy', plusOnes: '1' }] })
    expect(getEventGuests(s, 'acme').at(-1)).toMatchObject({ name: 'New Person', allergies: 'Dairy', plusOnes: 1, invite: 'not_sent' })
  })

  it('reminds only invited households that have not replied (not bounced or STOP)', () => {
    const before = initialState()
    const s = run(before, { type: 'guests/remindNonResponders', eventId: 'acme' })
    expect(s.outbox.length - before.outbox.length).toBe(5)
  })

  it('removes a guest softly, so it can be undone', () => {
    let s = run(initialState(), { type: 'guest/remove', guestId: 'acme-g1' })
    expect(getEventGuests(s, 'acme')).toHaveLength(15)
    s = run(s, { type: 'guest/restore', guestId: 'acme-g1' })
    expect(getEventGuests(s, 'acme')).toHaveLength(16)
  })
})

describe('final headcount (PL-5.4)', () => {
  it('locks only after the client approves; closes RSVPs and tells vendors', () => {
    let s = run(initialState(), { type: 'headcount/lock', eventId: 'acme' })
    expect(acme(s).headcount).toBeNull()
    s = run(s, { type: 'headcount/requestApproval', eventId: 'acme' })
    const ap = s.approvals.at(-1)
    expect(ap).toMatchObject({ kind: 'headcount', status: 'pending', count: 12 })
    s = run(s, { type: 'approval/decide', approvalId: ap.id, decision: 'approved', by: 'Priya Shah' }, { type: 'headcount/lock', eventId: 'acme' })
    expect(acme(s).headcount).toMatchObject({ count: 12, approvedBy: 'Priya Shah', lockedBy: 'LaToya Simon' })
    expect(s.threads.find((t) => t.id === 'th-acme-catering').messages.at(-1).text).toMatch(/Final headcount for Acme holiday party: 12/)
  })
})

describe('invitations (PL-5.3)', () => {
  it('sends to everyone not yet invited, by text when there is a phone', () => {
    let s = run(initialState(), { type: 'guest/add', eventId: 'acme', name: 'Zoe Park', contact: '(512) 555-0999' })
    const before = s.outbox.length
    s = run(s, { type: 'invitation/send', eventId: 'acme', kind: 'invitation', channels: ['email', 'sms'], audience: 'not_invited' })
    expect(s.outbox.length - before).toBe(1)
    expect(s.outbox[0]).toMatchObject({ type: 'sms', to: 'Zoe Park · (512) 555-0999' })
    expect(s.outbox[0].link.to).toMatch(/^\/i\/guest-/)
    expect(getEventGuests(s, 'acme').at(-1).invite).toBe('delivered')
  })

  it('schedules instead of sending', () => {
    const before = initialState()
    const s = run(before, { type: 'invitation/send', eventId: 'acme', kind: 'reminder', channels: ['email'], audience: 'all', scheduleAt: '2026-12-05T09:00:00' })
    expect(s.outbox).toHaveLength(before.outbox.length)
    expect(acme(s).invitation.sends.at(-1)).toMatchObject({ kind: 'reminder', scheduled: true })
  })

  it('asks the client to approve the wording', () => {
    const s = run(initialState(), { type: 'invitation/requestApproval', eventId: 'thompson', kind: 'thank_you' })
    expect(getEvent(s, 'thompson').invitation.approval.status).toBe('requested')
    expect(s.outbox[0].link.to).toBe('/portal/approvals')
  })
})

describe('tasks and questionnaires (PL-4.3, PL-4.4)', () => {
  it('adds, completes, reorders and soft-deletes tasks', () => {
    let s = run(initialState(), { type: 'task/add', eventId: 'acme', title: 'Order linens', due: '2026-11-20', assignee: 'devon' })
    const t = s.tasks.at(-1)
    s = run(s, { type: 'task/toggle', taskId: t.id }, { type: 'task/move', taskId: 't2', dir: -1 })
    expect(s.tasks.find((x) => x.id === t.id).done).toBe(true)
    expect(s.tasks.filter((x) => x.eventId === 'acme').map((x) => x.id).slice(0, 2)).toEqual(['t2', 't1'])
  })

  it('sends the questionnaire; answers fill event fields and finish the task', () => {
    let s = run(initialState(), { type: 'questionnaire/send', eventId: 'garza', taskId: 't14' })
    expect(s.outbox[0]).toMatchObject({ type: 'email', to: 'elena.garza@gmail.com' })
    expect(s.outbox[0].link.to).toBe('/portal/questionnaire/q-garza')
    s = run(s, { type: 'questionnaire/answer', questionnaireId: 'q-garza', answers: { ceremony_time: '16:30', guest_estimate: '160' } })
    expect(getEvent(s, 'garza')).toMatchObject({ startTime: '16:30', guestCount: 160 })
    expect(s.tasks.find((t) => t.id === 't14').done).toBe(true)
    expect(s.questionnaires.find((q) => q.id === 'q-garza').answeredAt).toBeTruthy()
  })
})

describe('approvals and change orders', () => {
  it('an approved change order is added to the final payment', () => {
    let s = run(initialState(), { type: 'changeOrder/send', threadId: 'th-acme-client', title: 'Extra hour of karaoke', amountCents: 25000 })
    const ap = s.approvals.at(-1)
    s = run(s, { type: 'approval/decide', approvalId: ap.id, decision: 'approved', by: 'Priya Shah' })
    const inv = s.invoices.find((i) => i.id === 'acme')
    expect(inv.totalCents).toBe(1225000)
    expect(inv.installments[2].amountCents).toBe(360000 + 25000)
  })
})

describe('reschedule (PL-3.6)', () => {
  it('checks the new date first', () => {
    const check = rescheduleCheck(initialState(), 'patel', '2026-12-12')
    expect(check.calendar).toBe('Acme holiday party is already booked that day')
    expect(check).toMatchObject({ tasksShifting: 2, paymentsShifting: 2 })
  })

  it('shifts open tasks and unpaid payments by the same number of days, and tells everyone', () => {
    const s = run(initialState(), { type: 'event/reschedule', eventId: 'patel', date: '2027-03-10' })
    expect(getEvent(s, 'patel').date).toBe('2027-03-10')
    expect(s.tasks.find((t) => t.id === 't10').due).toBe('2026-12-08')
    expect(s.invoices.find((i) => i.id === 'patel').installments.map((p) => p.dueDate)).toEqual(['2026-09-01', '2027-01-22', '2027-02-24'])
    expect(s.outbox[0].subject).toBe('New date: Wed, Mar 10, 2027')
    expect(getEvent(s, 'patel').log.at(-1).text).toMatch(/Date changed from Wed, Mar 3, 2027 to Wed, Mar 10, 2027/)
  })
})

describe('cancel (PL-3.7)', () => {
  it('quotes the refund from the policy', () => {
    // Patel: 118 days out, paid only the deposit → nothing after the deposit to refund
    expect(cancellationQuote(initialState(), 'patel')).toMatchObject({ refundCents: 0, depositCents: 180000 })
    // Acme: 37 days out, paid deposit + payment 2 ($4,800) → 50% = $2,400
    expect(cancellationQuote(initialState(), 'acme')).toMatchObject({ refundCents: 240000, keptCents: 600000 })
  })

  it('cancels: refund recorded, unpaid payments voided, tasks released', () => {
    const s = run(initialState(), { type: 'event/cancel', eventId: 'acme', reason: 'Budget cut' })
    expect(acme(s).status).toBe('cancelled')
    const inv = s.invoices.find((i) => i.id === 'acme')
    expect(inv.refunds.at(-1).amountCents).toBe(240000)
    expect(inv.installments[2].voided).toBe(true)
    expect(s.tasks.filter((t) => t.eventId === 'acme' && !t.removed && !t.done)).toHaveLength(0)
  })
})

describe('calendar (PL-4.8)', () => {
  it('collects events, appointments and holds, and warns about tight travel', () => {
    const s = run(initialState(), { type: 'lead/holdDate', leadId: 'nguyen' })
    const items = calendarItems(s, '2026-11-01', '2027-01-31')
    expect(items.some((i) => i.kind === 'hold' && i.title === 'Hold · Nguyen baby shower')).toBe(true)
    const warnings = calendarWarnings(items)
    expect(warnings[0].text).toMatch(/Only 15 min between Celebration of life for Harold Thompson and Site visit · Garza wedding/)
  })
})

describe('permissions (PL-1.6, PL-4.7)', () => {
  it('only the owner sees profit; staff see budgets only if granted', () => {
    expect(can(initialState(), 'see_profit')).toBe(true)
    const devon = run(initialState(), { type: 'ui/setRole', role: 'planner', memberId: 'devon' })
    expect(can(devon, 'see_budgets')).toBe(true)
    expect(can(devon, 'see_profit')).toBe(false)
    const sam = run(initialState(), { type: 'ui/setRole', role: 'planner', memberId: 'sam' })
    expect(can(sam, 'see_budgets')).toBe(false)
  })
})

describe('next deadlines (PL-4.2)', () => {
  it('lists the next 3 for Acme, late ones first', () => {
    expect(nextDeadlines(initialState(), acme(initialState())).map((d) => d.text)).toEqual(['Confirm final headcount with Priya', 'Approve the dinner menu', 'Book the DJ'])
  })
})

describe('Phase 5: client-side actions', () => {
  it('CL-4.1 autopay clients get "we\'ll charge your card" instead of a pay link', () => {
    const s = run(initialState(), { type: 'invoice/sendReminder', invoiceId: 'acme' })
    expect(s.outbox[0].body).toMatch(/we'll charge your card on file \$3,600.00 for Acme holiday party on Sat, Nov 28/)
  })

  it('CL-4.4 a cancel/postpone request becomes a Dashboard alert; rescheduling closes it', async () => {
    const { getDashboard } = await import('./selectors')
    let s = run(initialState(), { type: 'request/submit', eventId: 'patel', kind: 'postpone', dates: ['2027-03-10'], by: 'Raj Patel' })
    expect(getDashboard(s).alerts[0]).toMatchObject({ text: 'Patel family reunion: client asked to postpone', to: '/app/events/patel/reschedule' })
    s = run(s, { type: 'event/reschedule', eventId: 'patel', date: '2027-03-10' })
    expect(getDashboard(s).alerts.some((a) => a.id.startsWith('req-'))).toBe(false)
  })

  it('CL-4.5 the client can message before booking (thread keyed by the lead)', () => {
    const s = run(initialState(), { type: 'thread/postClient', eventId: 'nguyen', author: 'Linh', authorFull: 'Linh Nguyen', text: 'Do you do balloon arches?' })
    expect(s.threads.at(-1)).toMatchObject({ eventId: 'nguyen', kind: 'client' })
    expect(s.outbox[0].link.to).toBe('/app/leads/nguyen')
  })
})
