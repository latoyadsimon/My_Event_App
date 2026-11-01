// Phase 16: tickets, the floor plan and seating.
import { reducer, initialState } from './reducer'
import { findSeat, getEvent, getTables, ticketByCode, ticketSales, unseated } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)
const buy = (extra = {}) => ({ type: 'ticket/buy', eventId: 'hope', key: 'o1', buyer: 'Joy Lee', email: 'joy@lee.com', lines: [{ tierId: 'dinner', qty: 2 }], ...extra })

describe('tickets (GU-3.4)', () => {
  it('sells by tier with a QR code each; a double tap buys once', () => {
    const s = run(initialState(), buy(), buy())
    const t = ticketSales(s, 'hope').tiers.find((x) => x.id === 'dinner')
    expect(t).toMatchObject({ sold: 4, left: 146 })
    expect(s.tickets.at(-1).code).toMatch(/^HOPE-/)
    expect(s.outbox[0]).toMatchObject({ subject: 'Your tickets: Hope Church potluck', link: { to: expect.stringMatching(/^\/e\/hope\/tickets\?o=/) } })
  })

  it('promo codes take a percent off; patron tickets show the deductible part', () => {
    const s = run(initialState(), buy({ promo: 'choir', lines: [{ tierId: 'patron', qty: 1 }] }))
    expect(s.tickets.at(-1)).toMatchObject({ paidCents: 8000, promo: 'CHOIR' })
    expect(s.outbox[0].body).toMatch(/\$65\.00 is tax-deductible \(Hope Community Church, tax ID 74-2918345\)/)
  })

  it('won’t sell past capacity; the waitlist takes names', () => {
    const s0 = initialState()
    getEvent(s0, 'hope').ticketing.tiers.find((t) => t.id === 'patron').capacity = 3
    let s = run(s0, buy({ lines: [{ tierId: 'patron', qty: 1 }] }))
    expect(s.tickets).toHaveLength(s0.tickets.length)
    expect(s.toasts.at(-1).text).toBe('Only 0 Patron tickets left.')
    s = run(s, { type: 'waitlist/join', eventId: 'hope', tierId: 'patron', name: 'Joy Lee', email: 'joy@lee.com' })
    expect(ticketSales(s, 'hope').waitlist).toBe(1)
  })

  it('checks a ticket in once at the door', () => {
    const t = ticketByCode(initialState(), 'hope-k4')
    const s = run(initialState(), { type: 'ticket/checkIn', id: t.id }, { type: 'ticket/checkIn', id: t.id })
    expect(ticketSales(s, 'hope').checkedIn).toBe(1)
    expect(s.toasts.at(-1).tone).toBe('warning')
  })
})

describe('floor plan and seating (PL-4.12)', () => {
  it('shows each table’s people, meals, allergies and "don’t seat near" conflicts', () => {
    const t3 = getTables(initialState(), 'acme').find((t) => t.id === 't3')
    expect(t3).toMatchObject({ filled: 5, left: 5 })
    expect(t3.conflicts.map((g) => g.name)).toEqual(['Marcus Webb', 'Alicia Brown'])
    expect(t3.allergies.map((g) => g.allergies)).toEqual(['Peanuts', 'Shellfish'])
  })

  it('moves objects inside the room on a half-foot grid', () => {
    const s = run(initialState(), { type: 'floor/move', eventId: 'acme', id: 't1', x: 200, y: 7.3 })
    expect(getEvent(s, 'acme').floorPlan.objects.find((o) => o.id === 't1')).toMatchObject({ x: 90, y: 7.5 })
  })

  it('adds a table with the next number; removing one unseats its guests', () => {
    let s = run(initialState(), { type: 'floor/add', eventId: 'acme', kind: 'table-round' })
    expect(getTables(s, 'acme').at(-1).label).toBe('16')
    s = run(s, { type: 'floor/remove', eventId: 'acme', id: 't3' })
    expect(unseated(s, 'acme').map((g) => g.name)).toEqual(expect.arrayContaining(['Marcus Webb', 'Jen Alvarez', 'Alicia Brown']))
  })

  it('won’t overfill a table', () => {
    const s0 = initialState()
    getEvent(s0, 'acme').floorPlan.objects.find((o) => o.id === 't3').seats = 6
    const s = run(s0, { type: 'seat/assign', guestId: 'acme-g14', tableId: 't3' })
    expect(s.guests.find((g) => g.id === 'acme-g14').tableId).toBe('t11')
    expect(s.toasts.at(-1).text).toBe('Table 3 has 1 seat left; Luis Romero\'s party is 2.')
  })

  it('locks while someone drags', () => {
    const s = run(initialState(), { type: 'floor/lock', eventId: 'acme', by: 'Devon' })
    expect(getEvent(s, 'acme').floorPlan.lockedBy).toBe('Devon')
  })

  it('GU-5.2 finds my seat by name', () => {
    expect(findSeat(initialState(), 'acme', 'priya')[0]).toMatchObject({ guest: { name: 'Priya Shah' }, table: { label: '9' } })
  })
})
