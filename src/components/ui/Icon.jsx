// =====================================================================
// One small outline icon set (20px, drawn for this app; no icon library).
// Icons are decoration next to words, so they're hidden from screen readers.
// An icon-only button must get its own aria-label.
// =====================================================================

const PATHS = {
  dashboard: 'M3 3h6v8H3zM11 3h6v5h-6zM11 10h6v7h-6zM3 13h6v4H3z',
  leads: 'M3 4h4v12H3zM8 4h4v8H8zM13 4h4v10h-4z',
  calendar: 'M3 5h14v12H3zM3 9h14M7 3v4M13 3v4',
  events: 'M4 16l3-11 9 4-12 7zM10 3l1 2M14 4l-1 2M16 7l-2 0',
  settings: 'M10 7a3 3 0 100 6 3 3 0 000-6zM10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4',
  more: 'M4 10h.01M10 10h.01M16 10h.01',
  lock: 'M5 9h10v8H5zM7 9V6a3 3 0 016 0v3',
  home: 'M3 9l7-6 7 6v8h-5v-5H8v5H3z',
  proposal: 'M5 2h7l3 3v13H5zM12 2v3h3M8 9h5M8 12h5M8 15h3',
  card: 'M2 5h16v10H2zM2 8h16M5 12h3',
  users: 'M7 9a3 3 0 100-6 3 3 0 000 6zM2 17c0-3 2-5 5-5s5 2 5 5M13 4a3 3 0 010 5M15 12c2 .5 3 2.5 3 5',
  image: 'M3 4h14v12H3zM3 13l4-4 3 3 2-2 5 5M13 7h.01',
  check: 'M4 10l4 4 8-8',
  message: 'M3 4h14v9H8l-4 3v-3H3z',
  bell: 'M10 3a5 5 0 00-5 5v3l-2 3h14l-2-3V8a5 5 0 00-5-5zM8 17a2 2 0 004 0',
  outbox: 'M3 11l2-7h10l2 7v5H3zM3 11h4l1 2h4l1-2h4',
  chevronLeft: 'M12 4l-6 6 6 6',
  chevronRight: 'M8 4l6 6-6 6',
  shift: 'M10 3a7 7 0 100 14 7 7 0 000-14zM10 6v4l3 2',
  star: 'M10 3l2 4.5 5 .5-3.8 3.3 1.1 4.9L10 13.7 5.7 16.2l1.1-4.9L3 8l5-.5z',
  user: 'M10 9a3 3 0 100-6 3 3 0 000 6zM4 17c0-3.5 2.5-6 6-6s6 2.5 6 6',
  close: 'M5 5l10 10M15 5L5 15',
  external: 'M11 3h6v6M17 3l-8 8M8 5H3v12h12v-5',
  sparkle: 'M10 2l1.6 5.4L17 9l-5.4 1.6L10 16l-1.6-5.4L3 9l5.4-1.6z',
  chart: 'M3 17h14M5 14V9M9 14V5M13 14v-3M17 14V7',
}

export default function Icon({ name, size = 20, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

/** The crown from the wordmark (style guide §1). */
export function Crown({ size = 28, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path d="M6 30l4-16 7 9 3-14 3 14 7-9 4 16z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="20" cy="7" r="2.5" fill="currentColor" />
    </svg>
  )
}
