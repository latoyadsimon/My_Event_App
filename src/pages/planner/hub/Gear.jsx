// =====================================================================
// Event Hub › Logistics › Gear & pack list (PL-6.2, PL-6.3).
// Gear behind the booked add-ons is reserved when you countersign.
// Reserve a kit (every piece in it) or single items; "free" counts other
// events within the turnaround buffer. A shortage is covered by renting
// the difference from a partner. The pack list = our reserved gear +
// "always bring" + extras; staff scan items into the van from their app.
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { gearAvailable, getReservations, packList } from '../../../store/selectors'
import { formatDayShort } from '../../../lib/clock'
import { Button, Card, EmptyState, Field, Notice, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

function Shortage({ r }) {
  const { state, dispatch } = useStore()
  const partners = state.vendors.filter((v) => v.category === 'Rentals')
  const [partner, setPartner] = useState(partners[0]?.name ?? '')
  return (
    <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'gear/addPartner', id: r.id, name: partner, qty: r.shortage }) }}>
      <Field label={`Rent ${r.shortage} from`} as="select" value={partner} onChange={(e) => setPartner(e.target.value)}>
        {partners.map((v) => <option key={v.id}>{v.name}</option>)}
        {!partners.length && <option>A rental partner</option>}
      </Field>
      <Button type="submit" variant="primary">Add rental</Button>
    </form>
  )
}

function Reserve({ event }) {
  const { state, dispatch } = useStore()
  const [kitId, setKitId] = useState(state.kits[0]?.id ?? '')
  const [itemId, setItemId] = useState(state.equipment[0]?.id ?? '')
  const [qty, setQty] = useState('1')
  const free = itemId ? gearAvailable(state, itemId, event.date, event.id) : 0
  return (
    <div className={styles.grid2}>
      {state.kits.length > 0 && (
        <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'gear/reserveKit', eventId: event.id, kitId }) }}>
          <Field label="Kit" as="select" value={kitId} onChange={(e) => setKitId(e.target.value)}>
            {state.kits.map((k) => <option key={k.id} value={k.id}>{k.name} ({k.items.length} pieces)</option>)}
          </Field>
          <Button type="submit">Reserve kit</Button>
        </form>
      )}
      {state.equipment.length > 0 && (
        <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'gear/reserve', eventId: event.id, itemId, qty: Number(qty) }) }}>
          <Field label="Item" as="select" value={itemId} onChange={(e) => setItemId(e.target.value)} hint={`${free} free on ${formatDayShort(event.date)}`}>
            {state.equipment.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </Field>
          <Field label="How many" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Button type="submit">Reserve</Button>
        </form>
      )}
    </div>
  )
}

function PackList({ event }) {
  const { state, dispatch } = useStore()
  const [extra, setExtra] = useState('')
  const { rows, packedCount } = packList(state, event.id)
  const groups = [...new Set(rows.map((r) => r.group))]
  const missing = rows.filter((r) => r.status === 'missing')
  return (
    <Card title={`Pack list · ${packedCount} of ${rows.length} packed`}>
      <div className={styles.progress} role="progressbar" aria-label="Packed" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={packedCount}>
        <span style={{ width: `${rows.length ? (packedCount / rows.length) * 100 : 0}%` }} />
      </div>
      {missing.length > 0 && <Notice tone="danger">Missing from the van: {missing.map((r) => r.name).join(', ')}.</Notice>}
      {groups.map((g) => (
        <fieldset key={g} className={styles.fieldset}>
          <legend className={styles.legend}>{g}</legend>
          <ul role="list" className={styles.rows}>
            {rows.filter((r) => r.group === g).map((r) => (
              <li key={r.key}>
                <label className={styles.check}>
                  <input type="checkbox" checked={r.status === 'packed' || r.status === 'returned'}
                    onChange={(e) => dispatch({ type: 'pack/set', eventId: event.id, key: r.key, status: e.target.checked ? 'packed' : null })} />
                  {r.qty > 1 ? `${r.qty} × ` : ''}{r.name}
                </label>
                {r.label && <span className="muted">{r.label}</span>}
                {r.status === 'missing' && <StatusChip tone="danger" label="Missing" />}
              </li>
            ))}
          </ul>
        </fieldset>
      ))}
      <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'pack/addExtra', eventId: event.id, name: extra, qty: 1 }); setExtra('') }}>
        <Field label="Add an extra" value={extra} onChange={(e) => setExtra(e.target.value)} />
        <Button type="submit" disabled={!extra.trim()}>Add</Button>
      </form>
      <p className="muted">Staff scan labels into the van from their phones; anything not scanned is flagged here.</p>
    </Card>
  )
}

export default function Gear() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const rows = getReservations(state, event.id)
  const kitsHere = [...new Set(rows.filter((r) => r.kit).map((r) => r.kit.id))].map((id) => state.kits.find((k) => k.id === id))
  const singles = rows.filter((r) => !r.kit)
  const closed = ['closed', 'cancelled'].includes(event.status)

  const line = (r, release) => (
    <li key={r.id} className={styles.gearRow}>
      <div>
        <strong>{r.qty} × {r.item.name}</strong>
        <span className={styles.subline}>
          {r.free} of {r.item.owned} free on {formatDayShort(event.date)}
          {r.partner && ` · ${r.partner.qty} rented from ${r.partner.name}`}
        </span>
      </div>
      <span className="cluster">
        {r.shortage > 0 ? <StatusChip tone="danger" label={`Short ${r.shortage}`} /> : <StatusChip tone="success" label="Covered" />}
        {release && !closed && <Button size="small" onClick={() => dispatch({ type: 'gear/release', id: r.id })} aria-label={`Release ${r.item.name}`}>Release</Button>}
      </span>
      {r.shortage > 0 && !closed && <div className={styles.gearFix}><Shortage r={r} /></div>}
    </li>
  )

  return (
    <div className="stack">
      <Card title="Reserved gear" action={<Button size="small" to="/app/settings/equipment">Inventory</Button>}>
        {rows.length === 0
          ? <EmptyState title="No gear reserved">Gear for booked add-ons is reserved when you countersign. Reserve a kit or items below.</EmptyState>
          : (
            <div className="stack">
              {kitsHere.map((k) => (
                <fieldset key={k.id} className={styles.fieldset}>
                  <legend className={styles.legend}>
                    {k.name}{' '}
                    {!closed && <button type="button" className="link-button" onClick={() => dispatch({ type: 'gear/release', id: rows.find((r) => r.kitId === k.id).id })}>Release kit</button>}
                  </legend>
                  <ul role="list" className={styles.rows}>{rows.filter((r) => r.kitId === k.id).map((r) => line(r))}</ul>
                </fieldset>
              ))}
              {singles.length > 0 && (
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>Items</legend>
                  <ul role="list" className={styles.rows}>
                    {singles.map((r) => line(r, true))}
                  </ul>
                </fieldset>
              )}
            </div>
          )}
        <p className="muted">“Free” already counts other events within {state.business.gearBufferDays ?? 0} day{state.business.gearBufferDays === 1 ? '' : 's'} (cleaning and turnaround).</p>
      </Card>

      {!closed && <Card title="Reserve more"><Reserve event={event} /></Card>}

      <PackList event={event} />
    </div>
  )
}
