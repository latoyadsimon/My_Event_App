// Phase 8: logistics data rules (vendors, run-of-show, budget, gear, final week).
import { reducer, initialState } from './reducer'
import {
  getEventVendors, vendorAlternatives, getTimeline, gearAvailable, getReservations, packList, budgetFor, getDashboard, getEvent,
} from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)
const byId = (list, id) => list.find((x) => x.id === id)

describe('vendors on an event (PL-4.10)', () => {
  it('flags insurance that is missing or runs out before the event', () => {
    const rows = getEventVendors(initialState(), 'acme')
    expect(Object.fromEntries(rows.map((r) => [r.vendor.name, r.coi]))).toEqual({
      'Hill Country Catering': 'ok', 'DJ Rhythm': 'expires', 'Petal & Stem': 'missing',
    })
    expect(byId(rows, 'acme-hcc')).toMatchObject({ paidCents: 162000, balanceCents: 378000 })
  })

  it('adding a vendor sends a magic link, opens a private thread and a budget line', () => {
    const before = initialState()
    const s = run(before, { type: 'eventVendor/add', eventId: 'acme', vendorId: 'golden-hour', amountCents: 180000, arrival: '18:00' })
    const ev = s.eventVendors.at(-1)
    expect(ev).toMatchObject({ vendorId: 'golden-hour', status: 'invited' })
    expect(s.outbox[0]).toMatchObject({ subject: 'Bella Events booked you for Acme holiday party', link: { to: `/v/${ev.token}`, role: 'vendor' } })
    expect(s.threads.at(-1)).toMatchObject({ kind: 'vendor', eventVendorId: ev.id, shared: false })
    expect(s.budgetLines.at(-1)).toMatchObject({ category: 'Photographer', estimatedCents: 180000 })
  })

  it('a cancelled vendor raises an alert and shows who else in the category is free that day', () => {
    const s = run(initialState(), { type: 'eventVendor/cancel', id: 'acme-rhythm', by: 'vendor', reason: 'Double-booked' })
    expect(s.outbox[0].subject).toBe('DJ Rhythm cancelled')
    expect(getDashboard(s).alerts.map((a) => a.text)).toContain('Acme holiday party: DJ Rhythm cancelled')
    expect(vendorAlternatives(s, 'acme-rhythm').map((v) => v.name)).toEqual(['Austin Sound Co.'])
  })

  it('a replacement takes over the timeline items and budget line', () => {
    const s = run(initialState(), { type: 'eventVendor/cancel', id: 'acme-rhythm' }, { type: 'eventVendor/replace', id: 'acme-rhythm', vendorId: 'austin-sound' })
    const fresh = s.eventVendors.at(-1)
    expect(getTimeline(s, 'acme').filter((t) => t.owner === `v:${fresh.id}`).map((t) => t.title)).toEqual(['Sound check', 'Karaoke and photo booth open'])
    expect(byId(s.budgetLines, 'b2').eventVendorId).toBe(fresh.id)
  })
})

describe('the vendor portal (VN-1 to VN-7)', () => {
  it('first-time setup saves the profile for next time; confirming shows "Confirmed" to the planner', () => {
    let s = run(initialState(), { type: 'vendor/setupProfile', id: 'acme-petal', profile: { contact: 'June Park', email: 'hello@petalandstem.com', phone: '(512) 555-0251', coiExpiresOn: '2027-06-30', coiFile: 'coi.pdf', w9File: 'w9.pdf', payout: 'Zelle' } })
    expect(byId(s.vendors, 'petal')).toMatchObject({ profileComplete: true, coiExpiresOn: '2027-06-30', w9: true })
    s = run(s, { type: 'eventVendor/confirm', id: 'acme-petal' })
    expect(byId(getEventVendors(s, 'acme'), 'acme-petal')).toMatchObject({ status: 'confirmed', coi: 'ok' })
    expect(s.outbox[0].subject).toBe('Petal & Stem confirmed')
  })

  it('locking the headcount sends a "what changed" notice each vendor must acknowledge', () => {
    let s = initialState()
    s.approvals.push({ id: 'ap-hc', eventId: 'acme', kind: 'headcount', status: 'approved', requestedAt: '2026-11-05T10:00:00' })
    s = run(s, { type: 'headcount/lock', eventId: 'acme' })
    const hcc = byId(getEventVendors(s, 'acme'), 'acme-hcc')
    expect(hcc.unacked).toHaveLength(1)
    expect(hcc.unacked[0].text).toMatch(/^Final headcount for Acme holiday party/)
    s = run(s, { type: 'eventVendor/acknowledge', id: 'acme-hcc' })
    expect(byId(getEventVendors(s, 'acme'), 'acme-hcc').unacked).toHaveLength(0)
  })

  it('marks changes inside the vendor’s cutoff as "past your cutoff"', () => {
    const s = run(initialState(), { type: 'timeline/update', id: 'ro21', changes: { time: '09:45' } })
    const change = byId(s.eventVendors, 'thompson-lavaca').changes.at(-1)
    expect(change).toMatchObject({ pastCutoff: false, text: 'Timeline update: Lunch delivered and set is now at 9:45 AM (was 10:00 AM).' })
  })

  it('records a payment and sends the vendor a receipt', () => {
    const s = run(initialState(), { type: 'eventVendor/recordPayment', id: 'acme-rhythm', amountCents: 45000, method: 'Zelle' })
    expect(byId(getEventVendors(s, 'acme'), 'acme-rhythm').paidCents).toBe(45000)
    expect(s.outbox[0].subject).toBe('Payment sent: $450.00')
  })
})

describe('run-of-show (PL-4.11)', () => {
  it('vendors see only their own items; the client sees client-visible items', () => {
    const s = initialState()
    expect(getTimeline(s, 'acme', { vendor: 'acme-hcc' }).map((t) => t.title)).toEqual(['Catering sets the buffet', 'Dinner service'])
    expect(getTimeline(s, 'acme', 'client').map((t) => t.time)).toEqual(['19:00', '20:00', '20:30', '21:30', '23:30'])
  })

  it('builds from a template around the start time', () => {
    const s = run(initialState(), { type: 'timeline/applyTemplate', eventId: 'patel', template: 'default' })
    expect(getTimeline(s, 'patel').map((t) => `${t.time} ${t.title}`)).toEqual([
      '11:00 Load in and set up', '13:00 Guests arrive', '13:30 Food is served', '14:30 Main activity', '16:30 Wrap up',
    ])
  })
})

describe('gear (PL-6.2, PL-6.3)', () => {
  it('flags a shortage and clears it with a partner rental', () => {
    let s = initialState()
    expect(byId(getReservations(s, 'acme'), 'r-acme-ch').shortage).toBe(30)
    expect(getDashboard(s).alerts.map((a) => a.text)).toContain('Acme holiday party: short 30 white folding chairs')
    s = run(s, { type: 'gear/addPartner', id: 'r-acme-ch', name: 'Austin Party Rentals', qty: 30 })
    expect(byId(getReservations(s, 'acme'), 'r-acme-ch').shortage).toBe(0)
  })

  it('counts a turnaround day: gear used the day before is not free yet', () => {
    const s = initialState()
    s.events.push({ ...getEvent(s, 'patel'), id: 'eve', date: '2026-12-11', status: 'booked' })
    s.reservations.push({ id: 'r-eve', eventId: 'eve', itemId: 'lyrics-screen', qty: 1, kitId: null, partner: null })
    expect(gearAvailable(s, 'lyrics-screen', '2026-12-12', 'acme')).toBe(0)
    expect(gearAvailable(s, 'lyrics-screen', '2026-12-14', 'acme')).toBe(1)
  })

  it('reserving a kit reserves every piece; releasing one releases the kit', () => {
    let s = run(initialState(), { type: 'gear/reserveKit', eventId: 'thompson', kitId: 'kit-karaoke' })
    expect(getReservations(s, 'thompson').filter((r) => r.kitId === 'kit-karaoke')).toHaveLength(4)
    s = run(s, { type: 'gear/release', id: getReservations(s, 'thompson').find((r) => r.kitId).id })
    expect(getReservations(s, 'thompson')).toHaveLength(1)
  })

  it('countersigning reserves the gear from the accepted proposal', () => {
    const s = run(initialState(),
      { type: 'proposal/accept', leadId: 'rivera', chosen: [] },
      { type: 'contract/clientSign', contractId: 'rivera', signature: 'Ana Rivera', consent: true },
      { type: 'payment/succeeded', invoiceId: 'rivera', installmentId: 'rivera-1', method: 'Visa ·4242' },
      { type: 'contract/countersign', contractId: 'rivera', signature: 'LaToya Simon' })
    const reserved = getReservations(s, 'rivera')
    expect(reserved.filter((r) => r.kitId === 'kit-booth')).toHaveLength(5)
    expect(reserved.filter((r) => r.kitId === 'kit-karaoke')).toHaveLength(4)
    expect(reserved.find((r) => r.itemId === 'chairs').qty).toBe(140)
  })

  it('builds the pack list from reserved gear, always-bring items and extras', () => {
    let s = run(initialState(), { type: 'pack/addExtra', eventId: 'acme', name: 'Gold table runners', qty: 15 }, { type: 'pack/set', eventId: 'acme', key: 'r-acme-b0', status: 'packed' })
    const list = packList(s, 'acme')
    expect(list.rows.map((r) => r.group)).toEqual(expect.arrayContaining(['Photo booth kit', 'Karaoke kit', 'Always bring', 'Extras']))
    expect(list.rows.find((r) => r.key === 'r-acme-ch').qty).toBe(120)   // the 30 rented chairs come from the partner
    expect(list.packedCount).toBe(1)
  })
})

describe('budget and profit (PL-4.9)', () => {
  it('profit = client price − vendor costs − staff hours − gear wear', () => {
    const b = budgetFor(initialState(), 'acme')
    expect(b).toMatchObject({ priceCents: 1200000, vendorCents: 697500, estimatedCents: 682500, actualCents: 630000 })
    expect(b.profitCents).toBe(b.priceCents - b.vendorCents - b.staffCents - b.gearCents)
    expect(b.gearCents).toBe(1500 + 1000 + 500 + 300 + 800 + 1400 + 800 + 500 + 1000 + 1200 + 1200)
  })
})

describe('final week (PL-6.5)', () => {
  it('sends final details to the client, every vendor, the crew and attending guests', () => {
    const before = initialState()
    const s = run(before, { type: 'event/startFinalWeek', eventId: 'acme' })
    expect(getEvent(s, 'acme').status).toBe('final_week')
    const sent = s.outbox.slice(0, s.outbox.length - before.outbox.length)
    expect(sent.filter((m) => m.subject === 'Final details: Acme holiday party').length).toBe(4)   // client + 3 vendors
    expect(sent.filter((m) => m.subject === 'Final week').map((m) => m.to)).toEqual(expect.arrayContaining([expect.stringMatching(/^Sam Ortiz/), expect.stringMatching(/^Devon Brooks/)]))
    expect(sent.some((m) => m.subject === 'One week to go')).toBe(true)
  })
})
