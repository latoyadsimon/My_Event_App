// Phase 15 acceptance: give, receipts, auction, paddle raise, sponsors, recognition screen.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState, reducer } from '../../store/reducer'

describe('DN-1 / GU-3.3 give in under 30 seconds', () => {
  it('the event site links to it; pick an amount, cover fees, one tap', async () => {
    const { user } = renderApp('/e/hope', { role: 'guest' })
    await user.click(screen.getByRole('link', { name: 'Give: Fellowship hall roof' }))
    expect(screen.getByText(/raised of \$25,000/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '$250' }))
    await user.type(screen.getByLabelText('Your name'), 'Joy Lee')
    await user.type(screen.getByLabelText('Email (for your receipt)'), 'joy@lee.com')
    expect(screen.getByText(/Hope Community Church is a 501\(c\)\(3\)/)).toBeInTheDocument()
    await user.dblClick(screen.getByRole('button', { name: 'Give $257.50' }))
    expect(screen.getByRole('heading', { name: 'Thank you! Your receipt is on its way.' })).toBeInTheDocument()
  })

  it('a gift fund says it isn’t tax-deductible', () => {
    const state = initialState()
    renderApp('/e/garza/give?preview=1', { role: 'guest', state })
    expect(screen.getByText('This is a gift, not a tax-deductible donation.')).toBeInTheDocument()
    expect(screen.queryByText(/501\(c\)\(3\)/)).not.toBeInTheDocument()
  })
})

describe('DN-3 silent auction', () => {
  it('registers with a card on file and outbids the leader', async () => {
    const { user } = renderApp('/e/hope/auction', { role: 'guest' })
    await user.type(screen.getByLabelText('Your name'), 'Joy Lee')
    await user.type(screen.getByLabelText('Mobile number'), '5125550999')
    await user.type(screen.getByLabelText('Card (charged only if you win)'), '4242424242424242')
    await user.click(screen.getByRole('button', { name: 'Register to bid' }))
    const quilt = screen.getByRole('heading', { name: 'Hand-stitched star quilt' }).closest('li')
    await user.click(within(quilt).getByRole('button', { name: 'Bid' }))
    expect(within(quilt).getByText(/You’re the high bidder/)).toBeInTheDocument()
    expect(within(quilt).getByText('High bid $170.00')).toBeInTheDocument()
  })

  it('the planner closes it: winners charged, a declined card gets a link', async () => {
    const { user } = renderApp('/app/events/hope/fundraising')
    await user.click(screen.getByRole('tab', { name: 'Silent auction' }))
    await user.click(screen.getByRole('button', { name: 'Close the auction' }))
    await user.click(screen.getByRole('button', { name: 'Close and charge winners' }))
    expect(screen.getByText('Paid by Deacon Ray Hill')).toBeInTheDocument()
    expect(screen.getByText('Card declined: payment link sent')).toBeInTheDocument()
  })
})

describe('DN-4 paddle raise', () => {
  it('the planner calls a level; a guest taps it', async () => {
    const state = reducer(initialState(), { type: 'paddle/setLevel', eventId: 'hope', index: 2 })
    const { user } = renderApp('/e/hope/paddle', { role: 'guest', state })
    await user.type(screen.getByLabelText('Your name'), 'Joy Lee')
    await user.type(screen.getByLabelText('Mobile number'), '5125550999')
    await user.type(screen.getByLabelText('Card (charged only if you win)'), '4242424242424242')
    await user.click(screen.getByRole('button', { name: 'Register to bid' }))
    await user.click(screen.getByRole('button', { name: 'Pledge $250' }))
    expect(screen.getByText('Thank you! Pledged $250.')).toBeInTheDocument()
  })
})

describe('DN-6 sponsors and DN-7 recognition', () => {
  it('a sponsor asks for an invoice; the planner approves the logo; it shows on the screen', async () => {
    const { user } = renderApp('/e/hope/sponsor', { role: 'guest' })
    await user.click(screen.getByRole('radio', { name: /Cornerstone/ }))
    await user.type(screen.getByLabelText('Company'), 'Capital Roofing')
    await user.type(screen.getByLabelText('Email (for your receipt)'), 'hi@caproof.com')
    await user.click(screen.getByRole('radio', { name: 'Email me an invoice' }))
    await user.click(screen.getByRole('button', { name: 'Email me an invoice' }))
    expect(screen.getByText(/Your logo goes up once we’ve checked it/)).toBeInTheDocument()
  })

  it('messages wait for approval, then show; anonymous donors stay unnamed', async () => {
    const { user } = renderApp('/app/events/hope/fundraising')
    await user.click(screen.getByRole('button', { name: 'Show on screen' }))
    await user.click(screen.getByRole('link', { name: 'Recognition screen' }))
    expect(within(screen.getByRole('region', { name: 'Messages' })).getByText(/She would have loved this/)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Thank you' })).not.toHaveTextContent('Anonymous')
  })

  it('refunds void the receipt', async () => {
    const { user } = renderApp('/app/events/hope/fundraising')
    const row = screen.getByText('Mike Tran').closest('tr')
    await user.click(within(row).getByRole('button', { name: 'Refund' }))
    await user.click(screen.getByRole('button', { name: 'Refund $50.00' }))
    expect(within(row).getByText('Void (refunded)')).toBeInTheDocument()
  })
})

describe('CL-3.8 (P4) the client sees the fund', () => {
  it('Portal › Guests shows the total and approved messages', () => {
    const state = initialState()
    state.ui.clientId = 'garza'
    renderApp('/portal/guests', { role: 'client', state })
    expect(screen.getByRole('heading', { name: 'Honeymoon in Oaxaca · $150.00 of $5,000.00' })).toBeInTheDocument()
    expect(screen.getByText('“¡Disfruten Oaxaca, mis amores!”')).toBeInTheDocument()
  })
})
