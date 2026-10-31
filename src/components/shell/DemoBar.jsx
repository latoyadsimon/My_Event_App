// =====================================================================
// Demo-only strip at the very top. Not part of the product design: it lets
// one person play every role while all roles share the same in-memory data
// (Ana signs as the client, then the planner sees the countersign alert).
// Remove it when real sign-in arrives.
// =====================================================================
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { ROLE_HOME } from '../../lib/roles'
import Icon from '../ui/Icon'
import styles from './DemoBar.module.css'


export default function DemoBar() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const unread = state.outbox.filter((m) => m.unread).length

  const switchRole = (role) => {
    dispatch({ type: 'ui/setRole', role })
    navigate(ROLE_HOME[role].to)
  }

  return (
    <div className={styles.bar} role="region" aria-label="Demo controls">
      <span className={styles.tag}>Demo</span>
      <label className={styles.role}>
        <span>Viewing as</span>
        <select value={state.ui.role} onChange={(e) => switchRole(e.target.value)}>
          {Object.entries(ROLE_HOME).map(([id, r]) => <option key={id} value={id}>{r.label}</option>)}
        </select>
      </label>
      <span className={styles.today}>Today is Thu, Nov 5, 2026</span>
      <span className="spacer" />
      <Link to="/outbox" className={styles.link}>
        <Icon name="outbox" size={16} />
        Outbox{unread > 0 && <span className={styles.count}>{unread}<span className="visually-hidden"> unread</span></span>}
      </Link>
      <button type="button" className={styles.link} onClick={() => window.location.assign('/')}>
        Reset demo
      </button>
    </div>
  )
}
