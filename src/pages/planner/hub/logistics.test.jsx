// Phase 8 acceptance: Logistics tab (run of show, vendors, gear), Budget, Final week, Settings.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../../test/renderApp'
import { initialState } from '../../../store/reducer'

describe('PL-4.11 Run of show', () => {
  it('lists Acme in time order and previews what a vendor sees', async () => {
    const { user } = renderApp('/app/events/acme/logistics')
    const list = screen.getByRole('list', { name: 'Run of show' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(11)
    await user.click(screen.getByRole('button', { name: 'Hill Country Catering' }))
    expect(within(screen.getByRole('list', { name: 'Run of show' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringContaining('Catering sets the buffet'), expect.stringContaining('Dinner service'),
    ])
  })

  it('adds an item, and removes one with Undo', async () => {
    const { user } = renderApp('/app/events/acme/logistics')
    await user.type(screen.getByLabelText('Time'), '22:00')
    await user.type(screen.getByLabelText('What happens'), 'Cake cutting')
    await user.click(screen.getByRole('button', { name: 'Add item' }))
    expect(screen.getByText('Cake cutting')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove “Cake cutting”' }))
    expect(screen.queryByText('Cake cutting')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('Cake cutting')).toBeInTheDocument()
  })

  it('builds from a template when the timeline is empty', async () => {
    const { user } = renderApp('/app/events/patel/logistics')
    await user.click(screen.getByRole('button', { name: 'Build from template' }))
    expect(within(screen.getByRole('list', { name: 'Run of show' })).getAllByRole('listitem')).toHaveLength(5)
  })

  it('has a printable one-page version', () => {
    renderApp('/print/events/acme/run-of-show')
    expect(screen.getByRole('heading', { name: 'Acme holiday party · run of show' })).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(12)
  })
})

describe('PL-4.10 Vendors', () => {
  it('shows status, COI flags and unacknowledged changes', () => {
    renderApp('/app/events/acme/logistics/vendors')
    expect(screen.getByText('Vendors · 2 of 3 confirmed')).toBeInTheDocument()
    expect(screen.getByText('COI expires before the event')).toBeInTheDocument()
    expect(screen.getByText('COI missing')).toBeInTheDocument()
    expect(screen.getByText('1 change not acknowledged')).toBeInTheDocument()
  })

  it('a cancelled vendor shows who else is free that day, and books the replacement', async () => {
    const { user } = renderApp('/app/events/acme/logistics/vendors')
    const dj = screen.getByText('DJ Rhythm').closest('li')
    await user.click(within(dj).getByRole('button', { name: 'Vendor cancelled' }))
    await user.click(screen.getByRole('button', { name: 'Mark as cancelled' }))
    await user.click(screen.getByRole('button', { name: 'Book Austin Sound Co.' }))
    expect(screen.getByText('Austin Sound Co.')).toBeInTheDocument()
    expect(screen.getByText('Vendors · 1 of 3 confirmed')).toBeInTheDocument()   // the replacement is invited, not confirmed yet
  })

  it('adds a vendor from the directory and sends their link', async () => {
    const { user } = renderApp('/app/events/acme/logistics/vendors')
    await user.click(screen.getByRole('button', { name: 'Add a vendor' }))
    await user.selectOptions(screen.getByLabelText('Vendor'), 'golden-hour')
    await user.click(screen.getByRole('button', { name: 'Add and send their link' }))
    expect(screen.getByText('Golden Hour Photo')).toBeInTheDocument()
    expect(screen.getByText('Invite sent to Golden Hour Photo')).toBeInTheDocument()
  })

  it('records a vendor payment', async () => {
    const { user } = renderApp('/app/events/acme/logistics/vendors')
    const dj = screen.getByText('DJ Rhythm').closest('li')
    await user.click(within(dj).getByRole('button', { name: 'Record payment' }))
    await user.click(screen.getByRole('button', { name: 'Record $900.00' }))
    expect(within(dj).getByText('Paid in full')).toBeInTheDocument()
  })

  it('after the event: rate privately and share photos', async () => {
    const { user } = renderApp('/app/events/okafor/logistics/vendors')
    expect(screen.getByLabelText('Rating (private)')).toHaveValue('5')
    await user.click(screen.getByRole('button', { name: 'Share photos of their work' }))
    expect(screen.getByText(/^Photos shared Nov 5\./)).toBeInTheDocument()
  })

  it('amounts are hidden without "See event budgets"', () => {
    const state = initialState()
    state.ui.memberId = 'devon'
    state.team.find((m) => m.id === 'devon').permissions.see_budgets = false
    renderApp('/app/events/acme/logistics/vendors', { state })
    expect(screen.queryByText('Payment')).not.toBeInTheDocument()
  })
})

describe('PL-6.2 / PL-6.3 Gear and pack list', () => {
  it('shows the chair shortage and covers it with a partner rental', async () => {
    const { user } = renderApp('/app/events/acme/logistics/gear')
    expect(screen.getByText('Short 30')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add rental' }))
    expect(screen.queryByText('Short 30')).not.toBeInTheDocument()
    expect(screen.getByText(/30 rented from Austin Party Rentals/)).toBeInTheDocument()
  })

  it('ticks items packed and adds extras', async () => {
    const { user } = renderApp('/app/events/acme/logistics/gear')
    expect(screen.getByText(/Pack list · 0 of/)).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Gaffer tape' }))
    expect(screen.getByText(/Pack list · 1 of/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Add an extra'), 'Gold runners')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('checkbox', { name: 'Gold runners' })).toBeInTheDocument()
  })
})

describe('PL-4.9 Budget and profit', () => {
  it('shows estimated vs actual and an owner-only profit breakdown', () => {
    renderApp('/app/events/acme/money')
    expect(screen.getByText('Budget · $6,300.00 actual of $6,825.00 estimated')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Profit (owner only)' })).toBeInTheDocument()
  })

  it('a coordinator sees the budget but not profit', () => {
    const state = initialState()
    state.ui.memberId = 'devon'
    renderApp('/app/events/acme/money', { state })
    expect(screen.getByText(/^Budget ·/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Profit (owner only)' })).not.toBeInTheDocument()
  })
})

describe('PL-6.5 Final week', () => {
  it('moves the status and sends final details to everyone', async () => {
    const { user } = renderApp('/app/events/acme')
    await user.click(screen.getByRole('button', { name: 'Start final week' }))
    await user.click(screen.getByRole('button', { name: 'Send final details' }))
    expect(within(screen.getByRole('list', { name: 'Event status' })).getByText('Final week')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText(/Final details sent: client, 3 vendors, 2 staff/)).toBeInTheDocument()
  })
})

describe('Settings › Vendors and Equipment', () => {
  it('adds a vendor to the directory', async () => {
    const { user } = renderApp('/app/settings/vendors')
    await user.type(screen.getByLabelText('Company'), 'Sweet Tooth Desserts')
    await user.type(screen.getByLabelText('Phone'), '5125550311')
    await user.click(screen.getByRole('button', { name: 'Add to directory' }))
    expect(screen.getByText('Sweet Tooth Desserts')).toBeInTheDocument()
  })

  it('lists equipment and kits; changing how many you own updates it', async () => {
    const { user } = renderApp('/app/settings/equipment')
    expect(screen.getByText('Photo booth kit')).toBeInTheDocument()
    const chairs = screen.getByLabelText('How many White folding chair you own')
    await user.clear(chairs)
    await user.type(chairs, '160')
    expect(chairs).toHaveValue(160)
  })
})
