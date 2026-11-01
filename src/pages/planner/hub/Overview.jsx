// =====================================================================
// Event Hub › Overview (PL-4.2): where the event stands at a glance.
// Status path, countdown, balance, RSVPs, tasks, the next 3 deadlines,
// the venue, the questionnaire and approvals, and the event's history.
// =====================================================================
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import {
  can, getEventGuests, getEventTasks, getInvoiceForEvent, guestCounts, invoiceTotals, nextDeadlines, STATUS_PATH,
} from '../../../store/selectors'
import { daysUntil, formatDateTime, formatDayShort } from '../../../lib/clock'
import { formatMoney } from '../../../lib/money'
import { Button, Card, Dialog, Field, Icon, Kpis, Notice, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

const words = (s) => s.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase())

function Venue({ event }) {
  const { dispatch } = useStore()
  const [editing, setEditing] = useState(false)
  const [v, setV] = useState(event.venueInfo)
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${v.address}`)}`
  const save = () => {
    dispatch({ type: 'event/update', eventId: event.id, changes: { venueInfo: v } })
    setEditing(false)
  }
  return (
    <Card title="Venue" action={<button type="button" className="link-button" onClick={() => setEditing(!editing)}>{editing ? 'Close' : 'Edit'}</button>}>
      <p><strong>{event.venue}</strong>{v.address && <><br /><span className="muted">{v.address}</span></>}</p>
      {editing
        ? (
          <div className="stack">
            <Field label="Address" value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} />
            <Field label="Load-in notes" as="textarea" value={v.loadIn} onChange={(e) => setV({ ...v, loadIn: e.target.value })} />
            <Field label="Wi-Fi" value={v.wifi} onChange={(e) => setV({ ...v, wifi: e.target.value })} />
            <Button variant="primary" onClick={save}>Save venue</Button>
          </div>
        )
        : (
          <>
            <a className={styles.map} href={mapUrl} target="_blank" rel="noreferrer">
              <Icon name="external" size={16} /> Open in Maps<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            <dl className={styles.facts}>
              <div><dt>Load-in</dt><dd>{v.loadIn || <span className="muted">Not added yet</span>}</dd></div>
              <div><dt>Wi-Fi</dt><dd>{v.wifi || <span className="muted">Not added yet</span>}</dd></div>
            </dl>
          </>
        )}
    </Card>
  )
}

export default function Overview() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [answersOpen, setAnswersOpen] = useState(false)
  const invoice = getInvoiceForEvent(state, event.id)
  const totals = invoice && invoiceTotals(invoice)
  const counts = guestCounts(getEventGuests(state, event.id))
  const tasks = getEventTasks(state, event.id).filter((t) => !t.done)
  const late = tasks.filter((t) => daysUntil(t.due) < 0).length
  const deadlines = nextDeadlines(state, event)
  const questionnaire = state.questionnaires.filter((q) => q.eventId === event.id).at(-1)
  const approvals = state.approvals.filter((a) => a.eventId === event.id)
  const days = daysUntil(event.date)
  const base = `/app/events/${event.id}`
  const stage = STATUS_PATH.indexOf(event.status)

  return (
    <div className="stack">
      {event.status === 'cancelled' && <Notice tone="danger">This event was cancelled {formatDayShort(event.cancelledAt)}. It&apos;s kept here for your records.</Notice>}
      {event.status === 'awaiting_countersign' && (
        <Notice tone="warning" action={<Button size="small" variant="primary" to={`/app/contracts/${state.contracts.find((c) => c.eventId === event.id)?.id}`}>Countersign</Button>}>
          Signed by the client. Countersign to book it.
        </Notice>
      )}

      {stage >= 0 && (
        <ol className={styles.path} aria-label="Event status">
          {STATUS_PATH.map((s, i) => (
            <li key={s} className={i < stage ? styles.pathDone : i === stage ? styles.pathNow : undefined} aria-current={i === stage ? 'step' : undefined}>
              {words(s)}
            </li>
          ))}
        </ol>
      )}

      <Kpis label="This event" items={[
        { label: days >= 0 ? 'days to go' : 'days ago', value: Math.abs(days) },
        ...(can(state, 'see_budgets') && totals ? [{ label: 'balance due', value: formatMoney(totals.balanceCents) }] : []),
        { label: 'RSVPs in', value: counts.households ? `${counts.responded}/${counts.households}` : '–', note: counts.attending ? `${counts.attending} attending` : undefined },
        { label: 'open tasks', value: tasks.length, note: late ? `${late} late` : 'none late' },
      ]} />

      <div className={styles.grid2}>
        <Card title="Next 3 deadlines">
          {deadlines.length === 0
            ? <p className="muted">Nothing coming up.</p>
            : (
              <ul role="list" className={styles.rows}>
                {deadlines.map((d, i) => (
                  <li key={i}>
                    <span className={d.late ? styles.late : styles.when}>{formatDayShort(d.day)}</span>
                    <Link to={`${base}/${d.to}`}>{d.text}</Link>
                    {d.late && <StatusChip tone="danger" label="Late" />}
                  </li>
                ))}
              </ul>
            )}
        </Card>

        <Venue key={event.id} event={event} />

        <Card title="Questionnaire">
          {!questionnaire
            ? <><p className="muted">Not sent yet.</p><Button onClick={() => dispatch({ type: 'questionnaire/send', eventId: event.id })}>Send questionnaire</Button></>
            : questionnaire.answeredAt
              ? <>
                  <p><Icon name="check" size={16} className={styles.inlineIcon} /> “{questionnaire.title}” received {formatDayShort(questionnaire.answeredAt)}</p>
                  <Button onClick={() => setAnswersOpen(true)}>View answers</Button>
                </>
              : questionnaire.sentAt
                ? <p>“{questionnaire.title}” sent {formatDayShort(questionnaire.sentAt)} · waiting for answers (due {formatDayShort(questionnaire.dueDate)})</p>
                : <><p className="muted">“{questionnaire.title}” is ready to send.</p><Button onClick={() => dispatch({ type: 'questionnaire/send', eventId: event.id })}>Send questionnaire</Button></>}
        </Card>

        <Card title="Approvals">
          {approvals.length === 0
            ? <p className="muted">Nothing sent for approval yet.</p>
            : (
              <ul role="list" className={styles.rows}>
                {approvals.map((a) => (
                  <li key={a.id}>
                    <StatusChip tone={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'warning' : 'info'} label={a.status === 'approved' ? 'Approved' : a.status === 'pending' ? 'Waiting' : 'Changes'} />
                    <span>{a.title}{a.decidedBy ? ` · ${a.decidedBy.split(' ')[0]}` : ''}</span>
                    {a.comment && <span className="muted">“{a.comment}”</span>}
                  </li>
                ))}
              </ul>
            )}
        </Card>
      </div>

      {event.log?.length > 0 && (
        <Card title="History">
          <ol role="list" className={styles.rows}>
            {[...event.log].reverse().map((l, i) => <li key={i}><span className={styles.when}>{formatDateTime(l.at)}</span><span>{l.text}</span></li>)}
          </ol>
        </Card>
      )}

      <Dialog open={answersOpen} title={questionnaire?.title ?? 'Answers'} onClose={() => setAnswersOpen(false)} wide>
        <dl className={styles.answers}>
          {questionnaire?.questions.map((q) => (
            <div key={q.id}><dt>{q.label}</dt><dd>{questionnaire.answers[q.id] || <span className="muted">No answer</span>}</dd></div>
          ))}
        </dl>
      </Dialog>
    </div>
  )
}
