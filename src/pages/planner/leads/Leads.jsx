// =====================================================================
// Leads (PL-2.2): every prospect on a kanban board.
// Columns New → Contacted → Consult booked → Proposal sent → Won → Lost.
// Cards move by drag and drop on desktop, and by the "Move to" menu on every
// card (keyboard and touch friendly, so dragging is never the only way).
// Some moves happen on their own: sending a proposal → Proposal sent;
// a signed contract → Won. Phones show one stage at a time with tabs.
// =====================================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getLeadBoard, dateTakenBy, leadName } from '../../../store/selectors'
import { LEAD_STAGES, LEAD_SOURCES, EVENT_TYPES, BUDGET_RANGES } from '../../../data/seed'
import { formatDayShort } from '../../../lib/clock'
import { validateInquiry } from '../../../lib/validate'
import { useShareInquiryForm } from '../../../hooks/useShareInquiryForm'
import { Button, Dialog, EmptyState, Field, Icon, PageHeader } from '../../../components/ui'
import styles from './leads.module.css'

function LeadCard({ lead }) {
  const { state, dispatch } = useStore()
  const taken = dateTakenBy(state, lead.eventDate, lead.id)
  const name = leadName(state, lead)
  return (
    <li className={styles.card} draggable onDragStart={(e) => e.dataTransfer.setData('text/lead', lead.id)}>
      <Link to={`/app/leads/${lead.id}`} className={styles.cardTitle}>{name}</Link>
      <p className={styles.cardMeta}>
        {lead.eventDate ? formatDayShort(lead.eventDate) : 'Date TBD'}
        {lead.guestCount ? ` · ${lead.guestCount} guests` : ''}
      </p>
      <p className={styles.cardMeta}>{lead.budget} · {lead.source}</p>
      {(taken && lead.stage !== 'won') && <span className={styles.badgeDanger}><Icon name="lock" size={14} />Date taken</span>}
      {lead.hold && <span className={styles.badgeHold}>Date held</span>}
      <label className={styles.move}>
        <span className="visually-hidden">Move {name} to</span>
        <select value={lead.stage} onChange={(e) => {
          dispatch({ type: 'lead/move', leadId: lead.id, stage: e.target.value })
          dispatch({ type: 'toast/show', text: `${name} moved to ${LEAD_STAGES.find((s) => s.id === e.target.value).label}` })
        }}>
          {LEAD_STAGES.map((s) => <option key={s.id} value={s.id}>{s.id === lead.stage ? s.label : `Move to ${s.label}`}</option>)}
        </select>
      </label>
    </li>
  )
}

const CLOSED_SHOWN = 3
const BLANK = { name: '', email: '', phone: '', eventType: '', eventDate: '', guestCount: '', budget: '', source: 'Referral' }

function AddLeadDialog({ open, onClose }) {
  const { dispatch } = useStore()
  const [values, setValues] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const found = validateInquiry({ ...values, notes: '' })
    setErrors(found)
    if (Object.keys(found).length) return
    dispatch({ type: 'lead/create', ...values, manual: true })
    setValues(BLANK)
    onClose()
  }

  return (
    <Dialog open={open} title="Add a lead" onClose={onClose} wide
      actions={<Button variant="primary" type="submit" form="add-lead">Add lead</Button>}>
      <p className="muted">For a call, a walk-in or a referral. No auto-reply is sent.</p>
      <form id="add-lead" className={styles.formGrid} onSubmit={submit} noValidate>
        <Field label="Name" value={values.name} onChange={set('name')} error={errors.name} />
        <Field label="Email" type="email" value={values.email} onChange={set('email')} error={errors.email} />
        <Field label="Phone (optional)" type="tel" value={values.phone} onChange={set('phone')} />
        <Field label="Event type" as="select" value={values.eventType} onChange={set('eventType')} error={errors.eventType}>
          <option value="">Choose one</option>
          {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Field>
        <Field label="Date (optional)" type="date" value={values.eventDate} onChange={set('eventDate')} />
        <Field label="Guest count" inputMode="numeric" value={values.guestCount} onChange={set('guestCount')} error={errors.guestCount} />
        <Field label="Budget" as="select" value={values.budget} onChange={set('budget')}>
          <option value="">Choose one</option>
          {BUDGET_RANGES.map((b) => <option key={b}>{b}</option>)}
        </Field>
        <Field label="Source" as="select" value={values.source} onChange={set('source')}>
          {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
        </Field>
      </form>
    </Dialog>
  )
}

export default function Leads() {
  const { state, dispatch } = useStore()
  const [source, setSource] = useState('all')
  const [phoneStage, setPhoneStage] = useState('new')
  const [adding, setAdding] = useState(false)
  const [dropTarget, setDropTarget] = useState(null)
  const [expanded, setExpanded] = useState({})   // Won / Lost show the newest few until expanded
  const shareForm = useShareInquiryForm()
  const board = getLeadBoard(state, source)
  const sources = [...new Set(state.leads.map((l) => l.source))].sort()

  const drop = (stage) => (e) => {
    e.preventDefault()
    setDropTarget(null)
    const leadId = e.dataTransfer.getData('text/lead')
    const lead = state.leads.find((l) => l.id === leadId)
    if (!lead || lead.stage === stage) return
    dispatch({ type: 'lead/move', leadId, stage })
    dispatch({ type: 'toast/show', text: `${leadName(state, lead)} moved to ${LEAD_STAGES.find((s) => s.id === stage).label}` })
  }

  const toolbar = (
    <>
      <Button variant="primary" onClick={() => setAdding(true)}>+ Add lead</Button>
      <label className={styles.filter}>
        <span>Source</span>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">All</option>
          {sources.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <Button onClick={shareForm}>Copy inquiry form link</Button>
    </>
  )

  return (
    <>
      <PageHeader title="Leads" actions={toolbar} />
      <AddLeadDialog open={adding} onClose={() => setAdding(false)} />

      {state.leads.length === 0
        ? <EmptyState title="No leads yet" action={<Button variant="primary" onClick={shareForm}>Copy link</Button>}>
            Share your inquiry form to get your first one. New inquiries land here on their own.
          </EmptyState>
        : (
          <>
            {/* Phones: one stage at a time */}
            <div className={styles.stageTabs} role="tablist" aria-label="Stages">
              {LEAD_STAGES.map((s) => (
                <button key={s.id} type="button" role="tab" aria-selected={phoneStage === s.id} className={styles.stageTab} onClick={() => setPhoneStage(s.id)}>
                  {s.label} <span className={styles.count}>{board[s.id]?.length ?? 0}</span>
                </button>
              ))}
            </div>

            <div className={styles.board}>
              {LEAD_STAGES.map((s) => {
                const all = board[s.id] ?? []
                const closed = ['won', 'lost'].includes(s.id)
                const leads = closed && !expanded[s.id] ? all.slice(0, CLOSED_SHOWN) : all
                return (
                  <section key={s.id} className={styles.column} aria-labelledby={`col-${s.id}`}
                    data-phone-active={phoneStage === s.id || undefined} data-drop={dropTarget === s.id || undefined}
                    onDragOver={(e) => { e.preventDefault(); setDropTarget(s.id) }}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={drop(s.id)}>
                    <h2 id={`col-${s.id}`} className={styles.columnTitle}>{s.label} <span className={styles.count}>{all.length}</span></h2>
                    {leads.length
                      ? <ul role="list" className={styles.cards}>{leads.map((l) => <LeadCard key={l.id} lead={l} />)}</ul>
                      : <p className={styles.emptyColumn}>No leads here</p>}
                    {all.length > leads.length && (
                      <button type="button" className={`link-button ${styles.showAll}`} onClick={() => setExpanded((x) => ({ ...x, [s.id]: true }))}>
                        Show all {all.length}
                      </button>
                    )}
                  </section>
                )
              })}
            </div>
          </>
        )}
    </>
  )
}
