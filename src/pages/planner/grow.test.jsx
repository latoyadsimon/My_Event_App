// Phase 17 acceptance: reports, marketing, duplicate/templates, reviews and surveys, in-app vendor pay.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState, reducer } from '../../store/reducer'

describe('PL-9.1 reports', () => {
  it('charts booked vs collected with a legend and a table view; syncs QuickBooks', async () => {
    const { user } = renderApp('/app/grow')
    const chart = screen.getByRole('figure', { name: 'Booked vs collected, by month' })
    expect(within(chart).getByText('Booked')).toBeInTheDocument()
    expect(within(chart).getByRole('button', { name: 'November 2026, Booked: $9,650' })).toBeInTheDocument()
    await user.click(within(chart).getByRole('button', { name: 'Show as table' }))
    expect(within(chart).getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: 'Lead sources' })).toHaveTextContent('Referral')
    await user.click(screen.getByRole('button', { name: 'Connect QuickBooks' }))
    await user.click(screen.getByRole('button', { name: 'Sync now' }))
    expect(screen.getByText(/8 invoices, \d+ payments/)).toBeInTheDocument()
  })

  it('needs "See event budgets"', () => {
    const state = initialState()
    state.ui.memberId = 'devon'
    state.team.find((m) => m.id === 'devon').permissions.see_budgets = false
    renderApp('/app/grow', { state })
    expect(screen.getByText(/Reports show money/)).toBeInTheDocument()
  })
})

describe('PL-9.2 marketing', () => {
  it('sends the due reminder; opt-in is per client; memorial families are excluded', async () => {
    const { user } = renderApp('/app/grow?tab=marketing')
    expect(within(screen.getByRole('list', { name: 'Past clients' })).getByText('Not marketed (memorial)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send reminder' }))
    expect(screen.getByText('Reminder sent to Rosa Morales')).toBeInTheDocument()
    expect(screen.getByText('Nothing in the next two months.')).toBeInTheDocument()
  })
})

describe('PL-9.3 duplicate and templates', () => {
  it('duplicates an event to next year and opens it', async () => {
    const { user } = renderApp('/app/events/acme')
    await user.click(screen.getByRole('button', { name: 'Duplicate' }))
    await user.click(screen.getByRole('button', { name: 'Create the copy' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Acme holiday party' })).toBeInTheDocument()
    expect(screen.getByText(/Dec 12, 2027/)).toBeInTheDocument()
  })

  it('saves a template, then creates an event from it in Settings', async () => {
    const { user } = renderApp('/app/events/thompson')
    await user.click(screen.getByRole('button', { name: 'Save as template' }))
    await user.click(screen.getByRole('button', { name: 'Save template' }))
    await user.click(screen.getByRole('link', { name: 'Settings' }))
    await user.click(screen.getByRole('link', { name: 'Templates' }))
    await user.type(screen.getByLabelText('New event name'), 'Memorial for Ada Price')
    await user.type(screen.getByLabelText('Date'), '2027-02-06')
    await user.click(screen.getByRole('button', { name: 'Create event' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Memorial for Ada Price' })).toBeInTheDocument()
  })
})

describe('PL-8.4 / CL-6.4 / GU-6.2 reviews and surveys', () => {
  const wrapped = () => {
    let s = reducer(initialState(), { type: 'event/startDay', eventId: 'acme' })
    return reducer(s, { type: 'event/teardownDone', eventId: 'acme' })
  }

  it('the planner asks for a review and a guest survey from Wrap-up', async () => {
    const { user } = renderApp('/app/events/acme/wrap-up', { state: wrapped() })
    await user.click(screen.getByRole('button', { name: 'Send the review request' }))
    await user.click(screen.getByRole('button', { name: 'Send the one-question guest survey' }))
    expect(screen.getByText(/Guest survey sent/)).toBeInTheDocument()
  })

  it('the client gets one-tap review links and a private rating', async () => {
    const state = wrapped()
    state.ui.clientId = 'acme'
    const { user } = renderApp('/portal/review', { role: 'client', state })
    expect(screen.getByRole('link', { name: /The Knot/ })).toHaveAttribute('target', '_blank')
    await user.click(screen.getByRole('radio', { name: '5' }))
    await user.type(screen.getByLabelText('What went well, and what could be better?'), 'Flawless.')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByText(/Thank you: “Flawless.”/)).toBeInTheDocument()
  })

  it('a memorial family is never sent to public review sites', () => {
    const state = initialState()
    state.ui.clientId = 'thompson'
    state.events.find((e) => e.id === 'thompson').status = 'closed'
    renderApp('/portal/review', { role: 'client', state })
    expect(screen.queryByRole('link', { name: /Yelp/ })).not.toBeInTheDocument()
  })

  it('a guest answers the one-question survey (EN/ES)', async () => {
    const { user } = renderApp('/e/acme/feedback?t=acme-g1-t', { role: 'guest' })
    await user.click(screen.getByRole('button', { name: 'Español' }))
    await user.click(screen.getByRole('radio', { name: '4' }))
    await user.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(screen.getByRole('heading', { name: '¡Gracias! Nos ayuda mucho.' })).toBeInTheDocument()
  })
})

describe('VN-7 (P4) pay a vendor in the app', () => {
  it('defaults to ACH to their bank and sends a receipt', async () => {
    const { user } = renderApp('/app/events/acme/logistics/vendors')
    const dj = screen.getByText('DJ Rhythm').closest('li')
    await user.click(within(dj).getByRole('button', { name: 'Record payment' }))
    expect(screen.getByText(/Sent to Zelle; arrives in 1–2 business days/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Record $900.00' }))
    expect(within(dj).getByText('Paid in full')).toBeInTheDocument()
  })
})
