// =====================================================================
// Event Hub › Guests › Tickets (GU-3.4, planner side, product Phase 4).
// Turn ticket sales on, set tiers (price, value received, capacity) and
// promo codes, and see what's sold, checked in and waiting.
// The public page is /e/<event>/tickets; tickets check in at the door.
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { ticketSales } from '../../../store/selectors'
import { formatDayShort } from '../../../lib/clock'
import { formatMoney } from '../../../lib/money'
import { dollarsToCents } from '../../../lib/validate'
import { Button, Card, Field, Kpis, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

export default function TicketsTab() {
  const { event } = useOutletContext()
  const { state, dispatch } = useStore()
  const [tier, setTier] = useState({ name: '', price: '', value: '', capacity: '' })
  const [promo, setPromo] = useState({ code: '', percent: '' })
  const tk = event.ticketing
  const set = (changes) => dispatch({ type: 'ticketing/configure', eventId: event.id, changes })
  const sales = ticketSales(state, event.id)
  const sold = state.tickets.filter((t) => t.eventId === event.id).sort((a, b) => b.at.localeCompare(a.at))
  const waiting = state.waitlist.filter((w) => w.eventId === event.id)
  const addTier = (e) => {
    e.preventDefault()
    const price = dollarsToCents(tier.price) || 0
    set({ tiers: [...tk.tiers, { id: `tier-${tk.tiers.length + 1}`, name: tier.name.trim(), priceCents: price, fmvCents: tier.value ? dollarsToCents(tier.value) || 0 : price, capacity: Math.max(1, Number(tier.capacity) || 50), note: '' }] })
    setTier({ name: '', price: '', value: '', capacity: '' })
  }
  return (
    <div className="stack">
      <Card title="Ticket sales">
        <label className={styles.check}><input type="checkbox" checked={tk.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Sell tickets for this event (public events)</label>
        {tk.enabled && (
          <>
            <Kpis label="Tickets" items={[
              { label: 'sold', value: sales.sold },
              { label: 'revenue', value: formatMoney(sales.revenueCents) },
              { label: 'checked in', value: sales.checkedIn },
              { label: 'waitlist', value: sales.waitlist },
            ]} />
            <ul role="list" className={styles.rows} aria-label="Tiers">
              {sales.tiers.map((t) => (
                <li key={t.id}><strong>{t.name} · {t.priceCents ? formatMoney(t.priceCents) : 'Free'}</strong>
                  <span className="muted">{t.sold} of {t.capacity} sold{t.fmvCents < t.priceCents ? ` · ${formatMoney(t.priceCents - t.fmvCents)} of each is a donation` : ''}</span>
                  {!t.left && <StatusChip tone="warning" label="Sold out" />}</li>
              ))}
            </ul>
            <form className={styles.roForm} onSubmit={addTier}>
              <Field label="Tier name" value={tier.name} onChange={(e) => setTier({ ...tier, name: e.target.value })} />
              <Field label="Price ($)" inputMode="decimal" value={tier.price} onChange={(e) => setTier({ ...tier, price: e.target.value })} />
              <Field label="Value received ($)" inputMode="decimal" value={tier.value} onChange={(e) => setTier({ ...tier, value: e.target.value })} hint="Dinner, drinks… the rest counts as a donation" />
              <Field label="How many" type="number" min="1" value={tier.capacity} onChange={(e) => setTier({ ...tier, capacity: e.target.value })} />
              <Button type="submit" disabled={!tier.name.trim()}>Add tier</Button>
            </form>
            <div className={styles.inlineForm}>
              <span className="muted">Promo codes: {tk.promos.map((p) => `${p.code} (${p.percentOff}% off)`).join(', ') || 'none'}</span>
            </div>
            <form className={styles.inlineForm} onSubmit={(e) => { e.preventDefault(); set({ promos: [...tk.promos, { code: promo.code.trim().toUpperCase(), percentOff: Math.min(100, Math.max(1, Number(promo.percent) || 10)) }] }); setPromo({ code: '', percent: '' }) }}>
              <Field label="New promo code" value={promo.code} onChange={(e) => setPromo({ ...promo, code: e.target.value })} />
              <Field label="% off" type="number" min="1" max="100" value={promo.percent} onChange={(e) => setPromo({ ...promo, percent: e.target.value })} />
              <Button type="submit" disabled={!promo.code.trim()}>Add code</Button>
            </form>
            <Button to={`/e/${event.id}/tickets`}>Ticket page</Button>
          </>
        )}
      </Card>
      {tk.enabled && sold.length > 0 && (
        <Card title={`Ticket holders (${sold.length})`}>
          <ul role="list" className={styles.rows}>
            {sold.map((t) => (
              <li key={t.id}>
                <span><strong>{t.holder}</strong><span className={styles.subline}>{tk.tiers.find((x) => x.id === t.tierId)?.name} · {t.code} · {formatMoney(t.paidCents)}{t.promo ? ` (${t.promo})` : ''}</span></span>
                {t.checkedInAt ? <StatusChip tone="success" label="Checked in" /> : <span className="muted">Bought {formatDayShort(t.at)}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {waiting.length > 0 && (
        <Card title={`Waitlist (${waiting.length})`}>
          <ul role="list" className={styles.rows}>{waiting.map((w) => <li key={w.id}><span>{w.name}</span><span className="muted">{w.email}</span></li>)}</ul>
        </Card>
      )}
    </div>
  )
}
