/**
 * E9 — Observation integrity (§19). Monitoring schedules (who requested, how
 * often, until when) and a repositioning chart that is shared ACROSS carers &
 * visits, with an overdue flag against the person's turning interval.
 */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { getServiceUser } from '../data/index.js'
import { monitoringFor, repositionFor, WOUND_VOCAB } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'

const notFound = (back) => mobileFlow(html`${flowHeader({ title: 'Not found', back })}${emptyMobile({ title: 'Client not found' })}`)

export function renderMonitoring({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound('#/carer/clients')
  const sched = monitoringFor(id)
  const plan = repositionFor(id)
  const logged = carerStore.repositions(id)
  // Combine seed + carer-added; newest first.
  const turns = [...logged.map((r) => ({ at: r.at, to: r.to, by: 'You', skin: r.skin })), ...(plan ? plan.log.slice().reverse() : [])]
  const lastTurn = turns[0]
  // Simulated "overdue" state: no carer turn logged yet this visit.
  const overdue = plan && !logged.length

  const inner = html`
    ${flowHeader({ title: 'Monitoring & repositioning', subtitle: esc(su.name), back: `#/carer/clients/${id}/history` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{
      pos: '', skin: '',
      log() { if(!this.pos){ window.__notify('Choose a position','warning'); return } window.__reposition('${id}', this.pos, this.skin||'Intact'); this.pos=''; this.skin='' }
    }">

      <!-- Monitoring schedule (§19.14) -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Monitoring schedule</p>
        ${sched.length ? html`<div class="space-y-2">${map(sched, (m) => html`<div class="card p-3.5">
          <div class="flex items-center justify-between gap-2"><p class="text-sm font-semibold text-ink-900">${esc(m.obs)}</p><span class="badge bg-primary-50 text-primary-700 ring-primary-100">${esc(m.freq)}</span></div>
          <p class="text-[12px] text-ink-500 mt-1">Until ${esc(m.until)} · requested by ${esc(m.by)}</p>
          <p class="text-[12px] text-ink-400">${esc(m.reason)}</p>
        </div>`)}</div>` : `<div class="card p-3.5 text-[13px] text-ink-500">No active monitoring schedule.</div>`}
      </div>

      <!-- Repositioning chart (§19.15/16) -->
      ${plan ? html`<div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Repositioning · every ${plan.intervalH}h · shared across carers</p>
        <div class="rounded-xl ${overdue ? 'bg-danger-50 ring-danger-100' : 'bg-success-50 ring-success-100'} ring-1 p-3 mb-2 flex items-center gap-2 text-[13px] ${overdue ? 'text-danger-800' : 'text-success-800'}">
          ${icon(overdue ? 'warning' : 'check-circle', 'w-4 h-4 shrink-0')}
          <span>${overdue ? `Turn may be due — last recorded ${esc(lastTurn ? lastTurn.to + ' at ' + lastTurn.at : 'none')}. Reposition and log below.` : `Last turned to <b>${esc(lastTurn.to)}</b> at ${esc(lastTurn.at)}${lastTurn.by ? ' (' + esc(lastTurn.by) + ')' : ''}.`}</span>
        </div>
        <div class="card p-3.5 space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div><label class="label">Reposition to</label><select x-model="pos" class="field field-sm"><option value="">Select…</option>${map(['Back', 'Left side', 'Right side', 'Sat up', 'Chair'], (p) => `<option>${p}</option>`)}</select></div>
            <div><label class="label">Skin on inspection</label><select x-model="skin" class="field field-sm">${map(['Intact', 'Red', 'Broken'], (s) => `<option>${s}</option>`)}</select></div>
          </div>
          <button @click="log()" class="btn btn-primary btn-sm w-full">${icon('check', 'w-3.5 h-3.5')}Log repositioning</button>
        </div>
        <div class="card divide-y divide-ink-100 mt-2">
          ${turns.length ? map(turns, (t) => html`<div class="flex items-center gap-3 p-2.5">
            <span class="w-7 h-7 rounded-md grid place-items-center shrink-0 ${t.skin && t.skin !== 'Intact' ? 'bg-warning-50 text-warning-600' : 'bg-ink-100 text-ink-500'}">${icon('footprints', 'w-3.5 h-3.5')}</span>
            <div class="flex-1 min-w-0"><p class="text-[13px] font-medium text-ink-800">${esc(t.to)}</p><p class="text-[11px] text-ink-400">${esc(t.at)}${t.by ? ' · ' + esc(t.by) : ''}</p></div>
            <span class="badge ${t.skin && t.skin !== 'Intact' ? 'bg-warning-50 text-warning-700 ring-warning-100' : 'bg-ink-50 text-ink-500 ring-ink-200'}">${esc(t.skin || 'Intact')}</span>
          </div>`) : '<p class="text-[13px] text-ink-400 text-center py-4">No turns recorded.</p>'}
        </div>
      </div>` : ''}

      <!-- Structured wound vocabulary (§19.20) -->
      <details class="card p-3.5"><summary class="text-sm font-semibold text-ink-900 cursor-pointer list-none flex items-center gap-2">${icon('activity', 'w-4 h-4 text-ink-400')}Structured wound assessment vocabulary</summary>
        <p class="text-[12px] text-ink-500 mt-2">Body-map marks use a fixed vocabulary — no free text for the clinical fields — so wounds are comparable across carers and time.</p>
        <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
          ${map(Object.entries(WOUND_VOCAB), ([k, opts]) => html`<div class="col-span-2"><dt class="text-ink-400 capitalize">${esc(k)}</dt><dd class="text-ink-700">${opts.filter((o) => o !== '—').join(' · ')}</dd></div>`)}
        </dl>
      </details>
    </div>`
  return mobileFlow(inner)
}
