// =====================================================================
// Event Hub › Guests › Potluck & volunteers (PL-5.6, P2 part).
// Turn the potluck organizer and volunteer slots on per event, so only
// relevant features appear. Potluck: categories with "one dish per N
// people" (targets scale with headcount), the drop-off time, who's bringing
// what (diet tags, hot/cold, needs an outlet), and reminders.
// Volunteers: slots with a time and how many people are needed.
// The guest page is /e/<event>/potluck. (Funds and donations are P4.)
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { formatClock, potluckBoard, volunteerBoard } from '../../../store/selectors'
import { Button, Card, Field, Icon, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'

function PotluckCard({ event }) {
  const { state, dispatch } = useStore()
  const [name, setName] = useState('')
  const p = event.potluck
  const board = potluckBoard(state, event.id)
  const configure = (changes) => dispatch({ type: 'potluck/configure', eventId: event.id, changes })
  const setPer = (id, per) => configure({ categories: p.categories.map((c) => (c.id === id ? { ...c, per: Math.max(1, Number(per) || 1) } : c)) })
  return (
    <Card title="Potluck organizer">
      <label className={styles.check}><input type="checkbox" checked={p.enabled} onChange={(e) => configure({ enabled: e.target.checked })} /> Guests sign up to bring a dish</label>
      {p.enabled && (
        <>
          <div className={styles.inlineForm}>
            <Field label="Drop-off by" type="time" value={p.dropOff} onChange={(e) => configure({ dropOff: e.target.value })} hint="In the reminders and the one-week message" />
          </div>
          <p className="muted">Planning for <strong>{board.people}</strong> people ({event.headcount?.lockedAt ? 'locked headcount' : 'RSVPs, or your estimate until they come in'}). {board.total} of {board.needed} dishes signed up.</p>
          <ul role="list" className={styles.tasks} aria-label="Potluck categories">
            {board.categories.map((c) => (
              <li key={c.id} className={styles.task}>
                <div className={styles.taskMain}>
                  <span className={styles.taskTitle}>{c.name} · {c.filled} of {c.target}</span>
                  <span className={styles.taskMeta}>
                    {c.short ? <StatusChip tone="warning" label={`${c.short} more needed`} /> : <StatusChip tone="success" label="Covered" />}
                    <span>{c.servings} servings</span>
                  </span>
                </div>
                <div className={styles.taskTools}>
                  <label className={styles.moneyInput}>
                    <span>1 per</span>
                    <input type="number" min="1" value={c.per} onChange={(e) => setPer(c.id, e.target.value)} aria-label={`${c.name}: one dish per how many people`} />
                    <span>people</span>
                  </label>
                  <Button size="small" variant="danger" aria-label={`Remove ${c.name}`} disabled={c.filled > 0} onClick={() => configure({ categories: p.categories.filter((x) => x.id !== c.id) })}><Icon name="close" size={14} /></Button>
                </div>
                {c.dishes.length > 0 && (
                  <ul role="list" className={`${styles.rows} ${styles.subtasks}`}>
                    {c.dishes.map((d) => (
                      <li key={d.id}>
                        <span><strong>{d.dish}</strong> · {d.name} · serves {d.servings}</span>
                        {d.diet.map((x) => <StatusChip key={x} tone="neutral" label={x} />)}
                        {d.temp !== 'room' && <StatusChip tone="info" label={d.temp === 'hot' ? 'Hot' : 'Cold'} />}
                        {d.outlet && <StatusChip tone="warning" label="Needs an outlet" />}
                        <button type="button" className="link-button" onClick={() => dispatch({ type: 'potluck/remove', id: d.id })} aria-label={`Remove ${d.dish}`}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); configure({ categories: [...p.categories, { id: `${slug(name)}-${p.categories.length}`, name: name.trim(), per: 10 }] }); setName('') }}>
            <Field label="Add a category" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" disabled={!name.trim()}>Add</Button>
          </form>
          <div className="cluster">
            <Button onClick={() => dispatch({ type: 'potluck/remind', eventId: event.id, kind: '3day' })}>Send the 3-day reminder</Button>
            <Button onClick={() => dispatch({ type: 'potluck/remind', eventId: event.id, kind: 'day' })}>Send the day-before reminder</Button>
            <Button to={`/e/${event.id}/potluck?preview=1`}>Preview as guest</Button>
          </div>
        </>
      )}
    </Card>
  )
}

function VolunteerCard({ event }) {
  const { state, dispatch } = useStore()
  const [name, setName] = useState('')
  const v = event.volunteer
  const slots = volunteerBoard(state, event.id)
  const configure = (changes) => dispatch({ type: 'volunteer/configure', eventId: event.id, changes })
  const update = (id, change) => configure({ slots: v.slots.map((s) => (s.id === id ? { ...s, ...change } : s)) })
  return (
    <Card title="Volunteer slots">
      <label className={styles.check}><input type="checkbox" checked={v.enabled} onChange={(e) => configure({ enabled: e.target.checked })} /> Guests sign up to help</label>
      {v.enabled && (
        <>
          <ul role="list" className={styles.tasks} aria-label="Volunteer slots">
            {slots.map((s) => (
              <li key={s.id} className={styles.task}>
                <div className={styles.taskMain}>
                  <span className={styles.taskTitle}>{s.name}{s.time && ` · ${formatClock(s.time)}`} · {s.filled} of {s.needed}</span>
                  <span className={styles.taskMeta}>{s.people.map((x) => x.name).join(', ') || 'Nobody yet'}</span>
                </div>
                <div className={styles.taskTools}>
                  <label className={styles.moneyInput}><span className="visually-hidden">{s.name} time</span><input type="time" value={s.time} onChange={(e) => update(s.id, { time: e.target.value })} /></label>
                  <label className={styles.moneyInput}><span>Need</span><input type="number" min="1" value={s.needed} aria-label={`${s.name}: people needed`} onChange={(e) => update(s.id, { needed: Math.max(1, Number(e.target.value) || 1) })} /></label>
                  <Button size="small" variant="danger" aria-label={`Remove ${s.name}`} disabled={s.filled > 0} onClick={() => configure({ slots: v.slots.filter((x) => x.id !== s.id) })}><Icon name="close" size={14} /></Button>
                </div>
              </li>
            ))}
          </ul>
          <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); configure({ slots: [...v.slots, { id: `${slug(name)}-${v.slots.length}`, name: name.trim(), time: '', needed: 2 }] }); setName('') }}>
            <Field label="Add a slot" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" disabled={!name.trim()}>Add</Button>
          </form>
        </>
      )}
    </Card>
  )
}

export default function Potluck() {
  const { event } = useOutletContext()
  return (
    <div className="stack">
      <PotluckCard event={event} />
      <VolunteerCard event={event} />
    </div>
  )
}
