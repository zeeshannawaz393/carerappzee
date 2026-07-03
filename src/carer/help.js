/** P5 — Help & policies (§31) and global search (§30). */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { ROTA } from '../data/carer.js'
import { SERVICE_USERS, getServiceUser } from '../data/index.js'

function avatarTone(color) {
  return { warning: 'bg-warning-100 text-warning-700', teal: 'bg-teal-100 text-teal-700', danger: 'bg-danger-100 text-danger-700', primary: 'bg-primary-100 text-primary-700' }[color] || 'bg-primary-100 text-primary-700'
}

/* -------------------------------------------------------- Help & policies (§31) */
export function renderHelp() {
  const guides = [
    { title: 'How to check in', desc: 'GPS geofence, NFC & manual fallback', icon: 'map-pin' },
    { title: 'Recording medication (eMAR)', desc: 'Support action + dose outcome', icon: 'pill' },
    { title: 'Reporting an incident', desc: 'Falls, injuries, near misses & RIDDOR', icon: 'alert' },
    { title: 'Using emergency protocols', desc: 'Deterioration, choking, hypo & more', icon: 'shield' },
    { title: 'Raising a safeguarding concern', desc: 'Recognise, record & escalate', icon: 'flag' },
  ]
  const policies = [
    { name: 'Safeguarding policy', meta: 'v4.2 · reviewed May 2026', icon: 'shield' },
    { name: 'Medication policy', meta: 'v3.0 · reviewed Feb 2026', icon: 'pill' },
    { name: 'Lone-worker policy', meta: 'v2.1 · reviewed Apr 2026', icon: 'map-pin' },
    { name: 'Data protection (UK GDPR)', meta: 'v1.8 · reviewed Jan 2026', icon: 'file-check' },
  ]

  const inner = html`
    ${flowHeader({ title: 'Help & policies', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
        <input placeholder="Search help & how-to guides…" onclick="window.__notify('Type to search the help centre','info')" class="field field-md pl-9" />
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">How-to guides</p>
        <div class="space-y-2">
          ${map(guides, (g) => html`<button onclick="window.__notify('Opening guide…','info')" class="w-full text-left card p-3.5 flex items-center gap-3 active:scale-[.99]">
            <span class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon(g.icon, 'w-4.5 h-4.5')}</span>
            <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(g.title)}</p><p class="text-xs text-ink-400">${esc(g.desc)}</p></div>
            ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
          </button>`)}
        </div>
      </div>

      <div class="card p-4">
        <div class="flex items-center gap-2.5 mb-3">
          <span class="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 grid place-items-center">${icon('bell', 'w-4.5 h-4.5')}</span>
          <div><p class="text-sm font-semibold text-ink-900">Contact support</p><p class="text-xs text-ink-400">Office hours 8am–6pm · on-call 24/7</p></div>
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <button onclick="window.__notify('Calling support…','info')" class="btn btn-secondary btn-md">${icon('bell', 'w-4 h-4')}Call</button>
          <button onclick="window.__notify('Support message sent','success')" class="btn btn-secondary btn-md">${icon('edit', 'w-4 h-4')}Message</button>
        </div>
      </div>

      <div class="card p-4" x-data="{ bug:'' }">
        <div class="flex items-center gap-2.5 mb-2">
          <span class="w-9 h-9 rounded-lg bg-warning-50 text-warning-600 grid place-items-center">${icon('alert', 'w-4.5 h-4.5')}</span>
          <div><p class="text-sm font-semibold text-ink-900">Report a bug</p><p class="text-xs text-ink-400">Tell us what went wrong</p></div>
        </div>
        <textarea x-model="bug" rows="3" placeholder="Describe the problem — what you tapped and what happened…" class="field field-md"></textarea>
        <button @click="window.__notify(bug.trim() ? 'Bug report submitted — thank you' : 'Please describe the problem first', bug.trim() ? 'success' : 'warning'); if(bug.trim()) bug=''" class="btn btn-primary btn-md w-full mt-2.5">${icon('check', 'w-4 h-4')}Submit report</button>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Policies &amp; procedures</p>
        <div class="card divide-y divide-ink-100">
          ${map(policies, (p) => html`<button onclick="window.__notify('Opening ${esc(p.name)}…','info')" class="w-full text-left flex items-center gap-3 p-3.5 active:bg-ink-50">
            <span class="w-8 h-8 rounded-lg bg-ink-100 text-ink-500 grid place-items-center shrink-0">${icon(p.icon, 'w-4 h-4')}</span>
            <div class="flex-1 min-w-0"><p class="text-[13px] font-semibold text-ink-800">${esc(p.name)}</p><p class="text-[11px] text-ink-400">${esc(p.meta)}</p></div>
            ${icon('download', 'w-4 h-4 text-ink-300')}
          </button>`)}
        </div>
      </div>

      <p class="text-center text-[11px] text-ink-400">CareTask Carer · v2.4 · build 2026.06.30</p>
    </div>`
  return mobileFlow(inner)
}

/* ------------------------------------------------------------ Global search (§30) */
export function renderSearch() {
  const clients = SERVICE_USERS
  const visits = ROTA.map((r) => ({ rota: r, su: getServiceUser(r.suId) })).filter((v) => v.su)
  const recents = ['Mary Adams', 'Medication', 'Doris Finch', 'Incident']

  const inner = html`
    ${flowHeader({ title: 'Search', back: '#/carer' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ q:'',
      match(el){ return this.q.trim()==='' || el.dataset.name.includes(this.q.toLowerCase().trim()) },
      get visible(){ return [...this.$root.querySelectorAll('[data-name]')].filter(e=>this.match(e)).length } }">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
        <input x-model="q" placeholder="Search clients & today’s visits…" class="field field-md pl-9" autofocus />
      </div>

      <div x-show="q.trim()===''">
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Recent searches</p>
        <div class="flex flex-wrap gap-2">
          ${map(recents, (r) => html`<button @click="q='${esc(r)}'" class="badge bg-ink-100 text-ink-600 ring-ink-200">${icon('history', 'w-3 h-3')}${esc(r)}</button>`)}
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Clients</p>
        <div class="space-y-2">
          ${map(clients, (s) => html`<a href="#/carer/clients/${s.id}" data-name="${esc(s.name.toLowerCase())}" x-show="match($el)" class="block card p-3 active:scale-[.99]">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl grid place-items-center font-semibold text-sm shrink-0 ${avatarTone(s.color)}">${esc(s.initials)}</span>
              <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(s.name)}</p><p class="text-xs text-ink-400">${s.age} yrs · ${esc(s.package)}</p></div>
              ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
            </div>
          </a>`)}
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Today’s visits</p>
        <div class="card divide-y divide-ink-100">
          ${map(visits, (v) => html`<a href="#/carer/visit/${v.rota.id}" data-name="${esc((v.su.name + ' ' + v.rota.visit).toLowerCase())}" x-show="match($el)" class="flex items-center gap-3 p-3 active:bg-ink-50">
            <span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon('clock', 'w-4 h-4')}</span>
            <div class="flex-1 min-w-0"><p class="text-[13px] font-semibold text-ink-800">${esc(v.su.name)} · ${esc(v.rota.visit)}</p><p class="text-[11px] text-ink-400">${esc(v.rota.time)}</p></div>
            ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
          </a>`)}
        </div>
      </div>

      <div x-show="q.trim()!=='' && visible===0" x-cloak>
        ${emptyMobile({ icon: 'search', title: 'No results', body: 'Try a client name or visit type. You can only search clients assigned to you.' })}
      </div>
    </div>`
  return mobileFlow(inner)
}
