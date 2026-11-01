// Sign in with a magic link (NFR-1). In the demo, "sending" the link drops it
// in the Outbox; opening it signs the planner in.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { Lockup } from '../../components/brand/Brand'
import { Button, Card, Field } from '../../components/ui'
import styles from './SignIn.module.css'

const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function SignIn() {
  const { state, dispatch } = useStore()
  const [email, setEmail] = useState(state.team[0].email)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!looksLikeEmail(email)) {
      setError('Please enter a full email address, like latoya@bellaevents.com')
      return
    }
    setError('')
    dispatch({
      type: 'outbox/send',
      message: {
        type: 'email', to: email, from: 'Crowned', subject: 'Your sign-in link',
        body: 'Tap the button to sign in to Crowned. The link works once and expires in 15 minutes.',
        link: { label: 'Sign in', to: '/app/dashboard', role: 'planner' },
      },
    })
    setSent(true)
  }

  return (
    <main id="main" className={styles.page} tabIndex={-1}>
      <Lockup to="/" />
      <Card className={styles.card}>
        <h1 className={`display ${styles.title}`}>Sign in</h1>
        {sent ? (
          <div className="stack">
            <p role="status">We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes.</p>
            <Button variant="primary" to="/outbox">Open the Outbox</Button>
            <Button variant="ghost" onClick={() => setSent(false)}>Use a different email</Button>
          </div>
        ) : (
          <form className="stack" onSubmit={submit} noValidate>
            <Field label="Email" type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} error={error} />
            <Button type="submit" variant="primary" block>Email me a sign-in link</Button>
          </form>
        )}
        <p className="muted">New to Crowned? <Link to="/app/signup">Create a planner account</Link></p>
      </Card>
    </main>
  )
}
