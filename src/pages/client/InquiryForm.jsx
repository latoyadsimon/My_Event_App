// =====================================================================
// Inquiry Form (CL-1.1, PL-2.1): a prospect tells the planner about their
// event. No account. Planners embed it on their website, Instagram and
// Facebook. Sending it creates a lead, pushes to the planner and emails the
// prospect an auto-reply with a link to book a consult.
// =====================================================================
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { EVENT_TYPES, SERVICES, BUDGET_RANGES, LEAD_SOURCES } from '../../data/seed'
import { validateInquiry } from '../../lib/validate'
import { Button, Card, Field, Icon } from '../../components/ui'
import NotFound from '../shared/NotFound'
import styles from './public.module.css'

const PUBLIC_SERVICES = SERVICES.slice(0, 6)
const EMPTY = { name: '', email: '', phone: '', eventType: '', eventDate: '', guestCount: '', budget: '', source: '', services: [], notes: '' }

export default function InquiryForm() {
  const { biz } = useParams()
  const { state, dispatch } = useStore()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sentTo, setSentTo] = useState(null)

  if (biz !== state.business.slug) return <NotFound what="page" />

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  const toggleService = (service) => setValues((v) => ({
    ...v, services: v.services.includes(service) ? v.services.filter((s) => s !== service) : [...v.services, service],
  }))

  const submit = (e) => {
    e.preventDefault()
    const found = validateInquiry(values)
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(`inq-${Object.keys(found)[0]}`)?.focus()
      return
    }
    dispatch({ type: 'lead/create', ...values, source: values.source || 'Other' })
    setSentTo(values.name.trim().split(/\s+/)[0])
  }

  if (sentTo) {
    return (
      <Card className={styles.done} aria-live="polite">
        <span className={styles.doneIcon}><Icon name="check" size={24} /></span>
        <h1 className={`display ${styles.title}`}>Thanks, {sentTo}!</h1>
        <p>{state.business.name} got your details. Here&apos;s what happens next:</p>
        <ol className={styles.steps}>
          <li><strong>Check your email</strong> for a link to book a free consult.</li>
          <li><strong>Meet us</strong> and share your ideas.</li>
          <li><strong>Get your proposal</strong>, usually within two days.</li>
        </ol>
        <p className={styles.demoNote}>Demo: the email and the planner&apos;s notification are in the <Link to="/outbox">Outbox</Link>.</p>
      </Card>
    )
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <header>
        <h1 className={`display ${styles.title}`}>Tell us about your event</h1>
        <p className="muted">No account needed. We reply within one business day.</p>
      </header>

      <div className={styles.grid2}>
        <Field id="inq-name" label="Your name" autoComplete="name" value={values.name} onChange={set('name')} error={errors.name} />
        <Field id="inq-email" label="Email" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email} />
        <Field id="inq-phone" label="Phone (optional)" type="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} />
        <Field id="inq-eventType" label="Event type" as="select" value={values.eventType} onChange={set('eventType')} error={errors.eventType}>
          <option value="">Choose one</option>
          {EVENT_TYPES.filter((t) => t.id !== 'memorial').map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          <option value="memorial">Memorial or celebration of life</option>
        </Field>
        <Field id="inq-eventDate" label="Date" hint="Not sure yet? Leave it blank." type="date" value={values.eventDate} onChange={set('eventDate')} />
        <Field id="inq-guestCount" label="Guest count" inputMode="numeric" value={values.guestCount} onChange={set('guestCount')} error={errors.guestCount} />
        <Field id="inq-budget" label="Budget range" as="select" value={values.budget} onChange={set('budget')}>
          <option value="">Choose one</option>
          {BUDGET_RANGES.map((b) => <option key={b}>{b}</option>)}
        </Field>
        <Field id="inq-source" label="How did you hear about us?" as="select" value={values.source} onChange={set('source')}>
          <option value="">Choose one</option>
          {LEAD_SOURCES.filter((s) => s !== 'Booking page').map((s) => <option key={s}>{s}</option>)}
        </Field>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Services you want</legend>
        <div className={styles.checks}>
          {PUBLIC_SERVICES.map((service) => (
            <label key={service} className={styles.check}>
              <input type="checkbox" checked={values.services.includes(service)} onChange={() => toggleService(service)} />
              {service}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="inq-notes" label="Anything else?" as="textarea" value={values.notes} onChange={set('notes')} />

      <Button type="submit" variant="primary" block>Send inquiry</Button>
    </form>
  )
}
