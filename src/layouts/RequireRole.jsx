// Shows a friendly "no access" page when the current demo role can't open an area
// (NFR-3). The real check moves to the server (RLS) when Supabase arrives.
import { Outlet } from 'react-router-dom'
import { useStore } from '../store/StoreContext'
import NoAccess from '../pages/shared/NoAccess'

export default function RequireRole({ role, children }) {
  const { state } = useStore()
  if (state.ui.role !== role) return <NoAccess need={role} />
  return children ?? <Outlet />
}
