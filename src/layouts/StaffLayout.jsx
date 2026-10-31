// Staff on their phones. Phase 2 screens are shown locked so the nav matches
// the wireframe and nobody hits a dead end.
import AppShell from '../components/shell/AppShell'
import { BusinessMark, PoweredBy } from '../components/brand/Brand'
import { useStore } from '../store/StoreContext'

const SOON = 'Coming in Phase 2'
const ITEMS = [
  { to: '/app/staff/shifts', label: 'My Shifts', icon: 'shift', locked: true, lockNote: SOON },
  { to: '/app/staff/day-of', label: 'Day-of', icon: 'star', locked: true, lockNote: SOON },
  { to: '/app/staff/chat', label: 'Chat', icon: 'message', locked: true, lockNote: SOON },
  { to: '/app/staff/profile', label: 'Profile', icon: 'user' },
]

export default function StaffLayout() {
  const { state } = useStore()
  return (
    <AppShell
      navLabel="Staff"
      items={ITEMS}
      brand={<BusinessMark business={state.business} sub="Team" />}
      footer={<PoweredBy />}
    />
  )
}
