// =====================================================================
// Add a guest, and import a guest list from CSV. Shared by the planner's
// Event Hub › Guests and the client's Portal › Guests (CL-3.4).
// Big imports (1,000+ rows) run in chunks with a progress bar (NFR-8),
// so the page never freezes.
// =====================================================================
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/StoreContext'
import { parseGuestsCsv } from '../../lib/csv'
import { Button, Dialog, Field, Notice } from '../ui'
import styles from './GuestTools.module.css'

const BLANK = { name: '', contact: '', plusOnes: '0', tags: '', allergies: '' }

export function AddGuestDialog({ open, onClose, eventId, addedBy = 'planner' }) {
  const { dispatch } = useStore()
  const [v, setV] = useState(BLANK)
  const [error, setError] = useState(null)
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }))
  const submit = (e) => {
    e.preventDefault()
    if (!v.name.trim()) { setError('Please enter a name, like “Garcia family”.'); return }
    dispatch({ type: 'guest/add', eventId, name: v.name, contact: v.contact, plusOnes: v.plusOnes, allergies: v.allergies, addedBy,
      tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean) })
    setV(BLANK); setError(null); onClose()
  }
  return (
    <Dialog open={open} title="Add a guest" onClose={onClose} wide actions={<Button variant="primary" type="submit" form="add-guest">Add guest</Button>}>
      <form id="add-guest" className={styles.grid} onSubmit={submit} noValidate>
        <Field label="Name or household" value={v.name} onChange={set('name')} error={error} />
        <Field label="Email or mobile (for the invitation)" value={v.contact} onChange={set('contact')} />
        <Field label="Plus-ones" as="select" value={v.plusOnes} onChange={set('plusOnes')}>
          {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 0 ? 'None' : `+${n}`}</option>)}
        </Field>
        <Field label="Tags (optional)" hint="Separate with commas: family, work, VIP, kids" value={v.tags} onChange={set('tags')} />
        <Field label="Allergies or dietary needs (optional)" value={v.allergies} onChange={set('allergies')} />
      </form>
    </Dialog>
  )
}

const CHUNK = 200
const EXAMPLE = 'Name,Email,Phone,Plus ones,Tags,Allergies\nGarcia family,luis@gmail.com,,1,family,\nChen household,,(512) 555-0110,2,work,Peanuts'

export function ImportDialog({ open, onClose, eventId, addedBy = 'planner' }) {
  const { dispatch } = useStore()
  const [text, setText] = useState('')
  const [progress, setProgress] = useState(null)   // 0–100 while importing
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const parsed = text.trim() ? parseGuestsCsv(text) : null

  const readFile = async (e) => {
    const file = e.target.files?.[0]
    if (file) setText(await file.text())
  }

  const start = () => {
    const rows = parsed.rows
    if (rows.length <= CHUNK) {
      dispatch({ type: 'guest/import', eventId, rows, addedBy })
      setText(''); onClose()
      return
    }
    // Big list: import in chunks so the screen stays responsive, with a progress bar
    let i = 0
    const step = () => {
      dispatch({ type: 'guest/import', eventId, rows: rows.slice(i, i + CHUNK), addedBy })
      i += CHUNK
      setProgress(Math.min(100, Math.round((i / rows.length) * 100)))
      if (i < rows.length) timer.current = setTimeout(step, 30)
      else timer.current = setTimeout(() => { setProgress(null); setText(''); onClose() }, 400)
    }
    setProgress(0)
    step()
  }

  return (
    <Dialog open={open} title="Import guests" onClose={onClose} wide
      actions={<Button variant="primary" disabled={!parsed?.rows.length || progress !== null} onClick={start}>
        {parsed?.rows.length ? `Import ${parsed.rows.length} household${parsed.rows.length === 1 ? '' : 's'}` : 'Import'}
      </Button>}>
      <p className="muted">From Excel or Google Sheets: save as CSV. The first row names the columns. Only a Name column is required; allergies are always kept.</p>
      <label className={styles.file}>
        <span>Choose a CSV file</span>
        <input type="file" accept=".csv,text/csv" onChange={readFile} />
      </label>
      <Field label="…or paste it here" as="textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} />
      {parsed?.error && <Notice tone="danger">{parsed.error}</Notice>}
      {parsed?.rows.length > 0 && (
        <p className={styles.preview}>
          Ready: <strong>{parsed.rows.length}</strong> household{parsed.rows.length === 1 ? '' : 's'}
          {parsed.rows.filter((r) => r.allergies).length > 0 && <> · {parsed.rows.filter((r) => r.allergies).length} with allergies</>}
          {parsed.skipped > 0 && <> · {parsed.skipped} rows without a name skipped</>}
        </p>
      )}
      {progress !== null && (
        <div className={styles.progress}>
          <progress max="100" value={progress} aria-label="Import progress" />
          <span>{progress}%</span>
        </div>
      )}
    </Dialog>
  )
}
