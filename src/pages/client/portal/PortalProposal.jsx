// =====================================================================
// Portal › Proposal (CL-2.1, CL-2.2): the client opens the magic link,
// reviews what's included, ticks optional upgrades (total updates live),
// then accepts, or asks a question, or requests changes.
// Booking is one sitting: Review → Sign → Pay deposit.
// ?expired=1 shows the expired-link state (links last 7 days).
// =====================================================================
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getBookingStep, getCatalog } from '../../../store/selectors'
import { latestSent } from '../../../lib/proposal'
import { formatDayShort, daysUntil } from '../../../lib/clock'
import { BookingSteps } from '../../../components/booking/Booking'
import ProposalView from '../../../components/proposal/ProposalView'
import { Button, Card, Dialog, EmptyState, Field, Notice, PageHeader } from '../../../components/ui'
import styles from './portal.module.css'

const LINK_DAYS = 7

export default function PortalProposal() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const booking = getBookingStep(state)
  const { lead, proposal, contract } = booking
  const sent = latestSent(proposal)
  const [chosen, setChosen] = useState(() => contract?.chosen ?? proposal?.chosen ?? [])
  const [asking, setAsking] = useState(false)
  const [comment, setComment] = useState('')
  const [newLinkSent, setNewLinkSent] = useState(false)

  useEffect(() => { if (lead && sent) dispatch({ type: 'proposal/view', leadId: lead.id }) }, [lead, sent, dispatch])

  const client = lead && state.clients.find((c) => c.id === lead.clientId)
  const expired = params.get('expired') === '1' || (sent && daysUntil(sent.sentAt.slice(0, 10)) < -LINK_DAYS)

  if (expired) {
    return (
      <Card title="This link has expired">
        <p className="muted">For your security, proposal links last {LINK_DAYS} days. We only send a new one to the email on file.</p>
        {newLinkSent
          ? <Notice tone="success">A new link is on its way to {client?.email.replace(/^(.).*(@.*)$/, '$1•••$2')}.</Notice>
          : <Button variant="primary" onClick={() => {
              dispatch({ type: 'outbox/send', message: { type: 'email', to: client.email, from: state.business.name, subject: 'Your new proposal link', body: 'Here is a fresh link to your proposal. It works for 7 days.', link: { label: 'View your proposal', to: '/portal/proposal', role: 'client', clientId: client.id } } })
              setNewLinkSent(true)
            }}>Send me a new link</Button>}
      </Card>
    )
  }

  if (!sent) {
    return (
      <>
        <PageHeader title="Your proposal" />
        <EmptyState title="Your proposal is on its way">{state.business.name} will email you as soon as it&apos;s ready.</EmptyState>
      </>
    )
  }

  const accepted = Boolean(contract)
  const toggle = (id) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  const accept = () => {
    dispatch({ type: 'proposal/accept', leadId: lead.id, chosen })
    navigate('/portal/contract')
  }
  const next = { sign: ['Continue to sign', '/portal/contract'], pay: ['Continue to payment', '/portal/pay'], done: ['Go to your portal', '/portal'] }[booking.step]

  return (
    <>
      <PageHeader title="Your proposal" sub={`v${sent.n} · updated ${formatDayShort(sent.sentAt)} · from ${state.business.name}`} />
      {booking.step !== 'done' && <BookingSteps current={booking.step} />}

      {accepted && (
        <Notice tone="success" action={next && <Button size="small" variant="primary" to={next[1]}>{next[0]}</Button>}>
          You accepted this proposal{proposal.acceptedAt ? ` on ${formatDayShort(proposal.acceptedAt)}` : ''}.
        </Notice>
      )}
      {!accepted && sent.changeRequest && (
        <Notice tone="info">You asked: “{sent.changeRequest.text}” {state.business.name} will send an updated version.</Notice>
      )}

      <ProposalView version={sent} catalog={getCatalog(state)} chosen={chosen} onToggle={accepted ? undefined : toggle} title={lead.title} />

      {!accepted && (
        <div className={styles.actions}>
          <Button to="/portal/messages">Ask a question</Button>
          <Button onClick={() => setAsking(true)}>Request changes</Button>
          <Button variant="primary" onClick={accept}>Accept proposal</Button>
        </div>
      )}

      <Dialog open={asking} title="Request changes" onClose={() => setAsking(false)}
        actions={<Button variant="primary" disabled={!comment.trim()} onClick={() => { dispatch({ type: 'proposal/requestChanges', leadId: lead.id, text: comment }); setAsking(false); setComment('') }}>Send to {state.business.name}</Button>}>
        <Field label="What would you like changed?" as="textarea" value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="For example: can the photo magnets be optional?" />
      </Dialog>
    </>
  )
}
