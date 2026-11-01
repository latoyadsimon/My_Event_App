// =====================================================================
// One event's workspace: header (name, date · venue, status, Change date /
// Cancel event) + tabs (Overview · Tasks · Guests · Money · Files · Messages).
// Memorial events switch the whole hub to the respectful tone (style guide §13).
// =====================================================================
import { Link, NavLink, Outlet, useOutletContext, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { getEvent } from '../store/selectors'
import { getTheme, isRespectful } from '../styles/themes'
import { formatDay } from '../lib/clock'
import { Button, StatusChip } from '../components/ui'
import NotFound from '../pages/shared/NotFound'
import styles from './layouts.module.css'

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'tasks', label: 'Tasks' },
  { to: 'guests', label: 'Guests' },
  { to: 'money', label: 'Money' },
  { to: 'files', label: 'Files' },
  { to: 'messages', label: 'Messages' },
]

export default function EventHubLayout() {
  const { eventId } = useParams()
  const { state } = useStore()
  const event = getEvent(state, eventId)
  if (!event) return <NotFound what="event" />

  const quiet = isRespectful(getTheme(event.theme), event.type)
  const base = `/app/events/${event.id}`

  return (
    <div className={styles.hub} data-tone={quiet ? 'respectful' : undefined}>
      <Link to="/app/events" className={styles.crumb}>Events</Link>
      <div className={styles.hubHead}>
        <div>
          <h1 className={`display ${styles.hubTitle}`}>{event.name}</h1>
          <p className={styles.hubMeta}>
            <span>{formatDay(event.date)} · {event.venue}</span>
            <StatusChip status={event.status} />
          </p>
        </div>
        {!['cancelled', 'closed'].includes(event.status) && (
          <div className={styles.hubActions}>
            <Button size="small" to={`${base}/reschedule`}>Change date</Button>
            <Button size="small" variant="danger" to={`${base}/cancel`}>Cancel event</Button>
          </div>
        )}
      </div>

      <nav className={styles.tabs} aria-label="Event sections">
        <ul role="list" className={styles.tabList}>
          {TABS.map((t) => (
            <li key={t.label}>
              <NavLink
                to={t.to ? `${base}/${t.to}` : base}
                end={t.end}
                className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
              >
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Outlet context={{ event }} />
    </div>
  )
}

/** Guest list · Invitations · Website & RSVP (inside the Guests tab) */
export function GuestSubTabs() {
  const { eventId } = useParams()
  const hub = useOutletContext()
  const base = `/app/events/${eventId}/guests`
  const items = [
    { to: base, label: 'Guest list', end: true },
    { to: `${base}/invitations`, label: 'Invitations' },
    { to: `${base}/website`, label: 'Website & RSVP' },
  ]
  return (
    <>
      <nav aria-label="Guests">
        <ul role="list" className={styles.subTabs}>
          {items.map((t) => (
            <li key={t.to}>
              <NavLink to={t.to} end={t.end} className={({ isActive }) => `${styles.subTab} ${isActive ? styles.subTabActive : ''}`}>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet context={hub} />
    </>
  )
}
