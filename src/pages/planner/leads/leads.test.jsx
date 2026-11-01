// Phase 2 acceptance tests: Inquiry Form, Booking Page, Leads, Lead Detail, Proposal Builder.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../../test/renderApp'

describe('CL-1.1 Inquiry Form → PL-2.1 a new lead', () => {
  it('sends an inquiry, explains what happens next, and lands the lead on the board', async () => {
    const { user } = renderApp('/b/bella-events/inquire', { role: 'client' })
    await user.type(screen.getByLabelText('Your name'), 'Maria Lopez')
    await user.type(screen.getByLabelText('Email'), 'maria@lopez.com')
    await user.selectOptions(screen.getByLabelText('Event type'), 'birthday')
    await user.type(screen.getByLabelText('Guest count'), '50')
    await user.click(screen.getByRole('checkbox', { name: 'Photo booth' }))
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }))
    expect(screen.getByRole('heading', { name: 'Thanks, Maria!' })).toBeInTheDocument()
    expect(screen.getByText(/check your email/i)).toBeInTheDocument()

    // The auto-reply is in the Outbox, and its button opens the booking page with her details
    await user.click(screen.getByRole('link', { name: 'Outbox' }))
    await user.click(screen.getByRole('link', { name: /Thanks, Maria! Let's talk about your birthday/ }))
    await user.click(screen.getByRole('button', { name: 'Pick a consult time' }))
    expect(screen.getByRole('heading', { name: /book a free 30-minute consult/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('maria@lopez.com')

    // Book the first open time
    await user.click(screen.getAllByRole('button', { name: /\d:\d\d [AP]M/ })[0])
    await user.click(screen.getByRole('button', { name: 'Book consult' }))
    expect(screen.getByRole('heading', { name: "You're booked" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to calendar' })).toBeInTheDocument()
  })

  it('keeps what was typed and says what to fix', async () => {
    const { user } = renderApp('/b/bella-events/inquire', { role: 'client' })
    await user.type(screen.getByLabelText('Your name'), 'Maria')
    await user.type(screen.getByLabelText('Email'), 'maria@')
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }))
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Please pick the kind of event.')).toBeInTheDocument()
    expect(screen.getByLabelText('Your name')).toHaveValue('Maria')
  })

  it('shows "not found" for another business\'s address', () => {
    renderApp('/b/someone-else/inquire', { role: 'client' })
    expect(screen.getByRole('heading', { name: "We couldn't find that page" })).toBeInTheDocument()
  })
})

describe('CL-1.2 Booking page', () => {
  it('shows only open times and asks for a time before booking', async () => {
    const { user } = renderApp('/b/bella-events/book', { role: 'client' })
    // Fri Nov 6 is the first open day: the 10:00 site visit blocks 10:00 AM
    expect(screen.getByRole('heading', { name: 'Friday, November 6' })).toBeInTheDocument()
    const times = screen.getAllByRole('button', { name: /\d:\d\d [AP]M/ }).map((b) => b.textContent)
    expect(times).toEqual(['11:30 AM', '2:00 PM', '4:30 PM'])
    expect(screen.getByLabelText('Saturday, November 7, no open times')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Book consult' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Please pick a time.')
  })
})

describe('PL-2.2 Leads board', () => {
  it('shows each stage with its leads and a "Date taken" badge for Kim', () => {
    renderApp('/app/leads')
    const newCol = screen.getByRole('region', { name: /^New/ })
    expect(within(newCol).getByRole('link', { name: 'Nguyen · Baby shower' })).toBeInTheDocument()
    const kim = within(newCol).getByRole('link', { name: 'Kim · Birthday' }).closest('li')
    expect(within(kim).getByText('Date taken')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: /^Proposal sent/ })).getByRole('link', { name: 'Rivera · Wedding' })).toBeInTheDocument()
  })

  it('moves a card with the keyboard-friendly menu', async () => {
    const { user } = renderApp('/app/leads')
    await user.selectOptions(screen.getByLabelText('Move Kim · Birthday to'), 'contacted')
    expect(within(screen.getByRole('region', { name: /^Contacted/ })).getByRole('link', { name: 'Kim · Birthday' })).toBeInTheDocument()
  })

  it('filters by source', async () => {
    const { user } = renderApp('/app/leads')
    await user.selectOptions(screen.getByLabelText('Source'), 'Referral')
    expect(screen.queryByRole('link', { name: 'Nguyen · Baby shower' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kim · Birthday' })).toBeInTheDocument()
  })

  it('adds a lead by hand', async () => {
    const { user } = renderApp('/app/leads')
    await user.click(screen.getByRole('button', { name: '+ Add lead' }))
    const dialog = screen.getByRole('dialog', { name: 'Add a lead' })
    await user.type(within(dialog).getByLabelText('Name'), 'Tom Baker')
    await user.type(within(dialog).getByLabelText('Email'), 'tom@baker.com')
    await user.selectOptions(within(dialog).getByLabelText('Event type'), 'reunion')
    await user.click(within(dialog).getByRole('button', { name: 'Add lead' }))
    expect(within(screen.getByRole('region', { name: /^New/ })).getByRole('link', { name: 'Baker · Reunion' })).toBeInTheDocument()
  })
})

describe('PL-2.3 Lead Detail', () => {
  it('sends an editable canned reply', async () => {
    const { user } = renderApp('/app/leads/nguyen')
    await user.click(screen.getByRole('button', { name: 'Send canned reply' }))
    const box = screen.getByLabelText('Message')
    expect(box.value).toMatch(/^Hi Linh,/)
    await user.clear(box)
    await user.type(box, 'Hi Linh, we are free that day!')
    await user.click(screen.getByRole('button', { name: 'Send reply' }))
    expect(screen.getByText('You replied by email')).toBeInTheDocument()
    expect(screen.getByText('Contacted')).toBeInTheDocument()
  })

  it('offers nearby open dates when the date is taken, and can insert them into a reply', async () => {
    const { user } = renderApp('/app/leads/kim')
    expect(screen.getByText(/is already booked \(Acme holiday party\)/)).toHaveTextContent('Dec 5 · Dec 19 · Dec 26')
    await user.click(screen.getByRole('button', { name: 'Insert into reply' }))
    expect(screen.getByLabelText('Message').value).toMatch(/free on Sat, Dec 5, Sat, Dec 19, Sat, Dec 26/)
  })

  it('holds the date for 7 days', async () => {
    const { user } = renderApp('/app/leads/nguyen')
    await user.click(screen.getByRole('button', { name: 'Hold date · 7 days' }))
    expect(screen.getByText('Date held until Nov 12')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Release date hold' })).toBeInTheDocument()
  })

  it('PL-2.5 carries the lead over to a new proposal (no retyping)', async () => {
    const { user } = renderApp('/app/leads/nguyen')
    await user.click(screen.getByRole('button', { name: 'Create proposal →' }))
    expect(screen.getByRole('heading', { name: 'Proposal · Nguyen' })).toBeInTheDocument()
    expect(screen.getByText(/Sat, Jan 23, 2027 · 35 guests/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Photo booth (4 hrs)' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Karaoke + KJ (3 hrs)' })).not.toBeChecked()
  })
})

describe('PL-3.1 / PL-3.2 Proposal Builder', () => {
  it('opens Rivera at $14,850 with the change request and the chairs warning', () => {
    renderApp('/app/proposals/rivera')
    const summary = screen.getByRole('region', { name: 'Summary' })
    expect(within(summary).getByText('$14,850.00')).toBeInTheDocument()
    expect(within(summary).getAllByText('$4,455.00')).toHaveLength(2)   // deposit and final payment
    expect(within(summary).getByText('$5,940.00')).toBeInTheDocument()
    expect(screen.getByText(/photo magnets be an optional add-on/)).toBeInTheDocument()
    expect(screen.getByText(/answered in v2/)).toBeInTheDocument()
    expect(screen.getByText(/Chairs: you own 120, quoted 140/)).toBeInTheDocument()
  })

  it('updates the total live and resolves the gear warning', async () => {
    const { user } = renderApp('/app/proposals/rivera')
    await user.click(screen.getByRole('button', { name: 'Reduce to 120' }))
    expect(screen.queryByText(/you own 120, quoted 140/)).not.toBeInTheDocument()
    // 20 fewer chairs × $2.50 = $50, + 8% tax = $54 less
    expect(within(screen.getByRole('region', { name: 'Summary' })).getByText('$14,796.00')).toBeInTheDocument()
  })

  it('previews exactly what the client will see', async () => {
    const { user } = renderApp('/app/proposals/rivera')
    await user.click(screen.getByRole('button', { name: 'Preview as client' }))
    const dialog = screen.getByRole('dialog', { name: 'What Ana will see' })
    expect(within(dialog).getByRole('group', { name: 'Optional upgrades' })).toBeInTheDocument()
    expect(within(dialog).getByRole('checkbox', { name: /Photo magnets/ })).toBeDisabled()
  })

  it('sends v3, keeps v1 and v2, and emails Ana a magic link to her portal', async () => {
    const { user } = renderApp('/app/proposals/rivera')
    await user.click(screen.getByRole('button', { name: 'Send v3 to Ana' }))
    expect(screen.getByText(/v3 · sent Nov 5/)).toBeInTheDocument()
    expect(screen.getByText(/v1 · sent Nov 2/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send v4 to Ana' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Outbox/ }))
    await user.click(screen.getByRole('link', { name: /Your proposal \(v3\) is ready/ }))
    await user.click(screen.getByRole('button', { name: 'View your proposal' }))
    expect(screen.getByRole('combobox', { name: 'Viewing as' })).toHaveValue('client')
  })

  it('asks for a package before sending a new proposal', async () => {
    const { user } = renderApp('/app/proposals/kim')
    await user.click(screen.getByRole('button', { name: 'Send v1 to Daniel' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a package first.')
  })
})
