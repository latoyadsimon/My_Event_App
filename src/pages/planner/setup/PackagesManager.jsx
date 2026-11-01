// =====================================================================
// Packages and add-ons (PL-1.4): create, edit, archive. Used by onboarding
// step 3 and Settings › Packages. Changes save immediately.
// Archive, never delete: old proposals still point at the item, and it can be restored.
// =====================================================================
import { useState } from 'react'
import { useStore } from '../../../store/StoreContext'
import { packages as STARTER_PACKAGES } from '../../../data/seed'
import { centsToDollars, dollarsToCents, validateItem } from '../../../lib/validate'
import { Button, Card, EmptyState, Field, Money } from '../../../components/ui'
import styles from './setup.module.css'

/** Inline form for one package or add-on (new when item has no id). */
function ItemForm({ kind, item, onSave, onCancel }) {
  const [v, setV] = useState({
    name: item?.name ?? '',
    price: item ? centsToDollars(item.priceCents) : '',
    description: item?.description ?? '',
    unit: item?.unit ?? 'each',
    owned: item?.owned ?? '',
  })
  const [errors, setErrors] = useState({})
  const bind = (key) => ({ value: v[key], onChange: (e) => setV({ ...v, [key]: e.target.value }), error: errors[key] })

  const submit = (e) => {
    e.preventDefault()
    const found = validateItem(v)
    setErrors(found)
    if (Object.keys(found).length) return
    const base = { ...item, name: v.name.trim(), priceCents: dollarsToCents(v.price) }
    onSave(kind === 'package'
      ? { ...base, description: v.description.trim() }
      : { ...base, unit: v.unit.trim() || 'each', owned: v.owned === '' ? null : Number(v.owned) })
  }

  return (
    <form className={`${styles.editBox} stack`} onSubmit={submit} noValidate>
      <div className={styles.grid2}>
        <Field label={kind === 'package' ? 'Package name' : 'Add-on name'} {...bind('name')} />
        <Field label="Price ($)" inputMode="decimal" hint={kind === 'addon' ? 'Price for one unit' : undefined} {...bind('price')} />
        {kind === 'package'
          ? <div className={styles.full}><Field label="What's included" as="textarea" {...bind('description')} /></div>
          : <>
              <Field label="Unit" hint="each, hour, chair…" {...bind('unit')} />
              <Field label="How many you own (optional)" type="number" min="0" inputMode="numeric"
                hint="Used to warn you when a proposal asks for more than you have." {...bind('owned')} />
            </>}
      </div>
      <div className={styles.formActions}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">{item?.id ? 'Save changes' : `Add ${kind === 'package' ? 'package' : 'add-on'}`}</Button>
      </div>
    </form>
  )
}

function ItemList({ kind, title, items, describe }) {
  const { dispatch } = useStore()
  const [editing, setEditing] = useState(null) // an item id, 'new', or null
  const active = items.filter((i) => !i.archived)
  const archived = items.filter((i) => i.archived)
  const noun = kind === 'package' ? 'package' : 'add-on'

  const save = (item) => {
    dispatch({ type: `${kind}/save`, item })
    dispatch({ type: 'toast/show', text: item.id ? `${item.name} saved` : `${item.name} added` })
    setEditing(null)
  }
  // The design note's starter tiers (onboarding step 3); the planner edits the prices after.
  const addStarters = () => {
    for (const { name, priceCents, description } of STARTER_PACKAGES) {
      dispatch({ type: 'package/save', item: { name, priceCents, description } })
    }
    dispatch({ type: 'toast/show', text: 'Silver, Gold and Platinum added' })
  }
  const archive = (item) => {
    dispatch({ type: `${kind}/archive`, id: item.id })
    dispatch({ type: 'toast/show', text: `${item.name} archived. You can restore it below.` })
  }

  return (
    <Card title={title} action={editing !== 'new' && <Button size="small" variant="secondary" onClick={() => setEditing('new')}>Add {noun}</Button>}>
      {editing === 'new' && <ItemForm kind={kind} onSave={save} onCancel={() => setEditing(null)} />}
      {active.length === 0 && editing !== 'new' && kind === 'package' && (
        <EmptyState title="No packages yet"
          action={<Button variant="primary" onClick={addStarters}>Start with Silver, Gold and Platinum</Button>}>
          Packages are what you sell. Start with three common tiers and change the prices to yours.
        </EmptyState>
      )}
      {active.length === 0 && editing !== 'new' && kind === 'addon' && (
        <EmptyState title="No add-ons yet">Add extras clients can choose, like a photo booth, karaoke hours or chairs.</EmptyState>
      )}
      <ul role="list" className={styles.list}>
        {active.map((item) => (
          <li key={item.id}>
            <div className={styles.row}>
              <div className={styles.rowMain}>
                <span className={styles.rowTitle}>{item.name}</span>
                <span className={styles.rowMeta}>{describe(item)}</span>
              </div>
              <Money className={styles.price} cents={item.priceCents} />
              <div className={styles.rowActions}>
                <Button size="small" onClick={() => setEditing(item.id)} aria-label={`Edit ${item.name}`}>Edit</Button>
                <Button size="small" onClick={() => archive(item)} aria-label={`Archive ${item.name}`}>Archive</Button>
              </div>
            </div>
            {editing === item.id && <ItemForm kind={kind} item={item} onSave={save} onCancel={() => setEditing(null)} />}
          </li>
        ))}
      </ul>
      {archived.length > 0 && (
        <details className={styles.archived}>
          <summary>Archived ({archived.length})</summary>
          <ul role="list" className={styles.list}>
            {archived.map((item) => (
              <li key={item.id} className={styles.row}>
                <span className={styles.rowMain}><span className="muted">{item.name}</span></span>
                <Button size="small" onClick={() => dispatch({ type: `${kind}/restore`, id: item.id })} aria-label={`Restore ${item.name}`}>Restore</Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  )
}

export default function PackagesManager() {
  const { state } = useStore()
  return (
    <div className="stack">
      <ItemList kind="package" title="Packages" items={state.packages} describe={(p) => p.description} />
      <ItemList kind="addon" title="Add-ons" items={state.addons}
        describe={(a) => [`per ${a.unit}`, a.owned != null && `you own ${a.owned}`].filter(Boolean).join(' · ')} />
    </div>
  )
}
