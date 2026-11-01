// Phase 8 acceptance: the vendor's page (VN-1 to VN-7).
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState } from '../../store/reducer'

// Petal & Stem with their profile already set up (skips the first-visit form)
const petalReady = () => {
  const s = initialState()
  s.vendors.find((v) => v.id === 'petal').profileComplete = true
  return s
}

describe('VN-1 first visit', () => {
  it('asks for company details, COI and W-9 once, then shows the event', async () => {
    const { user } = renderApp('/v/v-acme-petal', { role: 'vendor' })
    await user.click(screen.getByRole('button', { name: 'Save and see my event' }))
    expect(screen.getByText('Upload your certificate of insurance.')).toBeInTheDocument()
    await user.upload(screen.getByLabelText('Certificate of insurance (COI)'), new File(['x'], 'coi.pdf'))
    await user.type(screen.getByLabelText('COI expires on'), '2027-06-30')
    await user.upload(screen.getByLabelText('W-9'), new File(['x'], 'w9.pdf'))
    await user.type(screen.getByLabelText("How you'd like to be paid"), 'Zelle')
    await user.click(screen.getByRole('button', { name: 'Save and see my event' }))
    expect(screen.getByRole('heading', { name: 'Confirm your booking' })).toBeInTheDocument()
  })
})

describe('VN-2 / VN-3 / VN-6 my event', () => {
  it('shows only my timeline items, meal counts and allergies (catering), and no client prices', () => {
    renderApp('/v/v-acme-hcc', { role: 'vendor' })
    expect(screen.getByText('Catering sets the buffet')).toBeInTheDocument()
    expect(screen.queryByText('Sound check')).not.toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Meals' })).getByText('Chicken')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Allergies' })).getByText('Peanuts')).toBeInTheDocument()
    expect(screen.queryByText('$12,000.00')).not.toBeInTheDocument()
  })

  it('a non-caterer sees no meals or allergies', () => {
    renderApp('/v/v-acme-rhythm', { role: 'vendor' })
    expect(screen.queryByRole('list', { name: 'Allergies' })).not.toBeInTheDocument()
  })

  it('confirms the booking and records arrival', async () => {
    const { user } = renderApp('/v/v-acme-petal', { role: 'vendor', state: petalReady() })
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }))
    expect(screen.getByText("You're confirmed")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: "I've arrived" }))
    expect(screen.getByText(/^Arrived/)).toBeInTheDocument()
  })
})

describe('VN-4 acknowledge changes', () => {
  it('lists what changed and clears it on Acknowledge', async () => {
    const { user } = renderApp('/v/v-acme-rhythm', { role: 'vendor' })
    expect(screen.getByText('Karaoke moved to 9:30–11:30 PM (was 9–11 PM).')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Acknowledge' }))
    expect(screen.queryByRole('heading', { name: 'What changed' })).not.toBeInTheDocument()
    expect(screen.getByText(/Changes you've acknowledged \(1\)/)).toBeInTheDocument()
  })
})

describe('VN-3 / VN-7 paperwork and pay', () => {
  it('uploads an invoice and shows payments with receipts', async () => {
    const { user } = renderApp('/v/v-acme-hcc/paperwork', { role: 'vendor' })
    expect(screen.getByText('$1,620.00 of $5,400.00 paid')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('What is it?'), 'invoice')
    await user.upload(screen.getByLabelText('File'), new File(['x'], 'HCC invoice 2231.pdf'))
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    expect(screen.getByText('HCC invoice 2231.pdf')).toBeInTheDocument()
  })
})

describe('VN-5 messages', () => {
  it('starts a thread with the planner that the client never sees', async () => {
    const { user } = renderApp('/v/v-acme-petal/messages', { role: 'vendor', state: petalReady() })
    await user.type(screen.getByLabelText('Message'), 'Can we get in at 3:30?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByText('Can we get in at 3:30?')).toBeInTheDocument()
  })
})
