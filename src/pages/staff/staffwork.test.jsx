// Phase 9 acceptance: shifts (planner) and the staff app (ST-2.1 to ST-5.2, ST-4.6).
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState } from '../../store/reducer'

const as = (staffId) => { const s = initialState(); s.ui.staffId = staffId; return s }

describe('PL-6.1 planner: Logistics › Staff', () => {
  it('suggests qualified staff for an open shift and offers it', async () => {
    const { user } = renderApp('/app/events/acme/logistics/staff')
    expect(screen.getByText(/Shifts · Dec 12 · 1 open/)).toBeInTheDocument()
    const select = screen.getByLabelText('Offer Teardown to')
    expect(within(select).getByRole('option', { name: 'Sam Ortiz (suggested)' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Devon Brooks (on another shift)' })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: 'Keisha Grant (no skill)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Offer shift' }))
    expect(screen.getByText('Offered to Sam')).toBeInTheDocument()
  })

  it('approves a swap request', async () => {
    const { user } = renderApp('/app/events/acme/logistics/staff')
    expect(screen.getByText(/Sam asked to swap with Marcus Hill/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve swap' }))
    expect(screen.getByText('Marcus now has the shift')).toBeInTheDocument()
  })

  it('approves a timesheet, then exports payroll', async () => {
    const { user } = renderApp('/app/events/okafor/logistics/staff')
    await user.click(screen.getByRole('button', { name: 'Approve hours' }))
    URL.createObjectURL = () => 'blob:payroll'
    URL.revokeObjectURL = () => {}
    await user.click(screen.getByRole('button', { name: 'Export payroll (1)' }))
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })
})

describe('the staff app', () => {
  it('ST-2.2 accepts an offered shift', async () => {
    const { user } = renderApp('/app/staff/shifts', { role: 'staff', state: as('keisha') })
    const offers = screen.getByRole('heading', { name: 'New offers (1)' }).closest('section')
    await user.click(within(offers).getByRole('link', { name: /KJ · Acme holiday party/ }))
    await user.click(screen.getByRole('button', { name: 'Accept' }))
    expect(screen.getByText("Shift accepted. It's on your calendar.")).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Call sheet' })).toBeInTheDocument()
  })

  it('ST-3.1 / ST-3.3 shows the call sheet and downloads for offline', async () => {
    const { user } = renderApp('/app/staff/shifts/sh3', { role: 'staff' })
    expect(screen.getByText('All black, closed-toe shoes, name badge')).toBeInTheDocument()
    expect(screen.getByText(/Load in: photo booth and karaoke gear/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Download for offline' }))
    expect(screen.getByText(/On this phone since/)).toBeInTheDocument()
  })

  it('ST-2.3 requests a swap with a qualified coworker; with none, says so', async () => {
    const state = as('keisha')
    state.shifts.find((s) => s.id === 'sh4').status = 'accepted'
    const { user } = renderApp('/app/staff/shifts/sh4', { role: 'staff', state })
    expect(screen.getByText(/No qualified coworker is free that day/)).toBeInTheDocument()   // nobody else is a KJ
    state.team.find((m) => m.id === 'marcus').skills.push('KJ')
    await user.click(screen.getAllByRole('link', { name: 'My Shifts' })[0])
    await user.click(screen.getByRole('link', { name: /KJ · Acme holiday party/ }))
    await user.selectOptions(screen.getByLabelText('Swap with'), 'marcus')
    await user.click(screen.getByRole('button', { name: 'Request swap' }))
    expect(screen.getByText(/Waiting for the planner to approve/)).toBeInTheDocument()
  })

  it('ST-4.1 / ST-5.2 clocks in away from the venue with a reason, then out with a break', async () => {
    const { user } = renderApp('/app/staff/shifts/sh2', { role: 'staff', state: as('devon') })
    await user.click(screen.getByRole('button', { name: "I'm not at the venue" }))
    await user.type(screen.getByLabelText('Why are you clocking in away from the venue?'), 'Picking up ice')
    await user.click(screen.getByRole('button', { name: 'Clock in with a reason' }))
    await user.type(screen.getByLabelText('Break (minutes)'), '15')
    await user.click(screen.getByRole('button', { name: 'Clock out' }))
    expect(screen.getByText('Waiting for approval')).toBeInTheDocument()
  })

  it('ST-2.1 saves availability', async () => {
    const { user } = renderApp('/app/staff/availability', { role: 'staff' })
    await user.click(screen.getByRole('checkbox', { name: 'Mon' }))
    await user.type(screen.getByLabelText('Add a day off'), '2026-12-24')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('button', { name: 'Save availability' }))
    expect(screen.getByText('Availability saved')).toBeInTheDocument()
    expect(screen.getByText('Thu, Dec 24, 2026')).toBeInTheDocument()
  })

  it('ST-3.2 scans labels into the van and flags what is missing', async () => {
    const { user } = renderApp('/app/staff/pack/acme', { role: 'staff' })
    await user.type(screen.getByLabelText('Label code'), 'CR-BC-01')
    await user.click(screen.getByRole('button', { name: 'Scan' }))
    expect(screen.getByText('Packed: Booth camera + tablet')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done packing' }))
    expect(screen.getByText('16 missing items flagged to the planner')).toBeInTheDocument()
  })

  it('ST-4.6 posts to the team chat with an alert', async () => {
    const { user } = renderApp('/app/staff/chat', { role: 'staff' })
    await user.type(screen.getByLabelText('Message'), 'Running 5 min late')
    await user.click(screen.getByRole('checkbox', { name: 'Alert the whole crew' }))
    await user.click(screen.getByRole('button', { name: 'Send alert' }))
    expect(screen.getByText('Running 5 min late')).toBeInTheDocument()
  })
})
