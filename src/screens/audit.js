import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, btn, badge } from '../components/ui.js'
import { AUDIT_LOG } from '../data/index.js'
import { carerAuditEntries } from '../lib/officeBridge.js'

const ENTITY_BADGE = {
  Template: 'bg-primary-50 text-primary-700 ring-primary-100',
  Pack: 'bg-teal-50 text-teal-600 ring-teal-100',
  'Service-user task': 'bg-info-50 text-info-600 ring-info-100',
  'Visit task': 'bg-warning-50 text-warning-700 ring-warning-100',
}

export function renderAudit() {
  const LOG = [...carerAuditEntries(), ...AUDIT_LOG]
  const entities = [...new Set(LOG.map((r) => r.entity))]

  const dataAttrs = (r) =>
    `data-search="${esc((r.name + ' ' + r.action + ' ' + r.by).toLowerCase())}" data-entity="${esc(r.entity)}"`

  return page(html`
    <div x-data="{ q: '', entity: 'all',
      show(el){
        const s = el.dataset.search, e = el.dataset.entity;
        return (this.entity==='all'||this.entity===e) && (this.q===''||s.includes(this.q.toLowerCase()));
      },
      get visible(){ return [...this.$root.querySelectorAll('[data-search]')].filter(e=>this.show(e)).length }
    }">
      ${pageHeader({
        title: 'Audit Trail',
        subtitle: 'Full version and change history across templates, packs and service-user tasks — every action is attributable, time-stamped and exportable for inspection.',
        breadcrumbs: [{ label: 'Audit Trail' }],
        actions: btn('Export audit pack', { icon: 'download', onclick: `window.__notify('Audit pack exported (PDF)','success')` }),
      })}

      <!-- toolbar -->
      <div class="card p-3 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
          <input x-model="q" placeholder="Search by name, action or person…" class="field field-md pl-9" />
        </div>
        <select x-model="entity" class="field field-md sm:w-52">
          <option value="all">All entity types</option>
          ${map(entities, (e) => `<option value="${esc(e)}">${esc(e)}</option>`)}
        </select>
        <span class="sm:ml-auto text-xs text-ink-500 pr-1" x-text="visible + ' entries'"></span>
      </div>

      <!-- table -->
      <div class="card overflow-hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Entity</th>
              <th>Name</th>
              <th>Action</th>
              <th>Performed by</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${map(LOG, (r) => {
              const automated = r.by === 'System' || r.role === 'Automated'
              return html`<tr ${dataAttrs(r)} x-show="show($el)">
                <td class="whitespace-nowrap text-ink-500 font-mono text-xs">${esc(r.at)}</td>
                <td>${badge(r.entity, ENTITY_BADGE[r.entity] || 'bg-ink-100 text-ink-600 ring-ink-200')}</td>
                <td class="font-medium text-ink-800">${esc(r.name)}</td>
                <td class="text-ink-700">${esc(r.action)}</td>
                <td class="whitespace-nowrap">
                  ${automated
                    ? badge('System / Automated', 'bg-ink-100 text-ink-500 ring-ink-200', 'settings')
                    : html`<span class="text-ink-800 font-medium">${esc(r.by)}</span><span class="block text-xs text-ink-500">${esc(r.role)}</span>`}
                </td>
                <td class="text-ink-500 text-sm">${esc(r.reason)}</td>
              </tr>`
            })}
          </tbody>
        </table>
        <div x-show="visible===0" x-cloak class="text-center text-sm text-ink-500 py-10">No audit entries match your search.</div>
      </div>
    </div>
  `)
}
