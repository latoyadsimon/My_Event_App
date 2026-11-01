// =====================================================================
// The client portal (Ana's view). The PLANNER's brand leads (NFR-15):
// their logo and name at the top, "Powered by Crowned" at the bottom.
// Before the deposit, Home / Guests / Mood Board / Approvals are shown
// locked with "Unlocks after your deposit"; Messages stays open (walkthrough decision).
// =====================================================================
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AppShell from '../components/shell/AppShell'
import { BusinessMark, PoweredBy } from '../components/brand/Brand'
import { useStore } from '../store/StoreContext'
import { getPortal } from '../store/selectors'

const LOCK_NOTE = 'Unlocks after your deposit'
const LOCKED_BEFORE_DEPOSIT = ['/portal', '/portal/guests', '/portal/mood-board', '/portal/approvals']

const ITEMS = [
  { to: '/portal', label: 'Home', icon: 'home', end: true },
  { to: '/portal/proposal', label: 'Proposal', icon: 'proposal' },
  { to: '/portal/payments', label: 'Payments', icon: 'card' },
  { to: '/portal/guests', label: 'Guests', icon: 'users' },
  { to: '/portal/mood-board', label: 'Mood Board', icon: 'image' },
  { to: '/portal/approvals', label: 'Approvals', icon: 'check' },
  { to: '/portal/messages', label: 'Messages', icon: 'message' },
]

export default function PortalLayout() {
  const { state } = useStore()
  const { pathname } = useLocation()
  const { client, lead, unlocked } = getPortal(state)

  const items = ITEMS.map((item) =>
    !unlocked && LOCKED_BEFORE_DEPOSIT.includes(item.to) ? { ...item, locked: true, lockNote: LOCK_NOTE } : item)

  // A locked page opened directly (old link, typed URL) goes to the proposal instead.
  if (!unlocked && LOCKED_BEFORE_DEPOSIT.includes(pathname)) return <Navigate to="/portal/proposal" replace />

  return (
    <AppShell
      navLabel="Your event"
      items={items}
      brand={<BusinessMark business={state.business} sub={lead ? `${lead.title} · ${client.partner ? `${client.name.split(' ')[0]} & ${client.partner.split(' ')[0]}` : client.name}` : undefined} />}
      sideNote={unlocked ? undefined : LOCK_NOTE}
      footer={<PoweredBy />}
    >
      <Outlet />
    </AppShell>
  )
}
