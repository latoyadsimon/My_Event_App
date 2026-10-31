// =====================================================================
// Onboarding wizard (PL-1.2 to PL-1.7): six steps, in the wireframe's order
//   Business · Payments · Packages · Calendar · Team · Templates
// Skippable and resumable: progress saves after each step, "Skip for now"
// goes to the Dashboard, whose checklist brings you back here.
// The forms are the same components Settings uses.
// =====================================================================
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { ONBOARDING_STEPS } from '../../store/selectors'
import { validateBusiness } from '../../lib/validate'
import { Button, Icon, Notice } from '../../components/ui'
import BusinessFields from './setup/BusinessFields'
import BrandingFields from './setup/BrandingFields'
import PackagesManager from './setup/PackagesManager'
import TeamManager from './setup/TeamManager'
import TemplatesEditor from './setup/TemplatesEditor'
import { CalendarConnect, PaymentsConnect } from './setup/ConnectCards'
import styles from './Onboarding.module.css'

const STEP_INTRO = {
  business: ['Your business', 'This is what clients and guests see on every page you share: your name, logo and color.'],
  payments: ['Connect payments', 'Clients pay deposits and installments online, straight to your account.'],
  packages: ['Packages and add-ons', 'What you sell. Proposals are built from these in a few clicks.'],
  calendar: ['Connect your calendar', 'So you never double-book yourself.'],
  team: ['Invite your team', 'Optional. Choose exactly what each person can see.'],
  templates: ['Starter templates', 'Checklists and messages that set up each new event for you.'],
}

/** Step 1: business details + branding, saved together when you press Next. */
function BusinessStep({ formId, onSaved }) {
  const { state, dispatch } = useStore()
  const b = state.business
  const [values, setValues] = useState({ name: b.name, email: b.email, phone: b.phone, city: b.city, timezone: b.timezone, customDomain: b.customDomain })
  const [brand, setBrand] = useState({ logo: b.logo, brandColors: b.brandColors })
  const [errors, setErrors] = useState({})

  const submit = (e) => {
    e.preventDefault()
    const found = validateBusiness(values)
    setErrors(found)
    if (Object.keys(found).length) return
    dispatch({ type: 'business/update', changes: { ...values, ...brand, name: values.name.trim() } })
    onSaved()
  }
  return (
    <form id={formId} className="stack" onSubmit={submit} noValidate>
      <BusinessFields values={values} errors={errors} onChange={setValues} />
      <BrandingFields values={brand} onChange={setBrand} businessName={values.name} />
    </form>
  )
}

export default function Onboarding() {
  const { step } = useParams()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const headingRef = useRef(null)
  const index = ONBOARDING_STEPS.findIndex((s) => s.id === step)

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => { headingRef.current?.focus() }, [step])

  if (index === -1) return <Navigate to="/app/onboarding/business" replace />
  const [title, intro] = STEP_INTRO[step]
  const isLast = index === ONBOARDING_STEPS.length - 1
  const done = state.business.onboarding

  const goNext = () => {
    if (isLast) {
      dispatch({ type: 'toast/show', text: 'You\'re all set up. Welcome to Crowned!' })
      navigate('/app/dashboard')
    } else navigate(`/app/onboarding/${ONBOARDING_STEPS[index + 1].id}`)
  }

  // Next marks this step done. Payments and Calendar only count once something is connected;
  // Packages once there is at least one package. Otherwise Next just moves on (same as skipping a step).
  const completeAndNext = () => {
    const counts = {
      payments: Boolean(state.business.paymentProvider),
      calendar: Boolean(state.business.calendarProvider),
      packages: state.packages.some((p) => !p.archived),
    }
    if (counts[step] ?? true) dispatch({ type: 'onboarding/complete', step })
    goNext()
  }

  const formId = 'onboarding-step-form'
  return (
    <div className={styles.wizard}>
      <h1 className={`display ${styles.pageTitle}`}>Set up your business</h1>

      {!state.business.paymentProvider && step !== 'payments' && (
        <Notice tone="warning" action={<Button size="small" to="/app/onboarding/payments">Connect now</Button>}>
          Payments not connected. Clients can only pay by check or cash.
        </Notice>
      )}

      <nav aria-label="Setup steps">
        <ol className={styles.steps}>
          {ONBOARDING_STEPS.map((s, i) => (
            <li key={s.id}>
              <button type="button" className={`${styles.step} ${done[s.id] ? styles.stepDone : ''}`}
                aria-current={s.id === step ? 'step' : undefined} onClick={() => navigate(`/app/onboarding/${s.id}`)}>
                <span className={styles.stepNum} aria-hidden="true">{done[s.id] ? <Icon name="check" size={14} /> : i + 1}</span>
                <span className="visually-hidden">Step {i + 1}:</span>{' '}
                <span className={styles.stepLabel}>{s.label}</span>
                {done[s.id] && <span className="visually-hidden">, done</span>}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section className={styles.body} aria-labelledby="step-title">
        <div>
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
            Step {index + 1} of {ONBOARDING_STEPS.length} · {title}
          </h2>
          <p className="muted">{intro}</p>
        </div>
        {step === 'business' && <BusinessStep formId={formId} onSaved={() => { dispatch({ type: 'onboarding/complete', step }); goNext() }} />}
        {step === 'payments' && <PaymentsConnect />}
        {step === 'packages' && <PackagesManager />}
        {step === 'calendar' && <CalendarConnect />}
        {step === 'team' && <TeamManager />}
        {step === 'templates' && <TemplatesEditor />}
      </section>

      <div className={styles.footer}>
        {index > 0 && <Button onClick={() => navigate(`/app/onboarding/${ONBOARDING_STEPS[index - 1].id}`)}>Back</Button>}
        <span className="spacer" />
        <Button onClick={() => navigate('/app/dashboard')}>Skip for now</Button>
        {step === 'business'
          ? <Button type="submit" form={formId} variant="primary">Next</Button>
          : <Button variant="primary" onClick={completeAndNext}>{isLast ? 'Finish' : 'Next'}</Button>}
      </div>
    </div>
  )
}
