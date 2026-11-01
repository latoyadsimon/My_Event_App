// =====================================================================
// Calendar (PL-4.8): events, consults/visits and date holds in month,
// week, day or list view (list is the phone default). Holds are dashed,
// with the days left. Warns about double-booking and tight travel.
// Tap an event → Event Hub; tap a hold → Lead Detail.
// =====================================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { calendarItems, calendarWarnings, toDay } from '../../store/selectors'
import { TODAY, formatTime, formatWeekdayDay, parseDay } from '../../lib/clock'
import { Button, Dialog, Field, Notice, PageHeader } from '../../components/ui'
import styles from './Calendar.module.css'

const VIEWS = [['month', 'Month'], ['week', 'Week'], ['day', 'Day'], ['list', 'List']]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const isPhone = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const startOfWeek = (d) => addDays(d, -d.getDay())

function Item({ item }) {
  const label = item.kind === 'hold' ? `${item.title} (${item.daysLeft} day${item.daysLeft === 1 ? '' : 's'} left)` : `${item.at ? `${formatTime(item.at)} ` : ''}${item.title}`
  return (
    <Link to={item.to} className={`${styles.item} ${styles[item.kind]}`} data-status={item.status}>
      {label}
    </Link>
  )
}

function HoldDialog({ open, onClose }) {
  const { state, dispatch } = useStore()
  const leads = state.leads.filter((l) => l.eventDate && !l.hold && ['new', 'contacted', 'consult_booked', 'proposal_sent'].includes(l.stage))
  const [leadId, setLeadId] = useState('')
  return (
    <Dialog open={open} title="Hold a date" onClose={onClose}
      actions={<Button variant="primary" disabled={!leadId} onClick={() => { dispatch({ type: 'lead/holdDate', leadId }); onClose() }}>Hold for {state.business.holdDays} days</Button>}>
      <p className="muted">A hold blocks the date softly (dashed) and expires on its own.</p>
      <Field label="For which lead" as="select" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
        <option value="">Choose a lead</option>
        {leads.map((l) => <option key={l.id} value={l.id}>{l.title} · {formatWeekdayDay(l.eventDate)}</option>)}
      </Field>
    </Dialog>
  )
}

export default function Calendar() {
  const { state } = useStore()
  const [view, setView] = useState(() => (isPhone() ? 'list' : 'month'))
  const [cursor, setCursor] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()))
  const [holding, setHolding] = useState(false)

  // The visible range for each view
  const range = {
    month: [new Date(cursor.getFullYear(), cursor.getMonth(), 1), new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)],
    week: [startOfWeek(cursor), addDays(startOfWeek(cursor), 6)],
    day: [cursor, cursor],
    list: [cursor, addDays(cursor, 89)],
  }[view]
  const items = calendarItems(state, toDay(range[0]), toDay(range[1]))
  const warnings = calendarWarnings(items)
  const byDay = {}
  for (const i of items) (byDay[i.day] ??= []).push(i)

  const step = (n) => setCursor((c) => (view === 'month' ? new Date(c.getFullYear(), c.getMonth() + n, 1)
    : addDays(c, n * (view === 'week' ? 7 : view === 'day' ? 1 : 90))))
  const title = view === 'month' ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : view === 'day' ? parseDay(toDay(cursor)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : `${formatWeekdayDay(range[0])} – ${formatWeekdayDay(range[1])}`
  const provider = { google: 'Google', apple: 'Apple', outlook: 'Outlook' }[state.business.calendarProvider]

  const monthCells = () => {
    const first = range[0]
    const lead = first.getDay()
    const days = range[1].getDate()
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))]
  }

  return (
    <>
      <PageHeader title="Calendar" actions={
        <>
          <Button onClick={() => setHolding(true)}>+ Hold date</Button>
          {provider ? <span className={styles.sync}>Sync: {provider} ✓</span> : <Button to="/app/settings/calendar">Connect your calendar</Button>}
        </>
      } />

      <div className={styles.toolbar}>
        <div className={styles.segmented} role="group" aria-label="View">
          {VIEWS.map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}
        </div>
        <div className={styles.nav}>
          <Button size="small" onClick={() => step(-1)} aria-label="Previous">‹</Button>
          <h2 className={styles.title}>{title}</h2>
          <Button size="small" onClick={() => step(1)} aria-label="Next">›</Button>
          <Button size="small" onClick={() => setCursor(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()))}>Today</Button>
        </div>
      </div>

      {warnings.map((w, i) => (
        <Notice key={i} tone="warning" action={<Button size="small" to={w.items[1].to}>Open</Button>}>⚠ {formatWeekdayDay(w.day)}: {w.text}.</Notice>
      ))}

      {view === 'month' && (
        <div className={styles.month} role="group" aria-label={title}>
          {WEEKDAYS.map((d) => <div key={d} className={styles.weekday}>{d}</div>)}
          {monthCells().map((d, i) => (
            <div key={i} className={`${styles.cell} ${d && toDay(d) === toDay(TODAY) ? styles.today : ''}`}>
              {d && (
                <>
                  <span className={styles.dayNum}>{d.getDate()}</span>
                  {(byDay[toDay(d)] ?? []).map((item) => <Item key={item.id} item={item} />)}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'week' && (
        <div className={styles.week}>
          {Array.from({ length: 7 }, (_, i) => addDays(range[0], i)).map((d) => (
            <section key={toDay(d)} className={`${styles.weekDay} ${toDay(d) === toDay(TODAY) ? styles.today : ''}`} aria-label={formatWeekdayDay(d)}>
              <h3 className={styles.weekTitle}>{WEEKDAYS[d.getDay()]} {d.getDate()}</h3>
              {(byDay[toDay(d)] ?? []).map((item) => <Item key={item.id} item={item} />)}
            </section>
          ))}
        </div>
      )}

      {(view === 'day' || view === 'list') && (
        items.length === 0
          ? <p className="muted">Nothing scheduled.</p>
          : (
            <ol role="list" className={styles.agenda}>
              {Object.entries(byDay).map(([day, list]) => (
                <li key={day}>
                  <h3 className={styles.agendaDay}>{formatWeekdayDay(day)}</h3>
                  <ul role="list" className={styles.agendaItems}>{list.map((item) => <li key={item.id}><Item item={item} /></li>)}</ul>
                </li>
              ))}
            </ol>
          )
      )}

      <div className={styles.legend} aria-label="Legend">
        <span className={`${styles.item} ${styles.event}`}>Event</span>
        <span className={`${styles.item} ${styles.hold}`}>Hold</span>
        <span className={`${styles.item} ${styles.appointment}`}>Consult · visit · call</span>
      </div>
      <HoldDialog open={holding} onClose={() => setHolding(false)} />
    </>
  )
}
