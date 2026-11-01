// =====================================================================
// Karaoke (product Phase 3): setup (PL-6.4), the client's lists (CL-3.7),
// requests from guests' phones or the KJ (GU-5.5), and the KJ console
// (ST-4.5): fair rotation, move up/down, VIP bump, Next singer (texts the
// guest who is 2 away), no-shows (to the end once, then removed), contest
// scoring. Requests are append-only rows, so phones can't collide (NFR-4).
// =====================================================================
import { nowStamp } from '../../lib/clock'
import { fairOrder, getSong, karaokeQueue, songStatus } from '../selectors'
import { newId, updateById, withMessage, withToast, firstName } from '../helpers'

const eventOf = (state, id) => state.events.find((e) => e.id === id)
const owner = (state) => state.team.find((m) => m.role === 'owner')
const setKaraoke = (state, eventId, changes) => ({ ...state, events: updateById(state.events, eventId, (e) => ({ karaoke: { ...e.karaoke, ...changes } })) })
const setRequest = (state, id, change) => ({ ...state, songRequests: updateById(state.songRequests, id, change) })
const BLOCKED = { explicit: 'not on tonight’s clean list', doNotPlay: 'not on tonight’s list', banned: 'not on tonight’s list' }

/** Promote the first queued request to "singing"; text whoever is now 2 singers away. */
function callNext(state, eventId) {
  const queued = karaokeQueue(state, eventId).filter((r) => r.status === 'queued')
  if (!queued.length) return state
  let next = setRequest(state, queued[0].id, { status: 'singing', startedAt: nowStamp() })
  const twoAway = queued[2]
  if (twoAway?.contact && !twoAway.texted) {
    next = withMessage(next, { type: 'sms', to: twoAway.contact, from: state.business.name, subject: 'Karaoke: almost your turn', body: `${firstName(twoAway.singer)}, you're 2 singers away! “${getSong(state, twoAway.songId).title}” is coming up. Head to the stage.` })
    next = setRequest(next, twoAway.id, { texted: true })
  }
  return next
}

export const karaokeActions = {
  // ---- Setup (PL-6.4) and the client's lists (CL-3.7) ----
  'karaoke/configure': (state, a) => setKaraoke(state, a.eventId, a.changes),
  'karaoke/setLists': (state, a) => {
    const event = eventOf(state, a.eventId)
    let next = setKaraoke(state, event.id, { doNotPlay: a.doNotPlay, mustPlay: a.mustPlay })
    next = withMessage(next, {
      type: 'push', to: `${firstName(owner(state)?.name)} (planner)`, from: `${state.business.name} · Crowned`,
      subject: 'Karaoke lists updated', body: `${event.name}: ${a.mustPlay.length} must-play, ${a.doNotPlay.length} do-not-play`,
      link: { label: 'Open', to: `/app/events/${event.id}/logistics/entertainment`, role: 'planner' },
    })
    return withToast(next, 'Saved. Your KJ will see these lists.')
  },
  'karaoke/downloadOffline': (state, a) => withToast(setKaraoke(state, a.eventId, { offlineAt: nowStamp() }), 'Event saved to the tablets for offline use'),

  // ---- A request (GU-5.5 from a phone, or the KJ adds a paper/verbal one) ----
  'karaoke/request': (state, a) => {
    const event = eventOf(state, a.eventId)
    const song = getSong(state, a.songId)
    if (!event?.karaoke?.enabled || !song || !a.singer?.trim()) return state
    const status = songStatus(event, song)
    if (status !== 'ok') return withToast(state, `“${song.title}” is ${BLOCKED[status]}.`, 'warning')
    const mine = karaokeQueue(state, event.id).filter((r) => r.status === 'queued' && r.singer.trim().toLowerCase() === a.singer.trim().toLowerCase())
    if (a.source !== 'manual' && mine.length >= event.karaoke.perSinger) {
      return withToast(state, `You have ${mine.length} songs waiting. Add another after you sing.`, 'warning')   // rate limit per singer (NFR-9)
    }
    const request = {
      id: a.id ?? newId('kr'), eventId: event.id, songId: song.id, singer: a.singer.trim(), stageName: a.stageName?.trim() ?? '',
      partners: (a.partners ?? []).map((p) => p.trim()).filter(Boolean), contact: a.contact?.trim() ?? '', source: a.source ?? 'phone',
      vip: false, status: 'queued', order: fairOrder(state, event.id, a.singer), skippedOnce: false, at: nowStamp(), scores: [],
    }
    return withToast({ ...state, songRequests: [...state.songRequests, request] }, `“${song.title}” is in the line`)
  },

  // ---- The KJ console (ST-4.5) ----
  'karaoke/move': (state, a) => {
    const r = state.songRequests.find((x) => x.id === a.id)
    const queued = karaokeQueue(state, r.eventId).filter((x) => x.status === 'queued')
    const i = queued.findIndex((x) => x.id === a.id)
    const other = queued[i + a.dir]
    if (!other) return state
    return setRequest(setRequest(state, r.id, { order: other.order }), other.id, { order: r.order })
  },
  // Bump a VIP (the birthday girl, the CEO) to the front of the line
  'karaoke/vip': (state, a) => {
    const r = state.songRequests.find((x) => x.id === a.id)
    const first = karaokeQueue(state, r.eventId).find((x) => x.status === 'queued')
    return withToast(setRequest(state, r.id, { vip: true, order: (first?.order ?? 1) - 1 }), `${r.stageName || r.singer} is up next`)
  },
  'karaoke/next': (state, a) => {
    const singing = karaokeQueue(state, a.eventId).find((r) => r.status === 'singing')
    const next = singing ? setRequest(state, singing.id, { status: 'done', doneAt: nowStamp() }) : state
    return callNext(next, a.eventId)
  },
  // Not there when called: to the end of the line once, then off the list
  'karaoke/noShow': (state, a) => {
    const r = state.songRequests.find((x) => x.id === a.id)
    if (!r) return state
    const wasSinging = r.status === 'singing'
    const last = karaokeQueue(state, r.eventId).at(-1)
    let next = r.skippedOnce
      ? setRequest(state, r.id, { status: 'removed' })
      : setRequest(state, r.id, { status: 'queued', skippedOnce: true, order: (last?.order ?? 0) + 1 })
    if (wasSinging) next = callNext(next, r.eventId)
    return withToast(next, r.skippedOnce ? `${r.singer} was a no-show twice and is off the list` : `${r.singer} moved to the end of the line`)
  },
  'karaoke/remove': (state, a) => setRequest(state, a.id, { status: 'removed' }),
  'karaoke/restore': (state, a) => setRequest(state, a.id, { status: 'queued' }),
  // Contest mode: each judge scores 1–10
  'karaoke/score': (state, a) => {
    const score = Math.min(10, Math.max(1, Number(a.score) || 0))
    return setRequest(state, a.id, (r) => ({ scores: [...r.scores.filter((s) => s.judge !== a.judge), { judge: a.judge, score }] }))
  },
}
