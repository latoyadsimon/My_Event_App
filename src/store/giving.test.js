// Phase 15: fundraising — gifts, receipts, recurring, auction, paddle raise, sponsors.
import { reducer, initialState } from './reducer'
import { auctionBoard, fundTotals, getEvent, paddleBoard, receiptFor, recognition } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)
const give = (extra = {}) => ({ type: 'donation/give', eventId: 'hope', key: 'k1', amountCents: 10000, name: 'Joy Lee', email: 'joy@lee.com', ...extra })

describe('giving (DN-1, GU-3.3)', () => {
  it('a double tap charges once', () => {
    const before = initialState()
    const s = run(before, give(), give())
    expect(s.donations.length - before.donations.length).toBe(1)
    expect(fundTotals(s, 'hope').raisedCents - fundTotals(before, 'hope').raisedCents).toBe(10000)
  })

  it('covers the processing fee when asked; a message waits for approval', () => {
    const s = run(initialState(), give({ coverFees: true, message: 'For the roof!', recurring: true, dedication: 'In honor of Pastor Cole' }))
    expect(s.donations.at(-1)).toMatchObject({ feeCents: 300, recurring: 'monthly', messageStatus: 'pending' })
    expect(recognition(s, 'hope').messages.map((d) => d.message)).not.toContain('For the roof!')
  })

  it('needs a name and email for the receipt', () => {
    expect(run(initialState(), give({ email: '' })).donations).toHaveLength(initialState().donations.length)
  })
})

describe('receipts (DN-2)', () => {
  it('charity: org, tax ID, and only the amount above what the donor got back is deductible', () => {
    const s = initialState()
    const r = receiptFor(s, { ...s.donations[0], amountCents: 50000, fmvCents: 15000 })
    expect(r).toMatchObject({ charity: true, org: 'Hope Community Church', taxId: '74-2918345', deductibleCents: 35000 })
  })

  it('gift funds say "gift, not tax-deductible" and nothing about taxes otherwise', () => {
    const s = run(initialState(), { type: 'donation/give', eventId: 'garza', key: 'g1', amountCents: 20000, name: 'Uncle Leo', email: 'leo@x.com' })
    expect(receiptFor(s, s.donations.at(-1))).toMatchObject({ charity: false, deductibleCents: 0, taxId: null })
    expect(s.outbox[0].body).toMatch(/This is a gift, not a tax-deductible donation/)
    expect(s.outbox[0].body).not.toMatch(/tax ID|deductible amount/i)
  })

  it('a refund voids the receipt and reissues it', () => {
    const s = run(initialState(), { type: 'donation/refund', id: 'd-h2' })
    expect(s.donations.find((d) => d.id === 'd-h2').status).toBe('refunded')
    expect(s.outbox[0].subject).toBe('Refund: receipt D-H2 is void')
  })
})

describe('recurring (DN-5)', () => {
  it('expired cards get an update link; year-end summaries go to each donor', () => {
    let s = run(initialState(), { type: 'donation/cardUpdateLink', id: 'd-h5' })
    expect(s.outbox[0]).toMatchObject({ to: 'mtran@gmail.com', link: { to: '/e/hope/give' } })
    s = run(s, { type: 'donations/yearEnd', eventId: 'hope' })
    expect(s.outbox.filter((m) => /giving summary/.test(m.subject))).toHaveLength(5)
  })
})

describe('silent auction (DN-3)', () => {
  it('a bid must beat the high bid by the increment; the outbid bidder gets a text', () => {
    let s = run(initialState(), { type: 'bid/place', eventId: 'hope', itemId: 'ai1', bidderId: 'bd2', amountCents: 16500 })
    expect(auctionBoard(s, 'hope')[0].high.amountCents).toBe(16000)
    s = run(s, { type: 'bid/place', eventId: 'hope', itemId: 'ai1', bidderId: 'bd2', amountCents: 17000 })
    expect(auctionBoard(s, 'hope')[0].high.amountCents).toBe(17000)
    expect(s.outbox[0]).toMatchObject({ subject: 'You’ve been outbid', to: 'Deacon Ray Hill · (512) 555-0431' })
  })

  it('soft close: a late bid extends that item 2 minutes', () => {
    const s = run(initialState(), { type: 'bid/place', eventId: 'hope', itemId: 'ai3', bidderId: 'bd1', amountCents: 25000, at: '2027-01-09T13:29:00' })
    expect(auctionBoard(s, 'hope').find((i) => i.id === 'ai3').closesAt).toBe('13:31')
  })

  it('closing charges winners; a declined card gets a payment link; the planner can offer it to the next bidder', () => {
    let s = run(initialState(), { type: 'auction/close', eventId: 'hope' })
    const items = getEvent(s, 'hope').auction.items
    expect(items.find((i) => i.id === 'ai1').result).toMatchObject({ winnerId: 'bd1', status: 'paid' })
    expect(items.find((i) => i.id === 'ai2').result).toMatchObject({ winnerId: 'bd2', status: 'unpaid' })
    expect(fundTotals(s, 'hope').bySource.auction).toBe(16000)
    s = run(s, { type: 'bid/place', eventId: 'hope', itemId: 'ai1', bidderId: 'bd2', amountCents: 99000 })
    expect(s.toasts.at(-1).text).toBe('The auction has closed.')
  })

  it('an unpaid item can be offered to the next bidder', () => {
    let s = initialState()
    s.bidders.find((b) => b.id === 'bd1').declined = true                       // the quilt's winner can't pay
    s = run(s, { type: 'auction/close', eventId: 'hope' }, { type: 'auction/offerNext', eventId: 'hope', itemId: 'ai1' })
    expect(getEvent(s, 'hope').auction.items.find((i) => i.id === 'ai1').result).toMatchObject({ winnerId: 'bd2', amountCents: 15000, status: 'offered' })
    expect(s.outbox[0].to).toBe('Linda Park · (512) 555-0441')
  })

  it('auction proceeds are only deductible above the item’s value', () => {
    const s = run(initialState(), { type: 'auction/close', eventId: 'hope' })
    const won = s.donations.find((d) => d.source === 'auction')
    expect(receiptFor(s, won)).toMatchObject({ fmvCents: 40000, deductibleCents: 0 })
  })
})

describe('paddle raise (DN-4) and sponsors (DN-6)', () => {
  it('pledges at the called level show by name unless anonymous', () => {
    const s = run(initialState(), { type: 'paddle/setLevel', eventId: 'hope', index: 2 },
      { type: 'donation/give', eventId: 'hope', key: 'p1', amountCents: 25000, name: 'Deacon Ray Hill', source: 'paddle' },
      { type: 'donation/give', eventId: 'hope', key: 'p2', amountCents: 25000, name: 'Secret Santa', anonymous: true, source: 'paddle' })
    const board = paddleBoard(s, 'hope')
    expect(board.current).toBe(2)
    expect(board.levels[2].pledges).toHaveLength(2)
    expect(recognition(s, 'hope').names).not.toContain('Secret Santa')
  })

  it('checkout: pay now or invoice; a task per benefit; the logo shows after approval', () => {
    const before = initialState()
    let s = run(before, { type: 'sponsor/checkout', eventId: 'hope', tierId: 'gold', company: 'Capital Roofing', email: 'hi@caproof.com', pay: 'invoice' })
    expect(s.tasks.length - before.tasks.length).toBe(3)
    expect(s.outbox[0].subject).toBe('Invoice: Cornerstone sponsorship, $2,500.00')
    expect(recognition(s, 'hope').sponsors.map((x) => x.company)).not.toContain('Capital Roofing')
    s = run(s, { type: 'sponsor/approve', id: s.sponsors.at(-1).id })
    expect(recognition(s, 'hope').sponsors.map((x) => x.company)).toContain('Capital Roofing')
  })

  it('totals include paid sponsorships', () => {
    expect(fundTotals(initialState(), 'hope')).toMatchObject({ raisedCents: 92500 + 100000, sponsorCents: 100000, goalCents: 2500000 })
  })
})
