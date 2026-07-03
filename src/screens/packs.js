import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, btn, badge, statCard, sectionCard, defList, statusBadge, emptyState } from '../components/ui.js'
import { packCard, catIcon } from '../components/domain.js'
import { getPack, getTemplate, PACKS, TEMPLATES, VISIT_TIMES, category } from '../data/index.js'
import { notFound } from './notFound.js'

/* ------------------------------------------------------------ Packs index */
export function renderPacks() {
  const totalTemplates = PACKS.reduce((s, p) => s + p.items.length, 0)
  const uniqueTemplates = new Set(PACKS.flatMap((p) => p.items.map((i) => i.templateId))).size
  const restrictedCount = PACKS.filter((p) => p.restricted).length

  const stats = [
    statCard({ label: 'Task packs', value: PACKS.length, sub: 'Curated bundles', icon: 'packs', tone: 'teal' }),
    statCard({ label: 'Templates in packs', value: totalTemplates, sub: `${uniqueTemplates} distinct templates`, icon: 'layers', tone: 'primary' }),
    statCard({ label: 'Published', value: PACKS.filter((p) => p.status === 'published').length, sub: 'Ready to apply', icon: 'file-check', tone: 'success' }),
    statCard({ label: 'Restricted', value: restrictedCount, sub: 'Senior approval only', icon: 'shield', tone: 'danger' }),
  ]

  return page(html`
    ${pageHeader({
      title: 'Task Packs',
      subtitle: 'Bundles of governed templates applied together — set up a new service-user package in one step instead of adding tasks one by one.',
      breadcrumbs: [{ label: 'Task Packs' }],
      actions:
        btn('Create pack', { href: '#/packs/new', icon: 'plus' }) +
        btn('Browse templates', { href: '#/templates', variant: 'secondary', icon: 'library' }),
    })}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${stats.join('')}</div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      ${map(PACKS, packCard)}
    </div>
  `)
}

/* ------------------------------------------------------------ Pack detail */
export function renderPackDetail(params) {
  const p = getPack(params.id)
  if (!p) return notFound()

  const items = p.items.map((it) => ({ ...it, template: getTemplate(it.templateId) }))

  /* Group items by visit slot for the generated-tasks preview */
  const slots = [...new Set(items.map((i) => i.visit))]
    .sort((a, b) => VISIT_TIMES.indexOf(a) - VISIT_TIMES.indexOf(b))

  const templatesList = html`<ul class="divide-y divide-ink-100">
    ${map(items, (it) => html`
      <li class="flex items-center gap-3 py-3">
        ${it.template ? catIcon(it.template.categoryId, 'w-4 h-4', 'w-9 h-9') : catIcon('domestic', 'w-4 h-4', 'w-9 h-9')}
        <div class="min-w-0 flex-1">
          ${it.template
            ? html`<a href="#/templates/${it.template.id}" class="text-sm font-semibold text-ink-900 hover:text-primary-700 truncate block">${esc(it.template.name)}</a>
                <p class="text-xs text-ink-500 font-mono">${esc(it.template.code)} · ${esc(category(it.template.categoryId).name)}</p>`
            : html`<p class="text-sm font-semibold text-ink-500">Unknown template <span class="font-mono text-xs">${esc(it.templateId)}</span></p>`}
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          ${badge(it.visit, 'bg-ink-50 text-ink-600 ring-ink-200', 'clock')}
          ${it.required
            ? badge('Required', 'bg-danger-50 text-danger-600 ring-danger-100')
            : badge('Optional', 'bg-ink-50 text-ink-500 ring-ink-200')}
        </div>
      </li>`)}
  </ul>`

  const previewBody = html`
    <p class="text-sm text-ink-500 mb-4">Applying this pack creates <span class="font-semibold text-ink-800">${items.length} personalised tasks</span> for the chosen service user, scheduled across ${slots.length} visit slot${slots.length === 1 ? '' : 's'}. Each task carries the template's evidence schema, alerts and care-plan links.</p>
    <div class="space-y-4">
      ${map(slots, (slot) => {
        const slotItems = items.filter((i) => i.visit === slot)
        return html`<div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="w-6 h-6 rounded-md bg-primary-50 text-primary-600 grid place-items-center">${icon('clock', 'w-3.5 h-3.5')}</span>
            <p class="section-title">${esc(slot)}</p>
            <span class="text-xs text-ink-500">${slotItems.length} task${slotItems.length === 1 ? '' : 's'}</span>
          </div>
          <ul class="space-y-1 pl-8">
            ${map(slotItems, (it) => html`<li class="flex items-center gap-2 text-sm text-ink-700">
              <span class="w-1.5 h-1.5 rounded-full ${it.required ? 'bg-danger-400' : 'bg-ink-300'} shrink-0"></span>
              ${esc(it.template ? it.template.name : it.templateId)}
            </li>`)}
          </ul>
        </div>`
      })}
    </div>`

  const governance = defList([
    { label: 'Status', value: statusBadge(p.status) },
    { label: 'Version', value: `<span class="font-mono">${esc(p.version)}</span>` },
    { label: 'Approved by', value: esc(p.approvedBy) },
    { label: 'Approved date', value: esc(p.approvedAt) },
    { label: 'Restriction', value: p.restricted ? badge('Restricted — senior approval', 'bg-danger-50 text-danger-700 ring-danger-100', 'shield') : badge('Standard use', 'bg-ink-100 text-ink-600 ring-ink-200'), full: true },
    { label: 'Best for', value: esc(p.useCase), full: true },
  ])

  return page(html`
    ${pageHeader({
      breadcrumbs: [{ label: 'Task Packs', href: '#/packs' }, { label: p.name }],
      title: p.name,
      actions:
        btn('Apply pack to service user', { href: `#/apply?pack=${p.id}`, icon: 'user-check' }) +
        btn('Edit', { href: '#/packs/new', variant: 'secondary', icon: 'edit' }),
    })}

    <div class="flex flex-wrap items-center gap-3 mb-6 -mt-2">
      ${catIcon(p.items[0]?.template ? p.items[0].template.categoryId : 'personal-care')}
      <div class="flex items-center gap-2 flex-wrap">
        ${p.restricted ? badge('Restricted', 'bg-danger-50 text-danger-600 ring-danger-100', 'shield') : statusBadge(p.status)}
        ${badge(`${p.items.length} templates`, 'bg-ink-100 text-ink-600 ring-ink-200', 'layers')}
        <span class="text-xs text-ink-400 font-mono">${esc(p.version)}</span>
        <span class="text-xs text-ink-400">· ${esc(p.useCase)}</span>
      </div>
    </div>

    <p class="text-sm text-ink-600 max-w-2xl mb-6 -mt-2">${esc(p.description)}</p>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        ${sectionCard({ title: 'Templates in this pack', icon: 'layers', actions: badge(`${p.items.length}`, 'bg-ink-100 text-ink-600 ring-ink-200'), body: templatesList })}
      </div>
      <div class="space-y-6">
        ${sectionCard({ title: 'Generated service-user tasks (preview)', icon: 'sparkles', body: previewBody })}
        ${sectionCard({ title: 'Governance', icon: 'shield', body: governance })}
      </div>
    </div>
  `)
}

/* ------------------------------------------------------------ Pack builder */
export function renderPackBuilder() {
  const visitOptions = VISIT_TIMES.filter((v) => v !== 'Any Visit')

  return page(html`
    ${pageHeader({
      breadcrumbs: [{ label: 'Task Packs', href: '#/packs' }, { label: 'New pack' }],
      title: 'Create task pack',
      subtitle: 'Bundle governed templates into a reusable pack that can be applied to a service user in one step.',
    })}

    <div x-data="{
      name: '',
      description: '',
      useCase: '',
      visits: [],
      selected: [],
      q: '',
      has(id) { return this.selected.includes(id) },
      toggle(id) { this.has(id) ? this.selected = this.selected.filter(x => x !== id) : this.selected.push(id) },
      matches(name, cat) { const q = this.q.toLowerCase().trim(); return !q || name.toLowerCase().includes(q) || cat.toLowerCase().includes(q) },
    }">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- LEFT: pack details + selected -->
        <div class="space-y-6">
          ${sectionCard({ title: 'Pack details', icon: 'edit', body: html`
            <div class="space-y-4">
              <div>
                <label class="label">Pack name</label>
                <input type="text" x-model="name" class="field field-md" placeholder="e.g. Night Support Pack" />
              </div>
              <div>
                <label class="label">Description</label>
                <textarea rows="2" x-model="description" class="field px-3 py-2" placeholder="What this pack is for and when to use it…"></textarea>
              </div>
              <div>
                <label class="label">Primary use case</label>
                <input type="text" x-model="useCase" class="field field-md" placeholder="e.g. Dementia · Anxiety · Sundowning" />
              </div>
              <div>
                <p class="label">Default visit slots</p>
                <div class="flex flex-wrap gap-2">
                  ${map(visitOptions, (v) => html`
                    <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-ink-200 cursor-pointer hover:bg-ink-50"
                      :class="visits.includes('${esc(v)}') && 'ring-primary-300 bg-primary-50/60'">
                      <input type="checkbox" value="${esc(v)}" x-model="visits" class="w-4 h-4 rounded text-primary-600" />
                      <span class="text-sm text-ink-700">${esc(v)}</span>
                    </label>`)}
                </div>
              </div>
            </div>` })}

          ${sectionCard({ title: 'Selected templates', icon: 'layers', actions: html`<span class="badge bg-primary-50 text-primary-700 ring-primary-100" x-text="selected.length + ' selected'"></span>`, body: html`
            <template x-if="selected.length === 0">
              <div>${emptyState({ icon: 'layers', title: 'No templates yet', body: 'Pick templates from the picker on the right to build this pack.' })}</div>
            </template>
            <template x-if="selected.length > 0">
              <ul class="space-y-2">
                <template x-for="id in selected" :key="id">
                  <li class="flex items-center gap-3 p-2.5 rounded-lg ring-1 ring-ink-200 bg-white">
                    <span class="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon('check', 'w-4 h-4')}</span>
                    <span class="text-sm font-medium text-ink-800 flex-1 min-w-0 truncate" x-text="id"></span>
                    <button type="button" @click="toggle(id)" class="btn btn-ghost btn-sm !px-2" title="Remove">${icon('x', 'w-4 h-4')}</button>
                  </li>
                </template>
              </ul>
            </template>` })}
        </div>

        <!-- RIGHT: template picker -->
        <div class="space-y-6">
          ${sectionCard({ title: 'Add templates', icon: 'search', pad: 'p-0', body: html`
            <div class="p-4 border-b border-ink-100">
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
                <input type="text" x-model="q" class="field field-md pl-9" placeholder="Search templates by name or category…" />
              </div>
            </div>
            <div class="p-3 space-y-2 max-h-[32rem] overflow-y-auto">
              ${map(TEMPLATES, (t) => {
                const c = category(t.categoryId)
                return html`<div x-show="matches('${esc(t.name).replace(/'/g, "\\'")}', '${esc(c.name)}')">${templateRowFor(t, c)}</div>`
              })}
            </div>` })}
        </div>
      </div>

      <!-- Footer actions -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mt-6 pt-5 border-t border-ink-200">
        <p class="text-sm text-ink-500 sm:mr-auto">
          <span x-text="selected.length"></span> template<span x-show="selected.length !== 1">s</span> selected across
          <span x-text="visits.length || 'no'"></span> visit slot<span x-show="visits.length !== 1">s</span>.
        </p>
        ${btn('Save draft pack', { variant: 'secondary', icon: 'archive', attrs: `@click="window.__notify('Draft pack saved','success'); location.hash='#/packs'"` })}
        ${btn('Submit for approval', { icon: 'file-check', attrs: `@click="window.__notify('Pack submitted for governance approval','success'); location.hash='#/packs'"` })}
      </div>
    </div>
  `)
}

/* Helper: a single picker row (kept inline-friendly for the Alpine wrapper). */
function templateRowFor(t, c) {
  return html`
    <div @click="toggle('${t.id}')"
      class="flex items-center gap-3 p-2.5 rounded-lg ring-1 cursor-pointer transition-colors"
      :class="has('${t.id}') ? 'ring-primary-300 bg-primary-50/60' : 'ring-ink-200 hover:bg-ink-50'">
      ${catIcon(t.categoryId, 'w-4 h-4', 'w-8 h-8')}
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-ink-800 truncate">${esc(t.name)}</p>
        <p class="text-xs text-ink-500">${esc(c.name)}</p>
      </div>
      <button type="button" @click.stop="toggle('${t.id}')"
        class="btn btn-sm shrink-0"
        :class="has('${t.id}') ? 'btn-secondary' : 'btn-primary'">
        <span x-show="!has('${t.id}')">${icon('plus', 'w-4 h-4')}<span class="ml-1">Add</span></span>
        <span x-show="has('${t.id}')" x-cloak>${icon('check', 'w-4 h-4')}<span class="ml-1">Added</span></span>
      </button>
    </div>`
}
