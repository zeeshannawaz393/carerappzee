import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, statCard, btn } from '../components/ui.js'
import { serviceUserCard } from '../components/domain.js'
import { SERVICE_USERS } from '../data/index.js'

export function renderServiceUsers() {
  const totalTasks = SERVICE_USERS.reduce((s, u) => s + u.activeTaskCount, 0)
  const openExceptions = SERVICE_USERS.reduce((s, u) => s + u.openExceptions, 0)
  const onPlan = SERVICE_USERS.filter((u) => u.activeTaskCount > 0).length

  const stats = [
    statCard({ label: 'Service users', value: SERVICE_USERS.length, sub: `${onPlan} with active plans`, icon: 'users', tone: 'primary' }),
    statCard({ label: 'Active tasks', value: totalTasks, sub: 'Across all care plans', icon: 'planner', tone: 'teal' }),
    statCard({ label: 'Open exceptions', value: openExceptions, sub: 'Needing office review', icon: 'alert', tone: 'danger', trend: 'down' }),
    statCard({ label: 'Avg tasks / person', value: Math.round(totalTasks / SERVICE_USERS.length), sub: 'Personalised per plan', icon: 'chart', tone: 'info' }),
  ]

  return page(html`
    ${pageHeader({
      title: 'Service Users',
      subtitle: 'Personalised, visit-linked task plans built from governed master templates and packs.',
      breadcrumbs: [{ label: 'Service Users' }],
      actions: btn('Apply template / pack', { href: '#/apply', icon: 'plus' }),
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${stats.join('')}</div>

    <div x-data="{ q: '' }">
      <div class="card p-3 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
          <input x-model="q" placeholder="Search service users by name…" class="field field-md pl-9" />
        </div>
        <span class="text-xs text-ink-400 sm:pr-1" x-text="[...$root.querySelectorAll('[data-name]')].filter(e=>q===''||e.dataset.name.includes(q.toLowerCase())).length + ' people'"></span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${map(SERVICE_USERS, (s) => `<div data-name="${esc(s.name.toLowerCase())}" x-show="q==='' || $el.dataset.name.includes(q.toLowerCase())">${serviceUserCard(s)}</div>`)}
      </div>
    </div>
  `)
}
