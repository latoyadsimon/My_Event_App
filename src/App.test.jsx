import { screen, within } from '@testing-library/react'
import { renderApp } from './test/renderApp'
import { initialState } from './store/reducer'

describe('Phase 0: routes, shells and the demo', () => {
  it('opens on the landing page with the Crowned lockup and a way in for each role', () => {
    renderApp('/')
    expect(screen.getByRole('link', { name: /crowned/i })).toBeInTheDocument()
    expect(screen.getByText(/brought to you by/i)).toHaveTextContent('brought to you by Simon Says: Celebrate')
    for (const role of ['Planner', 'Client', 'Guest', 'Staff']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${role}`) })).toBeInTheDocument()
    }
  })

  it('takes the planner from the landing page to the dashboard', async () => {
    const { user } = renderApp('/', { role: 'client' })
    await user.click(screen.getByRole('button', { name: /^Planner/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('shows the planner nav from the wireframes, with the current page marked', () => {
    renderApp('/app/leads')
    const nav = screen.getAllByRole('navigation', { name: 'Planner' })[0]
    const links = within(nav).getAllByRole('link').map((a) => a.textContent)
    expect(links).toEqual(['Dashboard', 'Leads', 'Calendar', 'Events', 'Settings'])
    expect(within(nav).getByRole('link', { name: 'Leads' })).toHaveAttribute('aria-current', 'page')
  })

  it('puts 4 items plus "More (1)" in the phone bar, and keeps the current page visible', async () => {
    const { user } = renderApp('/app/settings/appearance')
    const bars = screen.getAllByRole('navigation', { name: 'Planner' })
    const phone = bars[1]
    // Settings is 5th, so it takes the 4th slot and Events moves into More
    expect(within(phone).getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')
    const more = within(phone).getByRole('button', { name: 'More (1)' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await user.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(within(phone).getByRole('link', { name: 'Events' })).toBeVisible()
  })

  it('shows a friendly "no access" page for the wrong role, with a way in', async () => {
    const { user } = renderApp('/app/dashboard', { role: 'guest' })
    expect(screen.getByRole('heading', { name: /part of the planner workspace/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /view as planner/i }))
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
  })

  it('locks portal pages before the deposit, but keeps Proposal and Messages open', () => {
    renderApp('/portal/proposal', { role: 'client' })
    const nav = screen.getAllByRole('navigation', { name: 'Your event' })[0]
    expect(within(nav).getByRole('link', { name: 'Proposal' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Messages' })).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
    expect(within(nav).getByText('Home').closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true')
    expect(within(nav).getAllByText(/locked: Unlocks after your deposit/)).toHaveLength(4)
  })

  it('sends a locked portal page to the proposal instead', () => {
    renderApp('/portal/mood-board', { role: 'client' })
    expect(screen.getByRole('heading', { level: 1, name: 'Your proposal' })).toBeInTheDocument()
  })

  it('unlocks the portal once the event has a paid deposit', () => {
    const state = initialState()
    state.events.push({ id: 'rivera', leadId: 'rivera', clientId: 'ana', name: 'Rivera wedding', type: 'wedding', date: '2027-06-12', status: 'awaiting_countersign', theme: 'elegant-wedding', portalUnlockedAt: '2026-11-05T16:14:00' })
    renderApp('/portal', { role: 'client', state })
    const nav = screen.getAllByRole('navigation', { name: 'Your event' })[0]
    expect(within(nav).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('switches the workspace between Calm and Bold', async () => {
    const { user } = renderApp('/app/settings/appearance')
    expect(document.documentElement.dataset.mode).toBeUndefined()
    await user.click(screen.getByRole('radio', { name: /bold/i }))
    expect(document.documentElement.dataset.mode).toBe('bold')
    await user.click(screen.getByRole('radio', { name: /calm/i }))
    expect(document.documentElement.dataset.mode).toBeUndefined()
  })

  it('makes memorial Event Hubs quiet (respectful tone)', () => {
    const { container } = renderApp('/app/events/thompson')
    expect(container.querySelector('[data-tone="respectful"]')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /celebration of life/i })).toBeInTheDocument()
  })

  it('wears the event theme on guest pages, with the planner\'s brand in the footer', () => {
    const { container } = renderApp('/e/rivera', { role: 'guest' })
    const wrapper = container.querySelector('[lang]')
    expect(wrapper.style.getPropertyValue('--theme-bg')).not.toBe('')
    expect(screen.getByText('Planned by')).toBeInTheDocument()
    expect(screen.getByText('Powered by Crowned')).toBeInTheDocument()
    expect(screen.queryByText(/Simon Says/)).not.toBeInTheDocument()
  })

  it('opens an Outbox message and follows its link as the person it was for', async () => {
    const { user } = renderApp('/outbox?m=m3')
    expect(screen.getByRole('heading', { name: 'Your proposal (v2) is ready' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'View your proposal' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Your proposal' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /viewing as/i })).toHaveValue('client')
  })

  it('shows a helpful page for an unknown address', () => {
    renderApp('/nowhere')
    expect(screen.getByRole('heading', { name: /couldn.t find that page/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to the start' })).toHaveAttribute('href', '/')
  })

  it('says when an event id does not exist', () => {
    renderApp('/app/events/nope')
    expect(screen.getByRole('heading', { name: /couldn.t find that event/i })).toBeInTheDocument()
  })
})
