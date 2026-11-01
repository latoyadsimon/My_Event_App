// =====================================================================
// The vendor's page (VN-1 to VN-8). No account: the magic link /v/<token>
// is the key. The planner's brand on top (NFR-15), "Powered by Crowned"
// at the bottom. The first visit asks for company details, insurance (COI),
// W-9 and payout once; they're reused on every future event.
// Tabs: My event · Paperwork & pay · Messages.
// =====================================================================
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import { eventVendorByToken, getEvent, getVendor } from '../store/selectors'
import { formatDay } from '../lib/clock'
import { BusinessMark, PoweredBy } from '../components/brand/Brand'
import { StatusChip } from '../components/ui'
import NotFound from '../pages/shared/NotFound'
import PageFrame from '../components/shell/PageFrame'
import { lazyPage } from '../lib/lazyPage'
import styles from './layouts.module.css'

const VendorSetup = lazyPage(() => import('../pages/vendor/VendorPages'), 'VendorSetup')

export default function VendorLayout() {
  const { token } = useParams()
  const { state } = useStore()
  const ev = eventVendorByToken(state, token)
  if (!ev) return <NotFound what="vendor link" standalone />
  const event = getEvent(state, ev.eventId)
  const vendor = getVendor(state, ev.vendorId)
  const b = state.business
  const base = `/v/${token}`
  const tabs = [[base, 'My event', true], [`${base}/paperwork`, 'Paperwork & pay'], [`${base}/messages`, 'Messages']]

  return (
    <div className={styles.public}>
      <header className={styles.publicHead}>
        <div className={styles.publicHeadInner}><BusinessMark business={b} sub={`For ${vendor.name}`} /></div>
      </header>
      <main id="main" className={styles.publicMain} tabIndex={-1}>
        <div>
          <h1 className={`display ${styles.hubTitle}`}>{event.name}</h1>
          <p className={styles.hubMeta}>
            <span>{formatDay(event.date)} · {event.venue}</span>
            {ev.status === 'confirmed' && <StatusChip tone="success" label="You're confirmed" />}
            {ev.status === 'cancelled' && <StatusChip tone="danger" label="Cancelled" />}
            {event.status === 'cancelled' && <StatusChip tone="danger" label="Event cancelled" />}
          </p>
        </div>
        {!vendor.profileComplete
          ? <PageFrame><VendorSetup ev={ev} vendor={vendor} /></PageFrame>
          : (
            <>
              <nav aria-label="Your event">
                <ul role="list" className={styles.subTabs}>
                  {tabs.map(([to, label, end]) => (
                    <li key={to}><NavLink to={to} end={end} className={({ isActive }) => `${styles.subTab} ${isActive ? styles.subTabActive : ''}`}>{label}</NavLink></li>
                  ))}
                </ul>
              </nav>
              <PageFrame><Outlet context={{ ev, event, vendor }} /></PageFrame>
            </>
          )}
      </main>
      <footer className={styles.publicFoot}>
        <span className="muted">{b.name} · {b.phone} · {b.email}</span>
        <PoweredBy />
      </footer>
    </div>
  )
}
