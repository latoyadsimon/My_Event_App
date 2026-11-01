// Phase 6 acceptance: guests RSVP with no account; staff join by phone.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState } from '../../store/reducer'
import { getEventGuests, guestCounts } from '../../store/selectors'

describe('GU-1.1 → GU-2.2 Dana RSVPs from her invitation text', () => {
  it('opens the invitation, RSVPs for two with meals, and the planner\'s counts update', async () => {
    const { user } = renderApp('/outbox', { role: 'guest' })
    await user.click(screen.getByRole('link', { name: /Invitation/ }))
    await user.click(screen.getByRole('button', { name: 'Open invitation' }))

    const card = screen.getByRole('article', { name: 'You’re invited' })
    expect(within(card).getByRole('heading', { name: 'Acme holiday party' })).toBeInTheDocument()
    expect(within(card).getByText('Dana Lee +1')).toBeInTheDocument()
    expect(within(card).getByText(/Please reply by Saturday, November 28/)).toBeInTheDocument()
    await user.click(within(card).getByRole('link', { name: 'RSVP' }))

    expect(screen.getByRole('heading', { name: 'Hi, Dana Lee!' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send RSVP' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Please choose Attending or Not attending for everyone.')
    await user.click(within(screen.getByRole('radiogroup', { name: 'Dana Lee' })).getByRole('radio', { name: 'Attending' }))
    await user.selectOptions(screen.getByLabelText('Meal · Dana'), 'Fish')
    await user.click(screen.getByRole('button', { name: '+ Add a guest' }))
    expect(screen.queryByRole('button', { name: '+ Add a guest' })).not.toBeInTheDocument()
    expect(screen.getByText(/You can bring 1 guest\(s\)/)).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Guest 1' }), 'Chris Lee')
    await user.selectOptions(screen.getByLabelText('Meal · Chris Lee'), 'Vegetarian')
    await user.type(screen.getByLabelText('Allergies or dietary needs'), 'Shellfish')
    await user.click(screen.getByRole('button', { name: 'Send RSVP' }))

    expect(screen.getByRole('heading', { name: 'You’re all set! See you there.' })).toBeInTheDocument()
    expect(screen.getByText('Chris Lee: Attending · Vegetarian')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Change my RSVP' })).toBeInTheDocument()

    // Planner side: 12 → 14 attending
    await user.selectOptions(screen.getByRole('combobox', { name: 'Viewing as' }), 'planner')
    await user.click(screen.getAllByRole('link', { name: 'Events' })[0])
    await user.click(screen.getAllByRole('link', { name: 'Acme holiday party' })[0])
    await user.click(screen.getByRole('link', { name: 'Guests' }))
    expect(within(screen.getByLabelText('RSVPs')).getByText('14')).toBeInTheDocument()
  })
})

describe('GU-1.3 Event website', () => {
  it('switches every word to Spanish', async () => {
    const { user } = renderApp('/e/acme?t=acme-g8-t', { role: 'guest' })
    expect(screen.getByRole('heading', { name: 'When & where' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Español' }))
    expect(screen.getByRole('heading', { name: 'Cuándo y dónde' })).toBeInTheDocument()
    expect(screen.getByText(/sábado, 12 de diciembre de 2026/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Confirmar asistencia' })).toBeInTheDocument()
    expect(screen.getByText('Organizado por')).toBeInTheDocument()
  })

  it('the memorial website is respectful and calls the fund "In memory"', () => {
    const { container } = renderApp('/e/thompson?t=th-g5-t', { role: 'guest' })
    expect(container.querySelector('[data-tone="respectful"]')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'In memory' })).toBeInTheDocument()
  })

  it('GU-2.3 private: without an invitation link, guests see "ask the host"', () => {
    renderApp('/e/acme', { role: 'guest' })
    expect(screen.getByText(/just for invited guests/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'When & where' })).not.toBeInTheDocument()
  })

  it('GU-2.3 public: anyone can RSVP by giving a name and contact', async () => {
    const state = initialState()
    state.events.find((e) => e.id === 'acme').site.privacy = 'public'
    const { user } = renderApp('/e/acme/rsvp', { role: 'guest', state })
    await user.type(screen.getByLabelText('Your name'), 'Walk In')
    await user.type(screen.getByLabelText('Email or mobile'), 'walk@in.com')
    await user.click(screen.getByRole('radio', { name: 'Attending' }))
    await user.click(screen.getByRole('button', { name: 'Send RSVP' }))
    expect(screen.getByRole('heading', { name: 'You’re all set! See you there.' })).toBeInTheDocument()
  })

  it('a password-protected site asks once', async () => {
    const state = initialState()
    Object.assign(state.events.find((e) => e.id === 'acme').site, { privacy: 'password', password: 'gala26' })
    const { user } = renderApp('/e/acme', { role: 'guest', state })
    await user.type(screen.getByLabelText('Password'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Enter' }))
    expect(screen.getByText(/didn’t work/)).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Password'))
    await user.type(screen.getByLabelText('Password'), 'gala26')
    await user.click(screen.getByRole('button', { name: 'Enter' }))
    expect(screen.getByRole('heading', { name: 'When & where' })).toBeInTheDocument()
  })
})

describe('GU-2.2 after the cutoff', () => {
  it('RSVPs are closed, with Message the host', async () => {
    const state = initialState()
    state.events.find((e) => e.id === 'acme').site.rsvpCutoff = '2026-11-01'
    const { user } = renderApp('/e/acme/rsvp?t=acme-g8-t', { role: 'guest', state })
    expect(screen.getByText(/RSVPs closed on Sunday, November 1/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Message the host' }))
    await user.type(screen.getByLabelText('Your message'), 'Sorry, can we still come?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByText(/The host will see your message/)).toBeInTheDocument()
  })

  it('late RSVPs work when the host allows them', () => {
    renderApp('/e/thompson/rsvp?t=th-g5-t', { role: 'guest' })
    expect(screen.queryByText(/RSVPs closed on/)).not.toBeInTheDocument()
  })
})

describe('store: rsvp/submit', () => {
  it('a decline counts as declined and sends a confirmation', async () => {
    const { reducer } = await import('../../store/reducer')
    const s = reducer(initialState(), { type: 'rsvp/submit', eventId: 'acme', guestId: 'acme-g9', members: [{ name: 'Chris Patel', attending: false }] })
    expect(guestCounts(getEventGuests(s, 'acme')).declined).toBe(2)
    expect(s.outbox[1]).toMatchObject({ subject: 'Reply received: Acme holiday party' })
  })
})

describe('ST-1.1 / ST-1.2 Staff', () => {
  it('Jo joins from the team invite with a phone code and lands on their profile', async () => {
    const { user } = renderApp('/join/inv-jo', { role: 'staff' })
    expect(screen.getByRole('heading', { name: 'Join the team as KJ' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Text me a code' }))
    await user.type(screen.getByLabelText('6-digit code'), '111111')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText(/didn’t work/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send a new code' }))
    await user.type(screen.getByLabelText('6-digit code'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Jo Kim')
    expect(screen.getAllByText(/locked: Coming in Phase 2/).length).toBeGreaterThan(0)   // My Shifts, Day-of, Chat (sidebar + phone bar)
  })

  it('a staff member edits their profile; the role is read-only', async () => {
    const { user } = renderApp('/app/staff/profile', { role: 'staff' })
    await user.click(screen.getByRole('checkbox', { name: 'KJ' }))
    await user.selectOptions(screen.getByLabelText('Shirt size'), 'L')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(screen.getByText('Profile saved')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /role/i })).not.toBeInTheDocument()
    expect(screen.getAllByText(/locked: Coming in Phase 2/).length).toBeGreaterThan(0)
  })
})
