// A page or record that doesn't exist. Says what happened and where to go.
import { Button } from '../../components/ui'
import styles from './Message.module.css'

// standalone: the whole page (adds the <main> landmark); otherwise it sits inside a layout's <main>.
export default function NotFound({ what = 'page', standalone = false }) {
  const Tag = standalone ? 'main' : 'div'
  return (
    <Tag id={standalone ? 'main' : undefined} className={styles.wrap} tabIndex={standalone ? -1 : undefined}>
      <h1 className={`display ${styles.title}`}>We couldn&apos;t find that {what}</h1>
      <p className="muted">The link may be old, or the {what} may have been removed.</p>
      <Button variant="primary" to="/">Go to the start</Button>
    </Tag>
  )
}
