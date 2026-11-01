// Phase 10: event day and wrap-up data rules.
import { reducer, initialState } from './reducer'
import { checkInCode, checkInCounts, closeOut, eventReport, findGuests, getEvent, getTimeline, invoiceTotals, livePanel, nowNext, packList } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)
const inv = (s, id) => s.invoices.find((i) => i.id === id)

describe('Day-of Mode (PL-7.1)', () => {
  it('starts the day and sends the client the morning-of message', () => {
    const s = run(initialState(), { type: 'event/startDay', eventId: 'thompson' })
    expect(getEvent(s, 'thompson').status).toBe('event_day')
    expect(s.outbox[0]).toMatchObject({ subject: 'Today\'s the day: Celebration of life for Harold Thompson', link: { to: '/portal/day-of', role: 'client' } })
    expect(s.outbox[0].body).toMatch(/Things start at 11:00 AM \(Service\)\. Your day-of contact is Devon Brooks/)
  })

  it('now = first item not done; marking it done moves to next', () => {
    let s = initialState()
    expect(nowNext(s, 'thompson').now.title).toBe('Set chairs and the memory table; test the slideshow')
    s = run(s, { type: 'timeline/toggleDone', id: 'ro20' })
    expect(nowNext(s, 'thompson')).toMatchObject({ now: { id: 'ro21' }, next: { id: 'ro22' }, doneCount: 1 })
  })

  it('running late shifts this and later items, tells affected vendors and alerts the crew', () => {
    const s = run(initialState(), { type: 'timeline/toggleDone', id: 'ro20' }, { type: 'timeline/delay', fromId: 'ro21', minutes: 15 })
    expect(getTimeline(s, 'thompson').map((t) => t.time)).toEqual(['09:30', '10:15', '11:15', '12:45', '14:15'])
    expect(s.eventVendors.find((x) => x.id === 'thompson-lavaca').changes.at(-1).text).toMatch(/^Running 15 minutes late/)
    expect(s.threads.find((t) => t.kind === 'team' && t.eventId === 'thompson').messages[0]).toMatchObject({ alert: true })
  })
})

describe('door check-in (ST-4.3, GU-5.1)', () => {
  it('finds by name or check-in code; checks a household in once', () => {
    let s = initialState()
    const dana = s.guests.find((g) => g.token === 'acme-g8-t')
    expect(checkInCode(dana)).toBe('ACME-G8')
    expect(findGuests(s, 'acme', 'acme-g8')[0].id).toBe(dana.id)
    const priya = findGuests(s, 'acme', 'priya')[0]
    s = run(s, { type: 'guest/checkIn', guestId: priya.id }, { type: 'guest/checkIn', guestId: priya.id })   // two phones, same household
    expect(checkInCounts(s, 'acme')).toMatchObject({ checkedIn: 2, households: 1 })
    expect(s.toasts.at(-1).tone).toBe('warning')
  })

  it('adds walk-ins, checked in', () => {
    const s = run(initialState(), { type: 'guest/walkIn', eventId: 'acme', name: 'Tom from Sales', people: 2 })
    expect(checkInCounts(s, 'acme')).toMatchObject({ checkedIn: 2, walkIns: 1, expected: 14 })
  })
})

describe('on-site sales (PL-7.3) and incidents (PL-7.4)', () => {
  it('a tap-to-pay add-on is paid and added to the invoice', () => {
    const before = invoiceTotals(inv(initialState(), 'acme'))
    const s = run(initialState(), { type: 'sale/onsite', eventId: 'acme', label: 'Extra karaoke hour', amountCents: 25000 })
    const after = invoiceTotals(inv(s, 'acme'))
    expect(after.totalCents - before.totalCents).toBe(25000)
    expect(after.paidCents - before.paidCents).toBe(25000)
    expect(livePanel(s, 'acme').onsiteCents).toBe(25000)
  })

  it('staff without "Take payments" cannot sell', () => {
    const s = run(initialState(), { type: 'sale/onsite', eventId: 'acme', label: 'Extra hour', amountCents: 25000, memberId: 'sam' })
    expect(inv(s, 'acme').installments).toHaveLength(3)
    expect(s.toasts.at(-1).tone).toBe('danger')
  })

  it('logs an incident with photos; staff incidents push the planner', () => {
    const s = run(initialState(), { type: 'incident/log', eventId: 'acme', text: 'Guest slipped near the bar; ice applied', photos: ['floor.jpg'], memberId: 'sam' })
    expect(s.incidents[0]).toMatchObject({ by: 'Sam Ortiz', photos: ['floor.jpg'] })
    expect(s.outbox[0].subject).toBe('Incident logged by Sam')
  })
})

describe('teardown (PL-7.5, ST-5.1)', () => {
  it('lists what did not come back before teardown is done; moves to Wrap-up', () => {
    let s = run(initialState(), { type: 'pack/scanIn', eventId: 'thompson', code: 'CR-CH-01' })
    s = run(s, { type: 'event/teardownDone', eventId: 'thompson' })
    const rows = packList(s, 'thompson').rows
    expect(rows.find((r) => r.key === 'r-th-ch').status).toBe('returned')
    expect(rows.filter((r) => r.status === 'missing')).toHaveLength(6)    // the always-bring items
    expect(getEvent(s, 'thompson').status).toBe('wrap_up')
    expect(s.outbox[0].subject).toBe('Missing after teardown: 6')
  })
})

describe('wrap-up (PL-8.1, PL-8.2, PL-8.5)', () => {
  it('damage comes out of the security deposit first; the rest is released', () => {
    let s = run(initialState(), { type: 'invoice/addCharge', invoiceId: 'thompson', label: 'Broken folding chair', amountCents: 4500, kind: 'damage' })
    s = run(s, { type: 'deposit/apply', invoiceId: 'thompson' })
    const i = inv(s, 'thompson')
    expect(i.installments.at(-1)).toMatchObject({ extra: 'damage', paidAt: '2026-11-05T18:00:00', method: 'Security deposit' })
    expect(i.securityDeposit).toMatchObject({ status: 'applied', usedCents: 4500 })
    expect(s.outbox[0].body).toMatch(/The other \$205\.00 is released/)
  })

  it('closing needs the whole checklist; then the status is Closed', () => {
    let s = initialState()
    expect(closeOut(s, 'thompson').items.filter((x) => !x.done).map((x) => x.id)).toEqual(['invoice', 'deposit', 'gear', 'hours', 'vendors'])
    s = run(s, { type: 'event/close', eventId: 'thompson' })
    expect(getEvent(s, 'thompson').status).toBe('final_week')
    const unpaid = inv(s, 'thompson').installments.filter((p) => !p.paidAt)
    s = run(s,
      ...unpaid.map((p) => ({ type: 'payment/recordManual', invoiceId: 'thompson', installmentId: p.id, method: 'Check' })),
      { type: 'deposit/release', invoiceId: 'thompson' },
      { type: 'event/teardownDone', eventId: 'thompson' },
      { type: 'shift/clockIn', id: 'sh10', atVenue: true }, { type: 'shift/clockOut', id: 'sh10' }, { type: 'timesheet/approve', id: 'sh10' },
      { type: 'eventVendor/recordPayment', id: 'thompson-lavaca', amountCents: 180000, method: 'Check' },
    )
    expect(closeOut(s, 'thompson').allDone).toBe(true)
    s = run(s, { type: 'event/close', eventId: 'thompson' })
    expect(getEvent(s, 'thompson').status).toBe('closed')
  })

  it('the report has revenue, costs, profit and attendance', () => {
    const s = run(initialState(), { type: 'guest/walkIn', eventId: 'acme', name: 'Walk In', people: 1 })
    const r = eventReport(s, 'acme')
    expect(r).toMatchObject({ checkedIn: 1, walkIns: 1, attendingPeople: 13 })
    expect(r.profitCents).toBe(r.priceCents - r.vendorCents - r.staffCents - r.gearCents)
  })
})
