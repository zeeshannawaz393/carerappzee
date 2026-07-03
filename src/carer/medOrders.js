/**
 * E9 — Medication order lifecycle & reconciliation (§49). Client-level screen
 * showing each prescribed order's versioned state, the currently-effective
 * version, and any open reconciliation that BLOCKS administration until resolved.
 */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { getServiceUser } from '../data/index.js'
import { medOrdersFor, currentVersion, orderBlocked, ORDER_STATES, RECON_STATES, capacityFor } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'

const TONE = {
  ok: 'bg-success-50 text-success-700 ring-success-100', warn: 'bg-warning-50 text-warning-700 ring-warning-100',
  bad: 'bg-danger-50 text-danger-700 ring-danger-100', ink: 'bg-ink-100 text-ink-600 ring-ink-200',
}
const notFound = (back) => mobileFlow(html`${flowHeader({ title: 'Not found', back })}${emptyMobile({ title: 'Client not found' })}`)

function reconCard(suId, o) {
  const r = o.recon
  const acted = carerStore.reconFor(suId, o.medId)
  const state = acted ? acted.action : r.state
  const meta = RECON_STATES[state] || RECON_STATES.Pending
  const blocked = meta.blocks
  return html`<div class="mt-2.5 rounded-lg ring-1 ${blocked ? 'ring-warning-200 bg-warning-50' : 'ring-success-200 bg-success-50'} p-3">
    <p class="text-[11px] font-semibold uppercase tracking-wide ${blocked ? 'text-warning-700' : 'text-success-700'} flex items-center gap-1.5">${icon(blocked ? 'alert' : 'check-circle', 'w-3.5 h-3.5')}Reconciliation · ${esc(state)}</p>
    <p class="text-[13px] ${blocked ? 'text-warning-800' : 'text-success-800'} mt-0.5">${esc(r.reason)}</p>
    ${r.conflict ? `<p class="text-[12px] text-danger-700 mt-1 font-medium">${icon('warning', 'w-3.5 h-3.5')} Stop wins — any dose given before the stop synced is flagged for review.</p>` : ''}
    ${blocked ? html`<div class="flex flex-wrap gap-1.5 mt-2">
      <button onclick="window.__recon('${suId}','${o.medId}','Under review')" class="btn btn-secondary btn-sm">Start review</button>
      <button onclick="window.__recon('${suId}','${o.medId}','Clarification')" class="btn btn-secondary btn-sm">Request clarification</button>
      <button onclick="window.__recon('${suId}','${o.medId}','Confirmed')" class="btn btn-primary btn-sm">${icon('check', 'w-3.5 h-3.5')}Confirm & unblock</button>
    </div>
    <p class="text-[11px] text-warning-700 mt-1.5">This medicine is <b>withheld</b> until reconciliation is resolved (or a stale-order override is recorded at the visit).</p>`
      : `<p class="text-[12px] text-success-700 mt-1.5">Resolved by you at ${esc(acted ? acted.at : '—')} — administration unblocked.</p>`}
  </div>`
}

function orderCard(suId, o) {
  const cur = currentVersion(o)
  const blocked = orderBlocked(o) && !(carerStore.reconFor(suId, o.medId) && !RECON_STATES[carerStore.reconFor(suId, o.medId).action].blocks)
  const curMeta = ORDER_STATES[cur.state] || ORDER_STATES.Active
  return html`<div class="card p-4 ${blocked ? 'ring-1 ring-warning-300' : ''}">
    <div class="flex items-start gap-3">
      <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0 bg-primary-50 text-primary-600">${icon('pill', 'w-4.5 h-4.5')}</span>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap"><p class="text-sm font-semibold text-ink-900">${esc(o.name)}</p><span class="badge ${TONE[curMeta.tone]}">${esc(cur.state)}</span>${o.covert ? '<span class="badge bg-ink-100 text-ink-600 ring-ink-200">Covert (MCA)</span>' : ''}</div>
        <p class="text-[13px] text-ink-700 mt-0.5"><b>${esc(cur.dose)}</b> · ${esc(cur.freq)} · ${esc(o.route)}</p>
        <p class="text-[11px] text-ink-400 mt-0.5">Effective ${esc(cur.effectiveFrom)} · ${esc(cur.prescriber)} · ${esc(cur.source)} · review ${esc(cur.review)}</p>
        ${cur.changeNote ? `<div class="mt-1.5 rounded-lg bg-info-50 ring-1 ring-info-100 p-2 text-[12px] text-info-800">${icon('info', 'w-3.5 h-3.5')} ${esc(cur.changeNote)}</div>` : ''}
      </div>
    </div>
    ${o.covert ? html`<div class="mt-2 rounded-lg bg-warning-50 ring-1 ring-warning-100 p-2 text-[12px] text-warning-800">${icon('scale', 'w-3.5 h-3.5')} Covert administration authorised under a recorded best-interests (MCA) decision.${(capacityFor(suId).lpa) ? ' LPA & capacity on file.' : ''}</div>` : ''}
    ${o.recon ? reconCard(suId, o) : ''}
    <details class="mt-2 group"><summary class="text-[12px] font-medium text-primary-600 cursor-pointer list-none flex items-center gap-1">${icon('clock', 'w-3.5 h-3.5')}Version history (${o.versions.length})</summary>
      <ol class="mt-2 space-y-1.5 border-l-2 border-ink-100 pl-3">
        ${map([...o.versions].reverse(), (v) => html`<li class="text-[12px]"><span class="badge ${TONE[(ORDER_STATES[v.state] || ORDER_STATES.Active).tone]} mr-1">v${v.v} · ${esc(v.state)}</span><span class="text-ink-700">${esc(v.dose)} ${esc(v.freq)}</span><span class="block text-[11px] text-ink-400">from ${esc(v.effectiveFrom)} · ${esc(v.prescriber)}</span></li>`)}
      </ol>
    </details>
  </div>`
}

export function renderMedOrders({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound('#/carer/clients')
  const orders = medOrdersFor(id)
  const blockedCount = orders.filter((o) => orderBlocked(o) && !(carerStore.reconFor(id, o.medId) && !RECON_STATES[carerStore.reconFor(id, o.medId).action].blocks)).length
  const inner = html`
    ${flowHeader({ title: 'Medication orders', subtitle: `${esc(su.name)} · §49 order lifecycle`, back: `#/carer/clients/${id}/meds` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div class="rounded-xl ${blockedCount ? 'bg-warning-50 ring-warning-100 text-warning-800' : 'bg-primary-50 ring-primary-100 text-primary-800'} ring-1 p-3 text-[13px] flex items-start gap-2">${icon(blockedCount ? 'alert' : 'shield', 'w-4 h-4 mt-0.5 shrink-0')}<span>${blockedCount ? `<b>${blockedCount} medicine${blockedCount > 1 ? 's need' : ' needs'} reconciliation</b> — administration is withheld until you resolve the change or record a stale-order override at the visit.` : 'You administer only against the <b>currently-effective</b> version. Any change since your last visit surfaces here for reconciliation.'}</span></div>
      ${orders.length ? map(orders, (o) => orderCard(id, o)) : emptyMobile({ icon: 'pill', title: 'No orders', body: 'Prescribed medication orders will appear here.' })}
      <a href="#/carer/clients/${id}/reconcile" class="btn btn-secondary btn-md w-full">${icon('refresh', 'w-4 h-4')}Reconcile against the MAR / external doses</a>
    </div>`
  return mobileFlow(inner)
}

/** Reconciliation workbench — external / other-administered dose capture (AC-49.3). */
export function renderReconcile({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound('#/carer/clients')
  const orders = medOrdersFor(id)
  const inner = html`
    ${flowHeader({ title: 'Reconcile medicines', subtitle: esc(su.name), back: `#/carer/clients/${id}/orders` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{
      medId: '', role: '', method: '', who: '', time: '', affectsInterval: false, saved: false,
      submit() {
        if (!this.medId || !this.role || !this.method) { window.__notify('Choose a medicine, who gave it and how you verified it','warning'); return }
        window.__externalAdmin('${id}', this.medId, this.role, this.method, this.affectsInterval)
        this.saved = true; this.medId=''; this.role=''; this.method=''; this.who=''; this.time=''
      }
    }">
      <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-[13px] text-info-800 flex items-start gap-2">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')}<span>Record a dose given by someone else (district nurse, family, another carer). Verified external doses count toward interval and 24-hour limits so the next dose stays safe.</span></div>
      <div class="card p-4 space-y-3">
        <p class="text-sm font-semibold text-ink-900">External / other-administered dose</p>
        <div><label class="label">Medicine</label>
          <select x-model="medId" class="field field-md"><option value="">Select…</option>${map(orders, (o) => `<option value="${o.medId}">${esc(o.name)}</option>`)}</select></div>
        <div><label class="label">Given by</label>
          <select x-model="role" class="field field-md"><option value="">Select…</option>${map(['District nurse', 'GP', 'Family member', 'Another carer', 'Pharmacist', 'Paramedic', 'Care home staff'], (r) => `<option>${r}</option>`)}</select></div>
        <div><label class="label">Name (optional)</label><input x-model="who" class="field field-md" placeholder="e.g. Nurse J. Owens" /></div>
        <div><label class="label">How did you verify it?</label>
          <select x-model="method" class="field field-md"><option value="">Select…</option>${map(['Saw it given', 'Told by the person', 'Told by family/professional', 'Written record seen', 'Not verified'], (m) => `<option>${m}</option>`)}</select></div>
        <label class="flex items-center gap-2.5 text-[13px] text-ink-700"><input type="checkbox" x-model="affectsInterval" class="w-4 h-4 rounded" />This dose affects the next-dose interval / 24h count</label>
        <button @click="submit()" class="btn btn-primary btn-md w-full">${icon('check', 'w-4 h-4')}Record verified external dose</button>
        <p x-show="saved" x-cloak class="text-[12px] text-success-700 flex items-center gap-1.5">${icon('check-circle', 'w-3.5 h-3.5')}Recorded and reconciled — office notified.</p>
      </div>
    </div>`
  return mobileFlow(inner)
}
