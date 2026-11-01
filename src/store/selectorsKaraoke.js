// =====================================================================
// Read-only helpers for karaoke (product Phase 3): which songs are
// allowed, the fair queue, a guest's place in line, contest results
// and the night's stats. Re-exported from selectors.js.
// =====================================================================

const eventOf = (state, id) => state.events.find((e) => e.id === id)
export const getSong = (state, id) => state.songs.find((s) => s.id === id)

/** 'ok' | 'explicit' (clean-only night) | 'doNotPlay' (the client's list) | 'banned' (the KJ's list) */
export function songStatus(event, song) {
  const k = event.karaoke
  if (k.banned.includes(song.id)) return 'banned'
  if (k.doNotPlay.includes(song.id)) return 'doNotPlay'
  if (k.filter === 'clean' && song.explicit) return 'explicit'
  return 'ok'
}

/** Title or artist search, with each song's status for this event. */
export function searchSongs(state, eventId, query) {
  const event = eventOf(state, eventId)
  const q = query.trim().toLowerCase()
  const list = q ? state.songs.filter((s) => `${s.title} ${s.artist}`.toLowerCase().includes(q)) : []
  return list.slice(0, 12).map((s) => ({ ...s, status: songStatus(event, s), clean: s.cleanId ? getSong(state, s.cleanId) : null }))
}

const norm = (name) => name.trim().toLowerCase()
/** The live line: whoever is singing, then the queue in order. */
export function karaokeQueue(state, eventId) {
  const live = state.songRequests.filter((r) => r.eventId === eventId && (r.status === 'queued' || r.status === 'singing'))
  return [...live.filter((r) => r.status === 'singing'), ...live.filter((r) => r.status === 'queued').sort((a, b) => a.order - b.order)]
    .map((r) => ({ ...r, song: getSong(state, r.songId) }))
}

/**
 * Where a new request goes (fair rotation, ST-4.5): a singer's 2nd song waits
 * until everyone ahead has had their 1st, and so on. Returns an `order` value.
 */
export function fairOrder(state, eventId, singer) {
  const queue = karaokeQueue(state, eventId).filter((r) => r.status === 'queued')
  const seen = {}
  const round = queue.map((r) => (seen[norm(r.singer)] = (seen[norm(r.singer)] ?? 0) + 1))
  const mine = queue.filter((r) => norm(r.singer) === norm(singer)).length + 1
  const at = round.findIndex((n) => n > mine)
  if (at < 0) return (queue.at(-1)?.order ?? 0) + 1
  const before = queue[at - 1]?.order ?? queue[at].order - 1
  return (before + queue[at].order) / 2
}

/** 0 = singing now, 1 = up next, 2 = two singers away… (null when not in line) */
export function placeInLine(state, requestId) {
  const r = state.songRequests.find((x) => x.id === requestId)
  if (!r) return null
  const i = karaokeQueue(state, r.eventId).findIndex((x) => x.id === requestId)
  if (i < 0) return null
  return karaokeQueue(state, r.eventId)[0].status === 'singing' ? i : i + 1
}

const average = (list) => (list.length ? list.reduce((t, x) => t + x.score, 0) / list.length : null)
/** Contest mode: everyone scored so far, best first. */
export const contestResults = (state, eventId) => state.songRequests
  .filter((r) => r.eventId === eventId && r.scores?.length)
  .map((r) => ({ ...r, song: getSong(state, r.songId), average: average(r.scores) }))
  .sort((a, b) => b.average - a.average)

/** The night in numbers (event report, PL-8.5 P3; live panel, PL-7.2). */
export function karaokeStats(state, eventId) {
  const all = state.songRequests.filter((r) => r.eventId === eventId)
  const sung = all.filter((r) => r.status === 'done')
  const counts = {}
  for (const r of sung) counts[r.songId] = (counts[r.songId] ?? 0) + 1
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return {
    sung: sung.length, singers: new Set(sung.map((r) => norm(r.singer))).size,
    waiting: all.filter((r) => r.status === 'queued').length,
    topSong: top ? getSong(state, top[0]) : null,
  }
}
