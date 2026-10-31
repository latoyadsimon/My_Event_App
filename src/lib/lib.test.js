import { TODAY, parseDay, daysUntil, formatDay, formatDayShort, formatDateTime } from './clock'
import { formatMoney, splitByPercent } from './money'

describe('clock: the demo always lives on Thu Nov 5, 2026, 6 PM', () => {
  it('fixes today', () => {
    expect(TODAY.getFullYear()).toBe(2026)
    expect(TODAY.getMonth()).toBe(10) // November (months count from 0)
    expect(TODAY.getDate()).toBe(5)
  })

  it('reads date-only strings as local days (no time-zone shift)', () => {
    const d = parseDay('2027-06-12')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2027, 5, 12])
  })

  it('counts whole days until a date', () => {
    expect(daysUntil('2026-11-05')).toBe(0)
    expect(daysUntil('2026-12-12')).toBe(37)
    expect(daysUntil('2027-06-12')).toBe(219)
  })

  it('formats days the way the wireframes write them', () => {
    expect(formatDay('2027-06-12')).toBe('Sat, Jun 12, 2027')
    expect(formatDayShort('2027-06-12')).toBe('Jun 12')
    expect(formatDateTime('2026-11-05T16:12:00')).toBe('Nov 5, 4:12 PM')
  })
})

describe('money: cents in, dollars out', () => {
  it('always shows two decimals and thousands separators', () => {
    expect(formatMoney(1485000)).toBe('$14,850.00')
    expect(formatMoney(0)).toBe('$0.00')
    expect(formatMoney(-25050)).toBe('-$250.50')
  })

  it('splits the Rivera total 30 / 40 / 30 exactly', () => {
    expect(splitByPercent(1485000, [30, 40, 30])).toEqual([445500, 594000, 445500])
  })

  it('puts any leftover cent on the last payment so the parts always add up', () => {
    const parts = splitByPercent(100001, [30, 40, 30])
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100001)
    expect(parts).toEqual([30000, 40000, 30001])
  })
})
