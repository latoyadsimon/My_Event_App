// =====================================================================
// The recognition screen (DN-7), /screen/giving/:eventId, at the venue:
// a live thermometer toward the goal, donor names (never the anonymous
// ones), messages a person has approved, and approved sponsor logos.
// A QR sends people to the give page.
// =====================================================================
import { useParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { fundTotals, getEvent, recognition } from '../../store/selectors'
import { getTheme, themeToCssVars, DEFAULT_THEME_FOR_EVENT_TYPE } from '../../styles/themes'
import { formatMoney } from '../../lib/money'
import { QrCode } from '../../components/ui'
import NotFound from '../shared/NotFound'
import styles from './giving.module.css'

const dollars = (cents) => formatMoney(cents).replace('.00', '')

export default function GivingScreen() {
  const { eventId } = useParams()
  const { state } = useStore()
  const event = getEvent(state, eventId)
  if (!event) return <NotFound what="event" standalone />
  const theme = getTheme(event.theme) ?? getTheme(DEFAULT_THEME_FOR_EVENT_TYPE[event.type])
  const f = fundTotals(state, event.id)
  const r = recognition(state, event.id)
  return (
    <main id="main" tabIndex={-1} className={styles.screen} style={themeToCssVars(theme)}>
      <h1 className={styles.title}>{event.fund?.name || event.name}</h1>
      <section className={styles.thermo} aria-label="Raised so far">
        <div className={styles.tube} role="progressbar" aria-label="Toward the goal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={f.percent}>
          <span style={{ height: `${f.percent}%` }} />
        </div>
        <div>
          <p className={styles.raised}>{dollars(f.raisedCents)}</p>
          {f.goalCents > 0 && <p className={styles.goal}>of {dollars(f.goalCents)} · {f.percent}%</p>}
          <p className={styles.goal}>{f.donors} donors</p>
        </div>
      </section>
      {r.names.length > 0 && (
        <section aria-label="Thank you">
          <h2 className={styles.label}>Thank you</h2>
          <ul role="list" className={styles.names}>{r.names.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
      )}
      {r.messages.length > 0 && (
        <section aria-label="Messages">
          <ul role="list" className={styles.messages}>{r.messages.slice(0, 4).map((d) => <li key={d.id}>“{d.message}”<span>{d.anonymous ? 'A friend' : d.name}</span></li>)}</ul>
        </section>
      )}
      {r.sponsors.length > 0 && (
        <section aria-label="Our sponsors">
          <h2 className={styles.label}>Our sponsors</h2>
          <ul role="list" className={styles.sponsors}>
            {r.sponsors.map((s) => <li key={s.id}>{s.logo ? <img src={s.logo} alt={s.company} /> : <span>{s.company}</span>}<small>{s.tier?.name}</small></li>)}
          </ul>
        </section>
      )}
      <div className={styles.foot}>
        <QrCode value={`${window.location.origin}/e/${event.id}/give`} size={110} label="QR code to give" />
        <p>Scan to give · {window.location.host}/e/{event.id}/give</p>
      </div>
    </main>
  )
}
