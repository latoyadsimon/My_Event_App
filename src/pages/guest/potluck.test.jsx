// Phase 11 acceptance: potluck and volunteers (planner, guest, client).
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState } from '../../store/reducer'

describe('GU-3.1 / GU-3.2 the guest sign-up page', () => {
  it('the event website links to it', () => {
    renderApp('/e/hope', { role: 'guest' })
    expect(screen.getByRole('link', { name: 'Bring a dish or lend a hand' })).toHaveAttribute('href', '/e/hope/potluck')
  })

  it('shows filled/needed, warns about a similar dish, and still lets you add it', async () => {
    const { user } = renderApp('/e/hope/potluck', { role: 'guest' })
    expect(within(screen.getByRole('list', { name: 'What’s coming' })).getByText('3 of 25')).toBeInTheDocument()
    await user.type(screen.getAllByLabelText('Your name')[0], 'Joy Lee')
    await user.selectOptions(screen.getByLabelText('Category'), 'sides')
    await user.type(screen.getByLabelText('What are you bringing?'), 'Baked mac & cheese')
    expect(screen.getByText(/Someone is already bringing Mac and cheese\. Main dishes, Desserts could use more/)).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Vegetarian' }))
    await user.click(screen.getByRole('checkbox', { name: 'Needs an outlet or warming tray' }))
    await user.click(screen.getAllByRole('button', { name: 'Sign up' })[0])
    expect(within(screen.getByRole('list', { name: 'What’s coming' })).getByText('4 of 25')).toBeInTheDocument()
  })

  it('volunteers for an open slot', async () => {
    const { user } = renderApp('/e/hope/potluck', { role: 'guest' })
    await user.selectOptions(screen.getByLabelText('Help with'), 'kids')
    await user.type(screen.getAllByLabelText('Your name')[1], 'Maya Brooks')
    await user.click(screen.getAllByRole('button', { name: 'Sign up' })[1])
    expect(screen.getByText("Thanks! You're on kids' table.")).toBeInTheDocument()
  })

  it('is in Spanish too', async () => {
    const { user } = renderApp('/e/hope/potluck', { role: 'guest' })
    await user.click(screen.getByRole('button', { name: 'Español' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Trae un platillo o echa una mano' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Sin gluten' })).toBeInTheDocument()
  })
})

describe('PL-5.6 planner: Guests › Potluck & volunteers', () => {
  it('turns the potluck on for an event and sets the drop-off', async () => {
    const { user } = renderApp('/app/events/patel/guests/potluck')
    await user.click(screen.getByRole('checkbox', { name: 'Guests sign up to bring a dish' }))
    expect(screen.getByRole('list', { name: 'Potluck categories' })).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Drop-off by/), '12:30')
    expect(screen.getByText(/Planning for/)).toBeInTheDocument()
  })

  it('changing "one dish per N people" rescales the target', () => {
    renderApp('/app/events/hope/guests/potluck')
    fireEvent.change(screen.getByLabelText('Main dishes: one dish per how many people'), { target: { value: '20' } })
    expect(screen.getByText('Main dishes · 3 of 10')).toBeInTheDocument()
  })

  it('sends the day-before reminder', async () => {
    const { user } = renderApp('/app/events/hope/guests/potluck')
    await user.click(screen.getByRole('button', { name: 'Send the day-before reminder' }))
    expect(screen.getByText(/Reminder sent to 4 cooks/)).toBeInTheDocument()
  })
})

describe('CL-3.8 the client sees potluck totals', () => {
  it('shows each category, filled vs needed', () => {
    const state = initialState()
    state.ui.clientId = 'hope'
    renderApp('/portal/guests', { role: 'client', state })
    expect(screen.getByRole('heading', { name: 'Potluck · 11 of 92 dishes' })).toBeInTheDocument()
  })
})
