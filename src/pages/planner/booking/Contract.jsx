// =====================================================================
// Contract (PL-3.3, PL-3.4): the planner's view of one contract.
// Shows the client's signature and whether the deposit is paid, then
// "Countersign", which is refused until the deposit is paid. Countersigning
// books the event and applies the checklist.
// =====================================================================
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getContract, getLead, getClient, getEvent, getInvoiceForEvent, getMe } from '../../../store/selectors'
import { formatMoney } from '../../../lib/money'
import { formatDateTime } from '../../../lib/clock'
import { ContractText, SignaturePad } from '../../../components/booking/Booking'
import { Button, Card, Icon, Notice, PageHeader, StatusChip } from '../../../components/ui'
import NotFound from '../../shared/NotFound'
import styles from './booking.module.css'

function Signature({ name, at, label }) {
  return (
    <div className={styles.sigBox}>
      <span className={styles.sigRole}>{label}</span>
      {name?.startsWith('data:image')
        ? <img src={name} alt={`${label}'s drawn signature`} className={styles.sigImage} />
        : <span className={styles.sigName}>{name}</span>}
      <span className="muted">Signed {formatDateTime(at)}</span>
    </div>
  )
}

export default function Contract() {
  const { contractId } = useParams()
  const { state, dispatch } = useStore()
  const [signature, setSignature] = useState(() => getMe(state)?.name ?? '')
  const contract = getContract(state, contractId)
  if (!contract) return <NotFound what="contract" />

  const lead = getLead(state, contract.leadId)
  const client = getClient(state, lead.clientId)
  const event = contract.eventId && getEvent(state, contract.eventId)
  const invoice = event && getInvoiceForEvent(state, event.id)
  const deposit = invoice?.installments[0]
  const depositPaid = Boolean(deposit?.paidAt) || deposit?.amountCents === 0
  const first = client.name.split(' ')[0]

  return (
    <>
      <Link to={event ? `/app/events/${event.id}` : `/app/leads/${lead.id}`} className={styles.crumb}>← {event?.name ?? lead.title}</Link>
      <PageHeader title={`Contract · ${client.name.split(' ').at(-1)}`} actions={<Button onClick={() => window.print?.()}>Download PDF</Button>} />
      <div className={styles.chips}>
        <StatusChip tone={contract.clientSignedAt ? 'success' : 'neutral'} label={contract.clientSignedAt ? 'Client signed ✓' : 'Waiting for the client to sign'} />
        {deposit && <StatusChip tone={depositPaid ? 'success' : 'warning'} label={depositPaid ? `Deposit paid ✓ ${formatMoney(deposit.amountCents)}` : `Deposit due ${formatMoney(deposit.amountCents)}`} />}
        <StatusChip tone={contract.plannerSignedAt ? 'success' : contract.clientSignedAt ? 'warning' : 'neutral'} label={contract.plannerSignedAt ? 'Countersigned ✓' : 'Waiting for you'} />
      </div>

      <ContractText contract={contract} />
      {contract.versionN && <p className="muted"><span className={styles.mergeKey}>underlined</span> = merge fields filled from proposal v{contract.versionN}</p>}

      <div className={styles.sigGrid}>
        <Card title="Client">
          {contract.clientSignedAt
            ? <Signature name={contract.clientSignature ?? client.name} at={contract.clientSignedAt} label={client.name} />
            : <p className="muted">{first} hasn&apos;t signed yet. They sign in their portal right after accepting the proposal.</p>}
        </Card>

        <Card title="You">
          {contract.plannerSignedAt
            ? <Signature name={contract.plannerSignature ?? getMe(state)?.name} at={contract.plannerSignedAt} label="You" />
            : contract.clientSignedAt && !depositPaid
              ? <Notice tone="warning">{first} hasn&apos;t paid the deposit yet. You can countersign once it&apos;s paid.
                  {invoice && <> <Link to={`/app/invoices/${invoice.id}`}>Record a check or cash payment</Link></>}</Notice>
              : contract.clientSignedAt
                ? (
                  <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'contract/countersign', contractId: contract.id, signature }) }}>
                    <SignaturePad value={signature} onChange={setSignature} label="Sign here (your full name)" />
                    <Button type="submit" variant="primary" disabled={!signature.trim()}>Countersign</Button>
                  </form>
                )
                : <p className="muted">You can countersign after {first} signs and pays the deposit.</p>}
        </Card>
      </div>

      {contract.plannerSignedAt && event && (
        <Card>
          <p className={styles.booked}><Icon name="check" size={20} /> {event.name} is <strong>{event.status === 'booked' ? 'Booked' : 'confirmed'}</strong></p>
          <div className="cluster">
            <Button variant="primary" to={`/app/events/${event.id}`}>Go to Event Hub →</Button>
            {invoice && <Button to={`/app/invoices/${invoice.id}`}>View invoice</Button>}
          </div>
        </Card>
      )}
    </>
  )
}
