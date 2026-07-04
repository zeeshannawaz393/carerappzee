/** §20 — Equipment & consumables register (LOLER-aware) for a service user. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { getServiceUser } from '../data/index.js'
import { equipmentFor, consumablesFor } from '../data/carer.js'

const STOCK = {
  in: { label: 'In stock', cls: 'bg-success-50 text-success-700 ring-success-100' },
  low: { label: 'Low', cls: 'bg-warning-50 text-warning-700 ring-warning-100' },
  out: { label: 'Out', cls: 'bg-danger-50 text-danger-700 ring-danger-100' },
}

export function renderEquipment({ id }) {
  const su = getServiceUser(id)
  if (!su) return mobileFlow(html`${flowHeader({ title: 'Not found', back: `#/carer/clients/${id}` })}${emptyMobile({ title: 'Client not found' })}`)

  const equipment = equipmentFor(id)
  const consumables = consumablesFor(id)

  const equipRow = (e) => html`<div class="card p-3.5 flex items-start gap-3">
    <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0 ${e.status === 'faulty' ? 'bg-danger-50 text-danger-600' : 'bg-primary-50 text-primary-600'}">${icon('settings', 'w-4.5 h-4.5')}</span>
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm font-semibold text-ink-900">${esc(e.name)}</p>
        <span class="badge ${e.status === 'faulty' ? 'bg-danger-50 text-danger-700 ring-danger-100' : 'bg-success-50 text-success-700 ring-success-100'}">${e.status === 'faulty' ? 'Faulty' : 'OK'}</span>
      </div>
      <p class="text-xs text-ink-400">${esc(e.type)} · Last inspected ${esc(e.lastInspection)}</p>
      ${e.nextInspection ? `<p class="text-[11px] text-ink-400">Next inspection ${esc(e.nextInspection)}</p>` : ''}
      ${e.loler ? `<span class="badge bg-warning-50 text-warning-700 ring-warning-100 mt-1.5">${icon('shield', 'w-3 h-3')}LOLER — 6-monthly</span>` : ''}
      ${e.status === 'faulty' ? `<div class="mt-2"><button onclick="window.__notify('Fault reported to office','warning')" class="btn btn-danger btn-sm">${icon('alert', 'w-3.5 h-3.5')}Report fault</button></div>` : ''}
    </div>
  </div>`

  const stockRow = (c) => { const s = STOCK[c.status] || STOCK.in; return html`<div class="card p-3.5 flex items-center gap-3">
    <span class="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 grid place-items-center shrink-0">${icon('archive', 'w-4.5 h-4.5')}</span>
    <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(c.name)}</p></div>
    <div class="flex flex-col items-end gap-1.5">
      <span class="badge ${s.cls}">${s.label}</span>
      ${c.status === 'low' || c.status === 'out' ? `<a href="#/carer/clients/${id}/supplies" class="btn btn-secondary btn-sm">${icon('refresh', 'w-3.5 h-3.5')}Request restock</a>` : ''}
    </div>
  </div>` }

  const inner = html`
    ${flowHeader({ title: 'Equipment & consumables', subtitle: esc(su.name), back: `#/carer/clients/${id}` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="rounded-xl bg-warning-50 ring-1 ring-warning-100 p-3 text-[13px] text-warning-800 flex items-center gap-2">${icon('alert', 'w-4 h-4')}Check all equipment before use. LOLER-registered items (hoists & slings) must be in-date for their 6-monthly inspection.</div>

      <a href="#/carer/clients/${id}/supplies" class="card p-3.5 flex items-center gap-3 active:bg-ink-50"><span class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon('packs', 'w-4.5 h-4.5')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Order supplies</p><p class="text-xs text-ink-500">Gloves, PPE &amp; consumables — billed to the client</p></div>${icon('chevron-right', 'w-4 h-4 text-ink-300')}</a>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Equipment</p>
        <div class="space-y-2">
          ${equipment.length ? map(equipment, equipRow) : '<div class="card p-3.5 text-[13px] text-ink-500">No equipment recorded for this client.</div>'}
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Consumables</p>
        <div class="space-y-2">
          ${consumables.length ? map(consumables, stockRow) : '<div class="card p-3.5 text-[13px] text-ink-500">No consumables recorded for this client.</div>'}
        </div>
      </div>
    </div>`
  return mobileFlow(inner)
}
