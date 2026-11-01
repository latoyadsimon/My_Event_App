// =====================================================================
// Grow (product Phase 4), /app/grow:
//   Reports    PL-9.1: booked vs collected by month, lead sources (and how many
//              became bookings), best-selling add-ons, gear utilization, sales tax
//              by location, QuickBooks sync. Owner/budget permission only.
//   Marketing  PL-9.2: key dates for past clients who opted in ("Your baby's first
//              birthday is in 2 months"), sent about two months ahead; never to
//              memorial families
//   Reviews    PL-8.4, CL-6.4, GU-6.2: what clients and guests said
// =====================================================================
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { businessReport, can, isDue, marketingList } from '../../store/selectors'
import { formatDay, formatDayShort, formatDateTime } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { Button, Card, EmptyState, Field, Icon, Kpis, Notice, PageHeader, Stars, StatusChip } from '../../components/ui'
import { BarList, ColumnChart } from '../../components/charts/BarChart'
import styles from './Grow.module.css'

const TABS = [['reports', 'Reports'], ['marketing', 'Marketing'], ['reviews', 'Reviews']]
const short = (m) => new Date(`${m}-01T12:00:00`).toLocaleDateString('en-US', { month: 'short' })
const long = (m) => new Date(`${m}-01T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const dollars = (c) => formatMoney(c).replace('.00', '')

function Reports() {
  const { state, dispatch } = useStore()
  if (!can(state, 'see_budgets')) return <Notice>Reports show money. Ask the owner for “See event budgets”.</Notice>
  const r = businessReport(state)
  const qb = state.business.quickbooks
  return (
    <div className="stack">
      <Kpis label="Last 12 months" items={[
        { label: 'booked', value: dollars(r.bookedCents), note: 'countersigned contracts' },
        { label: 'collected', value: dollars(r.collectedCents), note: 'payments received' },
        { label: 'raised for causes', value: dollars(r.givingCents) },
        { label: 'client rating', value: r.rating ? `${r.rating} / 5` : '–', note: `${r.reviews} reviews` },
      ]} />
      <Card>
        <ColumnChart title="Booked vs collected, by month" sub="Last 12 months" series={['Booked', 'Collected']} format={dollars}
          rows={r.months.map((m) => ({ label: long(m.month), short: short(m.month), values: [m.bookedCents, m.collectedCents] }))} />
      </Card>
      <div className={styles.grid2}>
        <Card><BarList title="Lead sources" sub="Leads, and how many booked" format={(n) => `${n} lead${n === 1 ? '' : 's'}`}
          rows={r.sources.map((s) => ({ label: s.source, value: s.leads, note: `${s.won} booked` }))} /></Card>
        <Card><BarList title="Best-selling add-ons" sub="By revenue, live events" format={dollars}
          rows={r.addons.map((a) => ({ label: a.addon.name, value: a.revenueCents, note: `${a.events} event${a.events === 1 ? '' : 's'}` }))} /></Card>
        <Card><BarList title="Gear utilization" sub="Share of events each item went to" format={(n) => `${n}%`} max={100}
          rows={r.gear.filter((g) => g.events).map((g) => ({ label: g.item.name, value: g.percent, note: `${g.events} event${g.events === 1 ? '' : 's'}` }))} /></Card>
        <Card title="Sales tax by location">
          <ul role="list" className={styles.rows}>
            {r.tax.map((t) => <li key={t.place}><span>{t.place}</span><span className="muted">on {dollars(t.salesCents)}</span><strong>{formatMoney(t.taxCents)}</strong></li>)}
          </ul>
          <p className="muted">At {state.business.taxRatePercent}% on invoices for events in each city.</p>
        </Card>
      </div>
      <Card title="QuickBooks">
        {!qb ? <><p className="muted">Send invoices and payments to QuickBooks so your books match.</p><Button onClick={() => dispatch({ type: 'quickbooks/connect' })}>Connect QuickBooks</Button></>
          : (
            <div className="cluster">
              <StatusChip tone="success" label={`Connected ${formatDayShort(qb.connectedAt)}`} />
              <span className="muted">{qb.lastSyncAt ? `Last sync ${formatDateTime(qb.lastSyncAt)}: ${qb.invoices} invoices, ${qb.payments} payments` : 'Not synced yet'}</span>
              <Button onClick={() => dispatch({ type: 'quickbooks/sync' })}>Sync now</Button>
            </div>
          )}
      </Card>
    </div>
  )
}

function Marketing() {
  const { state, dispatch } = useStore()
  const [add, setAdd] = useState({ clientId: '', label: '', date: '', yearly: true })
  const list = marketingList(state)
  const due = list.filter((x) => isDue(x))
  const later = list.filter((x) => !isDue(x))
  const past = state.clients.filter((c) => state.events.some((e) => e.clientId === c.id))
  const memorial = new Set(state.events.filter((e) => e.type === 'memorial').map((e) => e.clientId))
  return (
    <div className="stack">
      <Card title={`Due now (${due.length})`}>
        {due.length === 0 ? <p className="muted">Nothing in the next two months.</p> : (
          <ul role="list" className={styles.rows}>
            {due.map((x) => (
              <li key={`${x.client.id}-${x.date.id}`}>
                <span><strong>{x.date.label}</strong> · {x.client.name}<span className={styles.sub}>{formatDay(x.next)} · in {x.daysAway} days</span></span>
                <Button size="small" variant="primary" onClick={() => dispatch({ type: 'marketing/send', clientId: x.client.id, dateId: x.date.id, next: x.next, daysAway: x.daysAway })}>Send reminder</Button>
              </li>
            ))}
          </ul>
        )}
        <p className="muted">Each goes about two months ahead, with a link to your inquiry form. Only to clients who opted in; never to families you served for a memorial.</p>
      </Card>
      <Card title="Coming up">
        <ul role="list" className={styles.rows}>
          {later.map((x) => (
            <li key={`${x.client.id}-${x.date.id}`}>
              <span><strong>{x.date.label}</strong> · {x.client.name}<span className={styles.sub}>{formatDay(x.next)}{x.date.yearly ? ' · every year' : ''}</span></span>
              {x.sent ? <StatusChip tone="success" label="Sent" /> : !x.client.marketing.optIn ? <StatusChip tone="neutral" label="Not opted in" /> : <span className="muted">in {x.daysAway} days</span>}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Past clients">
        <ul role="list" className={styles.rows} aria-label="Past clients">
          {past.map((c) => (
            <li key={c.id}>
              <span>{c.name}{c.company ? ` · ${c.company}` : ''}</span>
              {memorial.has(c.id) ? <span className="muted">Not marketed (memorial)</span> : (
                <label className={styles.check}><input type="checkbox" checked={c.marketing.optIn} onChange={(e) => dispatch({ type: 'marketing/setOptIn', clientId: c.id, on: e.target.checked })} /> Opted in</label>
              )}
            </li>
          ))}
        </ul>
        <form className={styles.inline} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'marketing/addDate', ...add }); setAdd({ ...add, label: '', date: '' }) }}>
          <Field label="Client" as="select" value={add.clientId} onChange={(e) => setAdd({ ...add, clientId: e.target.value })}>
            <option value="">Choose</option>{past.filter((c) => !memorial.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Field>
          <Field label="What to remember" value={add.label} onChange={(e) => setAdd({ ...add, label: e.target.value })} hint="e.g. Wedding anniversary" />
          <Field label="Date" type="date" value={add.date} onChange={(e) => setAdd({ ...add, date: e.target.value })} />
          <label className={styles.check}><input type="checkbox" checked={add.yearly} onChange={(e) => setAdd({ ...add, yearly: e.target.checked })} /> Every year</label>
          <Button type="submit" disabled={!add.clientId || !add.label.trim() || !add.date}>Add date</Button>
        </form>
      </Card>
    </div>
  )
}

function Reviews() {
  const { state } = useStore()
  const list = [...state.feedback].sort((a, b) => b.at.localeCompare(a.at))
  const name = (id) => state.events.find((e) => e.id === id)?.name ?? id
  const clients = list.filter((f) => f.from === 'client')
  const guests = list.filter((f) => f.from === 'guest')
  if (!list.length) return <EmptyState title="No reviews yet">After an event, send a review request from its Wrap-up tab.</EmptyState>
  return (
    <div className="stack">
      <Card title={`Client reviews (${clients.length})`}>
        <ul role="list" className={styles.reviews}>
          {clients.map((f) => (
            <li key={f.id}><Stars n={f.score} /><p>“{f.comment}”</p><span className={styles.sub}>{f.name} · <Link to={`/app/events/${f.eventId}/wrap-up`}>{name(f.eventId)}</Link> · {formatDayShort(f.at)}</span></li>
          ))}
        </ul>
      </Card>
      <Card title={`Guest surveys (${guests.length})`}>
        <ul role="list" className={styles.rows}>
          {[...new Set(guests.map((f) => f.eventId))].map((id) => {
            const g = guests.filter((f) => f.eventId === id)
            return <li key={id}><span>{name(id)}</span><strong>{(g.reduce((t, f) => t + f.score, 0) / g.length).toFixed(1)} / 5</strong><span className="muted">{g.length} answers</span></li>
          })}
        </ul>
      </Card>
    </div>
  )
}

export default function Grow() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(([id]) => id === params.get('tab')) ? params.get('tab') : 'reports'
  return (
    <>
      <PageHeader title="Grow" sub="How the business is doing, and how to get the next booking" />
      <div className={styles.segmented} role="tablist" aria-label="Grow">
        {TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setParams({ tab: id })}>{label}</button>)}
      </div>
      {tab === 'reports' && <Reports />}
      {tab === 'marketing' && <Marketing />}
      {tab === 'reviews' && <Reviews />}
      <p className="muted"><Icon name="chart" size={14} /> Numbers come from the same invoices, leads and events as the rest of the app.</p>
    </>
  )
}
