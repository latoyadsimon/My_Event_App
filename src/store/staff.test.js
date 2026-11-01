// Phase 9: staff shifts, the staff app's data rules, timesheets and team chat.
import { reducer, initialState } from './reducer'
import { budgetFor, getShift, isNoShow, myShifts, packList, suggestStaff, workedMinutes } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)

describe('shifts (PL-6.1)', () => {
  it('suggests only qualified, available, free staff (and not who declined)', () => {
    const s = initialState()
    const kj = suggestStaff(s, 'sh4').filter((x) => x.suggested).map((x) => x.member.id)
    expect(kj).toEqual(['keisha'])
    const teardown = suggestStaff(s, 'sh6')
    expect(teardown.map((x) => x.member.id)).not.toContain('marcus')               // declined it
    expect(teardown.find((x) => x.member.id === 'sam')).toMatchObject({ suggested: true })      // the booth ends 11:45, teardown starts then
    expect(teardown.find((x) => x.member.id === 'devon')).toMatchObject({ qualified: true, busy: true })   // coordinating till 12:30
    expect(suggestStaff(s, 'sh11').find((x) => x.member.id === 'marcus')).toMatchObject({ available: false })   // day off Nov 14
  })

  it('assigning offers the shift by push; declining reopens it and tells the planner', () => {
    let s = run(initialState(), { type: 'shift/assign', id: 'sh6', memberId: 'devon' })
    expect(getShift(s, 'sh6')).toMatchObject({ memberId: 'devon', status: 'offered' })
    expect(s.outbox[0]).toMatchObject({ subject: 'New shift: Teardown', link: { to: '/app/staff/shifts/sh6', role: 'staff', staffId: 'devon' } })
    s = run(s, { type: 'shift/respond', id: 'sh6', accept: false })
    expect(getShift(s, 'sh6')).toMatchObject({ memberId: null, status: 'open', declinedBy: ['marcus', 'devon'] })
    expect(s.outbox[0].subject).toBe('Devon declined a shift')
  })

  it('a swap waits for the planner, then moves the shift', () => {
    const s = run(initialState(), { type: 'shift/decideSwap', id: 'sh1', approve: true })
    expect(getShift(s, 'sh1')).toMatchObject({ memberId: 'marcus', status: 'accepted', swap: null })
    expect(s.outbox.slice(0, 2).map((m) => m.to)).toEqual(['Marcus Hill (staff)', 'Sam Ortiz (staff)'])
  })

  it('flags a no-show 15 minutes after the start and texts who can cover', () => {
    expect(isNoShow(getShift(initialState(), 'sh2'), '2026-12-12T17:10:00')).toBe(false)
    expect(isNoShow(getShift(initialState(), 'sh2'), '2026-12-12T17:15:00')).toBe(true)
    const s = run(initialState(), { type: 'shift/noShowAlert', id: 'sh11' })
    expect(s.outbox[0]).toMatchObject({ subject: 'Can you cover? Server', to: 'Keisha Grant (staff)' })
  })

  it('assigned staff hours count in the profit view', () => {
    expect(budgetFor(initialState(), 'acme').staffCents).toBe(Math.round(3.5 * 2200) + Math.round(7.5 * 3500) + Math.round(2.75 * 2200) + Math.round(2.75 * 2500) + 4 * 2000)
  })
})

describe('the staff app (ST-2 to ST-5)', () => {
  it('lists my shifts, soonest first', () => {
    expect(myShifts(initialState(), 'sam').map((s) => s.id)).toEqual(['sh21', 'sh11', 'sh1', 'sh3'])
  })

  it('saves availability (ST-2.1)', () => {
    const s = run(initialState(), { type: 'staff/setAvailability', memberId: 'sam', weekdays: [5, 6], off: ['2026-12-31'] })
    expect(s.team.find((m) => m.id === 'sam').availability).toEqual({ weekdays: [5, 6], off: ['2026-12-31'] })
  })

  it('scans labels into the van; bulk labels match any number; done flags the rest (ST-3.2)', () => {
    let s = run(initialState(), { type: 'pack/scan', eventId: 'acme', code: 'cr-bc-01' }, { type: 'pack/scan', eventId: 'acme', code: 'CR-CH-07' })
    expect(packList(s, 'acme').packedCount).toBe(2)
    s = run(s, { type: 'pack/scan', eventId: 'acme', code: 'XX-99' })
    expect(s.toasts.at(-1)).toMatchObject({ tone: 'danger' })
    s = run(s, { type: 'pack/flagMissing', eventId: 'acme' })
    expect(packList(s, 'acme').rows.filter((r) => r.status === 'missing')).toHaveLength(15)
    expect(s.outbox[0].subject).toBe('Missing from the van: 15 items')
  })

  it('clocks in at the venue, or away with a reason that is flagged (ST-4.1)', () => {
    let s = run(initialState(), { type: 'shift/clockIn', id: 'sh2', atVenue: false })
    expect(getShift(s, 'sh2').clockIn).toBeNull()            // a reason is required
    s = run(s, { type: 'shift/clockIn', id: 'sh2', atVenue: false, reason: 'Picking up ice first', at: '2026-12-12T16:55:00' })
    expect(s.outbox[0].subject).toBe('Devon clocked in away from the venue')
    s = run(s, { type: 'shift/clockOut', id: 'sh2', at: '2026-12-13T00:40:00', breakMinutes: 30, miles: 14 })
    expect(workedMinutes(getShift(s, 'sh2'))).toBe(465 - 30)
    expect(getShift(s, 'sh2').timesheet).toBe('pending')
  })

  it('forgot to clock in: a manual time request goes to the planner (ST-5.2)', () => {
    const s = run(initialState(), { type: 'shift/requestTime', id: 'sh3', start: '21:00', end: '23:50', note: 'Phone died' })
    expect(getShift(s, 'sh3')).toMatchObject({ manual: true, timesheet: 'pending' })
    expect(s.outbox[0].subject).toBe('Time request from Sam')
  })

  it('timesheets go pending → approved → paid (PL-8.3)', () => {
    const s = run(initialState(), { type: 'timesheet/approve', id: 'sh20' }, { type: 'timesheet/exportPayroll' })
    expect(getShift(s, 'sh20').timesheet).toBe('paid')
    expect(workedMinutes(getShift(s, 'sh20'))).toBe(315 - 30)
  })

  it('team chat: an alert pushes to the accepted crew (ST-4.6)', () => {
    const before = initialState()
    const s = run(before, { type: 'thread/postTeam', eventId: 'acme', memberId: 'devon', text: 'Load-in moved to the Brazos door', alert: true })
    expect(s.threads.find((t) => t.kind === 'team' && t.eventId === 'acme').messages).toHaveLength(1)
    expect(s.outbox.slice(0, s.outbox.length - before.outbox.length).map((m) => m.to)).toEqual(['Sam Ortiz (staff)'])
  })
})
