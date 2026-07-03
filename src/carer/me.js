/** ME — profile hub + links to work/settings/safety (deepened in P4). */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileApp, mobileHeader } from './frame.js'
import { session } from './session.js'
import { carerStore } from '../lib/carerStore.js'
import { CARER_ROLES, roleLabel } from '../data/carer.js'

export function renderMe() {
  const c = session.carer()
  const queued = carerStore.queued()
  const role = session.role()

  // Grouped into themed sections so each has a heading + its own itemized card.
  const groups = [
    { title: 'Work & schedule', items: [
      { ic: 'clipboard', label: 'Jobs', note: 'Non-visit work — stock, policies, checks', href: '#/carer/jobs' },
      { ic: 'calendar', label: 'Availability & shifts', note: 'Set when you can work', href: '#/carer/me/availability' },
      { ic: 'user-check', label: 'Absence & fitness to work', note: 'Report sickness / relinquish shift', href: '#/carer/me/absence' },
      { ic: 'file-check', label: 'My reports', note: 'Visit history, hours, CPD, compliance', href: '#/carer/reports' },
      { ic: 'bell', label: 'My alerts', note: 'Live status of alerts you raised', href: '#/carer/alerts' },
    ] },
    { title: 'Pay & money', items: [
      { ic: 'clock', label: 'Timesheet & mileage', note: 'Hours, visits & travel', href: '#/carer/me/timesheet' },
      { ic: 'scale', label: 'Pay & earnings', note: 'Estimated pay, breakdown, confirm', href: '#/carer/me/pay' },
      { ic: 'utensils', label: 'Client money & expenses', note: 'Shopping, receipts & balance', href: '#/carer/me/expenses' },
    ] },
    { title: 'Safety & compliance', items: [
      { ic: 'shield', label: 'Lone-worker & safety', note: 'Check-in & SOS', href: '#/carer/me/safety' },
      { ic: 'file-check', label: 'Training & compliance', note: '2 certificates expiring soon', href: '#/carer/me/training', badge: '2' },
      { ic: 'shield', label: 'Assurance & safety register', note: 'Hazards, concurrency, transitions', href: '#/carer/assurance' },
      { ic: 'star', label: 'Feedback & raising concerns', note: 'Suggestions & whistleblowing', href: '#/carer/me/feedback' },
    ] },
    { title: 'Learning & development', items: [
      { ic: 'sparkles', label: 'Learning centre', note: 'Courses, CPD & just-in-time lessons', href: '#/carer/me/learning' },
      { ic: 'target', label: 'Skills & competency', note: 'Your competency matrix', href: '#/carer/me/skills' },
      { ic: 'file-check', label: 'My documents', note: 'DBS, right-to-work & certificates', href: '#/carer/me/documents' },
    ] },
    { title: 'App & support', items: [
      { ic: 'smile', label: 'Communication aid', note: 'Point-of-care phrases & languages', href: '#/carer/translate' },
      { ic: 'refresh', label: 'Sync & offline', note: 'Queued records & data', href: '#/carer/me/sync' },
      { ic: 'settings', label: 'Settings', note: 'Notifications, biometrics, accessibility', href: '#/carer/me/settings' },
      { ic: 'info', label: 'Help & policies', note: 'Guides & support', href: '#/carer/me/help' },
    ] },
  ]

  const row = (it) => html`<a href="${it.href}" class="block p-4 flex items-center gap-3 active:bg-ink-50">
    <span class="w-9 h-9 rounded-xl bg-ink-100 text-ink-500 grid place-items-center">${icon(it.ic, 'w-4.5 h-4.5')}</span>
    <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(it.label)}</p><p class="text-xs text-ink-500">${esc(it.note)}</p></div>
    ${it.badge ? `<span class="badge bg-danger-50 text-danger-700 ring-danger-100">${it.badge}</span>` : ''}
    ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
  </a>`

  const inner = html`
    ${mobileHeader({ title: 'Me' })}
    <div class="p-4 space-y-4">
      <a href="#/carer/me/profile" class="card p-4 flex items-center gap-4 active:bg-ink-50">
        <span class="w-14 h-14 rounded-full bg-primary-100 text-primary-700 grid place-items-center text-lg font-bold shrink-0">${esc(c.initials)}</span>
        <div class="min-w-0 flex-1"><p class="text-base font-semibold text-ink-900">${esc(c.name)}</p><p class="text-xs text-ink-500">${esc(roleLabel(role))} · ${esc(c.org)}</p><p class="text-xs text-ink-400 mt-0.5">${esc(c.branch)} · view profile & checks</p></div>
        ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
      </a>

      <!-- §5 — role (demo switcher). Elevated actions are gated & role-stamped to audit. -->
      <div class="card p-4">
        <p class="section-title mb-2 flex items-center gap-1.5">${icon('user-check', 'w-3.5 h-3.5')}Acting role (demo)</p>
        <div class="flex gap-1.5">
          ${map(CARER_ROLES, (r) => `<button onclick="window.__carerRole('${r.id}')" class="flex-1 h-9 rounded-lg ring-1 text-xs font-semibold px-1 ${r.id === role ? 'bg-primary-600 text-white ring-primary-600' : 'bg-white text-ink-600 ring-ink-200'}">${esc(r.label)}</button>`)}
        </div>
        <p class="text-xs text-ink-400 mt-2">Spot-checks, CD witnessing, competency sign-off & flag triage unlock with seniority — every elevated action is stamped with your role to the office audit.</p>
      </div>

      <div class="rounded-xl ${queued ? 'bg-warning-50 ring-warning-100' : 'bg-success-50 ring-success-100'} ring-1 p-3 flex items-center gap-3">
        <span class="${queued ? 'text-warning-600' : 'text-success-600'}">${icon(queued ? 'wifi' : 'check-circle', 'w-5 h-5')}</span>
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold ${queued ? 'text-warning-800' : 'text-success-800'}">${queued ? `${queued} record${queued > 1 ? 's' : ''} to sync` : 'All records synced'}</p></div>
        ${queued ? `<button onclick="window.__carerSync()" class="btn btn-secondary btn-sm">${icon('refresh', 'w-3.5 h-3.5')}Sync</button>` : ''}
      </div>

      ${map(groups, (g) => html`<div>
        <p class="section-title mb-2">${esc(g.title)}</p>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${map(g.items, row)}
        </div>
      </div>`)}

      <div>
        <p class="section-title mb-2">Emergency & security</p>
        <div class="grid grid-cols-2 gap-2">
          <a href="#/carer/breakglass" class="card p-3 flex items-center gap-2 active:bg-ink-50"><span class="w-8 h-8 rounded-xl bg-danger-50 text-danger-600 grid place-items-center">${icon('shield', 'w-4 h-4')}</span><span class="text-xs font-semibold text-ink-800">Break-glass</span></a>
          <a href="#/carer/share" class="card p-3 flex items-center gap-2 active:bg-ink-50"><span class="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 grid place-items-center">${icon('link', 'w-4 h-4')}</span><span class="text-xs font-semibold text-ink-800">Share info</span></a>
          <a href="#/carer/death" class="card p-3 flex items-center gap-2 active:bg-ink-50"><span class="w-8 h-8 rounded-xl bg-ink-100 text-ink-600 grid place-items-center">${icon('heart', 'w-4 h-4')}</span><span class="text-xs font-semibold text-ink-800">Death workflow</span></a>
          <button onclick="window.__lock()" class="card p-3 flex items-center gap-2 active:bg-ink-50"><span class="w-8 h-8 rounded-xl bg-ink-100 text-ink-600 grid place-items-center">${icon('logout', 'w-4 h-4')}</span><span class="text-xs font-semibold text-ink-800">Lock app</span></button>
        </div>
      </div>

      <button onclick="window.__carerReset()" class="w-full text-center text-sm text-ink-400 py-2">Reset demo data</button>
      <button onclick="window.__carerLogout()" class="btn btn-secondary btn-md w-full">${icon('logout', 'w-4 h-4')}Sign out</button>
    </div>`
  return mobileApp(inner, { tab: 'me', badges: { inbox: 2 } })
}
