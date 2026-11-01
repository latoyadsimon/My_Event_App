// =====================================================================
// Photo booth, magnets and galleries (product Phase 3).
// Shapes follow the "Later phases" tables in data_dictionary.md
// (photos, booth_sessions, prints).
//   • a photo has no file in the demo unless someone uploads one (src);
//     booth shots are drawn as a colored tile wearing the event's overlay
//   • source: booth | magnet | guest · hidden = kept off the slideshow
//   • child = taken in a "kids in the photo" session: no sharing, private
// The Westlake PTA gala (Oct 3) is the finished example; Acme (Dec 12) is set up.
// =====================================================================

export const BOOTH_OVERLAYS = [
  { id: 'classic', name: 'Classic white frame' },
  { id: 'gold', name: 'Gold deco' },
  { id: 'floral', name: 'Garden florals' },
  { id: 'minimal', name: 'Minimal (name and date)' },
]
export const MAGNET_FRAMES = [
  { id: 'classic', name: 'Classic border' },
  { id: 'hearts', name: 'Little hearts' },
  { id: 'gold', name: 'Gold edge' },
]
export const BOOTH_PIN = '2468'   // demo PIN for the attendant panel

/** Off until the event has a photo booth (PL-6.4). */
export const defaultBooth = () => ({
  enabled: false, overlay: 'classic', magnetFrame: 'classic', printLimit: 2, copies: 1, magnets: 0,
  paper: 200, ink: 100, printer: 'ready', galleryExpires: null, galleryPrivate: false, offlineAt: null, deviceId: null,
})

export const boothDetails = {
  acme: { enabled: true, overlay: 'gold', magnetFrame: 'gold', printLimit: 2, copies: 2, magnets: 50, paper: 300, ink: 100, printer: 'ready', galleryExpires: '2027-03-12', galleryPrivate: false, offlineAt: null, deviceId: null },
  garza: { enabled: true, overlay: 'floral', magnetFrame: 'hearts', printLimit: 2, copies: 2, magnets: 0, paper: 300, ink: 100, printer: 'ready', galleryExpires: null, galleryPrivate: false, offlineAt: null, deviceId: null },
  westlake: { enabled: true, overlay: 'classic', magnetFrame: 'classic', printLimit: 2, copies: 1, magnets: 30, paper: 142, ink: 61, printer: 'ready', galleryExpires: '2027-01-03', galleryPrivate: false, offlineAt: null, deviceId: null },
}

const photo = (n, extra = {}) => ({
  id: `wp${n}`, eventId: 'westlake', sessionId: `ws${Math.ceil(n / 3)}`, source: 'booth', hue: (n * 47) % 360, by: 'Photo booth',
  at: `2026-10-03T${String(19 + Math.floor(n / 6)).padStart(2, '0')}:${String((n * 7) % 60).padStart(2, '0')}:00`, hidden: false, child: false, src: null, ...extra,
})
export const photos = [
  ...Array.from({ length: 12 }, (_, i) => photo(i + 1)),
  photo(13, { source: 'magnet', sessionId: null, by: 'Ms. Alvarez' }),
  photo(14, { source: 'magnet', sessionId: null, by: 'Coach Reed' }),
  photo(15, { source: 'guest', sessionId: null, by: 'Karen Holt' }),
  photo(16, { source: 'guest', sessionId: null, by: 'Tom Nakamura' }),
  photo(17, { hidden: true }),                       // hidden from the slideshow by the attendant
]
export const boothSessions = Array.from({ length: 6 }, (_, i) => ({
  id: `ws${i + 1}`, eventId: 'westlake', at: `2026-10-03T${19 + Math.floor(i / 3)}:${String(10 + i * 8).padStart(2, '0')}:00`,
  shared: i % 2 ? { channel: 'text' } : null, child: false, copies: 1,
}))
export const prints = [
  ...boothSessions.map((s, i) => ({ id: `wpr${i + 1}`, eventId: 'westlake', photoId: `wp${i * 3 + 1}`, kind: 'strip', copies: 1, status: 'printed', at: s.at })),
  { id: 'wpr7', eventId: 'westlake', photoId: 'wp13', kind: 'magnet', copies: 1, status: 'printed', at: '2026-10-03T20:30:00', crop: 'center' },
  { id: 'wpr8', eventId: 'westlake', photoId: 'wp14', kind: 'magnet', copies: 1, status: 'printed', at: '2026-10-03T20:45:00', crop: 'center' },
]
// Recipes posted to a potluck's gallery afterwards (GU-6.1)
export const recipes = []
