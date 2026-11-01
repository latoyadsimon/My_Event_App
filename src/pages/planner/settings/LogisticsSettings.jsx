// =====================================================================
// Settings › Vendors (PL-4.10): the directory events pick from: category,
// rates, contacts, private rating, insurance and past events with you.
// Settings › Equipment (PL-6.2): what the business owns, label codes for
// scanning, wear per event (feeds profit), and kits (reserving a kit
// reserves every piece in it).
// =====================================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { can, coiStatus, vendorHistory } from '../../../store/selectors'
import { VENDOR_CATEGORIES } from '../../../data/seedLogistics'
import { formatDayShort } from '../../../lib/clock'
import { formatMoney } from '../../../lib/money'
import { dollarsToCents } from '../../../lib/validate'
import { Button, Card, EmptyState, Field, Notice, Stars, StatusChip } from '../../../components/ui'
import styles from '../hub/hub.module.css'

const COI_WORDS = { ok: ['success', 'COI on file'], soon: ['warning', 'COI expires soon'], expires: ['warning', 'COI on file'], missing: ['danger', 'No COI'] }

function AddVendor() {
  const { dispatch } = useStore()
  const empty = { name: '', category: VENDOR_CATEGORIES[0], contact: '', email: '', phone: '', rates: '' }
  const [v, setV] = useState(empty)
  const [error, setError] = useState(null)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const add = (e) => {
    e.preventDefault()
    if (!v.name.trim() || !(v.email.trim() || v.phone.trim())) { setError('Add a name and an email or phone, so they can get their link.'); return }
    setError(null)
    dispatch({ type: 'vendor/save', vendor: { ...v, name: v.name.trim() } })
    setV(empty)
  }
  return (
    <form onSubmit={add} noValidate className="stack">
      <div className={styles.grid2}>
        <Field label="Company" value={v.name} onChange={set('name')} />
        <Field label="Category" as="select" value={v.category} onChange={set('category')}>{VENDOR_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Field>
        <Field label="Contact person" value={v.contact} onChange={set('contact')} />
        <Field label="Rates" value={v.rates} onChange={set('rates')} hint="For example: $38–55 per guest" />
        <Field label="Email" type="email" value={v.email} onChange={set('email')} />
        <Field label="Phone" type="tel" value={v.phone} onChange={set('phone')} />
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <Button type="submit" variant="primary">Add to directory</Button>
      <p className="muted">They add their insurance, W-9 and payment details themselves the first time you book them.</p>
    </form>
  )
}

export function VendorSettings() {
  const { state } = useStore()
  const [category, setCategory] = useState('All')
  const list = state.vendors.filter((v) => category === 'All' || v.category === category)
  const edit = can(state, 'edit_vendors')
  return (
    <div className="stack">
      <Card title={`Vendor directory · ${state.vendors.length}`}>
        <Field label="Category" as="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {['All', ...VENDOR_CATEGORIES].map((c) => <option key={c}>{c}</option>)}
        </Field>
        {list.length === 0
          ? <EmptyState title="No vendors here yet">Add the caterers, DJs and rental companies you work with.</EmptyState>
          : (
            <ul role="list" className={styles.vendorList}>
              {list.map((v) => {
                const history = vendorHistory(state, v.id)
                const coi = coiStatus(v)
                return (
                  <li key={v.id} className={styles.vendor}>
                    <div className={styles.vendorHead}>
                      <div>
                        <span className={styles.vendorName}>{v.name}</span>
                        <span className={styles.subline}>{v.category} · {v.rates}</span>
                      </div>
                      <div className={styles.flags}>
                        {v.rating ? <Stars n={v.rating} /> : <span className="muted">Not rated</span>}
                        <StatusChip tone={COI_WORDS[coi][0]} label={v.coiExpiresOn ? `COI to ${formatDayShort(v.coiExpiresOn)}` : COI_WORDS[coi][1]} />
                        {!v.profileComplete && <StatusChip tone="info" label="Profile not set up yet" />}
                      </div>
                    </div>
                    <p className={styles.subline}>{v.contact} · {v.email} · {v.phone}</p>
                    <p className={styles.subline}>
                      {history.length ? <>Past events: {history.map((h, i) => <span key={h.id}>{i > 0 && ', '}<Link to={`/app/events/${h.event.id}/logistics/vendors`}>{h.event.name}</Link></span>)}</> : 'No events with you yet'}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        <p className="muted">Ratings are private to your team; vendors never see them.</p>
      </Card>
      {edit ? <Card title="Add a vendor"><AddVendor /></Card> : <Notice>Ask the owner for “Edit vendors” to add vendors.</Notice>}
    </div>
  )
}

function AddItem() {
  const { dispatch } = useStore()
  const empty = { name: '', category: '', owned: '1', wear: '', label: '' }
  const [v, setV] = useState(empty)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const add = (e) => {
    e.preventDefault()
    if (!v.name.trim()) return
    dispatch({ type: 'equipment/save', item: { name: v.name.trim(), category: v.category.trim() || 'Other', owned: Math.max(0, Number(v.owned) || 0), wearCents: dollarsToCents(v.wear) || 0, label: v.label.trim() } })
    setV(empty)
  }
  return (
    <form onSubmit={add} className={styles.roForm}>
      <Field label="Item" value={v.name} onChange={set('name')} />
      <Field label="How many you own" type="number" min="0" value={v.owned} onChange={set('owned')} />
      <Field label="Category" value={v.category} onChange={set('category')} />
      <Field label="Wear per event ($)" inputMode="decimal" value={v.wear} onChange={set('wear')} />
      <Field label="Label code" value={v.label} onChange={set('label')} hint="Printed on the QR/barcode label staff scan" />
      <Button type="submit" variant="primary" disabled={!v.name.trim()}>Add item</Button>
    </form>
  )
}

function AddKit() {
  const { state, dispatch } = useStore()
  const [name, setName] = useState('')
  const [picked, setPicked] = useState({})
  const items = Object.entries(picked).filter(([, n]) => n > 0)
  const add = (e) => {
    e.preventDefault()
    dispatch({ type: 'kit/save', kit: { name: name.trim(), items } })
    setName(''); setPicked({})
  }
  return (
    <form onSubmit={add} className="stack">
      <Field label="Kit name" value={name} onChange={(e) => setName(e.target.value)} />
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Pieces in the kit</legend>
        <div className={styles.grid2}>
          {state.equipment.map((i) => (
            <Field key={i.id} label={i.name} type="number" min="0" value={picked[i.id] ?? 0} onChange={(e) => setPicked({ ...picked, [i.id]: Number(e.target.value) })} />
          ))}
        </div>
      </fieldset>
      <Button type="submit" disabled={!name.trim() || !items.length}>Create kit</Button>
    </form>
  )
}

export function EquipmentSettings() {
  const { state, dispatch } = useStore()
  const categories = [...new Set(state.equipment.map((i) => i.category))]
  const reservedNow = (itemId) => state.reservations.filter((r) => r.itemId === itemId && state.events.some((e) => e.id === r.eventId && !['closed', 'cancelled'].includes(e.status))).length
  return (
    <div className="stack">
      <Card title={`Equipment · ${state.equipment.length} items`}>
        {state.equipment.length === 0
          ? <EmptyState title="No equipment yet">Add what you own so it's reserved to events and never double-booked.</EmptyState>
          : categories.map((c) => (
            <fieldset key={c} className={styles.fieldset}>
              <legend className={styles.legend}>{c}</legend>
              <ul role="list" className={styles.rows}>
                {state.equipment.filter((i) => i.category === c).map((i) => (
                  <li key={i.id}>
                    <span><strong>{i.name}</strong><span className={styles.subline}>{i.label || 'No label'} · wear {formatMoney(i.wearCents)} per event · on {reservedNow(i.id)} upcoming event{reservedNow(i.id) === 1 ? '' : 's'}</span></span>
                    <span className="spacer" />
                    <label className={styles.moneyInput}>
                      <span>Own</span>
                      <input type="number" min="0" value={i.owned} aria-label={`How many ${i.name} you own`}
                        onChange={(e) => dispatch({ type: 'equipment/save', item: { ...i, owned: Math.max(0, Number(e.target.value) || 0) } })} />
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
        <p className="muted">Gear is free again {state.business.gearBufferDays ?? 0} day{state.business.gearBufferDays === 1 ? '' : 's'} after an event (cleaning and turnaround).</p>
      </Card>
      <Card title="Add an item"><AddItem /></Card>
      <Card title="Kits">
        <ul role="list" className={styles.rows}>
          {state.kits.map((k) => (
            <li key={k.id}>
              <strong>{k.name}</strong>
              <span className="muted">{k.items.map(([id, n]) => `${n} × ${state.equipment.find((i) => i.id === id)?.name ?? id}`).join(', ')}</span>
              {k.addonId && <StatusChip tone="info" label={`Reserved with “${state.addons.find((a) => a.id === k.addonId)?.name ?? k.addonId}”`} />}
            </li>
          ))}
        </ul>
        {state.equipment.length > 0 && <AddKit />}
      </Card>
    </div>
  )
}
