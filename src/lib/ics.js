// "Add to calendar": a tiny .ics file any calendar app opens (Google, Apple, Outlook).
import { parseDay } from './clock'

const stamp = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`
}

/** Build the file's text. at: '2027-06-12T17:00:00'; minutes: how long. */
export function icsText({ at, minutes = 60, title, place = '' }) {
  const start = parseDay(at)
  const end = new Date(start.getTime() + minutes * 60000)
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Crowned//EN', 'BEGIN:VEVENT',
    `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${title}`, place && `LOCATION:${place}`, 'END:VEVENT', 'END:VCALENDAR']
    .filter(Boolean).join('\r\n')
}

/** Download it (the browser hands it to the calendar app). */
export function downloadIcs(details, fileName = 'event.ics') {
  if (typeof URL.createObjectURL !== 'function') return
  const url = URL.createObjectURL(new Blob([icsText(details)], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
  a.click()
  URL.revokeObjectURL(url)
}
