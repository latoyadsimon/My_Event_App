// =====================================================================
// Team & roles (PL-1.6), matching the wireframe: the team table, one
// person's permission switches, invite, and deactivate.
//   • permissions are per person, not just per role
//   • profit is owner-only; staff see no money unless granted
//   • Deactivate ends their sessions now and keeps their history for payroll
// (The real check happens on the server for every request: RLS + has_permission.)
// =====================================================================
import { useState } from 'react'
import { useStore } from '../../../store/StoreContext'
import { PERMISSIONS, JOB_TITLES } from '../../../data/seed'
import { validateInvite } from '../../../lib/validate'
import { Button, Card, ConfirmDialog, Field, StatusChip } from '../../../components/ui'
import styles from './setup.module.css'

const STATUS_TONE = { active: 'success', invited: 'info', deactivated: 'neutral' }

function accessSummary(m) {
  if (m.role === 'owner') return 'Everything'
  const p = m.permissions
  const parts = [`Budgets ${p.see_budgets ? '✓' : '✗'}`, `Profit ${p.see_profit ? '✓' : '✗'}`]
  if (p.take_payments) parts.push('Payments ✓')
  return m.role === 'staff' && !p.see_budgets ? 'Assigned events only' : parts.join(' · ')
}

function InviteForm({ onDone }) {
  const { dispatch } = useStore()
  const [v, setV] = useState({ name: '', contact: '', role: 'staff', jobTitle: 'Photo booth attendant' })
  const [errors, setErrors] = useState({})
  const bind = (key) => ({ value: v[key], onChange: (e) => setV({ ...v, [key]: e.target.value }), error: errors[key] })

  const submit = (e) => {
    e.preventDefault()
    const found = validateInvite(v)
    setErrors(found)
    if (Object.keys(found).length) return
    dispatch({ type: 'team/invite', name: v.name.trim(), contact: v.contact.trim(), role: v.role, jobTitle: v.jobTitle })
    dispatch({ type: 'toast/show', text: `Invite sent to ${v.name.trim()}` })
    onDone()
  }

  return (
    <form className={`${styles.editBox} stack`} onSubmit={submit} noValidate aria-label="Invite staff">
      <div className={styles.grid2}>
        <Field label="Name" autoComplete="off" {...bind('name')} />
        <Field label="Email or mobile number" hint="We'll send the invite there." {...bind('contact')} />
        <Field label="Role" as="select" hint="Coordinators start with budgets on; staff see only their events." {...bind('role')}>
          <option value="coordinator">Coordinator</option>
          <option value="staff">Staff</option>
        </Field>
        <Field label="Job" as="select" {...bind('jobTitle')}>
          {JOB_TITLES.map((j) => <option key={j}>{j}</option>)}
        </Field>
      </div>
      <div className={styles.formActions}>
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">Send invite</Button>
      </div>
    </form>
  )
}

export default function TeamManager() {
  const { state, dispatch } = useStore()
  const [selectedId, setSelectedId] = useState(state.team.find((m) => m.role !== 'owner')?.id ?? null)
  const [inviting, setInviting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const selected = state.team.find((m) => m.id === selectedId)
  const firstName = selected?.name.split(' ')[0]

  return (
    <div className="stack">
      <Card title="Team & roles" action={!inviting && <Button size="small" variant="primary" onClick={() => setInviting(true)}>Invite staff</Button>}>
        {inviting && <InviteForm onDone={() => setInviting(false)} />}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Access</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {state.team.map((m) => (
                <tr key={m.id} className={m.id === selectedId ? styles.selected : undefined}>
                  <td><strong>{m.role === 'owner' ? `${m.name} (you)` : m.name}</strong></td>
                  <td>{m.jobTitle}</td>
                  <td>{accessSummary(m)}</td>
                  <td><StatusChip status={m.status} tone={STATUS_TONE[m.status]} /></td>
                  <td>
                    {m.role !== 'owner' && (
                      <Button size="small" onClick={() => setSelectedId(m.id)} aria-pressed={m.id === selectedId} aria-label={`Permissions for ${m.name}`}>
                        Permissions
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && selected.role !== 'owner' && (
        <Card title={`Permissions: ${selected.name}`}>
          <div className={styles.perms} role="group" aria-label={`What ${firstName} can do`}>
            {PERMISSIONS.map((p) => (
              <label key={p.id} className={styles.check}>
                <input type="checkbox" checked={Boolean(selected.permissions[p.id])} disabled={p.ownerOnly || selected.status === 'deactivated'}
                  onChange={(e) => dispatch({ type: 'team/setPermission', memberId: selected.id, permission: p.id, value: e.target.checked })} />
                <span>{p.label}{p.ownerOnly && <span className="muted"> (owner only)</span>}</span>
              </label>
            ))}
          </div>
          <div className={styles.row}>
            {selected.status === 'deactivated'
              ? <>
                  <p className={styles.help} style={{ flex: 1 }}>{firstName} is deactivated. Their shifts and hours are kept for payroll.</p>
                  <Button onClick={() => dispatch({ type: 'team/reactivate', memberId: selected.id })}>Reactivate {firstName}</Button>
                </>
              : <>
                  <p className={styles.help} style={{ flex: 1 }}>Lost phone? Sign them out on every device; they sign in again with a text code. Leaving the team? Deactivate keeps their history for payroll.</p>
                  {selected.status === 'active' && <Button onClick={() => dispatch({ type: 'team/signOutEverywhere', memberId: selected.id })}>Sign {firstName} out everywhere</Button>}
                  <Button variant="danger" onClick={() => setConfirming(true)}>Deactivate {firstName}</Button>
                </>}
          </div>
        </Card>
      )}

      <ConfirmDialog open={confirming} title={`Deactivate ${selected?.name}?`} confirmLabel={`Deactivate ${firstName}`}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          dispatch({ type: 'team/deactivate', memberId: selected.id })
          dispatch({ type: 'toast/show', text: `${selected.name} deactivated and signed out` })
          setConfirming(false)
        }}>
        They&apos;ll be signed out on every device now and can&apos;t open any events. Their shifts and hours stay for payroll.
      </ConfirmDialog>
    </div>
  )
}
