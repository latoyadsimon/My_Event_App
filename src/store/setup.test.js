// Phase 1: sign up, onboarding, settings and the Dashboard's numbers.
import { reducer, initialState } from './reducer'
import { getDashboard, getChecklist, nextOnboardingStep } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)

describe('sign up', () => {
  const signUp = { type: 'account/signUp', ownerName: 'Maya Brooks', businessName: 'Maya Makes Parties', email: 'maya@mmp.com' }

  it('starts a brand-new business with me as the only (owner) member', () => {
    const s = run(initialState(), signUp)
    expect(s.business.name).toBe('Maya Makes Parties')
    expect(s.business.slug).toBe('maya-makes-parties')
    expect(s.business.initials).toBe('MM')
    expect(s.team).toEqual([expect.objectContaining({ name: 'Maya Brooks', role: 'owner', status: 'active', twoFactor: null })])
    expect(s.leads).toEqual([])
    expect(s.events).toEqual([])
    expect(s.ui.role).toBe('planner')
  })

  it('sends a welcome email', () => {
    const s = run(initialState(), signUp)
    expect(s.outbox[0]).toMatchObject({ type: 'email', to: 'maya@mmp.com', subject: 'Welcome to Crowned' })
  })

  it('keeps the person\'s Calm/Bold choice', () => {
    const s = run(initialState(), { type: 'ui/setMode', mode: 'bold' }, signUp)
    expect(s.ui.mode).toBe('bold')
  })

  it('records the owner\'s passkey or 2FA', () => {
    const s = run(initialState(), signUp, { type: 'account/secure', method: 'passkey' })
    expect(s.team[0].twoFactor).toBe('passkey')
  })
})

describe('onboarding', () => {
  it('marks steps done and knows which step comes next', () => {
    let s = run(initialState(), { type: 'account/signUp', ownerName: 'A', businessName: 'B', email: 'a@b.co' })
    expect(nextOnboardingStep(s)).toBe('business')
    s = run(s, { type: 'onboarding/complete', step: 'business' }, { type: 'onboarding/complete', step: 'payments' })
    expect(nextOnboardingStep(s)).toBe('packages')
  })

  it('returns null when every step is done', () => {
    let s = initialState()
    s = run(s, { type: 'onboarding/complete', step: 'calendar' })
    expect(nextOnboardingStep(s)).toBeNull()
  })
})

describe('business settings', () => {
  it('updates business details', () => {
    const s = run(initialState(), { type: 'business/update', changes: { name: 'Bella Events & Co.', phone: '(512) 555-0000' } })
    expect(s.business).toMatchObject({ name: 'Bella Events & Co.', phone: '(512) 555-0000' })
  })

  it('connects and disconnects payments', () => {
    let s = run(initialState(), { type: 'payments/disconnect' })
    expect(s.business.paymentProvider).toBeNull()
    s = run(s, { type: 'payments/connect', provider: 'square' })
    expect(s.business.paymentProvider).toBe('square')
    expect(s.business.onboarding.payments).toBe(true)
  })

  it('connects a calendar', () => {
    const s = run(initialState(), { type: 'calendar/connect', provider: 'google' })
    expect(s.business.calendarProvider).toBe('google')
    expect(s.business.onboarding.calendar).toBe(true)
  })
})

describe('packages and add-ons', () => {
  it('adds a package with a new id, then edits it', () => {
    let s = run(initialState(), { type: 'package/save', item: { name: 'Bronze', priceCents: 500000, description: 'Day-of only' } })
    const added = s.packages.at(-1)
    expect(added).toMatchObject({ name: 'Bronze', priceCents: 500000, archived: false })
    expect(added.id).toBeTruthy()
    s = run(s, { type: 'package/save', item: { ...added, priceCents: 550000 } })
    expect(s.packages.find((p) => p.id === added.id).priceCents).toBe(550000)
    expect(s.packages).toHaveLength(4)
  })

  it('archives and restores (never deletes: old proposals still point at it)', () => {
    let s = run(initialState(), { type: 'package/archive', id: 'silver' })
    expect(s.packages.find((p) => p.id === 'silver').archived).toBe(true)
    s = run(s, { type: 'package/restore', id: 'silver' })
    expect(s.packages.find((p) => p.id === 'silver').archived).toBe(false)
  })

  it('works the same for add-ons', () => {
    let s = run(initialState(), { type: 'addon/save', item: { name: 'Uplighting', priceCents: 40000, unit: 'each', owned: 12 } })
    expect(s.addons.at(-1)).toMatchObject({ name: 'Uplighting', owned: 12 })
    s = run(s, { type: 'addon/archive', id: 'chairs' })
    expect(s.addons.find((a) => a.id === 'chairs').archived).toBe(true)
  })
})

describe('team and permissions', () => {
  it('invites a person and texts them a join link', () => {
    const s = run(initialState(), { type: 'team/invite', name: 'Jo Kim', contact: '(512) 555-0199', role: 'staff', jobTitle: 'KJ' })
    const jo = s.team.at(-1)
    expect(jo).toMatchObject({ name: 'Jo Kim', role: 'staff', jobTitle: 'KJ', status: 'invited', phone: '(512) 555-0199' })
    expect(jo.permissions).toEqual({ see_budgets: false, see_profit: false, take_payments: false, edit_vendors: false })
    expect(s.outbox[0]).toMatchObject({ type: 'sms', to: '(512) 555-0199' })
    expect(s.outbox[0].link.to).toBe(`/join/${jo.inviteToken}`)
  })

  it('emails the invite when the contact is an email address', () => {
    const s = run(initialState(), { type: 'team/invite', name: 'Ari', contact: 'ari@gmail.com', role: 'coordinator', jobTitle: 'Coordinator' })
    expect(s.outbox[0]).toMatchObject({ type: 'email', to: 'ari@gmail.com' })
    expect(s.team.at(-1).permissions.see_budgets).toBe(true) // coordinators start with budgets on
  })

  it('turns one person\'s permission on or off', () => {
    const s = run(initialState(), { type: 'team/setPermission', memberId: 'sam', permission: 'take_payments', value: true })
    expect(s.team.find((m) => m.id === 'sam').permissions.take_payments).toBe(true)
  })

  it('never lets anyone but the owner see profit', () => {
    const s = run(initialState(), { type: 'team/setPermission', memberId: 'devon', permission: 'see_profit', value: true })
    expect(s.team.find((m) => m.id === 'devon').permissions.see_profit).toBe(false)
  })

  it('deactivates and reactivates a person, keeping their history', () => {
    let s = run(initialState(), { type: 'team/deactivate', memberId: 'sam' })
    expect(s.team.find((m) => m.id === 'sam')).toMatchObject({ status: 'deactivated', deactivatedAt: '2026-11-05T18:00:00' })
    expect(s.team).toHaveLength(3)
    s = run(s, { type: 'team/reactivate', memberId: 'sam' })
    expect(s.team.find((m) => m.id === 'sam').status).toBe('active')
  })

  it('never deactivates the owner (a business always keeps one)', () => {
    const s = run(initialState(), { type: 'team/deactivate', memberId: 'latoya' })
    expect(s.team.find((m) => m.id === 'latoya').status).toBe('active')
  })
})

describe('templates and the inquiry form', () => {
  it('saves message templates', () => {
    const s = run(initialState(), { type: 'templates/update', path: ['messages', 'autoReply'], value: 'Hi! Thanks.' })
    expect(s.business.templates.messages.autoReply).toBe('Hi! Thanks.')
    expect(s.business.templates.messages.paymentReminder).toMatch(/friendly reminder/)
  })

  it('remembers the inquiry form was shared', () => {
    const s = run(initialState(), { type: 'business/inquiryFormShared' })
    expect(s.business.inquiryFormShared).toBe(true)
  })
})

describe('Dashboard numbers (Thu Nov 5, 2026)', () => {
  const d = getDashboard(initialState())

  it('adds up money from the invoices', () => {
    expect(d.kpis.bookedThisMonthCents).toBe(965000)     // Garza, countersigned Nov 2
    expect(d.kpis.collectedThisMonthCents).toBe(769500)  // Acme payment 2 ($4,800) + Garza deposit ($2,895)
    expect(d.kpis.balanceDueCents).toBe(1840500)         // every unpaid installment on open events
  })

  it('counts open and late tasks', () => {
    expect(d.kpis.openTasks).toBe(15)   // includes Priya's "Approve the dinner menu"
    expect(d.kpis.lateTasks).toBe(1)
  })

  it('lists this week\'s appointments in time order', () => {
    expect(d.week.map((a) => a.title)).toEqual(['Site visit', 'Tasting', 'Gear pickup', 'Call'])
  })

  it('counts the pipeline', () => {
    expect(d.pipeline).toEqual({ inquiries: 3, proposalsSent: 1, booked: 5, completed: 3 })
  })

  it('raises alerts that link to the screen that fixes them', () => {
    const texts = d.alerts.map((a) => a.text)
    expect(texts).toContain('New lead: Linh Nguyen · baby shower')
    expect(texts).toContain('Celebration of life for Harold Thompson: $1,600.00 due Fri, Nov 6')
    expect(texts).toContain('Acme holiday party: 1 late task')
    for (const a of d.alerts) expect(a.to).toMatch(/^\/app\//)
  })

  it('asks the planner to countersign once the client has signed and paid the deposit', () => {
    const s = initialState()
    s.contracts.push({ id: 'rivera', leadId: 'rivera', eventId: 'rivera', clientSignedAt: '2026-11-05T16:12:00', plannerSignedAt: null })
    s.events.push({ id: 'rivera', leadId: 'rivera', clientId: 'ana', name: 'Rivera wedding', type: 'wedding', date: '2027-06-12', status: 'awaiting_countersign' })
    s.invoices.push({ id: 'rivera', eventId: 'rivera', totalCents: 1485000, installments: [{ id: 'r1', amountCents: 445500, dueDate: '2026-11-05', paidAt: '2026-11-05T16:14:00' }] })
    const alert = getDashboard(s).alerts[0]
    expect(alert).toMatchObject({ text: 'Rivera wedding: signed and paid the deposit', action: 'Countersign', to: '/app/contracts/rivera' })
  })
})

describe('getting-started checklist', () => {
  it('shows what Bella Events still has to do', () => {
    const c = getChecklist(initialState())
    expect(c.items.map((i) => [i.id, i.done])).toEqual([['packages', true], ['payments', true], ['calendar', false], ['inquiry', false]])
    expect(c.allDone).toBe(false)
  })

  it('is done when every item is', () => {
    const s = run(initialState(), { type: 'calendar/connect', provider: 'google' }, { type: 'business/inquiryFormShared' })
    expect(getChecklist(s).allDone).toBe(true)
  })
})
