// =====================================================================
// Events (PL-4.1): every event, sorted by date. Upcoming / Past / All and
// a status filter. Table on desktop, cards on phones. Tap → Event Hub.
// Events are created when a client signs; "+ New event" is for the rest.
// =====================================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getEventRows } from '../../../store/selectors'
import { EVENT_TYPES } from '../../../data/seed'
import { EVENT_STATUS_STYLE } from '../../../styles/themes'
import { formatMoney } from '../../../lib/money'
import { formatDay } from '../../../lib/clock'
import { isEmail } from '../../../lib/validate'
import { Button, Dialog, EmptyState, Field, PageHeader, StatusChip } from '../../../components/ui'
import styles from './booking.module.css'

const WHEN = [['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']]
const statusWords = (s) => s.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase())
const BLANK = { name: '', eventType: 'other', date: '', venue: '', clientName: '', email: '', guestCount: '' }

function NewEventDialog({ open, onClose }) {
  const { dispatch } = useStore()
  const [v, setV] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    const found = {}
    if (!v.name.trim()) found.name = 'Please name the event.'
    if (!v.date) found.date = 'Please pick the date.'
    if (!v.clientName.trim()) found.clientName = 'Who is it for?'
    if (!isEmail(v.email)) found.email = 'Please enter the client’s email.'
    setErrors(found)
    if (Object.keys(found).length) return
    dispatch({ type: 'event/create', ...v })
    setV(BLANK)
    onClose()
  }
  return (
    <Dialog open={open} title="New event" onClose={onClose} wide actions={<Button variant="primary" type="submit" form="new-event">Add event</Button>}>
      <p className="muted">For an event that didn&apos;t start as a lead, like a repeat client or a favor.</p>
      <form id="new-event" className={styles.formGrid} onSubmit={submit} noValidate>
        <Field label="Event name" value={v.name} onChange={set('name')} error={errors.name} />
        <Field label="Type" as="select" value={v.eventType} onChange={set('eventType')}>
          {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Field>
        <Field label="Date" type="date" value={v.date} onChange={set('date')} error={errors.date} />
        <Field label="Venue (optional)" value={v.venue} onChange={set('venue')} />
        <Field label="Client name" value={v.clientName} onChange={set('clientName')} error={errors.clientName} />
        <Field label="Client email" type="email" value={v.email} onChange={set('email')} error={errors.email} />
      </form>
    </Dialog>
  )
}

export default function Events() {
  const { state } = useStore()
  const [when, setWhen] = useState('upcoming')
  const [status, setStatus] = useState('all')
  const [adding, setAdding] = useState(false)
  const rows = getEventRows(state, { when, status })
  const balance = (r) => (r.balanceCents == null ? '–' : formatMoney(r.balanceCents))

  return (
    <>
      <PageHeader title="Events" actions={<Button variant="primary" onClick={() => setAdding(true)}>+ New event</Button>} />
      <div className={styles.filters}>
        <div className={styles.segmented} role="group" aria-label="Show">
          {WHEN.map(([id, label]) => <button key={id} type="button" aria-pressed={when === id} onClick={() => setWhen(id)}>{label}</button>)}
        </div>
        <label className={styles.filter}>
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            {Object.keys(EVENT_STATUS_STYLE).map((s) => <option key={s} value={s}>{statusWords(s)}</option>)}
          </select>
        </label>
      </div>

      {state.events.length === 0
        ? <EmptyState title="No events yet" action={<Button onClick={() => setAdding(true)}>+ New event</Button>}>Events are created when a client signs a contract, or you can add one yourself.</EmptyState>
        : rows.length === 0
          ? <EmptyState title="Nothing matches">Try All, or another status.</EmptyState>
          : (
            <>
              <div className={`${styles.tableWrap} ${styles.desktopOnly}`}>
                <table className={styles.table}>
                  <thead><tr><th scope="col">Event</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col" className={styles.num}>Balance</th><th scope="col" className={styles.num}>Open tasks</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.event.id}>
                        <td><Link to={`/app/events/${r.event.id}`} className={styles.rowLink}>{r.event.name}</Link></td>
                        <td>{formatDay(r.event.date)}</td>
                        <td><StatusChip status={r.event.status} /></td>
                        <td className={styles.num}>{balance(r)}</td>
                        <td className={styles.num}>{r.openTasks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul role="list" className={styles.cards}>
                {rows.map((r) => (
                  <li key={r.event.id}>
                    <Link to={`/app/events/${r.event.id}`} className={styles.rowLink}>{r.event.name}</Link> <StatusChip status={r.event.status} />
                    <p className="muted">{formatDay(r.event.date)} · balance {balance(r)} · {r.openTasks} tasks</p>
                  </li>
                ))}
              </ul>
            </>
          )}
      <NewEventDialog open={adding} onClose={() => setAdding(false)} />
    </>
  )
}
