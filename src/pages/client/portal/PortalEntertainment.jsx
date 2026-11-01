// =====================================================================
// Portal › Booth & karaoke (CL-3.7): pick the photo booth overlay and
// magnet frame, and give the KJ must-play and do-not-play lists.
// Shown when the event has a booth or karaoke.
// =====================================================================
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getPortal } from '../../../store/selectors'
import { BOOTH_OVERLAYS, MAGNET_FRAMES } from '../../../data/seedBooth'
import PhotoTile from '../../../components/booth/PhotoTile'
import { Button, Card, Field, PageHeader } from '../../../components/ui'
import SongPicker from '../../../components/karaoke/SongPicker'
import styles from './portal.module.css'

export default function PortalEntertainment() {
  const { state, dispatch } = useStore()
  const { event } = getPortal(state)
  const [must, setMust] = useState(event?.karaoke?.mustPlay ?? [])
  const [never, setNever] = useState(event?.karaoke?.doNotPlay ?? [])
  const [overlay, setOverlay] = useState(event?.booth?.overlay ?? 'classic')
  const [frame, setFrame] = useState(event?.booth?.magnetFrame ?? 'classic')
  if (!event?.karaoke?.enabled && !event?.booth?.enabled) return <Navigate to="/portal" replace />
  const sample = { id: 'sample', source: 'booth', hue: 330 }
  return (
    <>
      <PageHeader title={event.booth?.enabled && event.karaoke?.enabled ? 'Booth & karaoke' : event.booth?.enabled ? 'Photo booth' : 'Karaoke'}
        sub={event.karaoke?.enabled ? `Karaoke: ${event.karaoke.filter === 'clean' ? 'clean versions only' : 'all songs allowed'}` : undefined} />
      {event.booth?.enabled && (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'booth/setChoices', eventId: event.id, overlay, magnetFrame: frame }) }}>
          <Card title="Photo booth look">
            <div className={styles.boothChoice}>
              <div className="stack">
                <Field label="Photo overlay" as="select" value={overlay} onChange={(e) => setOverlay(e.target.value)}>
                  {BOOTH_OVERLAYS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </Field>
                {event.booth.magnets > 0 && (
                  <Field label="Magnet frame" as="select" value={frame} onChange={(e) => setFrame(e.target.value)}>
                    {MAGNET_FRAMES.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </Field>
                )}
                <Button type="submit" variant="primary">Save booth choices</Button>
              </div>
              <PhotoTile photo={sample} event={event} overlay={overlay} label={`Preview: ${BOOTH_OVERLAYS.find((o) => o.id === overlay).name}`} />
            </div>
          </Card>
        </form>
      )}
      {event.karaoke?.enabled && <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'karaoke/setLists', eventId: event.id, mustPlay: must, doNotPlay: never }) }}>
        <Card title="Songs to play">
          <SongPicker label="Must-play" value={must} onChange={setMust} hint="The KJ works these in (the closer, your first-dance song…)" />
        </Card>
        <Card title="Songs to skip">
          <SongPicker label="Do-not-play" value={never} onChange={setNever} hint="Guests who ask for these see “Not available tonight”" />
        </Card>
        <Button type="submit" variant="primary">Save my lists</Button>
      </form>}
    </>
  )
}
