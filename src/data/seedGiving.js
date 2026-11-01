// =====================================================================
// Fundraising (product Phase 4): funds and donations, the silent auction,
// the paddle raise, and sponsors.
// Shapes follow the "Later phases" tables in data_dictionary.md
// (donations, auction_items, bids) plus sponsors.
//   • a fund is either 'charity' (a 501(c)(3): tax-deductible, receipts
//     show the tax ID) or 'gift' (honeymoon, baby: never tax-deductible,
//     no tax wording anywhere, DN-2)
//   • fmvCents = fair market value the donor got back (a dinner ticket,
//     an auction item); only the amount above it is deductible
// The Hope Church potluck (Jan 9) raises money for a new fellowship-hall
// roof; the Garza wedding has a honeymoon fund.
// =====================================================================

/** Off until the planner turns it on (PL-5.6, P4). */
export const defaultFund = () => ({
  enabled: false, kind: 'gift', name: '', story: '', goalCents: 0, suggested: [2500, 5000, 10000], org: { name: '', taxId: '' }, recurring: false, feePercent: 3,
})
export const defaultAuction = () => ({ enabled: false, closesAt: '', softClose: true, closedAt: null, items: [] })
export const defaultPaddle = () => ({ enabled: false, levels: [100000, 50000, 25000, 10000, 5000], current: null })
export const defaultSponsorship = () => ({ enabled: false, tiers: [] })

export const givingDetails = {
  hope: {
    fund: {
      enabled: true, kind: 'charity', name: 'Fellowship hall roof', goalCents: 2500000, suggested: [2500, 5000, 10000, 25000],
      story: 'Our fellowship hall has hosted forty years of potlucks, funerals, weddings and Wednesday suppers. Last spring the roof gave out. Help us fix it so the next forty years stay dry.',
      org: { name: 'Hope Community Church', taxId: '74-2918345' }, recurring: true, feePercent: 3,
    },
    auction: {
      enabled: true, closesAt: '13:30', softClose: true, closedAt: null,
      items: [
        { id: 'ai1', title: 'Hand-stitched star quilt', donor: 'The Quilting Circle', valueCents: 40000, startCents: 15000, incrementCents: 1000, hue: 20 },
        { id: 'ai2', title: 'A pie a month for a year', donor: 'Bea Johnson', valueCents: 30000, startCents: 10000, incrementCents: 500, hue: 35 },
        { id: 'ai3', title: 'Lake weekend at the Hills’ cabin', donor: 'Deacon Ray & Tasha Hill', valueCents: 60000, startCents: 25000, incrementCents: 2500, hue: 200 },
        { id: 'ai4', title: 'Signed Longhorns football', donor: 'Coach Reed', valueCents: 15000, startCents: 5000, incrementCents: 500, hue: 25 },
      ],
    },
    paddle: { enabled: true, levels: [100000, 50000, 25000, 10000, 5000], current: null },
    sponsorship: {
      enabled: true,
      tiers: [
        { id: 'gold', name: 'Cornerstone', priceCents: 250000, limit: 2, benefits: ['Logo on the recognition screen', 'Named table', 'Thank-you from the pulpit'] },
        { id: 'silver', name: 'Rafter', priceCents: 100000, limit: 6, benefits: ['Logo on the recognition screen', 'Name in the program'] },
        { id: 'bronze', name: 'Shingle', priceCents: 25000, limit: 20, benefits: ['Name in the program'] },
      ],
    },
  },
  garza: {
    fund: {
      enabled: true, kind: 'gift', name: 'Honeymoon in Oaxaca', goalCents: 500000, suggested: [5000, 10000, 25000],
      story: 'Instead of gifts, help us explore Oaxaca: a cooking class, mezcal tasting and a few nights by the sea.',
      org: { name: '', taxId: '' }, recurring: false, feePercent: 3,
    },
  },
}

const gift = (id, eventId, amountCents, name, extra = {}) => ({
  id, eventId, amountCents, feeCents: 0, name, email: '', anonymous: false, dedication: '', recurring: null, message: '', messageStatus: null,
  source: 'online', fmvCents: 0, status: 'paid', at: '2026-11-01T12:00:00', receiptNo: id.toUpperCase(), key: id, cardExpired: false, ...extra,
})
export const donations = [
  gift('d-h1', 'hope', 50000, 'Gloria Mendez', { email: 'gloria.m@gmail.com', message: 'For all the Wednesday suppers. Love, Gloria', messageStatus: 'approved', at: '2026-10-28T09:00:00' }),
  gift('d-h2', 'hope', 10000, 'Anonymous', { anonymous: true, email: 'quiet.giver@gmail.com', at: '2026-10-29T19:30:00' }),
  gift('d-h3', 'hope', 2500, 'Ruth Bell', { email: 'ruthbell@att.net', recurring: 'monthly', feeCents: 77, at: '2026-10-01T08:00:00', receiptNo: 'D-H3' }),
  gift('d-h4', 'hope', 25000, 'The Okoye family', { email: 'okoyes@gmail.com', dedication: 'In memory of Grandma Adaeze', message: 'She would have loved this.', messageStatus: 'pending', at: '2026-11-03T20:15:00' }),
  gift('d-h5', 'hope', 5000, 'Mike Tran', { email: 'mtran@gmail.com', recurring: 'monthly', cardExpired: true, at: '2026-09-15T10:00:00' }),
  gift('d-g1', 'garza', 15000, 'Tía Carmen', { email: 'carmen.reyes@gmail.com', message: '¡Disfruten Oaxaca, mis amores!', messageStatus: 'approved', at: '2026-11-04T12:00:00' }),
  // Last month's PTA gala (business reports)
  gift('d-w1', 'westlake', 120000, 'Nakamura family', { email: 'tom.n@gmail.com', source: 'paddle', at: '2026-10-03T20:40:00' }),
  gift('d-w2', 'westlake', 50000, 'Holt family', { email: 'pta@westlakeelem.org', source: 'paddle', at: '2026-10-03T20:41:00' }),
  gift('d-w3', 'westlake', 25000, 'Coach Reed', { email: 'reed@westlakeelem.org', at: '2026-10-03T19:10:00' }),
]

export const bidders = [
  { id: 'bd1', eventId: 'hope', name: 'Deacon Ray Hill', phone: '(512) 555-0431', card: 'Visa ·1881', declined: false },
  { id: 'bd2', eventId: 'hope', name: 'Linda Park', phone: '(512) 555-0441', card: 'Mastercard ·0442', declined: true },   // her card will decline at close (DN-3)
]
export const bids = [
  { id: 'b1', eventId: 'hope', itemId: 'ai1', bidderId: 'bd2', amountCents: 15000, at: '2026-11-02T10:00:00' },
  { id: 'b2', eventId: 'hope', itemId: 'ai1', bidderId: 'bd1', amountCents: 16000, at: '2026-11-03T18:00:00' },
  { id: 'b3', eventId: 'hope', itemId: 'ai2', bidderId: 'bd2', amountCents: 10000, at: '2026-11-03T19:00:00' },
]
export const sponsors = [
  { id: 'sp1', eventId: 'hope', tierId: 'silver', company: 'East Side Hardware', contact: 'Dan Ortega', email: 'dan@eastsidehardware.com', logo: null, pay: 'card', status: 'approved', paidAt: '2026-10-20T10:00:00', at: '2026-10-20T10:00:00' },
  { id: 'sp2', eventId: 'hope', tierId: 'bronze', company: 'Mendez Bakery', contact: 'Gloria Mendez', email: 'orders@mendezbakery.com', logo: null, pay: 'invoice', status: 'pending', paidAt: null, at: '2026-11-04T09:00:00' },
]
