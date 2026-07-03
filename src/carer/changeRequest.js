/**
 * E10 — Change-request loop & handover governance (§24, AC-24.3/24.5/24.6).
 * A carer raises a TRACKED change request against a plan/task/medication/risk.
 * It does NOT mutate the plan — it routes to the office (Raised → Acknowledged →
 * Actioned/Declined) and enforces "a handover note is not a shadow care plan".
 */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { CHANGE_TARGETS, CHANGE_STATES } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'

const stateTone = (s) => s === 'Actioned' ? 'bg-success-50 text-success-700 ring-success-100' : s === 'Declined' ? 'bg-danger-50 text-danger-700 ring-danger-100' : s === 'Acknowledged' ? 'bg-primary-50 text-primary-700 ring-primary-100' : 'bg-warning-50 text-warning-700 ring-warning-100'

export function renderChangeRequests(_p, query = {}) {
  const raised = carerStore.changeRequests()
  const presetTarget = query.target ? decodeURIComponent(query.target) : ''
  const inner = html`
    ${flowHeader({ title: 'Change requests', subtitle: 'Field → office', back: '#/carer/inbox' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{
      target: '${esc(presetTarget)}', lasting: false, promote: '', what: '', urgent: false,
      submit() {
        if (!this.target || !this.what.trim()) { window.__notify('Choose what to change and describe it','warning'); return }
        if (this.lasting && !this.promote) { window.__notify('A lasting change must promote to an order / plan / risk / authorised instruction','warning'); return }
        window.__raiseChange(this.target, this.what.trim(), this.urgent, this.lasting ? this.promote : '')
        this.what=''; this.lasting=false; this.promote=''; this.urgent=false
      }
    }">
      <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-[13px] text-info-800 flex items-start gap-2">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')}<span>This is the field→office differentiator: a tracked request that never edits the plan directly. The office acknowledges and actions or declines it.</span></div>

      <div class="card p-4 space-y-3">
        <p class="text-sm font-semibold text-ink-900">Raise a change request</p>
        <div><label class="label">What should change?</label>
          <select x-model="target" class="field field-md"><option value="">Select…</option>${map(CHANGE_TARGETS, (t) => `<option>${esc(t)}</option>`)}</select></div>
        <div><label class="label">Describe the change</label><textarea x-model="what" rows="3" class="field px-3 py-2" placeholder="e.g. Mary now needs a soft diet — struggling with toast."></textarea></div>
        <label class="flex items-center gap-2.5 text-[13px] text-ink-700"><input type="checkbox" x-model="urgent" class="w-4 h-4 rounded" />Urgent — needs same-day office attention</label>
        <label class="flex items-center gap-2.5 text-[13px] text-ink-700"><input type="checkbox" x-model="lasting" class="w-4 h-4 rounded" />This is a lasting change (not a one-off note)</label>
        <template x-if="lasting"><div class="rounded-lg bg-warning-50 ring-1 ring-warning-100 p-3">
          <p class="text-[12px] font-semibold text-warning-800 mb-1.5">${icon('alert', 'w-3.5 h-3.5')}A handover note is not a shadow care plan</p>
          <label class="label">Promote this lasting change to…</label>
          <select x-model="promote" class="field field-sm"><option value="">Select…</option>${map(['Medication order change', 'Care-plan update', 'Risk assessment', 'Temporary authorised instruction (with expiry)'], (p) => `<option>${esc(p)}</option>`)}</select>
        </div></template>
        <button @click="submit()" class="btn btn-primary btn-md w-full">${icon('flag', 'w-4 h-4')}Send to office</button>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Your requests</p>
        ${raised.length ? html`<div class="space-y-2">${map(raised, (cr) => html`<div class="card p-3.5">
          <div class="flex items-center gap-2 flex-wrap"><span class="text-[12px] font-mono text-ink-400">${esc(cr.ref)}</span><span class="badge bg-ink-50 text-ink-600 ring-ink-200">${esc(cr.target)}</span>${cr.urgent ? '<span class="badge bg-danger-50 text-danger-700 ring-danger-100">Urgent</span>' : ''}<span class="ml-auto badge ${stateTone(cr.state)}">${esc(cr.state)}</span></div>
          <p class="text-[13px] text-ink-700 mt-1.5">${esc(cr.what)}</p>
          ${cr.promote ? `<p class="text-[11px] text-warning-700 mt-1">${icon('arrow-right', 'w-3 h-3')}Promotes to: ${esc(cr.promote)}</p>` : ''}
          <div class="mt-2 flex items-center gap-1">${CHANGE_STATES.map((st, i) => { const idx = CHANGE_STATES.indexOf(cr.state === 'Declined' ? 'Actioned' : cr.state); const on = i <= idx; return `<div class="flex-1 flex flex-col items-center gap-1"><span class="w-2.5 h-2.5 rounded-full ${on ? (cr.state === 'Declined' && st === 'Actioned' ? 'bg-danger-500' : 'bg-primary-500') : 'bg-ink-200'}"></span><span class="text-[8px] ${on ? 'text-ink-600' : 'text-ink-300'}">${cr.state === 'Declined' && st === 'Actioned' ? 'Declined' : st}</span></div>` }).join('<div class="h-px flex-1 bg-ink-200 mb-3"></div>')}</div>
        </div>`)}</div>` : emptyMobile({ icon: 'flag', title: 'No change requests', body: 'Requests you raise from a visit or client screen show their office status here.' })}
      </div>
    </div>`
  return mobileFlow(inner)
}
