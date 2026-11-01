// =====================================================================
// Event Hub › Money (PL-4.7, PL-4.9): price, collected, balance, payments
// and the invoice; the budget (estimated vs. actual by category, vendor
// invoices attached) and the profit view. Hidden from staff unless the
// owner grants "See event budgets"; profit is owner-only even then (PL-1.6).
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { budgetFor, can, getEventVendors, getInvoiceForEvent, invoiceTotals, installmentStatus } from '../../../store/selectors'
import { formatMoney } from '../../../lib/money'
import { centsToDollars, dollarsToCents } from '../../../lib/validate'
import { formatDayShort, formatDateTime } from '../../../lib/clock'
import { Button, Card, EmptyState, Field, Icon, Kpis, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

export default function Money() {
  const { event } = useOutletContext()
  const { state } = useStore()

  if (!can(state, 'see_budgets')) {
    return (
      <EmptyState title="Money is private for this event">
        <Icon name="lock" size={16} className={styles.inlineIcon} /> Ask the owner to turn on “See event budgets” for you in Settings › Team &amp; roles.
      </EmptyState>
    )
  }

  const invoice = getInvoiceForEvent(state, event.id)
  if (!invoice) return <EmptyState title="No invoice yet">An invoice is created when the client signs the contract.</EmptyState>
  const t = invoiceTotals(invoice)
  const showProfit = can(state, 'see_profit')
  const budget = budgetFor(state, event.id)

  return (
    <div className="stack">
      <Kpis label="Money" items={[
        { label: 'Client price', value: formatMoney(t.totalCents) },
        { label: 'Collected', value: formatMoney(t.paidCents - t.refundedCents) },
        { label: 'Balance due', value: formatMoney(Math.max(0, t.balanceCents - invoice.installments.filter((p) => p.voided).reduce((s, p) => s + p.amountCents, 0))) },
        ...(showProfit ? [{ label: 'Estimated profit', value: formatMoney(budget.profitCents), note: `Costs ${formatMoney(budget.priceCents - budget.profitCents)} · owner only` }] : []),
      ]} />

      <Card title="Payments" action={<Button size="small" variant="primary" to={`/app/invoices/${invoice.id}`}>Open invoice #{invoice.number}</Button>}>
        <ul role="list" className={styles.rows}>
          {invoice.installments.map((p) => (
            <li key={p.id}>
              <span className={styles.when}>{formatDayShort(p.dueDate)}</span>
              <span>{p.label} · {formatMoney(p.amountCents)}</span>
              {p.voided ? <StatusChip tone="neutral" label="Voided" /> : <StatusChip kind="money" status={installmentStatus(p)} />}
              {p.paidAt && <span className="muted">{p.method} · {formatDateTime(p.paidAt)}</span>}
            </li>
          ))}
          {invoice.refunds.map((r) => (
            <li key={r.id}><span className={styles.when}>{formatDayShort(r.at)}</span><span>{r.kind === 'credit' ? 'Credit' : 'Refund'} · −{formatMoney(r.amountCents)}</span><span className="muted">{r.reason}</span></li>
          ))}
        </ul>
      </Card>

      <Budget event={event} budget={budget} />

      {showProfit && (
        <Card title="Profit (owner only)">
          <dl className={styles.facts}>
            <div><dt>Client price</dt><dd>{formatMoney(budget.priceCents)}</dd></div>
            <div><dt>Vendor costs</dt><dd>−{formatMoney(budget.vendorCents)}</dd></div>
            <div><dt>Staff hours</dt><dd>−{formatMoney(budget.staffCents)}{!budget.staffCents && <span className={styles.subline}>From assigned shifts</span>}</dd></div>
            <div><dt>Gear wear</dt><dd>−{formatMoney(budget.gearCents)}</dd></div>
            <div><dt><strong>Profit</strong></dt><dd><strong>{formatMoney(budget.profitCents)}</strong> ({budget.priceCents ? Math.round((budget.profitCents / budget.priceCents) * 100) : 0}%)</dd></div>
          </dl>
        </Card>
      )}
    </div>
  )
}

function Budget({ event, budget }) {
  const { state, dispatch } = useStore()
  const [category, setCategory] = useState('')
  const [estimate, setEstimate] = useState('')
  const vendors = Object.fromEntries(getEventVendors(state, event.id).map((v) => [v.id, v]))
  const setCents = (line, key, text) => {
    const cents = dollarsToCents(text)
    if (!Number.isNaN(cents) && cents !== line[key]) dispatch({ type: 'budget/update', id: line.id, changes: { [key]: cents } })
  }
  const add = (e) => {
    e.preventDefault()
    dispatch({ type: 'budget/add', eventId: event.id, category, estimatedCents: dollarsToCents(estimate) || 0 })
    setCategory(''); setEstimate('')
  }
  const over = budget.actualCents > budget.estimatedCents
  return (
    <Card title={`Budget · ${formatMoney(budget.actualCents)} actual of ${formatMoney(budget.estimatedCents)} estimated`}>
      {budget.lines.length === 0
        ? <p className="muted">No budget lines yet. Adding a vendor adds their category.</p>
        : (
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.stackTable}`}>
              <thead><tr><th>Category</th><th className={styles.num}>Estimated</th><th className={styles.num}>Actual</th><th>Vendor invoice</th><th><span className="visually-hidden">Remove</span></th></tr></thead>
              <tbody>
                {budget.lines.map((b) => {
                  const ev = b.eventVendorId && vendors[b.eventVendorId]
                  return (
                    <tr key={b.id}>
                      <td><strong>{b.category}</strong>{b.actualCents > b.estimatedCents && <span className={styles.subline}>Over by {formatMoney(b.actualCents - b.estimatedCents)}</span>}</td>
                      <td className={styles.num}><MoneyInput label={`${b.category} estimated`} cents={b.estimatedCents} onSave={(v) => setCents(b, 'estimatedCents', v)} /></td>
                      <td className={styles.num}><MoneyInput label={`${b.category} actual`} cents={b.actualCents} onSave={(v) => setCents(b, 'actualCents', v)} /></td>
                      <td>{ev ? <>{ev.vendor.name}<span className={styles.subline}>{ev.hasDoc('invoice') ? 'Invoice uploaded' : `Quoted ${formatMoney(ev.amountCents)}`}</span></> : <span className="muted">–</span>}</td>
                      <td className={styles.rowActions}><Button size="small" variant="danger" aria-label={`Remove ${b.category}`} onClick={() => dispatch({ type: 'budget/remove', id: b.id })}><Icon name="close" size={14} /></Button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      {over && <p className={styles.error}>Actual costs are {formatMoney(budget.actualCents - budget.estimatedCents)} over the estimate.</p>}
      <form className={styles.inlineForm} onSubmit={add}>
        <Field label="New category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Field label="Estimate ($)" inputMode="decimal" value={estimate} onChange={(e) => setEstimate(e.target.value)} />
        <Button type="submit" disabled={!category.trim()}>Add line</Button>
      </form>
    </Card>
  )
}

/** A dollar amount you can edit in place; saves when you leave the field. */
function MoneyInput({ label, cents, onSave }) {
  const [text, setText] = useState(centsToDollars(cents))
  return (
    <label className={styles.moneyInput}>
      <span className="visually-hidden">{label} ($)</span>
      <span aria-hidden="true">$</span>
      <input inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => onSave(text)} />
    </label>
  )
}
