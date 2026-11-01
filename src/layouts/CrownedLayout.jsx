// Crowned's own full-page screens with no workspace nav yet (sign up, onboarding):
// the full lockup on top, content centered.
import { Outlet } from 'react-router-dom'
import PageFrame from '../components/shell/PageFrame'
import { Lockup } from '../components/brand/Brand'
import styles from './CrownedLayout.module.css'

export default function CrownedLayout() {
  return (
    <div className={styles.wrap}>
      <header className={styles.head}><Lockup /></header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <PageFrame><Outlet /></PageFrame>
      </main>
    </div>
  )
}
