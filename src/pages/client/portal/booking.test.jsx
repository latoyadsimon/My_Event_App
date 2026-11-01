// Phase 3 acceptance: Ana accepts → signs → pays the deposit; LaToya countersigns.
import { screen, within, act } from '@testing-library/react'
import { renderApp } from '../../../test/renderApp'
import { initialState } from '../../../store/reducer'

async function payWith(user, number) {
  await user.type(screen.getByLabelText('Card number'), number)
  await user.type(screen.getByLabelText('Expiry'), '08 / 28')
  await user.type(screen.getByLabelText('CVC'), '123')
  await user.click(screen.getByRole('button', { name: 'Pay $4,455.00' }))
  await act(() => vi.advanceTimersByTimeAsync(700))
}

describe('Rivera books in one sitting (CL-2.2 → CL-2.4, PL-3.4)', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('accept → sign → pay → portal unlocks → planner countersigns → Booked', async () => {
    const { user } = renderApp('/portal/proposal', { role: 'client' })

    // Review: locked tabs, live total with an upgrade
    expect(screen.getByRole('heading', { name: 'Your proposal' })).toBeInTheDocument()
    expect(screen.getAllByText(/locked: Unlocks after your deposit/).length).toBeGreaterThan(0)
    expect(screen.getByText('$14,850.00', { exact: false })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Photo magnets/ }))
    expect(screen.getByText('$15,498.00', { exact: false })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Photo magnets/ }))
    await user.click(screen.getByRole('button', { name: 'Accept proposal' }))

    // Sign: consent + typed signature
    expect(screen.getByRole('heading', { name: 'Contract' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Contract' })).toHaveTextContent('Ana Rivera and Marco Rivera')
    await user.click(screen.getByRole('button', { name: 'Sign contract' }))
    expect(screen.getByText(/Please agree to sign electronically/)).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /sign this contract electronically/ }))
    await user.type(screen.getByLabelText('Type your full name'), 'Ana Rivera')
    await user.click(screen.getByRole('button', { name: 'Sign contract' }))
    await user.click(screen.getByRole('link', { name: 'Continue to payment' }))

    // Pay: a declined card first, then a good one
    expect(screen.getByRole('heading', { name: 'Pay your deposit' })).toBeInTheDocument()
    await payWith(user, '4000 0000 0000 0002')
    expect(screen.getByText('Your card was declined. Nothing was charged.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Card number'))
    await user.clear(screen.getByLabelText('Expiry'))
    await user.clear(screen.getByLabelText('CVC'))
    await payWith(user, '4242 4242 4242 4242')
    expect(screen.getByRole('heading', { name: 'Your date is locked!' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Home' }).length).toBeGreaterThan(0)       // unlocked

    // Planner: the Dashboard alert leads to Countersign
    await user.selectOptions(screen.getByRole('combobox', { name: 'Viewing as' }), 'planner')
    const alerts = screen.getByRole('region', { name: /Alerts/ })
    await user.click(within(alerts).getByRole('link', { name: 'Countersign' }))
    expect(screen.getByText('Deposit paid ✓ $4,455.00')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Countersign' }))
    expect(screen.getByText('Booked')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Event Hub →' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'View invoice' }))
    expect(screen.getByRole('heading', { name: 'Invoice #1042' })).toBeInTheDocument()
    expect(screen.getByText('$10,395.00')).toBeInTheDocument()   // balance after the deposit
  })
})

describe('PL-3.4 countersign before the deposit', () => {
  it('explains, in plain words, that the deposit comes first', () => {
    const state = initialState()
    state.contracts.push({ id: 'rivera', leadId: 'rivera', eventId: 'rivera', versionN: 2, chosen: [], totalCents: 1485000, depositCents: 445500, clientSignedAt: '2026-11-05T16:12:00', clientSignature: 'Ana Rivera', plannerSignedAt: null })
    state.events.push({ id: 'rivera', leadId: 'rivera', clientId: 'ana', name: 'Rivera wedding', type: 'wedding', date: '2027-06-12', venue: 'Hacienda Venue', status: 'awaiting_countersign', theme: 'elegant-wedding', portalUnlockedAt: null })
    state.invoices.push({ id: 'rivera', number: 1042, eventId: 'rivera', totalCents: 1485000, refunds: [], failedAttempts: 0, options: {}, installments: [{ id: 'rivera-1', label: 'Deposit 30%', amountCents: 445500, dueDate: '2026-11-05', paidAt: null }] })
    renderApp('/app/contracts/rivera', { state })
    expect(screen.getByText(/Ana hasn't paid the deposit yet. You can countersign once it's paid./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Countersign' })).not.toBeInTheDocument()
  })
})

describe('CL-2.1 / CL-2.2 portal proposal states', () => {
  it('sends a change request', async () => {
    const { user } = renderApp('/portal/proposal', { role: 'client' })
    await user.click(screen.getByRole('button', { name: 'Request changes' }))
    await user.type(screen.getByLabelText('What would you like changed?'), 'Add uplighting please')
    await user.click(screen.getByRole('button', { name: 'Send to Bella Events' }))
    expect(screen.getByText(/You asked: “Add uplighting please”/)).toBeInTheDocument()
  })

  it('an expired link offers a new one, sent only to the email on file', async () => {
    const { user } = renderApp('/portal/proposal?expired=1', { role: 'client' })
    await user.click(screen.getByRole('button', { name: 'Send me a new link' }))
    expect(screen.getByText(/a•••@gmail.com/)).toBeInTheDocument()
  })

  it('locked pages send the client back to the proposal', () => {
    renderApp('/portal/contract', { role: 'client' })
    expect(screen.getByRole('heading', { name: 'Your proposal' })).toBeInTheDocument()
  })

  it('without payments connected, only check/cash instructions show', () => {
    const state = initialState()
    state.business.paymentProvider = null
    state.ui.clientId = 'thompson'
    renderApp('/portal/pay', { role: 'client', state })
    expect(screen.getByRole('heading', { name: 'How to pay' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument()
  })
})

describe('PL-3.5 Invoice', () => {
  it('records a check payment and updates the balance', async () => {
    const { user } = renderApp('/app/invoices/thompson')
    await user.click(screen.getByRole('button', { name: 'Record payment' }))
    await user.selectOptions(screen.getByLabelText('Paid with'), 'Zelle')
    await user.click(screen.getByRole('button', { name: 'Record $1,600.00' }))
    expect(screen.getByText(/Zelle · \$1,600.00/)).toBeInTheDocument()
  })

  it('sends a reminder text', async () => {
    const { user } = renderApp('/app/invoices/thompson')
    await user.click(screen.getByRole('button', { name: 'Send reminder' }))
    expect(screen.getByText('Reminder sent to Denise')).toBeInTheDocument()
  })
})

describe('PL-4.1 Events list', () => {
  it('lists upcoming events and opens one; Past and status filters work', async () => {
    const { user } = renderApp('/app/events')
    const table = screen.getAllByRole('table')[0]
    expect(within(table).getAllByRole('row')).toHaveLength(6)   // header + 5
    await user.click(screen.getByRole('button', { name: 'Past' }))
    expect(within(screen.getAllByRole('table')[0]).getByRole('link', { name: 'Okafor 50th birthday' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'All' }))
    await user.selectOptions(screen.getByLabelText('Status'), 'final_week')
    expect(within(screen.getAllByRole('table')[0]).getAllByRole('row')).toHaveLength(2)
  })
})
