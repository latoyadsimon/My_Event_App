// =====================================================================
// Public Booking Page (CL-1.2, PL-2.4): pick a free consult time, like
// Calendly. Only open times show: weekdays, after now, around the
// planner's appointments plus a buffer, up to a daily limit (Settings).
// ?lead=<id> (from the auto-reply email) fills in the name and email.
// =====================================================================
import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { openSlots, firstOpenDay, toDay, getClient, getLead } from '../../store/selectors'
import { TODAY, formatTime, parseDay } from '../../lib/clock'
import { isEmail } from '../../lib/validate'
import { downloadIcs } from '../../lib/ics'
import { Button, Card, EmptyState, Field, Icon } from '../../components/ui'
import NotFound from '../shared/NotFound'
import styles from './public.module.css'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS_AHEAD = 2

const longDay = (day) => parseDay(day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

function MonthGrid({ month, selected, onSelect, state }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toDay(new Date(month.getFullYear(), month.getMonth(), i + 1)))]
  return (
    <div className={styles.month} role="group" aria-label={month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}>
      {WEEKDAYS.map((d, i) => <span key={i} className={styles.weekday} aria-hidden="true">{d}</span>)}
      {cells.map((day, i) => {
        if (!day) return <span key={`blank-${i}`} />
        const n = openSlots(state, day).length
        const date = parseDay(day)
        const label = `${WEEKDAY_NAMES[date.getDay()]}, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
        if (!n) return <span key={day} className={styles.dayOff} aria-label={`${label}, no open times`}>{date.getDate()}</span>
        return (
          <button key={day} type="button" className={styles.day} aria-pressed={selected === day} onClick={() => onSelect(day)}
            aria-label={`${label}, ${n} open time${n > 1 ? 's' : ''}`}>
            {date.getDate()}
          </button>
        )
      })}
    </div>
  )
}

export default function BookingPage() {
  const { biz } = useParams()
  const [params] = useSearchParams()
  const { state, dispatch } = useStore()
  const lead = getLead(state, params.get('lead'))
  const client = lead && getClient(state, lead.clientId)

  const startDay = useMemo(() => firstOpenDay(state), [state])
  const [month, setMonth] = useState(() => { const d = parseDay(startDay ?? toDay(TODAY)); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [day, setDay] = useState(startDay)
  const [slot, setSlot] = useState(null)
  const [name, setName] = useState(client?.name ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [errors, setErrors] = useState({})
  const [booked, setBooked] = useState(null)

  if (biz !== state.business.slug) return <NotFound what="page" />
  const rules = state.business.booking

  const monthIndex = (month.getFullYear() - TODAY.getFullYear()) * 12 + month.getMonth() - TODAY.getMonth()
  const shiftMonth = (n) => {
    const next = new Date(month.getFullYear(), month.getMonth() + n, 1)
    setMonth(next)
    const firstInMonth = firstOpenDay(state, toDay(next < TODAY ? TODAY : next))
    const sameMonth = firstInMonth && parseDay(firstInMonth).getMonth() === next.getMonth()
    setDay(sameMonth ? firstInMonth : null)
    setSlot(null)
  }
  const times = day ? openSlots(state, day) : []
  const monthHasTimes = Array.from({ length: 31 }, (_, i) => toDay(new Date(month.getFullYear(), month.getMonth(), i + 1)))
    .some((d) => parseDay(d).getMonth() === month.getMonth() && openSlots(state, d).length)

  const book = (e) => {
    e.preventDefault()
    const found = {}
    if (!slot) found.slot = 'Please pick a time.'
    if (!name.trim()) found.name = 'Please enter your name.'
    if (!isEmail(email)) found.email = 'Please enter a full email address so we can send the invite.'
    setErrors(found)
    if (Object.keys(found).length) return
    dispatch({ type: 'consult/book', leadId: lead?.id, name, email, at: slot })
    setBooked({ at: slot, minutes: rules.consultMinutes, title: `Consult with ${state.business.name}` })
  }

  if (booked) {
    return (
      <Card className={styles.done} aria-live="polite">
        <span className={styles.doneIcon}><Icon name="check" size={24} /></span>
        <h1 className={`display ${styles.title}`}>You&apos;re booked</h1>
        <p><strong>{longDay(booked.at.slice(0, 10))} · {formatTime(booked.at)}</strong> ({booked.minutes} min) with {state.business.name}.</p>
        <p className="muted">A confirmation email is on its way, with reminders 24 hours and 1 hour before.</p>
        <div className="cluster">
          <Button variant="primary" onClick={() => downloadIcs(booked, 'consult.ics')}>Add to calendar</Button>
          <Link to="/outbox" className={styles.demoNote}>Demo: see the emails in the Outbox</Link>
        </div>
      </Card>
    )
  }

  return (
    <form className="stack" onSubmit={book} noValidate>
      <header>
        <h1 className={`display ${styles.title}`}>Book a free {rules.consultMinutes}-minute consult</h1>
        <p className="muted">{client ? `Hi ${client.name.split(' ')[0]}! ` : ''}Pick a day, then a time. Times are in Central Time.</p>
      </header>

      <div className={styles.bookGrid}>
        <Card>
          <div className={styles.monthHead}>
            <Button size="small" onClick={() => shiftMonth(-1)} disabled={monthIndex <= 0} aria-label="Previous month"><Icon name="chevronLeft" size={16} /></Button>
            <h2 className={styles.monthTitle}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <Button size="small" onClick={() => shiftMonth(1)} disabled={monthIndex >= MONTHS_AHEAD} aria-label="Next month"><Icon name="chevronRight" size={16} /></Button>
          </div>
          {monthHasTimes
            ? <MonthGrid month={month} selected={day} onSelect={(d) => { setDay(d); setSlot(null) }} state={state} />
            : <EmptyState title="No open times this month" action={monthIndex < MONTHS_AHEAD && <Button onClick={() => shiftMonth(1)}>See next month</Button>} />}
        </Card>

        <Card title={day ? longDay(day) : 'Pick a day'}>
          {day && (
            <fieldset className={styles.fieldset}>
              <legend className="visually-hidden">Open times on {longDay(day)}</legend>
              <div className={styles.times}>
                {times.map((t) => (
                  <button key={t} type="button" className={styles.time} aria-pressed={slot === t} onClick={() => setSlot(t)}>
                    {formatTime(t)}{slot === t && <Icon name="check" size={16} />}
                  </button>
                ))}
              </div>
              {errors.slot && <p className={styles.error} role="alert">{errors.slot}</p>}
            </fieldset>
          )}
          <Field label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Button type="submit" variant="primary" block>Book consult</Button>
        </Card>
      </div>
    </form>
  )
}
