// =====================================================================
// Portal › Pay (CL-2.4, later CL-4.x): pays the next installment due
// (the deposit while booking). Shows the full schedule. Card, Apple Pay,
// Google Pay or bank (ACH); optional autopay. A double tap never charges
// twice (the button locks, and the store ignores a paid installment).
//
// Demo card numbers (like Stripe's test cards):
//   4242 4242 4242 4242 → succeeds    4000 0000 0000 0002 → declined
// When payments aren't connected, only check/cash instructions show.
// =====================================================================
import { useEffect, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getBookingStep, getPortal, getInvoiceForEvent, nextDue, installmentStatus } from '../../../store/selectors'
import { formatMoney } from '../../../lib/money'
import { formatDayShort, nowStamp } from '../../../lib/clock'
import { BookingSteps } from '../../../components/booking/Booking'
import { Button, Card, Field, Icon, Notice, PageHeader, StatusChip } from '../../../components/ui'
import styles from './portal.module.css'

const METHODS = [['card', 'Card'], ['apple', 'Apple Pay'], ['google', 'Google Pay'], ['ach', 'Bank (ACH)']]
const DECLINED = '4000000000000002'

export default function PortalPay() {
  const { state, dispatch } = useStore()
  const booking = getBookingStep(state)
  const { event, client } = getPortal(state)
  const invoice = event && getInvoiceForEvent(state, event.id)
  const due = nextDue(invoice)
  const [params] = useSearchParams()
  // ?all=1 → pay the full balance (every unpaid payment) in one go (CL-4.2)
  const unpaid = invoice?.installments.filter((p) => !p.paidAt && !p.voided) ?? []
  const payAll = params.get('all') === '1' && unpaid.length > 1
  const amountCents = payAll ? unpaid.reduce((sum, p) => sum + p.amountCents, 0) : due?.amountCents

  const [method, setMethod] = useState('card')
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' })
  const [autopay, setAutopay] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [declined, setDeclined] = useState(false)
  const [paid, setPaid] = useState(null)             // what was just paid, for the success message
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  if (booking.step === 'review' || booking.step === 'sign' || booking.step === 'none') return <Navigate to="/portal/proposal" replace />

  if (paid) {
    return (
      <Card className={styles.success}>
        <span className={styles.successIcon}><Icon name="check" size={24} /></span>
        <h1 className={`display ${styles.successTitle}`}>{paid.isDeposit ? 'Your date is locked!' : 'Payment received'}</h1>
        <p>Paid {formatMoney(paid.amountCents)} with {paid.method}. A receipt is on its way to {client.email}.</p>
        <Button variant="primary" to={paid.isDeposit ? '/portal' : '/portal/payments'}>{paid.isDeposit ? 'Go to your portal →' : 'Back to payments'}</Button>
      </Card>
    )
  }

  if (!due) {
    return (
      <>
        <PageHeader title="Payments" />
        <Notice tone="success">You&apos;re all paid up. Thank you!</Notice>
      </>
    )
  }

  const isDeposit = invoice.installments[0].id === due.id
  const methodLabel = method === 'card' ? `card ending ${card.number.replace(/\D/g, '').slice(-4)}` : METHODS.find(([id]) => id === method)[1]

  const pay = (e) => {
    e.preventDefault()
    if (busy) return
    const found = {}
    if (method === 'card') {
      if (card.number.replace(/\D/g, '').length !== 16) found.number = 'Please enter the 16-digit card number.'
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(card.exp)) found.exp = 'Please use MM / YY, like 08 / 28.'
      if (!/^\d{3,4}$/.test(card.cvc)) found.cvc = 'The 3 digits on the back.'
    }
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    setDeclined(false)
    timer.current = setTimeout(() => {
      setBusy(false)
      if (method === 'card' && card.number.replace(/\D/g, '') === DECLINED) {
        dispatch({ type: 'payment/failed', invoiceId: invoice.id })
        setDeclined(true)
        return
      }
      const label = method === 'card' ? `Visa ·${card.number.replace(/\D/g, '').slice(-4)}` : METHODS.find(([id]) => id === method)[1]
      for (const p of payAll ? unpaid : [due]) dispatch({ type: 'payment/succeeded', invoiceId: invoice.id, installmentId: p.id, method: label, autopay })
      setPaid({ amountCents, method: methodLabel, isDeposit, at: nowStamp() })
    }, 600)
  }

  return (
    <>
      <PageHeader title={isDeposit ? 'Pay your deposit' : payAll ? 'Pay your full balance' : 'Make a payment'} />
      {booking.step === 'pay' && <BookingSteps current="pay" />}

      <Card>
        <p className="muted">{isDeposit ? 'Deposit due today' : payAll ? `Everything left · ${unpaid.length} payments` : `${due.label} · due ${formatDayShort(due.dueDate)}`}</p>
        <p className={styles.bigAmount}>{formatMoney(amountCents)}</p>
        <div className={styles.tableWrap}>
          <table className={styles.schedule}>
            <thead><tr><th scope="col">Payment</th><th scope="col">Due</th><th scope="col" className={styles.num}>Amount</th><th scope="col"><span className="visually-hidden">Status</span></th></tr></thead>
            <tbody>
              {invoice.installments.map((p) => (
                <tr key={p.id} aria-current={p.id === due.id ? 'true' : undefined}>
                  <td>{p.label}</td>
                  <td>{p.paidAt ? 'Paid' : p.id === due.id && isDeposit ? 'Today' : formatDayShort(p.dueDate)}</td>
                  <td className={styles.num}>{formatMoney(p.amountCents)}</td>
                  <td>{p.paidAt ? <StatusChip kind="money" status="paid" /> : installmentStatus(p) === 'overdue' ? <StatusChip kind="money" status="overdue" /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!state.business.paymentProvider
        ? (
          <Card title="How to pay">
            <p>{state.business.name} takes checks and cash for now. Make checks out to <strong>{state.business.name}</strong> and mail or hand them to your planner. They&apos;ll record it, and you&apos;ll get a receipt by email.</p>
            <p className="muted">Questions? {state.business.phone} · {state.business.email}</p>
          </Card>
        )
        : (
          <form className={styles.payForm} onSubmit={pay} noValidate>
            <div className={styles.methods} role="radiogroup" aria-label="Payment method">
              {METHODS.map(([id, label]) => (
                <button key={id} type="button" role="radio" aria-checked={method === id} className={styles.method} onClick={() => { setMethod(id); setDeclined(false) }}>{label}</button>
              ))}
            </div>

            {declined && (
              <Notice tone="danger" action={<><Button size="small" type="submit">Try again</Button><Button size="small" onClick={() => { setMethod('ach'); setDeclined(false) }}>Use another method</Button></>}>
                Your card was declined. Nothing was charged.
              </Notice>
            )}

            {method === 'card'
              ? (
                <div className={styles.cardGrid}>
                  <Field label="Card number" inputMode="numeric" autoComplete="cc-number" value={card.number} error={errors.number}
                    hint="Demo: 4242 4242 4242 4242 works; 4000 0000 0000 0002 is declined."
                    onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) }))} />
                  <Field label="Expiry" placeholder="MM / YY" autoComplete="cc-exp" value={card.exp} error={errors.exp} onChange={(e) => setCard((c) => ({ ...c, exp: e.target.value }))} />
                  <Field label="CVC" inputMode="numeric" autoComplete="cc-csc" value={card.cvc} error={errors.cvc} onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                </div>
              )
              : <p className="muted">{method === 'ach' ? 'You’ll sign in to your bank to approve the transfer.' : `You’ll confirm with ${METHODS.find(([id]) => id === method)[1]} on your device.`}</p>}

            <label className={styles.consent}>
              <input type="checkbox" checked={autopay} onChange={(e) => setAutopay(e.target.checked)} />
              <span>Turn on autopay for future payments</span>
            </label>
            <p className="muted">Your card details go straight to {state.business.paymentProvider === 'square' ? 'Square' : 'Stripe'}. {state.business.name} never sees them.</p>
            <Button type="submit" variant="primary" block busy={busy} busyLabel="Processing…">Pay {formatMoney(amountCents)}</Button>
          </form>
        )}
    </>
  )
}
