// One mood-board item (photo, link, color palette or theme notes) with its comments.
// Shown the same way in Event Hub › Files and Portal › Mood board.
import { formatDateTime, formatDayShort } from '../../lib/clock'
import Icon from '../ui/Icon'
import styles from './planning.module.css'

export default function BoardItem({ item, children }) {
  return (
    <figure className={styles.boardItem}>
      {item.kind === 'image' && <img src={item.url} alt={item.name} className={styles.boardImage} />}
      {item.kind === 'color' && (
        <div className={styles.palette} role="img" aria-label={`Colors: ${item.colors.join(', ')}`}>
          {item.colors.map((c) => <span key={c} style={{ background: c }} />)}
        </div>
      )}
      {item.kind === 'link' && <a href={item.url} target="_blank" rel="noreferrer" className={styles.boardLink}><Icon name="external" size={16} /> Open link<span className="visually-hidden"> (new tab)</span></a>}
      {item.kind === 'note' && <p className={styles.boardNote}>{item.text}</p>}
      <figcaption>
        <strong>{item.name}</strong>
        <span className="muted"> · {item.addedBy}, {formatDayShort(item.addedAt)}</span>
      </figcaption>
      {item.comments.length > 0 && (
        <ul role="list" className={styles.comments}>
          {item.comments.map((c, i) => <li key={i}><strong>{c.by}:</strong> {c.text} <span className="muted">{formatDateTime(c.at)}</span></li>)}
        </ul>
      )}
      {children}
    </figure>
  )
}

