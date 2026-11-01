// =====================================================================
// Portal › Day-of (CL-5.1): only the essentials on the day. The client's
// version of the timeline, who to call, and where. No tasks.
// Shown from the final week. The morning-of message links here.
// =====================================================================
import { Navigate } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { formatClock, getPortal, getTimeline } from '../../../store/selectors'
import { formatDay } from '../../../lib/clock'
import { Card, Icon, PageHeader } from '../../../components/ui'
import styles from './portal.module.css'

export default function PortalDayOf() {
  const { state } = useStore()
  const { event } = getPortal(state)
  if (!event || !['final_week', 'event_day', 'wrap_up'].includes(event.status)) return <Navigate to="/portal" replace />
  const items = getTimeline(state, event.id, 'client')
  const owner = state.team.find((m) => m.role === 'owner')
  const lead = state.team.find((m) => m.role === 'coordinator' && m.status === 'active') ?? owner
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.venueInfo?.address ?? ''}`)}`
  return (
    <>
      <PageHeader title="Day-of" sub={`${formatDay(event.date)} · ${event.venue}`} />
      <Card title="Your day-of contact">
        <p className={styles.contactBig}><strong>{lead.name}</strong> · <a href={`tel:${lead.phone}`}>{lead.phone}</a></p>
        <p className="muted">Call or text {lead.name.split(' ')[0]} for anything today. You don&apos;t need to manage anything; enjoy it.</p>
      </Card>
      <Card title="Today">
        {items.length === 0 ? <p className="muted">Your planner is finishing the timeline.</p> : (
          <ol role="list" className={styles.dayList}>
            {items.map((t) => (
              <li key={t.id}><span className={styles.dayTime}>{formatClock(t.time)}</span><span><strong>{t.title}</strong>{t.location && ` · ${t.location}`}</span></li>
            ))}
          </ol>
        )}
      </Card>
      <Card title="Where">
        <p><strong>{event.venue}</strong>{event.venueInfo?.address && <><br />{event.venueInfo.address}</>}</p>
        <a href={mapUrl} target="_blank" rel="noreferrer"><Icon name="external" size={14} /> Open in Maps<span className="visually-hidden"> (opens in a new tab)</span></a>
      </Card>
      <Card title="Contacts">
        <ul role="list" className={styles.dayList}>
          <li><span>{owner.name} (your planner)</span><a href={`tel:${owner.phone}`}>{owner.phone}</a></li>
          {lead.id !== owner.id && <li><span>{lead.name} (on site)</span><a href={`tel:${lead.phone}`}>{lead.phone}</a></li>}
        </ul>
      </Card>
    </>
  )
}
