// =====================================================================
// Brand pieces.
//   <Lockup />        Crowned + "brought to you by Simon Says: Celebrate" (Crowned's own pages)
//   <BusinessMark />  the PLANNER's logo + name (client and guest pages, NFR-15)
//   <PoweredBy />     small "Powered by Crowned" for client/guest footers (no "Celebrate":
//                     those pages can be memorials; style guide §1)
// Never type the app name by hand: it comes from themes.js.
// =====================================================================
import { Link } from 'react-router-dom'
import { APP_NAME, BRAND_NAME } from '../../styles/themes'
import { Crown } from '../ui/Icon'
import styles from './Brand.module.css'

export function Lockup({ size = 'md', byline = true, to = '/' }) {
  return (
    <div className={`${styles.lockup} ${styles[size]}`}>
      <Link to={to} className={styles.wordmark}>
        <Crown className={styles.crown} size={size === 'lg' ? 44 : 28} />
        <span className={styles.name}>{APP_NAME}</span>
      </Link>
      {byline && (
        <p className={styles.byline}>brought to you by <strong>{BRAND_NAME}</strong></p>
      )}
    </div>
  )
}

export function BusinessMark({ business, sub, to }) {
  const inner = (
    <>
      <span className={styles.logo} aria-hidden="true">{business.initials}</span>
      <span className={styles.bizText}>
        <span className={styles.bizName}>{business.name}</span>
        {sub && <span className={styles.bizSub}>{sub}</span>}
      </span>
    </>
  )
  return to
    ? <Link to={to} className={styles.biz}>{inner}</Link>
    : <span className={styles.biz}>{inner}</span>
}

export function PoweredBy() {
  return <p className={styles.powered}>Powered by {APP_NAME}</p>
}
