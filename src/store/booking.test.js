// Phase 3: accept → sign → pay deposit → countersign, the invoice and the Events list.
import { reducer, initialState } from './reducer'
import { getBookingStep, getDashboard, getEventRows, invoiceTotals, getPortal } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)
const accept = { type: 'proposal/accept', leadId: 'rivera', chosen: [] }
const sign = { type: 'contract/clientSign', contractId: 'rivera', signature: 'Ana Rivera', consent: true }
const payDeposit = { type: 'payment/succeeded', invoiceId: 'rivera', installmentId: 'rivera-1', method: 'Visa ·4242' }
const countersign = { type: 'contract/countersign', contractId: 'rivera', signature: 'LaToya Simon' }

describe('CL-2.2 review the proposal', () => {
  it('records the first time the client opens it', () => {
    const s = run(initialState(), { type: 'proposal/view', leadId: 'rivera' }, { type: 'proposal/view', leadId: 'rivera' })
    expect(s.proposals[0].viewedAt).toBe('2026-11-05T18:00:00')
    expect(s.leads.find((l) => l.id === 'rivera').activity.filter((x) => x.text === 'Client opened proposal v2')).toHaveLength(1)
  })

  it('sends a change request to the planner, on the latest version', () => {
    const s = run(initialState(), { type: 'proposal/requestChanges', leadId: 'rivera', text: 'Could we add uplighting?' })
    expect(s.proposals[0].versions[1].changeRequest).toMatchObject({ by: 'Ana', text: 'Could we add uplighting?' })
    expect(s.outbox[0]).toMatchObject({ type: 'push', subject: 'Ana Rivera requested changes' })
    expect(s.outbox[0].link.to).toBe('/app/proposals/rivera')
  })
})

describe('PL-3.3 accepting generates the contract', () => {
  it('fills the contract from the accepted version and the ticked upgrades', () => {
    const s = run(initialState(), { ...accept, chosen: ['photo-magnets', 'not-on-the-proposal'] })
    expect(s.contracts.at(-1)).toMatchObject({ id: 'rivera', versionN: 2, chosen: ['photo-magnets'], totalCents: Math.round(1435000 * 1.08) })
    expect(getBookingStep(s, 'ana').step).toBe('sign')
  })

  it('without upgrades the total is $14,850, deposit $4,455', () => {
    const s = run(initialState(), accept)
    expect(s.contracts.at(-1)).toMatchObject({ totalCents: 1485000, depositCents: 445500 })
  })
})

describe('CL-2.3 the client signs', () => {
  it('needs consent and a signature', () => {
    const s = run(initialState(), accept, { ...sign, consent: false })
    expect(s.contracts.at(-1).clientSignedAt).toBeNull()
  })

  it('creates the event (awaiting countersign), the invoice and the schedule; the lead is Won', () => {
    const s = run(initialState(), accept, sign)
    expect(s.events.find((e) => e.id === 'rivera')).toMatchObject({ status: 'awaiting_countersign', date: '2027-06-12', theme: 'elegant-wedding', portalUnlockedAt: null })
    const inv = s.invoices.find((i) => i.id === 'rivera')
    expect(inv.number).toBe(1042)
    expect(inv.installments.map((p) => [p.dueDate, p.amountCents])).toEqual([['2026-11-05', 445500], ['2027-04-13', 594000], ['2027-05-29', 445500]])
    expect(s.leads.find((l) => l.id === 'rivera').stage).toBe('won')
    expect(getBookingStep(s, 'ana').step).toBe('pay')
    expect(getPortal(s, 'ana').unlocked).toBe(false)
  })
})

describe('CL-2.4 the deposit', () => {
  it('unlocks the portal, emails a receipt and alerts the planner to countersign', () => {
    const s = run(initialState(), accept, sign, payDeposit)
    expect(getPortal(s, 'ana').unlocked).toBe(true)
    expect(s.outbox[1]).toMatchObject({ type: 'email', to: 'ana.rivera@gmail.com', subject: 'Your date is locked! 🎉' })
    expect(s.outbox[0]).toMatchObject({ type: 'push', subject: 'Ana Rivera signed and paid the deposit' })
    expect(getDashboard(s).alerts[0]).toMatchObject({ action: 'Countersign', to: '/app/contracts/rivera' })
  })

  it('never charges twice (NFR-6)', () => {
    const once = run(initialState(), accept, sign, payDeposit)
    const twice = run(once, payDeposit)
    expect(twice).toBe(once)
  })

  it('alerts the planner after 2 failed attempts; nothing is charged', () => {
    const fail = { type: 'payment/failed', invoiceId: 'rivera' }
    let s = run(initialState(), accept, sign, fail)
    const pushes = s.outbox.length
    s = run(s, fail)
    expect(s.outbox).toHaveLength(pushes + 1)
    expect(s.outbox[0].subject).toBe('Payment failed twice: Rivera wedding')
    expect(s.invoices.find((i) => i.id === 'rivera').installments[0].paidAt).toBeNull()
  })

  it('turns on autopay when asked', () => {
    const s = run(initialState(), accept, sign, { ...payDeposit, autopay: true })
    expect(s.invoices.find((i) => i.id === 'rivera').options.autopay).toBe(true)
  })
})

describe('PL-3.4 countersign', () => {
  it('is refused until the deposit is paid, with a plain message', () => {
    const s = run(initialState(), accept, sign, countersign)
    expect(s.contracts.find((c) => c.id === 'rivera').plannerSignedAt).toBeNull()
    expect(s.toasts.at(-1)).toMatchObject({ tone: 'danger', text: "The client hasn't paid the deposit yet. You can countersign once it's paid." })
  })

  it('books the event and applies the wedding checklist with due dates before Jun 12', () => {
    const before = run(initialState(), accept, sign, payDeposit)
    const s = run(before, countersign)
    expect(s.events.find((e) => e.id === 'rivera').status).toBe('booked')
    const tasks = s.tasks.filter((t) => t.eventId === 'rivera')
    expect(tasks).toHaveLength(8)
    expect(tasks.find((t) => t.title === 'Lock the final headcount').due).toBe('2027-06-05')
    expect(tasks.every((t) => t.due >= '2026-11-07')).toBe(true)
    expect(s.outbox[0].subject).toBe("You're officially booked: Rivera wedding")
    expect(getDashboard(s).alerts.some((a) => a.action === 'Countersign')).toBe(false)
  })

  it('a deposit recorded by hand (check) also allows countersigning', () => {
    const s = run(initialState(), accept, sign,
      { type: 'payment/recordManual', invoiceId: 'rivera', installmentId: 'rivera-1', method: 'Check' }, countersign)
    expect(s.events.find((e) => e.id === 'rivera').status).toBe('booked')
    expect(s.invoices.find((i) => i.id === 'rivera').installments[0].method).toBe('Check')
  })
})

describe('PL-3.5 invoice', () => {
  it('adds up paid and balance', () => {
    const s = run(initialState(), accept, sign, payDeposit)
    expect(invoiceTotals(s.invoices.find((i) => i.id === 'rivera'))).toMatchObject({ paidCents: 445500, balanceCents: 1039500, status: 'partially_paid' })
  })

  it('refunds no more than was paid', () => {
    let s = run(initialState(), { type: 'invoice/refund', invoiceId: 'acme', amountCents: 50000, reason: 'Fewer chairs' })
    expect(s.invoices.find((i) => i.id === 'acme').refunds).toHaveLength(1)
    s = run(s, { type: 'invoice/refund', invoiceId: 'acme', amountCents: 99999999 })
    expect(s.invoices.find((i) => i.id === 'acme').refunds).toHaveLength(1)
  })

  it('texts a payment reminder from the template', () => {
    const s = run(initialState(), { type: 'invoice/sendReminder', invoiceId: 'thompson' })
    expect(s.outbox[0]).toMatchObject({ type: 'sms', to: '(512) 555-0195' })
    expect(s.outbox[0].body).toMatch(/Hi Denise, a friendly reminder that \$1,600.00 for Celebration of life for Harold Thompson is due Fri, Nov 6/)
  })

  it('saves invoice options', () => {
    const s = run(initialState(), { type: 'invoice/setOption', invoiceId: 'acme', key: 'remindersPaused', value: true })
    expect(s.invoices.find((i) => i.id === 'acme').options.remindersPaused).toBe(true)
  })
})

describe('PL-4.1 events list', () => {
  it('lists upcoming events by date with balance and open tasks', () => {
    const rows = getEventRows(initialState())
    expect(rows.map((r) => r.event.id)).toEqual(['thompson', 'acme', 'hope', 'patel', 'garza'])
    expect(rows[1]).toMatchObject({ balanceCents: 360000, openTasks: 6 })
  })

  it('filters past events and by status', () => {
    expect(getEventRows(initialState(), { when: 'past' }).map((r) => r.event.id)).toEqual(['okafor', 'westlake', 'morales'])
    expect(getEventRows(initialState(), { when: 'all', status: 'booked' })).toHaveLength(3)
  })

  it('adds an event that did not come from a lead', () => {
    const s = run(initialState(), { type: 'event/create', name: 'Smith retirement party', eventType: 'other', date: '2027-02-20', clientName: 'Pat Smith', email: 'pat@smith.com' })
    expect(s.events.at(-1)).toMatchObject({ name: 'Smith retirement party', status: 'booked', leadId: null })
  })
})
