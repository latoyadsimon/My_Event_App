// The planner workspace: Crowned wordmark, the business's name, and the
// planner nav from the wireframes (Dashboard · Leads · Calendar · Events · Settings).
import { Link } from 'react-router-dom'
import AppShell from '../components/shell/AppShell'
import { Lockup } from '../components/brand/Brand'
import { useStore } from '../store/StoreContext'
import { BRAND_NAME } from '../styles/themes'
import styles from './layouts.module.css'

const ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/app/leads', label: 'Leads', icon: 'leads' },
  { to: '/app/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/app/events', label: 'Events', icon: 'events' },
  { to: '/app/settings', label: 'Settings', icon: 'settings' },
]

export default function PlannerLayout() {
  const { state } = useStore()
  return (
    <AppShell
      navLabel="Planner"
      items={ITEMS}
      brand={
        <div className={styles.plannerBrand}>
          <Lockup byline={false} to="/app/dashboard" />
          <span className={styles.workspace}>{state.business.name}</span>
        </div>
      }
      footer={
        <>
          <Link to="/help" className={styles.helpLink}>Help &amp; how-to</Link>
          <p className={styles.byline}>brought to you by <strong>{BRAND_NAME}</strong></p>
        </>
      }
    />
  )
}
