// Phase 11: potluck and volunteer sign-ups.
import { reducer, initialState } from './reducer'
import { potluckBoard, similarDish, volunteerBoard, getEvent } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)

describe('potluck (PL-5.6, GU-3.1)', () => {
  it('targets scale with the headcount (200 expected at Hope)', () => {
    const b = potluckBoard(initialState(), 'hope')
    expect(b.people).toBe(200)
    expect(b.categories.map((c) => [c.id, c.filled, c.target])).toEqual([['mains', 3, 20], ['sides', 3, 25], ['salads', 1, 17], ['desserts', 3, 20], ['drinks', 1, 10]])
  })

  it('a locked headcount rescales the targets', () => {
    const s = initialState()
    getEvent(s, 'hope').headcount = { count: 80, lockedAt: '2027-01-05T10:00:00' }
    expect(potluckBoard(s, 'hope').categories.find((c) => c.id === 'mains').target).toBe(8)
  })

  it('warns about a similar dish in the same category, but still lets you add it', () => {
    const s = initialState()
    expect(similarDish(s, 'hope', 'sides', 'Baked mac & cheese')?.name).toBe('Ruth Bell')
    expect(similarDish(s, 'hope', 'sides', 'Collard greens')).toBeNull()
    const next = run(s, { type: 'potluck/claim', eventId: 'hope', categoryId: 'sides', name: 'Joy Lee', contact: '(512) 555-0499', dish: 'Baked mac & cheese', servings: 12, diet: ['Vegetarian'], temp: 'hot', outlet: true })
    expect(potluckBoard(next, 'hope').categories.find((c) => c.id === 'sides').filled).toBe(4)
    expect(next.outbox[0]).toMatchObject({ type: 'sms', subject: "You're bringing Baked mac & cheese" })
    expect(next.outbox[0].body).toMatch(/Drop-off by 11:15 AM/)
  })

  it('reminds cooks with the drop-off time and a hot/cold note', () => {
    const before = initialState()
    const s = run(before, { type: 'potluck/remind', eventId: 'hope', kind: 'day' })
    const sent = s.outbox.slice(0, s.outbox.length - before.outbox.length)
    expect(sent).toHaveLength(4)
    expect(sent.find((m) => m.to === '(512) 555-0401').body).toMatch(/drop off by 11:15 AM\. Bring it hot/)
  })

  it('needs the module turned on', () => {
    const s = run(initialState(), { type: 'potluck/claim', eventId: 'acme', categoryId: 'mains', name: 'X', dish: 'Y' })
    expect(s.potluckSignups).toHaveLength(11)
  })
})

describe('volunteers (GU-3.2)', () => {
  it('counts group sign-ups and shows open spots', () => {
    const s = run(initialState(), { type: 'volunteer/signUp', eventId: 'hope', slotId: 'kids', name: 'Maya Brooks' })
    expect(volunteerBoard(s, 'hope').map((x) => [x.id, x.filled, x.open])).toEqual([['setup', 2, 4], ['greeting', 1, 1], ['serving', 4, 4], ['kids', 1, 2], ['cleanup', 3, 3]])
  })
})
