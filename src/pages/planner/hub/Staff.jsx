// =====================================================================
// Event Hub › Logistics › Staff (PL-6.1, PL-8.3): shifts per event with
// roles. Assigning suggests only staff with the right skill who are
// available and not on another shift; staff accept or decline in their
// app (declined = open again). Approve swap requests. A no-show 15
// minutes after the start gets one tap to ask everyone who could cover.
// Timesheets: approve hours, then export payroll (approved → paid).
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { can, formatClock, formatHours, getShifts, isNoShow, shiftMinutes, suggestStaff, workedMinutes } from '../../../store/selectors'
import { SHIFT_ROLES } from '../../../data/seedLogistics'
import { formatDayShort, formatTime, nowStamp } from '../../../lib/clock'
import { formatMoney } from '../../../lib/money'
import { Button, Card, EmptyState, Field, Icon, Notice, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

const STATUS = { open: ['danger', 'Open'], offered: ['warning', 'Waiting for a reply'], accepted: ['success', 'Accepted'] }
const TIMESHEET = { pending: ['warning', 'Needs approval'], approved: ['info', 'Approved'], paid: ['success', 'Paid'] }
const first = (name) => name.split(' ')[0]

function Assign({ shift }) {
  const { state, dispatch } = useStore()
  const options = suggestStaff(state, shift.id)
  const [memberId, setMemberId] = useState(options.find((o) => o.suggested)?.member.id ?? '')
  if (!options.length) return <p className="muted">No one else to ask. Invite more staff in Settings › Team.</p>
  const why = (o) => (o.suggested ? 'suggested' : !o.qualified ? 'no skill' : !o.available ? 'not available' : 'on another shift')
  return (
    <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); if (memberId) dispatch({ type: 'shift/assign', id: shift.id, memberId }) }}>
      <Field label={`Offer ${shift.role} to`} as="select" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
        <option value="">Choose someone</option>
        {options.map((o) => <option key={o.member.id} value={o.member.id}>{o.member.name} ({why(o)})</option>)}
      </Field>
      <Button type="submit" disabled={!memberId}>Offer shift</Button>
    </form>
  )
}

function ShiftRow({ shift, now }) {
  const { state, dispatch } = useStore()
  const member = state.team.find((m) => m.id === shift.memberId)
  const swapTo = shift.swap && state.team.find((m) => m.id === shift.swap.toId)
  const noShow = isNoShow(shift, now)
  return (
    <li className={styles.task}>
      <div className={styles.taskMain}>
        <span className={styles.taskTitle}>{shift.role} · {formatClock(shift.start)}–{formatClock(shift.end)}</span>
        <span className={styles.taskMeta}>
          {member ? member.name : 'Nobody yet'}
          <StatusChip tone={STATUS[shift.status][0]} label={STATUS[shift.status][1]} />
          {shift.declinedBy.length > 0 && <span>Declined by {shift.declinedBy.map((id) => first(state.team.find((m) => m.id === id)?.name ?? id)).join(', ')}</span>}
          {shift.clockIn && <StatusChip tone={shift.clockIn.atVenue ? 'success' : 'warning'} label={`In ${formatTime(shift.clockIn.at)}${shift.clockIn.atVenue ? '' : ' (away from venue)'}`} />}
          {noShow && <StatusChip tone="danger" label="Not clocked in" />}
        </span>
      </div>
      <div className={styles.taskTools}>
        {shift.status === 'open' && <Assign shift={shift} />}
        {noShow && <Button size="small" variant="primary" onClick={() => dispatch({ type: 'shift/noShowAlert', id: shift.id })}>Ask who can cover</Button>}
        <Button size="small" variant="danger" aria-label={`Remove ${shift.role} shift`}
          onClick={() => { dispatch({ type: 'shift/remove', id: shift.id }); dispatch({ type: 'toast/show', text: `Removed the ${shift.role} shift`, undo: { type: 'shift/restore', id: shift.id } }) }}>
          <Icon name="close" size={14} />
        </Button>
      </div>
      {swapTo && (
        <div className={styles.subtasks}>
          <Notice tone="warning" action={
            <span className="cluster">
              <Button size="small" variant="primary" onClick={() => dispatch({ type: 'shift/decideSwap', id: shift.id, approve: true })}>Approve swap</Button>
              <Button size="small" onClick={() => dispatch({ type: 'shift/decideSwap', id: shift.id, approve: false })}>Decline</Button>
            </span>
          }>
            {first(member.name)} asked to swap with {swapTo.name}{shift.swap.reason && `: “${shift.swap.reason}”`}.
          </Notice>
        </div>
      )}
    </li>
  )
}

function AddShift({ event }) {
  const { dispatch } = useStore()
  const [role, setRole] = useState(SHIFT_ROLES[0][0])
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  return (
    <form className={styles.addTask} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'shift/add', eventId: event.id, role, start, end }); setStart(''); setEnd('') }}>
      <Field label="Role" as="select" value={role} onChange={(e) => setRole(e.target.value)}>
        {SHIFT_ROLES.map(([r, skill]) => <option key={r} value={r}>{r}{skill ? ` (needs ${skill})` : ''}</option>)}
      </Field>
      <Field label="Starts" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
      <Field label="Ends" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
      <Button type="submit" variant="primary" disabled={!start || !end}>Add shift</Button>
    </form>
  )
}

/** CSV of approved hours for payroll (PL-8.3). */
function payrollCsv(state, rows) {
  const lines = [['Name', 'Event', 'Date', 'Role', 'Hours', 'Rate', 'Pay', 'Miles', 'Notes']]
  for (const s of rows) {
    const m = state.team.find((x) => x.id === s.memberId)
    const mins = workedMinutes(s)
    lines.push([m.name, state.events.find((e) => e.id === s.eventId).name, s.date, s.role, (mins / 60).toFixed(2), ((m.hourlyCents ?? 0) / 100).toFixed(2), (Math.round(mins / 60 * (m.hourlyCents ?? 0)) / 100).toFixed(2), s.clockOut.miles, s.clockOut.notes])
  }
  return lines.map((l) => l.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
}

export default function Staff() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const shifts = getShifts(state, event.id)
  const now = nowStamp()
  const open = shifts.filter((s) => s.status === 'open').length
  const sheets = shifts.filter((s) => s.timesheet)
  const approved = sheets.filter((s) => s.timesheet === 'approved')
  const closed = ['closed', 'cancelled'].includes(event.status)
  const money = can(state, 'see_budgets')

  const exportPayroll = () => {
    const url = URL.createObjectURL(new Blob([payrollCsv(state, approved)], { type: 'text/csv' }))
    const link = Object.assign(document.createElement('a'), { href: url, download: `payroll-${event.id}.csv` })
    link.click()
    URL.revokeObjectURL(url)
    dispatch({ type: 'timesheet/exportPayroll', eventId: event.id })
  }

  return (
    <div className="stack">
      <Card title={`Shifts · ${formatDayShort(event.date)}${open ? ` · ${open} open` : ''}`}>
        {shifts.length === 0
          ? <EmptyState title="No shifts yet">Add setup, service and teardown shifts. Only staff with the right skill who are free that day are suggested.</EmptyState>
          : <ul role="list" className={styles.tasks}>{shifts.map((s) => <ShiftRow key={s.id} shift={s} now={now} />)}</ul>}
        <p className="muted">Staff accept or decline from a push in their app. If someone hasn&apos;t clocked in 15 minutes after their start, you&apos;ll see “Not clocked in” here.</p>
      </Card>

      {!closed && <Card title="Add a shift"><AddShift event={event} /></Card>}

      {sheets.length > 0 && (
        <Card title="Timesheets" action={money && approved.length > 0 && <Button size="small" variant="primary" onClick={exportPayroll}>Export payroll ({approved.length})</Button>}>
          <ul role="list" className={styles.rows}>
            {sheets.map((s) => {
              const m = state.team.find((x) => x.id === s.memberId)
              const mins = workedMinutes(s)
              return (
                <li key={s.id}>
                  <span><strong>{m.name}</strong> · {s.role}
                    <span className={styles.subline}>
                      {formatTime(s.clockIn.at)}–{formatTime(s.clockOut.at)} · {formatHours(mins)} worked (scheduled {formatHours(shiftMinutes(s))})
                      {s.clockOut.miles ? ` · ${s.clockOut.miles} mi` : ''}{s.clockOut.notes ? ` · “${s.clockOut.notes}”` : ''}{s.manual ? ' · entered by hand' : ''}
                    </span>
                  </span>
                  {money && <span>{formatMoney(Math.round(mins / 60 * (m.hourlyCents ?? 0)))}</span>}
                  <StatusChip tone={TIMESHEET[s.timesheet][0]} label={TIMESHEET[s.timesheet][1]} />
                  {s.timesheet === 'pending' && <Button size="small" onClick={() => dispatch({ type: 'timesheet/approve', id: s.id })}>Approve hours</Button>}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
