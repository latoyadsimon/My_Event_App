// =====================================================================
// Event Hub › Guests › Website & RSVP (PL-5.2): what the event website
// shows, what the RSVP form asks, plus-ones, privacy and late RSVPs.
// Nothing changes for guests until Save. "Preview as guest" opens the
// real event website.
// =====================================================================
import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { Button, Card, Field, Icon, Notice } from '../../../components/ui'
import styles from './hub.module.css'

const PRIVACY = [['private', 'Private link'], ['password', 'Password'], ['public', 'Public']]
const scheduleText = (list) => list.map((x) => `${x.time} · ${x.text}`).join('\n')
const parseSchedule = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const [time, ...rest] = l.split(/\s*[·\-–]\s*/)
  return rest.length ? { time, text: rest.join(' · ') } : { time: '', text: time }
})

export default function Website() {
  const { event } = useOutletContext()
  const { dispatch } = useStore()
  const navigate = useNavigate()
  const [site, setSite] = useState(event.site)
  const [schedule, setSchedule] = useState(scheduleText(event.site.schedule))
  const [newMeal, setNewMeal] = useState('')
  const [newQuestion, setNewQuestion] = useState('')
  const [error, setError] = useState(null)
  const set = (k, v) => setSite((s) => ({ ...s, [k]: v }))
  const section = (k) => (e) => setSite((s) => ({ ...s, sections: { ...s.sections, [k]: e.target.checked } }))

  const save = (e) => {
    e?.preventDefault()
    if (site.fundLink && !/^https?:\/\/\S+\.\S+/.test(site.fundLink)) { setError('The fund link should be a full web address, starting with https://'); return }
    if (site.privacy === 'password' && !site.password.trim()) { setError('Please set the password guests will type.'); return }
    setError(null)
    dispatch({ type: 'site/update', eventId: event.id, changes: { ...site, schedule: parseSchedule(schedule) } })
  }
  const preview = () => {
    save()
    dispatch({ type: 'ui/setRole', role: 'guest' })
    navigate(`/e/${event.id}?preview=1`)
  }

  return (
    <form className="stack" onSubmit={save} noValidate>
      <div className={styles.grid2}>
        <Card title="Event website">
          <Field label="Welcome message" as="textarea" value={site.welcome} onChange={(e) => set('welcome', e.target.value)} />
          <label className={styles.check}><input type="checkbox" checked={site.sections.schedule} onChange={section('schedule')} /> Schedule</label>
          {site.sections.schedule && <Field label="Schedule" hint="One per line: 7:00 PM · Cocktails" as="textarea" value={schedule} onChange={(e) => setSchedule(e.target.value)} />}
          <label className={styles.check}><input type="checkbox" checked={site.sections.dressCode} onChange={section('dressCode')} /> Dress code</label>
          {site.sections.dressCode && <Field label="Dress code" value={site.dressCode} onChange={(e) => set('dressCode', e.target.value)} placeholder="Garden formal" />}
          <label className={styles.check}><input type="checkbox" checked={site.sections.hotel} onChange={section('hotel')} /> Hotel block</label>
          {site.sections.hotel && <Field label="Hotel block" value={site.hotel} onChange={(e) => set('hotel', e.target.value)} placeholder="Riverwalk Inn · code RIVERA27" />}
          <label className={styles.check}><input type="checkbox" checked={site.sections.faq} onChange={section('faq')} /> FAQ</label>
          {site.sections.faq && (
            <div className="stack" style={{ '--stack-gap': 'var(--space-2)' }}>
              {site.faq.map((f, i) => (
                <div key={i} className={styles.faqRow}>
                  <Field label={`Question ${i + 1}`} value={f.q} onChange={(e) => set('faq', site.faq.map((x, k) => (k === i ? { ...x, q: e.target.value } : x)))} />
                  <Field label="Answer" value={f.a} onChange={(e) => set('faq', site.faq.map((x, k) => (k === i ? { ...x, a: e.target.value } : x)))} />
                  <Button size="small" onClick={() => set('faq', site.faq.filter((_, k) => k !== i))} aria-label={`Remove question ${i + 1}`}><Icon name="close" size={14} /></Button>
                </div>
              ))}
              <Button size="small" onClick={() => set('faq', [...site.faq, { q: '', a: '' }])}>+ Add a question</Button>
            </div>
          )}
          <Field label="Registry or fund link" hint="Opens in a new tab for guests" value={site.fundLink} onChange={(e) => set('fundLink', e.target.value)} placeholder="https://honeyfund.com/rivera" />
        </Card>

        <Card title="RSVP form">
          <Field label="RSVP cutoff" type="date" value={site.rsvpCutoff ?? ''} onChange={(e) => set('rsvpCutoff', e.target.value || null)} />
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Meal choices</legend>
            <div className={styles.chipsRow}>
              {site.meals.length === 0 && <span className="muted">No meal question</span>}
              {site.meals.map((m) => (
                <span key={m} className={styles.editChip}>{m}
                  <button type="button" onClick={() => set('meals', site.meals.filter((x) => x !== m))} aria-label={`Remove ${m}`}><Icon name="close" size={12} /></button>
                </span>
              ))}
            </div>
            <div className={styles.inlineForm}>
              <Field label="Add a meal" value={newMeal} onChange={(e) => setNewMeal(e.target.value)} />
              <Button size="small" onClick={() => { if (newMeal.trim() && !site.meals.includes(newMeal.trim())) set('meals', [...site.meals, newMeal.trim()]); setNewMeal('') }}>Add</Button>
            </div>
          </fieldset>
          <label className={styles.check}><input type="checkbox" checked={site.askAllergies} onChange={(e) => set('askAllergies', e.target.checked)} /> Ask about allergies and dietary needs</label>
          <label className={styles.check}><input type="checkbox" checked={site.songRequest} onChange={(e) => set('songRequest', e.target.checked)} /> Song request</label>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Your own questions</legend>
            {site.customQuestions.map((q, i) => (
              <span key={i} className={styles.editChip}>{q}
                <button type="button" onClick={() => set('customQuestions', site.customQuestions.filter((_, k) => k !== i))} aria-label={`Remove “${q}”`}><Icon name="close" size={12} /></button>
              </span>
            ))}
            <div className={styles.inlineForm}>
              <Field label="Custom question" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Will you need a ride from the hotel?" />
              <Button size="small" onClick={() => { if (newQuestion.trim()) set('customQuestions', [...site.customQuestions, newQuestion.trim()]); setNewQuestion('') }}>+ Add</Button>
            </div>
          </fieldset>
        </Card>
      </div>

      <Card title="Plus-ones & privacy">
        <Field label="Default plus-ones per household" hint="Change one household in the Guest list" as="select" value={site.defaultPlusOnes} onChange={(e) => set('defaultPlusOnes', Number(e.target.value))}>
          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n === 0 ? 'None' : `+${n}`}</option>)}
        </Field>
        <div className={styles.segmented} role="radiogroup" aria-label="Who can see the website">
          {PRIVACY.map(([id, label]) => <button key={id} type="button" role="radio" aria-checked={site.privacy === id} onClick={() => set('privacy', id)}>{label}</button>)}
        </div>
        {site.privacy === 'password' && <Field label="Password guests type" value={site.password} onChange={(e) => set('password', e.target.value)} />}
        <p className="muted">
          {site.privacy === 'public' ? 'Anyone with the address can see it. Visitors who aren’t on the list give their name and contact and are added as guests.'
            : site.privacy === 'password' ? 'Guests type the password once. Their invitation link works without it.'
              : 'Only people with their own invitation link can see it. Anyone else sees “Ask the host”.'}
        </p>
        <label className={styles.check}><input type="checkbox" checked={site.allowLate} onChange={(e) => set('allowLate', e.target.checked)} /> Allow late RSVPs after the cutoff</label>
      </Card>

      {error && <Notice tone="danger">{error}</Notice>}
      <div className="cluster">
        <Button onClick={preview}>Preview as guest</Button>
        <Button type="submit" variant="primary">Save</Button>
      </div>
    </form>
  )
}
