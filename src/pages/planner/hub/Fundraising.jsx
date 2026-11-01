// =====================================================================
// Event Hub › Fundraising (product Phase 4): one tab, four parts.
//   Fund       PL-5.6: on/off, charity (501(c)(3), deductible) or gift fund (never
//              deductible), goal, story, suggested amounts, monthly; donations with
//              receipts, refunds, card-expired links, year-end summaries (DN-1/2/5)
//   Auction    DN-3: items, close time, soft close; close → winners charged; unpaid →
//              offer to the next bidder
//   Paddle     DN-4: call each level live
//   Sponsors   DN-6: tiers and benefits; approve logos; mark invoices paid
// Messages for the recognition screen wait here for approval (DN-7).
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../../store/StoreContext'
import { auctionBoard, formatClock, fundTotals, paddleBoard, receiptFor, recognition, tierOf } from '../../../store/selectors'
import { formatDayShort } from '../../../lib/clock'
import { formatMoney } from '../../../lib/money'
import { dollarsToCents } from '../../../lib/validate'
import { Button, Card, ConfirmDialog, Field, Icon, Kpis, Notice, StatusChip } from '../../../components/ui'
import styles from './hub.module.css'

const PARTS = [['fund', 'Fund & donations'], ['auction', 'Silent auction'], ['paddle', 'Paddle raise'], ['sponsors', 'Sponsors']]

function FundPart({ event }) {
  const { state, dispatch } = useStore()
  const [refunding, setRefunding] = useState(null)
  const f = event.fund
  const set = (changes) => dispatch({ type: 'fund/configure', eventId: event.id, changes })
  const gifts = state.donations.filter((d) => d.eventId === event.id).sort((a, b) => b.at.localeCompare(a.at))
  const pending = recognition(state, event.id).pending
  return (
    <div className="stack">
      <Card title="The fund">
        <label className={styles.check}><input type="checkbox" checked={f.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Take gifts or donations for this event</label>
        {f.enabled && (
          <div className="stack">
            <div className={styles.segmented} role="radiogroup" aria-label="Kind of fund">
              <button type="button" role="radio" aria-checked={f.kind === 'charity'} onClick={() => set({ kind: 'charity' })}>Charity (tax-deductible)</button>
              <button type="button" role="radio" aria-checked={f.kind === 'gift'} onClick={() => set({ kind: 'gift' })}>Gift fund (honeymoon, baby…)</button>
            </div>
            <div className={styles.grid2}>
              <Field label="Fund name" value={f.name} onChange={(e) => set({ name: e.target.value })} />
              <Field label="Goal ($)" inputMode="decimal" value={f.goalCents / 100 || ''} onChange={(e) => set({ goalCents: dollarsToCents(e.target.value) || 0 })} />
              {f.kind === 'charity' && <Field label="Organization (501(c)(3))" value={f.org.name} onChange={(e) => set({ org: { ...f.org, name: e.target.value } })} />}
              {f.kind === 'charity' && <Field label="Tax ID (EIN)" value={f.org.taxId} onChange={(e) => set({ org: { ...f.org, taxId: e.target.value } })} />}
              <Field label="Suggested amounts ($, comma-separated)" value={f.suggested.map((c) => c / 100).join(', ')}
                onChange={(e) => set({ suggested: e.target.value.split(',').map((x) => dollarsToCents(x.trim())).filter((c) => c > 0) })} />
            </div>
            <Field label="The story" as="textarea" rows={3} value={f.story} onChange={(e) => set({ story: e.target.value })} />
            <label className={styles.check}><input type="checkbox" checked={f.recurring} onChange={(e) => set({ recurring: e.target.checked })} /> Allow monthly giving</label>
            {f.kind === 'gift' && <p className="muted">Gift funds are never tax-deductible: receipts say “gift, not tax-deductible” and nothing about taxes.</p>}
            <div className="cluster">
              <Button to={`/e/${event.id}/give`}>Donation page</Button>
              <Button to={`/screen/giving/${event.id}`}><Icon name="external" size={14} /> Recognition screen</Button>
              <Button onClick={() => dispatch({ type: 'donations/yearEnd', eventId: event.id })}>Send year-end summaries</Button>
            </div>
          </div>
        )}
      </Card>

      {pending.length > 0 && (
        <Card title={`Messages waiting for approval (${pending.length})`}>
          <ul role="list" className={styles.rows}>
            {pending.map((d) => (
              <li key={d.id}><span>“{d.message}” · {d.anonymous ? 'Anonymous' : d.name}</span>
                <span className="cluster">
                  <Button size="small" variant="primary" onClick={() => dispatch({ type: 'donation/moderate', id: d.id, status: 'approved' })}>Show on screen</Button>
                  <Button size="small" onClick={() => dispatch({ type: 'donation/moderate', id: d.id, status: 'hidden' })}>Don't show</Button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {recognition(state, event.id).messages.length > 0 && (
        <details className={styles.doneGroup}>
          <summary>On the screen now ({recognition(state, event.id).messages.length})</summary>
          <ul role="list" className={styles.rows}>
            {recognition(state, event.id).messages.map((d) => (
              <li key={d.id}><span>“{d.message}”</span><Button size="small" onClick={() => dispatch({ type: 'donation/moderate', id: d.id, status: 'hidden' })}>Hide now</Button></li>
            ))}
          </ul>
        </details>
      )}

      {gifts.length > 0 && (
        <Card title={`Gifts (${gifts.length})`}>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.stackTable}`}>
              <thead><tr><th>Donor</th><th className={styles.num}>Amount</th><th>How</th><th>Receipt</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                {gifts.map((d) => {
                  const r = receiptFor(state, d)
                  return (
                    <tr key={d.id}>
                      <td><strong>{d.name}</strong>{d.anonymous && ' (anonymous on screen)'}<span className={styles.subline}>{formatDayShort(d.at)}{d.dedication && ` · ${d.dedication}`}</span></td>
                      <td className={styles.num}>{formatMoney(d.amountCents + d.feeCents)}</td>
                      <td>{d.source === 'online' ? 'Online' : d.source === 'paddle' ? 'Paddle raise' : 'Auction'}{d.recurring && ' · monthly'}
                        {d.cardExpired && <> · <StatusChip tone="warning" label="Card expired" /></>}</td>
                      <td>{d.status === 'refunded' ? <StatusChip tone="neutral" label="Void (refunded)" /> : <>{r.number}<span className={styles.subline}>{r.charity ? `${formatMoney(r.deductibleCents)} deductible` : 'Gift'}</span></>}</td>
                      <td className={styles.rowActions}>
                        {d.cardExpired && <Button size="small" onClick={() => dispatch({ type: 'donation/cardUpdateLink', id: d.id })}>Send update link</Button>}
                        {d.status === 'paid' && <Button size="small" variant="danger" onClick={() => setRefunding(d)}>Refund</Button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <ConfirmDialog open={Boolean(refunding)} title={`Refund ${refunding?.name}?`} confirmLabel={`Refund ${refunding ? formatMoney(refunding.amountCents + refunding.feeCents) : ''}`}
        onCancel={() => setRefunding(null)} onConfirm={() => { dispatch({ type: 'donation/refund', id: refunding.id }); setRefunding(null) }}>
        The money goes back to their card. Their receipt is voided and a corrected one is emailed.
      </ConfirmDialog>
    </div>
  )
}

function AuctionPart({ event }) {
  const { state, dispatch } = useStore()
  const [item, setItem] = useState({ title: '', donor: '', value: '', start: '', increment: '' })
  const [closing, setClosing] = useState(false)
  const a = event.auction
  const set = (changes) => dispatch({ type: 'auction/configure', eventId: event.id, changes })
  const board = auctionBoard(state, event.id)
  const add = (e) => {
    e.preventDefault()
    set({ items: [...a.items, { id: `ai-${a.items.length + 1}-${Date.now().toString(36)}`, title: item.title.trim(), donor: item.donor.trim(), valueCents: dollarsToCents(item.value) || 0, startCents: dollarsToCents(item.start) || 0, incrementCents: dollarsToCents(item.increment) || 500, hue: (a.items.length * 67) % 360 }] })
    setItem({ title: '', donor: '', value: '', start: '', increment: '' })
  }
  return (
    <Card title="Silent auction" action={a.enabled && !a.closedAt && <Button size="small" variant="primary" onClick={() => setClosing(true)}>Close the auction</Button>}>
      <label className={styles.check}><input type="checkbox" checked={a.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Silent auction at this event</label>
      {a.enabled && (
        <div className="stack">
          <div className={styles.inlineForm}>
            <Field label="Bidding closes at" type="time" value={a.closesAt} onChange={(e) => set({ closesAt: e.target.value })} />
            <label className={styles.check}><input type="checkbox" checked={a.softClose} onChange={(e) => set({ softClose: e.target.checked })} /> Soft close: a bid in the last 2 minutes adds 2 minutes</label>
          </div>
          {a.closedAt && <Notice tone="info">Closed {formatDayShort(a.closedAt)}. Winners with a working card were charged and texted.</Notice>}
          <ul role="list" className={styles.tasks} aria-label="Auction items">
            {board.map((it) => (
              <li key={it.id} className={styles.task}>
                <div className={styles.taskMain}>
                  <span className={styles.taskTitle}>{it.title}</span>
                  <span className={styles.taskMeta}>{it.donor} · value {formatMoney(it.valueCents)} · {it.bids.length} bid{it.bids.length === 1 ? '' : 's'}
                    {it.high ? ` · high ${formatMoney(it.high.amountCents)} (${it.highBidder.name})` : ` · starts ${formatMoney(it.startCents)}`}
                    {it.closesAt !== a.closesAt && it.closesAt && ` · extended to ${formatClock(it.closesAt)}`}</span>
                </div>
                {it.result && (
                  <div className={styles.taskTools}>
                    <StatusChip tone={it.result.status === 'paid' ? 'success' : it.result.status === 'unpaid' ? 'danger' : 'warning'}
                      label={it.result.status === 'paid' ? `Paid by ${state.bidders.find((b) => b.id === it.result.winnerId)?.name}` : it.result.status === 'unpaid' ? 'Card declined: payment link sent' : 'Offered to the next bidder'} />
                    {it.result.status === 'unpaid' && <Button size="small" onClick={() => dispatch({ type: 'auction/offerNext', eventId: event.id, itemId: it.id })}>Offer to the next bidder</Button>}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {!a.closedAt && (
            <form className={styles.roForm} onSubmit={add}>
              <Field label="Item" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} />
              <Field label="Donated by" value={item.donor} onChange={(e) => setItem({ ...item, donor: e.target.value })} />
              <Field label="Value ($)" inputMode="decimal" value={item.value} onChange={(e) => setItem({ ...item, value: e.target.value })} hint="Its fair market value (only bids above it are deductible)" />
              <Field label="Starting bid ($)" inputMode="decimal" value={item.start} onChange={(e) => setItem({ ...item, start: e.target.value })} />
              <Field label="Bid increment ($)" inputMode="decimal" value={item.increment} onChange={(e) => setItem({ ...item, increment: e.target.value })} />
              <Button type="submit" disabled={!item.title.trim()}>Add item</Button>
            </form>
          )}
          <Button to={`/e/${event.id}/auction`}>Bidding page (table QR)</Button>
        </div>
      )}
      <ConfirmDialog open={closing} danger={false} title="Close the auction now?" confirmLabel="Close and charge winners" onCancel={() => setClosing(false)}
        onConfirm={() => { dispatch({ type: 'auction/close', eventId: event.id }); setClosing(false) }}>
        Bidding stops. Each winner’s card on file is charged and they get a text; a declined card gets a payment link.
      </ConfirmDialog>
    </Card>
  )
}

function PaddlePart({ event }) {
  const { state, dispatch } = useStore()
  const p = event.paddle
  const board = paddleBoard(state, event.id)
  return (
    <Card title={`Paddle raise · ${formatMoney(board.totalCents)}`}>
      <label className={styles.check}><input type="checkbox" checked={p.enabled} onChange={(e) => dispatch({ type: 'paddle/configure', eventId: event.id, changes: { enabled: e.target.checked } })} /> Paddle raise at this event</label>
      {p.enabled && (
        <div className="stack">
          <p className="muted">When the auctioneer calls a level, tap it here; guests' phones show that amount to pledge.</p>
          <ul role="list" className={styles.rows} aria-label="Levels">
            {board.levels.map((l) => (
              <li key={l.i}>
                <Button size="small" variant={board.current === l.i ? 'primary' : undefined} aria-pressed={board.current === l.i}
                  onClick={() => dispatch({ type: 'paddle/setLevel', eventId: event.id, index: board.current === l.i ? null : l.i })}>{formatMoney(l.cents)}</Button>
                <span>{l.pledges.length} pledge{l.pledges.length === 1 ? '' : 's'}{l.pledges.length > 0 && `: ${l.pledges.map((d) => (d.anonymous ? 'Anonymous' : d.name)).join(', ')}`}</span>
              </li>
            ))}
          </ul>
          <Button to={`/e/${event.id}/paddle`}>Guests’ pledge page</Button>
        </div>
      )}
    </Card>
  )
}

function SponsorsPart({ event }) {
  const { state, dispatch } = useStore()
  const s = event.sponsorship
  const list = state.sponsors.filter((x) => x.eventId === event.id)
  return (
    <Card title="Sponsors">
      <label className={styles.check}><input type="checkbox" checked={s.enabled} onChange={(e) => dispatch({ type: 'sponsorship/configure', eventId: event.id, changes: { enabled: e.target.checked } })} /> Take sponsors for this event</label>
      {s.enabled && (
        <div className="stack">
          <ul role="list" className={styles.rows} aria-label="Tiers">
            {s.tiers.map((t) => <li key={t.id}><strong>{t.name} · {formatMoney(t.priceCents)}</strong><span className="muted">{t.benefits.join(' · ')} · {list.filter((x) => x.tierId === t.id).length} of {t.limit}</span></li>)}
          </ul>
          {list.length > 0 && (
            <ul role="list" className={styles.tasks} aria-label="Sponsors">
              {list.map((sp) => (
                <li key={sp.id} className={styles.task}>
                  <div className={styles.taskMain}>
                    <span className={styles.taskTitle}>{sp.company} · {tierOf(event, sp.tierId)?.name}</span>
                    <span className={styles.taskMeta}>{sp.contact} · {sp.email} · {sp.paidAt ? 'Paid' : 'Invoice sent'}{sp.logo ? ' · logo uploaded' : ''}</span>
                  </div>
                  <div className={styles.taskTools}>
                    {!sp.paidAt && <Button size="small" onClick={() => dispatch({ type: 'sponsor/markPaid', id: sp.id })}>Mark paid</Button>}
                    {sp.status === 'pending' ? <Button size="small" variant="primary" onClick={() => dispatch({ type: 'sponsor/approve', id: sp.id })}>Approve logo</Button> : <StatusChip tone="success" label="On the screen" />}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="muted">Each sponsor’s benefits become tasks on this event’s checklist.</p>
          <Button to={`/e/${event.id}/sponsor`}>Sponsor page</Button>
        </div>
      )}
    </Card>
  )
}

export default function Fundraising() {
  const { event } = useOutletContext()
  const { state } = useStore()
  const [part, setPart] = useState('fund')
  const f = fundTotals(state, event.id)
  return (
    <div className="stack">
      {event.fund.enabled && (
        <Kpis label="Raised" items={[
          { label: 'raised', value: formatMoney(f.raisedCents), note: f.goalCents ? `${f.percent}% of ${formatMoney(f.goalCents)}` : undefined },
          { label: 'donors', value: f.donors },
          { label: 'auction', value: formatMoney(f.bySource.auction) },
          { label: 'sponsors', value: formatMoney(f.sponsorCents) },
        ]} />
      )}
      <div className={styles.segmented} role="tablist" aria-label="Fundraising">
        {PARTS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={part === id} onClick={() => setPart(id)}>{label}</button>)}
      </div>
      {part === 'fund' && <FundPart event={event} />}
      {part === 'auction' && <AuctionPart event={event} />}
      {part === 'paddle' && <PaddlePart event={event} />}
      {part === 'sponsors' && <SponsorsPart event={event} />}
    </div>
  )
}
