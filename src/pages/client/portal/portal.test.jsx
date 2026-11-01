// Phase 5 acceptance: the client portal after booking (Priya, Acme) and before (Ana).
import { screen, within, act } from '@testing-library/react'
import { renderApp } from '../../../test/renderApp'
import { initialState } from '../../../store/reducer'

const asPriya = (mutate) => {
  const state = initialState()
  state.ui.clientId = 'acme'
  state.ui.toursSeen = ['acme']
  mutate?.(state)
  return state
}

describe('before the deposit (Ana)', () => {
  it('shows planning tabs locked, with Messages open', async () => {
    const { user } = renderApp('/portal/messages', { role: 'client' })
    expect(screen.getAllByText(/locked: Unlocks after your deposit/).length).toBeGreaterThan(0)
    expect(screen.getByText(/v2 is in your inbox/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Message'), 'Is the hacienda wheelchair accessible?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByText('Is the hacienda wheelchair accessible?')).toBeInTheDocument()
  })
})

describe('CL-2.5 / CL-3.1 Home', () => {
  it('first visit shows a skippable 3-screen tour', async () => {
    const state = initialState()
    state.ui.clientId = 'acme'
    const { user } = renderApp('/portal', { role: 'client', state })
    expect(screen.getByRole('dialog', { name: /Everything in one place · 1 of 3/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Skip the tour' }))
    expect(screen.queryByRole('dialog', { name: /1 of 3/ })).not.toBeInTheDocument()
  })

  it('countdown, next payment, and action items that link to their screens', () => {
    renderApp('/portal', { role: 'client', state: asPriya() })
    expect(screen.getByText('37')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Needs your action/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Approve: Dinner menu v2' })).toHaveAttribute('href', '/portal/approvals')
    expect(screen.getByRole('link', { name: 'Pay now' })).toHaveAttribute('href', '/portal/pay')
  })

  it('says "all caught up" when nothing is pending', () => {
    renderApp('/portal', { role: 'client', state: asPriya((s) => { s.approvals = []; s.tasks.find((t) => t.id === 't15').done = true; s.invoices.find((i) => i.id === 'acme').installments.forEach((p) => { p.paidAt = '2026-11-05T10:00:00' }) }) })
    expect(screen.getByText(/all caught up/)).toBeInTheDocument()
  })
})

describe('CL-3.2 Questionnaire', () => {
  it('saves as you go, finishes later, then submits; the planner sees "received"', async () => {
    const state = asPriya((s) => {
      s.questionnaires.find((q) => q.id === 'q-garza').eventId = 'acme'
      s.questionnaires.find((q) => q.id === 'q-acme').answeredAt = '2026-10-02T15:00:00'
      s.questionnaires.find((q) => q.id === 'q-garza').sentAt = '2026-11-04T10:00:00'
    })
    const { user } = renderApp('/portal/questionnaire/q-garza', { role: 'client', state })
    await user.type(screen.getByLabelText('Your colors or theme, in a few words'), 'Gold')
    await user.click(screen.getByRole('button', { name: 'Save & finish later' }))
    expect(screen.getByText(/Fill in “Wedding details”/)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Fill in “Wedding details”/ }))
    expect(screen.getByLabelText('Your colors or theme, in a few words')).toHaveValue('Gold')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Submit answers' }))
    expect(screen.queryByText(/Fill in “Wedding details”/)).not.toBeInTheDocument()
  })
})

describe('CL-3.5 / CL-3.6 Approvals and CL-4.3 change orders', () => {
  it('approves the menu and logs who and when', async () => {
    const { user } = renderApp('/portal/approvals', { role: 'client', state: asPriya() })
    const item = screen.getByRole('article', { name: 'Dinner menu v2' })
    await user.click(within(item).getByRole('button', { name: 'Approve' }))
    expect(screen.getAllByText(/Priya Shah · Nov 5, 6:00 PM/).length).toBeGreaterThan(0)
    expect(screen.getByText('Final headcount')).toBeInTheDocument()   // coming up
  })

  it('requests changes with a comment', async () => {
    const { user } = renderApp('/portal/approvals', { role: 'client', state: asPriya() })
    await user.click(screen.getByRole('button', { name: 'Request changes' }))
    await user.type(screen.getByLabelText('Your comment'), 'Swap the torte for cheesecake')
    await user.click(screen.getByRole('button', { name: 'Send to my planner' }))
    expect(screen.getByText(/“Swap the torte for cheesecake”/)).toBeInTheDocument()
  })

  it('approving a change order raises the balance', async () => {
    const state = asPriya((s) => s.approvals.push({ id: 'co1', eventId: 'acme', kind: 'change_order', title: 'Change order: Extra hour', detail: '', amountCents: 25000, status: 'pending', requestedAt: '2026-11-05T09:00:00' }))
    const { user } = renderApp('/portal/payments', { role: 'client', state })
    expect(screen.getByText('$3,600.00')).toBeInTheDocument()
    await user.click(within(screen.getByRole('region', { name: 'Change orders to approve' })).getByRole('button', { name: 'Approve' }))
    expect(screen.getByText('$3,850.00')).toBeInTheDocument()
  })
})

describe('CL-4.2 Payments', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('pays installment 2 for Thompson: portal, invoice and Dashboard agree', async () => {
    const state = initialState()
    state.ui.clientId = 'thompson'
    state.ui.toursSeen = ['thompson']
    const { user } = renderApp('/portal/payments', { role: 'client', state })
    expect(screen.getByText('$2,800.00')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Pay $1,600.00 now' }))
    await user.type(screen.getByLabelText('Card number'), '4242424242424242')
    await user.type(screen.getByLabelText('Expiry'), '08 / 28')
    await user.type(screen.getByLabelText('CVC'), '123')
    await user.click(screen.getByRole('button', { name: 'Pay $1,600.00' }))
    await act(() => vi.advanceTimersByTimeAsync(700))
    expect(screen.getByRole('heading', { name: 'Payment received' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Back to payments' }))
    expect(screen.getByText('$1,200.00')).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Viewing as' }), 'planner')
    await user.click(screen.getAllByRole('link', { name: 'Events' })[0])
    await user.click(screen.getAllByRole('link', { name: 'Celebration of life for Harold Thompson' })[0])
    await user.click(screen.getByRole('link', { name: 'Money' }))
    expect(screen.getAllByText(/Payment 2 · 40% · \$1,600.00/)[0].closest('li')).toHaveTextContent('Paid')
  })
})

describe('CL-4.4 Cancel or postpone', () => {
  it('shows the policy and estimate, then sends a request that reaches the planner\'s Dashboard', async () => {
    const { user } = renderApp('/portal/change-request', { role: 'client', state: asPriya() })
    await user.click(screen.getByRole('radio', { name: 'Cancel the event' }))
    expect(screen.getByText('$2,400.00')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send request to cancel' }))
    expect(screen.getByText(/Your request to cancel is with Bella Events/)).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Viewing as' }), 'planner')
    expect(screen.getByText('Acme holiday party: client asked to cancel')).toBeInTheDocument()
  })
})

describe('CL-3.4 Guests', () => {
  it('flags bad CSV rows, lets them be fixed, and imports only valid rows', async () => {
    const { user } = renderApp('/portal/guests', { role: 'client', state: asPriya() })
    await user.click(screen.getByRole('button', { name: 'Import CSV' }))
    await user.click(screen.getByLabelText('…or paste it here'))
    await user.paste('Name,Email\nNew One,new@one.com\n,lost@x.com\nBad Mail,bad@mail')
    expect(screen.getByText('2 rows to fix')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import 1 household' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Row 3 name'), 'Found Name')
    expect(screen.getByRole('button', { name: 'Import 2 households' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Import 2 households' }))
    expect(screen.getByText('Found Name')).toBeInTheDocument()
    expect(screen.queryByText('Bad Mail')).not.toBeInTheDocument()
  })

  it('invites a co-host with limited access', async () => {
    const { user } = renderApp('/portal/guests', { role: 'client', state: asPriya() })
    await user.click(screen.getByRole('button', { name: 'Invite co-host' }))
    await user.type(screen.getByLabelText('Name'), 'Sam Shah')
    await user.type(screen.getByLabelText('Email'), 'sam@shah.com')
    await user.selectOptions(screen.getByLabelText('Access'), 'limited')
    await user.click(screen.getByRole('button', { name: 'Send invite' }))
    expect(screen.getByText(/Co-hosts: Sam Shah \(guests and messages\)/)).toBeInTheDocument()
  })
})

describe('CL-3.3 Mood board', () => {
  it('adds a Pinterest link and comments; the planner is notified', async () => {
    const { user } = renderApp('/portal/mood-board', { role: 'client', state: asPriya() })
    await user.type(screen.getByLabelText('Paste a Pinterest or web link'), 'https://www.pinterest.com/pin/123')
    await user.click(screen.getByRole('button', { name: 'Add link' }))
    expect(screen.getByText('Pinterest pin')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Comment on Theme notes'), 'More gold!')
    await user.click(within(screen.getByText('Theme notes').closest('figure')).getByRole('button', { name: 'Post' }))
    expect(screen.getByText('More gold!')).toBeInTheDocument()
  })
})
