/** §12 Multi-day schedule + §32 Offline & sync manager. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { carerStore } from '../lib/carerStore.js'
import { PARAMS, ROTA } from '../data/carer.js'
import { getServiceUser } from '../data/index.js'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
    ${flowHeader({ title: 'Schedule', subtitle: 'Week of 29 Jun – 5 Jul', back: '#/carer' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ day:'Tue' }">
      <!-- week strip -->
      <div class="grid grid-cols-7 gap-1.5">
        ${map(DAYS, (d, i) => html`<button @click="day='${d}'" :class="day==='${d}' ? 'bg-primary-600 text-white ring-primary-600' : 'bg-surface text-ink-600 ring-ink-200'" class="rounded-xl ring-1 py-2 flex flex-col items-center gap-0.5 active:scale-[.97]">
          <span class="text-[10px] font-medium uppercase tracking-wide opacity-80">${d}</span>
          <span class="text-base font-bold leading-none">${29 + i > 30 ? 29 + i - 30 : 29 + i}</span>
          ${d === 'Tue' ? html`<span :class="day==='Tue' ? 'bg-white' : 'bg-primary-500'" class="w-1 h-1 rounded-full mt-0.5"></span>` : '<span class="w-1 h-1 mt-0.5"></span>'}
        </button>`)}
      </div>
      <p class="text-[11px] text-ink-400 -mt-1 flex items-center gap-1">${icon('info', 'w-3.5 h-3.5')}<span x-text="day==='Tue' ? 'Today · Tue 30 Jun' : day + ' — planned'"></span></p>

      <!-- week totals -->
      <div class="card p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-3">This week</p>
        <div class="grid grid-cols-3 gap-2">
          ${stat('34', 'Visits')}
          ${stat('41h', 'Planned hours')}
          ${stat('126', 'Miles')}
        </div>
      </div>

      <!-- per-day agenda -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2" x-text="(day==='Tue' ? 'Today' : day) + '’s visits'"></p>
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
