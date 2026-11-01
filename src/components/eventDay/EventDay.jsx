// =====================================================================
// Event-day building blocks, shared by the planner's Day-of Mode and the
// staff app's Day-of view (big tap targets, phone first):
//   <OfflineBanner />                     clear "you're offline" notice (NFR-4)
//   <CheckIn eventId by />                door check-in: search/scan, walk-ins, live count
//   <Incidents eventId memberId />        log incidents with photos (append-only)
//   <GearReturn eventId />                scan gear back in; teardown done lists what's missing
//   <NowNext eventId memberId />          now / next, tap to mark done, "Running late"
//   <Arrivals eventId />                  vendors due, with "Mark arrived"
//   <LivePanel eventId />                 checked in, vendors arrived, incidents, on-site sales
// =====================================================================
import { useEffect, useState } from 'react'
import { useStore } from '../../store/StoreContext'
import { checkInCode, checkInCounts, findGuests, formatClock, getEventVendors, getIncidents, livePanel, nowNext, ownerLabel, packList } from '../../store/selectors'
import { formatMoney } from '../../lib/money'
import { formatDateTime, formatTime } from '../../lib/clock'
import { Button, Card, ConfirmDialog, Field, Notice, StatusChip } from '../ui'
import styles from './eventDay.module.css'

/** True while the browser says it's online. */
function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return <Notice tone="warning">You&apos;re offline. Everything you do is saved on this phone and syncs when you&apos;re back online.</Notice>
}

function GuestRow({ guest, by }) {
  const { dispatch } = useStore()
  const [people, setPeople] = useState(String(guest.attending || 1))
  return (
    <li className={styles.guest}>
      <div>
        <strong>{guest.name}</strong>
        <span className={styles.sub}>
          {checkInCode(guest)} · {guest.rsvp === 'attending' ? `RSVP: ${guest.attending}` : guest.rsvp === 'declined' ? 'Said no' : 'No RSVP'}
          {guest.allergies && <> · <span className={styles.allergy}>{guest.allergies}</span></>}
        </span>
      </div>
      {guest.checkedIn
        ? <StatusChip tone="success" label={`In · ${guest.checkedIn} at ${formatTime(guest.checkedInAt)}`} />
        : (
          <form className={styles.inline} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'guest/checkIn', guestId: guest.id, people, by }) }}>
            <label className={styles.people}>
              <span className="visually-hidden">People in {guest.name}&apos;s party</span>
              <select value={people} onChange={(e) => setPeople(e.target.value)}>
                {Array.from({ length: Math.max(1, (guest.plusOnes ?? 0) + 1) }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <Button type="submit" variant="primary">Check in</Button>
          </form>
        )}
    </li>
  )
}

export function CheckIn({ eventId, by }) {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const [walk, setWalk] = useState({ name: '', people: '1' })
  const counts = checkInCounts(state, eventId)
  const results = findGuests(state, eventId, q)
  return (
    <div className="stack">
      <div className={styles.count} aria-live="polite">
        <span className={styles.countBig}>{counts.checkedIn}</span>
        <span>of {counts.expected} expected are here{counts.walkIns ? ` · ${counts.walkIns} walk-in${counts.walkIns > 1 ? 's' : ''}` : ''}</span>
      </div>
      <Card title="Find a guest">
        <Field label="Name or check-in code" value={q} onChange={(e) => setQ(e.target.value)} hint="Scan the QR on their invitation, or type a name" autoComplete="off" />
        {q.trim() && (results.length === 0
          ? <p className="muted">No one by that name. Add them as a walk-in below.</p>
          : <ul role="list" className={styles.list} aria-label="Matching guests">{results.map((g) => <GuestRow key={g.id} guest={g} by={by} />)}</ul>)}
      </Card>
      <Card title="Walk-in">
        <form className={styles.inline} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'guest/walkIn', eventId, ...walk }); setWalk({ name: '', people: '1' }) }}>
          <Field label="Name" value={walk.name} onChange={(e) => setWalk({ ...walk, name: e.target.value })} />
          <Field label="People" type="number" min="1" value={walk.people} onChange={(e) => setWalk({ ...walk, people: e.target.value })} />
          <Button type="submit" disabled={!walk.name.trim()}>Add walk-in</Button>
        </form>
      </Card>
    </div>
  )
}

export function Incidents({ eventId, memberId }) {
  const { state, dispatch } = useStore()
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const list = getIncidents(state, eventId)
  const log = (e) => {
    e.preventDefault()
    dispatch({ type: 'incident/log', eventId, memberId, text, photos })
    setText(''); setPhotos([]); e.target.reset()
  }
  return (
    <Card title={`Incident log${list.length ? ` (${list.length})` : ''}`}>
      <form className="stack" onSubmit={log}>
        <Field label="What happened?" as="textarea" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
        <Field label="Photos" type="file" accept="image/*" multiple onChange={(e) => setPhotos([...(e.target.files ?? [])].map((f) => f.name))} />
        <Button type="submit" disabled={!text.trim()}>Log incident</Button>
      </form>
      {list.length > 0 && (
        <ul role="list" className={styles.list}>
          {list.map((x) => (
            <li key={x.id}><span><strong>{formatDateTime(x.at)}</strong> · {x.by}<span className={styles.sub}>{x.text}{x.photos.length ? ` · ${x.photos.length} photo${x.photos.length > 1 ? 's' : ''}` : ''}</span></span></li>
          ))}
        </ul>
      )}
      <p className="muted">Kept for your insurance records. Works offline.</p>
    </Card>
  )
}

export function GearReturn({ eventId }) {
  const { state, dispatch } = useStore()
  const [code, setCode] = useState('')
  const [asking, setAsking] = useState(false)
  const event = state.events.find((e) => e.id === eventId)
  const { rows } = packList(state, eventId)
  const back = rows.filter((r) => r.status === 'returned')
  const notBack = rows.filter((r) => r.status !== 'returned')
  if (event.teardownAt) {
    const missing = rows.filter((r) => r.status === 'missing')
    return (
      <Card title="Teardown done">
        <p>{formatDateTime(event.teardownAt)}. {missing.length ? `Missing: ${missing.map((r) => r.name).join(', ')}.` : 'All gear checked in.'}</p>
      </Card>
    )
  }
  return (
    <Card title={`Teardown gear check · ${back.length} of ${rows.length} back`}>
      <form className={styles.inline} onSubmit={(e) => { e.preventDefault(); if (code.trim()) dispatch({ type: 'pack/scanIn', eventId, code }); setCode('') }}>
        <Field label="Scan a label back in" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" />
        <Button type="submit">Check in</Button>
      </form>
      {notBack.length > 0 && (
        <ul role="list" className={styles.list} aria-label="Not checked in yet">
          {notBack.map((r) => (
            <li key={r.key}>
              <span>{r.qty > 1 ? `${r.qty} × ` : ''}{r.name}<span className={styles.sub}>{r.label || r.group}</span></span>
              <Button size="small" onClick={() => dispatch({ type: 'pack/scanIn', eventId, code: r.key })} aria-label={`${r.name} is back`}>Back</Button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="primary" onClick={() => setAsking(true)}>Mark teardown done</Button>
      <ConfirmDialog open={asking} danger={notBack.length > 0} title="Mark teardown done?" confirmLabel={notBack.length ? `Report ${notBack.length} missing and finish` : 'Finish teardown'}
        onCancel={() => setAsking(false)} onConfirm={() => { dispatch({ type: 'event/teardownDone', eventId }); setAsking(false) }}>
        {notBack.length
          ? <>These aren&apos;t checked in yet and will be reported missing: <strong>{notBack.map((r) => r.name).join(', ')}</strong>.</>
          : 'Everything is checked in.'}
      </ConfirmDialog>
    </Card>
  )
}

export function NowNext({ eventId, memberId, canDelay = true }) {
  const { state, dispatch } = useStore()
  const { items, now, next, doneCount } = nowNext(state, eventId)
  if (!items.length) return <Notice>No run of show for this event yet.</Notice>
  return (
    <div className="stack">
      {now
        ? (
          <section className={styles.now} aria-label="Now">
            <span className={styles.label}>Now · {formatClock(now.time)}</span>
            <span className={styles.nowTitle}>{now.title}</span>
            <span className={styles.nowMeta}>{ownerLabel(state, now.owner)}{now.location && ` · ${now.location}`}{now.notes && ` · Cue: ${now.notes}`}</span>
            <Button variant="primary" onClick={() => dispatch({ type: 'timeline/toggleDone', id: now.id })}>Done<span className="visually-hidden">: {now.title}</span></Button>
          </section>
        )
        : <Notice tone="success">Every item is done. ({doneCount} of {items.length})</Notice>}
      {next && (
        <section className={styles.next} aria-label="Next">
          <span className={styles.sub}>Next · {formatClock(next.time)}</span>
          <span className={styles.nextTitle}>{next.title}</span>
          <span className={styles.sub}>{ownerLabel(state, next.owner)}{next.location && ` · ${next.location}`}</span>
        </section>
      )}
      {now && canDelay && (
        <div>
          <p className={styles.sub}>Running late? Move “{now.title}” and everything after; the team and affected vendors are told.</p>
          <div className={styles.bigButtons} role="group" aria-label="Running late">
            {[5, 10, 15, 30].map((m) => <Button key={m} onClick={() => dispatch({ type: 'timeline/delay', fromId: now.id, minutes: m, memberId })}>+{m} min</Button>)}
          </div>
        </div>
      )}
      <details>
        <summary className={styles.sub}>Whole timeline ({doneCount} of {items.length} done)</summary>
        <ol role="list" className={`${styles.list} ${styles.timeline}`}>
          {items.map((t) => (
            <li key={t.id}>
              <label className={styles.check}>
                <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'timeline/toggleDone', id: t.id })} />
                <span className={styles.when}>{formatClock(t.time)}</span>
                <span className={t.done ? styles.done : undefined}>{t.title}</span>
              </label>
            </li>
          ))}
        </ol>
      </details>
    </div>
  )
}

export function LivePanel({ eventId, money = true }) {
  const { state } = useStore()
  const p = livePanel(state, eventId)
  const stats = [
    ['Checked in', `${p.checkedIn} / ${p.expected}`],
    ['Vendors arrived', `${p.vendorsArrived} / ${p.vendorsTotal}`],
    ['Incidents', p.incidents],
    ...(money ? [['On-site sales', formatMoney(p.onsiteCents)]] : []),
    ...(p.giving ? [['Raised', formatMoney(p.giving.raisedCents)]] : []),
    ...(p.booth ? [['Photo booth', `${p.booth.sessions} sessions · ${p.booth.prints} prints`]] : []),
    ...(p.karaoke ? [['Karaoke line', `${p.karaoke.waiting} waiting · ${p.karaoke.sung} sung`]] : []),
  ]
  return (
    <dl className={styles.panel} aria-label="Live numbers">
      {stats.map(([label, value]) => <div key={label} className={styles.stat}><dt className={styles.statLabel}>{label}</dt><dd className={styles.statValue}>{value}</dd></div>)}
    </dl>
  )
}

export function Arrivals({ eventId }) {
  const { state, dispatch } = useStore()
  const vendors = getEventVendors(state, eventId).filter((v) => v.status === 'confirmed')
  if (!vendors.length) return null
  return (
    <Card title="Vendor arrivals">
      <ul role="list" className={styles.list}>
        {vendors.map((v) => (
          <li key={v.id}>
            <span><strong>{v.vendor.name}</strong><span className={styles.sub}>Due {v.arrival ? formatClock(v.arrival) : '–'}{v.area && ` · ${v.area}`}</span></span>
            {v.arrivedAt ? <StatusChip tone="success" label={`Here ${formatTime(v.arrivedAt)}`} />
              : <Button size="small" onClick={() => dispatch({ type: 'eventVendor/arrived', id: v.id, by: 'staff' })}>Mark arrived</Button>}
          </li>
        ))}
      </ul>
    </Card>
  )
}
