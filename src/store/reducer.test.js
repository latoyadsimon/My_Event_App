import { reducer, initialState } from './reducer'

const start = () => initialState()

describe('store: app settings and the demo', () => {
  it('starts in Calm mode, viewing as the planner, with the seeded world', () => {
    const s = start()
    expect(s.ui.mode).toBe('calm')
    expect(s.ui.role).toBe('planner')
    expect(s.business.name).toBe('Bella Events')
    expect(s.leads.find((l) => l.id === 'rivera').stage).toBe('proposal_sent')
  })

  it('switches between Calm and Bold, and ignores anything else', () => {
    let s = reducer(start(), { type: 'ui/setMode', mode: 'bold' })
    expect(s.ui.mode).toBe('bold')
    s = reducer(s, { type: 'ui/setMode', mode: 'neon-everything' })
    expect(s.ui.mode).toBe('bold')
  })

  it('switches the demo role', () => {
    const s = reducer(start(), { type: 'ui/setRole', role: 'client' })
    expect(s.ui.role).toBe('client')
  })

  it('adds a message to the top of the Outbox with an id and a time', () => {
    const before = start()
    const s = reducer(before, { type: 'outbox/send', message: { type: 'sms', to: 'Ana', subject: 'Hi', body: 'Test' } })
    expect(s.outbox).toHaveLength(before.outbox.length + 1)
    expect(s.outbox[0]).toMatchObject({ type: 'sms', subject: 'Hi', unread: true })
    expect(s.outbox[0].id).toBeTruthy()
    expect(s.outbox[0].at).toBe('2026-11-05T18:00:00')
  })

  it('marks an Outbox message as read', () => {
    let s = reducer(start(), { type: 'outbox/send', message: { type: 'email', subject: 'x' } })
    const id = s.outbox[0].id
    s = reducer(s, { type: 'outbox/read', id })
    expect(s.outbox[0].unread).toBe(false)
  })

  it('shows and dismisses toasts', () => {
    let s = reducer(start(), { type: 'toast/show', text: 'Proposal sent to Ana' })
    expect(s.toasts).toHaveLength(1)
    s = reducer(s, { type: 'toast/dismiss', id: s.toasts[0].id })
    expect(s.toasts).toHaveLength(0)
  })

  it('never changes the previous state (pure updates)', () => {
    const before = start()
    reducer(before, { type: 'ui/setMode', mode: 'bold' })
    expect(before.ui.mode).toBe('calm')
  })

  it('throws on an unknown action so typos are caught in tests', () => {
    expect(() => reducer(start(), { type: 'nope' })).toThrow(/Unknown action/)
  })
})
