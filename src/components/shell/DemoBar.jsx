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

  // "planner:devon" = the planner app as a teammate, to see permissions at work (PL-1.6)
  // "client:acme"   = the portal as another client (Priya's is already unlocked)
  const switchRole = (value) => {
    const [role, who] = value.split(':')
    dispatch({ type: 'ui/setRole', role, memberId: role === 'planner' ? who : undefined, clientId: role === 'client' ? who ?? 'ana' : undefined })
    navigate(ROLE_HOME[role].to)
  }
  const coordinator = state.team.find((m) => m.role === 'coordinator' && m.status === 'active')
  const otherClient = state.clients.find((c) => c.id === 'acme')
  const current = state.ui.memberId ? `planner:${state.ui.memberId}`
    : state.ui.role === 'client' && state.ui.clientId !== 'ana' ? `client:${state.ui.clientId}` : state.ui.role

  return (
    <div className={styles.bar} role="region" aria-label="Demo controls">
      <span className={styles.tag}>Demo</span>
      <label className={styles.role}>
        <span>Viewing as</span>
        <select value={current} onChange={(e) => switchRole(e.target.value)}>
          {Object.entries(ROLE_HOME).map(([id, r]) => [
            <option key={id} value={id}>
              {id === 'planner' ? `Planner (${state.team.find((m) => m.role === 'owner')?.name.split(' ')[0] ?? 'you'})` : r.label}
            </option>,
            id === 'planner' && coordinator && <option key="coordinator" value={`planner:${coordinator.id}`}>Coordinator ({coordinator.name.split(' ')[0]})</option>,
            id === 'client' && otherClient && <option key="client-acme" value="client:acme">Client ({otherClient.name}, Acme)</option>,
          ])}
        </select>
      </label>
      <span className={styles.today}>Today is Thu, Nov 5, 2026</span>
      <span className="spacer" />
      <Link to="/outbox" className={styles.link}>
        <Icon name="outbox" size={16} />
        Outbox{unread > 0 && <span className={styles.count}>{unread}<span className="visually-hidden"> unread</span></span>}
      </Link>
      <Link to="/help" className={styles.link}>Help</Link>
      <button type="button" className={styles.link} onClick={() => window.location.assign('/')}>
        Reset demo
      </button>
    </div>
  )
}
