/**
 * E8 (expanded) — in-app Assurance & safety register. Renders the DCB0129
 * hazard map, the §42.1 concurrency register, the Appendix-A visit-transition
 * set and the coverage summary, so the traceability artefact is demonstrable
 * inside the product, not only in the docs.
 */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { HAZARDS, CONCURRENCY, TRANSITIONS, COVERAGE_NOTE } from '../data/assurance.js'

const TABS = [{ id: 'hazards', label: 'Hazards' }, { id: 'concurrency', label: 'Concurrency' }, { id: 'transitions', label: 'Transitions' }]
const phaseTone = (p) => p === 'B4' ? 'bg-ink-100 text-ink-600 ring-ink-200' : 'bg-primary-50 text-primary-700 ring-primary-100'

export function renderAssurance(_p, query = {}) {
  const tab = TABS.some((t) => t.id === query.tab) ? query.tab : 'hazards'
  const delivered = HAZARDS.filter((h) => h.phase !== 'B4').length

  const hazards = html`<div class="space-y-2">
    ${map(HAZARDS, (h) => html`<div class="card p-3">
      <div class="flex items-center gap-2"><span class="badge bg-danger-50 text-danger-700 ring-danger-100 font-mono">${h.id}</span><p class="text-[13px] font-semibold text-ink-900 flex-1">${esc(h.hazard)}</p><span class="badge ${phaseTone(h.phase)}">${esc(h.phase)}</span></div>
      <p class="text-[12px] text-ink-600 mt-1"><span class="text-ink-400">Control:</span> ${esc(h.control)}</p>
      <p class="text-[11px] text-ink-400 mt-0.5">${icon('check-circle', 'w-3 h-3')} Test: ${esc(h.test)}</p>
    </div>`)}
  </div>`

  const concurrency = html`<div class="space-y-2">
    ${map(CONCURRENCY, (c) => html`<div class="card p-3">
      <div class="flex items-center gap-2"><span class="badge bg-warning-50 text-warning-700 ring-warning-100 font-mono">${c.id}</span><p class="text-[13px] font-semibold text-ink-900 flex-1">${esc(c.scenario)}</p></div>
      <p class="text-[12px] text-ink-600 mt-1">${esc(c.outcome)}</p>
      <p class="text-[11px] text-ink-400 mt-0.5">Governed by ${esc(c.gov)}</p>
    </div>`)}
  </div>`

  const transitions = html`<div class="space-y-2">
    ${map(TRANSITIONS, (t) => html`<div class="card p-3">
      <p class="text-[13px] font-semibold text-ink-900 flex items-center gap-1.5"><span class="text-ink-500">${esc(t.from)}</span>${icon('arrow-right', 'w-3.5 h-3.5 text-primary-500')}<span class="text-primary-700">${esc(t.to)}</span></p>
      <p class="text-[12px] text-ink-500 mt-1">${esc(t.note)}</p>
    </div>`)}
  </div>`

  const body = tab === 'concurrency' ? concurrency : tab === 'transitions' ? transitions : hazards
  const inner = html`
    ${flowHeader({ title: 'Assurance register', subtitle: 'DCB0129 · §42.1 · Appendix A', back: '#/carer/me' })}
    <div class="px-4 pt-3 shrink-0">
      <div class="rounded-xl bg-success-50 ring-1 ring-success-100 p-3 text-[12px] text-success-800 flex items-start gap-2 mb-3">${icon('shield', 'w-4 h-4 mt-0.5 shrink-0')}<span><b>${delivered}/${HAZARDS.length} hazards</b> resolve to a delivered prototype control; the remainder are backend/assurance-owned (B4). ${esc(COVERAGE_NOTE)}</span></div>
      <div class="flex gap-1 rounded-xl bg-ink-100 p-1">
        ${map(TABS, (t) => { const n = t.id === 'hazards' ? HAZARDS.length : t.id === 'concurrency' ? CONCURRENCY.length : TRANSITIONS.length; return `<a href="#/carer/assurance?tab=${t.id}" class="flex-1 text-center text-[12px] font-semibold py-1.5 rounded-lg ${t.id === tab ? 'bg-surface text-primary-700 shadow-sm' : 'text-ink-500'}">${t.label} · ${n}</a>` })}
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-4">${body}</div>`
  return mobileFlow(inner)
}
