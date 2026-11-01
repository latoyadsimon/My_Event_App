// =====================================================================
// Guest › Request a song (GU-5.5), /e/:slug/karaoke, from the table QR.
// Search by title or artist; songs that aren't allowed tonight show as
// "Not available tonight" (no shaming) with the clean version suggested
// when there is one. Name or stage name, duet partner, optional phone for
// the "2 singers away" text. Then: your place in line, live.
// This phone remembers its requests for the night (?r= in the link).
// =====================================================================
import { useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { getSong, placeInLine, searchSongs } from '../../store/selectors'
import { newId } from '../../store/helpers'
import { Button, Field } from '../../components/ui'
import styles from './guest.module.css'

function MyRequest({ id, t }) {
  const { state } = useStore()
  const r = state.songRequests.find((x) => x.id === id)
  if (!r) return null
  const place = placeInLine(state, id)
  const song = getSong(state, r.songId)
  const words = r.status === 'done' ? t('sung') : place === 0 ? t('singingNow') : place === 1 ? t('upNext') : place == null ? null : t('yourPlace', { n: place })
  if (!words) return null
  return (
    <section className={styles.checkIn} aria-live="polite" aria-label={song.title}>
      <strong className={styles.checkInCode}>{words}</strong>
      <span className={styles.muted}>“{song.title}” · {r.stageName || r.singer}</span>
    </section>
  )
}

export default function Karaoke() {
  const { event, guest, t } = useOutletContext()
  const { state, dispatch } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [songId, setSongId] = useState(null)
  const [v, setV] = useState({ singer: guest?.name?.split(' ')[0] ?? '', stageName: '', partner: '', contact: guest?.phone ?? '' })
  const mine = (params.get('r') ?? '').split(',').filter(Boolean)
  if (!event.karaoke?.enabled) return <p>{t('karaokeOff')}</p>

  const results = searchSongs(state, event.id, q)
  const chosen = songId && getSong(state, songId)
  const submit = (e) => {
    e.preventDefault()
    const id = newId('kr')
    dispatch({ type: 'karaoke/request', eventId: event.id, id, songId, singer: v.singer, stageName: v.stageName, partners: [v.partner], contact: v.contact, source: 'phone' })
    setParams((p) => { p.set('r', [...mine, id].join(',')); return p }, { replace: true })
    setSongId(null); setQ('')
  }
  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.siteTitle}>{t('karaoke')}</h1>
        <p className={styles.welcome}>{event.name}</p>
      </header>
      {mine.map((id) => <MyRequest key={id} id={id} t={t} />)}
      <section className={styles.panel} aria-labelledby="h-song">
        <h2 id="h-song" className={styles.panelTitle}>{mine.length ? t('anotherSong') : t('karaoke')}</h2>
        <p className={styles.muted}>{t('karaokeLead')}</p>
        <Field label={t('searchSongs')} value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        {q.trim() && (results.length === 0
          ? <p className={styles.muted}>{t('noSongs')}</p>
          : (
            <ul role="list" className={styles.songs} aria-label={t('searchSongs')}>
              {results.map((s) => (
                <li key={s.id}>
                  <span><strong>{s.title}</strong><span className={styles.muted}> · {s.artist}{s.duet ? ` · ${t('duet')}` : ''}</span>
                    {s.status !== 'ok' && <span className={styles.songNote}>{t('unavailable')}{s.clean && <> · <button type="button" className="link-button" onClick={() => setSongId(s.clean.id)}>{t('tryClean', { title: s.clean.title })}</button></>}</span>}
                  </span>
                  {s.status === 'ok' && <Button size="small" variant={songId === s.id ? 'primary' : undefined} aria-pressed={songId === s.id} onClick={() => setSongId(s.id)}>{songId === s.id ? t('chosen') : t('choose')}<span className="visually-hidden">: {s.title}</span></Button>}
                </li>
              ))}
            </ul>
          ))}
        {chosen && (
          <form className="stack" onSubmit={submit}>
            <p><strong>“{chosen.title}”</strong> · {chosen.artist}</p>
            <div className={styles.formGrid}>
              <Field label={t('singerName')} value={v.singer} onChange={(e) => setV({ ...v, singer: e.target.value })} autoComplete="given-name" />
              <Field label={t('stageName')} value={v.stageName} onChange={(e) => setV({ ...v, stageName: e.target.value })} />
              <Field label={t('duetWith')} value={v.partner} onChange={(e) => setV({ ...v, partner: e.target.value })} />
              <Field label={t('phoneForText')} type="tel" value={v.contact} onChange={(e) => setV({ ...v, contact: e.target.value })} autoComplete="tel" />
            </div>
            <Button type="submit" variant="primary" disabled={!v.singer.trim()}>{t('addToLine')}</Button>
          </form>
        )}
      </section>
    </>
  )
}
