// Settings › Templates › Event templates (PL-9.3): events saved with "Save as template"
// in the Event Hub. Start a new event from one: pick the client, name and date; the
// checklist lands on the right days before, the run of show at the right times.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { eventTypeLabel } from '../../../data/seed'
import { Button, Card, EmptyState, Field } from '../../../components/ui'

export default function EventTemplates() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const list = state.business.eventTemplates ?? []
  const [v, setV] = useState({ templateId: list[0]?.id ?? '', name: '', date: '', clientId: state.clients[0]?.id ?? '', venue: '' })
  const create = (e) => {
    e.preventDefault()
    dispatch({ type: 'template/createEvent', ...v, templateId: v.templateId || list[0].id })
    navigate(`/app/events/${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${v.date.slice(0, 4)}`)
  }
  return (
    <Card title="Event templates">
      {list.length === 0
        ? <EmptyState title="No event templates yet">Open a great event and choose “Save as template”. It keeps the checklist, run of show and extras.</EmptyState>
        : (
          <form className="stack" onSubmit={create}>
            <ul role="list" className="stack" aria-label="Event templates">
              {list.map((t) => <li key={t.id}><strong>{t.name}</strong> <span className="muted">· {eventTypeLabel(t.type)} · {t.tasks.length} tasks · {t.timeline.length} timeline items</span></li>)}
            </ul>
            <Field label="Start from" as="select" value={v.templateId} onChange={(e) => setV({ ...v, templateId: e.target.value })}>
              {list.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Field>
            <Field label="New event name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
            <Field label="Date" type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
            <Field label="Client" as="select" value={v.clientId} onChange={(e) => setV({ ...v, clientId: e.target.value })}>
              {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
            </Field>
            <Field label="Venue" value={v.venue} onChange={(e) => setV({ ...v, venue: e.target.value })} />
            <Button type="submit" variant="primary" disabled={!v.name.trim() || !v.date}>Create event</Button>
          </form>
        )}
    </Card>
  )
}
