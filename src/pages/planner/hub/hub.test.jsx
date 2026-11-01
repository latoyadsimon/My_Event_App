// Phase 4 acceptance: every Event Hub tab, Reschedule, Cancel and the Calendar.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../../test/renderApp'
import { initialState } from '../../../store/reducer'

describe('PL-4.2 Overview', () => {
  it('shows status, countdown, balance, RSVPs, tasks, deadlines, questionnaire and approvals for Acme', () => {
    renderApp('/app/events/acme')
    const kpis = screen.getByLabelText('This event')
    expect(within(kpis).getByText('37')).toBeInTheDocument()            // days to go
    expect(within(kpis).getByText('$3,600.00')).toBeInTheDocument()     // balance due
    expect(within(kpis).getByText('9/16')).toBeInTheDocument()          // RSVPs in
    expect(within(screen.getByRole('list', { name: 'Event status' })).getByText('In planning')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('link', { name: 'Confirm final headcount with Priya' })).toBeInTheDocument()
    expect(screen.getByText(/“Event details” received Oct 2/)).toBeInTheDocument()
    expect(screen.getByText('Dinner menu v2')).toBeInTheDocument()
  })

  it('the memorial hub uses the respectful tone', () => {
    const { container } = renderApp('/app/events/thompson')
    expect(container.querySelector('[data-tone="respectful"]')).toBeInTheDocument()
  })
})

describe('PL-4.3 Tasks', () => {
  it('adds a task, completes one, and removes one with Undo', async () => {
    const { user } = renderApp('/app/events/acme/tasks')
    await user.type(screen.getByLabelText('Task'), 'Order linens')
    await user.type(screen.getByLabelText('Due'), '2026-11-20')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    expect(screen.getByRole('checkbox', { name: 'Order linens' })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Book the DJ' }))
    expect(screen.getByText(/Done \(1\)/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove “Order linens”' }))
    expect(screen.queryByRole('checkbox', { name: 'Order linens' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('checkbox', { name: 'Order linens' })).toBeInTheDocument()
  })

  it('PL-4.4 sends the questionnaire from its task', async () => {
    const { user } = renderApp('/app/events/garza/tasks')
    await user.click(screen.getByRole('button', { name: 'Send questionnaire' }))
    expect(screen.getByText(/Sent Nov 5/)).toBeInTheDocument()
  })
})

describe('PL-5.1 / PL-5.4 Guests', () => {
  it('shows live counts, meals and allergies', async () => {
    const { user } = renderApp('/app/events/acme/guests')
    const kpis = screen.getByLabelText('RSVPs')
    expect(within(kpis).getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Chicken 5')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '⚠ Allergies 3' }))
    expect(screen.getByText(/Jen Alvarez: Peanuts/)).toBeInTheDocument()
  })

  it('imports pasted CSV', async () => {
    const { user } = renderApp('/app/events/acme/guests')
    await user.click(screen.getByRole('button', { name: 'Import CSV' }))
    await user.click(screen.getByLabelText('…or paste it here'))
    await user.paste('Name,Email,Allergies\nZoe Park,zoe@park.com,Dairy\nIan Wu,ian@wu.com,')
    expect(screen.getByText(/1 with allergies/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Import 2 households' }))
    expect(screen.getByText('Zoe Park')).toBeInTheDocument()
    expect(screen.getByText(/⚠ Dairy/)).toBeInTheDocument()
  })

  it('locking needs the client\'s approval first; then RSVPs close', async () => {
    const state = initialState()
    state.approvals.push({ id: 'ap-hc', eventId: 'acme', kind: 'headcount', title: 'Final headcount: 12', status: 'approved', decidedBy: 'Priya Shah', decidedAt: '2026-11-05T12:00:00', count: 12 })
    const { user } = renderApp('/app/events/acme/guests', { state })
    await user.click(screen.getByRole('button', { name: /Lock final headcount/ }))
    expect(screen.getByText(/approved by Priya Shah/)).toHaveTextContent('RSVPs are closed')
    expect(screen.getByRole('button', { name: '+ Add guest' })).toBeDisabled()
  })

  it('asks the client to approve the headcount when there is no approval yet', async () => {
    const { user } = renderApp('/app/events/acme/guests')
    await user.click(screen.getByRole('button', { name: 'Ask client to approve headcount' }))
    expect(screen.getByText('Headcount sent to the client for approval')).toBeInTheDocument()
  })
})

describe('PL-5.3 Invitations', () => {
  it('sends to the not-yet-invited by text, tracks, and lists who didn\'t get it', async () => {
    const state = initialState()
    state.guests.push({ ...state.guests[0], id: 'new-g', name: 'Zoe Park', email: '', phone: '(512) 555-0999', invite: 'not_sent', rsvp: null, token: 'new-g-t', tags: [] })
    const { user } = renderApp('/app/events/acme/guests/invitations', { state })
    expect(screen.getByRole('option', { name: 'Not yet invited · 1' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send invitations' }))
    expect(screen.getByText('Sent to 1 household')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'See who' }))
    const dialog = screen.getByRole('dialog', { name: 'Not delivered' })
    expect(within(dialog).getByText(/Email bounced/)).toBeInTheDocument()
    expect(within(dialog).getByText(/Replied STOP/)).toBeInTheDocument()
  })
})

describe('PL-5.2 Website & RSVP', () => {
  it('saves settings and refuses a bad fund link', async () => {
    const { user } = renderApp('/app/events/acme/guests/website')
    await user.type(screen.getByLabelText('Registry or fund link'), 'honeyfund')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText(/full web address/)).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Registry or fund link'))
    await user.click(screen.getByRole('radio', { name: 'Public' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Website saved')).toBeInTheDocument()
  })
})

describe('PL-4.7 Money', () => {
  it('the owner sees estimated profit', () => {
    renderApp('/app/events/acme/money')
    expect(screen.getByText('Estimated profit')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open invoice #1031' })).toBeInTheDocument()
  })

  it('a coordinator sees money but never profit; staff without the switch see nothing', () => {
    const devon = initialState()
    devon.ui.memberId = 'devon'
    const { unmount } = renderApp('/app/events/acme/money', { state: devon })
    expect(screen.getByText('Client price')).toBeInTheDocument()
    expect(screen.queryByText('Estimated profit')).not.toBeInTheDocument()
    unmount()
    const sam = initialState()
    sam.ui.memberId = 'sam'
    renderApp('/app/events/acme/money', { state: sam })
    expect(screen.getByText('Money is private for this event')).toBeInTheDocument()
  })
})

describe('PL-4.5 Files and PL-4.6 Messages', () => {
  it('marks a file shared or private', async () => {
    const { user } = renderApp('/app/events/acme/files')
    const box = screen.getByRole('checkbox', { name: /Vendor costs/ })
    expect(box).not.toBeChecked()
    await user.click(box)
    expect(screen.getByRole('checkbox', { name: /Vendor costs/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Vendor costs/ }).closest('label')).toHaveTextContent('Shared with client')
  })

  it('posts to the client thread and shows failed deliveries on a vendor thread', async () => {
    const { user } = renderApp('/app/events/acme/messages')
    await user.type(screen.getByLabelText('Message'), 'Menu looks great!')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByText('Menu looks great!')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /DJ Rhythm/ }))
    expect(screen.getByText(/Not delivered to DJ Rhythm by SMS \(replied STOP\)/)).toBeInTheDocument()
    expect(screen.getByText(/the client can't see this thread/)).toBeInTheDocument()
  })
})

describe('PL-3.6 Reschedule and PL-3.7 Cancel', () => {
  it('checks the new date and needs confirmation', async () => {
    const { user } = renderApp('/app/events/patel/reschedule')
    await user.type(screen.getByLabelText('New date'), '2026-12-12')
    expect(screen.getByText('Acme holiday party is already booked that day')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm new date' })).toBeDisabled()
    await user.clear(screen.getByLabelText('New date'))
    await user.type(screen.getByLabelText('New date'), '2027-03-10')
    await user.click(screen.getByRole('button', { name: 'Confirm new date' }))
    expect(screen.getByText(/Wed, Mar 10, 2027 ·/)).toBeInTheDocument()
  })

  it('shows the refund and asks to type CANCEL', async () => {
    const { user } = renderApp('/app/events/acme/cancel')
    expect(screen.getByText('$2,400.00')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Cancel Acme holiday party' })
    expect(button).toBeDisabled()
    await user.type(screen.getByLabelText('Type CANCEL to confirm'), 'cancel')
    await user.click(button)
    expect(screen.getByText(/This event was cancelled/)).toBeInTheDocument()
  })
})

describe('PL-4.8 Calendar', () => {
  it('shows the month with events and the travel-time warning', async () => {
    const { user } = renderApp('/app/calendar')
    expect(screen.getByRole('group', { name: 'November 2026' })).toBeInTheDocument()
    expect(screen.getByText(/Only 15 min between/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'List' }))
    expect(screen.getByRole('link', { name: '7:00 PM Acme holiday party' })).toHaveAttribute('href', '/app/events/acme')
  })
})
