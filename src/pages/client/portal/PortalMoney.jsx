// =====================================================================
// Client portal, money and guests:
//   PortalPayments  CL-4.2 / CL-4.3  balance, schedule, receipts, pay ahead,
//                   autopay, change orders to approve
//   PortalChange    CL-4.4  ask to cancel or postpone (policy + estimate first)
//   PortalGuests    CL-3.4  guest list, CSV import, RSVP stats, co-host
// =====================================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { cancellationQuote, getEventGuests, getInvoiceForEvent, getPortal, guestCounts, installmentStatus, invoiceTotals, nextDue, potluckBoard, volunteerBoard } from '../../../store/selectors'
import { formatMoney } from '../../../lib/money'
import { formatDay, formatDayShort, formatDateTime } from '../../../lib/clock'
import { isEmail } from '../../../lib/validate'
import { AddGuestDialog, ImportDialog } from '../../../components/guests/GuestTools'
import { Button, Card, Dialog, EmptyState, Field, Kpis, Notice, PageHeader, StatusChip } from '../../../components/ui'
import styles from './portal.module.css'

export function PortalPayments() {
  const { state, dispatch } = useStore()
  const { client, event } = getPortal(state)
  const [receipt, setReceipt] = useState(null)
  const invoice = event && getInvoiceForEvent(state, event.id)
  if (!invoice) return <EmptyState title="No payments yet">Your payment schedule appears once you sign your contract.</EmptyState>
  const t = invoiceTotals(invoice)
  const due = nextDue(invoice)
  const percent = Math.round((t.paidCents / t.totalCents) * 100)
  const changeOrders = state.approvals.filter((a) => a.eventId === event.id && a.kind === 'change_order' && a.status === 'pending')

  return (
    <>
      <PageHeader title="Payments" sub={`Invoice #${invoice.number} · ${state.business.name}`} />
      <Card>
        <p className="muted">Balance</p>
        <p className={styles.bigAmount}>{formatMoney(t.balanceCents)}</p>
        <div className={styles.balanceBar} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${percent}% paid`}><span style={{ width: `${percent}%` }} /></div>
        <p className="muted">{formatMoney(t.paidCents)} of {formatMoney(t.totalCents)} paid ({percent}%)</p>
        {due && (
          <div className="cluster">
            <Button variant="primary" to="/portal/pay">Pay {formatMoney(due.amountCents)} now</Button>
            {invoice.installments.filter((p) => !p.paidAt).length > 1 && <Button to="/portal/pay?all=1">Pay full balance ({formatMoney(t.balanceCents)})</Button>}
          </div>
        )}
        <label className={styles.consent}>
          <input type="checkbox" checked={invoice.options.autopay} onChange={(e) => {
            dispatch({ type: 'invoice/setOption', invoiceId: invoice.id, key: 'autopay', value: e.target.checked })
            dispatch({ type: 'toast/show', text: e.target.checked ? 'Autopay on: we’ll charge your card on each due date.' : 'Autopay off' })
          }} />
          <span>Autopay: charge my card on each due date</span>
        </label>
      </Card>

      {changeOrders.length > 0 && (
        <Card title="Change orders to approve">
          {changeOrders.map((a) => (
            <div key={a.id} className={styles.approval}>
              <p><strong>{a.title.replace('Change order: ', '')}</strong> · {formatMoney(a.amountCents)}</p>
              <p className="muted">Added to your final payment if you approve.</p>
              <div className="cluster">
                <Button variant="primary" onClick={() => dispatch({ type: 'approval/decide', approvalId: a.id, decision: 'approved', by: client.name })}>Approve</Button>
                <Button onClick={() => dispatch({ type: 'approval/decide', approvalId: a.id, decision: 'changes', by: client.name, comment: 'Declined' })}>Decline</Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card title="Schedule">
        <ul role="list" className={styles.rows}>
          {invoice.installments.map((p) => (
            <li key={p.id}>
              <span className={styles.snippet}>{p.label} · {formatMoney(p.amountCents)}</span>
              <span className="muted">{p.paidAt ? `Paid ${formatDayShort(p.paidAt)}` : `Due ${formatDayShort(p.dueDate)}`}</span>
              {p.voided ? <StatusChip tone="neutral" label="Voided" /> : <StatusChip kind="money" status={installmentStatus(p)} />}
              {p.paidAt && <button type="button" className="link-button" onClick={() => setReceipt(p)}>Receipt</button>}
            </li>
          ))}
        </ul>
      </Card>
      <p className="muted">Need to change your date or cancel? <Link to="/portal/change-request">See your options</Link>.</p>

      <Dialog open={Boolean(receipt)} title={`Receipt #${invoice.number}-${invoice.installments.indexOf(receipt) + 1}`} onClose={() => setReceipt(null)}
        actions={<Button variant="primary" onClick={() => window.print?.()}>Print or save as PDF</Button>}>
        {receipt && (
          <dl className={styles.facts}>
            <div><dt>Paid to</dt><dd>{state.business.name}</dd></div>
            <div><dt>For</dt><dd>{event.name} · {receipt.label}</dd></div>
            <div><dt>Amount</dt><dd>{formatMoney(receipt.amountCents)}</dd></div>
            <div><dt>Paid</dt><dd>{formatDateTime(receipt.paidAt)} · {receipt.method}</dd></div>
          </dl>
        )}
      </Dialog>
    </>
  )
}

export function PortalChange() {
  const { state, dispatch } = useStore()
  const { client, event } = getPortal(state)
  const [kind, setKind] = useState('postpone')
  const [dates, setDates] = useState(['', ''])
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)
  if (!event) return <EmptyState title="Nothing to change yet">Once your event is booked, you can ask to postpone or cancel here.</EmptyState>
  const q = cancellationQuote(state, event.id)
  const open = state.requests.find((r) => r.eventId === event.id && r.status === 'open')

  if (sent || open) {
    return (
      <>
        <PageHeader title="Cancel or postpone" />
        <Notice tone="info">Your request to {(open ?? { kind }).kind} is with {state.business.name}. They’ll reply within one business day, and nothing changes until you both agree.</Notice>
        <Button to="/portal/messages">Message your planner</Button>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Cancel or postpone" sub={`${event.name} · ${formatDay(event.date)}`} />
      <Card>
        <fieldset className={styles.choice}>
          <legend className="visually-hidden">What would you like to do?</legend>
          <label className={styles.consent}><input type="radio" name="kind" checked={kind === 'postpone'} onChange={() => setKind('postpone')} /> Move to a new date</label>
          <label className={styles.consent}><input type="radio" name="kind" checked={kind === 'cancel'} onChange={() => setKind('cancel')} /> Cancel the event</label>
        </fieldset>
        {kind === 'postpone'
          ? (
            <>
              <p className="muted">Your contract lets you move your date once at no charge, if the new date is open.</p>
              <Field label="First choice" type="date" value={dates[0]} onChange={(e) => setDates([e.target.value, dates[1]])} />
              <Field label="Second choice (optional)" type="date" value={dates[1]} onChange={(e) => setDates([dates[0], e.target.value])} />
            </>
          )
          : (
            <dl className={styles.facts}>
              <div><dt>Days until the event</dt><dd>{q.daysOut}</dd></div>
              <div><dt>Paid so far</dt><dd>{formatMoney(q.paidCents)}</dd></div>
              <div><dt>Your contract</dt><dd>{state.business.contractTerms.cancellation}</dd></div>
              <div><dt>Estimated refund</dt><dd><strong>{formatMoney(q.refundCents)}</strong> ({q.rule.toLowerCase()})</dd></div>
            </dl>
          )}
        <Field label="Anything you’d like your planner to know? (optional)" as="textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
        <p className="muted">This sends a request. {state.business.name} confirms the details{kind === 'cancel' ? ' and the refund' : ''} with you first.</p>
        <Button variant={kind === 'cancel' ? 'danger' : 'primary'} disabled={kind === 'postpone' && !dates[0]}
          onClick={() => { dispatch({ type: 'request/submit', eventId: event.id, kind, dates: dates.filter(Boolean), reason, by: client.name }); setSent(true) }}>
          Send request to {kind}
        </Button>
      </Card>
    </>
  )
}

function CoHostDialog({ open, onClose, client }) {
  const { dispatch } = useStore()
  const [v, setV] = useState({ name: client.partner ?? '', email: '', access: 'full' })
  const [error, setError] = useState(null)
  return (
    <Dialog open={open} title="Invite a co-host" onClose={onClose}
      actions={<Button variant="primary" onClick={() => {
        if (!v.name.trim() || !isEmail(v.email)) { setError('Please enter their name and a full email address.'); return }
        dispatch({ type: 'client/inviteCoHost', clientId: client.id, ...v }); onClose()
      }}>Send invite</Button>}>
      <p className="muted">A partner or parent can help plan. No password needed.</p>
      <Field label="Name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      <Field label="Email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} error={error} />
      <Field label="Access" as="select" value={v.access} onChange={(e) => setV({ ...v, access: e.target.value })}>
        <option value="full">Same as me</option>
        <option value="limited">Guests and messages only (no payments)</option>
      </Field>
    </Dialog>
  )
}

export function PortalGuests() {
  const { state } = useStore()
  const { client, event } = getPortal(state)
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const [cohost, setCohost] = useState(false)
  if (!event) return null
  const list = getEventGuests(state, event.id)
  const c = guestCounts(list)
  const locked = event.headcount?.lockedAt

  return (
    <>
      <PageHeader title="Guests" sub={event.site?.rsvpCutoff ? `RSVPs close ${formatDayShort(event.site.rsvpCutoff)}` : undefined}
        actions={<Button onClick={() => setCohost(true)}>Invite co-host</Button>} />
      {client.coHosts?.length > 0 && <p className="muted">Co-hosts: {client.coHosts.map((h) => `${h.name} (${h.access === 'full' ? 'full access' : 'guests and messages'})`).join(', ')}</p>}
      {locked && <Notice tone="info">The final headcount ({event.headcount.count}) is locked, so the list can’t change now. Message your planner for changes.</Notice>}
      <Kpis label="RSVPs" items={[
        { label: 'attending', value: c.attending, note: 'people' },
        { label: 'declined', value: c.declined },
        { label: 'maybe', value: c.maybe },
        { label: 'no reply', value: c.noReply },
      ]} />
      <div className="cluster">
        <Button variant="primary" onClick={() => setAdding(true)} disabled={Boolean(locked)}>+ Add guest</Button>
        <Button onClick={() => setImporting(true)} disabled={Boolean(locked)}>Import CSV</Button>
      </div>
      {list.length === 0
        ? <EmptyState title="No guests yet">Add your guests here, or import a spreadsheet. Your planner sends the invitations.</EmptyState>
        : (
          <Card title={`Households (${list.length}) · ${c.invitedPeople} invited`}>
            <ul role="list" className={styles.rows}>
              {list.map((g) => (
                <li key={g.id}>
                  <strong className={styles.snippet}>{g.name}{g.plusOnes ? ` (+${g.plusOnes})` : ''}</strong>
                  {g.allergies && <span className="muted">⚠ {g.allergies}</span>}
                  {g.rsvp
                    ? <StatusChip tone={g.rsvp === 'attending' ? 'success' : g.rsvp === 'maybe' ? 'warning' : 'neutral'} label={g.rsvp === 'attending' ? `Attending · ${g.attending}` : g.rsvp === 'maybe' ? 'Maybe' : 'Declined'} />
                    : <span className="muted">{g.invite === 'not_sent' ? 'Not invited yet' : 'No reply yet'}</span>}
                </li>
              ))}
            </ul>
          </Card>
        )}
      {event.potluck?.enabled && <PotluckTotals event={event} />}
      <AddGuestDialog open={adding} onClose={() => setAdding(false)} eventId={event.id} addedBy="client" />
      <ImportDialog open={importing} onClose={() => setImporting(false)} eventId={event.id} addedBy="client" />
      {cohost && <CoHostDialog open onClose={() => setCohost(false)} client={client} />}
    </>
  )
}

/** CL-3.8 (P2): what's covered at the potluck, by category, and who's helping. */
function PotluckTotals({ event }) {
  const { state } = useStore()
  const board = potluckBoard(state, event.id)
  const slots = event.volunteer?.enabled ? volunteerBoard(state, event.id) : []
  return (
    <Card title={`Potluck · ${board.total} of ${board.needed} dishes`}>
      <ul role="list" className={styles.rows}>
        {board.categories.map((c) => (
          <li key={c.id}>
            <strong className={styles.snippet}>{c.name}</strong>
            <span>{c.filled} of {c.target}</span>
            {c.short ? <StatusChip tone="warning" label={`${c.short} more needed`} /> : <StatusChip tone="success" label="Covered" />}
            <span className="muted">{c.dishes.map((d) => d.dish).join(', ')}</span>
          </li>
        ))}
      </ul>
      {slots.length > 0 && <p className="muted">Volunteers: {slots.map((s) => `${s.name} ${s.filled}/${s.needed}`).join(' · ')}</p>}
      <Button to={`/e/${event.id}/potluck?preview=1`}>See the sign-up page</Button>
    </Card>
  )
}
