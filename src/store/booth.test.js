// Phase 13: photo booth, magnets, galleries and thank-yous.
import { reducer, initialState } from './reducer'
import { boothStats, galleryAccess, getEvent, getPhotos, magnetsLeft, printQueue, thankYouList } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)
const booth = (s) => getEvent(s, 'acme').booth

describe('the kiosk (GU-5.3)', () => {
  it('takes 3 shots, prints the strip and shares only when asked', () => {
    const s = run(initialState(), { type: 'booth/session', eventId: 'acme', id: 'b1', share: { to: '(512) 555-0500' } })
    expect(getPhotos(s, 'acme', 'slideshow')).toHaveLength(3)
    expect(boothStats(s, 'acme')).toMatchObject({ sessions: 1, prints: 2, shared: 1 })
    expect(booth(s).paper).toBe(298)
    expect(s.outbox[0]).toMatchObject({ type: 'sms', to: '(512) 555-0500', link: { to: '/e/acme/gallery?s=b1' } })
  })

  it('kids in the photo: nothing is shared and the photos stay off the slideshow and gallery', () => {
    const before = initialState()
    const s = run(before, { type: 'booth/session', eventId: 'acme', id: 'b2', child: true, share: { to: 'kid@example.com' } })
    expect(s.outbox).toHaveLength(before.outbox.length)
    expect(getPhotos(s, 'acme', 'slideshow')).toHaveLength(0)
    expect(getPhotos(s, 'acme', 'gallery')).toHaveLength(0)
    expect(getPhotos(s, 'acme', 'all')).toHaveLength(3)
  })

  it('"Don\'t show on slideshow" keeps them in the gallery only', () => {
    const s = run(initialState(), { type: 'booth/session', eventId: 'acme', id: 'b3', hideFromSlideshow: true })
    expect(getPhotos(s, 'acme', 'slideshow')).toHaveLength(0)
    expect(getPhotos(s, 'acme', 'gallery')).toHaveLength(3)
  })
})

describe('the attendant (ST-4.4)', () => {
  it('a jam holds prints and alerts the planner; fixing it prints them', () => {
    let s = run(initialState(), { type: 'booth/printer', eventId: 'acme', status: 'jam' })
    expect(s.outbox[0].subject).toBe('Booth printer jammed')
    s = run(s, { type: 'booth/session', eventId: 'acme', id: 'b1' }, { type: 'booth/session', eventId: 'acme', id: 'b2' })
    expect(printQueue(s, 'acme').map((p) => p.status)).toEqual(['held', 'held'])
    s = run(s, { type: 'booth/printer', eventId: 'acme', status: 'ready' })
    expect(printQueue(s, 'acme')).toHaveLength(0)
    expect(boothStats(s, 'acme').prints).toBe(4)
  })

  it('running out of paper pauses printing until a refill', () => {
    let s = initialState()
    getEvent(s, 'acme').booth.paper = 2
    s = run(s, { type: 'booth/session', eventId: 'acme', id: 'b1' })
    expect(booth(s)).toMatchObject({ paper: 0, printer: 'out' })
    s = run(s, { type: 'booth/session', eventId: 'acme', id: 'b2' })
    expect(printQueue(s, 'acme')).toHaveLength(1)
    s = run(s, { type: 'booth/refill', eventId: 'acme', paper: 100, ink: true }, { type: 'booth/printer', eventId: 'acme', status: 'ready' })
    expect(printQueue(s, 'acme')).toHaveLength(0)
  })

  it('hides a photo from the slideshow and reprints', () => {
    let s = run(initialState(), { type: 'photo/hide', photoId: 'wp1', hidden: true })
    expect(getPhotos(s, 'westlake', 'slideshow').some((p) => p.id === 'wp1')).toBe(false)
    s = run(s, { type: 'booth/reprint', printId: 'wpr1' })
    expect(boothStats(s, 'westlake').prints).toBe(7)
  })
})

describe('magnets (GU-5.4)', () => {
  it('a phone photo joins the magnet queue; the attendant crops and prints it', () => {
    let s = run(initialState(), { type: 'magnet/request', eventId: 'acme', id: 'm1', by: 'Dana Lee' })
    const p = printQueue(s, 'acme')[0]
    expect(p).toMatchObject({ kind: 'magnet', status: 'queued' })
    s = run(s, { type: 'magnet/print', printId: p.id, crop: 'top' })
    expect(magnetsLeft(s, 'acme')).toBe(49)
  })

  it('stops when the magnets run out', () => {
    const s = initialState()
    getEvent(s, 'acme').booth.magnets = 0
    expect(run(s, { type: 'magnet/request', eventId: 'acme', by: 'X' }).photos).toHaveLength(s.photos.length)
  })
})

describe('galleries and thank-yous (CL-6.1, CL-6.2, GU-6.1, PL-8.4)', () => {
  it('a gallery can be private (link only) and expires on the planner\'s date', () => {
    const e = { booth: { galleryPrivate: true, galleryExpires: '2027-01-03' } }
    expect(galleryAccess(e, false)).toBe('private')
    expect(galleryAccess(e, true)).toBe('open')
    expect(galleryAccess({ booth: { galleryExpires: '2026-11-01' } }, true)).toBe('expired')
  })

  it('guests upload photos and post recipes', () => {
    const s = run(initialState(), { type: 'photo/upload', eventId: 'westlake', by: 'Ms. Ito', name: 'class.jpg' }, { type: 'recipe/post', eventId: 'hope', by: 'Gloria', dish: 'Chicken enchiladas', text: 'Two cans of green sauce…' })
    expect(getPhotos(s, 'westlake').find((p) => p.by === 'Ms. Ito')).toBeTruthy()
    expect(s.recipes).toHaveLength(1)
  })

  it('tracks gifts and thank-you notes', () => {
    let s = initialState()
    expect(thankYouList(s, 'thompson').map((g) => g.name)).toEqual(['Lorraine Ellis', 'Pastor Lewis', 'Veterans Post 76'])
    s = run(s, { type: 'guest/thankYou', guestId: 'th-g3', sent: true })
    expect(thankYouList(s, 'thompson').at(-1).name).toBe('Pastor Lewis')
  })

  it('sends attending guests a thank-you with their gallery link', () => {
    const s = run(initialState(), { type: 'guests/thankYouGallery', eventId: 'acme' })
    expect(s.outbox[0].link.to).toMatch(/^\/e\/acme\/gallery\?t=acme-g/)
  })
})
