// =====================================================================
// Event Hub › Tasks (PL-4.3, PL-4.4): the event's checklist.
// Due dates read "30 days before"; late tasks are flagged; tasks can go
// to me, a teammate, the client (shows in their portal) or a vendor.
// Subtasks, reorder (↑ ↓), and remove with Undo. "Send questionnaire"
// emails the client a form whose answers fill the event's details.
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getEventTasks, getMe } from '../../../store/selectors'
import { daysUntil, formatDayShort, parseDay } from '../../../lib/clock'
import { Button, Card, EmptyState, Field, Icon, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

const relative = (due, eventDate) => {
  const n = Math.round((parseDay(eventDate) - parseDay(due)) / 86400000)
  return n > 0 ? `${n} day${n === 1 ? '' : 's'} before` : n === 0 ? 'on the day' : `${-n} days after`
}

function TaskRow({ task, event, assignees, first, last }) {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(false)
  const [sub, setSub] = useState('')
  const late = !task.done && daysUntil(task.due) < 0
  const questionnaire = /questionnaire/i.test(task.title) && !task.done
  const sentQ = task.questionnaireId && state.questionnaires.find((q) => q.id === task.questionnaireId)
  const subs = task.subtasks ?? []

  return (
    <li className={`${styles.task} ${task.done ? styles.taskDone : ''}`}>
      <div className={styles.taskMain}>
        <label className={styles.taskCheck}>
          <input type="checkbox" checked={task.done} onChange={() => dispatch({ type: 'task/toggle', taskId: task.id })} />
          <span className={styles.taskTitle}>{task.title}</span>
        </label>
        <span className={styles.taskMeta}>
          {formatDayShort(task.due)} · {relative(task.due, event.date)}
          {late && <StatusChip tone="danger" label={`${-daysUntil(task.due)} day${daysUntil(task.due) === -1 ? '' : 's'} late`} />}
          {task.assignee === 'client' && <StatusChip tone="info" label="In the client's portal" />}
        </span>
      </div>
      <div className={styles.taskTools}>
        <label className={styles.assignee}>
          <span className="visually-hidden">Assign “{task.title}” to</span>
          <select value={task.assignee} onChange={(e) => dispatch({ type: 'task/update', taskId: task.id, changes: { assignee: e.target.value } })}>
            {assignees.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        {questionnaire && (sentQ?.sentAt
          ? <span className="muted">Sent {formatDayShort(sentQ.sentAt)}</span>
          : <Button size="small" onClick={() => dispatch({ type: 'questionnaire/send', eventId: event.id, taskId: task.id })}>Send questionnaire</Button>)}
        <button type="button" className="link-button" aria-expanded={open} onClick={() => setOpen(!open)}>
          {subs.length ? `${subs.filter((x) => x.done).length}/${subs.length} subtasks` : 'Subtasks'}
        </button>
        <Button size="small" onClick={() => dispatch({ type: 'task/move', taskId: task.id, dir: -1 })} disabled={first} aria-label={`Move “${task.title}” up`}>↑</Button>
        <Button size="small" onClick={() => dispatch({ type: 'task/move', taskId: task.id, dir: 1 })} disabled={last} aria-label={`Move “${task.title}” down`}>↓</Button>
        <Button size="small" variant="danger" aria-label={`Remove “${task.title}”`}
          onClick={() => { dispatch({ type: 'task/remove', taskId: task.id }); dispatch({ type: 'toast/show', text: `Removed “${task.title}”`, undo: { type: 'task/restore', taskId: task.id } }) }}>
          <Icon name="close" size={14} />
        </Button>
      </div>
      {open && (
        <div className={styles.subtasks}>
          <ul role="list">
            {subs.map((x) => (
              <li key={x.id}>
                <label className={styles.taskCheck}>
                  <input type="checkbox" checked={x.done} onChange={() => dispatch({ type: 'task/toggleSubtask', taskId: task.id, subtaskId: x.id })} />
                  <span>{x.title}</span>
                </label>
              </li>
            ))}
          </ul>
          <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); if (!sub.trim()) return; dispatch({ type: 'task/addSubtask', taskId: task.id, title: sub }); setSub('') }}>
            <Field label="New subtask" value={sub} onChange={(e) => setSub(e.target.value)} />
            <Button type="submit" size="small">Add</Button>
          </form>
        </div>
      )}
    </li>
  )
}

export default function Tasks() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [assignee, setAssignee] = useState(() => getMe(state)?.id ?? 'owner')
  const [error, setError] = useState(null)
  const tasks = getEventTasks(state, event.id)
  const assignees = [
    ...state.team.filter((m) => m.status !== 'deactivated').map((m) => [m.id, m.role === 'owner' ? `${m.name.split(' ')[0]} (me)` : m.name.split(' ')[0]]),
    ['client', 'Client'], ['vendor', 'Vendor'],
  ]
  const open = tasks.filter((t) => !t.done)
  const groups = [
    ['Late', open.filter((t) => daysUntil(t.due) < 0)],
    ['Next 30 days', open.filter((t) => daysUntil(t.due) >= 0 && daysUntil(t.due) <= 30)],
    ['Later', open.filter((t) => daysUntil(t.due) > 30)],
  ]
  const done = tasks.filter((t) => t.done)

  const add = (e) => {
    e.preventDefault()
    if (!title.trim() || !due) { setError('Add a task name and a due date.'); return }
    setError(null)
    dispatch({ type: 'task/add', eventId: event.id, title, due, assignee })
    dispatch({ type: 'toast/show', text: `Added “${title.trim()}”` })
    setTitle(''); setDue('')
  }

  return (
    <div className="stack">
      <Card title="Add a task">
        <form className={styles.addTask} onSubmit={add} noValidate>
          <Field label="Task" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Field label="Due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <Field label="Assign to" as="select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {assignees.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </Field>
          <Button type="submit" variant="primary">Add task</Button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </Card>

      {tasks.length === 0 && <EmptyState title="No tasks yet">The checklist for this event type is added when you countersign. Add your own above.</EmptyState>}

      {groups.filter(([, list]) => list.length).map(([label, list]) => (
        <Card key={label} title={`${label} (${list.length})`}>
          <ul role="list" className={styles.tasks}>
            {list.map((t, i) => <TaskRow key={t.id} task={t} event={event} assignees={assignees} first={i === 0} last={i === list.length - 1} />)}
          </ul>
        </Card>
      ))}

      {done.length > 0 && (
        <details className={styles.doneGroup}>
          <summary>Done ({done.length})</summary>
          <ul role="list" className={styles.tasks}>
            {done.map((t, i) => <TaskRow key={t.id} task={t} event={event} assignees={assignees} first={i === 0} last={i === done.length - 1} />)}
          </ul>
        </details>
      )}
    </div>
  )
}
