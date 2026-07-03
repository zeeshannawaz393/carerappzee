/** UI primitives — the design-system building blocks. All return HTML strings. */
import { html, esc, cx, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { PRIORITIES, STATUSES, SEVERITY, OUTCOME_CODES } from '../data/enums.js'

/* ---------------------------------------------------------------- Buttons */
export function btn(label, { variant = 'primary', size = 'md', icon: ic, iconRight, onclick, href, attrs = '', full } = {}) {
  const inner = `${ic ? icon(ic, 'w-4 h-4') : ''}<span>${label}</span>${iconRight ? icon(iconRight, 'w-4 h-4') : ''}`
  const cls = cx('btn', `btn-${variant}`, `btn-${size}`, full && 'w-full')
  if (href) return `<a href="${href}" class="${cls}" ${attrs}>${inner}</a>`
  return `<button class="${cls}" ${onclick ? `onclick="${onclick}"` : ''} ${attrs}>${inner}</button>`
}

export function iconBtn(ic, { onclick, title = '', variant = 'ghost', size = 'sm' } = {}) {
  return `<button class="btn btn-${variant} btn-${size} !px-2" title="${esc(title)}" ${onclick ? `onclick="${onclick}"` : ''}>${icon(ic, 'w-4 h-4')}</button>`
}

/* ---------------------------------------------------------------- Badges */
export function badge(label, classes = 'bg-ink-100 text-ink-600 ring-ink-200', ic) {
  return `<span class="badge ${classes}">${ic ? icon(ic, 'w-3 h-3') : ''}${esc(label)}</span>`
}
export function priorityBadge(p) {
  const m = PRIORITIES[p] || PRIORITIES.recommended
  return badge(m.label, m.badge)
}
export function statusBadge(s) {
  const m = STATUSES[s] || STATUSES.draft
  const dot = s === 'published' || s === 'approved' ? 'bg-success-500' : s === 'pending' ? 'bg-warning-500' : s === 'draft' ? 'bg-ink-400' : 'bg-ink-300'
  return `<span class="badge ${m.badge}"><span class="w-1.5 h-1.5 rounded-full ${dot}"></span>${m.label}</span>`
}
export function severityBadge(s) {
  const m = SEVERITY[s] || SEVERITY.info
  return `<span class="badge ${m.badge}"><span class="w-1.5 h-1.5 rounded-full ${m.dot}"></span>${m.label}</span>`
}
export function outcomeBadge(code) {
  const m = OUTCOME_CODES[code] || OUTCOME_CODES.pending
  const tone = { success: 'bg-success-50 text-success-700 ring-success-100', warning: 'bg-warning-50 text-warning-700 ring-warning-100', danger: 'bg-danger-50 text-danger-700 ring-danger-100', ink: 'bg-ink-100 text-ink-500 ring-ink-200' }[m.tone]
  return `<span class="badge ${tone}">${icon(m.icon, 'w-3 h-3')}${m.label}</span>`
}
export function cqcTag(q) {
  return `<span class="badge bg-primary-50 text-primary-700 ring-primary-100 !rounded-md">${icon('shield', 'w-3 h-3')}${esc(q)}</span>`
}
export function typeChip(label, ic) {
  return `<span class="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">${ic ? icon(ic, 'w-3.5 h-3.5') : ''}${esc(label)}</span>`
}

/* ---------------------------------------------------------------- Avatar */
const AVATAR_TONES = { primary: 'bg-primary-100 text-primary-700', teal: 'bg-teal-100 text-teal-700', warning: 'bg-warning-100 text-warning-700', danger: 'bg-danger-100 text-danger-700', ink: 'bg-ink-200 text-ink-700' }
export function avatar(initials, tone = 'primary', size = 'md') {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }[size]
  return `<span class="inline-flex items-center justify-center rounded-full font-semibold ${sz} ${AVATAR_TONES[tone] || AVATAR_TONES.primary}">${esc(initials)}</span>`
}

/* ------------------------------------------------------------ Stat card */
export function statCard({ label, value, sub, icon: ic, tone = 'primary', trend }) {
  const tones = { primary: 'text-primary-600 bg-primary-50', teal: 'text-teal-600 bg-teal-50', warning: 'text-warning-600 bg-warning-50', danger: 'text-danger-600 bg-danger-50', success: 'text-success-600 bg-success-50', info: 'text-info-600 bg-info-50' }
  return html`
    <div class="card p-4 flex items-start gap-3">
      ${ic ? `<div class="w-10 h-10 rounded-lg grid place-items-center ${tones[tone]}">${icon(ic, 'w-5 h-5')}</div>` : ''}
      <div class="min-w-0">
        <p class="text-2xl font-bold text-ink-900 leading-tight">${value}</p>
        <p class="text-sm text-ink-500">${esc(label)}</p>
        ${sub ? `<p class="text-xs mt-0.5 ${trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-ink-500'}">${sub}</p>` : ''}
      </div>
    </div>`
}

/* ------------------------------------------------------------ Page header */
export function pageHeader({ title, subtitle, breadcrumbs = [], actions = '' }) {
  return html`
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div class="min-w-0">
        ${breadcrumbs.length ? `<nav class="flex items-center gap-1.5 text-sm text-ink-500 mb-1.5">${breadcrumbs.map((b, i) => `${i ? icon('chevron-right', 'w-3.5 h-3.5') : ''}${b.href ? `<a href="${b.href}" class="hover:text-primary-600">${esc(b.label)}</a>` : `<span class="text-ink-600 font-medium">${esc(b.label)}</span>`}`).join('')}</nav>` : ''}
        <h1 class="text-2xl font-bold text-ink-900 tracking-tight">${esc(title)}</h1>
        ${subtitle ? `<p class="text-ink-500 mt-1 max-w-2xl">${subtitle}</p>` : ''}
      </div>
      ${actions ? `<div class="flex items-center gap-2 shrink-0">${actions}</div>` : ''}
    </div>`
}

/* ------------------------------------------------------------ Tabs (Alpine) */
export function tabs(items, { initial = 0 } = {}) {
  // items: [{ id, label, count, panel }]
  const id = `tabs-${Math.abs(items.map((i) => i.label).join('').length * 7 + initial)}`
  return html`
    <div x-data="{ tab: '${items[initial].id}' }">
      <div class="flex items-center gap-1 border-b border-ink-200 overflow-x-auto" role="tablist">
        ${map(items, (it) => html`
          <button role="tab" @click="tab='${it.id}'"
            :class="tab==='${it.id}' ? 'text-primary-700 border-primary-600' : 'text-ink-500 border-transparent hover:text-ink-800'"
            class="px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors">
            ${esc(it.label)}${it.count != null ? `<span class="ml-1.5 text-xs font-medium rounded-full px-1.5 py-0.5 bg-ink-100 text-ink-500" :class="tab==='${it.id}' && 'bg-primary-50 text-primary-700'">${it.count}</span>` : ''}
          </button>`)}
      </div>
      ${map(items, (it) => `<div x-show="tab==='${it.id}'" x-cloak class="pt-5 animate-fade-in">${it.panel}</div>`)}
    </div>`
}

/* ------------------------------------------------------------ Empty state */
export function emptyState({ icon: ic = 'search', title, body, action = '' }) {
  return html`
    <div class="text-center py-16 px-6">
      <div class="w-14 h-14 rounded-2xl bg-ink-100 text-ink-400 grid place-items-center mx-auto mb-4">${icon(ic, 'w-7 h-7')}</div>
      <h3 class="text-base font-semibold text-ink-800">${esc(title)}</h3>
      ${body ? `<p class="text-sm text-ink-500 mt-1 max-w-sm mx-auto">${body}</p>` : ''}
      ${action ? `<div class="mt-5">${action}</div>` : ''}
    </div>`
}

/* ------------------------------------------------------------ Progress */
export function progressBar(pct, tone = 'primary', { height = 'h-2', label } = {}) {
  const tones = { primary: 'bg-primary-500', success: 'bg-success-500', warning: 'bg-warning-500', danger: 'bg-danger-500', info: 'bg-info-500', teal: 'bg-teal-500' }
  return html`
    <div>
      ${label ? `<div class="flex justify-between text-xs text-ink-500 mb-1">${label}</div>` : ''}
      <div class="w-full ${height} bg-ink-100 rounded-full overflow-hidden">
        <div class="${height} ${tones[tone]} rounded-full transition-all" style="width:${Math.min(100, Math.max(0, pct))}%"></div>
      </div>
    </div>`
}

/* ------------------------------------------------------------ Section card */
export function sectionCard({ title, icon: ic, actions = '', body, pad = 'p-5' }) {
  return html`
    <section class="card">
      ${title ? html`<div class="flex items-center gap-2 px-5 py-3.5 border-b border-ink-100">
        ${ic ? `<span class="text-ink-400">${icon(ic, 'w-4.5 h-4.5')}</span>` : ''}
        <h3 class="text-sm font-semibold text-ink-800 flex-1">${esc(title)}</h3>
        ${actions}
      </div>` : ''}
      <div class="${pad}">${body}</div>
    </section>`
}

/* ------------------------------------------------------------ Definition list */
export function defList(rows) {
  return html`<dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
    ${map(rows, (r) => html`<div class="${r.full ? 'sm:col-span-2' : ''}">
      <dt class="text-xs font-medium text-ink-500 uppercase tracking-wide">${esc(r.label)}</dt>
      <dd class="text-sm text-ink-800 mt-0.5">${r.value || '<span class="text-ink-400">—</span>'}</dd>
    </div>`)}
  </dl>`
}

/* ------------------------------------------------------------ Toggle pill */
export function toggleRow(label, checked, { desc, model } = {}) {
  return html`
    <label class="flex items-start gap-3 py-2.5 cursor-pointer" ${model ? `x-data` : ''}>
      <span class="relative inline-flex shrink-0 mt-0.5">
        <input type="checkbox" ${checked ? 'checked' : ''} class="peer sr-only" ${model ? `x-model="${model}"` : ''}/>
        <span class="w-9 h-5 rounded-full bg-ink-300 peer-checked:bg-primary-600 transition-colors"></span>
        <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4"></span>
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-medium text-ink-800">${esc(label)}</span>
        ${desc ? `<span class="block text-xs text-ink-500">${esc(desc)}</span>` : ''}
      </span>
    </label>`
}

/* ------------------------------------------------------------ Mini bar chart */
export function barChart(data, { max, tone = 'primary', target } = {}) {
  const mx = max || Math.max(...data.map((d) => d.ml ?? d.value))
  const tones = { primary: 'bg-primary-500', info: 'bg-info-500', teal: 'bg-teal-500' }
  return html`
    <div class="flex items-end gap-2 h-40 relative">
      ${target ? `<div class="absolute left-0 right-0 border-t-2 border-dashed border-warning-400 z-10" style="bottom:${(target / mx) * 100}%"><span class="absolute -top-5 right-0 text-[10px] font-semibold text-warning-600">target ${target}</span></div>` : ''}
      ${map(data, (d) => {
        const v = d.ml ?? d.value
        const below = target && v < target
        return html`<div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <span class="text-[10px] font-semibold text-ink-500">${v}</span>
          <div class="w-full rounded-t ${below ? 'bg-danger-400' : tones[tone]}" style="height:${(v / mx) * 88}%"></div>
          <span class="text-[10px] text-ink-400">${esc(d.day || d.label)}</span>
        </div>`
      })}
    </div>`
}

/* ------------------------------------------------------------ Donut */
export function donut(segments, { size = 120, label } = {}) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const tones = { success: '#12915a', danger: '#d4351c', warning: '#c47d12', primary: '#1d72bd', info: '#2563c4' }
  let acc = 0
  const r = 54, c = 2 * Math.PI * r
  const rings = segments.map((s) => {
    const frac = s.value / total
    const dash = `${frac * c} ${c}`
    const ring = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${tones[s.tone] || '#1d72bd'}" stroke-width="12" stroke-dasharray="${dash}" stroke-dashoffset="${-acc * c}" transform="rotate(-90 60 60)" />`
    acc += frac
    return ring
  }).join('')
  return html`
    <div class="flex items-center gap-5">
      <svg viewBox="0 0 120 120" style="width:${size}px;height:${size}px" class="shrink-0">
        ${rings}
        <text x="60" y="56" text-anchor="middle" class="fill-ink-900" style="font-size:22px;font-weight:700">${segments[0].value}%</text>
        <text x="60" y="74" text-anchor="middle" class="fill-ink-400" style="font-size:10px">${esc(label || 'completed')}</text>
      </svg>
      <ul class="space-y-1.5">
        ${map(segments, (s) => `<li class="flex items-center gap-2 text-sm text-ink-600"><span class="w-2.5 h-2.5 rounded-sm" style="background:${tones[s.tone]}"></span>${esc(s.label)} <span class="font-semibold text-ink-800">${s.value}%</span></li>`)}
      </ul>
    </div>`
}
