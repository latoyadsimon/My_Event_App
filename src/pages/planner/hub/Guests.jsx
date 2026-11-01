// =====================================================================
// Event Hub › Guests › Guest list (PL-5.1, PL-5.4): households with
// plus-ones, tags, notes, gifts; live counts, meals and allergies;
// remind non-responders; and the final headcount: the client approves,
// then the planner locks it (RSVPs close, vendors are told).
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { getEventGuests, guestCounts } from '../../../store/selectors'
import { formatDateTime } from '../../../lib/clock'
import { AddGuestDialog, ImportDialog } from '../../../components/guests/GuestTools'
import { Button, Card, Dialog, EmptyState, Field, Icon, Kpis, Notice, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

const RSVP = { attending: ['success', '✓ Attending'], declined: ['neutral', '✗ Declined'], maybe: ['warning', '? Maybe'] }
const INVITE = { not_sent: 'Not invited yet', delivered: 'Invited', opened: 'Opened', bounced: 'Email bounced', stopped: 'Texted STOP' }
const mealText = (g) => Object.entries(g.meals ?? {}).map(([m, n]) => `${m} ×${n}`).join(', ')

function EditGuest({ guest, onClose }) {
  const { dispatch } = useStore()
  const [v, setV] = useState({ plusOnes: String(guest.plusOnes), tags: guest.tags.join(', '), notes: guest.notes, gift: guest.gift, allergies: guest.allergies })
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }))
  const save = () => {
    dispatch({ type: 'guest/update', guestId: guest.id, changes: { ...v, plusOnes: Number(v.plusOnes), tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean) } })
    onClose()
  }
  return (
    <Dialog open title={guest.name} onClose={onClose} wide actions={<Button variant="primary" onClick={save}>Save</Button>}>
      <div className={styles.grid2}>
        <Field label="Plus-ones for this household" as="select" value={v.plusOnes} onChange={set('plusOnes')}>
          {[0, 1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n === 0 ? 'None' : `+${n}`}</option>)}
        </Field>
        <Field label="Tags" hint="family, work, VIP, kids…" value={v.tags} onChange={set('tags')} />
        <Field label="Allergies or dietary needs" value={v.allergies} onChange={set('allergies')} />
        <Field label="Gift" value={v.gift} onChange={set('gift')} placeholder="e.g. KitchenAid mixer · thank-you sent" />
        <Field label="Notes" as="textarea" value={v.notes} onChange={set('notes')} />
      </div>
    </Dialog>
  )
}

export default function Guests() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showAllergies, setShowAllergies] = useState(false)
  const list = getEventGuests(state, event.id)
  const c = guestCounts(list)
  const locked = event.headcount?.lockedAt
  const approval = state.approvals.filter((a) => a.eventId === event.id && a.kind === 'headcount').at(-1)
  const remindable = list.filter((g) => !g.rsvp && g.invite !== 'not_sent' && !['bounced', 'stopped'].includes(g.invite)).length

  const remove = (g) => {
    dispatch({ type: 'guest/remove', guestId: g.id })
    dispatch({ type: 'toast/show', text: `${g.name} removed`, undo: { type: 'guest/restore', guestId: g.id } })
  }

  const headcountAction = locked ? null
    : approval?.status === 'approved'
      ? <Button variant="primary" onClick={() => dispatch({ type: 'headcount/lock', eventId: event.id })}><Icon name="lock" size={16} /> Lock final headcount</Button>
      : approval?.status === 'pending'
        ? <span className="muted">Headcount sent to the client for approval</span>
        : <Button onClick={() => dispatch({ type: 'headcount/requestApproval', eventId: event.id })} disabled={!c.attending}>Ask client to approve headcount</Button>

  return (
    <div className="stack">
      {locked && (
        <Notice tone="info"><Icon name="lock" size={16} className={styles.inlineIcon} /> Headcount locked at <strong>{event.headcount.count}</strong> {formatDateTime(event.headcount.lockedAt)}, approved by {event.headcount.approvedBy}. RSVPs are closed and vendors were told.</Notice>
      )}

      <Kpis label="RSVPs" items={[
        { label: 'attending', value: c.attending, note: 'people' },
        { label: 'declined', value: c.declined },
        { label: 'maybe', value: c.maybe },
        { label: 'no reply', value: c.noReply },
      ]} />

      {(Object.keys(c.meals).length > 0 || c.allergies.length > 0) && (
        <div className={styles.chipsRow} aria-label="Meals and allergies">
          <span className="muted">Meals:</span>
          {Object.entries(c.meals).map(([m, n]) => <StatusChip key={m} tone="neutral" label={`${m} ${n}`} />)}
          {c.allergies.length > 0 && (
            <button type="button" className={styles.allergyChip} onClick={() => setShowAllergies(!showAllergies)} aria-expanded={showAllergies}>
              ⚠ Allergies {c.allergies.length}
            </button>
          )}
        </div>
      )}
      {showAllergies && (
        <Notice tone="warning">
          {c.allergies.map((g) => `${g.name}: ${g.allergies}`).join(' · ')}
        </Notice>
      )}

      <div className="cluster">
        <Button variant="primary" onClick={() => setAdding(true)} disabled={Boolean(locked)}>+ Add guest</Button>
        <Button onClick={() => setImporting(true)} disabled={Boolean(locked)}>Import CSV</Button>
        <Button onClick={() => dispatch({ type: 'guests/remindNonResponders', eventId: event.id })} disabled={!remindable || Boolean(locked)}>
          Remind {remindable} non-responder{remindable === 1 ? '' : 's'}
        </Button>
        {headcountAction}
      </div>

      {list.length === 0
        ? <EmptyState title="No guests yet" action={<Button onClick={() => setImporting(true)}>Import CSV</Button>}>Import a list, add guests one by one, or let the client add them in their portal.</EmptyState>
        : (
          <Card title={`Households (${list.length}) · ${c.invitedPeople} invited`}>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${styles.stackTable}`}>
                <thead>
                  <tr><th scope="col">Household</th><th scope="col" className={styles.num}>Invited</th><th scope="col">RSVP</th><th scope="col">Meals</th><th scope="col">Tags</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr>
                </thead>
                <tbody>
                  {list.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.name}</strong>{g.plusOnes > 0 && <span className="muted"> (+{g.plusOnes})</span>}
                        {g.allergies && <span className={styles.allergy}> ⚠ {g.allergies}</span>}
                        {g.addedBy === 'client' && <span className="muted"> · added by client</span>}
                        <span className={styles.subline}>{g.email || g.phone || 'No contact yet'}{g.notes ? ` · ${g.notes}` : ''}</span>
                      </td>
                      <td className={styles.num}>{1 + g.plusOnes}</td>
                      <td>
                        {g.rsvp
                          ? <StatusChip tone={RSVP[g.rsvp][0]} label={`${RSVP[g.rsvp][1]}${g.rsvp === 'attending' ? ` · ${g.attending}` : ''}`} />
                          : <span className={['bounced', 'stopped'].includes(g.invite) ? styles.late : 'muted'}>{INVITE[g.invite]}</span>}
                      </td>
                      <td>{mealText(g) || <span className="muted">–</span>}</td>
                      <td className="muted">{g.tags.join(', ')}</td>
                      <td className={styles.rowActions}>
                        <Button size="small" onClick={() => setEditing(g)} aria-label={`Edit ${g.name}`}>Edit</Button>
                        <Button size="small" variant="danger" onClick={() => remove(g)} disabled={Boolean(locked)} aria-label={`Remove ${g.name}`}><Icon name="close" size={14} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      <AddGuestDialog open={adding} onClose={() => setAdding(false)} eventId={event.id} />
      <ImportDialog open={importing} onClose={() => setImporting(false)} eventId={event.id} />
      {editing && <EditGuest guest={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
