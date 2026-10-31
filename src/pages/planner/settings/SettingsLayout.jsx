// Settings: the same forms as onboarding, plus Team & roles and Appearance.
// Sub-pages: /app/settings/<section>
import { NavLink, Outlet } from 'react-router-dom'
import { PageHeader } from '../../../components/ui'
import styles from '../../../layouts/layouts.module.css'

const SETTINGS_SECTIONS = [
  { id: 'business', label: 'Business' },
  { id: 'branding', label: 'Branding' },
  { id: 'packages', label: 'Packages' },
  { id: 'payments', label: 'Payments' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'team', label: 'Team & roles' },
  { id: 'appearance', label: 'Appearance' },
]

export default function SettingsLayout() {
  return (
    <>
      <PageHeader title="Settings" />
      <nav aria-label="Settings sections">
        <ul role="list" className={styles.subTabs}>
          {SETTINGS_SECTIONS.map((s) => (
            <li key={s.id}>
              <NavLink to={`/app/settings/${s.id}`} className={({ isActive }) => `${styles.subTab} ${isActive ? styles.subTabActive : ''}`}>
                {s.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </>
  )
}
