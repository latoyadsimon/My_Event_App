// =====================================================================
// Portal › Home (CL-3.1, CL-2.5): "what's next and what do I owe?"
// Countdown, next payment with Pay now, "Needs your action (n)" where
// every item links to the screen that finishes it, and recent messages.
// First visit: a 3-screen tour (skippable) ending with an optional
// passkey prompt.
// =====================================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getPortal, getInvoiceForEvent, nextDue } from '../../../store/selectors'
import { daysUntil, formatDay, formatDayShort, formatDateTime } from '../../../lib/clock'
import { formatMoney } from '../../../lib/money'
import { Button, Card, Dialog, EmptyState, Icon, PageHeader } from '../../../components/ui'
import styles from './portal.module.css'

const TOUR = [
  ['Everything in one place', 'Your to-dos, payments, guests, mood board and messages live here. The Home page always shows what needs you next.'],
  ['Guests and RSVPs', 'Add guests or import a spreadsheet. Your guests RSVP from their own link, no account needed, and the counts update here.'],
  ['Questions? Just ask', 'Messages goes straight to your planner. You’ll get an email when they reply.'],
]

function Tour({ onDone }) {
  const { dispatch } = useStore()
  const [i, setI] = useState(0)
  const last = i === TOUR.length
  return (
    <Dialog open title={last ? 'One more thing (optional)' : `${TOUR[i][0]} · ${i + 1} of ${TOUR.length}`} onClose={onDone}
      actions={last
        ? <Button variant="primary" onClick={() => { dispatch({ type: 'toast/show', text: 'Passkey saved. Next time, sign in with your face or fingerprint.' }); onDone() }}>Create a passkey</Button>
        : <Button variant="primary" onClick={() => setI(i + 1)}>{i === TOUR.length - 1 ? 'Got it' : 'Next'}</Button>}>
      <p>{last ? 'Want to sign in faster next time? A passkey uses your face or fingerprint instead of an email link.' : TOUR[i][1]}</p>
      {!last && <button type="button" className="link-button" onClick={onDone}>Skip the tour</button>}
    </Dialog>
  )
}

/** Everything the client still has to do, each with the link that finishes it. */
function actionItems(state, event, client) {
  const items = []
  for (const q of state.questionnaires.filter((x) => x.eventId === event.id && x.sentAt && !x.answeredAt)) {
    items.push({ id: q.id, text: `Fill in “${q.title}”`, due: q.dueDate, to: `/portal/questionnaire/${q.id}` })
  }
  for (const a of state.approvals.filter((x) => x.eventId === event.id && x.status === 'pending')) {
    items.push({ id: a.id, text: `Approve: ${a.title}`, to: '/portal/approvals' })
  }
  const invoice = getInvoiceForEvent(state, event.id)
  const due = nextDue(invoice)
  if (due && daysUntil(due.dueDate) <= 14 && !due.voided) items.push({ id: due.id, text: `Pay ${formatMoney(due.amountCents)} (${due.label})`, due: due.dueDate, to: '/portal/pay' })
  for (const t of state.tasks.filter((x) => x.eventId === event.id && x.assignee === 'client' && !x.done && !x.removed)) {
    const linked = state.approvals.some((a) => a.eventId === event.id && a.status === 'pending' && t.title.toLowerCase().includes(a.title.toLowerCase().split(' ')[0]))
    if (!linked) items.push({ id: t.id, text: t.title, due: t.due, task: true })
  }
  if (!client.coHosts?.length && client.partner) items.push({ id: 'cohost', text: `Invite ${client.partner.split(' ')[0]} as a co-host`, to: '/portal/guests' })
  return items
}

export default function PortalHome() {
  const { state, dispatch } = useStore()
  const { client, event } = getPortal(state)
  const [touring, setTouring] = useState(() => !state.ui.toursSeen?.includes(client?.id))
  if (!event) return <EmptyState title="Your event isn’t booked yet">Your planning tools open after your deposit.</EmptyState>

  const invoice = getInvoiceForEvent(state, event.id)
  const due = nextDue(invoice)
  const items = actionItems(state, event, client)
  const thread = state.threads.find((t) => t.eventId === event.id && t.kind === 'client')
  const recent = thread?.messages.slice(-3).reverse() ?? []
  const days = daysUntil(event.date)
  const endTour = () => { dispatch({ type: 'ui/tourSeen', clientId: client.id }); setTouring(false) }

  return (
    <>
      <PageHeader title={`Hi, ${client.name.split(' ')[0]}!`} sub={`${event.name} · ${formatDay(event.date)} · ${event.venue}`} />
      {event.status === 'cancelled' && <Card><p>This event was cancelled. Your planner has the details.</p></Card>}

      <div className={styles.homeTop}>
        <div className={styles.countdown}>
          <span className={styles.countNum}>{Math.max(0, days)}</span>
          <span className={styles.countLabel}>{days === 0 ? 'Today’s the day!' : 'days to go'}</span>
        </div>
        <Card title="Next payment">
          {due
            ? <>
                <p className={styles.bigAmount}>{formatMoney(due.amountCents)}</p>
                <p className="muted">{due.label} · due {formatDayShort(due.dueDate)}{invoice.options.autopay ? ' · autopay on' : ''}</p>
                <Button variant="primary" to="/portal/pay">Pay now</Button>
              </>
            : <p>All paid. Thank you!</p>}
        </Card>
      </div>

      <Card title={`Needs your action (${items.length})`}>
        {items.length === 0
          ? <p className={styles.caughtUp}><Icon name="check" size={18} /> You&apos;re all caught up.</p>
          : (
            <ul role="list" className={styles.rows}>
              {items.map((it) => (
                <li key={it.id}>
                  {it.task
                    ? <label className={styles.consent}>
                        <input type="checkbox" onChange={() => dispatch({ type: 'task/clientDone', taskId: it.id, by: client.name.split(' ')[0] })} />
                        <span>{it.text}</span>
                      </label>
                    : <Link to={it.to} className={styles.actionLink}>{it.text}</Link>}
                  {it.due && <span className="muted">due {formatDayShort(it.due)}</span>}
                </li>
              ))}
            </ul>
          )}
      </Card>

      <Card title="Recent messages" action={<Link to="/portal/messages">Open messages</Link>}>
        {recent.length === 0
          ? <p className="muted">No messages yet. Questions? Your planner is one message away.</p>
          : (
            <ul role="list" className={styles.rows}>
              {recent.map((m) => <li key={m.id}><strong>{m.author}</strong><span className={styles.snippet}>{m.text}</span><span className="muted">{formatDateTime(m.at)}</span></li>)}
            </ul>
          )}
      </Card>

      <p className="muted">Need to change your date or cancel? <Link to="/portal/change-request">See your options</Link>.</p>
      {touring && <Tour onDone={endTour} />}
    </>
  )
}
