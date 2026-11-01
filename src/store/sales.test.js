// Phase 2: inquiries become leads, follow-up, consults and proposals.
import { reducer, initialState } from './reducer'
import { dateTakenBy, nearbyOpenDates, openSlots, firstOpenDay, getLeadBoard, getProposal, getCatalog } from './selectors'
import { priceVersion, latestSent, draftOf } from '../lib/proposal'

const run = (state, ...actions) => actions.reduce(reducer, state)
const inquiry = {
  type: 'lead/create', name: 'Maria Lopez', email: 'maria@lopez.com', phone: '(512) 555-0100',
  eventType: 'birthday', eventDate: '2027-04-10', guestCount: '50', budget: '$4–8k',
  services: ['Photo booth'], source: 'Instagram', notes: 'Her 30th!',
}

describe('PL-2.1 an inquiry becomes a lead', () => {
  it('creates a client and a New lead with the inquiry details', () => {
    const s = run(initialState(), inquiry)
    const lead = s.leads.at(-1)
    expect(lead).toMatchObject({ title: 'Lopez birthday', stage: 'new', eventDate: '2027-04-10', guestCount: 50, budget: '$4–8k', source: 'Instagram', services: ['Photo booth'] })
    expect(s.clients.find((c) => c.id === lead.clientId)).toMatchObject({ name: 'Maria Lopez', email: 'maria@lopez.com' })
  })

  it('pushes to the planner and auto-replies to the client with a booking link', () => {
    const s = run(initialState(), inquiry)
    const lead = s.leads.at(-1)
    expect(s.outbox[0]).toMatchObject({ type: 'push', subject: 'New lead: Maria Lopez' })
    expect(s.outbox[0].link.to).toBe(`/app/leads/${lead.id}`)
    expect(s.outbox[1]).toMatchObject({ type: 'email', to: 'maria@lopez.com' })
    expect(s.outbox[1].link).toMatchObject({ label: 'Pick a consult time', to: `/b/bella-events/book?lead=${lead.id}`, role: 'client' })
    expect(lead.activity.map((x) => x.text)).toEqual(['Inquiry received from website', 'Auto-reply sent with booking link'])
  })

  it('checks the requested date against the calendar', () => {
    const s = run(initialState(), { ...inquiry, eventDate: '2026-12-12' })   // Acme has Dec 12
    expect(s.outbox[0].subject).toMatch(/date taken/)
    expect(s.leads.at(-1).activity[1].text).toBe('Requested date is already booked (Acme holiday party)')
  })

  it('reuses the client when the same email inquires again', () => {
    const before = initialState()
    const s = run(before, { ...inquiry, email: 'ANA.RIVERA@gmail.com', name: 'Ana Rivera' })
    expect(s.clients).toHaveLength(before.clients.length)
    expect(s.leads.at(-1).clientId).toBe('ana')
  })

  it('a lead the planner adds by hand sends no auto-reply', () => {
    const before = initialState()
    const s = run(before, { ...inquiry, manual: true })
    expect(s.outbox).toHaveLength(before.outbox.length)
    expect(s.leads.at(-1).activity[0].text).toBe('Lead added by you')
  })
})

describe('PL-2.2 leads board', () => {
  it('groups leads by stage and filters by source', () => {
    const board = getLeadBoard(initialState())
    expect(board.new.map((l) => l.id)).toEqual(['nguyen', 'kim'])
    expect(board.proposal_sent.map((l) => l.id)).toEqual(['rivera'])
    expect(getLeadBoard(initialState(), 'Referral').new.map((l) => l.id)).toEqual(['kim'])
  })

  it('flags a date already booked (Kim wants Acme\'s Dec 12)', () => {
    expect(dateTakenBy(initialState(), '2026-12-12', 'kim').name).toBe('Acme holiday party')
    expect(dateTakenBy(initialState(), '2027-06-12', 'rivera')).toBeNull()
  })

  it('moves a lead and logs it', () => {
    const s = run(initialState(), { type: 'lead/move', leadId: 'kim', stage: 'contacted' })
    const kim = s.leads.find((l) => l.id === 'kim')
    expect(kim.stage).toBe('contacted')
    expect(kim.activity.at(-1).text).toBe('Moved to Contacted')
  })
})

describe('PL-2.3 respond to a lead', () => {
  it('sends an edited reply and moves New → Contacted', () => {
    const s = run(initialState(), { type: 'lead/reply', leadId: 'nguyen', text: 'Hi Linh! Yes, we are free.' })
    expect(s.outbox[0]).toMatchObject({ type: 'email', to: 'linh.nguyen@yahoo.com', body: 'Hi Linh! Yes, we are free.' })
    expect(s.leads.find((l) => l.id === 'nguyen').stage).toBe('contacted')
  })

  it('never moves a lead backwards when replying', () => {
    const s = run(initialState(), { type: 'lead/reply', leadId: 'rivera', text: 'Hi' })
    expect(s.leads.find((l) => l.id === 'rivera').stage).toBe('proposal_sent')
  })

  it('holds the date for 7 days and can release it', () => {
    let s = run(initialState(), { type: 'lead/holdDate', leadId: 'nguyen' })
    expect(s.leads.find((l) => l.id === 'nguyen').hold.until).toBe('2026-11-12')
    s = run(s, { type: 'lead/releaseHold', leadId: 'nguyen' })
    expect(s.leads.find((l) => l.id === 'nguyen').hold).toBeNull()
  })

  it('suggests nearby open dates on the same weekday', () => {
    expect(nearbyOpenDates(initialState(), '2027-06-12')).toEqual(['2027-06-05', '2027-06-19', '2027-06-26'])
    expect(nearbyOpenDates(initialState(), '2026-12-12')).toEqual(['2026-12-05', '2026-12-19', '2026-12-26'])
  })

  it('emails the booking link', () => {
    const s = run(initialState(), { type: 'lead/sendBookingLink', leadId: 'kim' })
    expect(s.outbox[0].link.to).toBe('/b/bella-events/book?lead=kim')
  })

  it('marks a lead lost with a reason', () => {
    const s = run(initialState(), { type: 'lead/markLost', leadId: 'lee', reason: 'Went with a venue planner' })
    expect(s.leads.find((l) => l.id === 'lee')).toMatchObject({ stage: 'lost', lostReason: 'Went with a venue planner' })
  })
})

describe('CL-1.2 / PL-2.4 consult booking', () => {
  it('offers weekday times only, after now, skipping busy times plus a buffer', () => {
    const s = initialState()
    expect(openSlots(s, '2026-11-05')).toEqual([])                       // today: all times have passed
    expect(openSlots(s, '2026-11-07')).toEqual([])                       // Saturday
    // Fri Nov 6 has a 10:00 site visit (10–11, +15 min buffer) → 10:00 is blocked, 11:30 is open
    expect(openSlots(s, '2026-11-06')).toEqual(['2026-11-06T11:30:00', '2026-11-06T14:00:00', '2026-11-06T16:30:00'])
    // Mon Nov 9 has a 1 PM call (1–2 PM): 2:00 sits inside its 15-minute buffer
    expect(openSlots(s, '2026-11-09')).toEqual(['2026-11-09T10:00:00', '2026-11-09T11:30:00', '2026-11-09T16:30:00'])
    expect(firstOpenDay(s)).toBe('2026-11-06')
  })

  it('books a consult: calendar, lead stage, emails both people', () => {
    const s = run(initialState(), { type: 'consult/book', leadId: 'nguyen', name: 'Linh Nguyen', email: 'linh.nguyen@yahoo.com', at: '2026-11-10T10:00:00' })
    expect(s.appointments.at(-1)).toMatchObject({ title: 'Consult', at: '2026-11-10T10:00:00', leadId: 'nguyen' })
    expect(s.leads.find((l) => l.id === 'nguyen')).toMatchObject({ stage: 'consult_booked', consultAt: '2026-11-10T10:00:00' })
    expect(s.outbox[0]).toMatchObject({ type: 'push', subject: 'Consult booked: Linh Nguyen' })
    expect(s.outbox[1]).toMatchObject({ type: 'email', to: 'linh.nguyen@yahoo.com', subject: "You're booked: Tue, Nov 10, 10:00 AM" })
    expect(openSlots(s, '2026-11-10')).not.toContain('2026-11-10T10:00:00')
  })

  it('finds the lead by email, or starts one', () => {
    let s = run(initialState(), { type: 'consult/book', name: 'Daniel Kim', email: 'dkim@gmail.com', at: '2026-11-10T10:00:00' })
    expect(s.leads.find((l) => l.id === 'kim').stage).toBe('consult_booked')
    const count = s.leads.length
    s = run(s, { type: 'consult/book', name: 'New Person', email: 'new@person.com', at: '2026-11-11T10:00:00' })
    expect(s.leads).toHaveLength(count + 1)
    expect(s.leads.at(-1)).toMatchObject({ source: 'Booking page', stage: 'consult_booked' })
  })

  it('stops at the daily limit of 3 consults', () => {
    const s = run(initialState(), ...['10:00', '11:30', '14:00'].map((t, i) => ({ type: 'consult/book', name: `P${i}`, email: `p${i}@x.com`, at: `2026-11-12T${t}:00` })))
    expect(openSlots(s, '2026-11-12')).toEqual([])
  })
})

describe('PL-3.1 / PL-3.2 proposals', () => {
  const v = { packageId: 'silver', discountCents: 0, lines: [{ addonId: 'karaoke', qty: 1 }] }

  it('saves one draft, then sends it as v1 with a magic-link email', () => {
    let s = run(initialState(), { type: 'proposal/saveDraft', leadId: 'kim', version: v })
    expect(draftOf(getProposal(s, 'kim')).n).toBe(1)
    s = run(s, { type: 'proposal/send', leadId: 'kim' })
    const p = getProposal(s, 'kim')
    expect(latestSent(p).n).toBe(1)
    expect(s.leads.find((l) => l.id === 'kim').stage).toBe('proposal_sent')
    expect(s.outbox[0]).toMatchObject({ type: 'email', to: 'dkim@gmail.com', subject: 'Your proposal (v1) is ready' })
    expect(s.outbox[0].link).toMatchObject({ to: '/portal/proposal', role: 'client', clientId: 'kim' })
  })

  it('keeps old versions: changing Rivera after v2 makes v3', () => {
    const s = run(initialState(), { type: 'proposal/send', leadId: 'rivera', version: { ...v, packageId: 'platinum' } })
    const p = getProposal(s, 'rivera')
    expect(p.versions.map((x) => x.n)).toEqual([1, 2, 3])
    expect(p.versions[1].packageId).toBe('gold')
    expect(latestSent(p).packageId).toBe('platinum')
  })

  it('refuses to send without a package', () => {
    const before = initialState()
    const s = run(before, { type: 'proposal/send', leadId: 'kim', version: { ...v, packageId: null } })
    expect(s.outbox).toHaveLength(before.outbox.length)
  })

  it('Rivera v2 still totals $14,850', () => {
    const s = initialState()
    expect(priceVersion(latestSent(getProposal(s, 'rivera')), getCatalog(s)).totalCents).toBe(1485000)
  })
})

describe('demo: opening a message as a client', () => {
  it('remembers which client the portal shows', () => {
    const s = run(initialState(), { type: 'ui/setRole', role: 'client', clientId: 'kim' })
    expect(s.ui).toMatchObject({ role: 'client', clientId: 'kim' })
  })
})
