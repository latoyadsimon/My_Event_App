// =====================================================================
// "Are you sure?" for destructive actions (NFR-13). The confirm button says
// what will happen ("Deactivate Sam"), never just "OK". Uses the native
// <dialog>, which traps focus, closes on Escape and returns focus for us.
//
//   const [asking, setAsking] = useState(false)
//   <ConfirmDialog open={asking} title="Deactivate Sam Ortiz?" confirmLabel="Deactivate Sam"
//     onConfirm={…} onCancel={() => setAsking(false)}>Their sessions end now…</ConfirmDialog>
// =====================================================================
import { useEffect, useId, useRef } from 'react'
import Button from './Button'
import styles from './ConfirmDialog.module.css'

export default function ConfirmDialog({ open, title, children, confirmLabel, danger = true, onConfirm, onCancel }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} onCancel={(e) => { e.preventDefault(); onCancel() }}>
      <h2 id={titleId} className={styles.title}>{title}</h2>
      <div className={styles.body}>{children}</div>
      <div className={styles.actions}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  )
}
