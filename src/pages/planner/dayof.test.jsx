// Phase 10 acceptance: Day-of Mode, door check-in, staff day-of, client day-of, wrap-up.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState, reducer } from '../../store/reducer'

const thompsonDay = () => reducer(initialState(), { type: 'event/startDay', eventId: 'thompson' })

describe('PL-7.1 Day-of Mode', () => {
  it('starts the event day from the hub, then runs now / next', async () => {
    const { user } = renderApp('/app/events/thompson')
    await user.click(screen.getByRole('link', { name: 'Day-of Mode' }))
    await user.click(screen.getByRole('button', { name: 'Start event day' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Start event day' }))
    expect(screen.getByText('Event day')).toBeInTheDocument()
    const now = screen.getByRole('region', { name: 'Now' })
    expect(within(now).getByText('Set chairs and the memory table; test the slideshow')).toBeInTheDocument()
    await user.click(within(now).getByRole('button', { name: /^Done:/ }))
    expect(within(screen.getByRole('region', { name: 'Now' })).getByText('Lunch delivered and set')).toBeInTheDocument()
  })

  it('Running late moves the rest of the timeline', async () => {
    const { user } = renderApp('/app/day-of/thompson', { state: thompsonDay() })
    await user.click(screen.getByRole('button', { name: '+15 min' }))
    expect(screen.getByText(/Moved 5 items by 15 min/)).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Now' })).getByText(/9:45 AM/)).toBeInTheDocument()
  })

  it('marks a vendor arrived and shows it in the live numbers', async () => {
    const { user } = renderApp('/app/day-of/thompson', { state: thompsonDay() })
    await user.click(screen.getByRole('button', { name: 'Mark arrived' }))
    expect(within(screen.getByLabelText('Live numbers')).getByText('1 / 1')).toBeInTheDocument()
  })

  it('PL-7.3 sells an extra karaoke hour by tap-to-pay', async () => {
    const { user } = renderApp('/app/day-of/thompson', { state: thompsonDay() })
    await user.click(screen.getByRole('tab', { name: 'Sell' }))
    await user.click(screen.getByRole('button', { name: 'Tap to pay $250.00' }))
    expect(screen.getByText('$250.00 paid · added to the invoice')).toBeInTheDocument()
  })

  it('PL-7.4 logs an incident', async () => {
    const { user } = renderApp('/app/day-of/thompson', { state: thompsonDay() })
    await user.click(screen.getByRole('tab', { name: 'Incidents' }))
    await user.type(screen.getByLabelText('What happened?'), 'Projector bulb died; swapped in the spare')
    await user.click(screen.getByRole('button', { name: 'Log incident' }))
    expect(screen.getByText('Projector bulb died; swapped in the spare')).toBeInTheDocument()
  })

  it('PL-7.5 teardown: checks gear in, reports what is missing, moves to Wrap-up', async () => {
    const { user } = renderApp('/app/day-of/thompson', { state: thompsonDay() })
    await user.click(screen.getByRole('tab', { name: 'Teardown' }))
    await user.click(screen.getByRole('button', { name: 'White folding chair is back' }))
    await user.click(screen.getByRole('button', { name: 'Mark teardown done' }))
    await user.click(screen.getByRole('button', { name: 'Report 6 missing and finish' }))
    expect(screen.getByRole('link', { name: 'Go to wrap-up' })).toBeInTheDocument()
  })
})

describe('ST-4.3 / GU-5.1 door check-in', () => {
  it('finds a guest by check-in code, checks the party in, adds a walk-in', async () => {
    const { user } = renderApp('/app/day-of/acme')
    await user.click(screen.getByRole('tab', { name: 'Door' }))
    await user.type(screen.getByLabelText('Name or check-in code'), 'Priya')
    const results = screen.getByRole('list', { name: 'Matching guests' })
    await user.click(within(results).getByRole('button', { name: 'Check in' }))
    expect(screen.getByText(/^In · 2 at/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Name'), 'Tom from Sales')
    await user.click(screen.getByRole('button', { name: 'Add walk-in' }))
    expect(screen.getByText(/^3$/)).toBeInTheDocument()
  })

  it('the guest sees their check-in code after RSVPing yes', () => {
    renderApp('/e/acme/rsvp/done?t=acme-g1-t', { role: 'guest' })
    expect(screen.getByText('ACME-G1')).toBeInTheDocument()
  })
})

describe('ST-4.2 staff day-of shows only my role', () => {
  it('a coordinator gets now / next and vendor arrivals', () => {
    const state = thompsonDay()
    state.ui.staffId = 'devon'
    state.shifts.find((s) => s.id === 'sh10').role = 'Coordinator'
    renderApp('/app/staff/day-of', { role: 'staff', state })
    expect(screen.getByRole('region', { name: 'Now' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vendor arrivals' })).toBeInTheDocument()
  })

  it('with no event today, points to the next call sheet', () => {
    renderApp('/app/staff/day-of', { role: 'staff' })
    expect(screen.getByText('No event today')).toBeInTheDocument()
  })
})

describe('CL-5.1 the client on the day', () => {
  it('Portal › Day-of shows the client timeline and the day-of contact, no tasks', async () => {
    const state = thompsonDay()
    state.ui.clientId = 'thompson'
    const { user } = renderApp('/portal', { role: 'client', state })
    await user.click(screen.getAllByRole('link', { name: 'Day-of' })[0])
    expect(screen.getByText('Devon Brooks')).toBeInTheDocument()
    expect(screen.getByText('Service')).toBeInTheDocument()
    expect(screen.queryByText('Set chairs and the memory table; test the slideshow')).not.toBeInTheDocument()   // staff-only
  })
})

describe('PL-8.1 / PL-8.2 / PL-8.5 wrap-up', () => {
  const wrapped = () => {
    let s = thompsonDay()
    s = reducer(s, { type: 'event/teardownDone', eventId: 'thompson' })
    return s
  }

  it('adds a damage charge, pays it from the deposit, and shows the report', async () => {
    const { user } = renderApp('/app/events/thompson/wrap-up', { state: wrapped() })
    expect(screen.getByText(/Close-out · 1 of 5 done/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Damage charge'), 'Torn tablecloth')
    await user.type(screen.getByLabelText('Amount ($)'), '35')
    await user.click(screen.getByRole('button', { name: 'Add charge' }))
    await user.click(screen.getByRole('button', { name: 'Pay damage from the deposit' }))
    expect(screen.getByText(/Applied \$35\.00 to damage/)).toBeInTheDocument()
    expect(screen.getByText(/Close-out · 2 of 5 done/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close event' })).toBeDisabled()
    expect(screen.getByLabelText('Report numbers')).toBeInTheDocument()
  })

  it('the Dashboard asks to wrap up', () => {
    renderApp('/app/dashboard', { state: wrapped() })
    expect(screen.getByText(/close-out 1 of 5 done/)).toBeInTheDocument()
  })
})
