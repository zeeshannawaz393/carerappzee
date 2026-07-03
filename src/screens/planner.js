import { html, esc, map } from '../lib/dom.js'
import { pageWide } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, btn, badge, priorityBadge, statusBadge, sectionCard, tabs, avatar, defList, outcomeBadge } from '../components/ui.js'
import { catIcon, visitTaskRow, weeklyMatrix, evidenceSchemaPreview, evidenceForm } from '../components/domain.js'
import { getServiceUser, tasksForUser, VISIT_BLOCKS, category, getTemplate, CATEGORIES } from '../data/index.js'
import { openDrawer } from '../lib/overlay.js'
import { notFound } from './notFound.js'

export function renderPlanner({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound()
  const tasks = tasksForUser(id)

  /* ---- By visit ---- */
  const byVisit = html`<div class="space-y-5">
    ${map(VISIT_BLOCKS, (v) => {
      const vt = tasks.filter((t) => t.visit === v.visit)
      if (!vt.length) return ''
      return html`<div class="card overflow-hidden">
        <div class="flex items-center gap-3 px-5 py-3.5 bg-ink-50/70 border-b border-ink-100">
          <span class="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 grid place-items-center">${icon('clock', 'w-4.5 h-4.5')}</span>
          <div class="flex-1"><p class="text-sm font-semibold text-ink-900">${esc(v.visit)} Visit</p><p class="text-xs text-ink-500">${esc(v.time)} · ${esc(v.carer)}</p></div>
          <span class="text-xs font-medium text-ink-500">${vt.length} tasks</span>
        </div>
        <div class="p-3 space-y-2">${map(vt, visitTaskRow)}</div>
      </div>`
    })}
  </div>`

  /* ---- By category ---- */
  const cats = [...new Set(tasks.map((t) => t.categoryId))]
  const byCategory = html`<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    ${map(cats, (cid) => {
      const ct = tasks.filter((t) => t.categoryId === cid)
      return sectionCard({ title: category(cid).name, icon: category(cid).icon, pad: 'p-3', body: html`<div class="space-y-2">${map(ct, visitTaskRow)}</div>` })
    })}
  </div>`

  /* ---- Exceptions ---- */
  const exTasks = tasks.filter((t) => ['flagged', 'refused', 'missed'].includes(t.todayStatus))
  const exceptions = exTasks.length ? html`<div class="card divide-y divide-ink-100">${map(exTasks, (t) => html`
    <div class="flex items-center gap-3 p-4">
      <span class="text-danger-600">${icon('flag', 'w-5 h-5')}</span>
      ${catIcon(t.categoryId, 'w-4 h-4', 'w-8 h-8')}
      <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-800">${esc(t.title)}</p><p class="text-xs text-ink-500">${esc(t.visit)} · ${esc(t.lastOutcome)}</p></div>
      ${badge(t.todayStatus, 'bg-danger-50 text-danger-700 ring-danger-100')}
      ${btn('Review', { variant: 'secondary', size: 'sm', onclick: `window.__openTask('${t.id}')` })}
    </div>`)}</div>` : sectionCard({ body: '<p class="text-sm text-ink-400 text-center py-6">No exceptions for today. </p>' })

  /* ---- Care plan link ---- */
  const domains = [...new Set(tasks.map((t) => getTemplate(t.sourceTemplateId)?.carePlanDomain).filter(Boolean))]
  const carePlan = html`<div class="space-y-4">${map(domains, (d) => {
    const dt = tasks.filter((t) => getTemplate(t.sourceTemplateId)?.carePlanDomain === d)
    return sectionCard({ title: d, icon: 'link', pad: 'p-3', actions: badge(`${dt.length} tasks`, 'bg-primary-50 text-primary-700 ring-primary-100'), body: html`<div class="space-y-2">${map(dt, visitTaskRow)}</div>` })
  })}</div>`

  return pageWide(html`
    ${pageHeader({
      breadcrumbs: [{ label: 'Service Users', href: '#/service-users' }, { label: su.name }],
      title: `${su.name} — Task Planner`,
      actions: btn('Apply template / pack', { href: `#/apply?su=${su.id}`, icon: 'plus' }) + btn('Carer view', { href: '#/carer', variant: 'secondary', icon: 'mobile' }),
    })}

    <!-- person banner -->
    <div class="card p-4 mb-6 flex flex-wrap items-center gap-4">
      ${avatar(su.initials, su.color, 'lg')}
      <div class="min-w-0">
        <p class="text-base font-semibold text-ink-900">${esc(su.name)} <span class="text-sm font-normal text-ink-500">· ${su.age} yrs · NHS ${esc(su.nhs)}</span></p>
        <p class="text-xs text-ink-500">${esc(su.package)} · ${esc(su.address)} · Key contact: ${esc(su.keyContact)}</p>
      </div>
      <div class="flex flex-wrap gap-1.5 lg:ml-auto">
        ${su.flags.map((f) => badge(f, 'bg-info-50 text-info-600 ring-info-100')).join('')}
        ${su.risks.map((r) => badge(r, 'bg-warning-50 text-warning-700 ring-warning-100', 'alert')).join('')}
      </div>
    </div>

    ${tabs([
      { id: 'visit', label: 'By Visit', count: tasks.length, panel: byVisit },
      { id: 'cat', label: 'By Category', count: cats.length, panel: byCategory },
      { id: 'matrix', label: 'Weekly Matrix', panel: sectionCard({ title: 'Recurring task schedule', icon: 'calendar', body: weeklyMatrix(tasks) }) },
      { id: 'exceptions', label: 'Exceptions', count: exTasks.length, panel: exceptions },
      { id: 'careplan', label: 'Care Plan Links', count: domains.length, panel: carePlan },
    ])}
  `)
}

/* -------------------------------------------------- Task detail drawer */
export function openTaskDrawer(taskId) {
  let task
  for (const list of Object.values({ a: tasksForUser('su-mary') })) {
    task = list.find((t) => t.id === taskId)
    if (task) break
  }
  if (!task) return
  const t = getTemplate(task.sourceTemplateId)
  const c = category(task.categoryId)

  openDrawer({
    title: task.title,
    subtitle: `${c.name} · ${task.visit} visit · from template ${t?.code || ''}`,
    badge: priorityBadge(task.priority),
    width: 'max-w-xl',
    body: html`
      <div class="space-y-5">
        <div class="flex items-center gap-2">${catIcon(task.categoryId)}<div><p class="text-xs text-ink-400">Today's status</p>${outcomeBadge(task.todayStatus)}</div></div>

        ${sectionCard({ title: 'Personalised instruction', icon: 'mobile', body: `<p class="text-sm text-ink-700">${esc(task.instructions)}</p>` })}

        ${sectionCard({ title: 'Linkage & schedule', icon: 'link', body: defList([
          { label: 'Source template', value: t ? `<a href="#/templates/${t.id}" class="text-primary-600 font-medium">${esc(t.name)}</a>` : '—', full: true },
          { label: 'Care plan domain', value: t?.carePlanDomain },
          { label: 'Visit', value: task.visit },
          { label: 'Frequency', value: task.frequency },
          { label: 'Review date', value: task.reviewDate },
          { label: 'Last outcome', value: task.lastOutcome, full: true },
        ]) })}

        ${sectionCard({ title: 'Evidence required', icon: 'file-check', body: t ? evidenceSchemaPreview(t.evidenceSchema) : '' })}
      </div>`,
    footer:
      btn('Open in template', { href: t ? `#/templates/${t.id}` : '#', variant: 'secondary', icon: 'arrow-right' }) +
      btn('Close', { variant: 'primary', onclick: 'window.__closeDrawer()' }),
  })
}
