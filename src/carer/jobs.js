/**
 * E10 — Non-visit Jobs (§17, AC-17.1–17.4). A work surface separate from visits:
 * stock checks, policy read-and-sign, vehicle/PPE, timesheet, spot-checks, errands.
 * Buckets: Today / Week / Month / Overdue. Recurring jobs regenerate; evidence-
 * required jobs can't close without it; overdue mandatory jobs escalate.
 */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { JOBS, JOB_CATEGORIES, roleRank, roleLabel } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'
import { session } from './session.js'

const BUCKETS = [{ id: 'today', label: 'Today' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }, { id: 'overdue', label: 'Overdue' }]
const CAT_ICON = { stock: 'clipboard', policy: 'file-check', vehicle: 'shield', admin: 'clock', spotcheck: 'user-check', errand: 'map-pin' }

export function renderJobs(_p, query = {}) {
  const active = BUCKETS.some((b) => b.id === query.bucket) ? query.bucket : 'today'
  const myRank = roleRank(session.role())
  const jobRow = (j) => {
    const done = carerStore.job(j.id)
    const locked = j.minRole && roleRank(j.minRole) > myRank
    const overdue = j.bucket === 'overdue'
    return html`<div class="card p-3.5 ${overdue && !done ? 'ring-1 ring-danger-200' : ''}">
      <div class="flex items-start gap-3">
        <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0 ${done ? 'bg-success-50 text-success-600' : overdue ? 'bg-danger-50 text-danger-600' : 'bg-primary-50 text-primary-600'}">${icon(done ? 'check-circle' : CAT_ICON[j.cat] || 'clipboard', 'w-4.5 h-4.5')}</span>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-semibold text-ink-900">${esc(j.title)}</p>
          <div class="flex items-center gap-1.5 flex-wrap mt-1">
            <span class="badge bg-ink-50 text-ink-500 ring-ink-200">${esc(JOB_CATEGORIES[j.cat] || j.cat)}</span>
            <span class="text-[11px] text-ink-400">Due ${esc(j.due)}</span>
            ${j.recurring ? `<span class="badge bg-primary-50 text-primary-700 ring-primary-100">${icon('refresh', 'w-3 h-3')}${esc(j.recurring)}</span>` : ''}
            ${j.mandatory ? '<span class="badge bg-warning-50 text-warning-700 ring-warning-100">Mandatory</span>' : ''}
            ${j.evidence ? '<span class="badge bg-teal-50 text-teal-700 ring-teal-100">Evidence</span>' : ''}
            ${j.minRole ? `<span class="badge bg-ink-100 text-ink-600 ring-ink-200">${esc(roleLabel(j.minRole))}+</span>` : ''}
          </div>
          ${done ? `<p class="text-[11px] text-success-600 mt-1.5">${icon('check', 'w-3 h-3')}Completed at ${esc(done.at)}${done.evidence ? ' · evidence attached' : ''}</p>` : ''}
        </div>
      </div>
      ${!done && !locked ? html`<div class="mt-2.5 flex gap-2">
        <button onclick="window.__doJob('${j.id}', ${j.evidence})" class="btn ${overdue ? 'btn-danger' : 'btn-primary'} btn-sm flex-1">${icon(j.evidence ? 'mobile' : 'check', 'w-3.5 h-3.5')}${j.evidence ? 'Complete with evidence' : 'Mark done'}</button>
        ${overdue && j.mandatory ? `<button onclick="window.__notify('Overdue mandatory job escalated to office','warning')" class="btn btn-secondary btn-sm">Escalate</button>` : ''}
      </div>` : ''}
      ${locked ? `<p class="text-[11px] text-ink-400 mt-2">${icon('shield', 'w-3.5 h-3.5')}Requires ${esc(roleLabel(j.minRole))} — ask a senior colleague.</p>` : ''}
    </div>`
  }

  const overdueCount = JOBS.filter((j) => j.bucket === 'overdue' && !carerStore.job(j.id)).length
  const items = JOBS.filter((j) => j.bucket === active)
  const inner = html`
    ${flowHeader({ title: 'Jobs', subtitle: 'Non-visit work', back: '#/carer/me', right: overdueCount ? `<span class="badge bg-danger-500 text-white ring-0">${overdueCount} overdue</span>` : '' })}
    <div class="px-4 pt-3 shrink-0">
      <div class="flex gap-1 rounded-xl bg-ink-100 p-1">
        ${map(BUCKETS, (b) => { const n = JOBS.filter((j) => j.bucket === b.id && !carerStore.job(j.id)).length; return `<a href="#/carer/jobs?bucket=${b.id}" class="flex-1 text-center text-[12px] font-semibold py-1.5 rounded-lg ${b.id === active ? 'bg-surface text-primary-700 shadow-sm' : 'text-ink-500'}">${b.label}${n ? ` · ${n}` : ''}</a>` })}
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
      ${items.length ? map(items, jobRow) : `<p class="text-[13px] text-ink-400 text-center py-10">No jobs in ${esc(active)}.</p>`}
    </div>`
  return mobileFlow(inner)
}
