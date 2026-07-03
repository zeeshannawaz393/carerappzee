/** Domain components — care-specific, composed from UI primitives. */
import { html, esc, cx, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { category, TEMPLATE_TYPES, PRIORITIES } from '../data/enums.js'
import { badge, priorityBadge, statusBadge, cqcTag, avatar, severityBadge, outcomeBadge, progressBar } from './ui.js'

const CAT_TONE = {
  primary: 'bg-primary-50 text-primary-600 ring-primary-100',
  danger: 'bg-danger-50 text-danger-600 ring-danger-100',
  warning: 'bg-warning-50 text-warning-600 ring-warning-100',
  info: 'bg-info-50 text-info-600 ring-info-100',
  teal: 'bg-teal-50 text-teal-600 ring-teal-100',
  success: 'bg-success-50 text-success-600 ring-success-100',
  ink: 'bg-ink-100 text-ink-500 ring-ink-200',
}

export function catIcon(categoryId, size = 'w-5 h-5', box = 'w-10 h-10') {
  const c = category(categoryId)
  return `<span class="grid place-items-center rounded-lg ring-1 ${box} ${CAT_TONE[c.color] || CAT_TONE.ink}">${icon(c.icon, size)}</span>`
}

/* --------------------------------------------------------- Template card */
export function templateCard(t) {
  const c = category(t.categoryId)
  const type = TEMPLATE_TYPES[t.type]
  return html`
    <a href="#/templates/${t.id}" class="card card-hover p-4 flex flex-col gap-3 group">
      <div class="flex items-start gap-3">
        ${catIcon(t.categoryId)}
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold text-ink-900 leading-snug group-hover:text-primary-700 line-clamp-2">${esc(t.name)}</h3>
          <p class="text-xs text-ink-500 mt-0.5">${esc(c.name)} · ${esc(type.label)}</p>
        </div>
      </div>
      <p class="text-sm text-ink-500 line-clamp-2 min-h-[2.5rem]">${esc(t.description || t.instructions.short)}</p>
      <div class="flex flex-wrap items-center gap-1.5">
        ${priorityBadge(t.priority)}
        ${t.defaultVisits.slice(0, 2).map((v) => badge(v, 'bg-ink-50 text-ink-500 ring-ink-200', 'clock')).join('')}
        ${t.alertRules.length ? badge(`${t.alertRules.length} alerts`, 'bg-warning-50 text-warning-700 ring-warning-100', 'alert') : ''}
      </div>
      <div class="flex items-center justify-between pt-2 mt-auto border-t border-ink-100 text-xs text-ink-500">
        <span class="font-mono">${esc(t.code)} · ${esc(t.governance.version)}</span>
        <span class="flex items-center gap-1">${icon('users', 'w-3.5 h-3.5')} ${t.usedByCount}</span>
      </div>
    </a>`
}

/* --------------------------------------------------------- Template row */
export function templateRow(t, attrs = '') {
  const c = category(t.categoryId)
  const type = TEMPLATE_TYPES[t.type]
  return html`
    <tr ${attrs} class="cursor-pointer" onclick="location.hash='#/templates/${t.id}'">
      <td>
        <div class="flex items-center gap-3">
          ${catIcon(t.categoryId, 'w-4 h-4', 'w-8 h-8')}
          <div class="min-w-0">
            <p class="font-semibold text-ink-900 truncate">${esc(t.name)}</p>
            <p class="text-xs text-ink-500 font-mono">${esc(t.code)}</p>
          </div>
        </div>
      </td>
      <td class="text-ink-600">${esc(c.name)}</td>
      <td>${badge(type.label, 'bg-ink-50 text-ink-600 ring-ink-200', type.icon)}</td>
      <td class="text-ink-600 whitespace-nowrap">${t.defaultVisits.slice(0, 2).join(', ')}${t.defaultVisits.length > 2 ? '…' : ''}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td class="text-center">${t.alertRules.length ? `<span class="inline-flex items-center gap-1 text-warning-600 text-xs font-semibold">${icon('alert', 'w-3.5 h-3.5')}${t.alertRules.length}</span>` : '<span class="text-ink-300">—</span>'}</td>
      <td>${statusBadge(t.governance.status)}</td>
      <td class="text-ink-500 text-center">${t.usedByCount}</td>
    </tr>`
}

/* ------------------------------------------------- Evidence form renderer */
const FIELD_ICON = { boolean: 'check-circle', select: 'chevron-down', multiselect: 'list', number: 'scale', text: 'edit', textarea: 'edit', datetime: 'clock', signature: 'signature', bodymap: 'activity', photo: 'eye', score: 'target', checklist: 'list' }

/** Read-only schema preview (used in template detail / wizard). */
export function evidenceSchemaPreview(schema) {
  if (!schema?.fields?.length) return '<p class="text-sm text-ink-400">No evidence fields configured.</p>'
  return html`<ul class="divide-y divide-ink-100">
    ${map(schema.fields, (f) => html`
      <li class="flex items-start gap-3 py-2.5">
        <span class="w-7 h-7 rounded-md bg-ink-50 text-ink-400 grid place-items-center shrink-0">${icon(FIELD_ICON[f.type] || 'info', 'w-3.5 h-3.5')}</span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-ink-800">${esc(f.label)}
            ${f.required ? '<span class="text-danger-500 ml-0.5">*</span>' : ''}
            ${f.unit ? `<span class="text-xs text-ink-500 font-normal">(${esc(f.unit)})</span>` : ''}
          </p>
          <p class="text-xs text-ink-500">${esc(f.type)}${f.options ? ` · ${f.options.length} options` : ''}${f.requiredIf ? ` · shown when <code class="text-primary-600">${esc(f.requiredIf)}</code>` : ''}</p>
        </div>
        ${f.required ? badge('Required', 'bg-danger-50 text-danger-600 ring-danger-100') : badge('Optional', 'bg-ink-50 text-ink-500 ring-ink-200')}
      </li>`)}
  </ul>`
}

/** Interactive carer-facing field (used in evidence demo / carer mobile). */
export function evidenceField(f) {
  const label = `<label class="label">${esc(f.label)}${f.required ? '<span class="text-danger-500 ml-0.5">*</span>' : ''}</label>`
  const cond = f.requiredIf ? `<p class="hint">Shown when <code class="text-primary-600">${esc(f.requiredIf)}</code></p>` : ''
  let control = ''
  switch (f.type) {
    case 'boolean':
      control = html`<div class="flex gap-2">
        <button type="button" class="btn btn-secondary btn-sm flex-1" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('!bg-success-50','!ring-success-300','!text-success-700'));this.classList.add('!bg-success-50','!ring-success-300','!text-success-700')">${icon('check', 'w-4 h-4')}Yes</button>
        <button type="button" class="btn btn-secondary btn-sm flex-1" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('!bg-danger-50','!ring-danger-300','!text-danger-700'));this.classList.add('!bg-danger-50','!ring-danger-300','!text-danger-700')">${icon('x', 'w-4 h-4')}No</button>
      </div>`
      break
    case 'select':
      control = `<select class="field field-md"><option value="">Select…</option>${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`
      break
    case 'checklist':
      control = html`<div class="space-y-1.5">${map(f.options, (o) => `<label class="flex items-center gap-2.5 p-2 rounded-lg ring-1 ring-ink-200 hover:bg-ink-50 cursor-pointer"><input type="checkbox" class="w-4 h-4 rounded text-primary-600"/><span class="text-sm text-ink-700">${esc(o)}</span></label>`)}</div>`
      break
    case 'number':
      control = `<div class="relative"><input type="number" min="${f.min ?? ''}" max="${f.max ?? ''}" class="field field-md ${f.unit ? 'pr-12' : ''}" placeholder="0"/>${f.unit ? `<span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">${esc(f.unit)}</span>` : ''}</div>`
      break
    case 'score': {
      const steps = []
      for (let i = f.min; i <= f.max; i++) steps.push(i)
      control = html`<div class="flex flex-wrap gap-1.5">${steps.map((s) => `<button type="button" class="w-9 h-9 rounded-lg ring-1 ring-ink-200 text-sm font-semibold text-ink-600 hover:bg-primary-50 hover:ring-primary-300" onclick="this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('!bg-primary-600','!text-white','!ring-primary-600'));this.classList.add('!bg-primary-600','!text-white','!ring-primary-600')">${s}</button>`).join('')}</div>`
      break
    }
    case 'textarea':
      control = `<textarea rows="3" class="field px-3 py-2" placeholder="Type a note…"></textarea>`
      break
    case 'datetime':
      control = `<input type="time" class="field field-md" />`
      break
    case 'signature':
      control = `<div class="h-20 rounded-lg ring-1 ring-dashed ring-ink-300 bg-ink-50/50 grid place-items-center text-ink-400 text-sm">${icon('signature', 'w-5 h-5')}<span class="ml-2">Tap to sign</span></div>`
      break
    case 'photo':
      control = `<button type="button" class="w-full h-16 rounded-lg ring-1 ring-dashed ring-ink-300 bg-ink-50/50 grid place-items-center text-ink-400 text-sm hover:bg-ink-100">${icon('eye', 'w-5 h-5')}<span class="ml-2">Add photo</span></button>`
      break
    case 'bodymap':
      control = bodyMap()
      break
    default:
      control = `<input type="text" class="field field-md" placeholder="…"/>`
  }
  return `<div class="mb-4">${label}${control}${cond}</div>`
}

export function evidenceForm(schema) {
  if (!schema?.fields?.length) return ''
  return schema.fields.map(evidenceField).join('')
}

/* --------------------------------------------------------- Body map (SVG) */
export function bodyMap() {
  return html`
    <div class="rounded-lg ring-1 ring-ink-200 bg-ink-50/40 p-3 flex justify-center">
      <svg viewBox="0 0 120 240" class="h-44">
        <g fill="#dce1e9" stroke="#94a0b1" stroke-width="1.5">
          <circle cx="60" cy="24" r="16"/>
          <rect x="44" y="42" width="32" height="70" rx="12"/>
          <rect x="26" y="48" width="16" height="56" rx="8"/>
          <rect x="78" y="48" width="16" height="56" rx="8"/>
          <rect x="46" y="112" width="13" height="80" rx="7"/>
          <rect x="61" y="112" width="13" height="80" rx="7"/>
        </g>
        <circle cx="60" cy="100" r="6" fill="#d4351c" opacity="0.7" class="cursor-pointer"><title>Tap to mark concern</title></circle>
      </svg>
    </div>`
}

/* --------------------------------------------------------- Alert row */
export function alertRow(a) {
  const su = a.serviceUserId
  return html`
    <div class="flex items-start gap-3 p-3.5 hover:bg-ink-50/60 cursor-pointer border-b border-ink-100 last:border-0" onclick="window.__openAlert && window.__openAlert('${a.id}')">
      <span class="w-1.5 self-stretch rounded-full ${'bg-sev-' + a.severity}"></span>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          ${severityBadge(a.severity)}
          <span class="text-xs font-medium text-ink-500">${esc(a.type)}</span>
          ${a.status === 'open' ? '' : badge(a.status, 'bg-ink-100 text-ink-500 ring-ink-200')}
        </div>
        <p class="text-sm font-medium text-ink-800 mt-1">${esc(a.title)}</p>
        <p class="text-xs text-ink-500 mt-0.5">${esc(a.serviceUser)} · ${esc(a.visit)} visit${a.time !== '—' ? ' · ' + esc(a.time) : ''}${a.carer !== '—' ? ' · ' + esc(a.carer) : ''}</p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-xs text-ink-500 mb-1">→ ${esc(a.routedTo)}</p>
        <span class="text-ink-300">${icon('chevron-right', 'w-4 h-4')}</span>
      </div>
    </div>`
}

/* --------------------------------------------------------- Visit task row */
export function visitTaskRow(task) {
  const c = category(task.categoryId)
  const statusUi = {
    completed: ['check-circle', 'text-success-600'], flagged: ['flag', 'text-danger-600'],
    pending: ['clock', 'text-ink-300'], refused: ['refuse', 'text-danger-600'], missed: ['x-circle', 'text-danger-600'],
  }[task.todayStatus] || ['clock', 'text-ink-300']
  return html`
    <div class="flex items-center gap-3 p-3 rounded-xl ring-1 ring-ink-200 bg-white hover:ring-primary-300 hover:shadow-[var(--shadow-card)] transition-all cursor-pointer" onclick="window.__openTask && window.__openTask('${task.id}')">
      <span class="${statusUi[1]} shrink-0">${icon(statusUi[0], 'w-5 h-5')}</span>
      ${catIcon(task.categoryId, 'w-4 h-4', 'w-8 h-8')}
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-ink-900 truncate">${esc(task.title)}</p>
        <p class="text-xs text-ink-500">${esc(c.name)} · last: ${esc(task.lastOutcome)}</p>
      </div>
      ${priorityBadge(task.priority)}
      <span class="text-ink-300 shrink-0">${icon('chevron-right', 'w-4 h-4')}</span>
    </div>`
}

/* --------------------------------------------------------- Weekly matrix */
export function weeklyMatrix(tasks) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return html`
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th class="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200">Task</th>
            <th class="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200 w-24">Visit</th>
            ${days.map((d) => `<th class="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-200 text-center w-12">${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${map(tasks, (t) => html`<tr class="hover:bg-primary-50/40">
            <td class="px-3 py-2.5 border-b border-ink-100">
              <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${'bg-' + (category(t.categoryId).color) + '-400'}"></span><span class="font-medium text-ink-800">${esc(t.title)}</span></div>
            </td>
            <td class="px-3 py-2.5 border-b border-ink-100 text-ink-500 text-xs">${esc(t.visit)}</td>
            ${t.week.map((on) => `<td class="px-2 py-2.5 border-b border-ink-100 text-center">${on ? `<span class="inline-grid place-items-center w-6 h-6 rounded-md bg-success-50 text-success-600 mx-auto">${icon('check', 'w-3.5 h-3.5')}</span>` : '<span class="text-ink-200">·</span>'}</td>`).join('')}
          </tr>`)}
        </tbody>
      </table>
    </div>`
}

/* --------------------------------------------------------- Pack card */
export function packCard(p) {
  return html`
    <a href="#/packs/${p.id}" class="card card-hover p-5 flex flex-col gap-3 group">
      <div class="flex items-start justify-between">
        ${catIcon2(p.icon, p.color)}
        ${p.restricted ? badge('Restricted', 'bg-danger-50 text-danger-600 ring-danger-100', 'shield') : statusBadge(p.status)}
      </div>
      <div>
        <h3 class="text-base font-semibold text-ink-900 group-hover:text-primary-700">${esc(p.name)}</h3>
        <p class="text-sm text-ink-500 mt-1 line-clamp-2">${esc(p.description)}</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-ink-500">
        ${icon('layers', 'w-3.5 h-3.5')} ${p.items.length} templates · ${p.defaultVisits.length} visit slots
      </div>
      <p class="text-xs text-ink-500 pt-2 border-t border-ink-100">Best for: ${esc(p.useCase)}</p>
    </a>`
}

function catIcon2(ic, color) {
  return `<span class="grid place-items-center rounded-lg ring-1 w-11 h-11 ${CAT_TONE[color] || CAT_TONE.ink}">${icon(ic, 'w-5.5 h-5.5')}</span>`
}

/* --------------------------------------------------------- Service-user card */
export function serviceUserCard(s) {
  return html`
    <a href="#/service-users/${s.id}/planner" class="card card-hover p-4 flex items-center gap-4 group">
      ${avatar(s.initials, s.color, 'lg')}
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-semibold text-ink-900 group-hover:text-primary-700">${esc(s.name)}</h3>
        <p class="text-xs text-ink-500">${s.age} yrs · ${esc(s.package)}</p>
        <div class="flex flex-wrap gap-1.5 mt-2">${s.risks.slice(0, 2).map((r) => badge(r, 'bg-warning-50 text-warning-700 ring-warning-100')).join('')}</div>
      </div>
      <div class="text-right shrink-0">
        <p class="text-lg font-bold text-ink-900">${s.activeTaskCount}</p>
        <p class="text-xs text-ink-500">tasks</p>
        ${s.openExceptions ? `<span class="inline-flex items-center gap-1 text-xs font-semibold text-danger-600 mt-1">${icon('alert', 'w-3.5 h-3.5')}${s.openExceptions}</span>` : ''}
      </div>
    </a>`
}

/* --------------------------------------------------------- Stepper */
export function stepper(steps, current) {
  return html`
    <ol class="flex items-center w-full">
      ${map(steps, (s, i) => {
        const done = i < current, active = i === current
        return html`<li class="flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}">
          <div class="flex items-center gap-2.5 shrink-0">
            <span class="w-8 h-8 rounded-full grid place-items-center text-sm font-semibold shrink-0 ${done ? 'bg-success-500 text-white' : active ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-ink-100 text-ink-400'}">${done ? icon('check', 'w-4 h-4') : i + 1}</span>
            <span class="text-sm font-medium hidden lg:block ${active ? 'text-ink-900' : done ? 'text-ink-600' : 'text-ink-400'}">${esc(s)}</span>
          </div>
          ${i < steps.length - 1 ? `<span class="flex-1 h-0.5 mx-3 rounded ${done ? 'bg-success-400' : 'bg-ink-200'}"></span>` : ''}
        </li>`
      })}
    </ol>`
}

export { CAT_TONE }
