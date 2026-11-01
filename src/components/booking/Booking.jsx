// =====================================================================
// Pieces shared by the client's booking flow and the planner's Contract:
//   <BookingSteps current="sign" />      Review → Sign → Pay deposit
//   <ContractText contract={c} />        the agreement with merge fields filled
//   <SignaturePad value onChange />      typed (default) or drawn signature
// =====================================================================
import { useEffect, useId, useRef, useState } from 'react'
import { useStore } from '../../store/StoreContext'
import { getClient, getLead, getInvoiceForEvent, getProposal, getCatalog } from '../../store/selectors'
import { priceVersion } from '../../lib/proposal'
import { formatMoney } from '../../lib/money'
import { formatDay, formatWeekdayDay } from '../../lib/clock'
import { eventTypeLabel } from '../../data/seed'
import Icon from '../ui/Icon'
import styles from './Booking.module.css'

const STEPS = [['review', 'Review'], ['sign', 'Sign'], ['pay', 'Pay deposit']]

export function BookingSteps({ current }) {
  const at = STEPS.findIndex(([id]) => id === current)
  return (
    <ol className={styles.steps} aria-label="Booking steps">
      {STEPS.map(([id, label], i) => {
        const done = current === 'done' || i < at
        return (
          <li key={id} className={`${styles.step} ${done ? styles.stepDone : ''} ${i === at ? styles.stepNow : ''}`} aria-current={i === at ? 'step' : undefined}>
            {done ? <Icon name="check" size={14} /> : <span aria-hidden="true">{i + 1}</span>}
            {label}
            {done && <span className="visually-hidden">(done)</span>}
          </li>
        )
      })}
    </ol>
  )
}

/** A filled-in merge field: underlined so the planner sees what came from the proposal. */
const M = ({ children }) => <span className={styles.merge}>{children}</span>

export function ContractText({ contract }) {
  const { state } = useStore()
  const lead = getLead(state, contract.leadId)
  const client = getClient(state, lead.clientId)
  const proposal = getProposal(state, lead.id)
  const version = proposal?.versions.find((v) => v.n === contract.versionN)
  const priced = version && priceVersion(version, getCatalog(state), contract.chosen)
  const invoice = contract.eventId && getInvoiceForEvent(state, contract.eventId)
  const total = contract.totalCents ?? invoice?.totalCents ?? 0
  const deposit = contract.depositCents ?? invoice?.installments[0].amountCents ?? 0
  const services = priced
    ? [`${priced.pkg?.name} package`, ...priced.lines.filter((l) => l.included).map((l) => `${l.qty > 1 ? `${l.qty} ` : ''}${l.addon?.name}`)]
    : lead.services
  const schedule = invoice?.installments ?? priced?.schedule ?? []

  return (
    <article className={styles.contract} aria-label="Contract" tabIndex={0}>
      <h2 className={styles.contractTitle}>Event Services Agreement</h2>
      <p>
        Between <M>{state.business.name}</M> (“Planner”) and <M>{client.name}{client.partner ? ` and ${client.partner}` : ''}</M> (“Client”)
        for a <M>{eventTypeLabel(lead.eventType).toLowerCase()}</M> on <M>{lead.eventDate ? formatDay(lead.eventDate) : 'a date to be agreed'}</M> at <M>{lead.venue}</M>{lead.guestCount ? <> for about <M>{lead.guestCount} guests</M></> : null}.
      </p>
      <p>Total <M>{formatMoney(total)}</M> including tax, with a deposit of <M>{formatMoney(deposit)}</M> due at signing to reserve the date.</p>
      <h3 className={styles.clause}>Services</h3>
      <ul className={styles.list}>{services.map((s) => <li key={s}><M>{s}</M></li>)}</ul>
      {schedule.length > 0 && (
        <>
          <h3 className={styles.clause}>Payment schedule</h3>
          <ul className={styles.list}>
            {schedule.map((p) => <li key={p.label}>{p.label}: <M>{formatMoney(p.amountCents)}</M>{p.dueDate ? <>, due <M>{formatWeekdayDay(p.dueDate)}</M></> : p.due ? `, ${p.due}` : ''}</li>)}
          </ul>
        </>
      )}
      <h3 className={styles.clause}>Cancellation policy</h3>
      <p>{state.business.contractTerms.cancellation}</p>
      <h3 className={styles.clause}>Electronic signatures</h3>
      <p>Both parties agree to sign electronically. An e-signature has the same effect as a handwritten one. Each party gets a signed PDF with the date and time of both signatures.</p>
    </article>
  )
}

/** Typed signature by default (easiest on phones); "Draw instead" opens a drawing pad. */
export function SignaturePad({ value, onChange, label = 'Type your full name', error }) {
  const [mode, setMode] = useState('type')
  const canvas = useRef(null)
  const drawing = useRef(false)
  const inputId = useId()
  const errorId = useId()

  useEffect(() => {
    if (mode !== 'draw') return
    const c = canvas.current
    const ctx = c.getContext?.('2d')
    if (!ctx) return
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2
    ctx.scale(2, 2); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = getComputedStyle(c).color
  }, [mode])

  const point = (e) => { const r = canvas.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
  const down = (e) => { drawing.current = true; const ctx = canvas.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(...point(e)); canvas.current.setPointerCapture?.(e.pointerId) }
  const move = (e) => { if (!drawing.current) return; const ctx = canvas.current.getContext('2d'); ctx.lineTo(...point(e)); ctx.stroke() }
  const up = () => { if (!drawing.current) return; drawing.current = false; onChange(canvas.current.toDataURL()) }
  const clear = () => { const c = canvas.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); onChange('') }

  return (
    <div className={styles.sig}>
      {mode === 'type'
        ? (
          <>
            <label htmlFor={inputId} className={styles.sigLabel}>{label}</label>
            <input id={inputId} className={styles.sigInput} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="name"
              aria-invalid={error ? 'true' : undefined} aria-describedby={error ? errorId : undefined} />
            {value && <p className={styles.sigPreview} aria-hidden="true">{value}</p>}
          </>
        )
        : (
          <>
            <span className={styles.sigLabel}>Draw your signature</span>
            <canvas ref={canvas} className={styles.canvas} aria-label="Signature drawing area" role="img"
              onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
            <button type="button" className="link-button" onClick={clear}>Clear</button>
          </>
        )}
      {error && <span id={errorId} className={styles.error}>{error}</span>}
      <button type="button" className="link-button" onClick={() => { setMode(mode === 'type' ? 'draw' : 'type'); onChange('') }}>
        {mode === 'type' ? 'Draw instead' : 'Type instead'}
      </button>
    </div>
  )
}
