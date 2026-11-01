// =====================================================================
// Event Hub › Logistics › Run of show (PL-4.11): the minute-by-minute
// timeline with owners. Each item has a time, length, owner, location,
// cue notes and who can see it (client / vendor / staff; vendors only see
// their own items). Items sort by time, so "moving" one = changing its
// time. Build from a template, preview what each audience sees, print a
// one-page version. It feeds Day-of Mode.
// =====================================================================
import { useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { formatClock, getEventVendors, getTimeline, ownerLabel } from '../../../store/selectors'
import { Button, Card, Dialog, EmptyState, Field, Icon, StatusChip } from '../../../components/ui'
import NotFound from '../../shared/NotFound'
import styles from './hub.module.css'

const AUDIENCES = [['client', 'Client'], ['vendor', 'Vendors'], ['staff', 'Staff']]
const TEMPLATES = [['wedding', 'Wedding'], ['corporate', 'Corporate'], ['memorial', 'Memorial'], ['default', 'General']]
const blank = (owner) => ({ time: '', minutes: '15', title: '', owner, location: '', notes: '', visibility: ['staff'] })

/** Who can own an item: the active team, the client, and each vendor still booked. */
function useOwners(eventId) {
  const { state } = useStore()
  return [
    ...state.team.filter((m) => m.status === 'active').map((m) => [m.id, m.name.split(' ')[0]]),
    ['client', 'Client'],
    ...getEventVendors(state, eventId).filter((v) => v.status !== 'cancelled').map((v) => [`v:${v.id}`, v.vendor.name]),
  ]
}

function ItemForm({ value, onChange, owners }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  const toggle = (id) => onChange({ ...value, visibility: value.visibility.includes(id) ? value.visibility.filter((x) => x !== id) : [...value.visibility, id] })
  return (
    <div className={styles.roForm}>
      <Field label="Time" type="time" value={value.time} onChange={set('time')} required />
      <Field label="Minutes" type="number" min="5" step="5" value={value.minutes} onChange={set('minutes')} />
      <Field label="What happens" value={value.title} onChange={set('title')} required />
      <Field label="Owner" as="select" value={value.owner} onChange={set('owner')}>
        {owners.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </Field>
      <Field label="Location" value={value.location} onChange={set('location')} />
      <Field label="Cue notes" value={value.notes} onChange={set('notes')} />
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Who can see it (you always can)</legend>
        <div className="cluster">
          {AUDIENCES.map(([id, label]) => (
            <label key={id} className={styles.check}><input type="checkbox" checked={value.visibility.includes(id)} onChange={() => toggle(id)} /> {label}</label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

export default function RunOfShow() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const owners = useOwners(event.id)
  const [audience, setAudience] = useState('planner')
  const [draft, setDraft] = useState(() => blank(owners[0]?.[0]))
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState(null)
  const [template, setTemplate] = useState(event.type === 'wedding' || event.type === 'corporate' || event.type === 'memorial' ? event.type : 'default')
  const vendorsOn = getEventVendors(state, event.id).filter((v) => v.status !== 'cancelled')
  const view = audience.startsWith('v:') ? { vendor: audience.slice(2) } : audience
  const items = getTimeline(state, event.id, view)
  const all = getTimeline(state, event.id)

  const add = (e) => {
    e.preventDefault()
    if (!draft.time || !draft.title.trim()) { setError('Add a time and what happens.'); return }
    setError(null)
    dispatch({ type: 'timeline/add', eventId: event.id, ...draft })
    dispatch({ type: 'toast/show', text: `Added ${formatClock(draft.time)} ${draft.title.trim()}` })
    setDraft(blank(draft.owner))
  }
  const save = () => {
    dispatch({ type: 'timeline/update', id: editing.id, changes: { ...editing, minutes: Number(editing.minutes) || 15 } })
    setEditing(null)
  }
  const remove = (item) => {
    dispatch({ type: 'timeline/remove', id: item.id })
    dispatch({ type: 'toast/show', text: `Removed “${item.title}”`, undo: { type: 'timeline/restore', id: item.id } })
  }

  return (
    <div className="stack">
      <Card title={`Run of show · ${all.length} item${all.length === 1 ? '' : 's'}`} action={all.length > 0 && <Button size="small" to={`/print/events/${event.id}/run-of-show`}><Icon name="proposal" size={14} /> Printable version</Button>}>
        <div className={styles.roToolbar}>
          <div className={styles.segmented} role="group" aria-label="Preview as">
            {[['planner', 'Everything'], ['client', 'Client'], ['staff', 'Staff'], ...vendorsOn.map((v) => [`v:${v.id}`, v.vendor.name])].map(([id, label]) => (
              <button key={id} type="button" aria-pressed={audience === id} onClick={() => setAudience(id)}>{label}</button>
            ))}
          </div>
        </div>
        {audience !== 'planner' && <p className="muted">Showing what {audience.startsWith('v:') ? 'this vendor' : `the ${audience}`} sees{audience.startsWith('v:') ? ' (only their own items)' : ''}.</p>}

        {all.length === 0
          ? (
            <EmptyState title="No timeline yet" action={
              <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'timeline/applyTemplate', eventId: event.id, template }) }}>
                <Field label="Template" as="select" value={template} onChange={(e) => setTemplate(e.target.value)}>
                  {TEMPLATES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </Field>
                <Button type="submit" variant="primary">Build from template</Button>
              </form>
            }>Start from a template around the {event.startTime ? formatClock(event.startTime) : '5:00 PM'} start, then adjust.</EmptyState>
          )
          : items.length === 0
            ? <p className="muted">Nothing on the timeline for this audience.</p>
            : (
              <ol role="list" className={styles.ro} aria-label="Run of show">
                {items.map((t) => (
                  <li key={t.id} className={styles.roItem}>
                    <span className={styles.roTime}>{formatClock(t.time)}<span className={styles.subline}>{t.minutes} min</span></span>
                    <div className={styles.roBody}>
                      <span className={styles.taskTitle}>{t.title}</span>
                      <span className={styles.taskMeta}>
                        {ownerLabel(state, t.owner)}{t.location && ` · ${t.location}`}
                        {audience === 'planner' && t.visibility.map((v) => <StatusChip key={v} tone="neutral" label={AUDIENCES.find(([id]) => id === v)?.[1]} />)}
                      </span>
                      {t.notes && <span className={styles.roNotes}>Cue: {t.notes}</span>}
                    </div>
                    {audience === 'planner' && (
                      <div className={styles.taskTools}>
                        <Button size="small" onClick={() => setEditing({ ...t, minutes: String(t.minutes) })} aria-label={`Edit “${t.title}”`}>Edit</Button>
                        <Button size="small" variant="danger" onClick={() => remove(t)} aria-label={`Remove “${t.title}”`}><Icon name="close" size={14} /></Button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
      </Card>

      <Card title="Add to the timeline">
        <form onSubmit={add} noValidate className="stack">
          <ItemForm value={draft} onChange={setDraft} owners={owners} />
          {error && <p className={styles.error} role="alert">{error}</p>}
          <Button type="submit" variant="primary">Add item</Button>
        </form>
        <p className="muted">Vendors get a “what changed” notice when their items are added or moved.</p>
      </Card>

      <Dialog open={Boolean(editing)} title="Edit timeline item" onClose={() => setEditing(null)} wide
        actions={<Button variant="primary" onClick={save}>Save item</Button>}>
        {editing && <ItemForm value={editing} onChange={setEditing} owners={owners} />}
      </Dialog>
    </div>
  )
}

/** /print/events/:eventId/run-of-show: one page, no app chrome. */
export function RunOfShowPrint() {
  const { eventId } = useParams()
  const { state } = useStore()
  const event = state.events.find((e) => e.id === eventId)
  if (!event) return <NotFound what="event" standalone />
  const items = getTimeline(state, event.id)
  return (
    <article className={styles.print}>
      <header className={styles.printHead}>
        <div>
          <h1 className={styles.threadTitle}>{event.name} · run of show</h1>
          <p className="muted">{event.venue} · {state.business.name} · {state.business.phone}</p>
        </div>
        <Button onClick={() => window.print()} className={styles.noPrint}>Print</Button>
      </header>
      <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr><th>Time</th><th>What</th><th>Owner</th><th>Where</th><th>Cue</th></tr></thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}><td className={styles.when}>{formatClock(t.time)}</td><td><strong>{t.title}</strong></td><td>{ownerLabel(state, t.owner)}</td><td>{t.location}</td><td>{t.notes}</td></tr>
          ))}
        </tbody>
      </table>
      </div>
    </article>
  )
}
