// =====================================================================
// Lead Detail (PL-2.3, PL-2.5): everything about one prospect, and the
// next step: reply, hold the date, send the booking link, or build the
// proposal (which carries every detail over, so nothing is retyped).
// If the date is already booked, it suggests nearby open dates to offer.
// =====================================================================
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getLead, getClient, getProposal, dateTakenBy, dateHeldBy, nearbyOpenDates, leadName } from '../../../store/selectors'
import { latestSent, draftOf } from '../../../lib/proposal'
import { EVENT_TYPES, LEAD_STAGES, BUDGET_RANGES, eventTypeLabel } from '../../../data/seed'
import { formatDay, formatDayShort, formatDateTime, formatTime, formatWeekdayDay } from '../../../lib/clock'
import { Button, Card, ConfirmDialog, Dialog, Field, Notice, PageHeader, StatusChip } from '../../../components/ui'
import NotFound from '../../shared/NotFound'
import styles from './leads.module.css'

const STAGE_TONE = { new: 'info', contacted: 'neutral', consult_booked: 'info', proposal_sent: 'warning', won: 'success', lost: 'neutral' }

function cannedReply(state, lead, client, dates = []) {
  const first = client.name.split(' ')[0]
  const what = eventTypeLabel(lead.eventType).toLowerCase()
  const when = lead.eventDate ? ` on ${formatDay(lead.eventDate)}` : ''
  const offer = dates.length
    ? `Unfortunately ${formatDayShort(lead.eventDate)} is already booked, but we're free on ${dates.map(formatWeekdayDay).join(', ')}. Would any of those work?`
    : 'We would love to help, and your date is open.'
  return `Hi ${first},\n\nThanks for reaching out about your ${what}${when}! ${offer}\n\nThe easiest next step is a free ${state.business.booking.consultMinutes}-minute consult so we can hear your ideas.\n\n${state.team.find((m) => m.role === 'owner')?.name.split(' ')[0]}\n${state.business.name}`
}

function EventDetails({ lead }) {
  const { dispatch } = useStore()
  const [values, setValues] = useState(() => ({
    eventType: lead.eventType, eventDate: lead.eventDate ?? '', guestCount: lead.guestCount ?? '',
    budget: lead.budget, services: lead.services.join(', '), venue: lead.venue,
  }))
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  const save = (e) => {
    e.preventDefault()
    dispatch({ type: 'lead/update', leadId: lead.id, changes: {
      ...values, eventDate: values.eventDate || null, guestCount: Number(values.guestCount) || null,
      services: values.services.split(',').map((s) => s.trim()).filter(Boolean),
    } })
    dispatch({ type: 'toast/show', text: 'Event details saved' })
  }
  return (
    <Card title="Event details">
      <form className={styles.formGrid} onSubmit={save}>
        <Field label="Event type" as="select" value={values.eventType} onChange={set('eventType')}>
          {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Field>
        <Field label="Date" type="date" value={values.eventDate} onChange={set('eventDate')} />
        <Field label="Guests" inputMode="numeric" value={values.guestCount} onChange={set('guestCount')} />
        <Field label="Budget" as="select" value={values.budget} onChange={set('budget')}>
          {[...new Set([values.budget, ...BUDGET_RANGES])].map((b) => <option key={b}>{b}</option>)}
        </Field>
        <Field label="Services" hint="Separate with commas" value={values.services} onChange={set('services')} />
        <Field label="Venue" value={values.venue} onChange={set('venue')} />
        {lead.notes && <p className="muted" style={{ gridColumn: '1 / -1' }}><strong>Their note:</strong> {lead.notes}</p>}
        <div style={{ gridColumn: '1 / -1' }}><Button type="submit">Save details</Button></div>
      </form>
    </Card>
  )
}

export default function LeadDetail() {
  const { leadId } = useParams()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [reply, setReply] = useState(null)       // the reply text being edited, or null
  const [losing, setLosing] = useState(false)
  const [lostReason, setLostReason] = useState('')

  const lead = getLead(state, leadId)
  if (!lead) return <NotFound what="lead" />
  const client = getClient(state, lead.clientId)
  const taken = dateTakenBy(state, lead.eventDate, lead.id)
  const held = dateHeldBy(state, lead.eventDate, lead.id)
  const suggestions = taken ? nearbyOpenDates(state, lead.eventDate) : []
  const proposal = getProposal(state, lead.id)
  const sent = latestSent(proposal)
  const draft = draftOf(proposal)
  const event = state.events.find((e) => e.leadId === lead.id)
  const closed = ['won', 'lost'].includes(lead.stage)
  const people = client.partner ? `${client.name.split(' ')[0]} & ${client.partner}` : client.name

  const sendReply = () => {
    dispatch({ type: 'lead/reply', leadId: lead.id, text: reply })
    setReply(null)
  }

  return (
    <>
      <Link to="/app/leads" className={styles.crumb}>← Leads</Link>
      <PageHeader title={people} sub={`${leadName(state, lead)}${lead.eventDate ? ` · ${formatDay(lead.eventDate)}` : ''}`} />
      <div className={styles.chips}>
        <StatusChip tone={STAGE_TONE[lead.stage]} label={LEAD_STAGES.find((s) => s.id === lead.stage).label} />
        <StatusChip tone="neutral" label={`Source: ${lead.source}`} />
        <StatusChip tone="neutral" label={`Received ${formatDayShort(lead.receivedAt)}`} />
        {lead.hold && <StatusChip tone="warning" label={`Date held until ${formatDayShort(lead.hold.until)}`} />}
      </div>

      {taken && !closed && (
        <Notice tone="danger" action={<Button size="small" onClick={() => setReply(cannedReply(state, lead, client, suggestions))}>Insert into reply</Button>}>
          {formatDay(lead.eventDate)} is already booked ({taken.name}). Nearby open dates: {suggestions.map(formatDayShort).join(' · ')}.
        </Notice>
      )}
      {held && !taken && !closed && (
        <Notice tone="warning">Another lead ({leadName(state, held)}) is holding this date until {formatDayShort(held.hold.until)}. The first signed contract gets it.</Notice>
      )}

      <div className={styles.detailGrid}>
        <div className="stack">
          <EventDetails key={lead.id} lead={lead} />
          <Card title="Activity">
            <ol role="list" className={styles.activity}>
              {lead.activity.map((a, i) => (
                <li key={i}><time dateTime={a.at}>{formatDateTime(a.at)}</time><span>{a.text}</span></li>
              ))}
            </ol>
          </Card>
        </div>

        <div className={styles.side}>
          <Card title="Next step">
            <div className={styles.nextSteps}>
              {event
                ? <Button variant="primary" to={`/app/events/${event.id}`}>Open the event</Button>
                : (
                  <>
                    {proposal
                      ? <Button variant="primary" to={`/app/proposals/${lead.id}`}>{draft ? `Continue proposal v${draft.n} (draft)` : `Open proposal (v${sent.n} sent)`}</Button>
                      : <Button variant="primary" onClick={() => navigate(`/app/proposals/${lead.id}`)}>Create proposal →</Button>}
                    <Button onClick={() => setReply(cannedReply(state, lead, client, suggestions))}>Send canned reply</Button>
                    {lead.hold
                      ? <Button onClick={() => dispatch({ type: 'lead/releaseHold', leadId: lead.id })}>Release date hold</Button>
                      : <Button onClick={() => dispatch({ type: 'lead/holdDate', leadId: lead.id })} disabled={!lead.eventDate || Boolean(taken)}>Hold date · {state.business.holdDays} days</Button>}
                    <Button onClick={() => dispatch({ type: 'lead/sendBookingLink', leadId: lead.id })}>Send booking link</Button>
                    {lead.stage !== 'lost' && <Button variant="danger" onClick={() => setLosing(true)}>Mark as lost</Button>}
                  </>
                )}
            </div>
            {sent && <p className="muted">Proposal v{sent.n} sent {formatDateTime(sent.sentAt)}{proposal.viewedAt ? ` · opened ${formatDateTime(proposal.viewedAt)}` : ' · not opened yet'}.</p>}
          </Card>

          <Card title="Contact">
            <div className={styles.contact}>
              <strong>{client.name}{client.partner ? ` & ${client.partner}` : ''}</strong>
              {client.company && <span>{client.company}</span>}
              <a href={`mailto:${client.email}`}>{client.email}</a>
              {client.phone && <a href={`tel:${client.phone.replace(/\D/g, '')}`}>{client.phone}</a>}
              {lead.consultAt && <span className="muted">Consult: {formatWeekdayDay(lead.consultAt)}, {formatTime(lead.consultAt)}</span>}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={reply !== null} title={`Reply to ${client.name.split(' ')[0]}`} onClose={() => setReply(null)} wide
        actions={<Button variant="primary" onClick={sendReply} disabled={!reply?.trim()}>Send reply</Button>}>
        <p className="muted">From your template. Edit anything before it goes out to {client.email}.</p>
        <Field label="Message" as="textarea" rows={10} value={reply ?? ''} onChange={(e) => setReply(e.target.value)} />
      </Dialog>

      <ConfirmDialog open={losing} title={`Mark ${people} as lost?`} confirmLabel="Mark as lost"
        onCancel={() => setLosing(false)}
        onConfirm={() => { dispatch({ type: 'lead/markLost', leadId: lead.id, reason: lostReason.trim() }); setLosing(false); dispatch({ type: 'toast/show', text: `${people} moved to Lost` }) }}>
        <p>They move to the Lost column and any date hold is released. You can move them back any time.</p>
        <Field label="Reason (optional)" value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Went with another planner" />
      </ConfirmDialog>
    </>
  )
}
