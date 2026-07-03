/**
 * Shared date presentation — the whole app shows dates as dd/mm/yyyy and times
 * in 24-hour form. Keep ISO strings (YYYY-MM-DD) in data for date logic; format
 * for display through here.
 */

const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 }
const pad = (n) => String(n).padStart(2, '0')

/**
 * Format a single date value as dd/mm/yyyy. Accepts:
 *  - an ISO date `YYYY-MM-DD`, optionally with a trailing `HH:MM` time (kept),
 *  - a `D Mon YYYY` display string (e.g. "3 Jul 2026"),
 *  - anything else (e.g. "Today", "—", "Yesterday") is returned unchanged.
 * Returns a raw string — escape at the call site as usual.
 */
export function fmtDMY(value) {
  if (value === null || value === undefined || value === '') return '—'
  const s = String(value).trim()

  // ISO date (optionally with a time component we preserve as 24h HH:MM)
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/)
  if (m) {
    const [, y, mo, d, rest] = m
    const tm = rest.match(/(\d{2}:\d{2})/)
    return `${d}/${mo}/${y}${tm ? ' ' + tm[1] : ''}`
  }

  // "D Mon YYYY" display string
  m = s.match(/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/)
  if (m) return `${pad(+m[1])}/${pad(MON[m[2]])}/${m[3]}`

  return s
}
