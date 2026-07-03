/** §12 Multi-day schedule + §32 Offline & sync manager. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { carerStore } from '../lib/carerStore.js'
import { PARAMS, ROTA, DEMO_TODAY } from '../data/carer.js'
import { getServiceUser } from '../data/index.js'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* ------------------------------------------------ Scrollable multi-month calendar */
const MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] // getUTCDay() index

/** Build a flat list of dated cells from `startIso` for `days` days. */
function buildCalendar(startIso, days) {
  const out = []
  const d = new Date(startIso + 'T00:00:00Z')
  for (let i = 0; i < days; i++) {
    const iso = d.toISOString().slice(0, 10)
    out.push({
      iso,
      dow: DOW_ABBR[d.getUTCDay()],
      dom: d.getUTCDate(),
      month: MONTHS_ABBR[d.getUTCMonth()],
      year: d.getUTCFullYear(),
      isToday: iso === DEMO_TODAY,
    })
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

/* Two months either side of the demo day, so the strip scrolls across months. */
const CAL = buildCalendar('2026-06-01', 92) // Jun 1 → end of Aug 2026
const LABELS = Object.fromEntries(CAL.map((c) => {
  const [y, m, d] = c.iso.split('-') // dd/mm/yyyy from the ISO date
  return [c.iso, `${c.dow} ${d}/${m}/${y}`]
}))
/* Single-quoted so it can live inside a double-quoted x-data attribute (values are date labels — no apostrophes). */
const LABELS_LITERAL = JSON.stringify(LABELS).replace(/"/g, "'")

/** Minutes between the two clock times in a '07:30 – 08:15' range string. */
function durMins(t) {
  const parts = String(t).split(/\s*[–-]\s*/)
  const toM = (s) => {
    const [h, m] = s.trim().split(':').map(Number)
    return h * 60 + m
  }
  return parts.length === 2 ? Math.max(0, toM(parts[1]) - toM(parts[0])) : 0
}

/** Per-weekday totals for the daywise summary card. Tue reuses today's live rota. */
function dayStats(dow) {
  const rows = dow === 'Tue' ? ROTA : (MOCK_DAYS[dow] || [])
  const visits = rows.length
  const mins = rows.reduce((s, r) => s + durMins(r.time), 0)
  const miles = visits ? Math.round(visits * 4.2) : 0
  return { visits, mins, miles }
}

/** Format minutes as '4h 30m' / '6h' / '0h'. */
function fmtHours(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

const suTone = (color) => ({
  warning: 'bg-warning-100 text-warning-700',
  teal: 'bg-teal-100 text-teal-700',
  danger: 'bg-danger-100 text-danger-700',
  primary: 'bg-primary-100 text-primary-700',
}[color] || 'bg-primary-100 text-primary-700')

/* Mock visits for non-today days so the agenda is never empty. */
const MOCK_DAYS = {
  Mon: [
    { name: 'Mary Adams', initials: 'MA', color: 'primary', visit: 'Morning', time: '07:30 – 08:15', chip: 'Completed', tone: 'success' },
    { name: 'George Bell', initials: 'GB', color: 'teal', visit: 'Tea', time: '17:45 – 18:15', chip: 'Completed', tone: 'success' },
  ],
  Wed: [
    { name: 'Doris Finch', initials: 'DF', color: 'warning', visit: 'Morning', time: '08:00 – 08:45', chip: '2 carers', tone: 'primary' },
    { name: 'Mary Adams', initials: 'MA', color: 'primary', visit: 'Lunch', time: '12:15 – 12:45', chip: 'Scheduled', tone: 'ink' },
    { name: 'Mary Adams', initials: 'MA', color: 'primary', visit: 'Bedtime', time: '21:00 – 21:30', chip: 'Scheduled', tone: 'ink' },
  ],
  Thu: [
    { name: 'George Bell', initials: 'GB', color: 'teal', visit: 'Morning', time: '08:30 – 09:00', chip: 'Scheduled', tone: 'ink' },
    { name: 'Doris Finch', initials: 'DF', color: 'warning', visit: 'Lunch', time: '12:45 – 13:15', chip: 'Scheduled', tone: 'ink' },
  ],
  Fri: [
    { name: 'Mary Adams', initials: 'MA', color: 'primary', visit: 'Morning', time: '07:30 – 08:15', chip: 'Scheduled', tone: 'ink' },
    { name: 'Harold Price', initials: 'HP', color: 'danger', visit: 'Tea', time: '17:00 – 17:30', chip: 'Palliative', tone: 'warning' },
  ],
  Sat: [
    { name: 'Doris Finch', initials: 'DF', color: 'warning', visit: 'Morning', time: '08:00 – 08:45', chip: 'Open shift', tone: 'warning' },
  ],
  Sun: [],
}

const chipTone = (t) => ({
  success: 'bg-success-50 text-success-700 ring-success-100',
  warning: 'bg-warning-50 text-warning-700 ring-warning-100',
  primary: 'bg-primary-50 text-primary-700 ring-primary-100',
  ink: 'bg-ink-100 text-ink-600 ring-ink-200',
}[t] || 'bg-ink-100 text-ink-600 ring-ink-200')

function avatar(initials, color) {
  return html`<span class="w-10 h-10 rounded-xl grid place-items-center font-semibold text-[13px] shrink-0 ${suTone(color)}">${esc(initials)}</span>`
}

/* A real, tappable rota visit for today (Tue). */
function todayRow(r) {
  const su = getServiceUser(r.suId)
  if (!su) return ''
  return html`<a href="#/carer/visit/${r.id}" class="card p-3 flex items-center gap-3 active:scale-[.99]">
    ${avatar(su.initials, su.color)}
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-ink-900 truncate">${esc(su.name)}</p>
      <p class="text-xs text-ink-400">${esc(r.visit)} · ${esc(r.time)}${r.twoCarer ? ' · 2 carers' : ''}</p>
    </div>
    <span class="badge ${chipTone(r.twoCarer ? 'primary' : 'ink')}">${esc(r.twoCarer ? '2 carers' : r.visit)}</span>
    ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
  </a>`
}

/* A static mock visit for a non-today day. */
function mockRow(m) {
  return html`<div class="card p-3 flex items-center gap-3">
    ${avatar(m.initials, m.color)}
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-ink-900 truncate">${esc(m.name)}</p>
      <p class="text-xs text-ink-400">${esc(m.visit)} · ${esc(m.time)}</p>
    </div>
    <span class="badge ${chipTone(m.tone)}">${esc(m.chip)}</span>
  </div>`
}

function dayAgenda(day) {
  if (day === 'Tue') {
    return html`<div class="space-y-2">${map(ROTA, todayRow)}</div>`
  }
  const rows = MOCK_DAYS[day] || []
  if (!rows.length) {
    return html`<div class="card p-6 text-center text-[13px] text-ink-400">No visits scheduled — rest day.</div>`
  }
  return html`<div class="space-y-2">${map(rows, mockRow)}</div>`
}

/** §12 — multi-day schedule with week strip + per-day agenda. */
export function renderSchedule() {
  const stat = (val, label) => html`<div class="text-center"><p class="text-xl font-bold text-ink-900">${val}</p><p class="text-[11px] text-ink-400">${label}</p></div>`

  const inner = html`
    ${flowHeader({ title: 'Schedule', subtitle: 'Tap any date — swipe to other months', back: '#/carer' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ sel:'${DEMO_TODAY}', day:'Tue', labels: ${LABELS_LITERAL} }" x-init="$nextTick(() => $refs.todayPill && $refs.todayPill.scrollIntoView({ inline:'center', block:'nearest' }))">
      <!-- scrollable multi-month date strip -->
      <div class="overflow-x-auto -mx-4 px-4 pb-1 [&::-webkit-scrollbar]:hidden" style="scrollbar-width:none" x-ref="strip">
        <div class="flex items-stretch gap-1.5 w-max">
          ${map(CAL, (c, i) => {
            const divider = (i === 0 || c.dom === 1)
              ? html`<div class="shrink-0 self-center px-1"><span class="text-[10px] font-bold uppercase tracking-wide text-primary-500">${c.month}</span></div>`
              : ''
            return divider + html`<button @click="sel='${c.iso}'; day='${c.dow}'" ${c.isToday ? 'x-ref="todayPill"' : ''} :class="sel==='${c.iso}' ? 'bg-primary-600 text-white ring-primary-600' : 'bg-surface text-ink-600 ring-ink-200'" class="shrink-0 w-12 rounded-xl ring-1 py-2 flex flex-col items-center gap-0.5 active:scale-[.97]">
              <span class="text-[10px] font-medium uppercase tracking-wide opacity-80">${c.dow}</span>
              <span class="text-base font-bold leading-none">${c.dom}</span>
              ${c.isToday ? html`<span :class="sel==='${c.iso}' ? 'bg-white' : 'bg-primary-500'" class="w-1 h-1 rounded-full mt-0.5"></span>` : '<span class="w-1 h-1 mt-0.5"></span>'}
            </button>`
          })}
        </div>
      </div>
      <p class="text-[11px] text-ink-400 -mt-1 flex items-center gap-1">${icon('info', 'w-3.5 h-3.5')}<span x-text="(sel==='${DEMO_TODAY}' ? 'Today · ' : '') + labels[sel]"></span></p>

      <!-- daywise totals -->
      <div class="card p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-3"><span x-text="labels[sel]"></span> · totals</p>
        ${map(DAYS, (d) => {
          const s = dayStats(d)
          return html`<div x-show="day==='${d}'" x-cloak class="grid grid-cols-3 gap-2">
            ${stat(String(s.visits), 'Visits')}
            ${stat(fmtHours(s.mins), 'Planned hours')}
            ${stat(String(s.miles), 'Miles')}
          </div>`
        })}
      </div>

      <!-- per-day agenda -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2" x-text="(sel==='${DEMO_TODAY}' ? 'Today' : labels[sel]) + ' · visits'"></p>
        ${map(DAYS, (d) => html`<div x-show="day==='${d}'" x-cloak class="space-y-2">${dayAgenda(d)}</div>`)}
      </div>

      <!-- upcoming vs past -->
      <div class="rounded-xl bg-teal-50 ring-1 ring-teal-100 p-3 text-[13px] text-teal-800 flex items-start gap-2">${icon('history', 'w-4 h-4 shrink-0 mt-0.5')}<span>Days before today are read-only history; today and later are your upcoming rota. Changes are confirmed by the office.</span></div>
    </div>`
  return mobileFlow(inner)
}

/* ---------------------------------------------------------- Sync manager */

const STALE_WARN = PARAMS.STALECARE_WARN_H ?? PARAMS.STALEMAR_WARN_H
const STALE_BLOCK = PARAMS.STALEMAR_BLOCK_H

function queueRow(ic, tone, label, count) {
  return html`<div class="flex items-center gap-3 py-3">
    <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0 ${tone}">${icon(ic, 'w-4.5 h-4.5')}</span>
    <p class="flex-1 text-sm font-medium text-ink-800">${label}</p>
    <span class="text-sm font-bold ${count > 0 ? 'text-warning-600' : 'text-ink-400'}">${count}</span>
  </div>`
}

/** §32 — offline & sync manager. */
export function renderSyncManager() {
  const queued = carerStore.queued()
  const rows = [
    { ic: 'check-circle', tone: 'bg-primary-50 text-primary-600', label: 'Tasks', count: carerStore.allTasks().length },
    { ic: 'pill', tone: 'bg-danger-50 text-danger-600', label: 'Medications', count: carerStore.allMeds().length },
    { ic: 'activity', tone: 'bg-teal-50 text-teal-600', label: 'Observations', count: carerStore.allObservations().length },
    { ic: 'flag', tone: 'bg-warning-50 text-warning-600', label: 'Incidents', count: carerStore.allIncidents().length },
    { ic: 'shield', tone: 'bg-info-50 text-info-600', label: 'Protocol runs', count: carerStore.allProtocols().length },
  ]

  const statusCard = queued > 0
    ? html`<div class="card p-4 ring-1 ring-warning-100 bg-warning-50">
        <div class="flex items-center gap-3">
          <span class="w-11 h-11 rounded-xl bg-warning-100 text-warning-700 grid place-items-center">${icon('wifi', 'w-5.5 h-5.5')}</span>
          <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-warning-800">${queued} record${queued === 1 ? '' : 's'} queued offline</p><p class="text-xs text-warning-700">Waiting to reach the office — will sync automatically.</p></div>
        </div>
        <button onclick="window.__carerSync()" class="btn btn-primary btn-md w-full mt-3">${icon('refresh', 'w-4 h-4')}Sync now</button>
      </div>`
    : html`<div class="card p-4 ring-1 ring-success-100 bg-success-50">
        <div class="flex items-center gap-3">
          <span class="w-11 h-11 rounded-xl bg-success-100 text-success-700 grid place-items-center">${icon('check-circle', 'w-5.5 h-5.5')}</span>
          <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-success-800">All synced</p><p class="text-xs text-success-700">Everything recorded is safely with the office.</p></div>
        </div>
        <button onclick="window.__carerSync()" class="btn btn-secondary btn-md w-full mt-3">${icon('refresh', 'w-4 h-4')}Sync now</button>
      </div>`

  const inner = html`
    ${flowHeader({ title: 'Offline & sync', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      ${statusCard}

      <div class="card px-4 divide-y divide-ink-100">
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 pt-3 pb-1">Queued records by type</p>
        ${map(rows, (r) => queueRow(r.ic, r.tone, r.label, r.count))}
      </div>

      <div class="card p-4 flex items-center gap-3">
        <span class="w-9 h-9 rounded-lg bg-ink-100 text-ink-500 grid place-items-center shrink-0">${icon('clock', 'w-4.5 h-4.5')}</span>
        <div class="flex-1"><p class="text-sm font-semibold text-ink-900">Last successful sync</p><p class="text-xs text-ink-400">Today at 07:30</p></div>
      </div>

      <div class="rounded-xl bg-primary-50 ring-1 ring-primary-100 p-3 text-[13px] text-primary-800 flex items-start gap-2">${icon('info', 'w-4 h-4 shrink-0 mt-0.5')}<span>Recording always works offline. Entries are saved on this device and sync to the office automatically within 60s of regaining signal — you never lose a record.</span></div>

      <!-- stale data -->
      <div class="card p-4">
        <p class="text-sm font-semibold text-ink-900 flex items-center gap-1.5 mb-2">${icon('alert', 'w-4 h-4 text-warning-500')}Cached care data</p>
        <p class="text-[13px] text-ink-600">The care plan and MAR are cached for offline use. Cached data <b>warns you to refresh</b> after ${STALE_WARN}h and <b>blocks gated actions</b> (e.g. medication) after ${STALE_BLOCK}h until you reconnect.</p>
        <div class="mt-3 rounded-lg bg-warning-50 ring-1 ring-warning-100 p-3 flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-warning-100 text-warning-700 grid place-items-center shrink-0">${icon('clock', 'w-4 h-4')}</span>
          <div class="flex-1"><p class="text-[13px] font-semibold text-warning-800">Cache age 12h · Warning — refresh soon</p><p class="text-[11px] text-warning-700">Reconnect to refresh before ${STALE_BLOCK}h to keep gated actions available.</p></div>
        </div>
      </div>

      <button onclick="window.__carerSync()" class="btn btn-secondary btn-md w-full">${icon('refresh', 'w-4 h-4')}Retry sync</button>
    </div>`
  return mobileFlow(inner)
}
