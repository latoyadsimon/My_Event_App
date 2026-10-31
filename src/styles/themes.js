// =====================================================================
// Event themes: the gallery a planner picks from for each event.
// A theme dresses ONE event's guest website, invitation, RSVP page and the
// event content in the client portal. (The planner's workspace uses the app's
// own Calm / Bold look from tokens.css instead.)
//
// This file is plain data, so it's easy to read and to test:
//   • the React app imports it (themeToCssVars) to style an event page
//   • app_outline/style_guide/theme_gallery.html imports it to preview every theme
//   • scripts/check_contrast.mjs imports it and fails CI if any color pair is unreadable
//
// Adding a theme = add one object to THEMES, run `npm run check:contrast`.
// The id is what gets saved in events.theme (a text column), so never rename an id.
//
// Color roles (every theme has all of them):
//   bg        page background            surface   cards, the RSVP form
//   text      body text (≥ 4.5:1)        muted     dates, small print (≥ 4.5:1)
//   accent    buttons, highlights        onAccent  text ON an accent button (≥ 4.5:1)
//   secondary second color (≥ 3:1)       border    form-field borders (≥ 3:1)
// tone: celebratory | elegant | playful | respectful
//   respectful = no confetti, sparkle, glow, sound or motion, anywhere (style guide §11)
// =====================================================================

// Working name until the owner picks one (style guide: "Open questions").
export const APP_NAME = 'Tag & Tiara';

// Small repeating background patterns, drawn with simple shapes (all original art).
// {c} is replaced with the theme's accent color. Used at low opacity, decoration only.
export const MOTIFS = {
  crown:    '<path d="M8 28l4-14 6 8 6-12 6 12 6-8 4 14z" fill="none" stroke="{c}" stroke-width="2"/><circle cx="24" cy="8" r="2" fill="{c}"/>',
  pixels:   '<rect x="6" y="6" width="6" height="6" fill="{c}"/><rect x="30" y="18" width="6" height="6" fill="{c}"/><rect x="18" y="32" width="6" height="6" fill="{c}"/>',
  plays:    '<path d="M6 6l8 8M14 6l-8 8" stroke="{c}" stroke-width="2"/><circle cx="32" cy="30" r="5" fill="none" stroke="{c}" stroke-width="2"/><path d="M14 18q10 0 14 8" fill="none" stroke="{c}" stroke-width="1.5" stroke-dasharray="3 3"/>',
  confetti: '<rect x="6" y="8" width="8" height="3" fill="{c}" transform="rotate(25 10 9)"/><circle cx="32" cy="12" r="2.5" fill="{c}"/><rect x="20" y="30" width="7" height="3" fill="{c}" transform="rotate(-30 23 31)"/><circle cx="10" cy="34" r="2" fill="{c}"/>',
  florals:  '<circle cx="20" cy="20" r="3" fill="{c}"/><circle cx="20" cy="12" r="4" fill="none" stroke="{c}"/><circle cx="20" cy="28" r="4" fill="none" stroke="{c}"/><circle cx="12" cy="20" r="4" fill="none" stroke="{c}"/><circle cx="28" cy="20" r="4" fill="none" stroke="{c}"/>',
  sparkles: '<path d="M12 4l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="{c}"/><path d="M30 24l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="{c}"/>',
  bunting:  '<path d="M0 6h40" stroke="{c}"/><path d="M4 6l5 10 5-10M18 6l5 10 5-10M32 6l4 8" fill="{c}"/>',
  stars:    '<path d="M20 6l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="none" stroke="{c}" stroke-width="1.5"/>',
  deco:     '<path d="M20 34L4 18M20 34L12 10M20 34V6M20 34l8-24M20 34l16-16" stroke="{c}" stroke-width="1.2"/>',
  film:     '<rect x="4" y="10" width="32" height="20" fill="none" stroke="{c}" stroke-width="1.5"/><rect x="7" y="13" width="3" height="3" fill="{c}"/><rect x="7" y="24" width="3" height="3" fill="{c}"/><rect x="30" y="13" width="3" height="3" fill="{c}"/><rect x="30" y="24" width="3" height="3" fill="{c}"/>',
  zigzag:   '<path d="M0 20l5-6 5 6 5-6 5 6 5-6 5 6 5-6 5 6" fill="none" stroke="{c}" stroke-width="2"/>',
  masks:    '<path d="M6 16q7-6 14 0 7-6 14 0-2 10-7 10-4 0-7-4-3 4-7 4-5 0-7-10z" fill="none" stroke="{c}" stroke-width="1.5"/>',
  leaves:   '<path d="M8 32q0-18 18-24-2 18-18 24z" fill="none" stroke="{c}" stroke-width="1.5"/><path d="M8 32l14-18" stroke="{c}"/>',
  snow:     '<path d="M20 6v28M8 13l24 14M8 27l24-14" stroke="{c}" stroke-width="1.5"/>',
  clouds:   '<path d="M8 26a6 6 0 0 1 6-8 8 8 0 0 1 15 2 5 5 0 0 1 1 10H12a4 4 0 0 1-4-4z" fill="none" stroke="{c}" stroke-width="1.5"/>',
  caps:     '<path d="M4 16l16-7 16 7-16 7z" fill="none" stroke="{c}" stroke-width="1.5"/><path d="M32 18v8" stroke="{c}"/>',
  hearts:   '<path d="M20 32s-12-7-12-15a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 8-12 15-12 15z" fill="none" stroke="{c}" stroke-width="1.5"/>',
  branch:   '<path d="M6 34q14-6 28-28" fill="none" stroke="{c}" stroke-width="1.2"/><ellipse cx="16" cy="24" rx="4" ry="2" fill="none" stroke="{c}" transform="rotate(-40 16 24)"/><ellipse cx="25" cy="15" rx="4" ry="2" fill="none" stroke="{c}" transform="rotate(-50 25 15)"/>',
  flame:    '<path d="M20 8q6 8 0 14-6-6 0-14z" fill="{c}"/><rect x="17" y="22" width="6" height="12" fill="none" stroke="{c}"/>',
  dpad:     '<path d="M16 6h8v10h10v8H24v10h-8V24H6v-8h10z" fill="none" stroke="{c}" stroke-width="1.5"/>',
  play:     '<rect x="4" y="8" width="32" height="22" rx="3" fill="none" stroke="{c}" stroke-width="1.5"/><path d="M17 14v10l9-5z" fill="{c}"/>',
};

// Shortcut so each theme below stays one readable block.
const t = (id, name, group, tone, bestFor, colors, display, motif, extra = {}) => ({
  id, name, group, tone, bestFor, colors, motif,
  fonts: { display, body: 'Inter' },
  radius: extra.radius ?? '12px',
  motion: tone === 'respectful' ? 'none' : (extra.motion ?? 'subtle'),   // none | subtle | playful
  sound: tone === 'respectful' ? false : (extra.sound ?? false),         // countdown chimes etc.
  copy: extra.copy,
  notes: extra.notes ?? '',
});
const c = (bg, surface, text, muted, accent, onAccent, secondary, border) =>
  ({ bg, surface, text, muted, accent, onAccent, secondary, border });

export const THEMES = [
  // ---- Signature ----
  t('graffiti-queen', 'Graffiti Queen', 'Signature', 'celebratory', ['birthday', 'other'],
    c('#14101F', '#1E1830', '#FFF5FB', '#C9BBD9', '#FF4FB0', '#1A0612', '#FFD23F', '#8A7AB3'),
    'Sedgwick Ave Display', 'crown',
    { motion: 'playful', sound: true, radius: '16px',
      copy: { headline: 'You\'re invited to the royal throwdown', rsvp: 'Claim your crown', thanks: 'Crowned! See you there, royalty.' },
      notes: 'The app\'s Bold mode as an event theme: street art meets tiaras.' }),
  t('neon-arcade', 'Neon Arcade', 'Signature', 'playful', ['birthday', 'reunion', 'other'],
    c('#07071A', '#11112B', '#EAFBFF', '#A9B8D9', '#00F0FF', '#00161A', '#FF3CAC', '#5A64A8'),
    'Press Start 2P', 'pixels',
    { motion: 'playful', sound: true, radius: '4px',
      copy: { headline: 'Player 2 has entered the party', rsvp: 'Press start', thanks: 'Level up! Your spot is saved.' } }),
  t('coachs-playbook', 'Coach\'s Playbook', 'Signature', 'playful', ['birthday', 'school', 'reunion', 'corporate'],
    c('#1F3A2E', '#264536', '#F4F1E8', '#C6CFC2', '#F2B705', '#1A1400', '#E8E3D3', '#8FA597'),
    'Graduate', 'plays',
    { motion: 'subtle', radius: '6px',
      copy: { headline: 'Game day: you\'re on the roster', rsvp: 'I\'m in the lineup', thanks: 'You\'re on the team. See you at kickoff!' },
      notes: 'Chalkboard plays, jersey numbers, a scoreboard countdown. No real team names or logos.' }),
  t('party-pop', 'Party Pop', 'Signature', 'celebratory', ['birthday'],
    c('#FFF8EC', '#FFFFFF', '#2A1B3D', '#5F5470', '#D81B60', '#FFFFFF', '#1F7A8C', '#9A8FA8'),
    'Fredoka', 'confetti',
    { motion: 'playful', sound: true, radius: '20px',
      copy: { headline: 'Let\'s party! You\'re invited', rsvp: 'Count me in', thanks: 'Yay! We can\'t wait to celebrate with you.' },
      notes: 'The classic themed birthday. Planners swap in the guest of honor\'s theme colors.' }),
  t('elegant-wedding', 'Elegant Wedding', 'Signature', 'elegant', ['wedding', 'bridal_shower'],
    c('#FBF8F3', '#FFFFFF', '#2F2A26', '#6A6159', '#7D6232', '#FFFFFF', '#6B7A6F', '#9A9186'),
    'Cormorant Garamond', 'florals',
    { copy: { headline: 'Together with their families', rsvp: 'Kindly reply', thanks: 'Thank you. We\'re so happy you\'ll be there.' },
      notes: 'Ivory, antique gold and sage. Script accent (Great Vibes) only for names at 36px+.' }),

  // ---- Cultural milestones (design WITH the family; avoid stereotypes and costumes) ----
  t('quinceanera', 'Quinceañera', 'Cultural milestones', 'celebratory', ['birthday'],
    c('#FDF4F8', '#FFFFFF', '#3A1730', '#6E5165', '#AD2F6D', '#FFFFFF', '#8C6A1C', '#A88A9E'),
    'Playfair Display', 'sparkles',
    { copy: { headline: 'Mis XV años: celebrate with us', rsvp: 'Confirm / Confirmar', thanks: '¡Gracias! We can\'t wait to celebrate.' },
      notes: 'Bilingual by default. Let the family choose colors; tiara and rose motifs only if they want them.' }),
  t('sweet-sixteen', 'Sweet Sixteen', 'Cultural milestones', 'celebratory', ['birthday'],
    c('#1C1026', '#261634', '#FFF0FA', '#D6BCD0', '#FF7AC6', '#1C0614', '#B9A2FF', '#8C6B9E'),
    'Fredoka', 'sparkles',
    { motion: 'playful', sound: true,
      copy: { headline: 'Sixteen and sparkling', rsvp: 'I\'ll be there', thanks: 'You\'re on the list. Get ready to dance!' } }),
  t('fiesta', 'Fiesta', 'Cultural milestones', 'celebratory', ['birthday', 'reunion', 'holiday', 'corporate'],
    c('#FFF9EF', '#FFFFFF', '#2B1D0E', '#6B5640', '#B83C0B', '#FFFFFF', '#0F766E', '#A58F75'),
    'Fredoka', 'bunting',
    { motion: 'playful',
      copy: { headline: '¡Vamos a celebrar!', rsvp: 'RSVP / Confirmar', thanks: '¡Nos vemos pronto! See you soon.' },
      notes: 'Bright bunting and warm colors. No sombreros or costume clichés.' }),
  t('milestone', 'Milestone', 'Cultural milestones', 'elegant', ['birthday', 'church'],
    c('#F5F7FB', '#FFFFFF', '#1B2541', '#55607A', '#1E3A8A', '#FFFFFF', '#8A6D1F', '#8B95AA'),
    'Playfair Display', 'stars',
    { copy: { headline: 'Please join us as we celebrate a milestone', rsvp: 'Reply', thanks: 'Thank you, your reply has been received.' },
      notes: 'For coming-of-age ceremonies such as a bar or bat mitzvah. Ask the family about religious symbols and wording before adding any.' }),

  // ---- Retro & glam ----
  t('roaring-20s', 'Roaring 20s', 'Retro & glam', 'elegant', ['wedding', 'fundraiser', 'corporate', 'birthday'],
    c('#0E0E0E', '#1A1A1A', '#F5EBD7', '#C2B59B', '#D4AF37', '#141006', '#E8D9B0', '#7A6A45'),
    'Bebas Neue', 'deco', { radius: '2px',
      copy: { headline: 'An evening of jazz and gold', rsvp: 'Save my seat', thanks: 'The bubbly is on ice. See you there.' } }),
  t('red-carpet', 'Red Carpet', 'Retro & glam', 'elegant', ['birthday', 'fundraiser', 'corporate'],
    c('#120709', '#1E0D11', '#FFF4F0', '#D3B8B3', '#E11D48', '#FFFFFF', '#F5C04A', '#88585F'),
    'Playfair Display', 'stars',
    { copy: { headline: 'Your star is on the guest list', rsvp: 'Walk the carpet', thanks: 'Lights, camera… you\'re confirmed!' },
      notes: 'Hollywood glamour, with no real award names or statues.' }),
  t('throwback', 'Throwback 80s/90s', 'Retro & glam', 'playful', ['reunion', 'birthday'],
    c('#FFF5E1', '#FFFFFF', '#1E1B3A', '#57527A', '#6A1BE0', '#FFFFFF', '#00897B', '#8A84A8'),
    'Permanent Marker', 'zigzag',
    { motion: 'playful', sound: true,
      copy: { headline: 'Rewind with us: totally rad', rsvp: 'I\'m so there', thanks: 'Righteous! You\'re on the list.' } }),
  t('masquerade', 'Masquerade', 'Retro & glam', 'elegant', ['fundraiser', 'birthday', 'holiday'],
    c('#140F1F', '#1E1730', '#F3EDFF', '#BFB3D6', '#C9A24A', '#160F05', '#9E7BD8', '#6E5E92'),
    'Cormorant Garamond', 'masks',
    { copy: { headline: 'An evening behind the mask', rsvp: 'Accept the invitation', thanks: 'Your mask awaits. See you at the ball.' } }),

  // ---- Seasonal & outdoor ----
  t('tropical-luau', 'Tropical Luau', 'Seasonal & outdoor', 'celebratory', ['birthday', 'reunion', 'corporate'],
    c('#F2FBF7', '#FFFFFF', '#10302A', '#44615A', '#B4372A', '#FFFFFF', '#0E7C66', '#74988F'),
    'Fredoka', 'leaves',
    { motion: 'playful', copy: { headline: 'Aloha! Island vibes ahead', rsvp: 'Count me in', thanks: 'See you by the water!' } }),
  t('boho-garden', 'Boho Garden', 'Seasonal & outdoor', 'elegant', ['wedding', 'bridal_shower', 'baby_shower'],
    c('#F7F3EC', '#FFFFFF', '#2E2A22', '#66604F', '#8B5E3C', '#FFFFFF', '#5E7153', '#9A9180'),
    'Cormorant Garamond', 'leaves',
    { copy: { headline: 'Gather with us in the garden', rsvp: 'Reply', thanks: 'Thank you! We\'ll save you a seat in the sun.' } }),
  t('winter-wonderland', 'Winter Wonderland', 'Seasonal & outdoor', 'celebratory', ['holiday', 'wedding', 'corporate'],
    c('#F1F6FB', '#FFFFFF', '#13243B', '#4E6079', '#1D5FA8', '#FFFFFF', '#6B819B', '#8394A9'),
    'Playfair Display', 'snow',
    { copy: { headline: 'Warm wishes and winter lights', rsvp: 'Count me in', thanks: 'See you in the snow globe!' } }),
  t('fall-harvest', 'Fall Harvest', 'Seasonal & outdoor', 'celebratory', ['holiday', 'potluck', 'church', 'wedding'],
    c('#FBF5EC', '#FFFFFF', '#2F1E10', '#6B5440', '#A4441A', '#FFFFFF', '#6B7A2A', '#A69078'),
    'Playfair Display', 'leaves',
    { copy: { headline: 'Come share the harvest', rsvp: 'I\'ll be there', thanks: 'Thank you! Bring your appetite.' } }),

  // ---- Life & community ----
  t('little-one', 'Little One', 'Life & community', 'celebratory', ['baby_shower'],
    c('#F7FAFD', '#FFFFFF', '#24324A', '#56637A', '#3E6FB0', '#FFFFFF', '#B05C86', '#8593A7'),
    'Fredoka', 'clouds',
    { radius: '20px', copy: { headline: 'A little one is on the way', rsvp: 'I\'ll be there', thanks: 'Thank you! The baby says thanks too.' },
      notes: 'Soft and gender-neutral by default; planners can switch the colors.' }),
  t('graduation', 'Graduation', 'Life & community', 'celebratory', ['school', 'birthday'],
    c('#F7F7F2', '#FFFFFF', '#14213D', '#4F5872', '#1F4E8C', '#FFFFFF', '#8A6400', '#8B93A7'),
    'Graduate', 'caps',
    { copy: { headline: 'The tassel was worth the hassle', rsvp: 'I\'ll celebrate', thanks: 'Congrats are in order. See you there!' } }),
  t('gala-night', 'Gala Night', 'Life & community', 'elegant', ['fundraiser', 'corporate'],
    c('#0D1321', '#151D30', '#F0F3F8', '#AEB7C8', '#E5C07B', '#1A1406', '#8FB3E8', '#5C6B8A'),
    'Playfair Display', 'deco',
    { copy: { headline: 'An evening for a cause', rsvp: 'Reserve my place', thanks: 'Thank you for supporting the cause.' } }),
  t('community-potluck', 'Community Potluck', 'Life & community', 'celebratory', ['potluck', 'church', 'school', 'reunion'],
    c('#FFFBF3', '#FFFFFF', '#2D2416', '#625644', '#2F6B3B', '#FFFFFF', '#A65B1E', '#A1937B'),
    'Fredoka', 'hearts',
    { copy: { headline: 'Bring a dish, bring a friend', rsvp: 'I\'m coming', thanks: 'Thank you! Don\'t forget to sign up for a dish.' } }),

  // ---- Respectful (funerals, memorials, vigils): quiet everywhere ----
  t('celebration-of-life', 'Celebration of Life', 'Respectful', 'respectful', ['memorial'],
    c('#F6F4EF', '#FFFFFF', '#2E2B26', '#5F5A52', '#5A6B5D', '#FFFFFF', '#7A6F5E', '#969186'),
    'Cormorant Garamond', 'branch',
    { copy: { headline: 'Celebrating the life of', rsvp: 'Let the family know', thanks: 'Thank you. Your response has been shared with the family.' },
      notes: 'Warm and gentle. Photos of the loved one lead; nothing sparkles or moves.' }),
  t('in-loving-memory', 'In Loving Memory', 'Respectful', 'respectful', ['memorial', 'church'],
    c('#F4F4F2', '#FFFFFF', '#26262A', '#5A5A62', '#3F4A5A', '#FFFFFF', '#6B6F78', '#919197'),
    'Cormorant Garamond', 'branch',
    { copy: { headline: 'In loving memory of', rsvp: 'Respond', thanks: 'Thank you. Your response has been shared with the family.' },
      notes: 'For funeral services. Plain, dignified, and easy to read for older guests.' }),
  t('candlelight-vigil', 'Candlelight Vigil', 'Respectful', 'respectful', ['memorial', 'church'],
    c('#121016', '#1C1922', '#F3EEE6', '#B9B1A6', '#E8B864', '#1A1206', '#C9C0B3', '#6F6875'),
    'Cormorant Garamond', 'flame',
    { copy: { headline: 'Please join us in remembrance', rsvp: 'I will attend', thanks: 'Thank you. We will hold a light for you.' },
      notes: 'Dark and calm, with one warm candle color. No flicker animation.' }),

  // ---- Virtual (online games, watch parties, streamed events) ----
  t('online-game-night', 'Online Game Night', 'Virtual', 'playful', ['birthday', 'reunion', 'corporate', 'other'],
    c('#0B1020', '#141B33', '#EEF3FF', '#AAB6D3', '#7CFF6B', '#071A05', '#FF5C8A', '#5C6991'),
    'Press Start 2P', 'dpad',
    { motion: 'playful', sound: true, radius: '6px',
      copy: { headline: 'Grab your controller: game night is online', rsvp: 'Join the lobby', thanks: 'You\'re in the lobby! The link is on its way.' } }),
  t('watch-party', 'Watch Party', 'Virtual', 'celebratory', ['birthday', 'reunion', 'other'],
    c('#0E0B0B', '#1A1414', '#FFF6EC', '#CDBEB0', '#FFB23E', '#1A1003', '#E5484D', '#746158'),
    'Bebas Neue', 'film',
    { copy: { headline: 'Popcorn ready? Movie night online', rsvp: 'Save my seat', thanks: 'Your seat is saved. The watch link is on its way.' } }),
  t('virtual-celebration', 'Virtual Celebration', 'Virtual', 'celebratory', ['wedding', 'birthday', 'corporate', 'church', 'other'],
    c('#F5F3FF', '#FFFFFF', '#221A44', '#5A5378', '#5B3FD1', '#FFFFFF', '#0E7C86', '#8F88AE'),
    'Fredoka', 'play',
    { copy: { headline: 'Celebrate with us from anywhere', rsvp: 'I\'ll tune in', thanks: 'You\'re all set. We\'ll send the stream link.' },
      notes: 'For streamed weddings and hybrid events. Needs a meeting-link field (style guide: Open questions).' }),
];

// Default theme for each events.event_type value (schema.sql), so a new event never looks blank.
export const DEFAULT_THEME_FOR_EVENT_TYPE = {
  wedding: 'elegant-wedding', birthday: 'party-pop', baby_shower: 'little-one', bridal_shower: 'boho-garden',
  corporate: 'gala-night', school: 'graduation', church: 'community-potluck', fundraiser: 'gala-night',
  reunion: 'throwback', holiday: 'winter-wonderland', memorial: 'celebration-of-life',
  potluck: 'community-potluck', other: 'graffiti-queen',
};

// Event status → status-chip style in tokens.css (--status-<style>-ink / -bg).
// Always show the words too; color is never the only signal.
export const EVENT_STATUS_STYLE = {
  awaiting_countersign: 'warning', booked: 'info', in_planning: 'info', final_week: 'warning',
  event_day: 'success', wrap_up: 'neutral', closed: 'neutral', cancelled: 'danger',
};
export const MONEY_STATUS_STYLE = { paid: 'success', due: 'neutral', overdue: 'danger', waived: 'neutral', partially_paid: 'info', open: 'neutral', void: 'neutral' };

export const getTheme = (id) => THEMES.find((theme) => theme.id === id);

// Is this event "respectful"? Memorials always are, whatever theme was picked.
export const isRespectful = (theme, eventType) => theme?.tone === 'respectful' || eventType === 'memorial';

// The background pattern as a CSS url(), in the theme's accent color.
export function motifUrl(theme) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${MOTIFS[theme.motif].replaceAll('{c}', theme.colors.accent)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// CSS variables for one theme. Put them on the element that wraps the event's page:
//   <div style={themeToCssVars(theme)} data-tone={theme.tone}>…</div>
export function themeToCssVars(theme) {
  const vars = {};
  for (const [role, hex] of Object.entries(theme.colors)) {
    vars[`--theme-${role.replace(/[A-Z]/g, (ch) => '-' + ch.toLowerCase())}`] = hex;   // onAccent → --theme-on-accent
  }
  vars['--theme-font-display'] = `'${theme.fonts.display}', Georgia, serif`;
  vars['--theme-font-body'] = `'${theme.fonts.body}', system-ui, sans-serif`;
  vars['--theme-radius'] = theme.radius;
  vars['--theme-motif'] = motifUrl(theme);
  return vars;
}
