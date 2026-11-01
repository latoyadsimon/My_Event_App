// =====================================================================
// Guest › Photos (GU-5.6, GU-6.1), /e/:slug/gallery: the booth's photos on
// my phone, my own session first (?s= from the booth's text), download,
// upload mine, and recipes when it was a potluck. Private galleries need
// the guest's link (?t=); galleries close on the planner's date (CL-6.1).
// Kids' photos never appear here (NFR-14).
//
// Guest › Photo magnet (GU-5.4), /e/:slug/magnet: from the station QR.
// =====================================================================
import { useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { galleryAccess, getPhotos, magnetsLeft } from '../../store/selectors'
import { guestDate } from '../../lib/guestText'
import { Button, Field } from '../../components/ui'
import PhotoTile from '../../components/booth/PhotoTile'
import styles from './guest.module.css'

function Upload({ event, guest, t }) {
  const { dispatch } = useStore()
  const [files, setFiles] = useState([])
  const [by, setBy] = useState(guest?.name ?? '')
  return (
    <form className="stack" onSubmit={(e) => {
      e.preventDefault()
      for (const f of files) dispatch({ type: 'photo/upload', eventId: event.id, by, name: f.name, src: f.type?.startsWith('image/') ? URL.createObjectURL(f) : null })
      setFiles([]); e.target.reset()
    }}>
      <div className={styles.formGrid}>
        <Field label={t('choosePhotos')} type="file" accept="image/*" multiple onChange={(e) => setFiles([...(e.target.files ?? [])])} />
        <Field label={t('yourNameOptional')} value={by} onChange={(e) => setBy(e.target.value)} />
      </div>
      <Button type="submit" disabled={!files.length}>{t('upload')}</Button>
    </form>
  )
}

function Recipes({ event, guest, t }) {
  const { state, dispatch } = useStore()
  const [v, setV] = useState({ dish: '', text: '' })
  const list = state.recipes.filter((r) => r.eventId === event.id)
  return (
    <section className={styles.panel} aria-labelledby="h-recipes">
      <h2 id="h-recipes" className={styles.panelTitle}>{t('recipes')}</h2>
      {list.map((r) => <article key={r.id}><h3 className={styles.legend}>{r.dish} · {r.by}</h3><p className={styles.recipe}>{r.text}</p></article>)}
      <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'recipe/post', eventId: event.id, by: guest?.name, ...v }); setV({ dish: '', text: '' }) }}>
        <Field label={t('recipeDish')} value={v.dish} onChange={(e) => setV({ ...v, dish: e.target.value })} />
        <Field label={t('recipeText')} as="textarea" rows={4} value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} />
        <Button type="submit" disabled={!v.dish.trim() || !v.text.trim()}>{t('post')}</Button>
      </form>
    </section>
  )
}

export default function Gallery() {
  const { event, guest, token, t, lang } = useOutletContext()
  const { state, dispatch } = useStore()
  const [params] = useSearchParams()
  const session = params.get('s')
  const preview = params.get('preview') === '1' || state.ui.role === 'planner'
  const access = preview ? 'open' : galleryAccess(event, Boolean(token || session))
  if (access !== 'open') return <section className={styles.panel}><p>{access === 'expired' ? t('galleryExpired') : t('galleryPrivate')}</p></section>

  const photos = getPhotos(state, event.id, 'gallery')
  const mine = session ? photos.filter((p) => p.sessionId === session) : []
  const rest = photos.filter((p) => !mine.includes(p))
  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.siteTitle}>{t('gallery')}</h1>
        <p className={styles.welcome}>{event.name}</p>
        <p className={styles.muted}>{t('galleryLead')}{event.booth?.galleryExpires && <> {t('galleryUntil', { date: guestDate(event.booth.galleryExpires, lang, false) })}.</>}</p>
      </header>
      {mine.length > 0 && (
        <section className={styles.panel} aria-labelledby="h-mine">
          <h2 id="h-mine" className={styles.panelTitle}>{t('yourPhotos')}</h2>
          <ul role="list" className={styles.photoGrid}>{mine.map((p) => <li key={p.id}><PhotoTile photo={p} event={event} /></li>)}</ul>
        </section>
      )}
      <section className={styles.panel} aria-labelledby="h-all">
        <h2 id="h-all" className={styles.panelTitle}>{t('allPhotos')} ({rest.length})</h2>
        {rest.length === 0 ? <p className={styles.muted}>{t('noPhotos')}</p>
          : <ul role="list" className={styles.photoGrid}>{rest.map((p) => <li key={p.id}><PhotoTile photo={p} event={event} /></li>)}</ul>}
        {photos.length > 0 && <Button onClick={() => dispatch({ type: 'gallery/downloadAll', eventId: event.id })}>{t('downloadAll')}</Button>}
      </section>
      <section className={styles.panel} aria-labelledby="h-add">
        <h2 id="h-add" className={styles.panelTitle}>{t('addYours')}</h2>
        <Upload event={event} guest={guest} t={t} />
      </section>
      {event.potluck?.enabled && <Recipes event={event} guest={guest} t={t} />}
      <p><Link to={token ? `/e/${event.id}?t=${token}` : `/e/${event.id}`}>{t('backToSite')}</Link></p>
    </>
  )
}

export function Magnet() {
  const { event, guest, t } = useOutletContext()
  const { state, dispatch } = useStore()
  const [file, setFile] = useState(null)
  const [by, setBy] = useState(guest?.name ?? '')
  if (!event.booth?.enabled || !event.booth.magnets) return <p>{t('magnetsGone')}</p>
  const left = magnetsLeft(state, event.id)
  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.siteTitle}>{t('magnet')}</h1>
        <p className={styles.welcome}>{event.name}</p>
      </header>
      <section className={styles.panel}>
        <p className={styles.muted}>{t('magnetLead')}</p>
        {left <= 0 ? <p>{t('magnetsGone')}</p> : (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'magnet/request', eventId: event.id, by, src: file?.type?.startsWith('image/') ? URL.createObjectURL(file) : null }); setFile(null); e.target.reset() }}>
            <Field label={t('yourPhoto')} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Field label={t('singerName')} value={by} onChange={(e) => setBy(e.target.value)} autoComplete="given-name" />
            <Button type="submit" variant="primary" disabled={!file || !by.trim()}>{t('makeMagnet')}</Button>
          </form>
        )}
      </section>
    </>
  )
}
