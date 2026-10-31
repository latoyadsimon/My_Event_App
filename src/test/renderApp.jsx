// Test helper: render the whole app at a URL, as a given demo role.
//   renderApp('/app/dashboard')                      → planner
//   renderApp('/portal/proposal', { role: 'client' })
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { StoreProvider } from '../store/StoreContext'
import { initialState } from '../store/reducer'
import App from '../App'

export function renderApp(url = '/', { role = 'planner', state } = {}) {
  const start = state ?? initialState()
  start.ui.role = role
  const user = userEvent.setup()
  const utils = render(
    <MemoryRouter initialEntries={[url]}>
      <StoreProvider initial={start}>
        <App />
      </StoreProvider>
    </MemoryRouter>,
  )
  return { user, ...utils }
}
