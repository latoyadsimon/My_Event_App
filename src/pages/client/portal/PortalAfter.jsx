// =====================================================================
// After the event, in the client portal (product Phase 3):
//   PortalGallery    /portal/gallery     every photo: booth, magnet scans, guest uploads;
//                                        Download all (full resolution); closes on the
//                                        planner's date (CL-6.1). Kids' booth shots are
//                                        here for the hosts, marked private.
//   PortalThankYous  /portal/thank-yous  gifts noted per guest; mark thank-you sent (CL-6.2)
// =====================================================================
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getPhotos, getPortal, thankYouList } from '../../../store/selectors'
import { formatDay, formatDayShort } from '../../../lib/clock'
import { Button, Card, EmptyState, Field, PageHeader, StatusChip } from '../../../components/ui'
import PhotoTile from '../../../components/booth/PhotoTile'
import styles from './portal.module.css'

const SOURCES = [['all', 'All'], ['booth', 'Booth'], ['magnet', 'Magnets'], ['guest', 'Guest uploads']]

export function PortalGallery() {
  const { state, dispatch } = useStore()
  const { event } = getPortal(state)
  const [source, setSource] = useState('all')
  if (!event) return <Navigate to="/portal" replace />
  const photos = getPhotos(state, event.id, 'all')
  const shown = photos.filter((p) => source === 'all' || p.source === source)
  return (
    <>
      <PageHeader title="Gallery" sub={event.booth?.galleryExpires ? `Open until ${formatDay(event.booth.galleryExpires)}. Download what you want to keep.` : event.name}
        actions={photos.length > 0 && <Button variant="primary" onClick={() => dispatch({ type: 'gallery/downloadAll', eventId: event.id })}>Download all</Button>} />
      {event.galleryZipAt && <p className="muted">Your zip of {photos.length} full-resolution photos is ready (prepared {formatDayShort(event.galleryZipAt)}).</p>}
      <div className={styles.segmented} role="group" aria-label="Show">
        {SOURCES.map(([id, label]) => <button key={id} type="button" aria-pressed={source === id} onClick={() => setSource(id)}>{label}</button>)}
      </div>
      {shown.length === 0
        ? <EmptyState title="No photos here yet">Booth photos, magnets and the photos your guests upload all land here.</EmptyState>
        : (
          <ul role="list" className={styles.photoGrid} aria-label="Photos">
            {shown.map((p) => <li key={p.id}><PhotoTile photo={p} event={event}>{p.child && <StatusChip tone="info" label="Private (kids)" />}</PhotoTile></li>)}
          </ul>
        )}
      <p className="muted">Guests can add theirs at the gallery link in their thank-you message.</p>
    </>
  )
}

function GiftRow({ guest }) {
  const { dispatch } = useStore()
  const [gift, setGift] = useState(guest.gift)
  return (
    <li className={styles.giftRow}>
      <label className={styles.check}>
        <input type="checkbox" checked={Boolean(guest.thankYouAt)} onChange={(e) => dispatch({ type: 'guest/thankYou', guestId: guest.id, sent: e.target.checked })} />
        <span><strong>{guest.name}</strong>{guest.thankYouAt && <span className="muted"> · sent {formatDayShort(guest.thankYouAt)}</span>}</span>
      </label>
      <Field label={`Gift from ${guest.name}`} value={gift} onChange={(e) => setGift(e.target.value)} onBlur={() => gift !== guest.gift && dispatch({ type: 'guest/setGift', guestId: guest.id, gift })} />
    </li>
  )
}

export function PortalThankYous() {
  const { state, dispatch } = useStore()
  const { event } = getPortal(state)
  const [guestId, setGuestId] = useState('')
  const [gift, setGift] = useState('')
  if (!event) return <Navigate to="/portal" replace />
  const list = thankYouList(state, event.id)
  const others = state.guests.filter((g) => g.eventId === event.id && !g.removed && !g.gift?.trim())
  const sent = list.filter((g) => g.thankYouAt).length
  return (
    <>
      <PageHeader title="Thank-yous" sub={list.length ? `${sent} of ${list.length} sent` : 'Note gifts here and tick each thank-you as you send it.'} />
      <Card title="Gifts and notes">
        {list.length === 0 ? <p className="muted">No gifts noted yet.</p> : <ul role="list" className={styles.gifts}>{list.map((g) => <GiftRow key={g.id} guest={g} />)}</ul>}
      </Card>
      {others.length > 0 && (
        <Card title="Note a gift">
          <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'guest/setGift', guestId, gift }); setGuestId(''); setGift('') }}>
            <Field label="Guest" as="select" value={guestId} onChange={(e) => setGuestId(e.target.value)}>
              <option value="">Choose a guest</option>
              {others.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Field>
            <Field label="Gift" value={gift} onChange={(e) => setGift(e.target.value)} />
            <Button type="submit" disabled={!guestId || !gift.trim()}>Add</Button>
          </form>
        </Card>
      )}
    </>
  )
}
