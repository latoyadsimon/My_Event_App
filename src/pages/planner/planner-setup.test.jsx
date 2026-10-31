// Phase 1 acceptance tests: Sign Up, Onboarding, Dashboard, Settings.
// Each test names the story it checks (app_outline/user_stories.md).
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState } from '../../store/reducer'

async function signUp(user) {
  await user.type(screen.getByLabelText('Your name'), 'Maya Brooks')
  await user.type(screen.getByLabelText('Business name'), 'Maya Makes Parties')
  await user.type(screen.getByLabelText('Email'), 'maya@mmp.com')
  await user.type(screen.getByLabelText('Password'), 'confetti-2026')
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('PL-1.1 Sign up', () => {
  it('creates my business, asks me to protect the account, then starts onboarding', async () => {
    const { user } = renderApp('/app/signup')
    await signUp(user)
    expect(screen.getByRole('heading', { name: 'Protect your account' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /create a passkey/i }))
    expect(screen.getByRole('heading', { name: /step 1 of 6 · your business/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Business name')).toHaveValue('Maya Makes Parties')
  })

  it('explains what is missing, under each field', async () => {
    const { user } = renderApp('/app/signup')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByLabelText('Your name')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Please use at least 8 characters.')).toBeInTheDocument()
  })

  it('offers Log in and Reset password for an email that already has an account', async () => {
    const { user } = renderApp('/app/signup')
    await user.type(screen.getByLabelText('Your name'), 'LaToya')
    await user.type(screen.getByLabelText('Business name'), 'Bella')
    await user.type(screen.getByLabelText('Email'), 'latoya@bellaevents.com')
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }))
    expect(screen.getByText(/already has an account/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeInTheDocument()
  })
})

describe('PL-1.2 to PL-1.7 Onboarding wizard', () => {
  async function startFresh() {
    const r = renderApp('/app/signup')
    await signUp(r.user)
    await r.user.click(screen.getByRole('button', { name: /create a passkey/i }))
    return r
  }

  it('saves the business step and moves to payments, showing the step as done', async () => {
    const { user } = await startFresh()
    await user.type(screen.getByLabelText('City'), 'Austin, TX')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: /step 2 of 6 · connect payments/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Step 1: Business, done' })).toBeInTheDocument()
  })

  it('creates Silver, Gold and Platinum in the packages step', async () => {
    const { user } = await startFresh()
    await user.click(screen.getByRole('button', { name: 'Step 3: Packages' }))
    await user.click(screen.getByRole('button', { name: 'Start with Silver, Gold and Platinum' }))
    expect(screen.getByText('Gold')).toBeInTheDocument()
    expect(screen.getByText('$11,000.00')).toBeInTheDocument()
  })

  it('can be skipped, and the Dashboard checklist brings me back', async () => {
    const { user } = await startFresh()
    await user.click(screen.getByRole('button', { name: 'Skip for now' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Payments not connected. Clients can only pay by check or cash.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue setup where you left off' })).toHaveAttribute('href', '/app/onboarding/business')
    expect(screen.getByRole('link', { name: 'Add your packages' })).toHaveAttribute('href', '/app/settings/packages')
  })
})

describe('Dashboard (PL-1.8 + "what needs me today?")', () => {
  it('shows this month\'s numbers, computed from the invoices', () => {
    renderApp('/app/dashboard')
    const kpis = screen.getByLabelText('This month')
    expect(within(kpis).getByText('$9,650.00')).toBeInTheDocument()
    expect(within(kpis).getByText('$7,695.00')).toBeInTheDocument()
    expect(within(kpis).getByText('$18,405.00')).toBeInTheDocument()
    expect(within(kpis).getByText('1 late')).toBeInTheDocument()
  })

  it('links every alert to the screen that fixes it', () => {
    renderApp('/app/dashboard')
    expect(screen.getByRole('link', { name: 'New lead: Linh Nguyen · baby shower' })).toHaveAttribute('href', '/app/leads/nguyen')
    expect(screen.getByRole('link', { name: 'Acme holiday party: 1 late task' })).toHaveAttribute('href', '/app/events/acme/tasks')
  })

  it('lists this week in time order', () => {
    renderApp('/app/dashboard')
    const week = screen.getByRole('region', { name: 'Today & this week' })
    expect(within(week).getAllByRole('link').map((a) => a.textContent)).toEqual(['Lee bridal shower', 'Patel family reunion', 'Acme holiday party', 'Nguyen (new lead)'])
  })

  it('ticks "Share your inquiry form" when I copy the link', async () => {
    const { user } = renderApp('/app/dashboard')
    await user.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(screen.getByText('Share your inquiry form').closest('li')).toHaveTextContent('(done)')
    expect(screen.getByText(/inquiry form link copied/i)).toBeInTheDocument()
  })

  it('hides the checklist once everything is done', () => {
    const s = initialState()
    s.business.calendarProvider = 'google'
    s.business.inquiryFormShared = true
    renderApp('/app/dashboard', { state: s })
    expect(screen.queryByRole('region', { name: 'Getting started' })).not.toBeInTheDocument()
  })
})

describe('Settings', () => {
  it('PL-1.6 invites staff by text, with a join link in the Outbox', async () => {
    const { user } = renderApp('/app/settings/team')
    await user.click(screen.getByRole('button', { name: 'Invite staff' }))
    const form = screen.getByRole('form', { name: 'Invite staff' })
    await user.type(within(form).getByLabelText('Name'), 'Jo Kim')
    await user.type(within(form).getByLabelText('Email or mobile number'), '(512) 555-0199')
    await user.selectOptions(within(form).getByLabelText('Job'), 'KJ')
    await user.click(within(form).getByRole('button', { name: 'Send invite' }))
    const row = screen.getByRole('cell', { name: 'Jo Kim' }).closest('tr')
    expect(row).toHaveTextContent('KJ')
    expect(row).toHaveTextContent('Invited')
    expect(screen.getByRole('link', { name: /outbox/i })).toHaveTextContent('1')
  })

  it('PL-1.6 sets permissions per person; profit stays owner-only', async () => {
    const { user } = renderApp('/app/settings/team')
    await user.click(screen.getByRole('button', { name: 'Permissions for Sam Ortiz' }))
    const perms = screen.getByRole('group', { name: 'What Sam can do' })
    const payments = within(perms).getByRole('checkbox', { name: /take payments/i })
    expect(payments).not.toBeChecked()
    await user.click(payments)
    expect(payments).toBeChecked()
    expect(within(perms).getByRole('checkbox', { name: /see profit margins/i })).toBeDisabled()
  })

  it('PL-1.6 asks before deactivating, then keeps the person listed', async () => {
    const { user } = renderApp('/app/settings/team')
    await user.click(screen.getByRole('button', { name: 'Permissions for Sam Ortiz' }))
    await user.click(screen.getByRole('button', { name: 'Deactivate Sam' }))
    const dialog = screen.getByRole('dialog', { name: 'Deactivate Sam Ortiz?' })
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate Sam' }))
    expect(screen.getByRole('cell', { name: 'Sam Ortiz' }).closest('tr')).toHaveTextContent('Deactivated')
  })

  it('PL-1.4 adds, archives and restores packages', async () => {
    const { user } = renderApp('/app/settings/packages')
    const packages = screen.getByRole('region', { name: 'Packages' })
    await user.click(within(packages).getByRole('button', { name: 'Add package' }))
    await user.type(within(packages).getByLabelText('Package name'), 'Bronze')
    await user.type(within(packages).getByLabelText('Price ($)'), '5,000')
    await user.click(within(packages).getByRole('button', { name: 'Add package' }))
    expect(within(packages).getByText('$5,000.00')).toBeInTheDocument()
    await user.click(within(packages).getByRole('button', { name: 'Archive Silver' }))
    expect(within(packages).getByText('Archived (1)')).toBeInTheDocument()
    await user.click(within(packages).getByRole('button', { name: 'Restore Silver' }))
    expect(within(packages).getByRole('button', { name: 'Archive Silver' })).toBeInTheDocument()
  })

  it('PL-1.3 disconnecting payments asks first and brings back the warning', async () => {
    const { user } = renderApp('/app/settings/payments')
    await user.click(screen.getByRole('button', { name: 'Disconnect Stripe' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Disconnect Stripe' }))
    expect(screen.getByText(/clients can only pay by check or cash/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Connect Square' }))
    expect(await screen.findByRole('button', { name: 'Disconnect Square' })).toBeInTheDocument()
  })

  it('PL-1.2 explains when a brand color is too light, and what it uses instead', async () => {
    const { user } = renderApp('/app/settings/branding')
    await user.click(screen.getByRole('button', { name: 'Use #F9C74F' }))
    expect(screen.getByText(/this color is light, so buttons and text use a darker shade/i)).toBeInTheDocument()
  })

  it('PL-1.1 keeps settings closed until the owner has a passkey or 2FA', () => {
    const s = initialState()
    s.team[0].twoFactor = null
    renderApp('/app/settings/business', { state: s })
    expect(screen.getByText(/protect your account first/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Business name')).not.toBeInTheDocument()
  })

  it('saves business details with a confirmation', async () => {
    const { user } = renderApp('/app/settings/business')
    const name = screen.getByLabelText('Business name')
    await user.clear(name)
    await user.type(name, 'Bella Events & Co.')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Business details saved')).toBeInTheDocument()
    expect(screen.getAllByText('Bella Events & Co.').length).toBeGreaterThan(0)
  })
})
