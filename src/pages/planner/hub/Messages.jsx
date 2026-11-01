// =====================================================================
// Event Hub › Messages (PL-4.6): one thread with the client and one per
// vendor. The client never sees a vendor thread unless you share it.
// Attach files, send a change order from the thread, and see who didn't
// get a message (bounced email, texted STOP) and by which channel.
// =====================================================================
import { useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getMe } from '../../../store/selectors'
import { dollarsToCents } from '../../../lib/validate'
import { Button, Dialog, EmptyState, Field, Notice } from '../../../components/ui'
import Conversation from '../../../components/planning/Conversation'
import styles from './hub.module.css'

export default function Messages() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [params, setParams] = useSearchParams()
  const [newVendor, setNewVendor] = useState(null)
  const [changeOrder, setChangeOrder] = useState(null)
  const threads = state.threads.filter((t) => t.eventId === event.id)
  const current = threads.find((t) => t.id === params.get('t')) ?? threads[0]
  const me = getMe(state)

  const sendChangeOrder = () => {
    const cents = dollarsToCents(changeOrder.amount)
    if (!changeOrder.title.trim() || Number.isNaN(cents) || cents <= 0) return
    dispatch({ type: 'changeOrder/send', threadId: current.id, title: changeOrder.title, amountCents: cents })
    setChangeOrder(null)
  }

  return (
    <div className={styles.inbox}>
      <nav className={styles.threadList} aria-label="Threads">
        <ul role="list">
          {threads.map((t) => (
            <li key={t.id}>
              <button type="button" className={styles.threadButton} aria-current={current?.id === t.id ? 'true' : undefined} onClick={() => setParams({ t: t.id })}>
                <span className={styles.threadName}>{t.name}</span>
                <span className="muted">{t.kind === 'client' ? 'Client' : t.shared ? 'Vendor · shared with client' : 'Vendor · private'}</span>
              </button>
            </li>
          ))}
        </ul>
        <Button size="small" onClick={() => setNewVendor('')}>+ Vendor thread</Button>
      </nav>

      {!current
        ? <EmptyState title="No conversations yet" action={<Button onClick={() => setNewVendor('')}>+ Vendor thread</Button>}>The client&apos;s thread starts when they write from their portal.</EmptyState>
        : (
          <section className={styles.threadView} aria-label={current.name}>
            <div className={styles.threadHead}>
              <h2 className={styles.threadTitle}>{current.name}</h2>
              {current.kind === 'vendor' && (
                <label className={styles.check}>
                  <input type="checkbox" checked={current.shared} onChange={(e) => dispatch({ type: 'thread/share', threadId: current.id, shared: e.target.checked })} />
                  Share with client
                </label>
              )}
            </div>
            {current.kind === 'vendor' && !current.shared && <Notice tone="info">Private: the client can&apos;t see this thread.</Notice>}
            <Conversation key={current.id} thread={current} me="planner"
              onSend={(text, attachment) => dispatch({ type: 'thread/post', threadId: current.id, from: 'planner', author: me.name.split(' ')[0], text, attachment })}
              extra={current.kind === 'client' && <Button size="small" onClick={() => setChangeOrder({ title: '', amount: '' })}>Send a change order</Button>} />
          </section>
        )}

      <Dialog open={newVendor !== null} title="New vendor thread" onClose={() => setNewVendor(null)}
        actions={<Button variant="primary" disabled={!newVendor?.trim()} onClick={() => { dispatch({ type: 'thread/add', eventId: event.id, name: newVendor }); setNewVendor(null) }}>Start thread</Button>}>
        <Field label="Vendor name" value={newVendor ?? ''} onChange={(e) => setNewVendor(e.target.value)} placeholder="Bloom & Co. Florals" />
      </Dialog>

      <Dialog open={Boolean(changeOrder)} title="Send a change order" onClose={() => setChangeOrder(null)}
        actions={<Button variant="primary" onClick={sendChangeOrder}>Send for approval</Button>}>
        <p className="muted">The client approves it in their portal. Approved amounts are added to the final payment.</p>
        <Field label="What's changing" value={changeOrder?.title ?? ''} onChange={(e) => setChangeOrder((c) => ({ ...c, title: e.target.value }))} placeholder="Add an extra hour of karaoke" />
        <Field label="Amount ($)" inputMode="decimal" value={changeOrder?.amount ?? ''} onChange={(e) => setChangeOrder((c) => ({ ...c, amount: e.target.value }))} />
      </Dialog>
    </div>
  )
}
