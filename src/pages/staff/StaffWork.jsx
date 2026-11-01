// =====================================================================
// The staff app's working screens (product Phase 2), phone first:
//   StaffShifts        /app/staff/shifts             offers to answer, upcoming, past (timesheets)
//   StaffShift         /app/staff/shifts/:shiftId    accept/decline, swap, call sheet, offline,
//                                                    clock in/out, forgot-to-clock request
//   StaffAvailability  /app/staff/availability       weekly days + days off
//   StaffPack          /app/staff/pack/:eventId      scan labels into the van; done flags the rest
//   StaffChat          /app/staff/chat               the event's team chat, alerts, voice notes
//   StaffDayOf         /app/staff/day-of             only my role's tools on event day (ST-4.2);
//                                                    the KJ gets the KJ console (ST-4.5)
// "Me" is the teammate the demo bar (or a shift text) picked: ui.staffId.
// =====================================================================
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import {
  formatClock, formatHours, getShift, getTimeline, isAvailable, myShifts, packList, shiftMinutes, suggestStaff, workedMinutes,
} from '../../store/selectors'
import { daysUntil, formatDateTime, formatDay, formatTime, formatWeekdayDay } from '../../lib/clock'
import { Button, Card, EmptyState, Field, Icon, Notice, PageHeader, StatusChip } from '../../components/ui'
import Conversation from '../../components/planning/Conversation'
import NotFound from '../shared/NotFound'
import { Arrivals, CheckIn, GearReturn, Incidents, LivePanel, NowNext, OfflineBanner } from '../../components/eventDay/EventDay'
import styles from './staff.module.css'

const DUTIES = {
  'Setup crew': 'Unload the van, set up gear and the room to the floor plan, then check in with the coordinator.',
  Coordinator: 'Run the timeline, cue vendors and staff, handle the client and any incidents.',
  KJ: 'Run the karaoke queue fairly, keep it clean for the event, keep the energy up.',
  'Photo booth attendant': 'Run the booth and printer, help guests with props, keep the line moving.',
  Server: 'Serve food and drinks, clear tables, watch for allergy notes.',
  Bartender: 'Serve drinks responsibly; check IDs.',
  'Door / check-in': 'Greet guests, check them in by QR or name, add walk-ins.',
  Teardown: 'Pack gear back into the van, scan every item in, leave the room as you found it.',
}
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIMESHEET = { pending: ['warning', 'Waiting for approval'], approved: ['info', 'Approved'], paid: ['success', 'Paid'] }

function useMe() {
  const { state } = useStore()
  return state.team.find((m) => m.id === state.ui.staffId) ?? state.team.find((m) => m.role === 'staff')
}
const shiftWhen = (s) => `${formatWeekdayDay(s.date)} · ${formatClock(s.start)}–${formatClock(s.end)}`

export function StaffShifts() {
  const { state } = useStore()
  const me = useMe()
  const all = myShifts(state, me.id)
  const offers = all.filter((s) => s.status === 'offered')
  const upcoming = all.filter((s) => s.status === 'accepted' && daysUntil(s.date) >= 0)
  const past = all.filter((s) => daysUntil(s.date) < 0)
  const row = (s) => (
    <li key={s.id}>
      <Link to={`/app/staff/shifts/${s.id}`} className={styles.shiftLink}>
        <span className={styles.shiftWhen}>{shiftWhen(s)}</span>
        <strong>{s.role} · {s.event.name}</strong>
        <span className="muted">{s.event.venue}</span>
      </Link>
      {s.swap && <StatusChip tone="warning" label="Swap requested" />}
      {s.timesheet && <StatusChip tone={TIMESHEET[s.timesheet][0]} label={TIMESHEET[s.timesheet][1]} />}
    </li>
  )
  return (
    <>
      <PageHeader title="My shifts" sub={`${state.business.name} · ${me.name}`} actions={<Button size="small" to="/app/staff/availability">My availability</Button>} />
      {offers.length > 0 && <Card title={`New offers (${offers.length})`}><ul role="list" className={styles.list}>{offers.map(row)}</ul></Card>}
      <Card title="Coming up">
        {upcoming.length === 0 ? <EmptyState title="No shifts yet">When the planner offers you a shift, you'll get a push and it shows here.</EmptyState>
          : <ul role="list" className={styles.list}>{upcoming.map(row)}</ul>}
      </Card>
      {past.length > 0 && <Card title="Past shifts"><ul role="list" className={styles.list}>{past.map(row)}</ul></Card>}
    </>
  )
}

function ClockPanel({ shift }) {
  const { dispatch } = useStore()
  const [away, setAway] = useState(false)
  const [reason, setReason] = useState('')
  const [out, setOut] = useState({ breakMinutes: '', miles: '', notes: '' })
  const [manual, setManual] = useState(null)
  if (shift.clockOut) {
    return (
      <Card title="Your hours">
        <p className={styles.big}>{formatHours(workedMinutes(shift))}</p>
        <p className="muted">{formatTime(shift.clockIn.at)}–{formatTime(shift.clockOut.at)}{shift.clockOut.breakMinutes ? ` · ${shift.clockOut.breakMinutes} min break` : ''}{shift.clockOut.miles ? ` · ${shift.clockOut.miles} mi` : ''}{shift.manual ? ' · entered by hand' : ''}</p>
        <StatusChip tone={TIMESHEET[shift.timesheet][0]} label={TIMESHEET[shift.timesheet][1]} />
      </Card>
    )
  }
  if (shift.clockIn) {
    return (
      <Card title={`Clocked in at ${formatTime(shift.clockIn.at)}`}>
        <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'shift/clockOut', id: shift.id, ...out }) }}>
          <div className={styles.grid}>
            <Field label="Break (minutes)" type="number" min="0" value={out.breakMinutes} onChange={(e) => setOut({ ...out, breakMinutes: e.target.value })} />
            <Field label="Mileage" type="number" min="0" value={out.miles} onChange={(e) => setOut({ ...out, miles: e.target.value })} />
          </div>
          <Field label="Notes" value={out.notes} onChange={(e) => setOut({ ...out, notes: e.target.value })} />
          <Button type="submit" variant="primary">Clock out</Button>
        </form>
      </Card>
    )
  }
  return (
    <Card title="Clock in">
      {!away
        ? (
          <>
            <p className="muted"><Icon name="check" size={14} /> Your location matches the venue. (In the demo, location is assumed.)</p>
            <Button variant="primary" onClick={() => dispatch({ type: 'shift/clockIn', id: shift.id, atVenue: true })}>Clock in</Button>
            <button type="button" className="link-button" onClick={() => setAway(true)}>I&apos;m not at the venue</button>
          </>
        )
        : (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'shift/clockIn', id: shift.id, atVenue: false, reason }) }}>
            <Field label="Why are you clocking in away from the venue?" value={reason} onChange={(e) => setReason(e.target.value)} hint="The planner sees this." />
            <Button type="submit" variant="primary" disabled={!reason.trim()}>Clock in with a reason</Button>
          </form>
        )}
      {manual
        ? (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'shift/requestTime', id: shift.id, ...manual }) }}>
            <div className={styles.grid}>
              <Field label="Started" type="time" value={manual.start} onChange={(e) => setManual({ ...manual, start: e.target.value })} />
              <Field label="Finished" type="time" value={manual.end} onChange={(e) => setManual({ ...manual, end: e.target.value })} />
            </div>
            <Field label="What happened?" value={manual.note} onChange={(e) => setManual({ ...manual, note: e.target.value })} />
            <Button type="submit" disabled={!manual.start || !manual.end}>Send for approval</Button>
          </form>
        )
        : <button type="button" className="link-button" onClick={() => setManual({ start: shift.start, end: shift.end, note: '' })}>Forgot to clock in or out?</button>}
    </Card>
  )
}

export function StaffShift() {
  const { shiftId } = useParams()
  const { state, dispatch } = useStore()
  const me = useMe()
  const [swapTo, setSwapTo] = useState('')
  const [reason, setReason] = useState('')
  const shift = getShift(state, shiftId)
  if (!shift || shift.removed) return <NotFound what="shift" />
  const event = state.events.find((e) => e.id === shift.eventId)
  const mine = shift.memberId === me.id
  if (!mine && shift.status !== 'open') return <Notice tone="info">This shift is with someone else now. <Link to="/app/staff/shifts">See your shifts</Link></Notice>

  const coordinator = state.team.find((m) => m.role === 'coordinator' && m.status === 'active') ?? state.team.find((m) => m.role === 'owner')
  const timeline = getTimeline(state, event.id, 'staff').filter((t) => t.owner === me.id || t.visibility.includes('staff'))
  const coworkers = suggestStaff(state, shift.id).filter((x) => x.member.id !== me.id && x.qualified && x.available)
  const offline = me.offline?.[event.id]
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.venueInfo?.address ?? ''}`)}`
  const packer = ['Setup crew', 'Teardown'].includes(shift.role)

  return (
    <>
      <PageHeader title={`${shift.role} · ${event.name}`} sub={`${formatDay(shift.date)} · ${formatClock(shift.start)}–${formatClock(shift.end)} (${formatHours(shiftMinutes(shift))})`} />

      {shift.status === 'open' && (
        <Card title="This shift needs someone">
          <Button variant="primary" onClick={() => dispatch({ type: 'shift/assign', id: shift.id, memberId: me.id })}>I can take it</Button>
        </Card>
      )}
      {mine && shift.status === 'offered' && (
        <Card title="Can you work this shift?">
          <div className="cluster">
            <Button variant="primary" onClick={() => dispatch({ type: 'shift/respond', id: shift.id, accept: true })}>Accept</Button>
            <Button onClick={() => dispatch({ type: 'shift/respond', id: shift.id, accept: false })}>Decline</Button>
          </div>
          {!isAvailable(me, shift.date) && <p className="muted">Heads up: you marked this day as unavailable.</p>}
        </Card>
      )}

      {mine && shift.status === 'accepted' && (
        <>
          <ClockPanel shift={shift} />
          <Card title="Offline">
            {offline
              ? <p><Icon name="check" size={14} /> On this phone since {formatDateTime(offline)}. It updates on Wi-Fi.</p>
              : <><p className="muted">Venues can have bad signal. Save this event to your phone.</p><Button onClick={() => dispatch({ type: 'staff/downloadOffline', memberId: me.id, eventId: event.id })}>Download for offline</Button></>}
          </Card>
        </>
      )}

      <Card title="Call sheet">
        <dl className={styles.facts}>
          <div><dt>Where</dt><dd>{event.venue}{event.venueInfo?.address && <><br />{event.venueInfo.address}</>}<br /><a href={mapUrl} target="_blank" rel="noreferrer">Open in Maps<span className="visually-hidden"> (opens in a new tab)</span></a></dd></div>
          <div><dt>Arrive</dt><dd>{formatClock(shift.start)}</dd></div>
          <div><dt>Parking &amp; load-in</dt><dd>{event.venueInfo?.loadIn || 'Ask your on-site contact'}</dd></div>
          <div><dt>Wear</dt><dd>{state.business.staffDressCode}</dd></div>
          <div><dt>On-site contact</dt><dd>{coordinator.name} · <a href={`tel:${coordinator.phone}`}>{coordinator.phone}</a></dd></div>
          <div><dt>Your job</dt><dd>{DUTIES[shift.role]}</dd></div>
        </dl>
        <p className="muted">We text you this the day before.</p>
      </Card>

      {timeline.length > 0 && (
        <Card title="Timeline">
          <ol role="list" className={`${styles.list} ${styles.timeline}`}>
            {timeline.map((t) => (
              <li key={t.id} className={t.owner === me.id ? styles.mineItem : undefined}>
                <span className={styles.shiftWhen}>{formatClock(t.time)}</span>
                <span><strong>{t.title}</strong>{t.owner === me.id && ' (you)'}{t.location && ` · ${t.location}`}{t.notes && <span className={styles.subline}>{t.notes}</span>}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {mine && packer && shift.status === 'accepted' && <Button to={`/app/staff/pack/${event.id}`}>Pack the van</Button>}

      {mine && shift.status === 'accepted' && !shift.clockIn && (
        <Card title="Can't make it?">
          {shift.swap
            ? <p>You asked {state.team.find((m) => m.id === shift.swap.toId)?.name} to take this. Waiting for the planner to approve.</p>
            : coworkers.length === 0
              ? <p className="muted">No qualified coworker is free that day. Message the planner in Chat.</p>
              : (
                <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'shift/requestSwap', id: shift.id, toId: swapTo, reason }) }}>
                  <Field label="Swap with" as="select" value={swapTo} onChange={(e) => setSwapTo(e.target.value)}>
                    <option value="">Choose a coworker</option>
                    {coworkers.map((x) => <option key={x.member.id} value={x.member.id}>{x.member.name}{x.busy ? ' (on another shift)' : ''}</option>)}
                  </Field>
                  <Field label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
                  <Button type="submit" disabled={!swapTo}>Request swap</Button>
                </form>
              )}
        </Card>
      )}
    </>
  )
}

export function StaffAvailability() {
  const { dispatch } = useStore()
  const me = useMe()
  const [weekdays, setWeekdays] = useState(me.availability?.weekdays ?? [0, 1, 2, 3, 4, 5, 6])
  const [off, setOff] = useState(me.availability?.off ?? [])
  const [day, setDay] = useState('')
  const toggle = (d) => setWeekdays(weekdays.includes(d) ? weekdays.filter((x) => x !== d) : [...weekdays, d].sort())
  return (
    <>
      <PageHeader title="My availability" sub="You're only offered shifts on days you're free." />
      <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'staff/setAvailability', memberId: me.id, weekdays, off }) }}>
        <Card title="Every week">
          <fieldset className={styles.fieldset}>
            <legend className="visually-hidden">Days you can usually work</legend>
            <div className={styles.skills}>
              {WEEKDAYS.map((w, i) => <label key={w} className={styles.check}><input type="checkbox" checked={weekdays.includes(i)} onChange={() => toggle(i)} /> {w}</label>)}
            </div>
          </fieldset>
        </Card>
        <Card title="Days off">
          {off.length === 0 ? <p className="muted">None.</p> : (
            <ul role="list" className={styles.list}>
              {off.map((d) => <li key={d}><span>{formatDay(d)}</span><Button size="small" onClick={() => setOff(off.filter((x) => x !== d))} aria-label={`Remove ${formatDay(d)}`}>Remove</Button></li>)}
            </ul>
          )}
          <div className={styles.inline}>
            <Field label="Add a day off" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            <Button disabled={!day || off.includes(day)} onClick={() => { setOff([...off, day].sort()); setDay('') }}>Add</Button>
          </div>
        </Card>
        <Button type="submit" variant="primary">Save availability</Button>
      </form>
    </>
  )
}

export function StaffPack() {
  const { eventId } = useParams()
  const { state, dispatch } = useStore()
  const [code, setCode] = useState('')
  const event = state.events.find((e) => e.id === eventId)
  if (!event) return <NotFound what="event" />
  const { rows, packedCount } = packList(state, event.id)
  const scan = (e) => {
    e.preventDefault()
    if (!code.trim()) return
    dispatch({ type: 'pack/scan', eventId: event.id, code })
    setCode('')
  }
  return (
    <>
      <PageHeader title="Pack the van" sub={`${event.name} · ${packedCount} of ${rows.length} packed`} />
      <Card title="Scan a label">
        <form className={styles.inline} onSubmit={scan}>
          <Field label="Label code" value={code} onChange={(e) => setCode(e.target.value)} hint="Point the camera at the QR or barcode, or type it (like CR-BC-01)" autoCapitalize="characters" />
          <Button type="submit" variant="primary">Scan</Button>
        </form>
      </Card>
      <Card title="Pack list">
        <ul role="list" className={styles.list}>
          {rows.map((r) => (
            <li key={r.key}>
              <span><strong>{r.qty > 1 ? `${r.qty} × ` : ''}{r.name}</strong><span className={styles.subline}>{r.label || r.group}</span></span>
              {r.status === 'packed' || r.status === 'returned'
                ? <StatusChip tone="success" label="In the van" />
                : r.status === 'missing' ? <StatusChip tone="danger" label="Missing" />
                  : <Button size="small" onClick={() => dispatch({ type: 'pack/scan', eventId: event.id, code: r.key })} aria-label={`Mark ${r.name} packed`}>Packed</Button>}
            </li>
          ))}
        </ul>
      </Card>
      <Button variant="primary" onClick={() => dispatch({ type: 'pack/flagMissing', eventId: event.id })}>Done packing</Button>
      <p className="muted">Anything not scanned is flagged to the planner as missing.</p>
    </>
  )
}

export function StaffChat() {
  const { state, dispatch } = useStore()
  const me = useMe()
  const [params, setParams] = useSearchParams()
  const [alert, setAlert] = useState(false)
  const events = [...new Map(myShifts(state, me.id).filter((s) => s.status === 'accepted' && daysUntil(s.date) >= 0).map((s) => [s.event.id, s.event])).values()]
  const event = events.find((e) => e.id === params.get('e')) ?? events[0]
  if (!event) return <><PageHeader title="Team chat" /><EmptyState title="No events yet">Chat opens for each event you're working.</EmptyState></>
  const thread = state.threads.find((t) => t.eventId === event.id && t.kind === 'team') ?? { name: 'Team chat', messages: [] }
  const send = (text, attachment) => { dispatch({ type: 'thread/postTeam', eventId: event.id, memberId: me.id, text, attachment, alert }); setAlert(false) }
  return (
    <>
      <PageHeader title="Team chat" sub={event.name} />
      {events.length > 1 && (
        <Field label="Event" as="select" value={event.id} onChange={(e) => setParams({ e: e.target.value })}>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Field>
      )}
      <Card>
        <Conversation thread={{ ...thread, name: `${event.name} team` }} me={me.id} onSend={send} sendLabel={alert ? 'Send alert' : 'Send'}
          extra={
            <>
              <Button size="small" onClick={() => send('🎙 Voice note (0:12)', 'Voice note 0:12.m4a')}>Voice note</Button>
              <label className={styles.check}><input type="checkbox" checked={alert} onChange={(e) => setAlert(e.target.checked)} /> Alert the whole crew</label>
            </>
          } />
      </Card>
    </>
  )
}

/** ST-4.2: Day-of shows only my role's tools. Coordinator: now/next, cues, vendor arrivals,
 *  incidents. Door: check-in. Setup/teardown: gear back in. Everyone: my timeline + incidents. */
export function StaffDayOf() {
  const { state } = useStore()
  const me = useMe()
  const mine = myShifts(state, me.id).filter((s) => s.status === 'accepted')
  const today = mine.filter((s) => s.event.status === 'event_day')
  const [pick, setPick] = useState(null)
  const shift = today.find((s) => s.id === pick) ?? today[0]
  if (!shift) {
    const next = mine.find((s) => daysUntil(s.date) >= 0)
    return (
      <>
        <PageHeader title="Day-of" />
        <EmptyState title="No event today" action={next && <Button to={`/app/staff/shifts/${next.id}`}>See your call sheet</Button>}>
          {next ? `Your next shift is ${next.role} at ${next.event.name}, ${formatWeekdayDay(next.date)}. Day-of opens when the event day starts.` : 'Day-of opens on the day of your next event.'}
        </EmptyState>
      </>
    )
  }
  const event = shift.event
  const role = shift.role
  return (
    <>
      <PageHeader title={`Day-of · ${role}`} sub={event.name} />
      <OfflineBanner />
      {today.length > 1 && (
        <Field label="Shift" as="select" value={shift.id} onChange={(e) => setPick(e.target.value)}>
          {today.map((s) => <option key={s.id} value={s.id}>{s.role} · {formatClock(s.start)}</option>)}
        </Field>
      )}
      {!shift.clockIn && <Notice tone="warning" action={<Button size="small" to={`/app/staff/shifts/${shift.id}`}>Clock in</Button>}>You haven&apos;t clocked in yet.</Notice>}
      {role === 'Coordinator' && <><LivePanel eventId={event.id} money={false} /><NowNext eventId={event.id} memberId={me.id} /><Arrivals eventId={event.id} /></>}
      {role === 'Door / check-in' && <CheckIn eventId={event.id} by={me.id} />}
      {role === 'Photo booth attendant' && event.booth?.enabled && <Button variant="primary" to={`/app/staff/booth/${event.id}`}>Open the booth panel</Button>}
      {role === 'KJ' && event.karaoke?.enabled && <Button variant="primary" to={`/app/staff/kj/${event.id}`}>Open the KJ console</Button>}
      {['Setup crew', 'Teardown'].includes(role) && <GearReturn eventId={event.id} />}
      {!['Coordinator', 'Door / check-in'].includes(role) && (
        <Card title="My part of the timeline">
          <ol role="list" className={`${styles.list} ${styles.timeline}`}>
            {getTimeline(state, event.id, 'staff').filter((t) => t.owner === me.id || t.visibility.includes('staff')).map((t) => (
              <li key={t.id} className={t.owner === me.id ? styles.mineItem : undefined}>
                <span className={styles.shiftWhen}>{formatClock(t.time)}</span><span>{t.done ? <s>{t.title}</s> : t.title}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
      <Incidents eventId={event.id} memberId={me.id} />
      <Button to={`/app/staff/chat?e=${event.id}`}>Team chat</Button>
    </>
  )
}
