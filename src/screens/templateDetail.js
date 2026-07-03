import { html, esc, map } from '../lib/dom.js'
import { fmtDMY } from '../lib/dates.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, btn, badge, priorityBadge, statusBadge, cqcTag, sectionCard, defList, tabs, severityBadge } from '../components/ui.js'
import { catIcon, evidenceSchemaPreview, evidenceForm } from '../components/domain.js'
import { getTemplate, category, TEMPLATE_TYPES, TEMPLATE_VERSIONS, PRIORITIES } from '../data/index.js'
import { notFound } from './notFound.js'

export function renderTemplateDetail({ id }) {
  const t = getTemplate(id)
  if (!t) return notFound()
  const c = category(t.categoryId)
  const type = TEMPLATE_TYPES[t.type]
  const versions = TEMPLATE_VERSIONS[t.id] || [{ version: t.governance.version, date: t.governance.approvedAt, status: t.governance.status, by: t.governance.approvedBy, reason: t.governance.changeReason, change: 'initial' }]

  const completionLabels = {
    optional: 'Optional', recommended: 'Recommended', important: 'Important', essential: 'Essential', critical: 'Critical',
    required_before_visit: 'Required before visit completion', manager_review: 'Requires manager review',
  }

  /* ---- Overview tab ---- */
  const overview = html`
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        ${sectionCard({ title: 'Purpose — why this task matters', icon: 'info', body: html`
          <p class="text-sm text-ink-700 leading-relaxed">${esc(t.purpose || t.description)}</p>
          ${t.description && t.purpose ? `<p class="text-sm text-ink-500 mt-3">${esc(t.description)}</p>` : ''}
        ` })}

        ${sectionCard({ title: 'Carer instructions', icon: 'mobile', body: html`
          <div class="space-y-4">
            <div><p class="section-title mb-1">Short instruction</p><p class="text-sm text-ink-800">${esc(t.instructions.short)}</p></div>
            ${t.instructions.detailed ? `<div><p class="section-title mb-1">Detailed</p><p class="text-sm text-ink-700">${esc(t.instructions.detailed)}</p></div>` : ''}
            ${t.instructions.dosDonts.length ? html`<div><p class="section-title mb-1.5">Do / do not</p><ul class="space-y-1">${map(t.instructions.dosDonts, (d) => `<li class="flex items-start gap-2 text-sm text-ink-700">${icon('check', 'w-4 h-4 text-success-600 mt-0.5 shrink-0')}${esc(d)}</li>`)}</ul></div>` : ''}
            ${t.instructions.dignity ? `<div class="rounded-lg bg-teal-50 ring-1 ring-teal-100 p-3"><p class="text-xs font-semibold text-teal-700 mb-0.5">Dignity & privacy</p><p class="text-sm text-teal-800">${esc(t.instructions.dignity)}</p></div>` : ''}
            ${t.instructions.escalation ? `<div class="rounded-lg bg-danger-50 ring-1 ring-danger-100 p-3"><p class="text-xs font-semibold text-danger-700 mb-0.5 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}Escalation</p><p class="text-sm text-danger-800">${esc(t.instructions.escalation)}</p></div>` : ''}
          </div>` })}

        ${sectionCard({ title: 'Evidence schema', icon: 'file-check', actions: badge(`${t.evidenceSchema.fields.length} fields`, 'bg-ink-100 text-ink-600 ring-ink-200'), body: evidenceSchemaPreview(t.evidenceSchema) })}

        ${t.alertRules.length ? sectionCard({ title: 'Alert rules', icon: 'bell', body: html`<ul class="space-y-2">${map(t.alertRules, (a) => html`
          <li class="flex items-center gap-3 p-3 rounded-lg ring-1 ring-ink-200">
            ${severityBadge(a.severity)}
            <div class="flex-1 min-w-0"><p class="text-sm font-medium text-ink-800">${esc(a.label)}</p><p class="text-xs text-ink-500 font-mono">${esc(a.condition)}</p></div>
          </li>`)}</ul>` }) : ''}
      </div>

      <div class="space-y-6">
        ${sectionCard({ title: 'Care planning links', icon: 'link', body: defList([
          { label: 'Care plan domain', value: t.carePlanDomain ? `<span class="font-medium text-primary-700">${esc(t.carePlanDomain)}</span>` : '', full: true },
          { label: 'Risk link', value: t.riskLink ? badge(t.riskLink, 'bg-warning-50 text-warning-700 ring-warning-100', 'alert') : '', full: true },
          { label: 'Quality statement', value: t.qualityStatement, full: true },
        ]) + `<div class="mt-3 pt-3 border-t border-ink-100"><p class="section-title mb-2">CQC key questions</p><div class="flex flex-wrap gap-1.5">${t.cqcTags.map(cqcTag).join('')}</div></div>` })}

        ${sectionCard({ title: 'Visit & scheduling defaults', icon: 'calendar', body: defList([
          { label: 'Default visits', value: t.defaultVisits.map((v) => badge(v, 'bg-ink-50 text-ink-600 ring-ink-200')).join(' '), full: true },
          { label: 'Frequency', value: t.frequency },
          { label: 'Duration', value: `${t.duration} min` },
          { label: 'Priority', value: priorityBadge(t.priority) },
          { label: 'Completion rule', value: badge(completionLabels[t.completionRule] || t.completionRule, t.completionRule === 'critical' || t.completionRule === 'required_before_visit' ? 'bg-danger-50 text-danger-700 ring-danger-100' : 'bg-ink-100 text-ink-600 ring-ink-200') },
        ]) })}

        ${t.dependencies.length ? sectionCard({ title: 'Dependency rules', icon: 'shield', body: html`<ul class="space-y-1.5">${map(t.dependencies, (d) => `<li class="flex items-start gap-2 text-sm text-ink-700">${icon('check-circle', 'w-4 h-4 text-primary-500 mt-0.5 shrink-0')}${esc(d)}</li>`)}</ul>` }) : ''}

        ${sectionCard({ title: 'Visibility', icon: 'eye', body: html`<div class="grid grid-cols-1 gap-1.5">${map(Object.entries({ 'Carer app': t.visibility.carer, 'Office': t.visibility.office, 'Family portal': t.visibility.family, 'Reports': t.visibility.reports, 'Care plan printout': t.visibility.carePlanPrint, 'Audit pack': t.visibility.auditPack }), ([k, v]) => `<div class="flex items-center justify-between text-sm"><span class="text-ink-600">${k}</span>${v ? `<span class="text-success-600">${icon('check-circle', 'w-4 h-4')}</span>` : `<span class="text-ink-300">${icon('x-circle', 'w-4 h-4')}</span>`}</div>`)}</div>` })}
      </div>
    </div>`

  /* ---- Versions tab ---- */
  const versionsTab = html`
    ${sectionCard({ title: 'Version history', icon: 'history', pad: 'p-0', body: html`
      <ol class="divide-y divide-ink-100">
        ${map(versions, (v, i) => html`<li class="flex items-start gap-4 p-4">
          <div class="flex flex-col items-center"><span class="w-9 h-9 rounded-full grid place-items-center text-xs font-bold ${i === 0 ? 'bg-success-500 text-white' : 'bg-ink-100 text-ink-500'}">${esc(v.version)}</span></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">${statusBadge(v.status)}<span class="text-xs text-ink-400">${esc(fmtDMY(v.date))}</span>${v.change === 'major' ? badge('Major', 'bg-danger-50 text-danger-600 ring-danger-100') : v.change === 'minor' ? badge('Minor', 'bg-info-50 text-info-600 ring-info-100') : ''}</div>
            <p class="text-sm text-ink-800 mt-1">${esc(v.reason)}</p>
            <p class="text-xs text-ink-500 mt-0.5">by ${esc(v.by)}</p>
          </div>
        </li>`)}
      </ol>` })}`

  /* ---- Audit tab ---- */
  const auditTab = sectionCard({ title: 'Governance & audit', icon: 'shield', body: defList([
    { label: 'Owner team', value: t.governance.ownerTeam },
    { label: 'Current version', value: t.governance.version },
    { label: 'Status', value: statusBadge(t.governance.status) },
    { label: 'Approved by', value: t.governance.approvedBy },
    { label: 'Approved date', value: t.governance.approvedAt },
    { label: 'Applied to', value: `${t.usedByCount} service users` },
    { label: 'Change reason', value: t.governance.changeReason, full: true },
    { label: 'Deletion', value: t.usedByCount > 0 ? badge('Locked — in use, retire only', 'bg-warning-50 text-warning-700 ring-warning-100', 'shield') : badge('Deletable', 'bg-ink-100 text-ink-600 ring-ink-200'), full: true },
  ]) })

  return page(html`
    ${pageHeader({
      breadcrumbs: [{ label: 'Library', href: '#/templates' }, { label: c.name, href: `#/templates?cat=${c.id}` }, { label: t.name }],
      title: t.name,
      actions:
        btn('Apply to service user', { href: `#/apply?template=${t.id}`, icon: 'user-check' }) +
        btn('Edit', { href: `#/templates/${t.id}/edit`, variant: 'secondary', icon: 'edit' }) +
        btn('Duplicate', { variant: 'secondary', icon: 'copy', onclick: `window.__notify('Template duplicated as draft','success')` }),
    })}

    <div class="flex flex-wrap items-center gap-3 mb-6 -mt-2">
      ${catIcon(t.categoryId)}
      <div class="flex items-center gap-2 flex-wrap">
        ${statusBadge(t.governance.status)}
        ${badge(type.label, 'bg-ink-100 text-ink-600 ring-ink-200', type.icon)}
        ${priorityBadge(t.priority)}
        <span class="text-xs text-ink-400 font-mono">${esc(t.code)} · ${esc(t.governance.version)}</span>
      </div>
    </div>

    ${tabs([
      { id: 'overview', label: 'Overview', panel: overview },
      { id: 'evidence', label: 'Evidence & carer view', panel: html`<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${sectionCard({ title: 'Evidence schema (config)', icon: 'file-check', body: evidenceSchemaPreview(t.evidenceSchema) })}
          ${sectionCard({ title: 'Carer recording preview', icon: 'mobile', body: html`<div class="max-w-sm">${evidenceForm(t.evidenceSchema)}<button class="btn btn-primary btn-md w-full mt-2">${icon('check', 'w-4 h-4')}Save record</button></div>` })}
        </div>` },
      { id: 'versions', label: 'Versions', count: versions.length, panel: versionsTab },
      { id: 'audit', label: 'Governance & audit', panel: auditTab },
    ])}
  `)
}
