// =====================================================================
// Add a guest, and import a guest list from CSV. Shared by the planner's
// Event Hub › Guests and the client's Portal › Guests (CL-3.4).
// Big imports (1,000+ rows) run in chunks with a progress bar (NFR-8),
// so the page never freezes.
// =====================================================================
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/StoreContext'
import { guestRowProblem, parseGuestsCsv } from '../../lib/csv'
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
  const [fixes, setFixes] = useState({})           // line → { name, email } typed to fix a flagged row
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const parsed = text.trim() ? parseGuestsCsv(text) : null
  // Flagged rows the person has fixed inline join the import; the rest are left out
  const fixedRows = (parsed?.problems ?? []).map((p) => ({ ...p, ...fixes[p.line] })).filter((p) => !guestRowProblem(p))
  const toRow = (p) => ({ name: p.name, email: p.email, phone: p.phone, plusOnes: p.plusOnes, tags: p.tags, allergies: p.allergies, notes: p.notes })
  const ready = parsed ? [...parsed.rows, ...fixedRows.map(toRow)] : []
  const stillWrong = (parsed?.problems ?? []).filter((p) => guestRowProblem({ ...p, ...fixes[p.line] }))
  const fix = (line, key) => (e) => setFixes((f) => ({ ...f, [line]: { ...f[line], [key]: e.target.value } }))

  const readFile = async (e) => {
    const file = e.target.files?.[0]
    if (file) setText(await file.text())
  }

  const start = () => {
    const rows = ready
    if (rows.length <= CHUNK) {
      dispatch({ type: 'guest/import', eventId, rows, addedBy })
      setText(''); setFixes({}); onClose()
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
      actions={<Button variant="primary" disabled={!ready.length || progress !== null} onClick={start}>
        {ready.length ? `Import ${ready.length} household${ready.length === 1 ? '' : 's'}` : 'Import'}
      </Button>}>
      <p className="muted">From Excel or Google Sheets: save as CSV. The first row names the columns. Only a Name column is required; allergies are always kept.</p>
      <label className={styles.file}>
        <span>Choose a CSV file</span>
        <input type="file" accept=".csv,text/csv" onChange={readFile} />
      </label>
      <Field label="…or paste it here" as="textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} />
      {parsed?.error && <Notice tone="danger">{parsed.error}</Notice>}
      {ready.length > 0 && (
        <p className={styles.preview}>
          Ready: <strong>{ready.length}</strong> household{ready.length === 1 ? '' : 's'}
          {ready.filter((r) => r.allergies).length > 0 && <> · {ready.filter((r) => r.allergies).length} with allergies</>}
        </p>
      )}
      {parsed?.problems.length > 0 && (
        <div className={styles.problems}>
          <p><strong>{stillWrong.length ? `${stillWrong.length} row${stillWrong.length === 1 ? '' : 's'} to fix` : 'All fixed'}</strong> · rows left as they are won’t be imported.</p>
          {parsed.problems.map((p) => {
            const row = { ...p, ...fixes[p.line] }
            const problem = guestRowProblem(row)
            return (
              <div key={p.line} className={styles.problem}>
                <span className={problem ? styles.bad : styles.good}>Row {p.line}: {problem ?? 'Fixed ✓'}</span>
                <Field label={`Row ${p.line} name`} value={row.name} onChange={fix(p.line, 'name')} />
                <Field label={`Row ${p.line} email`} value={row.email} onChange={fix(p.line, 'email')} />
              </div>
            )
          })}
        </div>
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
