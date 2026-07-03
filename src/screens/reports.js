import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, btn, statCard, sectionCard, progressBar, barChart, donut, badge, tabs } from '../components/ui.js'
import { catIcon } from '../components/domain.js'
import {
  TEMPLATES, topTemplates, categoryCounts, complianceGaps,
  HYDRATION_TREND, HYDRATION_TARGET, COMPLETION_MIX, CQC_KEY_QUESTIONS, category,
} from '../data/index.js'

export function renderReports() {
  /* ---------- Derived template-usage stats ---------- */
  const total = TEMPLATES.length
  const totalUses = TEMPLATES.reduce((s, t) => s + (t.usedByCount || 0), 0)
  const avgUses = total ? Math.round(totalUses / total) : 0
  const byUses = [...TEMPLATES].sort((a, b) => b.usedByCount - a.usedByCount)
  const mostUsed = byUses[0]
  const leastUsedSorted = [...TEMPLATES].sort((a, b) => a.usedByCount - b.usedByCount)
  const leastUsed = leastUsedSorted[0]

  const top = topTemplates(6)
  const maxUses = mostUsed ? mostUsed.usedByCount : 1

  const cats = categoryCounts().filter((c) => c.count > 0).sort((a, b) => b.count - a.count)
  const maxCat = Math.max(...cats.map((c) => c.count), 1)

  /* ---------- Tab 1: Template usage ---------- */
  const usageStats = [
    statCard({ label: 'Master templates', value: total, sub: `${totalUses} total applications`, icon: 'library', tone: 'primary' }),
    statCard({ label: 'Avg uses / template', value: avgUses, sub: 'Across all service users', icon: 'chart', tone: 'info' }),
    statCard({ label: 'Most-used', value: mostUsed ? mostUsed.usedByCount : 0, sub: mostUsed ? mostUsed.name : '—', icon: 'star', tone: 'teal' }),
    statCard({ label: 'Least-used', value: leastUsed ? leastUsed.usedByCount : 0, sub: leastUsed ? leastUsed.name : '—', icon: 'eye', tone: 'warning' }),
  ]

  const usageTab = html`
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${usageStats.join('')}</div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      ${sectionCard({
        title: 'Most-used templates',
        icon: 'library',
        body: html`<div class="space-y-3.5">
          ${map(top, (t) => html`<a href="#/templates/${t.id}" class="block group">
            <div class="flex items-center justify-between gap-3 mb-1">
              <span class="flex items-center gap-2 min-w-0">
                ${catIcon(t.categoryId, 'w-3.5 h-3.5', 'w-7 h-7')}
                <span class="text-sm font-medium text-ink-800 truncate group-hover:text-primary-700">${esc(t.name)}</span>
              </span>
              <span class="text-xs font-semibold text-ink-600 shrink-0 flex items-center gap-1">${icon('users', 'w-3.5 h-3.5 text-ink-400')}${t.usedByCount}</span>
            </div>
            ${progressBar((t.usedByCount / maxUses) * 100, 'primary')}
          </a>`)}
        </div>`,
      })}

      ${sectionCard({
        title: 'Least-used / review candidates',
        icon: 'eye',
        actions: badge('Review', 'bg-warning-50 text-warning-700 ring-warning-100'),
        body: html`<ul class="divide-y divide-ink-100 -my-2">
          ${map(leastUsedSorted.slice(0, 5), (t) => html`<li>
            <a href="#/templates/${t.id}" class="flex items-center gap-3 py-2.5 group">
              ${catIcon(t.categoryId, 'w-3.5 h-3.5', 'w-8 h-8')}
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium text-ink-800 truncate group-hover:text-primary-700">${esc(t.name)}</span>
                <span class="block text-xs text-ink-400 font-mono">${esc(t.code)} · ${esc(category(t.categoryId).name)}</span>
              </span>
              <span class="text-xs font-semibold ${t.usedByCount <= 5 ? 'text-warning-600' : 'text-ink-500'} shrink-0">${t.usedByCount} uses</span>
            </a>
          </li>`)}
        </ul>`,
      })}
    </div>

    <div class="mt-6">
      ${sectionCard({
        title: 'Templates by category',
        icon: 'grid',
        body: html`<div class="space-y-3">
          ${map(cats, (c) => html`<div class="flex items-center gap-3">
            <span class="flex items-center gap-2 w-44 shrink-0 min-w-0">
              ${catIcon(c.id, 'w-3.5 h-3.5', 'w-7 h-7')}
              <span class="text-sm text-ink-700 truncate">${esc(c.name)}</span>
            </span>
            <div class="flex-1">${progressBar((c.count / maxCat) * 100, 'teal')}</div>
            <span class="text-xs font-semibold text-ink-600 w-6 text-right shrink-0">${c.count}</span>
          </div>`)}
        </div>`,
      })}
    </div>`

  /* ---------- Tab 2: Service-user trends ---------- */
  const MED_REFUSAL_TREND = [
    { label: 'W1', value: 1 }, { label: 'W2', value: 3 }, { label: 'W3', value: 2 },
    { label: 'W4', value: 4 }, { label: 'W5', value: 2 }, { label: 'W6', value: 1 },
  ]
  const MOOD_TREND = [
    { label: 'Mon', value: 4 }, { label: 'Tue', value: 3 }, { label: 'Wed', value: 4 },
    { label: 'Thu', value: 2 }, { label: 'Fri', value: 3 }, { label: 'Sat', value: 5 }, { label: 'Sun', value: 4 },
  ]

  const trendsTab = html`
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        ${sectionCard({
          title: 'Mary Adams — fluid intake (7 days)',
          icon: 'droplet',
          actions: badge('ml / day', 'bg-info-50 text-info-700 ring-info-100'),
          body: barChart(HYDRATION_TREND, { target: HYDRATION_TARGET, tone: 'info' }),
        })}
      </div>
      ${sectionCard({
        title: 'Task completion mix',
        icon: 'chart',
        body: donut(COMPLETION_MIX, { label: 'completed' }),
      })}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      ${sectionCard({
        title: 'Medication refusal trend',
        icon: 'pill',
        actions: badge('refusals / week', 'bg-warning-50 text-warning-700 ring-warning-100'),
        body: barChart(MED_REFUSAL_TREND, { tone: 'primary' }),
      })}
      ${sectionCard({
        title: 'Mood trend',
        icon: 'smile',
        actions: badge('mood 1–5', 'bg-teal-50 text-teal-700 ring-teal-100'),
        body: barChart(MOOD_TREND, { max: 5, tone: 'teal' }),
      })}
    </div>`

  /* ---------- Tab 3: Compliance ---------- */
  const gaps = complianceGaps()
  const complianceStats = [
    statCard({ label: 'Pending approval', value: gaps.pendingApproval, sub: 'Templates awaiting sign-off', icon: 'file-check', tone: 'warning' }),
    statCard({ label: 'No care-plan link', value: gaps.noCarePlanLink, sub: 'Missing care plan domain', icon: 'link', tone: 'danger' }),
    statCard({ label: 'Med without eMAR', value: gaps.medWithoutEmar, sub: 'Medication tasks unlinked', icon: 'pill', tone: 'danger' }),
    statCard({ label: 'No review date', value: gaps.noReviewTemporary, sub: 'Temporary tasks unscheduled', icon: 'clock', tone: 'warning' }),
  ]

  const completeness = [
    { label: 'Evidence completeness', pct: 94, tone: 'success' },
    { label: 'Tasks with care-plan link', pct: 91, tone: 'primary' },
    { label: 'Medication tasks with eMAR link', pct: 100, tone: 'success' },
    { label: 'Critical tasks completed', pct: 98, tone: 'info' },
  ]

  const gapItems = [
    { label: `${gaps.pendingApproval} templates pending approval`, sub: 'Awaiting clinical governance sign-off', href: '#/governance', tone: 'warning' },
    { label: `${gaps.noCarePlanLink} templates without care-plan domain`, sub: 'Link each to a care plan domain for CQC traceability', href: '#/templates', tone: 'danger' },
    { label: `${gaps.noReviewTemporary} temporary tasks without a review date`, sub: 'Set a review date so short-term tasks are not missed', href: '#/templates', tone: 'warning' },
    { label: `${gaps.medWithoutEmar} medication templates not linked to eMAR`, sub: 'Required for safe medicines administration evidence', href: '#/templates?cat=medication', tone: 'danger' },
  ]

  const complianceTab = html`
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${complianceStats.join('')}</div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      ${sectionCard({
        title: 'Evidence completeness',
        icon: 'shield',
        body: html`<div class="space-y-4">
          ${map(completeness, (c) => html`<div>
            <div class="flex justify-between items-baseline mb-1.5">
              <span class="text-sm text-ink-700">${esc(c.label)}</span>
              <span class="text-sm font-semibold text-ink-900">${c.pct}%</span>
            </div>
            ${progressBar(c.pct, c.tone)}
          </div>`)}
        </div>`,
      })}

      ${sectionCard({
        title: 'Compliance gaps to resolve',
        icon: 'alert',
        body: html`<ul class="divide-y divide-ink-100 -my-2.5">
          ${map(gapItems, (g) => html`<li class="flex items-start gap-3 py-2.5">
            <span class="mt-0.5 ${g.tone === 'danger' ? 'text-danger-500' : 'text-warning-500'}">${icon(g.tone === 'danger' ? 'x-circle' : 'warning', 'w-4 h-4')}</span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-ink-800">${esc(g.label)}</span>
              <span class="block text-xs text-ink-500">${esc(g.sub)}</span>
            </span>
            <a href="${g.href}" class="text-xs font-semibold text-primary-600 hover:text-primary-700 shrink-0 mt-0.5">Resolve</a>
          </li>`)}
        </ul>`,
      })}
    </div>`

  /* ---------- Tab 4: CQC evidence pack ---------- */
  const cqcCounts = CQC_KEY_QUESTIONS.map((q) => ({
    q,
    count: TEMPLATES.filter((t) => (t.cqcTags || []).includes(q)).length,
  }))
  const maxCqc = Math.max(...cqcCounts.map((c) => c.count), 1)

  const cqcTab = html`
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        ${sectionCard({
          title: 'Templates mapped to CQC key questions',
          icon: 'shield',
          actions: badge(`${TEMPLATES.length} templates`, 'bg-primary-50 text-primary-700 ring-primary-100'),
          body: html`<div class="space-y-3.5">
            ${map(cqcCounts, (c) => html`<div class="flex items-center gap-3">
              <span class="w-24 shrink-0 text-sm font-medium text-ink-800 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5 text-primary-500')}${esc(c.q)}</span>
              <div class="flex-1">${progressBar((c.count / maxCqc) * 100, 'primary')}</div>
              <span class="w-8 text-right text-xs font-semibold text-ink-600 shrink-0">${c.count}</span>
            </div>`)}
          </div>`,
        })}
      </div>

      ${sectionCard({
        title: 'How this becomes evidence',
        icon: 'file-check',
        body: html`<div class="space-y-3 text-sm text-ink-600 leading-relaxed">
          <p>Each governed template is tagged to one or more CQC key questions. Completed task records, evidence fields and missed-task trends roll up against those questions automatically.</p>
          <p>During an inspection this gives clear, time-stamped proof that care was planned, delivered and reviewed — with completion and exception trends as supporting evidence.</p>
          <div class="pt-2">
            ${btn('Export CQC evidence pack', { icon: 'download', full: true, onclick: `window.__notify('CQC evidence pack exported','success')` })}
          </div>
        </div>`,
      })}
    </div>`

  /* ---------- Page ---------- */
  return page(html`
    ${pageHeader({
      title: 'Reports & Analytics',
      subtitle: 'Turn everyday task data into quality, safety and CQC compliance evidence — usage, service-user trends and inspection-ready packs.',
      actions: btn('Export CQC evidence pack', { icon: 'download', onclick: `window.__notify('CQC evidence pack exported','success')` }),
    })}

    ${tabs([
      { id: 'usage', label: 'Template usage', panel: usageTab },
      { id: 'trends', label: 'Service-user trends', panel: trendsTab },
      { id: 'compliance', label: 'Compliance', panel: complianceTab },
      { id: 'cqc', label: 'CQC evidence pack', panel: cqcTab },
    ])}
  `)
}
