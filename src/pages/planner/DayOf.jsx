// =====================================================================
// Day-of Mode (PL-7.1 to PL-7.5): run the event from a phone.
//   Run       now / next with big buttons, Running late, live numbers,
//             vendor arrivals
//   Door      check guests in (also in the staff app)
//   Sell      tap-to-pay add-ons, added to the invoice (needs "Take payments")
//   Incidents log with photos
//   Teardown  scan gear back in; done lists what's missing → Wrap-up
// Works offline (stand-in: the data lives on the device until Supabase).
// =====================================================================
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { can, getEvent, getMe } from '../../store/selectors'
import { formatDay } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { Button, Card, ConfirmDialog, Field, Notice, StatusChip } from '../../components/ui'
import { Arrivals, CheckIn, GearReturn, Incidents, LivePanel, NowNext, OfflineBanner } from '../../components/eventDay/EventDay'
import NotFound from '../shared/NotFound'
import styles from './DayOf.module.css'

const SECTIONS = [['run', 'Run'], ['door', 'Door'], ['sell', 'Sell'], ['incidents', 'Incidents'], ['teardown', 'Teardown']]

function Sell({ event }) {
  const { state, dispatch } = useStore()
  const me = getMe(state)
  const addons = state.addons.filter((a) => !a.archived)
  const [addonId, setAddonId] = useState(addons.find((a) => a.id === 'extra-karaoke-hour')?.id ?? addons[0]?.id ?? 'custom')
  const [qty, setQty] = useState('1')
  const [custom, setCustom] = useState({ label: '', amount: '' })
  if (!can(state, 'take_payments')) return <Notice>Ask the owner to turn on “Take payments” for you in Settings › Team &amp; roles.</Notice>
  const addon = addons.find((a) => a.id === addonId)
  const amountCents = addon ? addon.priceCents * (Number(qty) || 1) : Math.round(parseFloat(custom.amount || '0') * 100)
  const label = addon ? `${addon.name}${Number(qty) > 1 ? ` × ${qty}` : ''}` : custom.label.trim()
  return (
    <Card title="Sell an add-on">
      <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'sale/onsite', eventId: event.id, label, amountCents, memberId: me.id }) }}>
        <Field label="What" as="select" value={addonId} onChange={(e) => setAddonId(e.target.value)}>
          {addons.map((a) => <option key={a.id} value={a.id}>{a.name} · {formatMoney(a.priceCents)}</option>)}
          <option value="custom">Something else</option>
        </Field>
        {addon
          ? <Field label="How many" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          : (
            <div className={styles.grid2}>
              <Field label="Description" value={custom.label} onChange={(e) => setCustom({ ...custom, label: e.target.value })} />
              <Field label="Amount ($)" inputMode="decimal" value={custom.amount} onChange={(e) => setCustom({ ...custom, amount: e.target.value })} />
            </div>
          )}
        <Button type="submit" variant="primary" disabled={!label || !(amountCents > 0)}>Tap to pay {amountCents > 0 ? formatMoney(amountCents) : ''}</Button>
      </form>
      <p className="muted">The client taps their card or phone on yours. It&apos;s added to the invoice and they get a receipt. (Demo: the payment always goes through.)</p>
    </Card>
  )
}

export default function DayOf() {
  const { eventId } = useParams()
  const { state, dispatch } = useStore()
  const [section, setSection] = useState('run')
  const [starting, setStarting] = useState(false)
  const event = getEvent(state, eventId)
  if (!event) return <NotFound what="event" />
  const me = getMe(state)
  const live = event.status === 'event_day'
  const over = ['wrap_up', 'closed'].includes(event.status)

  return (
    <div className={styles.dayOf}>
      <Link to={`/app/events/${event.id}`} className={styles.crumb}>{event.name}</Link>
      <header className={styles.head}>
        <div>
          <h1 className={`display ${styles.title}`}>Day-of Mode</h1>
          <p className={styles.sub}>{formatDay(event.date)} · {event.venue}</p>
        </div>
        <StatusChip status={event.status} />
      </header>
      <OfflineBanner />

      {!live && !over && (
        <Notice tone="info" action={<Button variant="primary" onClick={() => setStarting(true)}>Start event day</Button>}>
          On the day this starts by itself in the morning. In the demo, start it here.
        </Notice>
      )}
      {over && <Notice tone="success" action={<Button to={`/app/events/${event.id}/wrap-up`}>Go to wrap-up</Button>}>Teardown is done. Close out the event in Wrap-up.</Notice>}

      <LivePanel eventId={event.id} money={can(state, 'see_budgets')} />

      <div className={styles.segmented} role="tablist" aria-label="Day-of sections">
        {SECTIONS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={section === id} aria-controls="dayof-panel" onClick={() => setSection(id)}>{label}</button>
        ))}
      </div>

      <div id="dayof-panel" role="tabpanel" aria-label={SECTIONS.find(([id]) => id === section)[1]} className="stack">
        {section === 'run' && <><NowNext eventId={event.id} memberId={me.id} /><Arrivals eventId={event.id} />{event.karaoke?.enabled && <Button to={`/app/kj/${event.id}`}>Karaoke: KJ console</Button>}</>}
        {section === 'door' && <CheckIn eventId={event.id} by={me.id} />}
        {section === 'sell' && <Sell event={event} />}
        {section === 'incidents' && <Incidents eventId={event.id} memberId={me.id} />}
        {section === 'teardown' && <GearReturn eventId={event.id} />}
      </div>

      <ConfirmDialog open={starting} danger={false} title="Start event day?" confirmLabel="Start event day"
        onCancel={() => setStarting(false)} onConfirm={() => { dispatch({ type: 'event/startDay', eventId: event.id }); setStarting(false) }}>
        The status moves to Event day and the client gets the morning-of message: start time and their day-of contact.
      </ConfirmDialog>
    </div>
  )
}
