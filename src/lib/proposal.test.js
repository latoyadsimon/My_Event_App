import { priceVersion, gearWarnings, latestSent, draftOf } from './proposal'
import { initialState } from '../store/reducer'

const s = initialState()
const catalog = { packages: s.packages, addons: s.addons, taxRatePercent: 8, paymentSchedule: s.business.paymentSchedule }
const v2 = s.proposals[0].versions[1]

describe('pricing a proposal (PL-3.1)', () => {
  it('prices Rivera v2 at $14,850 with an 8% tax', () => {
    const p = priceVersion(v2, catalog)
    expect(p.packageCents).toBe(1100000)    // Gold
    expect(p.addonsCents).toBe(275000)      // booth 1,500 + karaoke 900 + 140 chairs 350
    expect(p.taxCents).toBe(110000)
    expect(p.totalCents).toBe(1485000)
  })

  it('splits it $4,455 / $5,940 / $4,455', () => {
    const p = priceVersion(v2, catalog)
    expect(p.schedule.map((x) => x.amountCents)).toEqual([445500, 594000, 445500])
    expect(p.depositCents).toBe(445500)
  })

  it('leaves optional upgrades out until the client ticks them', () => {
    const p = priceVersion(v2, catalog, ['photo-magnets'])
    expect(p.addonsCents).toBe(335000)
    expect(p.totalCents).toBe(Math.round(1435000 * 1.08))
  })

  it('takes a discount off before tax, and never below zero', () => {
    expect(priceVersion({ ...v2, discountCents: 50000 }, catalog).totalCents).toBe(Math.round(1325000 * 1.08))
    expect(priceVersion({ ...v2, discountCents: 99999999 }, catalog).totalCents).toBe(0)
  })
})

describe('gear check', () => {
  it('warns when a line quotes more than the business owns', () => {
    expect(gearWarnings(v2, s.addons)).toEqual([{ addonId: 'chairs', name: 'Chairs', qty: 140, owned: 120 }])
  })

  it('is satisfied by a partner rental or an override note', () => {
    const rented = { ...v2, lines: v2.lines.map((l) => (l.addonId === 'chairs' ? { ...l, partnerRental: true } : l)) }
    expect(gearWarnings(rented, s.addons)).toEqual([])
    const noted = { ...v2, lines: v2.lines.map((l) => (l.addonId === 'chairs' ? { ...l, overrideNote: 'Venue has 20' } : l)) }
    expect(gearWarnings(noted, s.addons)).toEqual([])
  })
})

describe('versions', () => {
  it('knows the latest sent version and the draft', () => {
    const p = s.proposals[0]
    expect(latestSent(p).n).toBe(2)
    expect(draftOf(p)).toBeNull()
    expect(draftOf({ versions: [...p.versions, { n: 3, sentAt: null }] }).n).toBe(3)
  })
})
