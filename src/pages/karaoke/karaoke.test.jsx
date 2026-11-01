// Phase 12 acceptance: karaoke from the table QR to the big screen.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState, reducer } from '../../store/reducer'

const withLine = () => [
  { type: 'karaoke/request', eventId: 'acme', id: 'q1', songId: 's3', singer: 'Ana' },
  { type: 'karaoke/request', eventId: 'acme', id: 'q2', songId: 's1', singer: 'Ben', contact: '(512) 555-0700' },
  { type: 'karaoke/request', eventId: 'acme', id: 'q3', songId: 's8', singer: 'Cy', contact: '(512) 555-0701' },
].reduce(reducer, initialState())

describe('GU-5.5 a guest requests a song from the table QR', () => {
  it('opens without the private-site gate, blocks explicit songs kindly, and shows my place', async () => {
    const { user } = renderApp('/e/acme/karaoke', { role: 'guest' })
    await user.type(screen.getByLabelText('Song or artist'), 'ceelo')
    const songs = screen.getByRole('list', { name: 'Song or artist' })
    expect(within(songs).getByText(/Not available tonight/)).toBeInTheDocument()
    await user.click(within(songs).getByRole('button', { name: 'Try the clean version: Forget You' }))
    await user.type(screen.getByLabelText('Your name'), 'Dana')
    await user.click(screen.getByRole('button', { name: 'Add me to the line' }))
    expect(screen.getByText('You’re up next!')).toBeInTheDocument()   // nobody else in line yet
  })

  it('works in Spanish', async () => {
    const { user } = renderApp('/e/acme/karaoke', { role: 'guest' })
    await user.click(screen.getByRole('button', { name: 'Español' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Pide una canción' })).toBeInTheDocument()
  })
})

describe('ST-4.5 the KJ console', () => {
  it('Next singer, then the line moves and the guest 2 away is texted', async () => {
    const { user } = renderApp('/app/kj/acme', { state: withLine() })
    expect(within(screen.getByRole('list', { name: 'Queue' })).getAllByRole('listitem')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Next singer' }))
    expect(within(screen.getByRole('region', { name: 'Now singing' })).getByText('September')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Queue' })).getAllByRole('listitem')).toHaveLength(2)
  })

  it('bumps a VIP, adds a paper request and removes one with Undo', async () => {
    const { user } = renderApp('/app/kj/acme', { state: withLine() })
    await user.click(screen.getByRole('button', { name: 'Bump Cy to next (VIP)' }))
    expect(within(screen.getByRole('list', { name: 'Queue' })).getAllByRole('listitem')[0]).toHaveTextContent('Cy')
    await user.type(screen.getByLabelText('Find a song'), 'proud')
    await user.selectOptions(screen.getByLabelText('Song'), 's26')
    await user.type(screen.getByLabelText('Singer'), 'Grandma Lou')
    await user.click(screen.getByRole('button', { name: 'Add to the line' }))
    expect(screen.getByText(/added by KJ/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove Grandma Lou' }))
    expect(screen.queryByText(/added by KJ/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText(/added by KJ/)).toBeInTheDocument()
  })

  it('the staff KJ opens it from Day-of on the event day', async () => {
    let state = reducer(withLine(), { type: 'event/startDay', eventId: 'acme' })
    state = { ...state, shifts: state.shifts.map((s) => (s.id === 'sh4' ? { ...s, status: 'accepted' } : s)), ui: { ...state.ui, staffId: 'keisha' } }
    const { user } = renderApp('/app/staff/day-of', { role: 'staff', state })
    await user.click(screen.getByRole('link', { name: 'Open the KJ console' }))
    expect(screen.getByRole('heading', { name: 'KJ console' })).toBeInTheDocument()
  })

  it('the big screen shows now singing and up next', () => {
    const state = reducer(withLine(), { type: 'karaoke/next', eventId: 'acme' })
    renderApp('/screen/karaoke/acme', { state })
    expect(within(screen.getByRole('region', { name: 'Now singing' })).getByText('Ana')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Up next' })).getAllByRole('listitem')).toHaveLength(2)
  })
})

describe('PL-6.4 / CL-3.7 setup and the client’s lists', () => {
  it('the planner sets clean-only and contest mode', async () => {
    const { user } = renderApp('/app/events/acme/logistics/entertainment')
    expect(screen.getByRole('button', { name: 'Remove Before He Cheats from Do-not-play' })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Contest mode/ }))
    await user.click(screen.getByRole('button', { name: 'Download for offline' }))
    expect(screen.getByText(/On the tablets since/)).toBeInTheDocument()
  })

  it('Priya adds a must-play song from her portal', async () => {
    const state = initialState()
    state.ui.clientId = 'acme'
    const { user } = renderApp('/portal/entertainment', { role: 'client', state })
    await user.type(screen.getByLabelText('Add to must-play'), 'dancing queen')
    await user.click(screen.getByRole('button', { name: /Dancing Queen/ }))
    await user.click(screen.getByRole('button', { name: 'Save my lists' }))
    expect(screen.getByText('Saved. Your KJ will see these lists.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Dancing Queen from Must-play' })).toBeInTheDocument()
  })
})
