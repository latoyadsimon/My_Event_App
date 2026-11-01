// Short confirmations ("Proposal sent to Ana"). Announced to screen readers,
// gone after 5 seconds (style guide §6). Show one with:
//   dispatch({ type: 'toast/show', text: 'Proposal sent to Ana' })
// Soft deletes offer Undo (NFR-13): pass the action that puts it back.
//   dispatch({ type: 'toast/show', text: 'Guest removed', undo: { type: 'guest/restore', guestId } })
import { useEffect } from 'react'
import { useStore } from '../../store/StoreContext'
import Icon from '../ui/Icon'
import styles from './Toasts.module.css'

function Toast({ toast, dispatch }) {
  const onDone = () => dispatch({ type: 'toast/dismiss', id: toast.id })
  // Start the 5-second timer once per toast (not on every re-render).
  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'toast/dismiss', id: toast.id }), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, dispatch])
  return (
    <li className={`${styles.toast} ${styles[toast.tone]}`}>
      <Icon name={['error', 'danger'].includes(toast.tone) ? 'close' : 'check'} size={18} />
      <span>{toast.text}</span>
      {toast.undo && <button type="button" className={styles.undo} onClick={() => { dispatch(toast.undo); onDone() }}>Undo</button>}
      <button type="button" className={styles.close} onClick={onDone} aria-label="Dismiss">
        <Icon name="close" size={16} />
      </button>
    </li>
  )
}

export default function Toasts() {
  const { state, dispatch } = useStore()
  return (
    <ol role="list" className={styles.region} aria-live="polite" aria-label="Notifications">
      {state.toasts.map((t) => (
        <Toast key={t.id} toast={t} dispatch={dispatch} />
      ))}
    </ol>
  )
}
