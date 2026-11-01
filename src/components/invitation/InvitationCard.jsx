// =====================================================================
// The invitation as guests see it, drawn from the event theme plus the
// designer's choices (PL-5.5): another template, display font, accent
// color (kept readable on the card), a photo, the layout.
// Used by the designer preview, the guest's invitation and the print page.
//   <InvitationCard event={event} design={designOf(event)} kicker="You're invited" title={event.name}>…lines…</InvitationCard>
//   <Envelope design={design} onOpen={…} onSkip={…} />   the optional animated opening, always with Skip
// =====================================================================
import { useEffect, useState } from 'react'
import { designVars } from '../../lib/invitationDesign'
import { Button } from '../ui'
import styles from './InvitationCard.module.css'

export default function InvitationCard({ event, design, kicker, title, titleAs: Title = 'p', children, label = 'Invitation' }) {
  return (
    <article className={styles.card} data-layout={design.layout} style={designVars(event, design)} aria-label={label}>
      {design.photo && <img className={styles.photo} src={design.photo} alt="" />}
      <div className={styles.inner}>
        {kicker && <p className={styles.kicker}>{kicker}</p>}
        <Title className={styles.title}>{title}</Title>
        {children}
      </div>
    </article>
  )
}

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** The envelope intro: tap to open (it unfolds), or Skip. No animation for reduced motion. */
export function Envelope({ event, design, name, onOpen, onSkip = onOpen, openLabel = 'Open your invitation', skipLabel = 'Skip' }) {
  const [opening, setOpening] = useState(false)
  useEffect(() => {
    if (!opening) return undefined
    const t = setTimeout(onOpen, reduceMotion() ? 0 : 900)
    return () => clearTimeout(t)
  }, [opening, onOpen])
  return (
    <section className={styles.envelope} data-opening={opening || undefined} style={designVars(event, design)} aria-label={openLabel}>
      <div className={styles.paper} aria-hidden="true"><span className={styles.flap} /><span className={styles.seal}>{name?.[0] ?? '♥'}</span></div>
      {name && <p className={styles.to}>{name}</p>}
      <div className={styles.envelopeButtons}>
        <Button variant="primary" onClick={() => setOpening(true)}>{openLabel}</Button>
        <Button onClick={onSkip}>{skipLabel}</Button>
      </div>
    </section>
  )
}
