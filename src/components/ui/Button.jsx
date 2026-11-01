// A button, or a link that looks like one (pass `to`).
//   <Button variant="primary" onClick={send}>Send proposal</Button>
//   <Button to="/app/leads">Back to leads</Button>
// busy: shows busyLabel and blocks double taps (NFR-6).
import { Link } from 'react-router-dom'
import styles from './Button.module.css'

export default function Button({
  variant = 'ghost', size, block, to, busy, busyLabel, className = '', children, type = 'button', ...rest
}) {
  const cls = [styles.btn, styles[variant], size === 'small' && styles.small, block && styles.block, className]
    .filter(Boolean).join(' ')

  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>

  return (
    <button type={type} className={cls} disabled={busy || rest.disabled} aria-busy={busy || undefined} {...rest}>
      {busy ? busyLabel ?? children : children}
    </button>
  )
}
