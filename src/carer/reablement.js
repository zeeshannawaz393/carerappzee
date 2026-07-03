/** §16a — reablement / outcomes-based care: time-limited, outcome-focused goals. */
import { html, esc, map } from '../lib/dom.js'
import { fmtDMY } from '../lib/dates.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { getServiceUser } from '../data/index.js'
import { reablementFor, REABLEMENT_LEVELS } from '../data/carer.js'

export function renderReablement({ id }) {
  const su = getServiceUser(id)
  const pkg = reablementFor(id)
  if (!su || !pkg) {
    return mobileFlow(html`
      ${flowHeader({ title: 'Reablement goals', subtitle: su ? esc(su.name) : '', back: `#/carer/clients/${id}` })}
      ${emptyMobile({ icon: 'target', title: 'No reablement package', body: 'This person is not on a time-limited reablement package.' })}`)
  }

  const levelBtns = () => REABLEMENT_LEVELS.map((lvl) =>
    html`<button type="button" @click="progress='${esc(lvl)}'" :class="progress==='${esc(lvl)}' ? 'bg-primary-600 text-white ring-primary-600' : 'bg-surface text-ink-600 ring-ink-200'" class="rounded-lg ring-1 px-2 py-1.5 text-[11px] font-semibold transition-colors">${esc(lvl)}</button>`
  ).join('')

  const goalCard = (g) => html`<div class="card p-4" x-data="{ progress: '${esc(g.progress)}' }">
    <p class="text-sm font-semibold text-ink-900 flex items-center gap-2 mb-2">${icon('target', 'w-4 h-4 text-primary-500')}${esc(g.goal)}</p>
    <div class="flex items-center gap-2 text-[12px]">
      <span class="badge bg-ink-50 text-ink-600 ring-ink-200">${esc(g.baseline)}</span>
      ${icon('arrow-right', 'w-3.5 h-3.5 text-ink-300')}
      <span class="badge bg-success-50 text-success-700 ring-success-100">${esc(g.target)}</span>
    </div>
    <div class="mt-2 rounded-lg bg-teal-50 ring-1 ring-teal-100 p-2.5"><p class="text-[11px] font-semibold text-teal-700 uppercase tracking-wide mb-0.5">Step-down approach</p><p class="text-[13px] text-teal-800">${esc(g.stepDown)}</p></div>
    <div class="mt-3">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1.5">Today's level</p>
      <div class="grid grid-cols-2 gap-2">${levelBtns()}</div>
    </div>
    <button @click="window.__notify('Progress recorded','success')" class="btn btn-primary btn-sm w-full mt-3">${icon('check', 'w-3.5 h-3.5')}Record progress</button>
  </div>`

  const inner = html`
    ${flowHeader({ title: 'Reablement goals', subtitle: esc(su.name), back: `#/carer/clients/${id}` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="card p-4">
        <div class="flex items-center gap-2.5 mb-2"><span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 grid place-items-center">${icon('activity', 'w-4.5 h-4.5')}</span><div class="min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(pkg.package)}</p><p class="text-xs text-ink-400">Started ${esc(fmtDMY(pkg.started))} · review ${esc(fmtDMY(pkg.review))}</p></div></div>
        <div class="rounded-lg bg-warning-50 ring-1 ring-warning-100 p-2.5 text-[13px] text-warning-800 flex items-start gap-2">${icon('info', 'w-4 h-4 shrink-0 mt-0.5')}<span>Reablement is <b>time-limited and outcome-focused</b> — encourage independence, don't do-for.</span></div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Outcome goals</p>
        <div class="space-y-3">${map(pkg.goals, goalCard)}</div>
      </div>

      <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-[13px] text-info-800 flex items-start gap-2">${icon('flag', 'w-4 h-4 shrink-0 mt-0.5')}<span>Outcome review: record whether each goal is <b>met</b>, <b>partially met</b>, or <b>not met</b> — reviewed with the person at package end.</span></div>
    </div>`
  return mobileFlow(inner)
}
