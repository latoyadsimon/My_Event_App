// =====================================================================
// Portal › Karaoke (CL-3.7): the client's must-play and do-not-play
// lists for the KJ. (Booth overlay and magnet frame choices join here
// with the photo booth.) Shown when the event has karaoke.
// =====================================================================
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getPortal } from '../../../store/selectors'
import { Button, Card, PageHeader } from '../../../components/ui'
import SongPicker from '../../../components/karaoke/SongPicker'

export default function PortalEntertainment() {
  const { state, dispatch } = useStore()
  const { event } = getPortal(state)
  const [must, setMust] = useState(event?.karaoke?.mustPlay ?? [])
  const [never, setNever] = useState(event?.karaoke?.doNotPlay ?? [])
  if (!event?.karaoke?.enabled) return <Navigate to="/portal" replace />
  return (
    <>
      <PageHeader title="Karaoke" sub={`${event.karaoke.filter === 'clean' ? 'Clean versions only' : 'All songs allowed'} · your KJ sees these lists`} />
      <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'karaoke/setLists', eventId: event.id, mustPlay: must, doNotPlay: never }) }}>
        <Card title="Songs to play">
          <SongPicker label="Must-play" value={must} onChange={setMust} hint="The KJ works these in (the closer, your first-dance song…)" />
        </Card>
        <Card title="Songs to skip">
          <SongPicker label="Do-not-play" value={never} onChange={setNever} hint="Guests who ask for these see “Not available tonight”" />
        </Card>
        <Button type="submit" variant="primary">Save my lists</Button>
      </form>
    </>
  )
}
