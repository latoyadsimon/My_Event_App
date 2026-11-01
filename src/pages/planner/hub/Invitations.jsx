// =====================================================================
// Event Hub › Guests › Invitations (PL-5.3): the design (see the Designer, PL-5.5),
// editable wording per type (save-the-date, invitation, reminder,
// thank-you), client approval, then send by email / text / link, now or
// scheduled. Tracking per guest; bounces and STOP opt-outs are listed.
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getEventGuests, guestCounts } from '../../../store/selectors'
import { designOf } from '../../../data/seedPlanning'
import InvitationCard from '../../../components/invitation/InvitationCard'
import { formatDay, formatDayShort } from '../../../lib/clock'
import { Button, Card, Dialog, Field, Kpis, Notice, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

const KINDS = [['save_the_date', 'Save-the-date'], ['invitation', 'Invitation'], ['reminder', 'Reminder'], ['thank_you', 'Thank-you']]
const DEFAULT_WORDING = (event) => ({
  save_the_date: `Save the date! ${event.name} · ${formatDay(event.date)}. Invitation to follow.`,
  invitation: `You're invited to ${event.name} on ${formatDay(event.date)} at ${event.venue}. Please RSVP.`,
  reminder: `One week to go! ${event.name} is ${formatDay(event.date)} at ${event.venue}.`,
  thank_you: `Thank you for celebrating with us at ${event.name}!`,
})

export default function Invitations() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [kind, setKind] = useState('invitation')
  const [drafts, setDrafts] = useState(() => Object.fromEntries(KINDS.map(([k]) => [k, event.invitation.wording[k] || DEFAULT_WORDING(event)[k]])))
  const [channels, setChannels] = useState(['email', 'sms'])
  const [audience, setAudience] = useState('not_invited')
  const [when, setWhen] = useState('now')
  const [scheduleAt, setScheduleAt] = useState('')
  const [seeWho, setSeeWho] = useState(false)
  const [error, setError] = useState(null)

  const list = getEventGuests(state, event.id)
  const c = guestCounts(list)
  const approval = event.invitation.approval
  const sent = (k) => event.invitation.sends.filter((s) => s.kind === k && !s.scheduled).at(-1)
  const sizes = {
    not_invited: list.filter((g) => g.invite === 'not_sent').length,
    all: list.filter((g) => g.invite !== 'stopped').length,
    no_reply: list.filter((g) => !g.rsvp && !['bounced', 'stopped'].includes(g.invite)).length,
  }
  const link = `${window.location.origin}/e/${event.id}`
  const toggleChannel = (ch) => setChannels((x) => (x.includes(ch) ? x.filter((y) => y !== ch) : [...x, ch]))
  const saveWording = () => dispatch({ type: 'invitation/setWording', eventId: event.id, kind, text: drafts[kind] })

  const send = () => {
    if (!channels.some((ch) => ch !== 'link')) { setError('Pick email or text (or both).'); return }
    if (when === 'later' && !scheduleAt) { setError('Pick when to send.'); return }
    if (!sizes[audience]) { setError('Nobody to send to in that group.'); return }
    setError(null)
    saveWording()
    dispatch({ type: 'invitation/send', eventId: event.id, kind, channels, audience, scheduleAt: when === 'later' ? `${scheduleAt}:00` : undefined })
  }

  return (
    <div className="stack">
      <div className={styles.segmented} role="tablist" aria-label="Type">
        {KINDS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}>
            {label}{sent(k) ? ` ✓ ${formatDayShort(sent(k).at)}` : ''}
          </button>
        ))}
      </div>

      <div className={styles.grid2}>
        <Card title="Design + wording" action={<Button size="small" variant="primary" to={`/app/events/${event.id}/guests/design`}>Open the designer</Button>}>
          <InvitationCard event={event} design={designOf(event)} kicker={KINDS.find(([k]) => k === kind)[1]} title={event.name} label="Invitation preview">
            <p className={styles.inviteText}>{drafts[kind]}</p>
            <p className={styles.inviteFoot}>{formatDay(event.date)} · {event.venue}</p>
          </InvitationCard>
          <Field label="Wording" as="textarea" value={drafts[kind]} onChange={(e) => setDrafts((d) => ({ ...d, [kind]: e.target.value }))} onBlur={saveWording} />
          {approval?.status === 'approved' && <StatusChip tone="success" label={`✓ Approved by ${approval.by.split(' ')[0]} · ${formatDayShort(approval.at)}`} />}
          {approval?.status === 'requested' && <StatusChip tone="warning" label="Waiting for the client's approval" />}
          {approval?.status === 'changes' && <Notice tone="info">The client asked for changes{approval.comment ? `: “${approval.comment}”` : '.'}</Notice>}
          <Button onClick={() => { saveWording(); dispatch({ type: 'invitation/requestApproval', eventId: event.id, kind }) }} disabled={approval?.status === 'requested'}>
            Request client approval
          </Button>
        </Card>

        <Card title="Send">
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>How</legend>
            <label className={styles.check}><input type="checkbox" checked={channels.includes('email')} onChange={() => toggleChannel('email')} /> Email</label>
            <label className={styles.check}><input type="checkbox" checked={channels.includes('sms')} onChange={() => toggleChannel('sms')} /> Text (SMS)</label>
            <label className={styles.check}><input type="checkbox" checked={channels.includes('link')} onChange={() => toggleChannel('link')} /> Shareable link (for print and social)</label>
            {channels.includes('link') && (
              <div className={styles.inlineForm}>
                <Field label="Link" value={link} readOnly onFocus={(e) => e.target.select()} />
                <Button size="small" onClick={async () => { try { await navigator.clipboard?.writeText(link) } catch { /* shown above */ } dispatch({ type: 'toast/show', text: 'Link copied' }) }}>Copy</Button>
              </div>
            )}
          </fieldset>
          <Field label="To" as="select" value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="not_invited">Not yet invited · {sizes.not_invited}</option>
            <option value="no_reply">No reply yet · {sizes.no_reply}</option>
            <option value="all">Everyone · {sizes.all}</option>
          </Field>
          <div className={styles.segmented} role="radiogroup" aria-label="When">
            <button type="button" role="radio" aria-checked={when === 'now'} onClick={() => setWhen('now')}>Send now</button>
            <button type="button" role="radio" aria-checked={when === 'later'} onClick={() => setWhen('later')}>Schedule</button>
          </div>
          {when === 'later' && <Field label="When" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <Button variant="primary" onClick={send}>{when === 'later' ? 'Schedule' : 'Send'} {KINDS.find(([k]) => k === kind)[1].toLowerCase()}s</Button>
          <p className="muted">A “one week to go” reminder with directions, parking and dress code goes out on its own, then a “see you tomorrow” text.</p>
          <div className="cluster">
            <Button size="small" onClick={() => dispatch({ type: 'guestReminders/send', eventId: event.id, kind: 'week' })}>Send “one week to go” now</Button>
            <Button size="small" onClick={() => dispatch({ type: 'guestReminders/send', eventId: event.id, kind: 'day' })}>Send “see you tomorrow” now</Button>
          </div>
        </Card>
      </div>

      <Card title="Tracking">
        <Kpis label="Invitation tracking" items={[
          { label: 'delivered', value: c.tracking.delivered },
          { label: 'opened', value: c.tracking.opened },
          { label: 'responded', value: c.tracking.responded },
          { label: 'not delivered', value: c.tracking.notDelivered.length },
        ]} />
        {c.tracking.notDelivered.length > 0 && (
          <Notice tone="warning" action={<Button size="small" onClick={() => setSeeWho(true)}>See who</Button>}>
            {c.tracking.notDelivered.length} not delivered: {c.tracking.notDelivered.filter((g) => g.invite === 'bounced').length} bounced email, {c.tracking.notDelivered.filter((g) => g.invite === 'stopped').length} replied STOP to texts.
          </Notice>
        )}
        {event.invitation.sends.length > 0 && (
          <ul role="list" className={styles.rows}>
            {event.invitation.sends.map((s) => (
              <li key={s.id}><span className={styles.when}>{formatDayShort(s.at)}</span><span>{KINDS.find(([k]) => k === s.kind)?.[1]} · {s.count} households · {s.channels.join(' + ')}</span>{s.scheduled && <StatusChip tone="info" label="Scheduled" />}</li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={seeWho} title="Not delivered" onClose={() => setSeeWho(false)}>
        <ul role="list" className={styles.rows}>
          {c.tracking.notDelivered.map((g) => (
            <li key={g.id}><strong>{g.name}</strong><span className="muted">{g.invite === 'bounced' ? `Email bounced (${g.email})` : `Replied STOP to texts (${g.phone})`}</span></li>
          ))}
        </ul>
        <p className="muted">Fix the email in the Guest list, or reach out another way. People who texted STOP won&apos;t get texts again.</p>
      </Dialog>
    </div>
  )
}
