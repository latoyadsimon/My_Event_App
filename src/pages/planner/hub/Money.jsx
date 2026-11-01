// =====================================================================
// Event Hub › Money (PL-4.7): price, collected, balance, payments and
// the invoice. Hidden from staff unless the owner grants "See event
// budgets"; estimated profit is owner-only even then (PL-1.6).
// =====================================================================
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { can, getInvoiceForEvent, invoiceTotals, installmentStatus } from '../../../store/selectors'
import { formatMoney } from '../../../lib/money'
import { formatDayShort, formatDateTime } from '../../../lib/clock'
import { Button, Card, EmptyState, Icon, Kpis, StatusChip } from '../../../components/ui'
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
  const profit = invoice.totalCents - t.refundedCents - (event.costsCents ?? 0)

  return (
    <div className="stack">
      <Kpis label="Money" items={[
        { label: 'Client price', value: formatMoney(t.totalCents) },
        { label: 'Collected', value: formatMoney(t.paidCents - t.refundedCents) },
        { label: 'Balance due', value: formatMoney(Math.max(0, t.balanceCents - invoice.installments.filter((p) => p.voided).reduce((s, p) => s + p.amountCents, 0))) },
        ...(showProfit ? [{ label: 'Estimated profit', value: formatMoney(profit), note: `Costs ${formatMoney(event.costsCents ?? 0)} · owner only` }] : []),
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
    </div>
  )
}
