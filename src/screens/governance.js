import { html, esc, map } from '../lib/dom.js'
import { fmtDMY } from '../lib/dates.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, statCard, btn, badge, sectionCard } from '../components/ui.js'
import { stepper } from '../components/domain.js'
import { STATS, TEMPLATES, APPROVAL_QUEUE, AUDIT_LOG } from '../data/index.js'

export function renderGovernance() {
  const lockedInUse = TEMPLATES.filter((t) => t.usedByCount > 0).length

  const stats = [
    statCard({ label: 'Pending approval', value: STATS.pendingApproval, sub: 'Awaiting governance review', icon: 'clock', tone: 'warning' }),
    statCard({ label: 'Drafts in progress', value: STATS.drafts, sub: 'Not yet submitted', icon: 'edit', tone: 'info' }),
    statCard({ label: 'Published templates', value: STATS.published, sub: 'Live across care plans', icon: 'file-check', tone: 'success' }),
    statCard({ label: 'Locked from deletion', value: lockedInUse, sub: 'In use — retire only', icon: 'shield', tone: 'primary' }),
  ]

  /* ---- Approval queue rows ---- */
  const queue = APPROVAL_QUEUE.length
    ? html`<div class="divide-y divide-ink-100">${map(APPROVAL_QUEUE, (q) => {
        const nameHtml = q.templateId
          ? `<a href="#/templates/${q.templateId}" class="hover:text-primary-700">${esc(q.name)}</a>`
          : esc(q.name)
        const stageBadge = q.stage === 'Draft — not submitted'
          ? badge(q.stage, 'bg-ink-100 text-ink-500 ring-ink-200', 'edit')
          : badge(q.stage, 'bg-warning-50 text-warning-700 ring-warning-100', 'clock')
        return html`<div class="flex flex-col lg:flex-row lg:items-center gap-3 p-4">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-ink-900">${nameHtml}</p>
            <p class="text-xs text-ink-500 mt-0.5">${esc(q.category)} · ${esc(q.type)}</p>
            <p class="text-xs text-ink-400 mt-1">Submitted by ${esc(q.submittedBy)} · ${esc(fmtDMY(q.submittedAt))}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            ${stageBadge}
            <span class="text-xs text-ink-400 font-mono">${esc(q.version)}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            ${btn('Review', { variant: 'secondary', size: 'sm', icon: 'eye', onclick: `window.__notify('Opening review for ${esc(q.name)}','info')` })}
            ${btn('Approve', { variant: 'primary', size: 'sm', icon: 'check', onclick: `window.__notify('Approved — ${esc(q.name)}','success')` })}
            ${btn('Reject', { variant: 'danger', size: 'sm', icon: 'x', onclick: `window.__notify('Rejected — ${esc(q.name)} returned to author','warning')` })}
          </div>
        </div>`
      })}</div>`
    : '<p class="text-sm text-ink-500 text-center py-6">Approval queue is clear.</p>'

  /* ---- Approval workflow (process diagram) ---- */
  const flowSteps = ['Care Coordinator', 'Clinical / Governance lead', 'Registered Manager', 'Published']
  const flowDesc = ['creates draft', 'reviews', 'approves', 'live to carers']
  const workflow = html`
    <div class="space-y-5">
      ${stepper(flowSteps, 2)}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${map(flowSteps, (s, i) => html`<div class="rounded-lg ring-1 ring-ink-200 bg-ink-50/40 p-3">
          <p class="text-sm font-semibold text-ink-800">${esc(s)}</p>
          <p class="text-xs text-ink-500 mt-0.5">${esc(flowDesc[i])}</p>
        </div>`)}
      </div>
    </div>`

  /* ---- Versioning rules ---- */
  const versionRules = [
    { v: 'v1.0', tone: 'bg-ink-100 text-ink-600 ring-ink-200', label: 'Initial approved template — first publish.' },
    { v: 'v1.1', tone: 'bg-info-50 text-info-600 ring-info-100', label: 'Minor — wording or instruction change, no data impact.' },
    { v: 'v2.0', tone: 'bg-danger-50 text-danger-700 ring-danger-100', label: 'Major — evidence schema or alert rule change.' },
  ]
  const applyOptions = [
    { label: 'New tasks only', desc: 'Existing service-user tasks keep the prior version.', icon: 'plus', tone: 'text-primary-600' },
    { label: 'All existing tasks', desc: 'Re-version every task created from this template.', icon: 'history', tone: 'text-warning-600' },
    { label: 'Selected service users', desc: 'Choose which care plans receive the update.', icon: 'user-check', tone: 'text-info-600' },
    { label: 'Do not update', desc: 'Publish for future use, leave current tasks untouched.', icon: 'x-circle', tone: 'text-ink-400' },
  ]
  const versioning = html`
    <div class="space-y-5">
      <div>
        <p class="section-title mb-2">Version numbering</p>
        <ul class="space-y-2">${map(versionRules, (r) => html`<li class="flex items-start gap-3">
          ${badge(r.v, r.tone)}
          <span class="text-sm text-ink-700">${esc(r.label)}</span>
        </li>`)}</ul>
      </div>
      <div class="pt-4 border-t border-ink-100">
        <p class="section-title mb-2">Apply update to</p>
        <ul class="space-y-2">${map(applyOptions, (o) => html`<li class="flex items-start gap-3 p-3 rounded-lg ring-1 ring-ink-200">
          <span class="${o.tone} shrink-0">${icon(o.icon, 'w-5 h-5')}</span>
          <div class="min-w-0"><p class="text-sm font-medium text-ink-800">${esc(o.label)}</p><p class="text-xs text-ink-500">${esc(o.desc)}</p></div>
        </li>`)}</ul>
      </div>
    </div>`

  /* ---- Status lifecycle ---- */
  const lifecycle = [
    { s: 'Draft', tone: 'bg-ink-100 text-ink-600 ring-ink-200', dot: 'bg-ink-400' },
    { s: 'Pending', tone: 'bg-warning-50 text-warning-700 ring-warning-100', dot: 'bg-warning-500' },
    { s: 'Approved', tone: 'bg-success-50 text-success-700 ring-success-100', dot: 'bg-success-500' },
    { s: 'Published', tone: 'bg-success-50 text-success-700 ring-success-100', dot: 'bg-success-500' },
    { s: 'Deprecated', tone: 'bg-ink-100 text-ink-500 ring-ink-200', dot: 'bg-ink-300' },
    { s: 'Retired', tone: 'bg-ink-100 text-ink-400 ring-ink-200', dot: 'bg-ink-300' },
    { s: 'Archived', tone: 'bg-ink-100 text-ink-400 ring-ink-200', dot: 'bg-ink-300' },
  ]
  const lifecycleRow = html`
    <div class="flex flex-wrap items-center gap-1.5">
      ${map(lifecycle, (l, i) => html`<span class="inline-flex items-center gap-1.5">
        <span class="badge ${l.tone}"><span class="w-1.5 h-1.5 rounded-full ${l.dot}"></span>${esc(l.s)}</span>
        ${i < lifecycle.length - 1 ? `<span class="text-ink-300">${icon('arrow-right', 'w-3.5 h-3.5')}</span>` : ''}
      </span>`)}
    </div>`

  /* ---- Recent governance activity ---- */
  const templateAudit = AUDIT_LOG.filter((a) => a.entity === 'Template')
  const activity = html`<ol class="relative border-l border-ink-200 ml-2 space-y-5">
    ${map(templateAudit, (a) => html`<li class="ml-5">
      <span class="absolute -left-[7px] w-3 h-3 rounded-full bg-primary-400 ring-4 ring-white"></span>
      <p class="text-sm text-ink-800"><span class="font-semibold">${esc(a.action)}</span> — ${esc(a.name)}</p>
      <p class="text-xs text-ink-400 mt-0.5">${esc(a.by)} · ${esc(a.role)} · ${esc(fmtDMY(a.at))}</p>
      ${a.reason ? `<p class="text-xs text-ink-500 mt-0.5">${esc(a.reason)}</p>` : ''}
    </li>`)}
  </ol>`

  return page(html`
    ${pageHeader({
      title: 'Governance & Approval',
      subtitle: 'Controlled template publishing with multi-stage approval, semantic versioning and a full audit trail.',
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${stats.join('')}</div>

    <div class="space-y-6">
      ${sectionCard({ title: 'Approval queue', icon: 'file-check', actions: badge(`${APPROVAL_QUEUE.length} items`, 'bg-warning-50 text-warning-700 ring-warning-100'), pad: 'p-0', body: queue })}

      ${sectionCard({ title: 'Approval workflow', icon: 'user-check', body: workflow })}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${sectionCard({ title: 'Versioning rules', icon: 'history', body: versioning })}
        ${sectionCard({ title: 'Template status lifecycle', icon: 'layers', body: html`<div class="space-y-3"><p class="text-sm text-ink-500">A template moves through these governed states across its life. Used templates are never deleted — only retired or archived.</p>${lifecycleRow}</div>` })}
      </div>

      ${sectionCard({ title: 'Recent governance activity', icon: 'shield', body: activity })}
    </div>
  `)
}
