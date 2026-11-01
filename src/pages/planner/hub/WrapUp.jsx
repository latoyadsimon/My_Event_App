// =====================================================================
// Event Hub › Wrap-up (PL-8.1, PL-8.2, PL-8.5), after teardown:
//   • the close-out checklist (each item links to its fix)
//   • the final invoice: on-site add-ons and damage charges, "Send final
//     invoice", and the security deposit (release, or apply to damage)
//   • the event report: revenue, costs, profit, attendance
//   • Close event (only when the checklist is done) → status Closed
// =====================================================================
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { can, closeOut, eventReport, getInvoiceForEvent, installmentStatus } from '../../../store/selectors'
import { formatDayShort, formatDateTime } from '../../../lib/clock'
import { formatMoney } from '../../../lib/money'
import { dollarsToCents } from '../../../lib/validate'
import { Button, Card, ConfirmDialog, Field, Icon, Kpis, Notice, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

function FinalInvoice({ invoice }) {
  const { dispatch } = useStore()
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [photo, setPhoto] = useState('')
  const [releasing, setReleasing] = useState(false)
  const dep = invoice.securityDeposit
  const extras = invoice.installments.filter((p) => p.extra)
  const open = invoice.installments.filter((p) => !p.paidAt && !p.voided)
  const unpaidDamage = extras.filter((p) => p.extra === 'damage' && !p.paidAt)
  const cents = dollarsToCents(amount)
  const add = (e) => {
    e.preventDefault()
    dispatch({ type: 'invoice/addCharge', invoiceId: invoice.id, label: photo ? `${label} (photo: ${photo})` : label, amountCents: cents, kind: 'damage' })
    setLabel(''); setAmount(''); setPhoto(''); e.target.reset()
  }
  return (
    <Card title={`Final invoice #${invoice.number}`} action={<Button size="small" to={`/app/invoices/${invoice.id}`}>Open invoice</Button>}>
      {extras.length > 0 && (
        <ul role="list" className={styles.rows} aria-label="Added after the event started">
          {extras.map((p) => (
            <li key={p.id}><span>{p.label}</span><strong>{formatMoney(p.amountCents)}</strong><StatusChip kind="money" status={installmentStatus(p)} />{p.method && <span className="muted">{p.method}</span>}</li>
          ))}
        </ul>
      )}
      <p>{open.length ? <>Still due: <strong>{formatMoney(open.reduce((t, p) => t + p.amountCents, 0))}</strong> ({open.map((p) => p.label).join(', ')})</> : 'Everything is paid.'}</p>
      <form className={styles.inlineForm} onSubmit={add}>
        <Field label="Damage charge" value={label} onChange={(e) => setLabel(e.target.value)} hint="What was damaged" />
        <Field label="Amount ($)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Field label="Photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0]?.name ?? '')} />
        <Button type="submit" disabled={!label.trim() || !(cents > 0)}>Add charge</Button>
      </form>
      {open.length > 0 && (
        <div className="cluster">
          <Button variant="primary" onClick={() => dispatch({ type: 'invoice/sendFinal', invoiceId: invoice.id })}>{invoice.finalSentAt ? 'Send final invoice again' : 'Send final invoice'}</Button>
          {invoice.finalSentAt && <span className="muted">Sent {formatDateTime(invoice.finalSentAt)}</span>}
        </div>
      )}

      {dep && (
        <div className={styles.deposit}>
          <h3 className={styles.legend}>Security deposit · {formatMoney(dep.amountCents)} on {dep.method}</h3>
          {dep.status === 'held'
            ? (
              <div className="cluster">
                {unpaidDamage.length > 0 && <Button variant="primary" onClick={() => dispatch({ type: 'deposit/apply', invoiceId: invoice.id })}>Pay damage from the deposit</Button>}
                <Button onClick={() => setReleasing(true)}>Release the deposit</Button>
              </div>
            )
            : <p><Icon name="check" size={14} className={styles.inlineIcon} /> {dep.status === 'released' ? 'Released' : `Applied ${formatMoney(dep.usedCents)} to damage; the rest released`} {formatDayShort(dep.settledAt)}.</p>}
        </div>
      )}
      <ConfirmDialog open={releasing} danger={false} title="Release the security deposit?" confirmLabel={`Release ${dep ? formatMoney(dep.amountCents) : ''}`}
        onCancel={() => setReleasing(false)} onConfirm={() => { dispatch({ type: 'deposit/release', invoiceId: invoice.id }); setReleasing(false) }}>
        {unpaidDamage.length ? 'There are unpaid damage charges. Releasing means they must be paid separately.' : 'The hold on the client’s card ends and they get an email.'}
      </ConfirmDialog>
    </Card>
  )
}

export default function WrapUp() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [closing, setClosing] = useState(false)
  const check = closeOut(state, event.id)
  const r = eventReport(state, event.id)
  const invoice = getInvoiceForEvent(state, event.id)
  const money = can(state, 'see_budgets')
  const profit = can(state, 'see_profit')
  const closed = event.status === 'closed'

  return (
    <div className="stack">
      {closed && <Notice tone="success">Closed {event.closedAt ? formatDayShort(event.closedAt) : ''}. The report below is final.</Notice>}

      <Card title={`Close-out · ${check.doneCount} of ${check.items.length} done`}>
        <ul role="list" className={styles.rows}>
          {check.items.map((x) => (
            <li key={x.id}>
              <Icon name={x.done ? 'check' : 'close'} size={16} className={x.done ? styles.okIcon : styles.todoIcon} />
              <span>{x.label}</span>
              {!x.done && <Link to={x.to}>Fix this</Link>}
            </li>
          ))}
        </ul>
        {!closed && <Button variant="primary" disabled={!check.allDone} onClick={() => setClosing(true)}>Close event</Button>}
        {!closed && !check.allDone && <p className="muted">Close becomes available when every item is done.</p>}
      </Card>

      {money && invoice && !closed && <FinalInvoice invoice={invoice} />}

      <Card title="Thank your guests">
        <p className="muted">A thank-you text or email to everyone who came{event.booth?.enabled ? ', with their link to the photo gallery' : ''}.</p>
        {event.thankYouSentAt
          ? <p><Icon name="check" size={14} className={styles.inlineIcon} /> Sent {formatDayShort(event.thankYouSentAt)}</p>
          : <Button onClick={() => dispatch({ type: 'guests/thankYouGallery', eventId: event.id })}>Send thank-you{event.booth?.enabled ? ' + gallery link' : ''}</Button>}
      </Card>

      <Card title="Event report">
        <Kpis label="Report numbers" items={[
          ...(money ? [{ label: 'Revenue', value: formatMoney(r.priceCents), note: `${formatMoney(r.collectedCents)} collected` }] : []),
          ...(money ? [{ label: 'Costs', value: formatMoney(r.vendorCents + r.staffCents + r.gearCents), note: 'Vendors, staff, gear wear' }] : []),
          ...(profit ? [{ label: 'Profit', value: formatMoney(r.profitCents), note: r.priceCents ? `${Math.round((r.profitCents / r.priceCents) * 100)}% · owner only` : 'owner only' }] : []),
          { label: 'Attendance', value: `${r.checkedIn}`, note: `${r.attendingPeople} said yes · ${r.invitedPeople} invited${r.walkIns ? ` · ${r.walkIns} walk-ins` : ''}` },
        ]} />
        <ul role="list" className={styles.rows}>
          {money && <li><span>On-site sales</span><strong>{formatMoney(r.onsiteCents)}</strong></li>}
          {money && <li><span>Damage charges</span><strong>{formatMoney(r.damageCents)}</strong></li>}
          <li><span>Vendors arrived</span><strong>{r.vendorsOnTime} of {r.vendorsTotal}</strong></li>
          <li><span>Incidents</span><strong>{r.incidents}</strong></li>
          {r.booth && <li><span>Photo booth</span><strong>{r.booth.sessions} sessions · {r.booth.prints} prints · {r.booth.magnets} magnets · {r.booth.photos} photos</strong></li>}
          {r.karaoke && <li><span>Karaoke</span><strong>{r.karaoke.sung} songs · {r.karaoke.singers} singers{r.karaoke.topSong ? ` · most sung “${r.karaoke.topSong.title}”` : ''}</strong></li>}
        </ul>
      </Card>

      <ConfirmDialog open={closing} danger={false} title={`Close ${event.name}?`} confirmLabel="Close event"
        onCancel={() => setClosing(false)} onConfirm={() => { dispatch({ type: 'event/close', eventId: event.id }); setClosing(false) }}>
        The status moves to Closed and the event moves to Past on the Events list. The report stays here.
      </ConfirmDialog>
    </div>
  )
}
