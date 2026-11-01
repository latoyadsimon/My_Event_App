// =====================================================================
// Connect payments (PL-1.3) and calendars (PL-1.5). In the demo, "connecting"
// stands in for the provider's sign-in (OAuth) and takes a moment, so the
// button shows "Connecting…" and can't be tapped twice (NFR-6).
// =====================================================================
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../../store/StoreContext'
import { Button, ConfirmDialog, Icon, Notice } from '../../../components/ui'
import styles from './setup.module.css'

const PAYMENT_PROVIDERS = [
  { id: 'stripe', name: 'Stripe', text: 'Cards, Apple Pay, Google Pay and bank transfers. Payouts in 2 business days.' },
  { id: 'square', name: 'Square', text: 'Cards and Cash App Pay. Also works with a Square reader at your events.' },
]
const CALENDARS = [
  { id: 'google', name: 'Google Calendar' },
  { id: 'apple', name: 'Apple iCloud' },
  { id: 'outlook', name: 'Outlook' },
]

/** One provider card with a connect button that pretends to sign in. */
function ProviderCard({ name, text, connected, otherConnected, onConnect, onDisconnect }) {
  const [busy, setBusy] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const connect = () => {
    setBusy(true)
    timer.current = setTimeout(() => { setBusy(false); onConnect() }, 500)
  }

  return (
    <div className={styles.provider}>
      <span className={styles.providerName}>{name}</span>
      {text && <p className={styles.help}>{text}</p>}
      {connected
        ? <>
            <span className={styles.connected}><Icon name="check" size={18} /> Connected</span>
            <Button size="small" variant="danger" onClick={onDisconnect}>Disconnect {name}</Button>
          </>
        : <Button variant={otherConnected ? 'ghost' : 'primary'} onClick={connect} busy={busy} busyLabel="Connecting…" disabled={otherConnected}>
            Connect {name}
          </Button>}
    </div>
  )
}

export function PaymentsConnect() {
  const { state, dispatch } = useStore()
  const [asking, setAsking] = useState(false)
  const current = state.business.paymentProvider
  const currentName = PAYMENT_PROVIDERS.find((p) => p.id === current)?.name

  return (
    <div className="stack">
      {!current && (
        <Notice tone="warning">Payments not connected. Until you connect, clients can only pay by check or cash.</Notice>
      )}
      <div className={styles.providers}>
        {PAYMENT_PROVIDERS.map((p) => (
          <ProviderCard key={p.id} name={p.name} text={p.text}
            connected={current === p.id} otherConnected={Boolean(current) && current !== p.id}
            onConnect={() => { dispatch({ type: 'payments/connect', provider: p.id }); dispatch({ type: 'toast/show', text: `${p.name} connected` }) }}
            onDisconnect={() => setAsking(true)} />
        ))}
      </div>
      <p className={styles.help}>Card numbers go straight to {currentName ?? 'Stripe or Square'} and never touch Crowned. One provider at a time.</p>
      <ConfirmDialog open={asking} title={`Disconnect ${currentName}?`} confirmLabel={`Disconnect ${currentName}`}
        onCancel={() => setAsking(false)}
        onConfirm={() => { dispatch({ type: 'payments/disconnect' }); dispatch({ type: 'toast/show', text: `${currentName} disconnected` }); setAsking(false) }}>
        Clients won&apos;t be able to pay online until you connect again. Payments already made are not affected.
      </ConfirmDialog>
    </div>
  )
}

export function CalendarConnect() {
  const { state, dispatch } = useStore()
  const current = state.business.calendarProvider
  return (
    <div className="stack">
      <p className={styles.help}>
        Two-way sync: your events, date holds and consults show up in your calendar, and busy times from your calendar
        block those times on your public booking page.
      </p>
      <div className={styles.providers} style={{ '--cols': 3 }}>
        {CALENDARS.map((c) => (
          <ProviderCard key={c.id} name={c.name}
            connected={current === c.id} otherConnected={Boolean(current) && current !== c.id}
            onConnect={() => { dispatch({ type: 'calendar/connect', provider: c.id }); dispatch({ type: 'toast/show', text: `${c.name} connected` }) }}
            onDisconnect={() => { dispatch({ type: 'calendar/disconnect' }); dispatch({ type: 'toast/show', text: `${c.name} disconnected` }) }} />
        ))}
      </div>
    </div>
  )
}
