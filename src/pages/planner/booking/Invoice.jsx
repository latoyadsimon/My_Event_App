// =====================================================================
// Invoice (PL-3.5): the payment schedule, what's been paid, and the tools
// around it: send a reminder, record a cash/check/Venmo/Zelle/Cash App
// payment, refund or credit, and the invoice's options.
// Card payments are only ever marked paid by Stripe/Square (webhooks),
// never by this screen; manual methods are recorded by the planner.
// =====================================================================
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getInvoice, getEvent, getClient, invoiceTotals, installmentStatus } from '../../../store/selectors'
import { MANUAL_PAYMENT_METHODS } from '../../../data/seed'
import { formatMoney } from '../../../lib/money'
import { formatDayShort, formatDateTime } from '../../../lib/clock'
import { dollarsToCents } from '../../../lib/validate'
import { Button, Card, Dialog, Field, Notice, PageHeader, StatusChip } from '../../../components/ui'
import NotFound from '../../shared/NotFound'
import styles from './booking.module.css'

function RecordPayment({ invoice, open, onClose }) {
  const { dispatch } = useStore()
  const unpaid = invoice.installments.filter((p) => !p.paidAt)
  const [installmentId, setInstallmentId] = useState(unpaid[0]?.id ?? '')
  const [method, setMethod] = useState('Check')
  const chosen = unpaid.find((p) => p.id === installmentId) ?? unpaid[0]
  return (
    <Dialog open={open} title="Record a payment" onClose={onClose}
      actions={<Button variant="primary" disabled={!chosen} onClick={() => { dispatch({ type: 'payment/recordManual', invoiceId: invoice.id, installmentId: chosen.id, method }); onClose() }}>
        Record {chosen ? formatMoney(chosen.amountCents) : ''}
      </Button>}>
      <p className="muted">For money you received outside Crowned. The client gets a receipt.</p>
      <Field label="Which payment" as="select" value={chosen?.id ?? ''} onChange={(e) => setInstallmentId(e.target.value)}>
        {unpaid.map((p) => <option key={p.id} value={p.id}>{p.label} · {formatMoney(p.amountCents)} · due {formatDayShort(p.dueDate)}</option>)}
      </Field>
      <Field label="Paid with" as="select" value={method} onChange={(e) => setMethod(e.target.value)}>
        {MANUAL_PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
      </Field>
    </Dialog>
  )
}

function Refund({ invoice, maxCents, open, onClose }) {
  const { dispatch } = useStore()
  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState('refund')
  const [reason, setReason] = useState('')
  const cents = dollarsToCents(amount)
  const error = amount && (Number.isNaN(cents) || cents <= 0) ? 'Please enter an amount, like 250.'
    : cents > maxCents ? `You can refund up to ${formatMoney(maxCents)} (what's been paid).` : undefined
  return (
    <Dialog open={open} title="Refund or credit" onClose={onClose}
      actions={<Button variant="primary" disabled={!amount || Boolean(error)} onClick={() => { dispatch({ type: 'invoice/refund', invoiceId: invoice.id, amountCents: cents, kind, reason }); onClose() }}>Record {kind}</Button>}>
      <Field label="Type" as="select" value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="refund">Refund (money back to the client)</option>
        <option value="credit">Credit (toward a future payment)</option>
      </Field>
      <Field label="Amount ($)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={error} />
      <Field label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
    </Dialog>
  )
}

export default function Invoice() {
  const { invoiceId } = useParams()
  const { state, dispatch } = useStore()
  const [recording, setRecording] = useState(false)
  const [refunding, setRefunding] = useState(false)
  const invoice = getInvoice(state, invoiceId)
  if (!invoice) return <NotFound what="invoice" />
  const event = getEvent(state, invoice.eventId)
  const client = getClient(state, event.clientId)
  const totals = invoiceTotals(invoice)
  const connected = Boolean(state.business.paymentProvider)
  const paidList = invoice.installments.filter((p) => p.paidAt)
  const option = (key) => (e) => dispatch({ type: 'invoice/setOption', invoiceId: invoice.id, key, value: e.target.checked })

  return (
    <>
      <Link to={`/app/events/${event.id}/money`} className={styles.crumb}>← {event.name}</Link>
      <PageHeader title={`Invoice #${invoice.number}`} sub={`${event.name} · ${client.name}`} actions={<StatusChip kind="money" status={totals.status} />} />

      {!connected && (
        <Notice tone="warning" action={<Button size="small" variant="primary" to="/app/settings/payments">Connect Stripe</Button>}>
          Payments not connected: only cash and check payments can be recorded.
        </Notice>
      )}

      <div className={styles.invoiceGrid}>
        <Card title="Payment schedule">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th scope="col">Payment</th><th scope="col">Due</th><th scope="col" className={styles.num}>Amount</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {invoice.installments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.label}</td>
                    <td>{formatDayShort(p.dueDate)}</td>
                    <td className={styles.num}>{formatMoney(p.amountCents)}</td>
                    <td><StatusChip kind="money" status={installmentStatus(p)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Totals">
          <dl className={styles.totals}>
            <div><dt>Total</dt><dd>{formatMoney(totals.totalCents)}</dd></div>
            <div><dt>Paid</dt><dd>{formatMoney(totals.paidCents)}</dd></div>
            {totals.refundedCents > 0 && <div><dt>Refunded / credited</dt><dd>−{formatMoney(totals.refundedCents)}</dd></div>}
            <div className={styles.grand}><dt>Balance</dt><dd>{formatMoney(totals.balanceCents)}</dd></div>
          </dl>
          <div className={styles.stackButtons}>
            {totals.balanceCents > 0 && <Button onClick={() => dispatch({ type: 'invoice/sendReminder', invoiceId: invoice.id })}>Send reminder</Button>}
            {totals.balanceCents > 0 && <Button variant="primary" onClick={() => setRecording(true)}>Record payment</Button>}
            {totals.paidCents - totals.refundedCents > 0 && <Button onClick={() => setRefunding(true)}>Refund / credit</Button>}
          </div>
        </Card>
      </div>

      <Card title="Payments received">
        {paidList.length === 0 && invoice.refunds.length === 0
          ? <p className="muted">Nothing yet.</p>
          : (
            <ul role="list" className={styles.rows}>
              {paidList.map((p) => <li key={p.id}><span>{formatDateTime(p.paidAt)}</span><span>{p.method ?? 'Card'} · {formatMoney(p.amountCents)} · {p.label}</span><span className="muted">receipt sent ✓</span></li>)}
              {invoice.refunds.map((r) => <li key={r.id}><span>{formatDateTime(r.at)}</span><span>{r.kind === 'credit' ? 'Credit' : 'Refund'} · −{formatMoney(r.amountCents)}{r.reason ? ` · ${r.reason}` : ''}</span></li>)}
            </ul>
          )}
        <p className="muted">Record cash, check, Venmo, Zelle or Cash App with <strong>Record payment</strong>. Card payments appear here on their own.</p>
        {invoice.failedAttempts > 0 && <Notice tone="warning">{invoice.failedAttempts} failed card attempt{invoice.failedAttempts > 1 ? 's' : ''} on this invoice. Nothing was charged.</Notice>}
      </Card>

      <Card title="Options">
        <div className={styles.options}>
          <label className={styles.check}><input type="checkbox" checked={invoice.options.autopay} onChange={option('autopay')} /> Client autopay on</label>
          <label className={styles.check}><input type="checkbox" checked={invoice.options.passCardFee} onChange={option('passCardFee')} /> Pass the card fee (2.9% + 30¢) to the client</label>
          <label className={styles.check}>
            <input type="checkbox" checked={invoice.options.lateFee} onChange={option('lateFee')} disabled={!state.business.contractTerms.lateFee} />
            Late fee ({state.business.contractTerms.lateFee ? 'your contract allows it' : 'your contract doesn’t allow one'})
          </label>
          <label className={styles.check}><input type="checkbox" checked={invoice.options.remindersPaused} onChange={option('remindersPaused')} /> Pause automatic reminders</label>
        </div>
        <p className="muted">{invoice.options.remindersPaused ? 'Automatic reminders are paused.' : 'Reminders go out 7 days and 1 day before each due date, and 1 and 7 days after a missed one.'}</p>
      </Card>

      <RecordPayment key={`r-${paidList.length}`} invoice={invoice} open={recording} onClose={() => setRecording(false)} />
      <Refund key={`f-${invoice.refunds.length}`} invoice={invoice} maxCents={totals.paidCents - totals.refundedCents} open={refunding} onClose={() => setRefunding(false)} />
    </>
  )
}
