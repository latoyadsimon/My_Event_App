// =====================================================================
// Staff (product Phase 2): shifts the planner creates and assigns
// (PL-6.1), what staff do with them in their app (ST-2.1 to ST-5.2):
// availability, accept/decline, swaps, offline download, packing the
// van, clock in/out, manual time requests; timesheet approval and the
// payroll export (PL-8.3); the event's team chat with alerts (ST-4.6).
// =====================================================================
import { formatWeekdayDay, nowStamp } from '../../lib/clock'
import { formatClock, getShift, packList, suggestStaff } from '../selectors'
import { newId, updateById, withMessage, withToast, firstName } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const memberOf = (state, id) => state.team.find((m) => m.id === id)
const owner = (state) => state.team.find((m) => m.role === 'owner')
const when = (s) => `${formatWeekdayDay(s.date)}, ${formatClock(s.start)}–${formatClock(s.end)}`
const pushToPlanner = (state, subject, body, to) => withMessage(state, {
  type: 'push', to: `${firstName(owner(state)?.name)} (planner)`, from: `${state.business.name} · Crowned`,
  subject, body, link: { label: 'Open', to, role: 'planner' },
})
/** A push to one teammate; the link opens their staff app as them. */
const pushToStaff = (state, member, subject, body, to) => withMessage(state, {
  type: 'push', to: `${member.name} (staff)`, from: `${state.business.name} · Crowned`,
  subject, body, link: { label: 'Open', to, role: 'staff', staffId: member.id },
})
const staffPath = (eventId) => `/app/events/${eventId}/logistics/staff`
const setShift = (state, id, change) => ({ ...state, shifts: updateById(state.shifts, id, change) })

export const staffActions = {
  // ---- The planner (PL-6.1) ----
  'shift/add': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event || !a.role || !a.start || !a.end) return state
    const s = { id: newId('sh'), eventId: event.id, role: a.role, date: a.date ?? event.date, start: a.start, end: a.end, memberId: null, status: 'open', declinedBy: [], swap: null, clockIn: null, clockOut: null, timesheet: null }
    return withToast({ ...state, shifts: [...state.shifts, s] }, `${a.role} shift added`)
  },
  'shift/remove': (state, a) => setShift(state, a.id, { removed: true }),
  'shift/restore': (state, a) => setShift(state, a.id, { removed: false }),

  // Offer the shift; they accept or decline from the push (ST-2.2)
  'shift/assign': (state, a) => {
    const s = getShift(state, a.id)
    const member = memberOf(state, a.memberId)
    if (!s || !member) return state
    const event = eventOf(state, s.eventId)
    let next = setShift(state, s.id, { memberId: member.id, status: 'offered' })
    next = pushToStaff(next, member, `New shift: ${s.role}`, `${event.name} · ${when(s)} · ${event.venue}. Accept or decline in the app.`, `/app/staff/shifts/${s.id}`)
    return withToast(next, `Offered to ${firstName(member.name)}`)
  },

  // ST-2.2: declined shifts show as open again; the planner hears about it
  'shift/respond': (state, a) => {
    const s = getShift(state, a.id)
    if (!s || s.status !== 'offered') return state
    const member = memberOf(state, s.memberId)
    const event = eventOf(state, s.eventId)
    if (a.accept) return withToast(setShift(state, s.id, { status: 'accepted' }), 'Shift accepted. It\'s on your calendar.')
    let next = setShift(state, s.id, { status: 'open', memberId: null, declinedBy: [...s.declinedBy, member.id] })
    next = pushToPlanner(next, `${firstName(member.name)} declined a shift`, `${s.role} · ${event.name} · ${when(s)} is open again.`, staffPath(event.id))
    return withToast(next, 'Shift declined. The planner will find someone else.')
  },

  // ST-2.3: ask a qualified coworker to take it; the planner approves
  'shift/requestSwap': (state, a) => {
    const s = getShift(state, a.id)
    const to = memberOf(state, a.toId)
    if (!s || !to) return state
    const from = memberOf(state, s.memberId)
    const event = eventOf(state, s.eventId)
    let next = setShift(state, s.id, { swap: { toId: to.id, at: nowStamp(), reason: a.reason?.trim() ?? '' } })
    next = pushToPlanner(next, `Swap request: ${firstName(from.name)} → ${firstName(to.name)}`, `${s.role} · ${event.name} · ${when(s)}`, staffPath(event.id))
    return withToast(next, `Swap requested. ${firstName(owner(state).name)} will approve it.`)
  },
  'shift/decideSwap': (state, a) => {
    const s = getShift(state, a.id)
    if (!s?.swap) return state
    const from = memberOf(state, s.memberId)
    const to = memberOf(state, s.swap.toId)
    const event = eventOf(state, s.eventId)
    if (!a.approve) {
      const next = setShift(state, s.id, { swap: null })
      return withToast(pushToStaff(next, from, 'Swap not approved', `You're still on ${s.role} · ${event.name} · ${when(s)}.`, `/app/staff/shifts/${s.id}`), 'Swap declined')
    }
    let next = setShift(state, s.id, { memberId: to.id, status: 'accepted', swap: null })
    next = pushToStaff(next, from, 'Swap approved', `${firstName(to.name)} is taking ${s.role} · ${event.name}. You're off that shift.`, '/app/staff/shifts')
    next = pushToStaff(next, to, `New shift: ${s.role}`, `You're on ${event.name} · ${when(s)} (swapped from ${firstName(from.name)}).`, `/app/staff/shifts/${s.id}`)
    return withToast(next, `${firstName(to.name)} now has the shift`)
  },

  // PL-6.1 no-show: one tap texts everyone qualified and free
  'shift/noShowAlert': (state, a) => {
    const s = getShift(state, a.id)
    const event = eventOf(state, s.eventId)
    const ready = suggestStaff(state, s.id).filter((x) => x.suggested && x.member.id !== s.memberId)
    let next = state
    for (const { member } of ready) next = pushToStaff(next, member, `Can you cover? ${s.role}`, `${event.name} at ${event.venue} needs a ${s.role} now. Tap to take the shift.`, `/app/staff/shifts/${s.id}`)
    return withToast(next, `Asked ${ready.length} available ${s.role.toLowerCase()} staff`)
  },

  // ---- The staff member ----
  'staff/setAvailability': (state, a) => withToast({ ...state, team: updateById(state.team, a.memberId, { availability: { weekdays: a.weekdays, off: [...a.off].sort() } }) }, 'Availability saved'),

  // ST-3.3: the event on the phone for bad signal
  'staff/downloadOffline': (state, a) => withToast({
    ...state, team: updateById(state.team, a.memberId, (m) => ({ offline: { ...(m.offline ?? {}), [a.eventId]: nowStamp() } })),
  }, 'Downloaded. This event works without signal now.'),

  // ST-3.2: scan a label (or tap the item) into the van; unknown labels say so
  'pack/scan': (state, a) => {
    const code = a.code.trim().toUpperCase()
    // Unique labels match exactly; bulk labels like CR-CH-## match any number (CR-CH-07)
    const matches = (label) => label && (label.endsWith('##') ? code.startsWith(label.slice(0, -2)) : code === label)
    const row = packList(state, a.eventId).rows.find((r) => r.key === a.code || matches(r.label))
    if (!row) return withToast(state, `No item with label ${a.code} on this pack list`, 'danger')
    const next = { ...state, events: updateById(state.events, a.eventId, (e) => ({ packed: { ...(e.packed ?? {}), [row.key]: 'packed' } })) }
    return withToast(next, `Packed: ${row.qty > 1 ? `${row.qty} × ` : ''}${row.name}`)
  },
  // "Done packing": anything not scanned is marked missing and flagged to the planner
  'pack/flagMissing': (state, a) => {
    const event = eventOf(state, a.eventId)
    const missing = packList(state, a.eventId).rows.filter((r) => !r.status)
    if (!missing.length) return withToast(state, 'Everything is in the van')
    let next = { ...state, events: updateById(state.events, event.id, (e) => ({ packed: { ...(e.packed ?? {}), ...Object.fromEntries(missing.map((r) => [r.key, 'missing'])) } })) }
    next = pushToPlanner(next, `Missing from the van: ${missing.length} item${missing.length > 1 ? 's' : ''}`, `${event.name}: ${missing.map((r) => r.name).join(', ')}`, `/app/events/${event.id}/logistics/gear`)
    return withToast(next, `${missing.length} missing item${missing.length > 1 ? 's' : ''} flagged to the planner`, 'warning')
  },

  // ST-4.1: GPS says at the venue; otherwise clock in with a reason, flagged to the planner
  'shift/clockIn': (state, a) => {
    const s = getShift(state, a.id)
    if (!s || s.clockIn || s.status !== 'accepted') return state
    if (!a.atVenue && !a.reason?.trim()) return state
    const member = memberOf(state, s.memberId)
    const event = eventOf(state, s.eventId)
    let next = setShift(state, s.id, { clockIn: { at: a.at ?? nowStamp(), atVenue: Boolean(a.atVenue), reason: a.reason?.trim() ?? '' } })
    if (!a.atVenue) next = pushToPlanner(next, `${firstName(member.name)} clocked in away from the venue`, `${event.name}: “${a.reason.trim()}”`, staffPath(event.id))
    return withToast(next, 'Clocked in')
  },
  // ST-5.2: notes for breaks and mileage; the timesheet waits for approval
  'shift/clockOut': (state, a) => {
    const s = getShift(state, a.id)
    if (!s?.clockIn || s.clockOut) return state
    return withToast(setShift(state, s.id, {
      clockOut: { at: a.at ?? nowStamp(), notes: a.notes?.trim() ?? '', breakMinutes: Number(a.breakMinutes) || 0, miles: Number(a.miles) || 0 }, timesheet: 'pending',
    }), 'Clocked out. Your timesheet is waiting for approval.')
  },
  // Forgot to clock in or out: ask for the times; the planner approves
  'shift/requestTime': (state, a) => {
    const s = getShift(state, a.id)
    const member = memberOf(state, s.memberId)
    const event = eventOf(state, s.eventId)
    let next = setShift(state, s.id, {
      clockIn: { at: `${s.date}T${a.start}:00`, atVenue: true, reason: '' },
      clockOut: { at: `${s.date}T${a.end}:00`, notes: a.note?.trim() ?? '', breakMinutes: Number(a.breakMinutes) || 0, miles: Number(a.miles) || 0 },
      timesheet: 'pending', manual: true,
    })
    next = pushToPlanner(next, `Time request from ${firstName(member.name)}`, `${event.name}: ${formatClock(a.start)}–${formatClock(a.end)}${a.note ? ` (“${a.note.trim()}”)` : ''}`, staffPath(event.id))
    return withToast(next, 'Time request sent for approval')
  },

  // ---- Timesheets (PL-8.3): pending → approved → paid ----
  'timesheet/approve': (state, a) => {
    const s = getShift(state, a.id)
    if (s?.timesheet !== 'pending') return state
    return withToast(setShift(state, s.id, { timesheet: 'approved' }), `${firstName(memberOf(state, s.memberId).name)}'s hours approved`)
  },
  // Exporting payroll marks the approved timesheets as paid
  'timesheet/exportPayroll': (state, a) => {
    const ids = state.shifts.filter((s) => s.timesheet === 'approved' && (!a.eventId || s.eventId === a.eventId)).map((s) => s.id)
    return withToast({ ...state, shifts: state.shifts.map((s) => (ids.includes(s.id) ? { ...s, timesheet: 'paid', paidAt: nowStamp() } : s)) }, `${ids.length} timesheet${ids.length === 1 ? '' : 's'} exported to payroll`)
  },

  // ---- Team chat (ST-4.6): one thread per event; an alert also pushes to the whole crew ----
  'thread/postTeam': (state, a) => {
    if (!a.text?.trim()) return state
    const author = memberOf(state, a.memberId)
    let next = state
    let thread = state.threads.find((t) => t.eventId === a.eventId && t.kind === 'team')
    if (!thread) {
      thread = { id: newId('th'), eventId: a.eventId, kind: 'team', name: 'Team chat', shared: false, messages: [] }
      next = { ...next, threads: [...next.threads, thread] }
    }
    next = { ...next, threads: updateById(next.threads, thread.id, (t) => ({ messages: [...t.messages, { id: newId('msg'), from: a.memberId, author: firstName(author.name), at: nowStamp(), text: a.text.trim(), attachment: a.attachment ?? null, alert: Boolean(a.alert) }] })) }
    if (a.alert) {
      const event = eventOf(state, a.eventId)
      const crew = new Set(state.shifts.filter((s) => s.eventId === a.eventId && s.status === 'accepted').map((s) => s.memberId))
      for (const m of state.team.filter((x) => crew.has(x.id) && x.id !== a.memberId)) next = pushToStaff(next, m, `Alert · ${event.name}`, a.text.trim(), '/app/staff/chat')
    }
    return next
  },
}
