// Phase 14 acceptance: the invitation designer, the envelope, print with QR.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../../test/renderApp'
import { initialState, reducer } from '../../../store/reducer'

describe('PL-5.5 the designer', () => {
  it('opens from Invitations; picks a template, a font and the envelope; saves my template', async () => {
    const { user } = renderApp('/app/events/acme/guests/invitations')
    await user.click(screen.getByRole('link', { name: 'Open the designer' }))
    await user.click(screen.getByRole('button', { name: 'Winter Wonderland' }))
    expect(screen.getByRole('button', { name: 'Winter Wonderland' })).toHaveAttribute('aria-pressed', 'true')
    await user.selectOptions(screen.getByLabelText('Display font'), 'Cormorant Garamond')
    await user.click(screen.getByRole('checkbox', { name: /Animated envelope/ }))
    await user.click(screen.getByRole('button', { name: 'Envelope' }))
    expect(screen.getByRole('region', { name: 'Open your invitation' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Save as my template'), 'Winter corporate')
    await user.click(screen.getByRole('button', { name: 'Save template' }))
    expect(screen.getByText('Saved “Winter corporate” to your templates')).toBeInTheDocument()
  })

  it('starts from one of my templates', async () => {
    const { user } = renderApp('/app/events/garza/guests/design')
    await user.click(screen.getByRole('button', { name: 'Bella signature' }))
    expect(screen.getByText('Using “Bella signature”')).toBeInTheDocument()
    expect(screen.getByLabelText('Display font')).toHaveValue('Playfair Display')
  })

  it('prints a 5×7 card with a QR code to the RSVP', () => {
    renderApp('/print/events/acme/invitation')
    expect(screen.getByRole('img', { name: /QR code: RSVP at .*\/e\/acme\/rsvp/ })).toBeInTheDocument()
  })
})

describe('the guest sees the design', () => {
  it('opens through the envelope (or Skip), with a music toggle', async () => {
    const state = reducer(initialState(), { type: 'invitation/design', eventId: 'acme', changes: { envelope: true, music: 'piano' } })
    const { user } = renderApp('/i/acme-g8-t', { role: 'guest', state })
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Acme holiday party' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play music' })).toBeInTheDocument()
  })

  it('without the envelope, the invitation shows right away', () => {
    renderApp('/i/acme-g8-t', { role: 'guest' })
    expect(within(screen.getByRole('article', { name: 'You’re invited' })).getByRole('heading', { level: 1 })).toHaveTextContent('Acme holiday party')
  })
})
