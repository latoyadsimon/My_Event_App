// Duplicate an event, or save it as a template (PL-9.3), from the Event Hub header.
// Tasks keep their "days before", the run of show keeps its times, and the extras
// (booth, karaoke, potluck, gear kits) come along. Vendors, guests and money don't.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { Button, Dialog, Field } from '../ui'

export default function EventCopyTools({ event }) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(null)        // 'duplicate' | 'template'
  const next = `${Number(event.date.slice(0, 4)) + 1}${event.date.slice(4)}`
  const [v, setV] = useState({ name: event.name, date: next, clientId: event.clientId, template: `${event.name} template` })
  const duplicate = (e) => {
    e.preventDefault()
    dispatch({ type: 'event/duplicate', eventId: event.id, name: v.name, date: v.date, clientId: v.clientId })
    setOpen(null)
    const id = `${v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${v.date.slice(0, 4)}`
    navigate(`/app/events/${id}`)
  }
  return (
    <>
      <Button size="small" onClick={() => setOpen('duplicate')}>Duplicate</Button>
      <Button size="small" onClick={() => setOpen('template')}>Save as template</Button>
      <Dialog open={open === 'duplicate'} title={`Duplicate ${event.name}`} onClose={() => setOpen(null)}
        actions={<Button variant="primary" type="submit" form="dup-form" disabled={!v.name.trim() || !v.date}>Create the copy</Button>}>
        <form id="dup-form" className="stack" onSubmit={duplicate}>
          <Field label="Name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          <Field label="New date" type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
          <Field label="Client" as="select" value={v.clientId} onChange={(e) => setV({ ...v, clientId: e.target.value })}>
            {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
          </Field>
          <p className="muted">Copies the checklist (same days before), the run of show, the booth/karaoke/potluck setup and gear kits. Not guests, vendors or money.</p>
        </form>
      </Dialog>
      <Dialog open={open === 'template'} title="Save as a template" onClose={() => setOpen(null)}
        actions={<Button variant="primary" type="submit" form="tpl-form" disabled={!v.template.trim()}>Save template</Button>}>
        <form id="tpl-form" className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'template/save', eventId: event.id, name: v.template }); setOpen(null) }}>
          <Field label="Template name" value={v.template} onChange={(e) => setV({ ...v, template: e.target.value })} />
          <p className="muted">Start new events from it in Settings › Templates.</p>
        </form>
      </Dialog>
    </>
  )
}
