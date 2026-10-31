// "No access" (NFR-3): friendly, says why, and offers the way in.
// In the demo, the way in is switching roles.
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { ROLE_HOME } from '../../lib/roles'
import { Button } from '../../components/ui'
import styles from './Message.module.css'

const AREA = { planner: 'the planner workspace', client: 'the client portal', staff: 'the staff app', guest: 'guest pages' }

export default function NoAccess({ need }) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const current = ROLE_HOME[state.ui.role]

  const switchHere = () => {
    dispatch({ type: 'ui/setRole', role: need })
    navigate(pathname + search, { replace: true })
  }

  return (
    <main id="main" className={styles.wrap} tabIndex={-1}>
      <h1 className={`display ${styles.title}`}>This page is part of {AREA[need]}</h1>
      <p className="muted">You&apos;re viewing the demo as <strong>{current.label}</strong>, who can&apos;t open it.</p>
      <div className="cluster">
        <Button variant="primary" onClick={switchHere}>View as {ROLE_HOME[need].label}</Button>
        <Button to={current.to}>Back to {current.short.toLowerCase()} home</Button>
      </div>
    </main>
  )
}
