// =====================================================================
// Event Hub › Logistics › Booth & karaoke (PL-6.4): set it up before the
// event so it runs itself.
//   Karaoke: on/off, content filter (clean only = explicit blocked), the
//   client's do-not-play and must-play lists (CL-3.7), your banned list,
//   the KJ, songs per singer in line, contest mode; links to the KJ
//   console, the big screen and the guest request page (table QR).
//   [Download for offline] puts the event on the tablets.
// =====================================================================
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { karaokeStats } from '../../../store/selectors'
import { formatDateTime } from '../../../lib/clock'
import { Button, Card, Field, Icon } from '../../../components/ui'
import SongPicker from '../../../components/karaoke/SongPicker'
import styles from './hub.module.css'

function KaraokeSetup({ event }) {
  const { state, dispatch } = useStore()
  const k = event.karaoke
  const set = (changes) => dispatch({ type: 'karaoke/configure', eventId: event.id, changes })
  const kjs = state.team.filter((m) => m.status === 'active' && (m.skills ?? []).includes('KJ'))
  const stats = karaokeStats(state, event.id)
  return (
    <Card title="Karaoke" action={k.enabled && <Button size="small" variant="primary" to={`/app/kj/${event.id}`}>Open KJ console</Button>}>
      <label className={styles.check}><input type="checkbox" checked={k.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Karaoke at this event</label>
      {k.enabled && (
        <div className="stack">
          <div className={styles.grid2}>
            <Field label="Songs allowed" as="select" value={k.filter} onChange={(e) => set({ filter: e.target.value })} hint="Clean only blocks explicit songs; guests see the clean version when there is one">
              <option value="clean">Clean only</option>
              <option value="all">All songs</option>
            </Field>
            <Field label="KJ" as="select" value={k.kjMemberId ?? ''} onChange={(e) => set({ kjMemberId: e.target.value || null })}>
              <option value="">Not assigned</option>
              {kjs.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Field>
            <Field label="Songs each singer can have waiting" type="number" min="1" max="5" value={k.perSinger} onChange={(e) => set({ perSinger: Math.max(1, Number(e.target.value) || 1) })} />
          </div>
          <label className={styles.check}><input type="checkbox" checked={k.contest} onChange={(e) => set({ contest: e.target.checked })} /> Contest mode (judges score each singer; results on the big screen)</label>
          <div className={styles.grid2}>
            <SongPicker label="Must-play" value={k.mustPlay} onChange={(mustPlay) => set({ mustPlay })} hint="From the client; you can edit too" />
            <SongPicker label="Do-not-play" value={k.doNotPlay} onChange={(doNotPlay) => set({ doNotPlay })} hint="From the client" />
          </div>
          <SongPicker label="Banned" value={k.banned} onChange={(banned) => set({ banned })} hint="Yours, for every request tonight" />
          <div className="cluster">
            <Button to={`/screen/karaoke/${event.id}`}><Icon name="external" size={14} /> Big screen</Button>
            <Button to={`/e/${event.id}/karaoke`}>Guest request page (table QR)</Button>
            <Button onClick={() => dispatch({ type: 'karaoke/downloadOffline', eventId: event.id })}>Download for offline</Button>
            {k.offlineAt && <span className="muted">On the tablets since {formatDateTime(k.offlineAt)}</span>}
          </div>
          {stats.sung > 0 && <p className="muted">{stats.sung} songs by {stats.singers} singers{stats.topSong ? `; most sung: “${stats.topSong.title}”` : ''}.</p>}
        </div>
      )}
    </Card>
  )
}

export default function Entertainment() {
  const { event } = useOutletContext()
  return (
    <div className="stack">
      <KaraokeSetup event={event} />
    </div>
  )
}
