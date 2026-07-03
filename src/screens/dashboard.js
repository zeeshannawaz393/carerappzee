import { html, map } from '../lib/dom.js'
import { fmtDMY } from '../lib/dates.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, statCard, btn, sectionCard, badge, donut, barChart, severityBadge } from '../components/ui.js'
import { catIcon, alertRow, serviceUserCard } from '../components/domain.js'
import {
  STATS, categoryCounts, ALERTS, SERVICE_USERS, topTemplates, PACKS,
  COMPLETION_MIX, HYDRATION_TREND, HYDRATION_TARGET, AUDIT_LOG,
} from '../data/index.js'
import { carerAlerts, carerAuditEntries } from '../lib/officeBridge.js'

export function renderDashboard() {
  const cats = categoryCounts()
  const carer = carerAlerts()
  const allAlerts = [...carer, ...ALERTS]
  const openAlerts = allAlerts.filter((a) => a.status !== 'closed').slice(0, 5)
  const sev = {}
  ;['info', 'low', 'medium', 'high', 'critical'].forEach((k) => (sev[k] = allAlerts.filter((a) => a.severity === k && a.status !== 'closed').length))
  const openCount = STATS.openExceptions + carer.filter((a) => a.status === 'open').length
  const critCount = STATS.criticalAlerts + carer.filter((a) => a.severity === 'critical' && a.status === 'open').length
  const recentActivity = [...carerAuditEntries(), ...AUDIT_LOG].slice(0, 4)

  const stats = [
    statCard({ label: 'Master templates', value: STATS.templates, sub: `${STATS.published} published`, icon: 'library', tone: 'primary' }),
    statCard({ label: 'Task packs', value: STATS.packs, sub: 'Across 7 care needs', icon: 'packs', tone: 'teal' }),
    statCard({ label: 'Service users', value: STATS.serviceUsers, sub: 'Active care plans', icon: 'users', tone: 'info' }),
    statCard({ label: 'Open exceptions', value: openCount, sub: `${critCount} critical`, icon: 'alert', tone: 'danger', trend: 'down' }),
  ]

  return page(html`
    ${pageHeader({
      title: 'Care delivery overview',
      subtitle: 'Governed templates → task packs → service-user plans → visit task instances. One care delivery engine.',
      actions: btn('Create template', { href: '#/templates/new', icon: 'plus' }) + btn('Apply pack', { href: '#/apply', variant: 'secondary', icon: 'layers' }),
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${stats.join('')}</div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Left / main column -->
      <div class="xl:col-span-2 space-y-6">
        ${sectionCard({
          title: 'Today’s exceptions',
          icon: 'alert',
          actions: btn('View all', { href: '#/exceptions', variant: 'ghost', size: 'sm', iconRight: 'arrow-right' }),
          pad: 'p-0',
          body: html`<div>${map(openAlerts, alertRow)}</div>`,
        })}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          ${sectionCard({
            title: 'Task completion (7 days)',
            icon: 'chart',
            body: donut(COMPLETION_MIX, { label: 'completed' }),
          })}
          ${sectionCard({
            title: 'Mary Adams — fluid intake',
            icon: 'droplet',
            body: barChart(HYDRATION_TREND, { target: HYDRATION_TARGET, tone: 'info' }),
          })}
        </div>

        ${sectionCard({
          title: 'Most-used templates',
          icon: 'library',
          actions: btn('Library', { href: '#/templates', variant: 'ghost', size: 'sm', iconRight: 'arrow-right' }),
          pad: 'p-2',
          body: html`<div class="divide-y divide-ink-100">
            ${map(topTemplates(5), (t) => html`
              <a href="#/templates/${t.id}" class="flex items-center gap-3 p-2.5 hover:bg-ink-50 rounded-lg">
                ${catIcon(t.categoryId, 'w-4 h-4', 'w-8 h-8')}
                <div class="min-w-0 flex-1"><p class="text-sm font-medium text-ink-800 truncate">${t.name}</p><p class="text-xs text-ink-400 font-mono">${t.code}</p></div>
                <span class="text-xs text-ink-500 flex items-center gap-1">${icon('users', 'w-3.5 h-3.5')}${t.usedByCount}</span>
              </a>`)}
          </div>`,
        })}
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        ${sectionCard({
          title: 'Alert severity mix',
          icon: 'bell',
          body: html`<div class="space-y-2.5">
            ${map(Object.entries(sev), ([k, v]) => html`<div class="flex items-center gap-3">
              <span class="w-20 shrink-0">${severityBadge(k)}</span>
              <div class="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden"><div class="h-2 rounded-full ${'bg-sev-' + k}" style="width:${Math.min(100, v * 22)}%"></div></div>
              <span class="text-sm font-semibold text-ink-700 w-5 text-right">${v}</span>
            </div>`)}
          </div>`,
        })}

        ${sectionCard({
          title: 'Service users',
          icon: 'users',
          actions: btn('All', { href: '#/service-users', variant: 'ghost', size: 'sm', iconRight: 'arrow-right' }),
          pad: 'p-3',
          body: html`<div class="space-y-2.5">${map(SERVICE_USERS.slice(0, 3), serviceUserCard)}</div>`,
        })}

        ${sectionCard({
          title: 'Template library coverage',
          icon: 'grid',
          pad: 'p-3',
          body: html`<div class="grid grid-cols-2 gap-1.5">
            ${map(cats.slice(0, 8), (c) => html`<a href="#/templates?cat=${c.id}" class="flex items-center gap-2 p-2 rounded-lg hover:bg-ink-50">
              ${catIcon(c.id, 'w-3.5 h-3.5', 'w-7 h-7')}
              <div class="min-w-0"><p class="text-xs font-medium text-ink-700 truncate">${c.name.split(' ')[0]}</p><p class="text-xs text-ink-400">${c.count} templates</p></div>
            </a>`)}
          </div>`,
        })}

        ${sectionCard({
          title: 'Recent activity',
          icon: 'history',
          actions: btn('Audit', { href: '#/audit', variant: 'ghost', size: 'sm', iconRight: 'arrow-right' }),
          pad: 'p-3',
          body: html`<ul class="space-y-3">${map(recentActivity, (a) => html`<li class="flex gap-2.5 text-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0"></span>
            <div><p class="text-ink-700"><span class="font-medium">${a.action}</span> — ${a.name}</p><p class="text-xs text-ink-400">${a.by} · ${fmtDMY(a.at)}</p></div>
          </li>`)}</ul>`,
        })}
      </div>
    </div>
  `)
}
