// =====================================================================
// The KJ console (ST-4.5), for the KJ's tablet:
//   /app/staff/kj/:eventId   (staff app)   /app/kj/:eventId   (planner)
// Now singing + Next singer (updates the big screen, texts the guest who
// is 2 away) · No-show (end of the line once, then removed) · the fair
// queue with ↑ ↓, VIP bump and remove (Undo) · add a paper/verbal request
// · background music · contest mode with judge scores · the night's
// filter, banned and must-play lists.
//
// KaraokeScreen (/screen/karaoke/:eventId) is the big screen at the venue.
// =====================================================================
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { contestResults, getEvent, getSong, karaokeQueue, karaokeStats, searchSongs } from '../../store/selectors'
import { getTheme, themeToCssVars, DEFAULT_THEME_FOR_EVENT_TYPE } from '../../styles/themes'
import { Button, Card, EmptyState, Field, Icon, Notice, PageHeader, StatusChip } from '../../components/ui'
import NotFound from '../shared/NotFound'
import styles from './karaoke.module.css'

const JUDGES = ['Judge 1', 'Judge 2', 'Judge 3']
const who = (r) => [r.stageName || r.singer, ...r.partners].join(' & ')

function AddRequest({ event }) {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')
  const [singer, setSinger] = useState('')
  const [songId, setSongId] = useState('')
  const results = searchSongs(state, event.id, q).filter((s) => s.status === 'ok')
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'karaoke/request', eventId: event.id, songId, singer, source: 'manual' }); setQ(''); setSinger(''); setSongId('') }}>
      <div className={styles.grid2}>
        <Field label="Find a song" value={q} onChange={(e) => { setQ(e.target.value); setSongId('') }} autoComplete="off" />
        <Field label="Singer" value={singer} onChange={(e) => setSinger(e.target.value)} />
      </div>
      {results.length > 0 && (
        <Field label="Song" as="select" value={songId} onChange={(e) => setSongId(e.target.value)}>
          <option value="">Choose a song</option>
          {results.map((s) => <option key={s.id} value={s.id}>{s.title} · {s.artist}</option>)}
        </Field>
      )}
      <Button type="submit" disabled={!songId || !singer.trim()}>Add to the line</Button>
    </form>
  )
}

function Contest({ event, current }) {
  const { state, dispatch } = useStore()
  const results = contestResults(state, event.id)
  return (
    <Card title="Contest">
      {current && (
        <div className={styles.judges} role="group" aria-label={`Scores for ${who(current)}`}>
          {JUDGES.map((j) => (
            <Field key={j} label={j} as="select" value={current.scores.find((s) => s.judge === j)?.score ?? ''}
              onChange={(e) => dispatch({ type: 'karaoke/score', id: current.id, judge: j, score: e.target.value })}>
              <option value="">–</option>
              {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => <option key={n} value={n}>{n}</option>)}
            </Field>
          ))}
        </div>
      )}
      {results.length === 0 ? <p className="muted">Scores show here and on the big screen.</p> : (
        <ol className={styles.leader} aria-label="Leaderboard">
          {results.map((r) => <li key={r.id}><span>{who(r)} · {r.song.title}</span><strong>{r.average.toFixed(1)}</strong></li>)}
        </ol>
      )}
    </Card>
  )
}

export default function KjConsole() {
  const { eventId } = useParams()
  const { state, dispatch } = useStore()
  const event = getEvent(state, eventId)
  if (!event) return <NotFound what="event" />
  const k = event.karaoke
  if (!k?.enabled) return <EmptyState title="Karaoke is off for this event">Turn it on in the event’s Logistics › Booth &amp; karaoke.</EmptyState>
  const line = karaokeQueue(state, event.id)
  const singing = line.find((r) => r.status === 'singing')
  const queued = line.filter((r) => r.status === 'queued')
  const stats = karaokeStats(state, event.id)
  const must = k.mustPlay.map((id) => getSong(state, id)).filter(Boolean)
  const remove = (r) => {
    dispatch({ type: 'karaoke/remove', id: r.id })
    dispatch({ type: 'toast/show', text: `Removed ${who(r)}`, undo: { type: 'karaoke/restore', id: r.id } })
  }

  return (
    <div className={styles.console}>
      <PageHeader title="KJ console" sub={`${event.name} · ${k.filter === 'clean' ? 'Clean versions only' : 'All songs'} · ${stats.sung} sung · ${queued.length} waiting`}
        actions={<Button size="small" to={`/screen/karaoke/${event.id}`}><Icon name="external" size={14} /> Big screen</Button>} />
      {event.status !== 'event_day' && <Notice>Practice mode: the event day hasn&apos;t started. Everything works, so you can rehearse.</Notice>}

      <section className={styles.now} aria-label="Now singing">
        <span className={styles.label}>Now singing</span>
        {singing
          ? <><span className={styles.nowSong}>{singing.song.title}</span><span>{who(singing)}{singing.vip && ' · VIP'}</span></>
          : <span className={styles.nowSong}>{queued.length ? 'Ready when you are' : 'Nobody in line yet'}</span>}
        <div className={styles.buttons}>
          <Button variant="primary" onClick={() => dispatch({ type: 'karaoke/next', eventId: event.id })} disabled={!queued.length && !singing}>Next singer</Button>
          {singing && <Button onClick={() => dispatch({ type: 'karaoke/noShow', id: singing.id })}>No-show</Button>}
          <Button aria-pressed={k.music} onClick={() => dispatch({ type: 'karaoke/configure', eventId: event.id, changes: { music: !k.music } })}>
            {k.music ? 'Background music on' : 'Background music off'}
          </Button>
        </div>
      </section>

      <Card title={`Up next (${queued.length})`}>
        {queued.length === 0 ? <p className="muted">Guests request from the table QR, or add one below.</p> : (
          <ol className={styles.queue} aria-label="Queue">
            {queued.map((r, i) => (
              <li key={r.id}>
                <span className={styles.pos}>{i + 1}</span>
                <span className={styles.who}><strong>{who(r)}</strong> · {r.song.title}
                  <span className={styles.sub}>{r.song.artist}{r.source === 'manual' ? ' · added by KJ' : ''}{r.skippedOnce ? ' · missed once' : ''}</span>
                </span>
                {r.vip && <StatusChip tone="info" label="VIP" />}
                <span className={styles.tools}>
                  <Button size="small" onClick={() => dispatch({ type: 'karaoke/move', id: r.id, dir: -1 })} disabled={i === 0} aria-label={`Move ${who(r)} up`}>↑</Button>
                  <Button size="small" onClick={() => dispatch({ type: 'karaoke/move', id: r.id, dir: 1 })} disabled={i === queued.length - 1} aria-label={`Move ${who(r)} down`}>↓</Button>
                  {!r.vip && <Button size="small" onClick={() => dispatch({ type: 'karaoke/vip', id: r.id })} aria-label={`Bump ${who(r)} to next (VIP)`}>VIP</Button>}
                  {i === 0 && <Button size="small" onClick={() => dispatch({ type: 'karaoke/noShow', id: r.id })} aria-label={`${who(r)} is a no-show`}>No-show</Button>}
                  <Button size="small" variant="danger" onClick={() => remove(r)} aria-label={`Remove ${who(r)}`}><Icon name="close" size={14} /></Button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title="Add a paper or verbal request"><AddRequest event={event} /></Card>
      {k.contest && <Contest event={event} current={singing} />}

      <Card title="Tonight's lists">
        <p><strong>Must-play</strong> (from the client): {must.length ? must.map((s) => `${s.title} (${s.artist})`).join(', ') : 'none'}</p>
        <p className="muted">{k.doNotPlay.length} do-not-play from the client · {k.banned.length} banned by you · requests for these show guests “Not available tonight”.</p>
        <Link to={`/e/${event.id}/karaoke`}>Guest request page (the table QR)</Link>
      </Card>
    </div>
  )
}

/** /screen/karaoke/:eventId: the big screen at the venue (no app chrome, event theme). */
export function KaraokeScreen() {
  const { eventId } = useParams()
  const { state } = useStore()
  const event = getEvent(state, eventId)
  if (!event) return <NotFound what="event" standalone />
  const theme = getTheme(event.theme) ?? getTheme(DEFAULT_THEME_FOR_EVENT_TYPE[event.type])
  const line = karaokeQueue(state, event.id)
  const singing = line.find((r) => r.status === 'singing')
  const next = line.filter((r) => r.status === 'queued').slice(0, 3)
  const results = event.karaoke?.contest ? contestResults(state, event.id).slice(0, 3) : []
  return (
    <main className={styles.screen} style={themeToCssVars(theme)}>
      <h1 className={styles.screenTitle}>{event.name}</h1>
      <section aria-label="Now singing" className={styles.screenNow}>
        <span className={styles.label}>Now singing</span>
        <span className={styles.screenSong}>{singing ? singing.song.title : '♪'}</span>
        {singing && <span className={styles.screenWho}>{who(singing)}</span>}
      </section>
      {next.length > 0 && (
        <section aria-label="Up next">
          <span className={styles.label}>Up next</span>
          <ol className={styles.screenNext}>{next.map((r) => <li key={r.id}>{who(r)} · {r.song.title}</li>)}</ol>
        </section>
      )}
      {results.length > 0 && (
        <section aria-label="Leaderboard">
          <span className={styles.label}>Leaderboard</span>
          <ol className={styles.screenNext}>{results.map((r) => <li key={r.id}>{who(r)} · {r.average.toFixed(1)}</li>)}</ol>
        </section>
      )}
      <p className={styles.screenFoot}>Scan the QR on your table to request a song · {window.location.host}/e/{event.id}/karaoke</p>
    </main>
  )
}
