/** Persistent application shell: sidebar + topbar + content slot. */
import { html, esc } from '../lib/dom.js'
import { icon } from '../icons.js'
import { ROLES } from '../data/governance.js'
import { STATS } from '../data/index.js'
import { store } from '../lib/store.js'

const NAV = [
  { group: 'Overview', items: [{ label: 'Dashboard', icon: 'dashboard', href: '#/' }] },
  {
    group: 'Template Library',
    items: [
      { label: 'Templates', icon: 'library', href: '#/templates' },
      { label: 'Task Packs', icon: 'packs', href: '#/packs' },
      { label: 'Approval Queue', icon: 'file-check', href: '#/governance', badge: STATS.pendingApproval },
    ],
  },
  {
    group: 'Care Delivery',
    items: [
      { label: 'Service Users', icon: 'users', href: '#/service-users' },
      { label: 'Carer App', icon: 'mobile', href: '#/carer' },
      { label: 'Exception Monitor', icon: 'alert', href: '#/exceptions', badge: STATS.openExceptions, badgeTone: 'danger' },
    ],
  },
  {
    group: 'Governance & Quality',
    items: [
      { label: 'Reports & Analytics', icon: 'chart', href: '#/reports' },
      { label: 'Audit Trail', icon: 'history', href: '#/audit' },
      { label: 'Roles & Permissions', icon: 'shield', href: '#/permissions' },
    ],
  },
]

function sidebar() {
  return html`
    <aside class="w-64 shrink-0 bg-surface-sunken border-r border-ink-200 flex flex-col h-full">
      <div class="h-16 flex items-center gap-2.5 px-5 border-b border-ink-200">
        <span class="w-9 h-9 rounded-xl bg-primary-600 text-white grid place-items-center shadow-sm">${icon('heart', 'w-5 h-5')}</span>
        <div class="leading-tight">
          <p class="text-sm font-bold text-ink-900">CareTask</p>
          <p class="text-xs text-ink-500">Template Library</p>
        </div>
      </div>
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        ${NAV.map((g) => html`
          <div>
            <p class="section-title px-3 mb-1.5">${esc(g.group)}</p>
            <div class="space-y-0.5">
              ${g.items.map((it) => html`
                <a href="${it.href}" data-nav="${it.href}" class="nav-item">
                  <span class="text-ink-400">${icon(it.icon, 'w-4.5 h-4.5')}</span>
                  <span class="flex-1">${esc(it.label)}</span>
                  ${it.badge ? `<span class="text-xs font-bold rounded-full px-1.5 py-0.5 ${it.badgeTone === 'danger' ? 'bg-danger-100 text-danger-700' : 'bg-primary-100 text-primary-700'}">${it.badge}</span>` : ''}
                </a>`).join('')}
            </div>
          </div>`).join('')}
      </nav>
      <div class="p-3 border-t border-ink-200">
        <div class="rounded-xl bg-primary-50 ring-1 ring-primary-100 p-3">
          <p class="text-xs font-semibold text-primary-800 flex items-center gap-1.5">${icon('sparkles', 'w-3.5 h-3.5')}Enterprise prototype</p>
          <p class="text-xs text-primary-700/80 mt-1">All 4 layers · ${STATS.templates} templates · ${STATS.packs} packs</p>
        </div>
      </div>
    </aside>`
}

function topbar() {
  const role = store.get('role')
  return html`
    <header class="h-16 shrink-0 bg-surface border-b border-ink-200 flex items-center gap-4 px-6">
      <div class="relative flex-1 max-w-md">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
        <input onkeydown="if(event.key==='Enter'){location.hash='#/templates?q='+encodeURIComponent(this.value)}" placeholder="Search templates, packs, service users…" class="field field-md pl-9 bg-ink-50" />
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <div x-data="{ open:false }" class="relative">
          <button @click="open=!open" class="btn btn-secondary btn-sm">
            ${icon('user-check', 'w-4 h-4')}<span class="hidden sm:inline">${esc(role)}</span>${icon('chevron-down', 'w-3.5 h-3.5')}
          </button>
          <div x-show="open" x-cloak @click.outside="open=false" class="absolute right-0 mt-2 w-60 card shadow-[var(--shadow-pop)] p-1.5 z-30 animate-pop-in">
            <p class="section-title px-2.5 py-1.5">Acting as role</p>
            ${ROLES.map((r) => `<button onclick="window.__setRole('${r.role}')" class="w-full text-left px-2.5 py-1.5 rounded-lg text-sm hover:bg-ink-50 ${r.role === role ? 'text-primary-700 font-semibold bg-primary-50' : 'text-ink-700'}">${esc(r.role)}</button>`).join('')}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm !px-2 relative" title="Notifications">
          ${icon('bell', 'w-5 h-5')}<span class="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-danger-500 ring-2 ring-white"></span>
        </button>
        <div class="flex items-center gap-2.5 pl-2 border-l border-ink-200">
          <span class="w-9 h-9 rounded-full bg-teal-100 text-teal-700 grid place-items-center text-sm font-semibold">LA</span>
          <div class="leading-tight hidden lg:block">
            <p class="text-sm font-semibold text-ink-800">L. Adeyemi</p>
            <p class="text-xs text-ink-500">Riverside Care Ltd</p>
          </div>
        </div>
      </div>
    </header>`
}

export function renderShell() {
  document.getElementById('app').innerHTML = html`
    <div class="flex h-full">
      ${sidebar()}
      <div class="flex-1 flex flex-col min-w-0">
        ${topbar()}
        <main id="route-content" class="flex-1 overflow-y-auto"></main>
      </div>
    </div>`
}

export function setActiveNav(path) {
  const base = '#/' + (path.split('?')[0].split('/')[1] || '')
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const navPath = a.getAttribute('data-nav')
    const match = navPath === '#/' ? path === '/' || path === '' : base === navPath || ('#' + path).startsWith(navPath)
    a.classList.toggle('active', match)
  })
}
