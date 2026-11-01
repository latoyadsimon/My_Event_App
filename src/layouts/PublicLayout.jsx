// Public pages a planner shares (inquiry form, booking page, staff invite):
// the planner's brand on top, "Powered by Crowned" at the bottom. No account needed.
import { Outlet } from 'react-router-dom'
import { BusinessMark, PoweredBy } from '../components/brand/Brand'
import { useStore } from '../store/StoreContext'
import PageFrame from '../components/shell/PageFrame'
import styles from './layouts.module.css'

export default function PublicLayout() {
  const { state } = useStore()
  const b = state.business
  return (
    <div className={styles.public}>
      <header className={styles.publicHead}>
        <div className={styles.publicHeadInner}><BusinessMark business={b} sub={b.city} /></div>
      </header>
      <main id="main" className={styles.publicMain} tabIndex={-1}>
        <PageFrame><Outlet /></PageFrame>
      </main>
      <footer className={styles.publicFoot}>
        <span className="muted">{b.name} · {b.phone} · {b.email}</span>
        <PoweredBy />
      </footer>
    </div>
  )
}
