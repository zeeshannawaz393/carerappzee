import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, badge, sectionCard } from '../components/ui.js'
import { ROLES, PERMISSION_RULES } from '../data/index.js'

/* Boolean permission → green check / grey x icon. */
function boolPerm(on) {
  return on
    ? `<span class="text-success-600">${icon('check-circle', 'w-5 h-5')}</span>`
    : `<span class="text-ink-300">${icon('x-circle', 'w-5 h-5')}</span>`
}

/* String permission → coloured level badge. */
const PERM_TONE = {
  full: 'bg-primary-50 text-primary-700 ring-primary-200',
  edit: 'bg-primary-50 text-primary-700 ring-primary-100',
  draft: 'bg-info-50 text-info-600 ring-info-100',
  suggest: 'bg-info-50 text-info-600 ring-info-100',
  view: 'bg-ink-100 text-ink-600 ring-ink-200',
  none: 'bg-ink-100 text-ink-400 ring-ink-200',
}
const PERM_LABEL = { full: 'Full', edit: 'Edit', draft: 'Draft', suggest: 'Suggest', view: 'View', none: 'None' }
function levelPerm(level) {
  return badge(PERM_LABEL[level] || level, PERM_TONE[level] || PERM_TONE.none)
}

export function renderPermissions() {
  const matrix = html`
    <div class="card overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Manage templates</th>
            <th class="text-center">Approve</th>
            <th class="text-center">Apply to SU</th>
            <th class="text-center">Complete tasks</th>
            <th>Governance</th>
            <th>Reports</th>
          </tr>
        </thead>
        <tbody>
          ${map(ROLES, (r) => html`<tr>
            <td>
              <p class="font-semibold text-ink-900">${esc(r.role)}</p>
              <p class="text-xs text-ink-500 max-w-xs">${esc(r.desc)}</p>
            </td>
            <td>${levelPerm(r.perms.manageTemplates)}</td>
            <td class="text-center">${boolPerm(r.perms.approve)}</td>
            <td class="text-center">${boolPerm(r.perms.apply)}</td>
            <td class="text-center">${boolPerm(r.perms.complete)}</td>
            <td>${levelPerm(r.perms.governance)}</td>
            <td>${levelPerm(r.perms.reports)}</td>
          </tr>`)}
        </tbody>
      </table>
    </div>`

  const rules = html`<ul class="space-y-2.5">
    ${map(PERMISSION_RULES, (rule) => html`<li class="flex items-start gap-3 p-3 rounded-lg ring-1 ring-ink-200">
      <span class="text-primary-600 shrink-0">${icon('shield', 'w-4.5 h-4.5')}</span>
      <span class="text-sm text-ink-700">${esc(rule)}</span>
      <span class="text-success-600 ml-auto shrink-0">${icon('check', 'w-4 h-4')}</span>
    </li>`)}
  </ul>`

  /* Key capability chips per role card. */
  function keyCaps(r) {
    const caps = []
    if (r.perms.manageTemplates !== 'none') caps.push(badge(`Templates: ${PERM_LABEL[r.perms.manageTemplates] || r.perms.manageTemplates}`, PERM_TONE[r.perms.manageTemplates] || PERM_TONE.none))
    if (r.perms.approve) caps.push(badge('Can approve', 'bg-success-50 text-success-700 ring-success-100', 'check-circle'))
    if (r.perms.apply) caps.push(badge('Apply to SU', 'bg-teal-50 text-teal-600 ring-teal-100', 'user-check'))
    if (r.perms.complete) caps.push(badge('Complete tasks', 'bg-ink-100 text-ink-600 ring-ink-200', 'check'))
    if (r.perms.reports !== 'none') caps.push(badge(`Reports: ${PERM_LABEL[r.perms.reports] || r.perms.reports}`, PERM_TONE[r.perms.reports] || PERM_TONE.none))
    if (!caps.length) caps.push(badge('View only', 'bg-ink-100 text-ink-400 ring-ink-200', 'eye'))
    return caps.slice(0, 3).join('')
  }

  const roleCards = html`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    ${map(ROLES, (r) => html`<div class="card p-4 flex flex-col gap-3">
      <div class="flex items-center gap-2.5">
        <span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon('user-check', 'w-4.5 h-4.5')}</span>
        <h3 class="text-sm font-semibold text-ink-900">${esc(r.role)}</h3>
      </div>
      <p class="text-sm text-ink-500 leading-relaxed min-h-[2.5rem]">${esc(r.desc)}</p>
      <div class="flex flex-wrap gap-1.5 pt-2 mt-auto border-t border-ink-100">${keyCaps(r)}</div>
    </div>`)}
  </div>`

  return page(html`
    ${pageHeader({
      title: 'Roles & Permissions',
      subtitle: 'Role-based access control governing who can create, approve, apply and complete care tasks across the platform.',
    })}

    <div class="space-y-6">
      ${matrix}

      ${sectionCard({ title: 'Important permission rules', icon: 'shield', body: rules })}

      <div>
        <h2 class="section-title mb-3">Roles at a glance</h2>
        ${roleCards}
      </div>
    </div>
  `)
}
