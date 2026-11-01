// Phase 17: business reports, marketing reminders, duplicate/templates, reviews and surveys.
import { reducer, initialState } from './reducer'
import { businessReport, feedbackFor, getEvent, getEventTasks, getTimeline, isDue, marketingList, nextOccurrence } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)

describe('business reports (PL-9.1)', () => {
  it('booked vs collected by month, lead sources, add-ons, gear use, sales tax', () => {
    const r = businessReport(initialState())
    expect(r.months).toHaveLength(12)
    expect(r.months.at(-1)).toMatchObject({ month: '2026-11', bookedCents: 965000 })            // Garza countersigned Nov 2
    expect(r.months.find((m) => m.month === '2026-09').bookedCents).toBe(1200000 + 600000 + 400000)   // Acme, Patel, Okafor
    expect(r.sources[0]).toMatchObject({ source: 'Referral', leads: 5, won: 4 })   // Kim's 40th is still open
    expect(r.addons.map((a) => a.addon.id)).toEqual(expect.arrayContaining(['photo-booth', 'karaoke', 'chairs']))
    expect(r.gear.find((g) => g.item.id === 'chairs').events).toBe(3)
    expect(r.tax.find((t) => t.place === 'Austin, TX').taxCents).toBeGreaterThan(0)
    expect(r.rating).toBe(4.7)
  })

  it('connects QuickBooks and syncs', () => {
    const s = run(initialState(), { type: 'quickbooks/connect' }, { type: 'quickbooks/sync' })
    expect(s.business.quickbooks).toMatchObject({ invoices: 8, lastSyncAt: '2026-11-05T18:00:00' })
  })
})

describe('marketing reminders (PL-9.2)', () => {
  it('only opted-in clients, never memorial families; about two months ahead', () => {
    const list = marketingList(initialState())
    expect(list.filter((x) => isDue(x)).map((x) => x.date.label)).toEqual(['Baby Luis’s first birthday'])
    expect(list.find((x) => x.client.id === 'acme').client.marketing.optIn).toBe(false)
    expect(list.some((x) => x.client.id === 'thompson')).toBe(false)
  })

  it('yearly dates roll forward', () => {
    expect(nextOccurrence('2024-03-01', true)).toBe('2027-03-01')
    expect(nextOccurrence('2024-12-01', true)).toBe('2026-12-01')
  })

  it('sends once per occurrence', () => {
    const item = marketingList(initialState()).find((x) => isDue(x))
    const s = run(initialState(), { type: 'marketing/send', clientId: item.client.id, dateId: item.date.id, next: item.next, daysAway: item.daysAway })
    expect(s.outbox[0]).toMatchObject({ to: 'rosa.morales@gmail.com', subject: 'Baby Luis’s first birthday is coming up!' })
    expect(s.outbox[0].body).toMatch(/is in 6 weeks \(Sun, Dec 20, 2026\)/)
    expect(marketingList(s).filter((x) => isDue(x))).toHaveLength(0)
  })
})

describe('duplicate an event / templates (PL-9.3)', () => {
  it('duplicates Acme with tasks (same days before), the run of show and the gear kits', () => {
    const s = run(initialState(), { type: 'event/duplicate', eventId: 'acme', name: 'Acme holiday party', date: '2027-12-11', clientId: 'acme' })
    const copy = getEvent(s, 'acme-holiday-party-2027')
    expect(copy).toMatchObject({ status: 'booked', venue: 'The Driskill Ballroom', karaoke: { enabled: true }, booth: { enabled: true } })
    expect(getEventTasks(s, copy.id).find((t) => t.title === 'Book the DJ').due).toBe('2027-11-09')
    expect(getTimeline(s, copy.id).map((t) => t.title)).toContain('Team briefing')
    expect(getTimeline(s, copy.id).some((t) => t.owner?.startsWith('v:'))).toBe(false)      // vendors aren't copied
    expect(s.reservations.filter((r) => r.eventId === copy.id && r.kitId)).toHaveLength(9)
  })

  it('saves a template and creates a new event from it', () => {
    let s = run(initialState(), { type: 'template/save', eventId: 'thompson', name: 'Celebration of life' })
    const tpl = s.business.eventTemplates[0]
    expect(tpl).toMatchObject({ type: 'memorial', tasks: expect.any(Array) })
    s = run(s, { type: 'template/createEvent', templateId: tpl.id, name: 'Memorial for Ada Price', date: '2027-02-06', clientId: 'patel', venue: 'St. Mark’s' })
    expect(getEvent(s, 'memorial-for-ada-price-2027')).toMatchObject({ type: 'memorial', minutes: 180 })
    expect(getTimeline(s, 'memorial-for-ada-price-2027')[0].time).toBe('09:30')
  })
})

describe('reviews and surveys (PL-8.4, CL-6.4, GU-6.2)', () => {
  it('asks the client for a review and guests for one score; one answer each', () => {
    let s = run(initialState(), { type: 'review/request', eventId: 'okafor' }, { type: 'survey/send', eventId: 'acme' })
    expect(s.outbox.find((m) => /How did we do/.test(m.subject)).link).toMatchObject({ to: '/portal/review', clientId: 'okafor' })
    expect(s.outbox[0].link.to).toMatch(/^\/e\/acme\/feedback\?t=/)
    s = run(s, { type: 'feedback/submit', eventId: 'acme', from: 'guest', key: 'g1', score: 5 }, { type: 'feedback/submit', eventId: 'acme', from: 'guest', key: 'g1', score: 1 })
    expect(feedbackFor(s, 'acme')).toMatchObject({ guestAverage: 5 })
  })
})
