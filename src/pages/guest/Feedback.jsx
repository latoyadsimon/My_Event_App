// =====================================================================
// Guest › one-question survey (GU-6.2), /e/:slug/feedback?t=<guest>.
// A 1–5 scale and an optional comment; one answer per guest link. EN | ES.
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { Button, Field } from '../../components/ui'
import styles from './guest.module.css'

export default function Feedback() {
  const { event, guest, token, t } = useOutletContext()
  const { state, dispatch } = useStore()
  const [score, setScore] = useState(null)
  const [comment, setComment] = useState('')
  const key = `survey-${event.id}-${token ?? 'public'}`
  const done = state.feedback.some((f) => f.key === key)
  return (
    <section className={styles.panel} aria-live="polite">
      {done ? <h1 className={styles.siteTitle}>{t('feedbackThanks')}</h1> : (
        <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'feedback/submit', eventId: event.id, from: 'guest', name: guest?.name, key, score, comment }) }}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.siteTitle}>{t('feedbackQ', { event: event.name })}</legend>
            <div className={styles.scale} role="radiogroup" aria-label={t('feedbackQ', { event: event.name })}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={score === n} className={styles.amount} onClick={() => setScore(n)}>{n}</button>
              ))}
            </div>
            <div className={styles.scaleEnds} aria-hidden="true"><span>{t('feedbackLow')}</span><span>{t('feedbackHigh')}</span></div>
          </fieldset>
          <Field label={t('feedbackComment')} as="textarea" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button type="submit" variant="primary" disabled={!score}>{t('feedbackSend')}</Button>
        </form>
      )}
    </section>
  )
}
