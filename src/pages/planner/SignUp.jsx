// =====================================================================
// Sign up (PL-1.1). Two steps on one screen:
//   1. Create the account (email + password, or Google / Apple) → a new business with me as Owner
//   2. Protect it with a passkey or a sign-in code app (owners can't skip: NFR-1)
// then on to the onboarding wizard.
// An email that already has an account offers "Log in" and "Reset password", not a dead end.
// In the demo, signing up replaces Bella Events with your new, empty business
// ("Reset demo" brings Bella back).
// =====================================================================
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { getMe } from '../../store/selectors'
import { validateSignUp } from '../../lib/validate'
import { Button, Card, Field, Notice } from '../../components/ui'
import styles from './SignUp.module.css'

const PROVIDERS = { google: 'Google', apple: 'Apple' }

function AccountStep({ onCreated }) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [v, setV] = useState({ ownerName: '', businessName: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [existing, setExisting] = useState(null)
  const bind = (key) => ({ value: v[key], onChange: (e) => setV({ ...v, [key]: e.target.value }), error: errors[key] })

  const create = (method) => {
    const found = validateSignUp(v, method)
    setErrors(found)
    if (Object.keys(found).length) return
    const email = v.email.trim().toLowerCase()
    if (state.team.some((m) => m.email.toLowerCase() === email)) {
      setExisting(email)
      return
    }
    dispatch({ type: 'account/signUp', ownerName: v.ownerName.trim(), businessName: v.businessName.trim(), email })
    onCreated()
  }

  return (
    <>
      <h1 className={`display ${styles.title}`}>Run your whole event business in one place</h1>
      <p className="muted">Create your account. Setup takes about 10 minutes, and you can skip any step.</p>

      {existing && (
        <Notice tone="warning" action={<>
          <Button size="small" variant="primary" onClick={() => navigate('/signin')}>Log in</Button>
          <Button size="small" onClick={() => navigate('/signin')}>Reset password</Button>
        </>}>
          {existing} already has an account.
        </Notice>
      )}

      <form className="stack" onSubmit={(e) => { e.preventDefault(); create('email') }} noValidate>
        <Field label="Your name" autoComplete="name" {...bind('ownerName')} />
        <Field label="Business name" autoComplete="organization" {...bind('businessName')} />
        <Field label="Email" type="email" autoComplete="email" {...bind('email')} />
        <Field label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." {...bind('password')} />
        <Button type="submit" variant="primary" block>Create account</Button>
      </form>

      <div className={styles.or}><span>or</span></div>
      <div className="stack" style={{ '--stack-gap': 'var(--space-2)' }}>
        {Object.entries(PROVIDERS).map(([id, name]) => (
          <Button key={id} block onClick={() => create(id)}>Continue with {name}</Button>
        ))}
        <p className={styles.small}>With Google or Apple you won&apos;t need a password. We still need your name, business name and email above.</p>
      </div>
      <p className={styles.small}>Already have an account? <Link to="/signin">Log in</Link></p>
    </>
  )
}

function SecureStep() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const me = getMe(state)
  const secure = (method) => {
    dispatch({ type: 'account/secure', method })
    dispatch({ type: 'toast/show', text: method === 'passkey' ? 'Passkey saved' : 'Sign-in code app connected' })
    navigate('/app/onboarding/business')
  }
  return (
    <>
      <h1 className={`display ${styles.title}`}>Protect your account</h1>
      <p className="muted">
        {me?.name.split(' ')[0]}, your account will hold your clients&apos; payments and contracts, so owners sign in with
        something only they have. Pick one; you can add the other later.
      </p>
      <div className={styles.choices}>
        <button type="button" className={styles.choice} onClick={() => secure('passkey')}>
          <span className={styles.choiceTitle}>Create a passkey</span>
          <span className="muted">Sign in with your face, fingerprint or phone screen lock. Nothing to type. Recommended.</span>
        </button>
        <button type="button" className={styles.choice} onClick={() => secure('authenticator')}>
          <span className={styles.choiceTitle}>Use a sign-in code app</span>
          <span className="muted">Google Authenticator, 1Password or similar gives you a 6-digit code each time.</span>
        </button>
      </div>
    </>
  )
}

export default function SignUp() {
  const [params] = useSearchParams()
  const [step, setStep] = useState(params.get('step') === 'secure' ? 'secure' : 'account')
  return (
    <Card className={styles.card}>
      <p className={styles.progress}>Step {step === 'account' ? 1 : 2} of 2</p>
      {step === 'account' ? <AccountStep onCreated={() => setStep('secure')} /> : <SecureStep />}
    </Card>
  )
}
