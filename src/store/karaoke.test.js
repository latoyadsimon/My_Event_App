// Phase 12: karaoke requests, the fair queue and the KJ console.
import { reducer, initialState } from './reducer'
import { contestResults, getEvent, karaokeQueue, karaokeStats, placeInLine, searchSongs } from './selectors'

const run = (state, ...actions) => actions.reduce(reducer, state)
const ask = (id, singer, songId, extra = {}) => ({ type: 'karaoke/request', eventId: 'acme', id, singer, songId, ...extra })
const line = (s) => karaokeQueue(s, 'acme').map((r) => `${r.singer}:${r.song.title}`)

describe('songs and lists (GU-5.5, CL-3.7)', () => {
  it('clean night: explicit songs are unavailable and the clean version is suggested', () => {
    const [explicit] = searchSongs(initialState(), 'acme', 'ceelo').filter((s) => s.explicit)
    expect(explicit).toMatchObject({ status: 'explicit', clean: { title: 'Forget You' } })
    const s = run(initialState(), ask('r1', 'Marcus', 's23'))
    expect(s.songRequests.filter((r) => r.eventId === 'acme')).toHaveLength(0)
  })

  it('the client’s do-not-play list blocks a song', () => {
    expect(searchSongs(initialState(), 'acme', 'before he')[0].status).toBe('doNotPlay')
  })

  it('karaoke on the proposal turns karaoke on at countersign', () => {
    const s = run(initialState(),
      { type: 'proposal/accept', leadId: 'rivera', chosen: [] },
      { type: 'contract/clientSign', contractId: 'rivera', signature: 'Ana Rivera', consent: true },
      { type: 'payment/succeeded', invoiceId: 'rivera', installmentId: 'rivera-1', method: 'Visa ·4242' },
      { type: 'contract/countersign', contractId: 'rivera', signature: 'LaToya Simon' })
    expect(getEvent(s, 'rivera').karaoke.enabled).toBe(true)
  })
})

describe('the queue (ST-4.5)', () => {
  it('fair rotation: a second song waits until everyone has had a first', () => {
    const s = run(initialState(), ask('a1', 'Ana', 's3'), ask('a2', 'Ana', 's5'), ask('b1', 'Ben', 's1'), ask('c1', 'Cy', 's8'))
    expect(line(s)).toEqual(['Ana:September', 'Ben:Don’t Stop Believin’', 'Cy:Sweet Caroline', 'Ana:Dancing Queen'])
  })

  it('limits each singer to 2 waiting songs from phones', () => {
    const s = run(initialState(), ask('a1', 'Ana', 's3'), ask('a2', 'Ana', 's5'), ask('a3', 'Ana', 's8'))
    expect(line(s)).toHaveLength(2)
    expect(s.toasts.at(-1).tone).toBe('warning')
  })

  it('Next singer moves the line and texts the guest who is 2 singers away', () => {
    let s = run(initialState(), ask('a1', 'Ana', 's3'), ask('b1', 'Ben', 's1'), ask('c1', 'Cy', 's8', { contact: '(512) 555-0777' }))
    s = run(s, { type: 'karaoke/next', eventId: 'acme' })
    expect(placeInLine(s, 'a1')).toBe(0)
    expect(placeInLine(s, 'c1')).toBe(2)
    expect(s.outbox[0]).toMatchObject({ to: '(512) 555-0777', subject: 'Karaoke: almost your turn' })
    s = run(s, { type: 'karaoke/next', eventId: 'acme' })
    expect(karaokeStats(s, 'acme')).toMatchObject({ sung: 1, waiting: 1 })
  })

  it('a VIP jumps to the front; the KJ can move people up and down', () => {
    let s = run(initialState(), ask('a1', 'Ana', 's3'), ask('b1', 'Ben', 's1'), ask('c1', 'Priya', 's13'))
    s = run(s, { type: 'karaoke/vip', id: 'c1' })
    expect(line(s)[0]).toBe('Priya:I Wanna Dance with Somebody')
    s = run(s, { type: 'karaoke/move', id: 'b1', dir: -1 })
    expect(line(s)).toEqual(['Priya:I Wanna Dance with Somebody', 'Ben:Don’t Stop Believin’', 'Ana:September'])
  })

  it('no-show: to the end once, then removed', () => {
    let s = run(initialState(), ask('a1', 'Ana', 's3'), ask('b1', 'Ben', 's1'), { type: 'karaoke/next', eventId: 'acme' })
    s = run(s, { type: 'karaoke/noShow', id: 'a1' })
    expect(line(s)).toEqual(['Ben:Don’t Stop Believin’', 'Ana:September'])
    s = run(s, { type: 'karaoke/noShow', id: 'a1' })
    expect(line(s)).toEqual(['Ben:Don’t Stop Believin’'])
  })

  it('contest mode: averages the judges’ scores', () => {
    const s = run(initialState(), ask('a1', 'Ana', 's3'), ask('b1', 'Ben', 's1'),
      { type: 'karaoke/score', id: 'a1', judge: 'J1', score: 8 }, { type: 'karaoke/score', id: 'a1', judge: 'J2', score: 9 },
      { type: 'karaoke/score', id: 'b1', judge: 'J1', score: 10 })
    expect(contestResults(s, 'acme').map((r) => [r.singer, r.average])).toEqual([['Ben', 10], ['Ana', 8.5]])
  })

  it('the Okafor night’s stats', () => {
    expect(karaokeStats(initialState(), 'okafor')).toMatchObject({ sung: 6, singers: 5, topSong: { title: 'September' } })
  })
})
