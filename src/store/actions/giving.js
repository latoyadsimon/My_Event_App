// =====================================================================
// Fundraising (product Phase 4): give (DN-1, GU-3.3), receipts and
// refunds (DN-2), recurring gifts (DN-5), the silent auction (DN-3), the
// paddle raise (DN-4), sponsors (DN-6) and message moderation (DN-7).
// Every charge carries an idempotency key: a double tap never charges
// twice (NFR-6).
// =====================================================================
import { formatDay, nowStamp } from '../../lib/clock'
import { formatMoney } from '../../lib/money'
import { auctionBoard, receiptFor, softCloseAfterBid, tierOf } from '../selectors'
import { newId, updateById, withMessage, withToast, firstName } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const setPart = (state, eventId, key, changes) => ({ ...state, events: updateById(state.events, eventId, (e) => ({ [key]: { ...e[key], ...changes } })) })

/** The receipt email, worded per DN-2 (no tax words on gift funds). */
function receiptEmail(state, donation, subject) {
  const event = eventOf(state, donation.eventId)
  const r = receiptFor(state, donation)
  const lines = r.charity
    ? `${r.org} (tax ID ${r.taxId}) received ${formatMoney(r.total)} on ${formatDay(donation.at)}. Tax-deductible amount: ${formatMoney(r.deductibleCents)}${r.fmvCents ? ` (you received goods or services worth ${formatMoney(r.fmvCents)})` : ''}. Receipt ${r.number}.`
    : `Your gift of ${formatMoney(r.total)} to ${event.fund.name} arrived on ${formatDay(donation.at)}. This is a gift, not a tax-deductible donation. Receipt ${r.number}.`
  return withMessage(state, {
    type: 'email', to: donation.email || donation.name, from: state.business.name, subject: subject ?? `Thank you! Receipt ${r.number}`,
    body: `${r.voided ? 'This replaces your earlier receipt. ' : ''}${lines}${donation.dedication ? ` Given ${donation.dedication.toLowerCase().startsWith('in ') ? '' : 'for '}${donation.dedication}.` : ''}`,
  })
}

const nextReceipt = (state) => `R-${1001 + state.donations.length}`

export const givingActions = {
  // ---- Setup (PL-5.6, P4) ----
  'fund/configure': (state, a) => setPart(state, a.eventId, 'fund', a.changes),
  'auction/configure': (state, a) => setPart(state, a.eventId, 'auction', a.changes),
  'paddle/configure': (state, a) => setPart(state, a.eventId, 'paddle', a.changes),
  'sponsorship/configure': (state, a) => setPart(state, a.eventId, 'sponsorship', a.changes),

  // ---- Give (DN-1): one confirmation, never twice ----
  'donation/give': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (!event?.fund?.enabled && a.source !== 'paddle') return state
    if (state.donations.some((d) => d.key === a.key)) return state                 // the second tap of a double tap
    // Name and email for the receipt (a paddle pledge comes from a registered bidder, who may have only a phone)
    if (!(a.amountCents > 0) || !a.name?.trim() || (a.source !== 'paddle' && !a.email?.trim())) return state
    const donation = {
      id: newId('don'), eventId: event.id, key: a.key, amountCents: a.amountCents,
      feeCents: a.coverFees ? Math.round(a.amountCents * (event.fund.feePercent ?? 3) / 100) : 0,
      name: a.name.trim(), email: a.email?.trim() ?? '', anonymous: Boolean(a.anonymous), dedication: a.dedication?.trim() ?? '',
      recurring: a.recurring && event.fund.recurring ? 'monthly' : null, message: a.message?.trim() ?? '', messageStatus: a.message?.trim() ? 'pending' : null,
      source: a.source ?? 'online', fmvCents: a.fmvCents ?? 0, status: 'paid', at: nowStamp(), receiptNo: nextReceipt(state), cardExpired: false,
    }
    const next = receiptEmail({ ...state, donations: [...state.donations, donation] }, donation)
    return withToast(next, `Thank you, ${firstName(donation.name)}! ${formatMoney(donation.amountCents + donation.feeCents)} received.`)
  },

  // Refunds start with the planner; the receipt is voided and reissued (DN-2)
  'donation/refund': (state, a) => {
    const d = state.donations.find((x) => x.id === a.id)
    if (!d || d.status !== 'paid') return state
    const next = { ...state, donations: updateById(state.donations, d.id, { status: 'refunded', refundedAt: nowStamp() }) }
    const voided = next.donations.find((x) => x.id === d.id)
    return withToast(receiptEmail(next, { ...voided, amountCents: 0, feeCents: 0 }, `Refund: receipt ${d.receiptNo} is void`), `Refunded ${formatMoney(d.amountCents + d.feeCents)} to ${d.name}`)
  },
  // DN-7: messages show on the screen only after a person approves them; hide one instantly
  'donation/moderate': (state, a) => ({ ...state, donations: updateById(state.donations, a.id, { messageStatus: a.status }) }),

  // ---- Recurring (DN-5) ----
  'donation/cardUpdateLink': (state, a) => {
    const d = state.donations.find((x) => x.id === a.id)
    const event = eventOf(state, d.eventId)
    const next = withMessage(state, { type: 'email', to: d.email, from: state.business.name, subject: 'Your card expired: keep your monthly gift going', body: `Thank you for giving ${formatMoney(d.amountCents)} a month to ${event.fund.name}. Your card on file expired. Update it here; it takes a minute.`, link: { label: 'Update my card', to: `/e/${event.id}/give`, role: 'guest' } })
    return withToast(next, `Update link sent to ${d.name}`)
  },
  'donations/yearEnd': (state, a) => {
    const event = eventOf(state, a.eventId)
    const byDonor = {}
    for (const d of state.donations.filter((x) => x.eventId === event.id && x.status === 'paid' && x.email)) (byDonor[d.email] ??= []).push(d)
    let next = state
    for (const [email, list] of Object.entries(byDonor)) {
      const total = list.reduce((t, d) => t + d.amountCents + d.feeCents, 0)
      const deductible = list.reduce((t, d) => t + receiptFor(state, d).deductibleCents, 0)
      next = withMessage(next, {
        type: 'email', to: email, from: state.business.name, subject: `Your ${new Date(nowStamp()).getFullYear()} giving summary`,
        body: event.fund.kind === 'charity'
          ? `Thank you! In total you gave ${formatMoney(total)} to ${event.fund.org.name} (tax ID ${event.fund.org.taxId}); ${formatMoney(deductible)} is tax-deductible.`
          : `Thank you! In total you gave ${formatMoney(total)} to ${event.fund.name}.`,
      })
    }
    return withToast(next, `Year-end summaries sent to ${Object.keys(byDonor).length} donors`)
  },

  // ---- Silent auction (DN-3) ----
  'bidder/register': (state, a) => {
    if (state.bidders.some((b) => b.id === a.id) || !a.name?.trim() || !a.phone?.trim() || !a.card?.trim()) return state
    return { ...state, bidders: [...state.bidders, { id: a.id, eventId: a.eventId, name: a.name.trim(), phone: a.phone.trim(), card: a.card.trim(), declined: false }] }
  },
  'bid/place': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (event.auction.closedAt) return withToast(state, 'The auction has closed.', 'warning')
    const item = auctionBoard(state, event.id).find((i) => i.id === a.itemId)
    if (!item || a.amountCents < item.minNextCents) return withToast(state, `The next bid must be at least ${formatMoney(item?.minNextCents ?? 0)}.`, 'warning')
    const at = a.at ?? nowStamp()
    let next = { ...state, bids: [...state.bids, { id: newId('bid'), eventId: event.id, itemId: item.id, bidderId: a.bidderId, amountCents: a.amountCents, at }] }
    const closesAt = softCloseAfterBid(event, item, at)
    if (closesAt !== item.closesAt) {
      next = setPart(next, event.id, 'auction', { items: event.auction.items.map((x) => (x.id === item.id ? { ...x, closesAt } : x)) })
    }
    if (item.highBidder && item.highBidder.id !== a.bidderId) {
      next = withMessage(next, { type: 'sms', to: `${item.highBidder.name} · ${item.highBidder.phone}`, from: state.business.name, subject: 'You’ve been outbid', body: `Someone bid ${formatMoney(a.amountCents)} on “${item.title}”. Bid again?`, link: { label: 'Bid again', to: `/e/${event.id}/auction`, role: 'guest' } })
    }
    return withToast(next, `You’re the high bidder on “${item.title}” at ${formatMoney(a.amountCents)}`)
  },
  // Winners are charged automatically; a declined card gets a payment link
  'auction/close': (state, a) => {
    const event = eventOf(state, a.eventId)
    if (event.auction.closedAt) return state
    let next = state
    const results = {}
    for (const item of auctionBoard(state, event.id).filter((i) => i.high)) {
      const winner = item.highBidder
      if (winner.declined) {
        results[item.id] = { winnerId: winner.id, amountCents: item.high.amountCents, status: 'unpaid' }
        next = withMessage(next, { type: 'sms', to: `${winner.name} · ${winner.phone}`, from: state.business.name, subject: `You won “${item.title}”`, body: `Congratulations! Your card on file was declined, so please pay ${formatMoney(item.high.amountCents)} here.`, link: { label: 'Pay now', to: `/e/${event.id}/auction`, role: 'guest' } })
      } else {
        results[item.id] = { winnerId: winner.id, amountCents: item.high.amountCents, status: 'paid' }
        next = { ...next, donations: [...next.donations, { id: newId('don'), eventId: event.id, key: `auction-${item.id}`, amountCents: item.high.amountCents, feeCents: 0, name: winner.name, email: '', anonymous: false, dedication: '', recurring: null, message: '', messageStatus: null, source: 'auction', fmvCents: item.valueCents, status: 'paid', at: nowStamp(), receiptNo: nextReceipt(next), cardExpired: false }] }
        next = withMessage(next, { type: 'sms', to: `${winner.name} · ${winner.phone}`, from: state.business.name, subject: `You won “${item.title}”`, body: `Congratulations! ${winner.card} was charged ${formatMoney(item.high.amountCents)}. Pick it up at the auction table.` })
      }
    }
    next = setPart(next, event.id, 'auction', { closedAt: nowStamp(), items: event.auction.items.map((x) => (results[x.id] ? { ...x, result: results[x.id] } : x)) })
    return withToast(next, `Auction closed: ${Object.values(results).filter((r) => r.status === 'paid').length} paid, ${Object.values(results).filter((r) => r.status === 'unpaid').length} waiting on payment`)
  },
  // After 24 hours unpaid, the planner may offer the item to the next bidder
  'auction/offerNext': (state, a) => {
    const event = eventOf(state, a.eventId)
    const item = auctionBoard(state, event.id).find((i) => i.id === a.itemId)
    const nextBid = item.bids.find((b) => b.bidderId !== item.result?.winnerId)
    if (!nextBid) return withToast(state, 'No other bidder on this item.', 'warning')
    const bidder = state.bidders.find((b) => b.id === nextBid.bidderId)
    let next = setPart(state, event.id, 'auction', { items: event.auction.items.map((x) => (x.id === item.id ? { ...x, result: { winnerId: bidder.id, amountCents: nextBid.amountCents, status: 'offered' } } : x)) })
    next = withMessage(next, { type: 'sms', to: `${bidder.name} · ${bidder.phone}`, from: state.business.name, subject: `“${item.title}” is yours if you want it`, body: `The winning bidder didn’t pay. Would you like it for your bid of ${formatMoney(nextBid.amountCents)}?`, link: { label: 'Yes, I’ll take it', to: `/e/${event.id}/auction`, role: 'guest' } })
    return withToast(next, `Offered to ${bidder.name}`)
  },

  // ---- Paddle raise (DN-4): the auctioneer calls a level; guests tap it ----
  'paddle/setLevel': (state, a) => setPart(state, a.eventId, 'paddle', { current: a.index }),

  // ---- Sponsors (DN-6): pay now or get an invoice; the logo shows after approval; a task per benefit ----
  'sponsor/checkout': (state, a) => {
    const event = eventOf(state, a.eventId)
    const tier = tierOf(event, a.tierId)
    if (!tier || !a.company?.trim() || !a.email?.trim()) return state
    const sponsor = { id: newId('sp'), eventId: event.id, tierId: tier.id, company: a.company.trim(), contact: a.contact?.trim() ?? '', email: a.email.trim(), logo: a.logo ?? null, pay: a.pay, status: 'pending', paidAt: a.pay === 'card' ? nowStamp() : null, at: nowStamp() }
    const owner = state.team.find((m) => m.role === 'owner')
    const tasks = tier.benefits.map((b) => ({ id: newId('task'), eventId: event.id, title: `Sponsor: ${b} (${sponsor.company})`, due: event.date, assignee: owner.id, done: false, subtasks: [] }))
    let next = { ...state, sponsors: [...state.sponsors, sponsor], tasks: [...state.tasks, ...tasks] }
    next = withMessage(next, a.pay === 'card'
      ? { type: 'email', to: sponsor.email, from: state.business.name, subject: `Thank you for sponsoring ${event.name}`, body: `We received ${formatMoney(tier.priceCents)} for the ${tier.name} sponsorship. Your logo goes up once we've checked it.` }
      : { type: 'email', to: sponsor.email, from: state.business.name, subject: `Invoice: ${tier.name} sponsorship, ${formatMoney(tier.priceCents)}`, body: `Thank you! Here is your invoice for the ${tier.name} sponsorship of ${event.name}. Pay any time before ${formatDay(event.date)}.`, link: { label: 'Pay the invoice', to: `/e/${event.id}/sponsor`, role: 'guest' } })
    return withToast(next, a.pay === 'card' ? `Thank you, ${sponsor.company}!` : `Invoice sent to ${sponsor.email}`)
  },
  'sponsor/approve': (state, a) => withToast({ ...state, sponsors: updateById(state.sponsors, a.id, { status: 'approved' }) }, 'Logo approved for the recognition screen'),
  'sponsor/markPaid': (state, a) => ({ ...state, sponsors: updateById(state.sponsors, a.id, { paidAt: nowStamp() }) }),
}
