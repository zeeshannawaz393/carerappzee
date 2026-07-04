/** §20 — Order supplies: a searchable PPE/consumables catalogue the carer
 *  requests from the office; the office delivers and bills the client. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { getServiceUser } from '../data/index.js'
import { SUPPLY_CATALOGUE, SUPPLY_CATEGORIES } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'

const gbp = (n) => `£${Number(n).toFixed(2)}`

export function renderSupplies({ id }) {
  const su = getServiceUser(id)
  if (!su) return mobileFlow(html`${flowHeader({ title: 'Not found', back: '#/carer/clients' })}${emptyMobile({ title: 'Client not found' })}`)

  const orders = carerStore.supplyOrders(id)
  const priceMap = JSON.stringify(Object.fromEntries(SUPPLY_CATALOGUE.map((i) => [i.id, i.price])))
  const cats = ['All', ...SUPPLY_CATEGORIES]

  const catRow = (i) => `<div data-name="${esc(i.name.toLowerCase())} ${esc(i.cat.toLowerCase())}" x-show="(cat==='All'||cat==='${i.cat}') && (q===''|| $el.dataset.name.includes(q.toLowerCase()))" class="p-3.5 flex items-center gap-3">
      <span class="w-9 h-9 rounded-lg ${i.tint} grid place-items-center shrink-0">${icon(i.icon, 'w-4.5 h-4.5')}</span>
      <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(i.name)}</p><p class="text-xs text-ink-400">${esc(i.unit)} · <span class="font-medium text-ink-600">${gbp(i.price)}</span></p></div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" @click="if(qty['${i.id}'])qty['${i.id}']--" :disabled="!qty['${i.id}']" class="w-8 h-8 rounded-lg ring-1 ring-ink-200 text-ink-600 grid place-items-center disabled:opacity-40 active:bg-ink-100 text-lg leading-none">−</button>
        <span class="w-5 text-center text-sm font-semibold tabular-nums" x-text="qty['${i.id}']||0"></span>
        <button type="button" @click="qty['${i.id}']=(qty['${i.id}']||0)+1" class="w-8 h-8 rounded-lg bg-primary-600 text-white grid place-items-center active:bg-primary-700 text-lg leading-none">+</button>
      </div>
    </div>`

  const orderRow = (o) => `<div class="card p-3.5">
      <div class="flex items-center gap-2"><span class="font-mono text-xs text-ink-400">${esc(o.ref)}</span><span class="badge bg-warning-50 text-warning-700 ring-warning-100">${esc(o.status)}</span><span class="ml-auto text-sm font-bold text-ink-900 tabular-nums">${gbp(o.total)}</span></div>
      <p class="text-xs text-ink-500 mt-1.5">${(o.items || []).map((it) => `${it.qty}× ${esc(it.name)}`).join(' · ')}</p>
      <p class="text-[11px] text-ink-400 mt-1">${esc(o.at)} · billed to ${esc(su.name)}</p>
    </div>`

  const inner = html`
    ${flowHeader({ title: 'Order supplies', subtitle: esc(su.name), back: `#/carer/clients/${id}/equipment` })}
    <div class="flex-1 overflow-y-auto pb-28" x-data="{ q:'', cat:'All', qty:{}, P:${priceMap},
        get count(){ return Object.values(this.qty).reduce((a,b)=>a+(b||0),0) },
        get total(){ return Object.entries(this.qty).reduce((s,[k,n])=>s+(n||0)*(this.P[k]||0),0) },
        submit(){ if(!this.count){ window.__notify('Add at least one item','warning'); return } window.__orderSupplies('${id}', JSON.parse(JSON.stringify(this.qty))); this.qty={} } }">
      <div class="p-4 space-y-3">
        <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-[13px] text-info-800 flex items-start gap-2">${icon('info', 'w-4 h-4 shrink-0 mt-0.5')}<span>Request PPE &amp; consumables from the office. Items are delivered and the cost is added to <b>${esc(su.name)}</b>'s next invoice.</span></div>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
          <input x-model="q" class="field field-md pl-9" placeholder="Search supplies — gloves, pads, wipes…" />
        </div>
        <div class="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          ${cats.map((c) => `<button type="button" @click="cat='${c}'" :class="cat==='${c}' ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600'" class="shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium">${c}</button>`).join('')}
        </div>
      </div>

      <div class="px-4">
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${map(SUPPLY_CATALOGUE, catRow)}
        </div>
      </div>

      ${orders.length ? `<div class="p-4 space-y-2"><p class="section-title mb-1">Previous requests</p>${orders.map(orderRow).join('')}</div>` : ''}

      <!-- sticky basket -->
      <div x-show="count>0" x-cloak class="absolute bottom-0 inset-x-0 p-4 bg-surface border-t border-ink-200">
        <button @click="submit()" class="btn btn-primary btn-lg w-full">${icon('packs', 'w-5 h-5')}<span x-text="'Request '+count+' item'+(count>1?'s':'')+' · '+('£'+total.toFixed(2))"></span></button>
        <p class="text-[11px] text-ink-400 text-center mt-1.5">Added to ${esc(su.name)}'s invoice · office confirms delivery</p>
      </div>
    </div>`
  return mobileFlow(inner)
}
