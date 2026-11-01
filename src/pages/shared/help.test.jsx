// Phase 7: the Help page, its "Show me" links, and the crash screen.
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderApp } from '../../test/renderApp'
import { HOW_TO } from '../../data/howTo'
import PageFrame from '../../components/shell/PageFrame'

describe('Help (/help)', () => {
  it('lists every section and opens a step as the right person', async () => {
    const { user } = renderApp('/help')
    for (const s of HOW_TO) expect(screen.getByRole('heading', { name: s.title })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show me: Open the invitation' }))
    expect(screen.getByRole('article', { name: 'You’re invited' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Viewing as' })).toHaveValue('guest')
  })

  it.each(HOW_TO.flatMap((s) => s.steps.filter((x) => x.show).map((x) => [x.title, x.show])))('“%s” opens a real screen', (title, show) => {
    renderApp(show.to, { role: show.role })
    expect(screen.queryByRole('heading', { name: /We couldn't find that/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /This page is part of/ })).not.toBeInTheDocument()
  })
})

describe('a page that crashes', () => {
  it('shows a plain message with Try again, instead of a blank screen', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Boom = () => { throw new Error('boom') }
    render(<MemoryRouter><PageFrame><Boom /></PageFrame></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong on this page')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    spy.mockRestore()
  })
})
