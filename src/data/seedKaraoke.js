// =====================================================================
// Karaoke (product Phase 3): the business's song catalog and each event's
// karaoke settings and request queue.
// Shapes follow the "Later phases" tables in data_dictionary.md
// (songs, song_requests).
//   • explicit songs are hidden by the "clean only" filter; cleanId points
//     at the radio edit when one exists (GU-5.5 suggests it)
//   • requests: status queued | singing | done | removed; `order` sets the
//     line (fair rotation decides where a new one goes; the KJ can move it)
// =====================================================================

const song = (id, title, artist, extra = {}) => ({ id, title, artist, explicit: false, cleanId: null, duet: false, ...extra })
export const songs = [
  song('s1', 'Don’t Stop Believin’', 'Journey'),
  song('s2', 'Bohemian Rhapsody', 'Queen'),
  song('s3', 'September', 'Earth, Wind & Fire'),
  song('s4', 'I Will Survive', 'Gloria Gaynor'),
  song('s5', 'Dancing Queen', 'ABBA'),
  song('s6', 'Shallow', 'Lady Gaga & Bradley Cooper', { duet: true }),
  song('s7', 'Islands in the Stream', 'Dolly Parton & Kenny Rogers', { duet: true }),
  song('s8', 'Sweet Caroline', 'Neil Diamond'),
  song('s9', 'Livin’ on a Prayer', 'Bon Jovi'),
  song('s10', 'Rolling in the Deep', 'Adele'),
  song('s11', 'Uptown Funk', 'Mark Ronson ft. Bruno Mars'),
  song('s12', 'Valerie', 'Amy Winehouse'),
  song('s13', 'I Wanna Dance with Somebody', 'Whitney Houston'),
  song('s14', 'Total Eclipse of the Heart', 'Bonnie Tyler'),
  song('s15', 'Friends in Low Places', 'Garth Brooks'),
  song('s16', 'Before He Cheats', 'Carrie Underwood'),
  song('s17', 'Wannabe', 'Spice Girls'),
  song('s18', 'No Scrubs', 'TLC'),
  song('s19', 'Crazy in Love', 'Beyoncé ft. Jay-Z'),
  song('s20', 'Gold Digger', 'Kanye West ft. Jamie Foxx', { explicit: true }),
  song('s21', 'Gold Digger (Clean)', 'Kanye West ft. Jamie Foxx'),
  song('s22', 'Forget You', 'CeeLo Green'),
  song('s23', 'F**k You', 'CeeLo Green', { explicit: true, cleanId: 's22' }),
  song('s24', 'Love Shack', 'The B-52’s'),
  song('s25', 'Total Praise', 'Richard Smallwood'),
  song('s26', 'Proud Mary', 'Tina Turner'),
  song('s27', 'Billie Jean', 'Michael Jackson'),
  song('s28', 'Shake It Off', 'Taylor Swift'),
  song('s29', 'Mr. Brightside', 'The Killers'),
  song('s30', 'Baby Got Back', 'Sir Mix-a-Lot', { explicit: true }),
  song('s31', 'Despacito', 'Luis Fonsi & Daddy Yankee'),
  song('s32', 'Bidi Bidi Bom Bom', 'Selena'),
  song('s33', 'Ain’t No Mountain High Enough', 'Marvin Gaye & Tammi Terrell', { duet: true }),
  song('s34', 'My Girl', 'The Temptations'),
  song('s35', 'Wagon Wheel', 'Darius Rucker'),
  song('s36', 'Happy', 'Pharrell Williams'),
]
songs.find((s) => s.id === 's20').cleanId = 's21'

/** Off until the event has karaoke (PL-6.4). */
export const defaultKaraoke = () => ({
  enabled: false, filter: 'clean', doNotPlay: [], mustPlay: [], banned: [], kjMemberId: null, music: false, contest: false, perSinger: 2, offlineAt: null,
})

// Per-event karaoke settings (merged into seed events)
export const karaokeDetails = {
  acme: {
    enabled: true, filter: 'clean', kjMemberId: 'keisha', music: false, contest: false, perSinger: 2, offlineAt: null,
    doNotPlay: ['s16'],                                 // Priya: nothing about cheating at the office party
    mustPlay: ['s3', 's1'],                             // "September" and "Don't Stop Believin'" for the closer
    banned: [],
  },
  patel: { enabled: true, filter: 'all', kjMemberId: 'keisha', music: false, contest: true, perSinger: 2, offlineAt: null, doNotPlay: [], mustPlay: ['s34'], banned: [] },
  okafor: { enabled: true, filter: 'all', kjMemberId: 'keisha', music: false, contest: false, perSinger: 2, offlineAt: null, doNotPlay: [], mustPlay: [], banned: [] },
}

// The Okafor 50th (Oct 17): last month's karaoke night, for the report and the history
const req = (id, eventId, songId, singer, order, extra = {}) =>
  ({ id, eventId, songId, singer, stageName: '', partners: [], contact: '', source: 'phone', vip: false, status: 'done', order, skippedOnce: false, at: '2026-10-17T20:00:00', scores: [], ...extra })
export const songRequests = [
  req('kr1', 'okafor', 's26', 'Chidi', 1, { vip: true }),
  req('kr2', 'okafor', 's4', 'Auntie Ngozi', 2),
  req('kr3', 'okafor', 's33', 'Emeka', 3, { partners: ['Ada'] }),
  req('kr4', 'okafor', 's27', 'Tunde', 4),
  req('kr5', 'okafor', 's3', 'Chidi', 5),
  req('kr6', 'okafor', 's3', 'Everyone!', 6),   // September twice: the song of the night
]
