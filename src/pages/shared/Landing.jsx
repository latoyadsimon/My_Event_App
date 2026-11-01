// =====================================================================
// "/" — Crowned's front door for the demo: the lockup, what the app does,
// and one way in for each role. Every role shares the same in-memory data,
// so you can play the Rivera story from both sides.
// =====================================================================
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { ROLE_HOME } from '../../lib/roles'
import { Lockup } from '../../components/brand/Brand'
import Icon from '../../components/ui/Icon'
import styles from './Landing.module.css'

const ENTRIES = [
  { role: 'planner', who: 'LaToya, owner of Bella Events', what: 'Leads, proposals, contracts, payments and every event, in one place. The Riveras are reviewing proposal v2 right now.', icon: 'dashboard' },
  { role: 'client', who: 'Ana Rivera, getting married Jun 12, 2027', what: 'Review the proposal, sign and pay the deposit in one sitting, then plan together in the portal.', icon: 'proposal' },
  { role: 'guest', who: 'A guest at the Rivera wedding', what: 'Open the event website and RSVP in under a minute. No account, no password.', icon: 'users' },
  { role: 'staff', who: 'Sam Ortiz, event staff', what: 'Join the team from a text message and keep a profile. Shifts and day-of tools come in Phase 2.', icon: 'user' },
]

export default function Landing() {
  const { dispatch } = useStore()
  const navigate = useNavigate()

  const enter = (role) => {
    dispatch({ type: 'ui/setRole', role })
    navigate(ROLE_HOME[role].to)
  }

  return (
    <main id="main" className={styles.page} tabIndex={-1}>
      <section className={styles.hero}>
        <Lockup size="lg" to="/" />
        <h1 className={`display ${styles.title}`}>From the first inquiry to the last dance.</h1>
        <p className={styles.lede}>
          Crowned runs an event business end to end: leads, proposals, contracts, payments, guests and RSVPs,
          with your brand on everything your clients and guests see.
        </p>
        <p className={styles.actions}>
          <Link to="/app/signup">Create a planner account</Link>
          <span aria-hidden="true">·</span>
          <Link to="/signin">Sign in</Link>
        </p>
      </section>

      <section className={styles.roles} aria-labelledby="roles-title">
        <h2 id="roles-title" className={styles.rolesTitle}>Step into the demo</h2>
        <p className="muted">It&apos;s Thursday, November 5, 2026. Nothing you do is saved: refresh to start over.</p>
        <ul role="list" className={styles.roleList}>
          {ENTRIES.map((e) => (
            <li key={e.role}>
              <button type="button" className={styles.role} onClick={() => enter(e.role)}>
                <span className={styles.roleHead}>
                  <Icon name={e.icon} />
                  <span className={styles.roleName}>{ROLE_HOME[e.role].short}</span>
                </span>
                <span className={styles.who}>{e.who}</span>
                <span className={styles.what}>{e.what}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
