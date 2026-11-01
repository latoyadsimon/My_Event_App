// Phase 13 acceptance: booth kiosk, attendant, magnets, galleries, thank-yous.
import { screen, within } from '@testing-library/react'
import { renderApp } from '../../test/renderApp'
import { initialState, reducer } from '../../store/reducer'

const asClient = (clientId) => { const s = initialState(); s.ui.clientId = clientId; return s }

describe('GU-5.3 the booth kiosk', () => {
  it('counts down, lets you retake, asks about kids, shares by text and prints', async () => {
    const { user } = renderApp('/booth/acme', { role: 'guest' })
    await user.click(screen.getByRole('button', { name: 'Tap to start' }))
    expect(await screen.findByRole('region', { name: 'Your photos' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retake' }))
    await user.click(await screen.findByRole('button', { name: 'Looks great' }))
    await user.click(screen.getByRole('button', { name: 'No' }))
    await user.type(screen.getByLabelText('Text or email them to me (optional)'), '(512) 555-0500')
    await user.click(screen.getByRole('button', { name: 'Print 2 copies' }))
    expect(screen.getByText('Your prints are coming out!')).toBeInTheDocument()
  })

  it('kids in the photo: no contact is asked for', async () => {
    const { user } = renderApp('/booth/acme', { role: 'guest' })
    await user.click(screen.getByRole('button', { name: 'Tap to start' }))
    await user.click(await screen.findByRole('button', { name: 'Looks great' }))
    await user.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.queryByLabelText('Text or email them to me (optional)')).not.toBeInTheDocument()
    expect(screen.getByText(/We won’t ask for any contact details|We won't ask for any contact details/)).toBeInTheDocument()
  })
})

describe('ST-4.4 the attendant panel', () => {
  it('needs the PIN, pauses on a jam and prints held strips when fixed', async () => {
    const state = reducer(initialState(), { type: 'booth/session', eventId: 'acme', id: 'bs1' })
    const { user } = renderApp('/app/booth/acme', { state })
    await user.type(screen.getByLabelText('Attendant PIN'), '1111')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    expect(screen.getByText('That PIN didn’t work.')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Attendant PIN'))
    await user.type(screen.getByLabelText('Attendant PIN'), '2468')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    await user.click(screen.getByRole('button', { name: 'Report a jam' }))
    expect(screen.getByText('Printer jam: printing paused')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fixed: resume printing' }))
    expect(screen.getByText('Printer ready')).toBeInTheDocument()
    await user.click(within(screen.getByRole('list', { name: 'Photos' })).getAllByRole('button', { name: 'Hide from slideshow' })[0])
    expect(screen.getByRole('button', { name: 'Show on slideshow' })).toBeInTheDocument()
  })

  it('GU-5.4 a magnet from a phone is cropped and printed', async () => {
    const state = reducer(initialState(), { type: 'magnet/request', eventId: 'acme', by: 'Dana Lee' })
    const { user } = renderApp('/app/booth/acme', { state })
    await user.type(screen.getByLabelText('Attendant PIN'), '2468')
    await user.click(screen.getByRole('button', { name: 'Unlock' }))
    await user.selectOptions(screen.getByLabelText('Crop'), 'top')
    await user.click(screen.getByRole('button', { name: 'Print magnet' }))
    expect(within(screen.getByLabelText('Booth now')).getByText('49')).toBeInTheDocument()
  })

  it('the guest magnet page takes a phone photo', async () => {
    const { user } = renderApp('/e/acme/magnet', { role: 'guest' })
    await user.upload(screen.getByLabelText('Your photo'), new File(['x'], 'us.jpg', { type: 'image/jpeg' }))
    await user.type(screen.getByLabelText('Your name'), 'Dana')
    await user.click(screen.getByRole('button', { name: 'Make my magnet' }))
    expect(screen.getByText(/Pick up your magnet at the booth/)).toBeInTheDocument()
  })
})

describe('GU-5.6 / GU-6.1 galleries', () => {
  it('the slideshow leaves out hidden photos', () => {
    renderApp('/screen/gallery/westlake')
    expect(within(screen.getByRole('list', { name: 'Live gallery' })).getAllByRole('listitem')).toHaveLength(12)
  })

  it('a guest with their link sees the gallery, uploads a photo, downloads all', async () => {
    const { user } = renderApp('/e/westlake/gallery?t=any', { role: 'guest' })
    expect(screen.getByRole('heading', { name: /Everyone’s photos \(17\)/ })).toBeInTheDocument()
    await user.upload(screen.getByLabelText('Choose photos'), new File(['x'], 'mine.jpg', { type: 'image/jpeg' }))
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    expect(screen.getByRole('heading', { name: /Everyone’s photos \(18\)/ })).toBeInTheDocument()
  })

  it('a private gallery asks for the link', () => {
    const state = initialState()
    state.events.find((e) => e.id === 'westlake').booth.galleryPrivate = true
    renderApp('/e/westlake/gallery', { role: 'guest', state })
    expect(screen.getByText(/This gallery is private/)).toBeInTheDocument()
  })

  it('a potluck gallery takes recipes', async () => {
    const { user } = renderApp('/e/hope/gallery', { role: 'guest' })
    await user.type(screen.getByLabelText('Dish'), 'Peach cobbler')
    await user.type(screen.getByLabelText('How to make it'), 'Six peaches, a cup of sugar…')
    await user.click(screen.getByRole('button', { name: 'Post' }))
    expect(screen.getByRole('heading', { name: /Peach cobbler/ })).toBeInTheDocument()
  })
})

describe('CL-6.1 / CL-6.2 / CL-3.7 the client', () => {
  it('sees every photo, filters by source, downloads all', async () => {
    const { user } = renderApp('/portal/gallery', { role: 'client', state: asClient('westlake') })
    expect(within(screen.getByRole('list', { name: 'Photos' })).getAllByRole('listitem')).toHaveLength(17)
    await user.click(screen.getByRole('button', { name: 'Magnets' }))
    expect(within(screen.getByRole('list', { name: 'Photos' })).getAllByRole('listitem')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Download all' }))
    expect(screen.getByText(/Your zip of 17 full-resolution photos is ready/)).toBeInTheDocument()
  })

  it('tracks thank-you notes for gifts', async () => {
    const state = reducer(asClient('thompson'), { type: 'event/startDay', eventId: 'thompson' })
    const { user } = renderApp('/portal/thank-yous', { role: 'client', state })
    expect(screen.getByText('0 of 3 sent')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Pastor Lewis/ }))
    expect(screen.getByText('1 of 3 sent')).toBeInTheDocument()
  })

  it('picks the booth overlay', async () => {
    const { user } = renderApp('/portal/entertainment', { role: 'client', state: asClient('acme') })
    await user.selectOptions(screen.getByLabelText('Photo overlay'), 'floral')
    await user.click(screen.getByRole('button', { name: 'Save booth choices' }))
    expect(screen.getByText('Saved. Your booth will wear it.')).toBeInTheDocument()
  })
})

describe('PL-8.4 thank-you + gallery link', () => {
  it('is sent from Wrap-up', async () => {
    let state = reducer(initialState(), { type: 'event/startDay', eventId: 'acme' })
    state = reducer(state, { type: 'event/teardownDone', eventId: 'acme' })
    const { user } = renderApp('/app/events/acme/wrap-up', { state })
    await user.click(screen.getByRole('button', { name: 'Send thank-you + gallery link' }))
    expect(screen.getByText(/Thank-you and gallery link sent to \d+ guests/)).toBeInTheDocument()
  })
})
