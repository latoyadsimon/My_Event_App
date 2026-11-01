// Staff on their phones: My Shifts, Day-of, Chat, Profile. Day-of opens with
// the event-day build; until then it shows locked so nobody hits a dead end.
import AppShell from '../components/shell/AppShell'
import { BusinessMark, PoweredBy } from '../components/brand/Brand'
import { useStore } from '../store/StoreContext'

const SOON = 'Coming soon'
const ITEMS = [
  { to: '/app/staff/shifts', label: 'My Shifts', icon: 'shift' },
  { to: '/app/staff/day-of', label: 'Day-of', icon: 'star', locked: true, lockNote: SOON },
  { to: '/app/staff/chat', label: 'Chat', icon: 'message' },
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
