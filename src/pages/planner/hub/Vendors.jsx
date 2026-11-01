// =====================================================================
// Event Hub › Logistics › Vendors (PL-4.10, VN-1 to VN-8, planner side).
// Add vendors from the directory (sends their magic-link page), and see
// for each one: status, contract, money, arrival time and insurance (COI).
// COI missing or expiring before the event = red flag + reminder.
// Unacknowledged changes = yellow badge. A vendor who cancels shows who
// else in that category is free on the date. After the event: rate them
// privately and share photos of their work.
// Adding and editing needs "Edit vendors"; amounts need "See event budgets".
// =====================================================================
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { can, formatClock, getEventVendors, vendorAlternatives, vendorHistory } from '../../../store/selectors'
import { MANUAL_PAYMENT_METHODS } from '../../../data/seed'
import { formatDayShort, formatDateTime } from '../../../lib/clock'
import { formatMoney } from '../../../lib/money'
import { dollarsToCents } from '../../../lib/validate'
import { Button, Card, ConfirmDialog, Dialog, EmptyState, Field, Stars, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

const COI = {
  ok: ['success', 'COI on file'], soon: ['warning', 'COI expires soon'],
  expires: ['danger', 'COI expires before the event'], missing: ['danger', 'COI missing'],
}
const STATUS = { invited: ['warning', 'Invited'], confirmed: ['success', 'Confirmed'], cancelled: ['danger', 'Cancelled'] }

function PayDialog({ ev, onClose }) {
  const { dispatch } = useStore()
  const [amount, setAmount] = useState((ev.balanceCents / 100).toFixed(2))
  const [method, setMethod] = useState('In the app (ACH)')
  const cents = dollarsToCents(amount) || 0
  return (
    <Dialog open title={`Record a payment to ${ev.vendor.name}`} onClose={onClose}
      actions={<Button variant="primary" disabled={!cents} onClick={() => { dispatch({ type: 'eventVendor/recordPayment', id: ev.id, amountCents: cents, method }); onClose() }}>Record {cents ? formatMoney(cents) : 'payment'}</Button>}>
      <div className="stack">
        <Field label="Amount ($)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Field label="Paid by" as="select" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="In the app (ACH)">Pay in the app (ACH to their bank)</option>
          {[...MANUAL_PAYMENT_METHODS, 'Bank transfer'].map((m) => <option key={m}>{m}</option>)}
        </Field>
        <p className="muted">{method === 'In the app (ACH)' ? `Sent to ${ev.vendor.payout || 'their bank on file'}; arrives in 1–2 business days. ` : 'Records a payment you made outside the app. '}{ev.vendor.name} gets a receipt.</p>
      </div>
    </Dialog>
  )
}

function RateForm({ ev }) {
  const { dispatch } = useStore()
  const [n, setN] = useState(ev.rating?.stars ?? 5)
  const [note, setNote] = useState(ev.rating?.note ?? '')
  return (
    <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'vendor/rate', eventVendorId: ev.id, stars: Number(n), note }) }}>
      <Field label="Rating (private)" as="select" value={n} onChange={(e) => setN(e.target.value)}>
        {[5, 4, 3, 2, 1].map((x) => <option key={x} value={x}>{x} star{x > 1 ? 's' : ''}</option>)}
      </Field>
      <Field label="Note for your team" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit">Save rating</Button>
    </form>
  )
}

function VendorCard({ ev, event, edit, money }) {
  const { state, dispatch } = useStore()
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const past = ['closed', 'wrap_up'].includes(event.status)
  const alternatives = ev.status === 'cancelled' ? vendorAlternatives(state, ev.id) : []
  const contract = ev.hasDoc('contract') ? 'On file' : 'Not uploaded'
  const thread = state.threads.find((t) => t.eventVendorId === ev.id)

  return (
    <li className={styles.vendor}>
      <div className={styles.vendorHead}>
        <div>
          <span className={styles.vendorName}>{ev.vendor.name}</span>
          <span className={styles.subline}>{ev.vendor.category} · {ev.vendor.contact} · {ev.vendor.phone}</span>
        </div>
        <div className={styles.flags}>
          <StatusChip tone={STATUS[ev.status][0]} label={STATUS[ev.status][1]} />
          {ev.status !== 'cancelled' && <StatusChip tone={COI[ev.coi][0]} label={COI[ev.coi][1]} />}
          {ev.unacked.length > 0 && <StatusChip tone="warning" label={`${ev.unacked.length} change${ev.unacked.length > 1 ? 's' : ''} not acknowledged`} />}
          {ev.arrivedAt && <StatusChip tone="success" label={`Arrived ${formatDateTime(ev.arrivedAt).split(', ')[1]}`} />}
        </div>
      </div>

      <dl className={styles.vendorFacts}>
        <div><dt>Arrival</dt><dd>{ev.arrival ? formatClock(ev.arrival) : '–'}{ev.area && <span className={styles.subline}>{ev.area}</span>}</dd></div>
        <div><dt>Contract</dt><dd>{contract}</dd></div>
        {money && <div><dt>Payment</dt><dd>{formatMoney(ev.paidCents)} of {formatMoney(ev.amountCents)}<span className={styles.subline}>{ev.balanceCents ? `${formatMoney(ev.balanceCents)} due ${formatDayShort(ev.dueDate)}` : 'Paid in full'}</span></dd></div>}
        <div><dt>Insurance (COI)</dt><dd>{ev.vendor.coiExpiresOn ? `Valid to ${formatDayShort(ev.vendor.coiExpiresOn)}` : 'None on file'}</dd></div>
      </dl>
      {ev.notes && <p className={styles.roNotes}>{ev.notes}</p>}
      {ev.unacked.map((c) => <p key={c.id} className="muted">Waiting on: “{c.text}”{c.pastCutoff && ' · past their cutoff'}</p>)}

      {ev.status === 'cancelled' && (
        <div className="stack">
          <p className={styles.error}>Cancelled {formatDayShort(ev.cancelledAt)}{ev.cancelReason && `: ${ev.cancelReason}`}.</p>
          {alternatives.length === 0
            ? <p className="muted">No one else in {ev.vendor.category} is free that day. <Link to="/app/settings/vendors">Add a vendor to your directory</Link>.</p>
            : (
              <ul role="list" className={styles.rows} aria-label={`Other ${ev.vendor.category} vendors free on ${formatDayShort(event.date)}`}>
                {alternatives.map((v) => (
                  <li key={v.id}>
                    <span><strong>{v.name}</strong> · {v.rates}{v.rating && <> · <Stars n={v.rating} /></>}</span>
                    {edit && <Button size="small" variant="primary" onClick={() => dispatch({ type: 'eventVendor/replace', id: ev.id, vendorId: v.id })}>Book {v.name}</Button>}
                  </li>
                ))}
              </ul>
            )}
        </div>
      )}

      {past && ev.status === 'confirmed' && edit && (
        <div className="stack">
          <RateForm ev={ev} />
          {ev.photosSharedAt ? <p className="muted">Photos shared {formatDayShort(ev.photosSharedAt)}.</p>
            : <Button size="small" onClick={() => dispatch({ type: 'eventVendor/sharePhotos', id: ev.id })}>Share photos of their work</Button>}
        </div>
      )}

      {ev.status !== 'cancelled' && (
        <div className="cluster">
          <Button size="small" to={`/v/${ev.token}`}>Open their page</Button>
          {thread && <Button size="small" to={`/app/events/${event.id}/messages?t=${thread.id}`}>Message</Button>}
          {edit && !past && (ev.coi === 'missing' || ev.coi === 'expires') && <Button size="small" onClick={() => dispatch({ type: 'eventVendor/remindCoi', id: ev.id })}>Send COI reminder</Button>}
          {edit && ev.unacked.length > 0 && <Button size="small" onClick={() => dispatch({ type: 'eventVendor/remindAck', id: ev.id })}>Remind to acknowledge</Button>}
          {edit && money && ev.balanceCents > 0 && <Button size="small" onClick={() => setPaying(true)}>Record payment</Button>}
          {edit && !past && <Button size="small" variant="danger" onClick={() => setCancelling(true)}>Vendor cancelled</Button>}
        </div>
      )}

      {paying && <PayDialog ev={ev} onClose={() => setPaying(false)} />}
      <ConfirmDialog open={cancelling} title={`Mark ${ev.vendor.name} as cancelled?`} confirmLabel="Mark as cancelled"
        onCancel={() => setCancelling(false)}
        onConfirm={() => { dispatch({ type: 'eventVendor/cancel', id: ev.id, by: 'planner' }); setCancelling(false) }}>
        You&apos;ll see who else in {ev.vendor.category} is free on {formatDayShort(event.date)}. Their timeline items stay until you book a replacement.
      </ConfirmDialog>
    </li>
  )
}

function AddVendor({ event, onAdded }) {
  const { state, dispatch } = useStore()
  const booked = new Set(state.eventVendors.filter((x) => x.eventId === event.id && x.status !== 'cancelled').map((x) => x.vendorId))
  const choices = state.vendors.filter((v) => !booked.has(v.id))
  const [vendorId, setVendorId] = useState(choices[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [arrival, setArrival] = useState('')
  const [area, setArea] = useState('')
  const [notes, setNotes] = useState('')
  const vendor = state.vendors.find((v) => v.id === vendorId)
  const history = vendor ? vendorHistory(state, vendor.id) : []
  if (!choices.length) return <p className="muted">Everyone in your directory is on this event. <Link to="/app/settings/vendors">Add a vendor</Link>.</p>

  const add = (e) => {
    e.preventDefault()
    dispatch({ type: 'eventVendor/add', eventId: event.id, vendorId, amountCents: dollarsToCents(amount) || 0, arrival, area, notes })
    setAmount(''); setArrival(''); setArea(''); setNotes('')
    onAdded?.()
  }
  return (
    <form onSubmit={add} className="stack">
      <Field label="Vendor" as="select" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
        {choices.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.category})</option>)}
      </Field>
      {vendor && (
        <p className="muted">
          {vendor.rates}{vendor.rating ? <> · <Stars n={vendor.rating} /></> : ''} · {history.length ? `${history.length} past event${history.length > 1 ? 's' : ''} with you` : 'New to you'} · {vendor.contact}, {vendor.email}
        </p>
      )}
      <div className={styles.grid2}>
        <Field label="Their price ($)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} hint="Your cost. Never shown to the client." />
        <Field label="Arrival time" type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} />
      </div>
      <Field label="Their area at the venue" value={area} onChange={(e) => setArea(e.target.value)} />
      <Field label="Notes they'll see" as="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="submit" variant="primary">Add and send their link</Button>
    </form>
  )
}

export default function Vendors() {
  const { event } = useOutletContext()
  const { state } = useStore()
  const [adding, setAdding] = useState(false)
  const rows = getEventVendors(state, event.id)
  const edit = can(state, 'edit_vendors')
  const money = can(state, 'see_budgets')
  const live = rows.filter((r) => r.status !== 'cancelled')

  return (
    <div className="stack">
      <Card title={`Vendors · ${live.filter((r) => r.status === 'confirmed').length} of ${live.length} confirmed`}
        action={edit && !['closed', 'cancelled'].includes(event.status) && <Button size="small" variant="primary" onClick={() => setAdding(true)}>Add a vendor</Button>}>
        {rows.length === 0
          ? <EmptyState title="No vendors yet">Add caterers, DJs, florists and more from your directory. Each one gets a private page with only their part of the event.</EmptyState>
          : <ul role="list" className={styles.vendorList}>{rows.map((ev) => <VendorCard key={ev.id} ev={ev} event={event} edit={edit} money={money} />)}</ul>}
        <p className="muted">Vendors never see the client&apos;s price, other vendors&apos; costs or guest contact details. Insurance reminders go out 30 and 7 days before the event. <Link to="/app/settings/vendors">Vendor directory</Link></p>
      </Card>

      <Dialog open={adding} title="Add a vendor" onClose={() => setAdding(false)} wide>
        {adding && <AddVendor event={event} onAdded={() => setAdding(false)} />}
      </Dialog>
    </div>
  )
}
