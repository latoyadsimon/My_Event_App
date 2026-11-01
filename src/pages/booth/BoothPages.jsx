// =====================================================================
// The photo booth at the venue (product Phase 3):
//   BoothKiosk      /booth/:eventId        the guests' screen (GU-5.3): tap to start,
//                                          3-2-1, three shots, retake, then share by text,
//                                          email or QR (opt-in), "Don't show on slideshow",
//                                          and kids in the photo = no contact asked, private
//   BoothAttendant  /app/booth/:eventId    the attendant's panel (ST-4.4): PIN, printer,
//                   /app/staff/booth/:id   paper/ink, held prints, reprints, magnet queue
//                                          (crop + print), hide photos, take over a dead tablet
//   Slideshow       /screen/gallery/:id    the live gallery on the big screen (GU-5.6)
// The demo has no camera: shots are drawn tiles (components/booth/PhotoTile).
// =====================================================================
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { boothStats, getEvent, getPhotos, magnetsLeft, printQueue } from '../../store/selectors'
import { newId } from '../../store/helpers'
import { BOOTH_PIN } from '../../data/seedBooth'
import { formatTime } from '../../lib/clock'
import { getTheme, themeToCssVars, DEFAULT_THEME_FOR_EVENT_TYPE } from '../../styles/themes'
import { Button, Card, EmptyState, Field, Icon, Kpis, Notice, PageHeader, StatusChip } from '../../components/ui'
import PhotoTile from '../../components/booth/PhotoTile'
import NotFound from '../shared/NotFound'
import styles from './booth.module.css'

const STEP_MS = import.meta.env.MODE === 'test' ? 1 : 900
const themed = (event) => themeToCssVars(getTheme(event.theme) ?? getTheme(DEFAULT_THEME_FOR_EVENT_TYPE[event.type]))

export function BoothKiosk() {
  const { eventId } = useParams()
  const { state, dispatch } = useStore()
  const [step, setStep] = useState('start')     // start · countdown · review · share · done
  const [count, setCount] = useState(3)
  const [take, setTake] = useState(0)
  const [child, setChild] = useState(null)
  const [contact, setContact] = useState('')
  const [hide, setHide] = useState(false)
  const event = getEvent(state, eventId)

  useEffect(() => {
    if (step !== 'countdown') return undefined
    if (count === 0) { const t = setTimeout(() => setStep('review'), STEP_MS); return () => clearTimeout(t) }
    const t = setTimeout(() => setCount((n) => n - 1), STEP_MS)
    return () => clearTimeout(t)
  }, [step, count])

  if (!event) return <NotFound what="event" standalone />
  if (!event.booth?.enabled) return <main id="main" tabIndex={-1} className={styles.kiosk} style={themed(event)}><p>The photo booth isn&apos;t on for this event.</p></main>

  const start = () => { setCount(3); setTake((n) => n + 1); setStep('countdown') }
  const reset = () => { setStep('start'); setChild(null); setContact(''); setHide(false) }
  const finish = () => {
    dispatch({ type: 'booth/session', eventId: event.id, id: newId('bs'), child, hideFromSlideshow: hide, share: child ? null : { to: contact } })
    setStep('done')
  }
  const preview = [0, 1, 2].map((i) => ({ id: `p${i}`, source: 'booth', hue: (take * 70 + i * 40) % 360 }))

  return (
    <main id="main" tabIndex={-1} className={styles.kiosk} style={themed(event)} aria-label="Photo booth">
      <h1 className={styles.kioskTitle}>{event.name}</h1>
      {step === 'start' && (
        <button type="button" className={styles.bigStart} onClick={start}>Tap to start</button>
      )}
      {step === 'countdown' && (
        <p className={styles.count} role="status" aria-live="assertive">{count > 0 ? count : 'Smile!'}</p>
      )}
      {step === 'review' && (
        <section className={styles.review} aria-label="Your photos">
          <div className={styles.strip}>{preview.map((p, i) => <PhotoTile key={p.id} photo={p} event={event} label={`Shot ${i + 1}`} />)}</div>
          <div className={styles.kioskButtons}>
            <Button onClick={start}>Retake</Button>
            <Button variant="primary" onClick={() => setStep('share')}>Looks great</Button>
          </div>
        </section>
      )}
      {step === 'share' && (
        <section className={styles.panel} aria-label="Get your photos">
          {child === null && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Is anyone in these photos under 13?</legend>
              <div className={styles.kioskButtons}>
                <Button onClick={() => setChild(true)}>Yes</Button>
                <Button onClick={() => setChild(false)}>No</Button>
              </div>
            </fieldset>
          )}
          {child === true && <p>Got it. We won&apos;t ask for any contact details, and these photos stay off the big screen. Your prints are on the way.</p>}
          {child === false && (
            <>
              <Field label="Text or email them to me (optional)" value={contact} onChange={(e) => setContact(e.target.value)} hint="Only used to send these photos" />
              <p className={styles.qr}><Icon name="external" size={14} /> Or scan the QR on the screen to open them on your phone</p>
              <label className={styles.check}><input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} /> Don&apos;t show on the slideshow</label>
            </>
          )}
          {child !== null && <Button variant="primary" onClick={finish}>Print {Math.min(event.booth.copies, event.booth.printLimit)} cop{Math.min(event.booth.copies, event.booth.printLimit) === 1 ? 'y' : 'ies'}</Button>}
        </section>
      )}
      {step === 'done' && (
        <section className={styles.panel} aria-live="polite">
          <p className={styles.doneText}>{event.booth.printer === 'ready' ? 'Your prints are coming out!' : 'Your prints are in line; the attendant will hand them to you.'}</p>
          <Button variant="primary" onClick={reset}>Done</Button>
        </section>
      )}
    </main>
  )
}

function Pin({ onOk }) {
  const [pin, setPin] = useState('')
  const [wrong, setWrong] = useState(false)
  return (
    <Card title="Unlock the booth">
      <form className={styles.inline} onSubmit={(e) => { e.preventDefault(); if (pin === BOOTH_PIN) onOk(); else setWrong(true) }}>
        <Field label="Attendant PIN" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} error={wrong ? 'That PIN didn’t work.' : undefined} hint="Demo PIN: 2468" />
        <Button type="submit" variant="primary">Unlock</Button>
      </form>
    </Card>
  )
}

const PRINTER = { ready: ['success', 'Printer ready'], jam: ['danger', 'Printer jam: printing paused'], out: ['danger', 'Out of paper: printing paused'] }

export function BoothAttendant() {
  const { eventId } = useParams()
  const { state, dispatch } = useStore()
  const [unlocked, setUnlocked] = useState(false)
  const [crops, setCrops] = useState({})
  const [device] = useState(() => newId('device'))
  const event = getEvent(state, eventId)
  if (!event) return <NotFound what="event" />
  if (!event.booth?.enabled) return <EmptyState title="The photo booth is off for this event">Turn it on in Logistics › Booth &amp; karaoke.</EmptyState>
  if (!unlocked) return <><PageHeader title="Booth attendant" sub={event.name} /><Pin onOk={() => setUnlocked(true)} /></>
  const b = event.booth
  const stats = boothStats(state, event.id)
  const queue = printQueue(state, event.id)
  const photos = getPhotos(state, event.id, 'all')
  const recent = state.prints.filter((p) => p.eventId === event.id && p.status === 'printed').slice(-6).reverse()
  const photoOf = (id) => state.photos.find((p) => p.id === id)

  return (
    <div className={styles.attendant}>
      <PageHeader title="Booth attendant" sub={event.name} actions={<Button size="small" to={`/screen/gallery/${event.id}`}><Icon name="external" size={14} /> Slideshow</Button>} />
      {b.deviceId && b.deviceId !== device && (
        <Notice tone="warning" action={<Button size="small" onClick={() => dispatch({ type: 'booth/takeOver', eventId: event.id, deviceId: device })}>Take over here</Button>}>
          Another tablet was running the booth. If it died, take over on this one; nothing is lost.
        </Notice>
      )}
      <Kpis label="Booth now" items={[
        { label: 'Sessions', value: stats.sessions },
        { label: 'Prints', value: stats.prints },
        { label: 'Paper', value: `${b.paper} sheets` },
        { label: 'Ink', value: `${b.ink}%` },
        ...(b.magnets ? [{ label: 'Magnets left', value: magnetsLeft(state, event.id) }] : []),
      ]} />
      <Card title="Printer" action={<StatusChip tone={PRINTER[b.printer][0]} label={PRINTER[b.printer][1]} />}>
        <div className="cluster">
          {b.printer === 'ready'
            ? <><Button onClick={() => dispatch({ type: 'booth/printer', eventId: event.id, status: 'jam' })}>Report a jam</Button><Button onClick={() => dispatch({ type: 'booth/printer', eventId: event.id, status: 'out' })}>Out of paper</Button></>
            : <Button variant="primary" onClick={() => dispatch({ type: 'booth/printer', eventId: event.id, status: 'ready' })}>Fixed: resume printing</Button>}
          <Button onClick={() => dispatch({ type: 'booth/refill', eventId: event.id, paper: 100, ink: true })}>Loaded 100 sheets + new ink</Button>
        </div>
      </Card>

      <Card title={`Waiting to print (${queue.length})`}>
        {queue.length === 0 ? <p className="muted">Nothing waiting.</p> : (
          <ul role="list" className={styles.queue} aria-label="Print queue">
            {queue.map((p) => (
              <li key={p.id}>
                <PhotoTile photo={photoOf(p.photoId)} event={event} overlay={p.kind === 'magnet' ? b.magnetFrame : b.overlay} label={`${p.kind === 'magnet' ? 'Magnet' : 'Strip'} for ${photoOf(p.photoId).by}`} />
                <div className={styles.queueInfo}>
                  <strong>{p.kind === 'magnet' ? `Magnet for ${photoOf(p.photoId).by}` : `Strip × ${p.copies}`}</strong>
                  <span className="muted">{formatTime(p.at)} · {p.status === 'held' ? 'held until the printer is fixed' : 'waiting'}</span>
                  {p.kind === 'magnet' && (
                    <div className={styles.inline}>
                      <Field label="Crop" as="select" value={crops[p.id] ?? p.crop} onChange={(e) => setCrops({ ...crops, [p.id]: e.target.value })}>
                        <option value="center">Center</option><option value="top">Faces (top)</option><option value="full">Whole photo</option>
                      </Field>
                      <Button variant="primary" onClick={() => dispatch({ type: 'magnet/print', printId: p.id, crop: crops[p.id] ?? p.crop })}>Print magnet</Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {recent.length > 0 && (
        <Card title="Just printed">
          <ul role="list" className={styles.rows}>
            {recent.map((p) => (
              <li key={p.id}><span>{p.kind === 'magnet' ? 'Magnet' : `Strip × ${p.copies}`} · {formatTime(p.printedAt ?? p.at)}</span>
                <Button size="small" onClick={() => dispatch({ type: 'booth/reprint', printId: p.id })}>Reprint</Button></li>
            ))}
          </ul>
        </Card>
      )}

      <Card title={`Photos (${photos.length})`}>
        {photos.length === 0 ? <p className="muted">Photos show here as guests use the booth.</p> : (
          <ul role="list" className={styles.grid} aria-label="Photos">
            {photos.map((p) => (
              <li key={p.id}>
                <PhotoTile photo={p} event={event}>
                  {p.child ? <StatusChip tone="info" label="Kids: private" /> : (
                    <button type="button" className="link-button" onClick={() => dispatch({ type: 'photo/hide', photoId: p.id, hidden: !p.hidden })}>
                      {p.hidden ? 'Show on slideshow' : 'Hide from slideshow'}
                    </button>
                  )}
                </PhotoTile>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

/** The live gallery on the big screen (GU-5.6): newest first, hidden and kids' photos left out. */
export function Slideshow() {
  const { eventId } = useParams()
  const { state } = useStore()
  const event = getEvent(state, eventId)
  if (!event) return <NotFound what="event" standalone />
  const photos = getPhotos(state, event.id, 'slideshow').slice(0, 12)
  return (
    <main id="main" tabIndex={-1} className={styles.slideshow} style={themed(event)}>
      <h1 className={styles.kioskTitle}>{event.name}</h1>
      {photos.length === 0 ? <p>Photos from the booth appear here.</p> : (
        <ul role="list" className={styles.wall} aria-label="Live gallery">
          {photos.map((p) => <li key={p.id}><PhotoTile photo={p} event={event} /></li>)}
        </ul>
      )}
      <p className={styles.foot}>Upload yours: {window.location.host}/e/{event.id}/gallery</p>
    </main>
  )
}
