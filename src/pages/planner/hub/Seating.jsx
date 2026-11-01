// =====================================================================
// Event Hub › Guests › Seating (PL-4.12, product Phase 4).
//   The floor plan: the room to scale (feet), an uploaded venue plan behind
//   it, and tables, dance floor, stage, buffet, bar, booth, KJ station,
//   outlets and exits you drag into place. Keyboard: focus an object and
//   use the arrow keys (Shift = 5 ft). While you drag, the plan is locked
//   for everyone else (NFR-11).
//   Seating: seat each household at a table (a menu works everywhere; drag
//   works with a mouse). Each table shows people/seats, meals, allergies,
//   and a flag when two "don't seat near" households share it.
//   Print: escort cards, table numbers, place cards.
// =====================================================================
import { useRef, useState } from 'react'
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getMe, getTables, unseated } from '../../../store/selectors'
import { FLOOR_OBJECTS } from '../../../data/seedSeating'
import { Button, Card, EmptyState, Field, Icon, Notice, StatusChip } from '../../../components/ui'
import NotFound from '../../shared/NotFound'
import styles from './seating.module.css'

const size = (g) => (g.rsvp === 'attending' ? g.attending : 1 + (g.plusOnes ?? 0))
const mealWords = (meals) => Object.entries(meals).map(([m, n]) => `${n} ${m.toLowerCase()}`).join(', ')

function Room({ event, selected, onSelect, tables, me }) {
  const { dispatch } = useStore()
  const ref = useRef(null)
  const drag = useRef(null)
  const plan = event.floorPlan
  const lockedByOther = plan.lockedBy && plan.lockedBy !== me
  const toFeet = (e) => {
    const r = ref.current.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * plan.widthFt, y: ((e.clientY - r.top) / r.height) * plan.heightFt }
  }
  const down = (o) => (e) => {
    onSelect(o.id)
    if (lockedByOther || e.button !== 0) return
    const p = toFeet(e)
    drag.current = { id: o.id, dx: p.x - o.x, dy: p.y - o.y }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dispatch({ type: 'floor/lock', eventId: event.id, by: me })
  }
  const move = (e) => {
    if (!drag.current) return
    const p = toFeet(e)
    dispatch({ type: 'floor/move', eventId: event.id, id: drag.current.id, x: p.x - drag.current.dx, y: p.y - drag.current.dy })
  }
  const up = () => {
    if (!drag.current) return
    drag.current = null
    dispatch({ type: 'floor/lock', eventId: event.id, by: null })
  }
  const key = (o) => (e) => {
    const step = e.shiftKey ? 5 : 1
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (!d || lockedByOther) return
    e.preventDefault()
    dispatch({ type: 'floor/move', eventId: event.id, id: o.id, x: o.x + d[0], y: o.y + d[1] })
  }
  const dropGuest = (tableId) => (e) => {
    const guestId = e.dataTransfer.getData('text/guest')
    if (guestId) { e.preventDefault(); dispatch({ type: 'seat/assign', guestId, tableId }) }
  }

  return (
    <div ref={ref} className={styles.room} style={{ aspectRatio: `${plan.widthFt} / ${plan.heightFt}`, backgroundImage: plan.background ? `url(${plan.background})` : undefined }}
      onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="group" aria-label={`Floor plan, ${plan.widthFt} by ${plan.heightFt} feet`}>
      {plan.objects.map((o) => {
        const t = tables.find((x) => x.id === o.id)
        const flagged = t && (t.conflicts.length > 0 || t.left < 0)
        return (
          <button key={o.id} type="button" data-kind={o.kind} aria-pressed={selected === o.id}
            className={`${styles.thing} ${flagged ? styles.flagged : ''}`}
            style={{ left: `${(o.x / plan.widthFt) * 100}%`, top: `${(o.y / plan.heightFt) * 100}%`, width: `${(o.w / plan.widthFt) * 100}%`, height: `${(o.h / plan.heightFt) * 100}%` }}
            aria-label={t ? `Table ${o.label}: ${t.filled} of ${o.seats} seats${t.conflicts.length ? ', seating conflict' : ''}` : `${o.label} at ${o.x}, ${o.y} feet`}
            onPointerDown={down(o)} onKeyDown={key(o)} onClick={() => onSelect(o.id)}
            onDragOver={t ? (e) => e.preventDefault() : undefined} onDrop={t ? dropGuest(o.id) : undefined}>
            <span className={styles.thingLabel}>{t ? `${o.label} · ${t.filled}/${o.seats}` : o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Inspector({ event, objectId, tables, onDone }) {
  const { state, dispatch } = useStore()
  const o = event.floorPlan.objects.find((x) => x.id === objectId)
  if (!o) return <p className="muted">Select something on the plan to change it. Arrow keys move it (Shift = 5 ft).</p>
  const t = tables.find((x) => x.id === o.id)
  const guests = state.guests.filter((g) => g.eventId === event.id && !g.removed)
  return (
    <div className="stack">
      <div className={styles.grid2}>
        <Field label="Label" value={o.label} onChange={(e) => dispatch({ type: 'floor/update', eventId: event.id, id: o.id, changes: { label: e.target.value } })} />
        {t && <Field label="Seats" type="number" min="1" value={o.seats} onChange={(e) => dispatch({ type: 'floor/update', eventId: event.id, id: o.id, changes: { seats: Math.max(1, Number(e.target.value) || 1) } })} />}
      </div>
      {t && (
        <>
          {t.conflicts.length > 0 && <Notice tone="danger">“Don’t seat near”: {t.conflicts.map((g) => g.name).join(' and ')} are both at this table.</Notice>}
          {t.left < 0 && <Notice tone="danger">Over by {-t.left} seat{t.left === -1 ? '' : 's'}.</Notice>}
          <ul role="list" className={styles.list} aria-label={`Seated at table ${o.label}`}>
            {t.guests.map((g) => (
              <li key={g.id}>
                <span><strong>{g.name}</strong> · {size(g)}{g.allergies && <span className={styles.allergy}> · {g.allergies}</span>}</span>
                <button type="button" className="link-button" onClick={() => dispatch({ type: 'seat/assign', guestId: g.id, tableId: null })}>Unseat</button>
              </li>
            ))}
            {t.guests.length === 0 && <li className="muted">Nobody yet.</li>}
          </ul>
          {Object.keys(t.meals).length > 0 && <p className="muted">Meals: {mealWords(t.meals)}</p>}
          {t.guests.length > 0 && (
            <form className={styles.inline} onSubmit={(e) => {
              e.preventDefault()
              const [a, b] = [e.target.elements.a.value, e.target.elements.b.value]
              if (a && b && a !== b) dispatch({ type: 'guest/avoid', guestId: a, otherId: b, on: true })
            }}>
              <Field label="Don’t seat" name="a" as="select">{t.guests.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Field>
              <Field label="near" name="b" as="select">{guests.filter((g) => g.rsvp === 'attending').map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Field>
              <Button type="submit">Flag</Button>
            </form>
          )}
        </>
      )}
      <Button variant="danger" onClick={() => { dispatch({ type: 'floor/remove', eventId: event.id, id: o.id }); onDone() }}>Remove {t ? `table ${o.label}` : o.label.toLowerCase()}</Button>
    </div>
  )
}

export default function Seating() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [selected, setSelected] = useState(null)
  const [kind, setKind] = useState('table-round')
  const me = getMe(state)?.name.split(' ')[0]
  const plan = event.floorPlan
  const tables = getTables(state, event.id)
  const waiting = unseated(state, event.id)
  const seatedPeople = tables.reduce((t, x) => t + x.filled, 0)
  const conflicts = tables.filter((t) => t.conflicts.length).length

  return (
    <div className={styles.layout}>
      <div className="stack">
        {plan.lockedBy && plan.lockedBy !== me && <Notice tone="warning">{plan.lockedBy} is moving things on the plan. It unlocks when they let go.</Notice>}
        <Card title={`Floor plan · ${tables.length} tables · ${seatedPeople} seated`} action={<Button size="small" to={`/print/events/${event.id}/seating`}><Icon name="proposal" size={14} /> Print cards</Button>}>
          <div className={styles.toolbar}>
            <Field label="Add" as="select" value={kind} onChange={(e) => setKind(e.target.value)}>
              {FLOOR_OBJECTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Field>
            <Button onClick={() => dispatch({ type: 'floor/add', eventId: event.id, kind })}>Add to the plan</Button>
            <Field label="Room width (ft)" type="number" min="10" value={plan.widthFt} onChange={(e) => dispatch({ type: 'floor/setRoom', eventId: event.id, changes: { widthFt: Math.max(10, Number(e.target.value) || 10) } })} />
            <Field label="Room depth (ft)" type="number" min="10" value={plan.heightFt} onChange={(e) => dispatch({ type: 'floor/setRoom', eventId: event.id, changes: { heightFt: Math.max(10, Number(e.target.value) || 10) } })} />
            <Field label="Venue plan (image)" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) dispatch({ type: 'floor/setRoom', eventId: event.id, changes: { background: URL.createObjectURL(f) } }) }} />
          </div>
          {plan.objects.length === 0
            ? <EmptyState title="An empty room">Set the room size, upload the venue’s plan, then add tables, the dance floor, the stage and exits.</EmptyState>
            : <Room event={event} selected={selected} onSelect={setSelected} tables={tables} me={me} />}
          {conflicts > 0 && <p className={styles.flagText}>⚠ {conflicts} table{conflicts > 1 ? 's have' : ' has'} a “don’t seat near” conflict (outlined in red).</p>}
        </Card>
      </div>

      <div className="stack">
        <Card title="Selected"><Inspector key={selected} event={event} objectId={selected} tables={tables} onDone={() => setSelected(null)} /></Card>
        <Card title={`Not seated yet (${waiting.length})`}>
          {waiting.length === 0 ? <p className="muted">Everyone attending has a seat.</p> : (
            <ul role="list" className={styles.list} aria-label="Not seated yet">
              {waiting.map((g) => (
                <li key={g.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/guest', g.id)} className={styles.guest}>
                  <span><strong>{g.name}</strong> · {size(g)}{g.allergies && <span className={styles.allergy}> · {g.allergies}</span>}</span>
                  <label className={styles.seatPick}>
                    <span className="visually-hidden">Seat {g.name} at</span>
                    <select value="" onChange={(e) => dispatch({ type: 'seat/assign', guestId: g.id, tableId: e.target.value })}>
                      <option value="">Seat at…</option>
                      {tables.map((t) => <option key={t.id} value={t.id} disabled={t.left < size(g)}>Table {t.label} ({t.left} left)</option>)}
                    </select>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="muted">Or drag a name onto a table.</p>
        </Card>
      </div>
    </div>
  )
}

/** /print/events/:eventId/seating?kind=escort|tables|place */
export function SeatingPrint() {
  const { eventId } = useParams()
  const [params, setParams] = useSearchParams()
  const { state } = useStore()
  const event = state.events.find((e) => e.id === eventId)
  if (!event) return <NotFound what="event" standalone />
  const kind = params.get('kind') ?? 'escort'
  const tables = getTables(state, event.id)
  const seated = tables.flatMap((t) => t.guests.map((g) => ({ g, t }))).sort((a, b) => a.g.name.localeCompare(b.g.name))
  return (
    <main id="main" tabIndex={-1} className={styles.print}>
      <header className={styles.printHead}>
        <div className={styles.kinds} role="group" aria-label="What to print">
          {[['escort', 'Escort cards'], ['tables', 'Table numbers'], ['place', 'Place cards']].map(([k, label]) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setParams({ kind: k })}>{label}</button>
          ))}
        </div>
        <Button onClick={() => window.print()} className={styles.noPrint}>Print</Button>
      </header>
      <ul role="list" className={kind === 'tables' ? styles.bigCards : styles.cards} aria-label={kind}>
        {kind === 'escort' && seated.map(({ g, t }) => <li key={g.id}><strong>{g.name}</strong><span>Table {t.label}</span></li>)}
        {kind === 'tables' && tables.map((t) => <li key={t.id}><span className={styles.tableNumber}>{t.label}</span></li>)}
        {kind === 'place' && seated.map(({ g, t }) => (
          <li key={g.id}><strong>{g.name}</strong><span>{event.name}{Object.keys(g.meals ?? {}).length ? ` · ${mealWords(g.meals)}` : ''}</span><StatusChip tone="neutral" label={`Table ${t.label}`} /></li>
        ))}
      </ul>
    </main>
  )
}
