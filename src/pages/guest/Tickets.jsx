// =====================================================================
// Guest pages for tickets and seats (product Phase 4), EN | ES:
//   Tickets   /e/:slug/tickets     GU-3.4: tiers with what's left, quantities, a promo
//                                  code, one tap to buy (a double tap buys once), then a
//                                  QR per ticket (?o=<order> shows them again, from the email);
//                                  sold out → the waitlist
//   FindSeat  /e/:slug/seat        GU-5.2: type your name → your table, on a small map
// =====================================================================
import { useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { findSeat, promoFor, ticketSales } from '../../store/selectors'
import { newId } from '../../store/helpers'
import { formatMoney } from '../../lib/money'
import { Button, Field, QrCode } from '../../components/ui'
import styles from './guest.module.css'

function Order({ orderId, event, t }) {
  const { state } = useStore()
  const mine = state.tickets.filter((k) => k.orderId === orderId)
  if (!mine.length) return null
  return (
    <section className={styles.panel} aria-labelledby="h-mine">
      <h2 id="h-mine" className={styles.panelTitle}>{t('yourTickets')}</h2>
      <p className={styles.muted}>{t('showAtDoor')}</p>
      <ul role="list" className={styles.ticketList}>
        {mine.map((k) => (
          <li key={k.id} className={styles.ticket}>
            <QrCode value={k.code} size={120} label={`QR code for ${k.holder}'s ticket ${k.code}`} />
            <div><strong>{k.holder}</strong><span className={styles.muted}>{event.ticketing.tiers.find((x) => x.id === k.tierId)?.name} · {k.code}</span></div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Tickets() {
  const { event, guest, t } = useOutletContext()
  const { state, dispatch } = useStore()
  const [params, setParams] = useSearchParams()
  const [key, setKey] = useState(() => newId('order'))
  const [qty, setQty] = useState({})
  const [promo, setPromo] = useState('')
  const [applied, setApplied] = useState(null)
  const [v, setV] = useState({ name: guest?.name ?? '', email: guest?.email ?? '' })
  const [wait, setWait] = useState(false)
  const order = params.get('o')
  if (!event.ticketing?.enabled) return null
  const sales = ticketSales(state, event.id)
  const price = (tier) => (applied ? Math.round(tier.priceCents * (100 - applied.percentOff) / 100) : tier.priceCents)
  const total = sales.tiers.reduce((sum, tier) => sum + price(tier) * (qty[tier.id] ?? 0), 0)
  const count = Object.values(qty).reduce((a, b) => a + b, 0)
  const allGone = sales.tiers.every((tier) => tier.left === 0)
  const buy = (e) => {
    e.preventDefault()
    dispatch({ type: 'ticket/buy', eventId: event.id, key, buyer: v.name, email: v.email, promo: applied?.code, lines: Object.entries(qty).map(([tierId, n]) => ({ tierId, qty: n })) })
    setParams((p) => { p.set('o', key); return p }, { replace: true })
    setQty({}); setKey(newId('order'))     // the new order shows above, found by its key
  }
  const orderId = order && (state.tickets.find((k) => k.orderKey === order)?.orderId ?? order)

  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.siteTitle}>{t('tickets')}</h1>
        <p className={styles.welcome}>{event.name}</p>
      </header>
      {orderId && <Order orderId={orderId} event={event} t={t} />}
      {allGone || wait ? (
        <form className={styles.panel} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'waitlist/join', eventId: event.id, tierId: null, name: v.name, email: v.email }) }}>
          <p>{t('waitlistLead')}</p>
          <div className={styles.formGrid}>
            <Field label={t('yourName')} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" />
            <Field label={t('yourEmail')} type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" />
          </div>
          <Button type="submit" variant="primary" disabled={!v.name.trim() || !v.email.trim()}>{t('joinWaitlist')}</Button>
        </form>
      ) : (
        <form className={styles.panel} onSubmit={buy}>
          <p className={styles.muted}>{t('ticketsLead')}</p>
          <ul role="list" className={styles.tiers}>
            {sales.tiers.map((tier) => (
              <li key={tier.id} className={styles.ticketTier}>
                <span>
                  <strong>{tier.name} · {tier.priceCents ? formatMoney(price(tier)) : 'Free'}</strong>
                  <span className={styles.muted}>{tier.note} · {tier.left ? t('left', { n: tier.left }) : t('soldOut')}</span>
                </span>
                <label className={styles.qty}>
                  <span className="visually-hidden">{t('howMany', { tier: tier.name })}</span>
                  <select value={qty[tier.id] ?? 0} disabled={!tier.left} onChange={(e) => setQty({ ...qty, [tier.id]: Number(e.target.value) })}>
                    {Array.from({ length: Math.min(10, tier.left) + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </li>
            ))}
          </ul>
          <div className={styles.inlineGuest}>
            <Field label={t('promo')} value={promo} onChange={(e) => setPromo(e.target.value)}
              hint={applied ? t('promoOk', { percent: applied.percentOff }) : undefined} error={promo && applied === false ? t('promoBad') : undefined} />
            <Button onClick={() => setApplied(promoFor(event, promo) ?? false)} disabled={!promo.trim()}>{t('apply')}</Button>
          </div>
          <div className={styles.formGrid}>
            <Field label={t('yourName')} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" />
            <Field label={t('yourEmail')} type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" />
          </div>
          <Button type="submit" variant="primary" disabled={!count || !v.name.trim() || !v.email.trim()}>{t('buy', { amount: formatMoney(total) })}</Button>
          {sales.tiers.some((tier) => !tier.left) && <button type="button" className="link-button" onClick={() => setWait(true)}>{t('joinWaitlist')}</button>}
        </form>
      )}
    </>
  )
}

export function FindSeat() {
  const { event, guest, t } = useOutletContext()
  const { state } = useStore()
  const [name, setName] = useState(guest?.name ?? '')
  const results = findSeat(state, event.id, name)
  const plan = event.floorPlan
  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.siteTitle}>{t('findSeat')}</h1>
        <p className={styles.welcome}>{event.name}</p>
      </header>
      <section className={styles.panel}>
        <Field label={t('yourName2')} value={name} onChange={(e) => setName(e.target.value)} hint={t('findSeatLead')} autoComplete="name" />
        {name.trim().length >= 2 && results.length === 0 && <p>{t('noSeat')}</p>}
        {results.map(({ guest: g, table }) => (
          <div key={g.id} className={styles.seat} aria-live="polite">
            <p className={styles.checkInCode}>{t('table', { n: table.label })}</p>
            <p className={styles.muted}>{g.name}</p>
            {plan?.objects.length > 0 && (
              <div className={styles.miniMap} style={{ aspectRatio: `${plan.widthFt} / ${plan.heightFt}` }} role="img" aria-label={`${t('table', { n: table.label })}`}>
                {plan.objects.map((o) => (
                  <span key={o.id} className={o.id === table.id ? styles.mapHere : styles.mapThing}
                    style={{ left: `${(o.x / plan.widthFt) * 100}%`, top: `${(o.y / plan.heightFt) * 100}%`, width: `${(o.w / plan.widthFt) * 100}%`, height: `${(o.h / plan.heightFt) * 100}%`, borderRadius: o.kind === 'table-round' ? '50%' : undefined }}>
                    {o.kind.startsWith('table') ? o.label : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  )
}
