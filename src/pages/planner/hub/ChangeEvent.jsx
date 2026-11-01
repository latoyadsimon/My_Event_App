// =====================================================================
// Change the date (PL-3.6) and Cancel the event (PL-3.7).
// Nothing changes until you confirm. Rescheduling checks your calendar,
// staff and gear first, and shows what will shift. Cancelling shows the
// refund from the contract's policy and asks you to type CANCEL (NFR-13).
// =====================================================================
import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { cancellationQuote, rescheduleCheck } from '../../../store/selectors'
import { formatDay } from '../../../lib/clock'
import { formatMoney } from '../../../lib/money'
import { Button, Card, Field, Icon, Notice } from '../../../components/ui'
import styles from './hub.module.css'

function Check({ ok, children }) {
  return <li className={ok ? styles.checkOk : styles.checkWarn}><Icon name={ok ? 'check' : 'close'} size={16} /> {children}</li>
}

export function Reschedule() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const check = date && date !== event.date ? rescheduleCheck(state, event.id, date) : null
  const blocked = !check || check.inPast || Boolean(check.calendar)

  const confirm = () => {
    dispatch({ type: 'event/reschedule', eventId: event.id, date, reason: reason.trim() })
    navigate(`/app/events/${event.id}`)
  }

  return (
    <Card title="Change the date">
      <p className="muted">Now {formatDay(event.date)}. Nothing changes until you confirm.</p>
      <div className={styles.grid2}>
        <Field label="New date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Field label="Reason (optional, shown in the event history)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      {check && (
        <>
          <ul role="list" className={styles.checks} aria-label="Checks for the new date">
            {check.inPast && <Check ok={false}>That date has already passed.</Check>}
            <Check ok={!check.calendar}>{check.calendar ?? 'Your calendar is free'}</Check>
            <Check ok={!check.staff.length}>{check.staff.length ? `Busy at another event: ${check.staff.join(', ')}` : 'Your team is free'}</Check>
            <Check ok={!check.gear.length}>{check.gear.length ? `Gear may be short: ${check.gear.join(', ')}` : 'Gear is available'}</Check>
          </ul>
          <Notice tone="info">
            {check.delta > 0 ? `${check.delta} days later` : `${-check.delta} days earlier`}: {check.tasksShifting} open task{check.tasksShifting === 1 ? '' : 's'} and {check.paymentsShifting} payment date{check.paymentsShifting === 1 ? '' : 's'} move with it. The client{check.staff.length ? ', your team' : ''} and anyone assigned are told.
          </Notice>
        </>
      )}
      <div className="cluster">
        <Button to={`/app/events/${event.id}`}>Keep {formatDay(event.date)}</Button>
        <Button variant="primary" onClick={confirm} disabled={blocked}>Confirm new date</Button>
      </div>
    </Card>
  )
}

export function CancelEvent() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [typed, setTyped] = useState('')
  const [reason, setReason] = useState('')
  const q = cancellationQuote(state, event.id)

  const confirm = () => {
    dispatch({ type: 'event/cancel', eventId: event.id, reason: reason.trim() })
    navigate(`/app/events/${event.id}`)
  }

  return (
    <Card title="Cancel the event">
      <Notice tone="danger">This can&apos;t be undone. The event is archived, and its reminders, gear and staff are released.</Notice>
      <dl className={styles.facts}>
        <div><dt>Event date</dt><dd>{formatDay(event.date)} ({q.daysOut} days away)</dd></div>
        <div><dt>Paid so far</dt><dd>{formatMoney(q.paidCents)} (deposit {formatMoney(q.depositCents)}, non-refundable)</dd></div>
        <div><dt>Policy</dt><dd>{q.rule}</dd></div>
        <div><dt>Refund to the client</dt><dd><strong>{formatMoney(q.refundCents)}</strong></dd></div>
        <div><dt>You keep</dt><dd>{formatMoney(q.keptCents)}</dd></div>
        {q.unpaidCents > 0 && <div><dt>Unpaid payments</dt><dd>{formatMoney(q.unpaidCents)} will be voided</dd></div>}
      </dl>
      <Field label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <Field label="Type CANCEL to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      <div className="cluster">
        <Button to={`/app/events/${event.id}`}>Keep the event</Button>
        <Button variant="danger" onClick={confirm} disabled={typed.trim().toUpperCase() !== 'CANCEL'}>Cancel {event.name}</Button>
      </div>
    </Card>
  )
}
