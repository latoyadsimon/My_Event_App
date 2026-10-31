// =====================================================================
// Dashboard: answers "what needs me today?" (spec success metric #1).
// Wireframe order: key numbers → Today & this week + Alerts → Pipeline,
// plus the getting-started checklist until setup is done (PL-1.8).
// Every alert links to the screen that fixes it. Every number is computed
// from the data (getDashboard), so it matches the other screens.
// =====================================================================
import { Link } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { getChecklist, getDashboard, getMe, nextOnboardingStep } from '../../store/selectors'
import { TODAY, formatTime, parseDay } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { Button, Card, Icon, Kpis, Notice, PageHeader } from '../../components/ui'
import styles from './Dashboard.module.css'

function GettingStarted() {
  const { state, dispatch } = useStore()
  const checklist = getChecklist(state)
  const resume = nextOnboardingStep(state)
  const inquiryUrl = `${window.location.origin}/b/${state.business.slug}/inquire`

  const shareForm = async () => {
    try { await navigator.clipboard?.writeText(inquiryUrl) } catch { /* clipboard blocked: the link is still shown */ }
    dispatch({ type: 'business/inquiryFormShared' })
    dispatch({ type: 'toast/show', text: 'Inquiry form link copied. Paste it on your website or Instagram.' })
  }

  return (
    <Card title="Getting started" action={<span className="muted">{checklist.doneCount} of {checklist.items.length} done</span>}>
      <ul role="list" className={styles.checklist}>
        {checklist.items.map((item) => (
          <li key={item.id} className={item.done ? styles.done : undefined}>
            <span className={styles.tick} aria-hidden="true">{item.done && <Icon name="check" size={14} />}</span>
            {item.id === 'inquiry' && !item.done
              ? <span className={styles.itemText}>{item.label}</span>
              : <Link to={item.to} className={styles.itemText}>{item.label}</Link>}
            <span className="visually-hidden">{item.done ? '(done)' : '(to do)'}</span>
            {item.id === 'inquiry' && !item.done && <Button size="small" variant="secondary" onClick={shareForm}>Copy link</Button>}
          </li>
        ))}
      </ul>
      {resume && <p className={styles.resume}><Link to={`/app/onboarding/${resume}`}>Continue setup where you left off</Link></p>}
    </Card>
  )
}

const dayLabel = (stamp) => {
  const d = parseDay(stamp)
  const sameDay = d.toDateString() === TODAY.toDateString()
  return sameDay ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })
}

export default function Dashboard() {
  const { state } = useStore()
  const { kpis, week, alerts, pipeline } = getDashboard(state)
  const checklist = getChecklist(state)
  const me = getMe(state)
  const canSeeMoney = me?.permissions.see_budgets && me?.twoFactor
  const monthName = TODAY.toLocaleDateString('en-US', { month: 'long' })
  const isNew = state.events.length === 0 && state.leads.length === 0

  return (
    <>
      <PageHeader title="Dashboard" sub={`${TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${state.business.name}`} />

      {!state.business.paymentProvider && (
        <Notice tone="warning" action={<Button size="small" variant="primary" to="/app/settings/payments">Connect now</Button>}>
          Payments not connected. Clients can only pay by check or cash.
        </Notice>
      )}

      {/* A brand-new business: the checklist is the most useful thing on the page, so it goes first */}
      {!checklist.allDone && isNew && <GettingStarted />}

      {canSeeMoney
        ? <Kpis label="This month" items={[
            { label: `Booked in ${monthName}`, value: formatMoney(kpis.bookedThisMonthCents) },
            { label: `Collected in ${monthName}`, value: formatMoney(kpis.collectedThisMonthCents) },
            { label: 'Balance due, all events', value: formatMoney(kpis.balanceDueCents) },
            { label: 'Open tasks', value: kpis.openTasks, note: kpis.lateTasks ? `${kpis.lateTasks} late` : 'None late' },
          ]} />
        : <Kpis label="This month" items={[{ label: 'Open tasks', value: kpis.openTasks, note: kpis.lateTasks ? `${kpis.lateTasks} late` : 'None late' }]} />}

      <div className={styles.twoUp}>
        <Card title={`Alerts (${alerts.length})`} className={styles.alerts}>
          {alerts.length === 0
            ? <p className="muted">Nothing needs you right now.</p>
            : (
              <ul role="list" className={styles.rows}>
                {alerts.map((a) => (
                  <li key={a.id} className={styles.alert}>
                    <span className={`${styles.dot} ${styles[a.tone]}`} aria-hidden="true" />
                    {a.action
                      ? <><span className={styles.alertText}>{a.text}</span><Button size="small" variant="primary" to={a.to}>{a.action}</Button></>
                      : <Link to={a.to} className={styles.alertText}>{a.text}</Link>}
                  </li>
                ))}
              </ul>
            )}
        </Card>

        <Card title="Today & this week">
          {week.length === 0
            ? <p className="muted">No consults, visits or pickups in the next 7 days.</p>
            : (
              <ul role="list" className={styles.rows}>
                {week.map((a) => (
                  <li key={a.id} className={styles.appt}>
                    <span className={styles.when}><strong>{dayLabel(a.at)}</strong> <span className="muted">{formatTime(a.at)}</span></span>
                    <span className={styles.what}><Link to={a.to}>{a.with}</Link> <span className="muted">· {a.title}</span></span>
                  </li>
                ))}
              </ul>
            )}
        </Card>
      </div>

      <Card title="Pipeline">
        <ul role="list" className={styles.pipeline}>
          {[
            ['Inquiries', pipeline.inquiries, '/app/leads'],
            ['Proposals sent', pipeline.proposalsSent, '/app/leads'],
            ['Booked', pipeline.booked, '/app/events'],
            ['Completed', pipeline.completed, '/app/events'],
          ].map(([label, n, to]) => (
            <li key={label}>
              <Link to={to} className={styles.stage}>
                <span className={styles.stageNum}>{n}</span>
                <span className={styles.stageLabel}>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* Once the business is running, setup is no longer the main job: the checklist waits at the bottom */}
      {!checklist.allDone && !isNew && <GettingStarted />}
    </>
  )
}
