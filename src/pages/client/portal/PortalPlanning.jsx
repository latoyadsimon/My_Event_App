// =====================================================================
// Client portal planning pages (after the deposit):
//   PortalQuestionnaire  CL-3.2  sections with progress, saves every field
//   PortalMoodBoard      CL-3.3  upload, paste Pinterest links, comment
//   PortalApprovals      CL-3.5 / CL-3.6  Waiting · Done · Coming up
//   PortalMessages       CL-4.5  one thread with the planner (open before booking too)
// =====================================================================
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getPortal, toDay } from '../../../store/selectors'
import { getTheme, themeToCssVars } from '../../../styles/themes'
import { formatDayShort, formatDateTime, parseDay } from '../../../lib/clock'
import BoardItem from '../../../components/planning/BoardItem'
import Conversation from '../../../components/planning/Conversation'
import { Button, Card, Dialog, EmptyState, Field, PageHeader, StatusChip } from '../../../components/ui'
import NotFound from '../../shared/NotFound'
import styles from './portal.module.css'

const PER_SECTION = 3
const first = (name) => name.split(' ')[0]

export function PortalQuestionnaire() {
  const { questionnaireId } = useParams()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const q = state.questionnaires.find((x) => x.id === questionnaireId)
  const [answers, setAnswers] = useState(() => q?.answers ?? {})
  const [section, setSection] = useState(0)
  if (!q) return <NotFound what="questionnaire" />

  const sections = Array.from({ length: Math.ceil(q.questions.length / PER_SECTION) }, (_, i) => q.questions.slice(i * PER_SECTION, (i + 1) * PER_SECTION))
  const answered = q.questions.filter((x) => String(answers[x.id] ?? '').trim()).length
  const lastSection = section === sections.length - 1
  const set = (id) => (e) => setAnswers((a) => ({ ...a, [id]: e.target.value }))
  const saveField = (id) => () => dispatch({ type: 'questionnaire/save', questionnaireId: q.id, answers: { [id]: answers[id] ?? '' } })

  if (q.answeredAt) {
    return (
      <>
        <PageHeader title={q.title} sub={`Sent ${formatDayShort(q.answeredAt)}. Thank you!`} />
        <Card><p>Your planner has your answers. Want to change something? <Link to="/portal/messages">Send them a message</Link>.</p></Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title={q.title} sub={`About 5 minutes · due ${formatDayShort(q.dueDate)} · saves as you go`} />
      <div className={styles.progressBar}>
        <progress max={q.questions.length} value={answered} aria-label="Questions answered" />
        <span>{answered} of {q.questions.length}</span>
      </div>
      <Card title={`Part ${section + 1} of ${sections.length}`}>
        <form className={styles.section} onSubmit={(e) => {
          e.preventDefault()
          if (!lastSection) { setSection(section + 1); return }
          dispatch({ type: 'questionnaire/answer', questionnaireId: q.id, answers })
          navigate('/portal')
        }}>
          {sections[section].map((x) => (
            <Field key={x.id} label={x.label} as={x.type === 'textarea' ? 'textarea' : 'input'}
              type={x.type === 'textarea' ? undefined : x.type === 'number' ? 'number' : x.type}
              value={answers[x.id] ?? ''} onChange={set(x.id)} onBlur={saveField(x.id)} />
          ))}
          <div className="cluster">
            {section > 0 && <Button onClick={() => setSection(section - 1)}>Back</Button>}
            <Button onClick={() => { dispatch({ type: 'questionnaire/save', questionnaireId: q.id, answers }); dispatch({ type: 'toast/show', text: 'Saved. Finish any time from Home.' }); navigate('/portal') }}>
              Save &amp; finish later
            </Button>
            <span className="spacer" />
            <Button type="submit" variant="primary">{lastSection ? 'Submit answers' : 'Next'}</Button>
          </div>
        </form>
      </Card>
    </>
  )
}

export function PortalMoodBoard() {
  const { state, dispatch } = useStore()
  const { client, event } = getPortal(state)
  const [link, setLink] = useState('')
  const [comments, setComments] = useState({})
  const [error, setError] = useState(null)
  if (!event) return null
  const items = state.files.filter((f) => f.eventId === event.id && f.board && f.shared && !f.removed)
  const me = first(client.name)

  const upload = (e) => {
    for (const file of e.target.files ?? []) {
      dispatch({ type: 'file/add', eventId: event.id, addedBy: me, file: { name: file.name, kind: 'image', url: URL.createObjectURL(file), board: true, shared: true } })
    }
    e.target.value = ''
  }
  const addLink = (e) => {
    e.preventDefault()
    if (!/^https?:\/\/\S+/.test(link)) { setError('Paste the whole link, starting with https://'); return }
    setError(null)
    dispatch({ type: 'file/add', eventId: event.id, addedBy: me, file: { name: link.includes('pinterest') ? 'Pinterest pin' : 'Inspiration link', kind: 'link', url: link, board: true, shared: true } })
    setLink('')
  }

  return (
    <>
      <PageHeader title="Mood board" sub="Share inspiration with your planner. They see everything you add." />
      <Card>
        <div className="cluster">
          <label className={styles.uploadLabel}>Upload photos<input type="file" accept="image/*" multiple onChange={upload} className="visually-hidden" /></label>
        </div>
        <form className={styles.linkForm} onSubmit={addLink}>
          <Field label="Paste a Pinterest or web link" value={link} onChange={(e) => setLink(e.target.value)} error={error} />
          <Button type="submit">Add link</Button>
        </form>
      </Card>
      {items.length === 0
        ? <EmptyState title="Nothing here yet">Upload photos you love or paste Pinterest links.</EmptyState>
        : (
          <div className={styles.board}>
            {items.map((item) => (
              <BoardItem key={item.id} item={item}>
                <form className={styles.linkForm} onSubmit={(e) => {
                  e.preventDefault()
                  if (!comments[item.id]?.trim()) return
                  dispatch({ type: 'file/comment', fileId: item.id, by: me, text: comments[item.id], fromClient: true })
                  setComments((c) => ({ ...c, [item.id]: '' }))
                }}>
                  <Field label={`Comment on ${item.name}`} value={comments[item.id] ?? ''} onChange={(e) => setComments((c) => ({ ...c, [item.id]: e.target.value }))} />
                  <Button size="small" type="submit">Post</Button>
                </form>
              </BoardItem>
            ))}
          </div>
        )}
    </>
  )
}

/** Approvals that open later (CL-3.6 "Coming up"), from the event's timeline. */
function comingUp(state, event) {
  const all = state.approvals.filter((a) => a.eventId === event.id)
  const lock = parseDay(event.date); lock.setDate(lock.getDate() - 7)
  return [
    !all.some((a) => a.kind === 'headcount') && { title: 'Final headcount', when: `opens ${formatDayShort(toDay(lock))}` },
    !all.some((a) => a.kind === 'timeline') && { title: 'Day-of timeline', when: 'about 3 weeks before' },
    !all.some((a) => a.kind === 'floorplan') && { title: 'Floor plan', when: 'about 2 weeks before' },
  ].filter(Boolean)
}

export function PortalApprovals() {
  const { state, dispatch } = useStore()
  const { client, event } = getPortal(state)
  const [changing, setChanging] = useState(null)
  const [comment, setComment] = useState('')
  if (!event) return null
  const list = state.approvals.filter((a) => a.eventId === event.id)
  const waiting = list.filter((a) => a.status === 'pending')
  const done = list.filter((a) => a.status !== 'pending')
  const theme = getTheme(event.theme)
  const decide = (a, decision, text) => dispatch({ type: 'approval/decide', approvalId: a.id, decision, by: client.name, comment: text })

  return (
    <>
      <PageHeader title="Approvals" sub="Your planner waits for your OK on these. Every answer is logged with your name and the time." />
      <Card title={`Waiting for you (${waiting.length})`}>
        {waiting.length === 0
          ? <p className="muted">Nothing waiting. You’re all caught up.</p>
          : waiting.map((a) => (
            <article key={a.id} className={styles.approval} aria-label={a.title}>
              <h3 className={styles.approvalTitle}>{a.title}</h3>
              {a.kind === 'invitation'
                ? <div className={styles.miniInvite} style={themeToCssVars(theme)}><p>{a.detail}</p></div>
                : <p>{a.detail}</p>}
              <p className="muted">Sent {formatDateTime(a.requestedAt)}</p>
              <div className="cluster">
                <Button variant="primary" onClick={() => decide(a, 'approved')}>Approve</Button>
                <Button onClick={() => { setChanging(a); setComment('') }}>{a.kind === 'change_order' ? 'Decline' : 'Request changes'}</Button>
              </div>
            </article>
          ))}
      </Card>

      <Card title="Done">
        {done.length === 0
          ? <p className="muted">Nothing yet.</p>
          : (
            <ul role="list" className={styles.rows}>
              {done.map((a) => (
                <li key={a.id}>
                  <StatusChip tone={a.status === 'approved' ? 'success' : 'info'} label={a.status === 'approved' ? 'Approved' : 'Changes requested'} />
                  <span>{a.title}</span>
                  <span className="muted">{a.decidedBy} · {formatDateTime(a.decidedAt)}{a.comment ? ` · “${a.comment}”` : ''}</span>
                </li>
              ))}
            </ul>
          )}
      </Card>

      <Card title="Coming up">
        <ul role="list" className={styles.rows}>
          {comingUp(state, event).map((c) => <li key={c.title}><span>{c.title}</span><span className="muted">{c.when}</span></li>)}
        </ul>
      </Card>

      <Dialog open={Boolean(changing)} title={changing?.kind === 'change_order' ? `Decline ${changing?.title}?` : `What should change in “${changing?.title}”?`} onClose={() => setChanging(null)}
        actions={<Button variant="primary" disabled={changing?.kind !== 'change_order' && !comment.trim()} onClick={() => { decide(changing, 'changes', comment); setChanging(null) }}>
          {changing?.kind === 'change_order' ? 'Decline' : 'Send to my planner'}
        </Button>}>
        <Field label={changing?.kind === 'change_order' ? 'Reason (optional)' : 'Your comment'} as="textarea" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Dialog>
    </>
  )
}

export function PortalMessages() {
  const { state, dispatch } = useStore()
  const { client, lead, event } = getPortal(state)
  if (!lead && !event) return <EmptyState title="No conversation yet">Your planner will reach out soon.</EmptyState>
  const key = event?.id ?? lead.id
  const thread = state.threads.find((t) => t.eventId === key && t.kind === 'client') ?? { id: 'new', name: state.business.name, messages: [] }
  const sharedVendors = state.threads.filter((t) => t.eventId === key && t.kind === 'vendor' && t.shared)
  return (
    <>
      <PageHeader title="Messages" sub={`With ${state.business.name}. You’ll get an email when they reply.`} />
      <Conversation thread={{ ...thread, name: state.business.name }} me="client"
        onSend={(text, attachment) => dispatch({ type: 'thread/postClient', eventId: key, author: first(client.name), authorFull: client.name, text, attachment })} />
      {sharedVendors.map((t) => (
        <Card key={t.id} title={`${t.name} (shared by your planner)`}>
          <ul role="list" className={styles.rows}>
            {t.messages.map((m) => <li key={m.id}><strong>{m.author}</strong><span className={styles.snippet}>{m.text}</span></li>)}
          </ul>
        </Card>
      ))}
    </>
  )
}
