// =====================================================================
// Demo Outbox: every email, text and push notification the app "sent".
// It stands in for SendGrid / Twilio / push (SYS-2) until the backend exists.
// Each message is drawn the way that device would show it, and its button
// opens the real screen, switching the demo to the person it was sent to.
// ?m=<id> selects a message, so a message can be linked to directly.
// =====================================================================
import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { formatDateTime } from '../../lib/clock'
import { Lockup, BusinessMark } from '../../components/brand/Brand'
import { Button, EmptyState } from '../../components/ui'
import Icon from '../../components/ui/Icon'
import styles from './Outbox.module.css'

const KIND = { email: 'Email', sms: 'Text', push: 'Push' }
const KIND_ICON = { email: 'message', sms: 'message', push: 'bell' }

function MessageLink({ link }) {
  const { dispatch } = useStore()
  const navigate = useNavigate()
  if (!link) return null
  const open = () => {
    if (link.role) dispatch({ type: 'ui/setRole', role: link.role, clientId: link.clientId })
    navigate(link.to)
  }
  return <Button variant="primary" onClick={open}>{link.label}</Button>
}

function EmailView({ m, business }) {
  return (
    <article className={styles.email} aria-label={`Email: ${m.subject}`}>
      <header className={styles.emailHead}>
        <h2 className={styles.subject}>{m.subject}</h2>
        <p className="muted">From {m.from} · To {m.to} · {formatDateTime(m.at)}</p>
      </header>
      <div className={styles.emailBody}>
        <BusinessMark business={business} />
        <p>{m.body}</p>
        <MessageLink link={m.link} />
        {m.foot && <p className={styles.foot}>{m.foot}</p>}
      </div>
    </article>
  )
}

function SmsView({ m }) {
  return (
    <article className={styles.sms} aria-label={`Text message from ${m.from}`}>
      <p className={styles.smsMeta}>{m.from} · Text message · {formatDateTime(m.at)}</p>
      <p className={styles.bubble}>{m.body}</p>
      <MessageLink link={m.link} />
    </article>
  )
}

function PushView({ m }) {
  return (
    <article className={styles.push} aria-label={`Notification: ${m.subject}`}>
      <div className={styles.notif}>
        <span className={styles.notifIcon}><Icon name="bell" size={18} /></span>
        <div>
          <p className={styles.notifFrom}>{m.from} · {formatDateTime(m.at)}</p>
          <p className={styles.notifTitle}>{m.subject}</p>
          <p>{m.body}</p>
        </div>
      </div>
      <MessageLink link={m.link} />
    </article>
  )
}

export default function Outbox() {
  const { state, dispatch } = useStore()
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('m') ?? state.outbox[0]?.id
  const selected = state.outbox.find((m) => m.id === selectedId)

  // Opening a message marks it read
  useEffect(() => {
    if (selected?.unread) dispatch({ type: 'outbox/read', id: selected.id })
  }, [selected, dispatch])

  return (
    <main id="main" className={styles.page} tabIndex={-1}>
      <header className={styles.head}>
        <Lockup byline={false} />
        <div>
          <h1 className={`display ${styles.title}`}>Outbox</h1>
          <p className="muted">Demo only: every email, text and push notification the app sends lands here instead of a real inbox.</p>
        </div>
      </header>

      {state.outbox.length === 0 ? (
        <EmptyState title="Nothing sent yet">Messages appear here when the app emails, texts or notifies someone.</EmptyState>
      ) : (
        <div className={styles.split}>
          <nav aria-label="Sent messages" className={styles.listWrap}>
            <ul role="list" className={styles.list}>
              {state.outbox.map((m) => (
                <li key={m.id}>
                  <Link
                    to={`?m=${m.id}`}
                    className={`${styles.item} ${m.id === selectedId ? styles.itemOn : ''}`}
                    aria-current={m.id === selectedId ? 'true' : undefined}
                    onClick={(e) => { e.preventDefault(); setParams({ m: m.id }) }}
                  >
                    <span className={styles.itemTop}>
                      <span className={styles.kind}><Icon name={KIND_ICON[m.type]} size={14} />{KIND[m.type]}</span>
                      <span className="muted">{formatDateTime(m.at)}</span>
                    </span>
                    <span className={styles.itemSubject}>
                      {m.unread && <span className={styles.dot}><span className="visually-hidden">Unread: </span></span>}
                      {m.subject ?? m.body}
                    </span>
                    <span className="muted">To {m.to}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <section className={styles.view} aria-live="polite">
            {selected?.type === 'email' && <EmailView m={selected} business={state.business} />}
            {selected?.type === 'sms' && <SmsView m={selected} />}
            {selected?.type === 'push' && <PushView m={selected} />}
          </section>
        </div>
      )}
    </main>
  )
}
