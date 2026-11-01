// =====================================================================
// The vendor's pages (VN-1 to VN-8), inside VendorLayout (/v/<token>):
//   VendorSetup      first visit only: company, contacts, COI + expiry, W-9, payout
//   VendorEvent      what changed (acknowledge), confirm, event day (I've arrived),
//                    my timeline, venue + load-in, final numbers, contacts, photos after
//   VendorPaperwork  upload contract / invoice / COI; what they've been paid
//   VendorMessages   their own thread with the planner (the client never sees it)
// Never shown: the client's price, other vendors' costs, guest contact details.
// Caterers see meal counts and allergies (names only where needed).
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { formatClock, getEventGuests, getTimeline, guestCounts } from '../../store/selectors'
import { formatDay, formatDayShort, formatDateTime } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { Button, Card, Field, Icon, Notice, StatusChip } from '../../components/ui'
import Conversation from '../../components/planning/Conversation'
import styles from './vendor.module.css'

const DOC_KINDS = [['contract', 'Contract'], ['invoice', 'Invoice'], ['coi', 'Insurance (COI)']]

/** VN-1: the first visit. Saved to the directory, so the next booking skips this. */
export function VendorSetup({ ev, vendor }) {
  const { dispatch } = useStore()
  const [p, setP] = useState({ contact: vendor.contact ?? '', email: vendor.email ?? '', phone: vendor.phone ?? '', coiExpiresOn: '', coiFile: '', w9File: '', payout: '' })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value })
  const file = (k) => (e) => setP({ ...p, [k]: e.target.files?.[0]?.name ?? '' })
  const save = (e) => {
    e.preventDefault()
    const next = {}
    if (!p.contact.trim()) next.contact = 'Who should we call on the day?'
    if (!p.email.trim() && !p.phone.trim()) next.phone = 'Add a phone or an email.'
    if (!p.coiFile) next.coiFile = 'Upload your certificate of insurance.'
    if (!p.coiExpiresOn) next.coiExpiresOn = 'When does the insurance expire?'
    if (!p.w9File) next.w9File = 'Upload your W-9.'
    if (!p.payout.trim()) next.payout = 'How would you like to be paid?'
    setErrors(next)
    if (Object.keys(next).length) return
    dispatch({ type: 'vendor/setupProfile', id: ev.id, profile: p })
  }
  return (
    <Card title={`Welcome, ${vendor.name}`}>
      <p>No account needed. Add these once and we&apos;ll reuse them for every event with {vendor.name}. Next time, you&apos;ll only be asked for event-specific items.</p>
      <form onSubmit={save} noValidate className="stack">
        <div className={styles.grid2}>
          <Field label="Contact person" value={p.contact} onChange={set('contact')} error={errors.contact} autoComplete="name" />
          <Field label="Phone" type="tel" value={p.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
          <Field label="Email" type="email" value={p.email} onChange={set('email')} autoComplete="email" />
          <Field label="How you'd like to be paid" value={p.payout} onChange={set('payout')} error={errors.payout} hint="Bank transfer, Zelle, check…" />
          <Field label="Certificate of insurance (COI)" type="file" onChange={file('coiFile')} error={errors.coiFile} />
          <Field label="COI expires on" type="date" value={p.coiExpiresOn} onChange={set('coiExpiresOn')} error={errors.coiExpiresOn} />
          <Field label="W-9" type="file" onChange={file('w9File')} error={errors.w9File} />
        </div>
        <Button type="submit" variant="primary">Save and see my event</Button>
      </form>
    </Card>
  )
}

export function VendorEvent() {
  const { ev, event, vendor } = useOutletContext()
  const { state, dispatch } = useStore()
  const items = getTimeline(state, event.id, { vendor: ev.id })
  const counts = guestCounts(getEventGuests(state, event.id))
  const owner = state.team.find((m) => m.role === 'owner')
  const coordinator = state.team.find((m) => m.role === 'coordinator' && m.status === 'active') ?? owner
  const unacked = ev.changes.filter((c) => !c.acknowledgedAt)
  const acked = ev.changes.filter((c) => c.acknowledgedAt)
  const catering = vendor.category === 'Catering'
  const final = event.headcount?.lockedAt
  const photos = ev.photosSharedAt ? state.files.filter((f) => f.eventId === event.id && /\.(jpe?g|png|heic)$/i.test(f.name)) : []

  if (event.status === 'cancelled') return <Notice tone="danger">{event.name} was cancelled. {owner.name.split(' ')[0]} will be in touch about any deposits.</Notice>
  if (ev.status === 'cancelled') return <Notice tone="warning">You&apos;re no longer booked for this event. Questions? Call {state.business.phone}.</Notice>

  return (
    <div className="stack">
      {unacked.length > 0 && (
        <Card title="What changed">
          <ul role="list" className={styles.rows}>
            {unacked.map((c) => (
              <li key={c.id}>
                <span className={styles.when}>{formatDayShort(c.at)}</span>
                <span>{c.text}</span>
                {c.pastCutoff && <StatusChip tone="warning" label="Past your cutoff" />}
              </li>
            ))}
          </ul>
          <Button variant="primary" onClick={() => dispatch({ type: 'eventVendor/acknowledge', id: ev.id })}>Acknowledge</Button>
        </Card>
      )}

      {ev.status === 'invited' && (
        <Card title="Confirm your booking">
          <p>Look over your part below. Upload your contract and invoice in <strong>Paperwork &amp; pay</strong>, then confirm so {owner.name.split(' ')[0]} knows you&apos;re booked.</p>
          <ul role="list" className={styles.rows}>
            {DOC_KINDS.map(([kind, label]) => (
              <li key={kind}><Icon name={ev.docs.some((d) => d.kind === kind) ? 'check' : 'close'} size={16} /> {label} {ev.docs.some((d) => d.kind === kind) ? 'uploaded' : 'not uploaded yet'}</li>
            ))}
          </ul>
          <Button variant="primary" onClick={() => dispatch({ type: 'eventVendor/confirm', id: ev.id })}>Confirm booking</Button>
        </Card>
      )}

      <Card title="Event day">
        <dl className={styles.facts}>
          <div><dt>Arrive</dt><dd>{ev.arrival ? formatClock(ev.arrival) : 'Time to be confirmed'}, {formatDay(event.date)}</dd></div>
          <div><dt>Your area</dt><dd>{ev.area || '–'}</dd></div>
          <div><dt>Load-in</dt><dd>{event.venueInfo?.loadIn || 'Ask your on-site contact'}</dd></div>
          <div><dt>On-site contact</dt><dd>{coordinator.name} · <a href={`tel:${coordinator.phone}`}>{coordinator.phone}</a></dd></div>
        </dl>
        {ev.arrivedAt
          ? <p><Icon name="check" size={16} /> Arrived {formatDateTime(ev.arrivedAt)}</p>
          : <Button variant="primary" onClick={() => dispatch({ type: 'eventVendor/arrived', id: ev.id })}>I&apos;ve arrived</Button>}
      </Card>

      <Card title="Your timeline">
        {items.length === 0
          ? <p className="muted">Nothing on the timeline for you yet.</p>
          : (
            <ol role="list" className={styles.rows}>
              {items.map((t) => (
                <li key={t.id}>
                  <span className={styles.when}>{formatClock(t.time)}</span>
                  <span><strong>{t.title}</strong>{t.location && ` · ${t.location}`}{t.notes && <span className={styles.subline}>{t.notes}</span>}</span>
                </li>
              ))}
            </ol>
          )}
      </Card>

      <div className={styles.grid2}>
        <Card title="Venue">
          <p><strong>{event.venue}</strong>{event.venueInfo?.address && <><br /><span className="muted">{event.venueInfo.address}</span></>}</p>
          {event.venueInfo?.wifi && <p className="muted">Wi-Fi: {event.venueInfo.wifi}</p>}
          {ev.notes && <p>{ev.notes}</p>}
        </Card>
        <Card title={final ? 'Final numbers' : 'Numbers so far'}>
          <p className={styles.big}>{final ? event.headcount.count : counts.attending} guests</p>
          <p className="muted">{final ? `Locked ${formatDayShort(event.headcount.lockedAt)}` : `Not final yet; the planner locks it closer to the day (estimate: ${event.guestCount}).`}</p>
          {catering && Object.keys(counts.meals).length > 0 && (
            <ul role="list" className={`${styles.rows} ${styles.split}`} aria-label="Meals">
              {Object.entries(counts.meals).map(([meal, n]) => <li key={meal}><span>{meal}</span><strong>{n}</strong></li>)}
            </ul>
          )}
          {catering && counts.allergies.length > 0 && (
            <ul role="list" className={`${styles.rows} ${styles.split}`} aria-label="Allergies">
              {counts.allergies.map((g) => <li key={g.id}><span>{g.name}</span><strong className={styles.allergy}>{g.allergies}</strong></li>)}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Contacts">
        <ul role="list" className={`${styles.rows} ${styles.split}`}>
          <li><span>{owner.name} (planner)</span><a href={`tel:${owner.phone}`}>{owner.phone}</a></li>
          {coordinator.id !== owner.id && <li><span>{coordinator.name} (on-site)</span><a href={`tel:${coordinator.phone}`}>{coordinator.phone}</a></li>}
        </ul>
      </Card>

      {photos.length > 0 && (
        <Card title="Photos of your work">
          <ul role="list" className={styles.rows}>{photos.map((f) => <li key={f.id}><Icon name="image" size={16} /> {f.name}</li>)}</ul>
        </Card>
      )}

      {acked.length > 0 && (
        <details className={styles.details}>
          <summary>Changes you&apos;ve acknowledged ({acked.length})</summary>
          <ul role="list" className={styles.rows}>{acked.map((c) => <li key={c.id}><span className={styles.when}>{formatDayShort(c.at)}</span><span>{c.text}</span></li>)}</ul>
        </details>
      )}

      {ev.status === 'confirmed' && !['closed', 'wrap_up'].includes(event.status) && (
        <p className="muted">Can&apos;t make it anymore? <button type="button" className="link-button" onClick={() => dispatch({ type: 'eventVendor/cancel', id: ev.id, by: 'vendor' })}>Tell {owner.name.split(' ')[0]} you need to cancel</button></p>
      )}
    </div>
  )
}

export function VendorPaperwork() {
  const { ev, event } = useOutletContext()
  const { dispatch } = useStore()
  const [kind, setKind] = useState('contract')
  const [name, setName] = useState('')
  const [expires, setExpires] = useState('')
  const paid = ev.payments.reduce((t, p) => t + p.amountCents, 0)
  const upload = (e) => {
    e.preventDefault()
    if (!name) return
    dispatch({ type: 'eventVendor/upload', id: ev.id, kind, name, expiresOn: kind === 'coi' ? expires : undefined })
    setName(''); setExpires('')
    e.target.reset()
  }
  return (
    <div className="stack">
      <Card title="Your documents">
        {ev.docs.length === 0 ? <p className="muted">Nothing uploaded yet.</p> : (
          <ul role="list" className={styles.rows}>
            {ev.docs.map((d) => <li key={d.id}><Icon name="proposal" size={16} /> <span>{d.name}</span><StatusChip tone="neutral" label={DOC_KINDS.find(([k]) => k === d.kind)?.[1] ?? 'W-9'} /><span className="muted">{formatDayShort(d.at)}</span></li>)}
          </ul>
        )}
        <form onSubmit={upload} className="stack">
          <div className={styles.grid2}>
            <Field label="What is it?" as="select" value={kind} onChange={(e) => setKind(e.target.value)}>
              {DOC_KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </Field>
            <Field label="File" type="file" onChange={(e) => setName(e.target.files?.[0]?.name ?? '')} />
            {kind === 'coi' && <Field label="Expires on" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} hint={`Must be valid through ${formatDay(event.date)}`} />}
          </div>
          <Button type="submit" disabled={!name}>Upload</Button>
        </form>
      </Card>

      <Card title="Payments">
        <p className={styles.big}>{formatMoney(paid)} of {formatMoney(ev.amountCents)} paid</p>
        {ev.payments.length === 0
          ? <p className="muted">No payments yet. {ev.amountCents > 0 && `${formatMoney(ev.amountCents)} is due ${formatDayShort(ev.dueDate)}.`}</p>
          : <ul role="list" className={styles.rows}>{ev.payments.map((p) => <li key={p.id}><span className={styles.when}>{formatDayShort(p.at)}</span><span>{formatMoney(p.amountCents)} · {p.method}</span><StatusChip tone="success" label="Receipt sent" /></li>)}</ul>}
      </Card>
    </div>
  )
}

export function VendorMessages() {
  const { ev, vendor } = useOutletContext()
  const { state, dispatch } = useStore()
  const thread = state.threads.find((t) => t.eventVendorId === ev.id) ?? { name: state.business.name, messages: [] }
  return (
    <Card title={`Messages with ${state.business.name}`}>
      <p className="muted">Questions about load-in, power or the menu? Ask here. Only the planner&apos;s team sees this thread.</p>
      <Conversation thread={{ ...thread, name: state.business.name }} me="vendor"
        onSend={(text, attachment) => dispatch({ type: 'thread/postVendor', eventVendorId: ev.id, text, attachment, author: vendor.name })} />
    </Card>
  )
}
