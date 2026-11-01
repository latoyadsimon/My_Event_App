// =====================================================================
// One event's workspace: header (name, date · venue, status, Change date /
// Cancel event, Day-of Mode in the final week) + tabs (Overview · [Wrap-up] · Tasks ·
// Guests · Logistics · Fundraising · Money · Files · Messages).
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
  { to: 'logistics', label: 'Logistics' },
  { to: 'fundraising', label: 'Fundraising' },
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
  // Wrap-up appears once teardown is done (product Phase 2)
  const tabs = ['wrap_up', 'closed'].includes(event.status) ? [...TABS.slice(0, 1), { to: 'wrap-up', label: 'Wrap-up' }, ...TABS.slice(1)] : TABS
  const dayOf = ['final_week', 'event_day'].includes(event.status)

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
        {!['cancelled', 'closed', 'wrap_up'].includes(event.status) && (
          <div className={styles.hubActions}>
            {dayOf && <Button size="small" variant="primary" to={`/app/day-of/${event.id}`}>Day-of Mode</Button>}
            <Button size="small" to={`${base}/reschedule`}>Change date</Button>
            <Button size="small" variant="danger" to={`${base}/cancel`}>Cancel event</Button>
          </div>
        )}
      </div>

      <nav className={styles.tabs} aria-label="Event sections">
        <ul role="list" className={styles.tabList}>
          {tabs.map((t) => (
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

/** A row of sub-pages inside a tab; passes the hub's context through. */
function SubTabs({ label, items }) {
  const hub = useOutletContext()
  return (
    <>
      <nav aria-label={label}>
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

/** Guest list · Invitations · Website & RSVP · Potluck & volunteers (inside the Guests tab) */
export function GuestSubTabs() {
  const { eventId } = useParams()
  const base = `/app/events/${eventId}/guests`
  return <SubTabs label="Guests" items={[
    { to: base, label: 'Guest list', end: true },
    { to: `${base}/invitations`, label: 'Invitations' },
    { to: `${base}/website`, label: 'Website & RSVP' },
    { to: `${base}/potluck`, label: 'Potluck & volunteers' },
  ]} />
}

/** Run of show · Vendors · Staff · Booth & karaoke · Gear (inside the Logistics tab, product Phases 2–3) */
export function LogisticsSubTabs() {
  const { eventId } = useParams()
  const base = `/app/events/${eventId}/logistics`
  return <SubTabs label="Logistics" items={[
    { to: base, label: 'Run of show', end: true },
    { to: `${base}/vendors`, label: 'Vendors' },
    { to: `${base}/staff`, label: 'Staff' },
    { to: `${base}/entertainment`, label: 'Booth & karaoke' },
    { to: `${base}/gear`, label: 'Gear & pack list' },
  ]} />
}
