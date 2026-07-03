import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, btn, badge, emptyState } from '../components/ui.js'
import { templateCard, templateRow, catIcon } from '../components/domain.js'
// templateRow imported for the list view
import { TEMPLATES, categoryCounts, CATEGORIES, TEMPLATE_TYPES, STATS } from '../data/index.js'

const TABS = [
  { id: 'all', label: 'All templates', match: () => true },
  { id: 'published', label: 'Published', match: (t) => t.governance.status === 'published' },
  { id: 'org', label: 'My organisation', match: (t) => !t.isSystem || t.governance.status === 'published' },
  { id: 'draft', label: 'Drafts', match: (t) => t.governance.status === 'draft' },
  { id: 'pending', label: 'Needs approval', match: (t) => t.governance.status === 'pending' },
  { id: 'retired', label: 'Retired', match: (t) => t.governance.status === 'retired' },
]

export function renderLibrary(_params, query = {}) {
  const cats = categoryCounts()
  const jsStr = (v) => String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const initialCat = jsStr(query.cat || 'all')
  const initialQ = jsStr(query.q || '')

  const dataAttrs = (t) =>
    `data-name="${esc(t.name.toLowerCase())} ${esc(t.code.toLowerCase())} ${esc(t.subcategory.toLowerCase())}" data-cat="${t.categoryId}" data-status="${t.governance.status}" data-type="${t.type}"`

  return page(html`
    <div x-data="{ q: '${initialQ}', cat: '${initialCat}', status: 'all', type: 'all', view: 'grid',
      show(el){
        const n = el.dataset.name, c = el.dataset.cat, s = el.dataset.status, ty = el.dataset.type;
        return (this.cat==='all'||this.cat===c) && (this.status==='all'||this.status===s) && (this.type==='all'||this.type===ty) && (this.q===''||n.includes(this.q.toLowerCase()));
      },
      get visible(){ return [...this.$root.querySelectorAll('[data-name]')].filter(e=>this.show(e)).length }
    }">
      ${pageHeader({
        title: 'Task Template Library',
        subtitle: 'Reusable, governed master templates. Apply individually or as packs to a service-user plan.',
        breadcrumbs: [{ label: 'Library' }],
        actions: btn('Task packs', { href: '#/packs', variant: 'secondary', icon: 'packs' }) + btn('Create template', { href: '#/templates/new', icon: 'plus' }),
      })}

      <div class="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-6">
        <!-- Category rail -->
        <aside class="space-y-1 lg:sticky lg:top-4 self-start">
          <button @click="cat='all'" :class="cat==='all' && 'bg-white text-primary-700 shadow-[var(--shadow-card)] font-semibold'" class="nav-item w-full justify-between">
            <span class="flex items-center gap-2.5">${icon('grid', 'w-4 h-4')} All categories</span>
            <span class="text-xs text-ink-500">${TEMPLATES.length}</span>
          </button>
          <div class="pt-1 max-h-[60vh] overflow-y-auto pr-1 space-y-0.5">
            ${map(cats, (c) => html`
              <button @click="cat='${c.id}'" :class="cat==='${c.id}' && 'bg-white text-primary-700 shadow-[var(--shadow-card)] font-semibold'" class="nav-item w-full justify-between text-left">
                <span class="flex items-center gap-2.5 min-w-0"><span class="shrink-0">${catIcon(c.id, 'w-3.5 h-3.5', 'w-7 h-7')}</span><span class="truncate">${esc(c.name)}</span></span>
                <span class="text-xs text-ink-500 shrink-0">${c.count}</span>
              </button>`)}
          </div>
        </aside>

        <!-- Main -->
        <div>
          <!-- toolbar -->
          <div class="card p-3 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
              <input x-model="q" placeholder="Search by name, code or sub-category…" class="field field-md pl-9" />
            </div>
            <select x-model="type" class="field field-md sm:w-44">
              <option value="all">All types</option>
              ${map(Object.entries(TEMPLATE_TYPES), ([k, v]) => `<option value="${k}">${esc(v.label)}</option>`)}
            </select>
            <div class="flex rounded-lg ring-1 ring-ink-200 p-0.5 bg-ink-50">
              <button @click="view='grid'" :class="view==='grid' ? 'bg-white shadow-sm text-primary-700' : 'text-ink-400'" class="px-2.5 py-1.5 rounded-md">${icon('grid', 'w-4 h-4')}</button>
              <button @click="view='list'" :class="view==='list' ? 'bg-white shadow-sm text-primary-700' : 'text-ink-400'" class="px-2.5 py-1.5 rounded-md">${icon('list', 'w-4 h-4')}</button>
            </div>
          </div>

          <!-- status tabs -->
          <div class="flex items-center gap-1 border-b border-ink-200 mb-4 overflow-x-auto">
            ${map(TABS, (t) => html`<button @click="status='${t.id}'" :class="status==='${t.id}' ? 'text-primary-700 border-primary-600' : 'text-ink-500 border-transparent hover:text-ink-800'" class="px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap">${esc(t.label)}</button>`)}
            <span class="ml-auto text-xs text-ink-500 pr-1 py-2.5" x-text="visible + ' templates'"></span>
          </div>

          <!-- grid -->
          <div x-show="view==='grid'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            ${map(TEMPLATES, (t) => `<div ${dataAttrs(t)} x-show="show($el)">${templateCard(t)}</div>`)}
          </div>

          <!-- list -->
          <div x-show="view==='list'" x-cloak class="card overflow-hidden">
            <table class="data-table">
              <thead><tr><th>Template</th><th>Category</th><th>Type</th><th>Visits</th><th>Priority</th><th class="text-center">Alerts</th><th>Status</th><th class="text-center">Used</th></tr></thead>
              <tbody>
                ${map(TEMPLATES, (t) => templateRow(t, `${dataAttrs(t)} x-show="show($el)"`))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `)
}
