// =====================================================================
// Staff (ST-1.1, ST-1.2):
//   StaffJoin     /join/:token        accept the invite, sign in with phone + SMS code
//   StaffProfile  /app/staff/profile  photo, contact, emergency contact, skills, shirt size
// No passwords for staff. The role is the one the owner set (read-only).
// Demo SMS code: 123456 (anything else is "wrong"; "Send a new code" always works).
// =====================================================================
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { Button, Card, Field, Icon, Notice, PageHeader } from '../../components/ui'
import NotFound from '../shared/NotFound'
import styles from './staff.module.css'

const DEMO_CODE = '123456'
const SKILLS = ['KJ', 'Photo booth', 'Bartending', 'Serving', 'Coordinator', 'Setup crew']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
const ROLE_WORDS = { owner: 'Owner', coordinator: 'Coordinator', staff: 'Staff' }

export function StaffJoin() {
  const { token } = useParams()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const member = state.team.find((m) => m.inviteToken === token)
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [step, setStep] = useState('phone')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [resent, setResent] = useState(false)

  if (!member) return <NotFound what="invite" />
  if (member.status === 'deactivated') return <Notice tone="warning">This invite is no longer active. Ask {state.business.name} for a new one.</Notice>

  const sendCode = (e) => {
    e?.preventDefault()
    if (phone.replace(/\D/g, '').length < 10) { setError('Please enter your 10-digit mobile number.'); return }
    setError(null); setStep('code'); setCode('')
  }
  const verify = (e) => {
    e.preventDefault()
    if (code.trim() !== DEMO_CODE) { setError('That code didn’t work. It may be mistyped or expired.'); return }
    dispatch({ type: 'team/join', token, phone })
    navigate('/app/staff/profile')
  }

  return (
    <Card>
      <p className={styles.kicker}>{state.business.name} invited you</p>
      <h1 className={`display ${styles.title}`}>Join the team as {member.jobTitle}</h1>
      {member.status === 'active' && <Notice tone="info">You’ve already joined. Sign in with your phone to continue.</Notice>}
      {step === 'phone'
        ? (
          <form className="stack" onSubmit={sendCode} noValidate>
            <p className="muted">No password. We’ll text you a 6-digit code.</p>
            <Field label="Mobile number" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} />
            <Button type="submit" variant="primary">Text me a code</Button>
          </form>
        )
        : (
          <form className="stack" onSubmit={verify} noValidate>
            <p className="muted">We texted a code to {phone}. <span className={styles.demo}>Demo code: {DEMO_CODE}</span></p>
            <Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} error={error} />
            <div className="cluster">
              <Button type="submit" variant="primary">Sign in</Button>
              <Button onClick={() => { setError(null); setCode(''); setResent(true) }}>Send a new code</Button>
              <button type="button" className="link-button" onClick={() => { setStep('phone'); setError(null) }}>Use a different number</button>
            </div>
            {resent && <p className="muted" role="status">New code sent.</p>}
          </form>
        )}
      <p className="muted">Get the Crowned app for your phone, or keep using this page. Both work.</p>
    </Card>
  )
}

export function StaffProfile() {
  const { state, dispatch } = useStore()
  const me = state.team.find((m) => m.id === state.ui.staffId) ?? state.team.find((m) => m.role === 'staff')
  const [v, setV] = useState(() => ({
    name: me.name, phone: me.phone ?? '', emergencyContact: me.emergencyContact ?? '', skills: me.skills ?? [], shirtSize: me.shirtSize ?? '', photo: me.photo ?? null,
  }))
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }))
  const toggle = (skill) => setV((x) => ({ ...x, skills: x.skills.includes(skill) ? x.skills.filter((s) => s !== skill) : [...x.skills, skill] }))
  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) setV((x) => ({ ...x, photo: URL.createObjectURL(file) }))
  }

  return (
    <>
      <PageHeader title="Profile" sub={`${state.business.name} · ${me.jobTitle}`} />
      <form className="stack" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'team/updateProfile', memberId: me.id, changes: v }) }}>
        <Card title="You">
          <div className={styles.photoRow}>
            <span className={styles.photo}>{v.photo ? <img src={v.photo} alt="" /> : <Icon name="user" size={28} />}</span>
            <label className={styles.upload}>{v.photo ? 'Change photo' : 'Add a photo'}<input type="file" accept="image/*" onChange={pickPhoto} className="visually-hidden" /></label>
          </div>
          <div className={styles.grid}>
            <Field label="Name" value={v.name} onChange={set('name')} />
            <Field label="Mobile" type="tel" value={v.phone} onChange={set('phone')} />
            <Field label="Emergency contact" hint="Name and phone" value={v.emergencyContact} onChange={set('emergencyContact')} />
            <Field label="Shirt size" as="select" value={v.shirtSize} onChange={set('shirtSize')}>
              <option value="">Choose a size</option>
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </Field>
          </div>
        </Card>
        <Card title="Skills">
          <div className={styles.skills}>
            {SKILLS.map((s) => (
              <label key={s} className={styles.check}><input type="checkbox" checked={v.skills.includes(s)} onChange={() => toggle(s)} /> {s}</label>
            ))}
          </div>
        </Card>
        <Card title="Role">
          <p><strong>{ROLE_WORDS[me.role]}</strong> · {me.jobTitle}</p>
          <p className="muted">Set by {state.team.find((m) => m.role === 'owner')?.name}. Lost your phone? Ask them to sign you out on every device.</p>
        </Card>
        <Button type="submit" variant="primary">Save profile</Button>
      </form>
    </>
  )
}
