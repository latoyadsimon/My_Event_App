// One photo. Uploaded photos show the real image; booth shots in the demo
// are drawn as a colored tile wearing the event's overlay (no camera yet).
//   <PhotoTile photo={p} event={event} label="Photo 3 from the booth" />
import { formatDayShort } from '../../lib/clock'
import styles from './PhotoTile.module.css'

const SOURCE = { booth: 'Booth', magnet: 'Magnet', guest: 'Guest upload' }

export default function PhotoTile({ photo, event, overlay = event?.booth?.overlay ?? 'classic', label, children }) {
  const alt = label ?? `${SOURCE[photo.source]} photo${photo.by && photo.source !== 'booth' ? ` by ${photo.by}` : ''}`
  return (
    <figure className={styles.tile} data-overlay={overlay} style={{ '--hue': photo.hue }}>
      {photo.src
        ? <img src={photo.src} alt={alt} className={styles.img} />
        : (
          <div className={styles.art} role="img" aria-label={alt}>
            <span className={styles.people} aria-hidden="true">
              <span /><span /><span />
            </span>
            {photo.source !== 'guest' && <span className={styles.caption}>{event?.name}{event?.date ? ` · ${formatDayShort(event.date)}` : ''}</span>}
          </div>
        )}
      {children && <figcaption className={styles.tools}>{children}</figcaption>}
    </figure>
  )
}
