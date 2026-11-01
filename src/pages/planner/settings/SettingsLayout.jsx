// =====================================================================
// Settings: the onboarding forms again, plus Team & roles, Vendors,
// Equipment, Templates, Data export and Appearance. Wireframe: a section list on the left (desktop),
// a scrolling row of sections on phones.
// The owner must have a passkey or 2FA before seeing settings (PL-1.1).
// =====================================================================
import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getMe } from '../../../store/selectors'
import { Button, Notice, PageHeader } from '../../../components/ui'
import styles from './Settings.module.css'

const SECTIONS = [
  { id: 'business', label: 'Business' },
  { id: 'branding', label: 'Branding' },
  { id: 'packages', label: 'Packages' },
  { id: 'payments', label: 'Payments' },
  { id: 'calendar', label: 'Calendar sync' },
  { id: 'team', label: 'Team & roles' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'templates', label: 'Templates' },
  { id: 'export', label: 'Data export' },
  { id: 'appearance', label: 'Appearance' },
]

export default function SettingsLayout() {
  const { state } = useStore()
  const secured = Boolean(getMe(state)?.twoFactor)

  return (
    <>
      <PageHeader title="Settings" />
      {!secured ? (
        <Notice tone="warning" action={<Button variant="primary" to="/app/signup?step=secure">Set up a passkey</Button>}>
          Protect your account first. Owners need a passkey or a sign-in code app before opening settings or money.
        </Notice>
      ) : (
        <div className={styles.layout}>
          <nav aria-label="Settings sections" className={styles.sections}>
            <ul role="list" className={styles.sectionList}>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <NavLink to={`/app/settings/${s.id}`} className={({ isActive }) => `${styles.section} ${isActive ? styles.sectionActive : ''}`}>
                    {s.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.content}><Outlet /></div>
        </div>
      )}
    </>
  )
}
