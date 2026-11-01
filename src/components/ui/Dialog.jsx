// =====================================================================
// A modal for short tasks (add a lead, edit a reply, preview as client).
// Native <dialog>: traps focus, closes on Escape, returns focus.
// For "are you sure?" use ConfirmDialog instead.
//
//   <Dialog open={open} title="Add a lead" onClose={() => setOpen(false)}
//     actions={<Button variant="primary" type="submit" form="add-lead">Add lead</Button>}>…</Dialog>
// =====================================================================
import { useEffect, useId, useRef } from 'react'
import Button from './Button'
import styles from './ConfirmDialog.module.css'

export default function Dialog({ open, title, children, actions, onClose, wide = false }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className={`${styles.dialog} ${wide ? styles.wide : ''}`} aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onClose() }}>
      <h2 id={titleId} className={styles.title}>{title}</h2>
      {open && <div className={styles.content}>{children}</div>}
      <div className={styles.actions}>
        <Button onClick={onClose}>{actions ? 'Cancel' : 'Close'}</Button>
        {actions}
      </div>
    </dialog>
  )
}
