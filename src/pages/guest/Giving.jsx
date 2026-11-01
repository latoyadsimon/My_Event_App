// =====================================================================
// Giving pages for guests and donors (product Phase 4), EN | ES:
//   Give      /e/:slug/give      DN-1, GU-3.3: the cause, goal and progress; suggested or
//                                custom amount; monthly; dedication; anonymous; cover fees;
//                                Apple Pay / Google Pay / card (stand-ins); one confirmation
//   Auction   /e/:slug/auction   DN-3: register once with a card, bid from the phone
//   Paddle    /e/:slug/paddle    DN-4: tap the amount the auctioneer calls
//   Sponsor   /e/:slug/sponsor   DN-6: pick a tier, company + logo, pay now or invoice
// Each submit carries a key made once per form, so a double tap charges once (NFR-6).
// =====================================================================
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { auctionBoard, formatClock, fundTotals, paddleBoard, tierOf } from '../../store/selectors'
import { newId } from '../../store/helpers'
import { formatMoney } from '../../lib/money'
import { dollarsToCents } from '../../lib/validate'
import { Button, Field } from '../../components/ui'
import PhotoTile from '../../components/booth/PhotoTile'
import styles from './guest.module.css'

const dollars = (cents) => formatMoney(cents).replace('.00', '')

function Progress({ event, t }) {
  const { state } = useStore()
  const f = fundTotals(state, event.id)
  if (!f.goalCents) return null
  return (
    <div className={styles.goal}>
      <span className={styles.bar} aria-hidden="true"><span style={{ width: `${f.percent}%` }} /></span>
      <p><strong>{t('raisedOf', { raised: dollars(f.raisedCents), goal: dollars(f.goalCents) })}</strong></p>
    </div>
  )
}

export function Give() {
  const { event, guest, t } = useOutletContext()
  const { dispatch } = useStore()
  const fund = event.fund
  const [key, setKey] = useState(() => newId('give'))
  const [amount, setAmount] = useState(fund?.suggested?.[1] ?? fund?.suggested?.[0] ?? 0)
  const [custom, setCustom] = useState('')
  const [v, setV] = useState({ name: guest?.name ?? '', email: guest?.email ?? '', dedication: '', message: '', anonymous: false, recurring: false, coverFees: true, pay: 'apple' })
  const [done, setDone] = useState(false)
  if (!fund?.enabled) return <p>{t('givingOff')}</p>
  const cents = custom ? (dollarsToCents(custom) || 0) : amount
  const fee = Math.round(cents * (fund.feePercent ?? 3) / 100)
  const total = cents + (v.coverFees ? fee : 0)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = (e) => {
    e.preventDefault()
    dispatch({ type: 'donation/give', eventId: event.id, key, amountCents: cents, ...v })
    setDone(true)
  }
  if (done) {
    return (
      <section className={styles.panel} aria-live="polite">
        <h1 className={styles.siteTitle}>{t('thanksGift')}</h1>
        <Progress event={event} t={t} />
        <Button onClick={() => { setKey(newId('give')); setDone(false) }}>{t('giveAgain')}</Button>
      </section>
    )
  }
  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.siteTitle}>{fund.name}</h1>
        {fund.story && <p className={styles.welcome}>{fund.story}</p>}
        <Progress event={event} t={t} />
      </header>
      <form className={styles.panel} onSubmit={submit}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t('amount')}</legend>
          <div className={styles.amounts}>
            {fund.suggested.map((c) => (
              <button key={c} type="button" className={styles.amount} aria-pressed={!custom && amount === c} onClick={() => { setAmount(c); setCustom('') }}>{dollars(c)}</button>
            ))}
          </div>
          <Field label={t('other')} inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} />
        </fieldset>
        {fund.recurring && <label className={styles.check}><input type="checkbox" checked={v.recurring} onChange={set('recurring')} /> {t('monthly')}</label>}
        <div className={styles.formGrid}>
          <Field label={t('yourName')} value={v.name} onChange={set('name')} autoComplete="name" required />
          <Field label={t('yourEmail')} type="email" value={v.email} onChange={set('email')} autoComplete="email" required />
        </div>
        <Field label={t('dedicate')} value={v.dedication} onChange={set('dedication')} />
        <Field label={t('messageOptional')} value={v.message} onChange={set('message')} />
        <label className={styles.check}><input type="checkbox" checked={v.anonymous} onChange={set('anonymous')} /> {t('anonymous')}</label>
        {cents > 0 && <label className={styles.check}><input type="checkbox" checked={v.coverFees} onChange={set('coverFees')} /> {t('coverFees', { fee: formatMoney(fee) })}</label>}
        <Field label={t('payWith')} as="select" value={v.pay} onChange={set('pay')}>
          <option value="apple">Apple Pay</option><option value="google">Google Pay</option><option value="card">Card ·4242</option>
        </Field>
        <p className={styles.muted}>{fund.kind === 'charity' ? t('taxNote', { org: fund.org.name, taxId: fund.org.taxId }) : t('giftNote')}</p>
        <Button type="submit" variant="primary" disabled={!(cents > 0) || !v.name.trim() || !v.email.trim()}>{t('giveNow', { amount: formatMoney(total) })}</Button>
      </form>
    </>
  )
}

/** Register once (name, phone, card on file); this page remembers you while it's open. */
function useBidder(event, t) {
  const { state, dispatch } = useStore()
  const [id, setId] = useState(null)
  const [v, setV] = useState({ name: '', phone: '', card: '' })
  const me = state.bidders.find((b) => b.id === id)
  const form = (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); const bid = newId('bd'); dispatch({ type: 'bidder/register', eventId: event.id, id: bid, ...v, card: `Card ·${v.card.slice(-4)}` }); setId(bid) }}>
      <div className={styles.formGrid}>
        <Field label={t('yourName')} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" />
        <Field label={t('mobile')} type="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} autoComplete="tel" />
        <Field label={t('cardOnFile')} inputMode="numeric" value={v.card} onChange={(e) => setV({ ...v, card: e.target.value.replace(/\D/g, '').slice(0, 16) })} autoComplete="cc-number" hint="Demo: any 16 digits" />
      </div>
      <Button type="submit" variant="primary" disabled={!v.name.trim() || !v.phone.trim() || v.card.length < 12}>{t('register')}</Button>
    </form>
  )
  return { me, form }
}

function BidForm({ item, me, event, t }) {
  const { dispatch } = useStore()
  const [amount, setAmount] = useState(String(item.minNextCents / 100))
  return (
    <form className={styles.inlineGuest} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'bid/place', eventId: event.id, itemId: item.id, bidderId: me.id, amountCents: dollarsToCents(amount) || 0 }) }}>
      <Field label={`${t('yourBid')}: ${item.title}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} hint={`≥ ${formatMoney(item.minNextCents)}`} />
      <Button type="submit" variant="primary">{t('bid')}</Button>
    </form>
  )
}

export function Auction() {
  const { event, t } = useOutletContext()
  const { state } = useStore()
  const { me, form } = useBidder(event, t)
  if (!event.auction?.enabled) return <p>{t('auctionClosed')}</p>
  const items = auctionBoard(state, event.id)
  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.siteTitle}>{t('auction')}</h1>
        <p className={styles.welcome}>{event.name}{event.auction.closesAt && ` · ${t('closes', { time: formatClock(event.auction.closesAt) })}`}</p>
      </header>
      {event.auction.closedAt ? <section className={styles.panel}><p>{t('auctionClosed')}</p></section>
        : !me && <section className={styles.panel}><p className={styles.muted}>{t('auctionLead')}</p>{form}</section>}
      <ul role="list" className={styles.auction} aria-label={t('auction')}>
        {items.map((item) => (
          <li key={item.id} className={styles.panel}>
            <PhotoTile photo={{ id: item.id, source: 'guest', hue: item.hue }} event={event} label={item.title} />
            <h2 className={styles.panelTitle}>{item.title}</h2>
            <p className={styles.muted}>{item.donor} · {t('value', { amount: dollars(item.valueCents) })}</p>
            <p><strong>{item.high ? t('highBid', { amount: formatMoney(item.high.amountCents) }) : t('startingBid', { amount: formatMoney(item.startCents) })}</strong>
              {me && item.highBidder?.id === me.id && <> · {t('youLead')}</>}</p>
            {me && !event.auction.closedAt && <BidForm key={item.minNextCents} item={item} me={me} event={event} t={t} />}
          </li>
        ))}
      </ul>
    </>
  )
}

export function Paddle() {
  const { event, t } = useOutletContext()
  const { state, dispatch } = useStore()
  const { me, form } = useBidder(event, t)
  const [anon, setAnon] = useState(false)
  const [mine, setMine] = useState([])
  if (!event.paddle?.enabled) return null
  const board = paddleBoard(state, event.id)
  const level = board.current != null ? board.levels[board.current] : null
  const key = level && me ? `paddle-${me.id}-${level.i}` : null
  const pledged = key && mine.includes(key)
  return (
    <>
      <header className={styles.hero}>
        <h1 className={styles.siteTitle}>{t('paddle')}</h1>
        <p className={styles.welcome}>{event.fund?.name || event.name}</p>
        <Progress event={event} t={t} />
      </header>
      <section className={styles.panel}>
        <p className={styles.muted}>{t('paddleLead')}</p>
        {!me ? form : !level ? <p>{t('waitingLevel')}</p> : pledged ? <p>{t('pledged', { amount: dollars(level.cents) })}</p> : (
          <>
            <button type="button" className={styles.paddleButton} onClick={() => { dispatch({ type: 'donation/give', eventId: event.id, key, amountCents: level.cents, name: me.name, anonymous: anon, source: 'paddle' }); setMine([...mine, key]) }}>
              {t('pledge', { amount: dollars(level.cents) })}
            </button>
            <label className={styles.check}><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> {t('anonymous')}</label>
          </>
        )}
      </section>
    </>
  )
}

export function Sponsor() {
  const { event, t } = useOutletContext()
  const { state, dispatch } = useStore()
  const tiers = event.sponsorship?.tiers ?? []
  const [v, setV] = useState({ tierId: tiers[0]?.id ?? '', company: '', contact: '', email: '', logo: null, pay: 'card' })
  const [done, setDone] = useState(false)
  if (!event.sponsorship?.enabled) return null
  const taken = (id) => state.sponsors.filter((s) => s.eventId === event.id && s.tierId === id).length
  const tier = tierOf(event, v.tierId)
  if (done) return <section className={styles.panel} aria-live="polite"><h1 className={styles.siteTitle}>{t('sponsorThanks')}</h1></section>
  return (
    <>
      <header className={styles.hero}><h1 className={styles.siteTitle}>{t('sponsor')}</h1><p className={styles.welcome}>{event.name}</p></header>
      <form className={styles.panel} onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'sponsor/checkout', eventId: event.id, ...v }); setDone(true) }}>
        <p className={styles.muted}>{t('sponsorLead')}</p>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t('sponsor')}</legend>
          <ul role="list" className={styles.tiers}>
            {tiers.map((tr) => {
              const left = tr.limit - taken(tr.id)
              return (
                <li key={tr.id}>
                  <label className={styles.tier}>
                    <input type="radio" name="tier" value={tr.id} checked={v.tierId === tr.id} disabled={left <= 0} onChange={() => setV({ ...v, tierId: tr.id })} />
                    <span><strong>{tr.name} · {dollars(tr.priceCents)}</strong> <span className={styles.muted}>({t('sponsorSpots', { n: Math.max(0, left) })})</span>
                      <span className={styles.muted}>{tr.benefits.join(' · ')}</span></span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
        <div className={styles.formGrid}>
          <Field label={t('company')} value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} autoComplete="organization" />
          <Field label={t('contactName')} value={v.contact} onChange={(e) => setV({ ...v, contact: e.target.value })} autoComplete="name" />
          <Field label={t('yourEmail')} type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" />
          <Field label={t('logo')} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; setV({ ...v, logo: f?.type?.startsWith('image/') ? URL.createObjectURL(f) : null }) }} />
        </div>
        <div className={styles.choice} role="radiogroup" aria-label={t('payWith')}>
          <button type="button" role="radio" aria-checked={v.pay === 'card'} onClick={() => setV({ ...v, pay: 'card' })}>{t('payNow')}</button>
          <button type="button" role="radio" aria-checked={v.pay === 'invoice'} onClick={() => setV({ ...v, pay: 'invoice' })}>{t('invoiceMe')}</button>
        </div>
        <Button type="submit" variant="primary" disabled={!tier || !v.company.trim() || !v.email.trim()}>{v.pay === 'card' ? `${t('payNow')} · ${tier ? formatMoney(tier.priceCents) : ''}` : t('invoiceMe')}</Button>
      </form>
    </>
  )
}
