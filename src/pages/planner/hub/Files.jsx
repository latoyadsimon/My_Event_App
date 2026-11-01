// =====================================================================
// Event Hub › Files (PL-4.5): files marked Shared (the client sees them)
// or Private, and the mood board: images, Pinterest links, a color
// palette and theme notes. The client can comment; "Request approval"
// sends an item to Portal › Approvals.
// Uploads stay in this browser tab (no storage until Supabase).
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { formatDayShort } from '../../../lib/clock'
import { isHexColor } from '../../../lib/brand'
import { Button, Card, Dialog, EmptyState, Field, Icon } from '../../../components/ui'
import BoardItem from '../../../components/planning/BoardItem'
import styles from './hub.module.css'

function AddToBoard({ eventId, open, onClose }) {
  const { dispatch } = useStore()
  const [kind, setKind] = useState('link')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [colors, setColors] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const add = () => {
    const palette = colors.split(/[\s,]+/).filter(Boolean)
    if (!name.trim()) return setError('Give it a short name.')
    if (kind === 'link' && !/^https?:\/\//.test(url)) return setError('Paste the full link, starting with https://')
    if (kind === 'color' && (!palette.length || !palette.every(isHexColor))) return setError('Use color codes like #C9A227, separated by commas.')
    if (kind === 'note' && !text.trim()) return setError('Write the note.')
    dispatch({ type: 'file/add', eventId, file: { name: name.trim(), kind, url, colors: palette, text, board: true, shared: true } })
    setName(''); setUrl(''); setColors(''); setText(''); setError(null); onClose()
  }
  return (
    <Dialog open={open} title="Add to the mood board" onClose={onClose} actions={<Button variant="primary" onClick={add}>Add</Button>}>
      <Field label="Type" as="select" value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="link">Pinterest or web link</option><option value="color">Color palette</option><option value="note">Theme notes</option>
      </Field>
      <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      {kind === 'link' && <Field label="Link" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.pinterest.com/pin/…" />}
      {kind === 'color' && <Field label="Colors" hint="Color codes, separated by commas" value={colors} onChange={(e) => setColors(e.target.value)} placeholder="#1B1B1F, #C9A227" />}
      {kind === 'note' && <Field label="Notes" as="textarea" value={text} onChange={(e) => setText(e.target.value)} />}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </Dialog>
  )
}

export default function Files() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [adding, setAdding] = useState(false)
  const items = state.files.filter((f) => f.eventId === event.id && !f.removed)
  const board = items.filter((f) => f.board)
  const plain = items.filter((f) => !f.board)

  const upload = (board) => (e) => {
    for (const file of e.target.files ?? []) {
      const image = file.type.startsWith('image/')
      dispatch({ type: 'file/add', eventId: event.id, file: { name: file.name, kind: image ? 'image' : 'file', url: URL.createObjectURL(file), board: board && image, shared: board } })
    }
    dispatch({ type: 'toast/show', text: `Uploaded ${e.target.files.length} file${e.target.files.length === 1 ? '' : 's'}` })
    e.target.value = ''
  }
  const remove = (f) => {
    dispatch({ type: 'file/remove', fileId: f.id })
    dispatch({ type: 'toast/show', text: `Removed ${f.name}`, undo: { type: 'file/restore', fileId: f.id } })
  }

  return (
    <div className="stack">
      <Card title="Files" action={<label className={styles.uploadButton}>Upload files<input type="file" multiple onChange={upload(false)} className="visually-hidden" /></label>}>
        {plain.length === 0
          ? <p className="muted">No files yet. Contracts, floor plans, vendor quotes…</p>
          : (
            <ul role="list" className={styles.rows}>
              {plain.map((f) => (
                <li key={f.id}>
                  <Icon name="proposal" size={18} />
                  {f.url ? <a href={f.url} target="_blank" rel="noreferrer">{f.name}</a> : <span>{f.name}</span>}
                  <span className="muted">{formatDayShort(f.addedAt)}</span>
                  <span className="spacer" />
                  <label className={styles.check}>
                    <input type="checkbox" checked={f.shared} onChange={(e) => dispatch({ type: 'file/update', fileId: f.id, changes: { shared: e.target.checked } })} />
                    {f.shared ? 'Shared with client' : 'Private'}<span className="visually-hidden"> ({f.name})</span>
                  </label>
                  <Button size="small" variant="danger" onClick={() => remove(f)} aria-label={`Remove ${f.name}`}><Icon name="close" size={14} /></Button>
                </li>
              ))}
            </ul>
          )}
      </Card>

      <Card title="Mood board" action={
        <span className="cluster">
          <label className={styles.uploadButton}>Upload images<input type="file" accept="image/*" multiple onChange={upload(true)} className="visually-hidden" /></label>
          <Button size="small" onClick={() => setAdding(true)}>+ Link, colors or notes</Button>
        </span>
      }>
        {board.length === 0
          ? <EmptyState title="Start the mood board">Add inspiration photos, Pinterest links, a color palette and theme notes. The client sees it and can comment.</EmptyState>
          : (
            <div className={styles.board}>
              {board.map((item) => {
                const approval = state.approvals.filter((a) => a.refId === item.id).at(-1)
                return (
                  <BoardItem key={item.id} item={item}>
                    <div className={styles.boardActions}>
                      {approval
                        ? <span className="muted">{approval.status === 'approved' ? `✓ Approved by ${approval.decidedBy}` : approval.status === 'pending' ? 'Waiting for approval' : 'Changes requested'}</span>
                        : <Button size="small" onClick={() => dispatch({ type: 'file/requestApproval', fileId: item.id })}>Request approval</Button>}
                      <Button size="small" variant="danger" onClick={() => remove(item)} aria-label={`Remove ${item.name}`}><Icon name="close" size={14} /></Button>
                    </div>
                  </BoardItem>
                )
              })}
            </div>
          )}
      </Card>
      <AddToBoard eventId={event.id} open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
