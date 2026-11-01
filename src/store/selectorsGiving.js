// =====================================================================
// Read-only helpers for fundraising (product Phase 4): fund totals,
// correct receipts, the auction board, the paddle raise, sponsors, and
// the recognition screen. Re-exported from selectors.js.
// =====================================================================
import { minutesOf } from './selectorsLogistics'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const sum = (list, f) => list.reduce((t, x) => t + f(x), 0)
const paid = (d) => d.status === 'paid'

/** Raised so far: donations, paddle pledges, auction proceeds and paid sponsorships (PL-7.2, CL-3.8). */
export function fundTotals(state, eventId) {
  const event = eventOf(state, eventId)
  const gifts = state.donations.filter((d) => d.eventId === eventId && paid(d))
  const sponsorCents = sum(state.sponsors.filter((s) => s.eventId === eventId && s.paidAt), (s) => tierOf(event, s.tierId)?.priceCents ?? 0)
  const raisedCents = sum(gifts, (d) => d.amountCents) + sponsorCents
  const goal = event.fund?.goalCents ?? 0
  return {
    raisedCents, sponsorCents, goalCents: goal, percent: goal ? Math.min(100, Math.round((raisedCents / goal) * 100)) : 0,
    donors: new Set(gifts.map((d) => d.email || d.name)).size,
    bySource: Object.fromEntries(['online', 'paddle', 'auction'].map((k) => [k, sum(gifts.filter((d) => d.source === k), (d) => d.amountCents)])),
    recurring: state.donations.filter((d) => d.eventId === eventId && d.recurring && paid(d)),
  }
}

/**
 * A correct receipt (DN-2). Charity funds: organization, tax ID, amount and
 * the deductible part (minus anything the donor got back). Gift funds
 * (honeymoon, baby): "gift, not tax-deductible", with no tax wording.
 */
export function receiptFor(state, donation) {
  const event = eventOf(state, donation.eventId)
  const charity = event.fund?.kind === 'charity'
  const total = donation.amountCents + donation.feeCents
  return {
    number: donation.receiptNo, charity, total,
    org: charity ? event.fund.org.name : null, taxId: charity ? event.fund.org.taxId : null,
    deductibleCents: charity ? Math.max(0, donation.amountCents + donation.feeCents - donation.fmvCents) : 0,
    fmvCents: donation.fmvCents, voided: donation.status === 'refunded',
  }
}

export const tierOf = (event, tierId) => event.sponsorship?.tiers.find((t) => t.id === tierId)

/** Each auction item with its high bid, the next minimum, and when it closes (soft close extends). */
export function auctionBoard(state, eventId) {
  const event = eventOf(state, eventId)
  return (event.auction?.items ?? []).map((item) => {
    const itemBids = state.bids.filter((b) => b.itemId === item.id).sort((a, b) => b.amountCents - a.amountCents)
    const high = itemBids[0] ?? null
    return {
      ...item, bids: itemBids, high, highBidder: high ? state.bidders.find((x) => x.id === high.bidderId) : null,
      minNextCents: high ? high.amountCents + item.incrementCents : item.startCents,
      closesAt: item.closesAt ?? event.auction.closesAt,
    }
  })
}

/** The soft close (DN-3): a bid in the last 2 minutes pushes that item's close 2 minutes later. */
export function softCloseAfterBid(event, item, at) {
  const close = item.closesAt ?? event.auction.closesAt
  if (!event.auction.softClose || !close || at.slice(0, 10) !== event.date) return close
  const now = minutesOf(at.slice(11, 16))
  const end = minutesOf(close)
  return now <= end && end - now < 2 ? `${String(Math.floor((now + 2) / 60)).padStart(2, '0')}:${String((now + 2) % 60).padStart(2, '0')}` : close
}

/** Paddle raise (DN-4): pledges at each level, with names unless anonymous. */
export function paddleBoard(state, eventId) {
  const event = eventOf(state, eventId)
  const pledges = state.donations.filter((d) => d.eventId === eventId && d.source === 'paddle' && paid(d))
  return {
    levels: (event.paddle?.levels ?? []).map((cents, i) => ({ i, cents, pledges: pledges.filter((d) => d.amountCents === cents) })),
    current: event.paddle?.current ?? null,
    totalCents: sum(pledges, (d) => d.amountCents),
  }
}

/** The recognition screen (DN-7): names (not anonymous), approved messages, approved sponsors. */
export function recognition(state, eventId) {
  const event = eventOf(state, eventId)
  const gifts = state.donations.filter((d) => d.eventId === eventId && paid(d)).sort((a, b) => b.at.localeCompare(a.at))
  return {
    names: [...new Set(gifts.filter((d) => !d.anonymous).map((d) => d.name))],
    messages: gifts.filter((d) => d.message && d.messageStatus === 'approved'),
    pending: gifts.filter((d) => d.message && d.messageStatus === 'pending'),
    sponsors: state.sponsors.filter((s) => s.eventId === eventId && s.status === 'approved').map((s) => ({ ...s, tier: tierOf(event, s.tierId) })),
  }
}
