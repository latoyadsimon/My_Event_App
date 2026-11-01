// =====================================================================
// Portal › Contract (CL-2.3): read it, download it, agree to sign
// electronically, then sign (typed by default, or drawn).
// Signing creates the event, the invoice and the payment schedule, so the
// deposit can be paid right away (functions.sql: client_sign_contract).
// =====================================================================
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getBookingStep } from '../../../store/selectors'
import { formatDateTime } from '../../../lib/clock'
import { BookingSteps, ContractText, SignaturePad } from '../../../components/booking/Booking'
import { Button, Card, Icon, PageHeader } from '../../../components/ui'
import styles from './portal.module.css'

export default function PortalContract() {
  const { state, dispatch } = useStore()
  const booking = getBookingStep(state)
  const [consent, setConsent] = useState(false)
  const [signature, setSignature] = useState('')
  const [errors, setErrors] = useState({})

  if (booking.step === 'none' || booking.step === 'review') return <Navigate to="/portal/proposal" replace />
  const { contract } = booking

  const sign = (e) => {
    e.preventDefault()
    const found = {}
    if (!consent) found.consent = 'Please agree to sign electronically.'
    if (!signature.trim()) found.signature = 'Please sign: type your full name, or draw your signature.'
    setErrors(found)
    if (Object.keys(found).length) return
    dispatch({ type: 'contract/clientSign', contractId: contract.id, signature, consent })
  }

  return (
    <>
      <PageHeader title="Contract" actions={<Button onClick={() => window.print?.()}>Download PDF</Button>} />
      {booking.step !== 'done' && <BookingSteps current={booking.step} />}

      <ContractText contract={contract} />

      {contract.clientSignedAt
        ? (
          <Card>
            <p className={styles.signedLine}><Icon name="check" size={20} /> Signed {formatDateTime(contract.clientSignedAt)}</p>
            {booking.step === 'pay'
              ? <>
                  <p><strong>Last step: pay your deposit</strong> to lock your date.</p>
                  <Button variant="primary" to="/portal/pay">Continue to payment</Button>
                </>
              : <p className="muted">{contract.plannerSignedAt ? `Countersigned by ${state.business.name} ${formatDateTime(contract.plannerSignedAt)}.` : `${state.business.name} will countersign shortly.`}</p>}
          </Card>
        )
        : (
          <form className={styles.signForm} onSubmit={sign} noValidate>
            <label className={styles.consent}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={errors.consent ? 'true' : undefined} />
              <span>I agree to sign this contract electronically.</span>
            </label>
            {errors.consent && <p className={styles.error}>{errors.consent}</p>}
            <SignaturePad value={signature} onChange={setSignature} error={errors.signature} />
            <Button type="submit" variant="primary">Sign contract</Button>
          </form>
        )}
    </>
  )
}
