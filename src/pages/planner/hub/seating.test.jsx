// Phase 16 acceptance: tickets (buy, QR, door), floor plan, seating, find my seat.
import { fireEvent, screen, within } from '@testing-library/react'
import { renderApp } from '../../../test/renderApp'
import { initialState, reducer } from '../../../store/reducer'

describe('GU-3.4 tickets', () => {
  it('buys two dinner tickets with a promo code and shows a QR for each', async () => {
    const { user } = renderApp('/e/hope', { role: 'guest' })
    await user.click(screen.getByRole('link', { name: 'Tickets' }))
    await user.selectOptions(screen.getByLabelText('How many Dinner'), '2')
    await user.type(screen.getByLabelText('Promo code (optional)'), 'choir')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(screen.getByText('20% off applied')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Your name'), 'Joy Lee')
    await user.type(screen.getByLabelText('Email (for your receipt)'), 'joy@lee.com')
    await user.dblClick(screen.getByRole('button', { name: 'Buy for $24.00' }))
    const mine = screen.getByRole('region', { name: 'Your tickets' })
    expect(within(mine).getAllByRole('img', { name: /QR code for/ })).toHaveLength(2)
  })

  it('door staff check a ticket in by its code', async () => {
    const state = reducer(initialState(), { type: 'event/startDay', eventId: 'hope' })
    const { user } = renderApp('/app/day-of/hope', { state })
    await user.click(screen.getByRole('tab', { name: 'Door' }))
    await user.type(screen.getByLabelText('Name or check-in code'), 'HOPE-K4')
    await user.click(screen.getByRole('button', { name: 'Check in ticket' }))
    expect(screen.getByText('Ticket used')).toBeInTheDocument()
  })

  it('the planner sees sales by tier and adds a promo code', async () => {
    const { user } = renderApp('/app/events/hope/guests/tickets')
    expect(within(screen.getByLabelText('Tickets')).getByText('6')).toBeInTheDocument()
    await user.type(screen.getByLabelText('New promo code'), 'early')
    await user.type(screen.getByLabelText('% off'), '15')
    await user.click(screen.getByRole('button', { name: 'Add code' }))
    expect(screen.getByText(/EARLY \(15% off\)/)).toBeInTheDocument()
  })
})

describe('PL-4.12 floor plan and seating', () => {
  it('flags the "don’t seat near" table and seats a household from the menu', async () => {
    const state = reducer(initialState(), { type: 'seat/assign', guestId: 'acme-g14', tableId: null })
    const { user } = renderApp('/app/events/acme/guests/seating', { state })
    expect(screen.getByRole('button', { name: 'Table 3: 5 of 10 seats, seating conflict' })).toBeInTheDocument()
    const waiting = screen.getByRole('list', { name: 'Not seated yet' })
    await user.selectOptions(within(waiting).getByLabelText('Seat Luis Romero at'), 't1')
    expect(screen.getByRole('button', { name: 'Table 1: 2 of 10 seats' })).toBeInTheDocument()
    expect(screen.getByText('Everyone attending has a seat.')).toBeInTheDocument()
  })

  it('moves a table with the arrow keys and unseats a guest', async () => {
    const { user } = renderApp('/app/events/acme/guests/seating')
    const t3 = screen.getByRole('button', { name: /^Table 3:/ })
    await user.click(t3)
    fireEvent.keyDown(t3, { key: 'ArrowRight', shiftKey: true })
    expect(screen.getByLabelText('Label')).toHaveValue('3')
    const seated = screen.getByRole('list', { name: 'Seated at table 3' })
    await user.click(within(seated).getAllByRole('button', { name: 'Unseat' })[0])
    expect(screen.getByRole('button', { name: 'Table 3: 3 of 10 seats' })).toBeInTheDocument()   // conflict gone
  })

  it('adds a table and prints escort cards', async () => {
    const { user } = renderApp('/app/events/acme/guests/seating')
    await user.click(screen.getByRole('button', { name: 'Add to the plan' }))
    expect(screen.getByRole('button', { name: 'Table 16: 0 of 10 seats' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Print cards' }))
    expect(within(screen.getByRole('list', { name: 'escort' })).getByText('Priya Shah')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Table numbers' }))
    expect(within(screen.getByRole('list', { name: 'tables' })).getAllByRole('listitem')).toHaveLength(16)
  })

  it('locks the plan for others while someone drags', () => {
    const state = reducer(initialState(), { type: 'floor/lock', eventId: 'acme', by: 'Devon' })
    renderApp('/app/events/acme/guests/seating', { state })
    expect(screen.getByText(/Devon is moving things on the plan/)).toBeInTheDocument()
  })
})

describe('GU-5.2 find my seat', () => {
  it('shows my table on a small map, in Spanish too', async () => {
    const { user } = renderApp('/e/acme/seat?t=acme-g1-t', { role: 'guest' })
    expect(screen.getByText('Table 9')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Español' }))
    expect(screen.getByText('Mesa 9')).toBeInTheDocument()
  })
})
