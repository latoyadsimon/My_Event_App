// =====================================================================
// Portal › Review (CL-6.4): one-tap links to Google, Yelp, The Knot and
// WeddingWire, and a short private survey (a 1–5 rating and a comment).
// Memorial families only see the private question, never public sites.
// =====================================================================
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getPortal } from '../../../store/selectors'
import { REVIEW_SITES } from '../../../data/seedGrow'
import { Button, Card, Field, Icon, PageHeader, Stars } from '../../../components/ui'
import styles from './portal.module.css'

export default function PortalReview() {
  const { state, dispatch } = useStore()
  const { event, client } = getPortal(state)
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  if (!event) return <Navigate to="/portal" replace />
  const mine = state.feedback.find((f) => f.eventId === event.id && f.from === 'client')
  const memorial = event.type === 'memorial'
  return (
    <>
      <PageHeader title={memorial ? 'How did we do?' : 'Leave a review'} sub={event.name} />
      {!memorial && (
        <Card title="Share it publicly">
          <p className="muted">A few words help other families find {state.business.name}. Each opens in a new tab.</p>
          <ul role="list" className={styles.reviewLinks}>
            {REVIEW_SITES.map(([id, label, url]) => (
              <li key={id}><a href={url} target="_blank" rel="noreferrer"><Icon name="external" size={14} /> {label}<span className="visually-hidden"> (opens in a new tab)</span></a></li>
            ))}
          </ul>
        </Card>
      )}
      <Card title="Tell us privately">
        {mine ? <p><Stars n={mine.score} /> Thank you{mine.comment ? `: “${mine.comment}”` : '!'}</p> : (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'feedback/submit', eventId: event.id, from: 'client', name: client.name, key: `client-${event.id}`, score, comment }) }}>
            <div className={styles.segmented} role="radiogroup" aria-label="Your rating out of 5">
              {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={score === n} onClick={() => setScore(n)}>{n}</button>)}
            </div>
            <Field label="What went well, and what could be better?" as="textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button type="submit" variant="primary" disabled={!score}>Send</Button>
          </form>
        )}
      </Card>
    </>
  )
}
