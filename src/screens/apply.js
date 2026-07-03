import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, btn, badge, priorityBadge, statusBadge, sectionCard, defList, toggleRow } from '../components/ui.js'
import { catIcon, stepper, evidenceSchemaPreview, templateRow } from '../components/domain.js'
import { TEMPLATES, getTemplate, getPack, SERVICE_USERS, VISIT_TIMES, PRIORITIES, SCHEMAS, category } from '../data/index.js'

const STEPS = ['Choose task', 'Personalise', 'Link to visits', 'Evidence & alerts', 'Review & publish']

export function renderApply(_params, query = {}) {
  const t = query.template ? getTemplate(query.template) : null
  const p = query.pack ? getPack(query.pack) : null
  const selectedSu = SERVICE_USERS.find((s) => s.id === query.su) ? query.su : 'su-mary'
  const schema = t?.evidenceSchema || SCHEMAS.completion
  const defaultShort = t?.instructions?.short
    || (p ? `Apply the ${p.name} to this service user's plan, following each template's standard instruction.` : 'Support the service user with this task at the linked visits, recording the outcome each time.')

  /* ---- Step 1: choose template/pack + service user ---- */
  const chosenCard = (() => {
    if (t) {
      const c = category(t.categoryId)
      return html`<div class="card p-4 flex items-start gap-3 ring-2 ring-primary-200">
        ${catIcon(t.categoryId)}
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm font-semibold text-ink-900">${esc(t.name)}</h3>
            ${badge('Selected', 'bg-primary-50 text-primary-700 ring-primary-100', 'check')}
          </div>
          <p class="text-xs text-ink-500 mt-0.5">${esc(c.name)} · <span class="font-mono">${esc(t.code)}</span></p>
          <p class="text-sm text-ink-500 mt-2 line-clamp-2">${esc(t.description || t.instructions.short)}</p>
          <div class="flex flex-wrap items-center gap-1.5 mt-2">${priorityBadge(t.priority)}${t.defaultVisits.map((v) => badge(v, 'bg-ink-50 text-ink-500 ring-ink-200', 'clock')).join('')}</div>
        </div>
        ${btn('Change', { href: '#/apply?su=' + selectedSu, variant: 'ghost', size: 'sm' })}
      </div>`
    }
    if (p) {
      return html`<div class="card p-4 flex items-start gap-3 ring-2 ring-primary-200">
        <span class="grid place-items-center rounded-lg ring-1 w-11 h-11 bg-primary-50 text-primary-600 ring-primary-100">${icon(p.icon, 'w-5.5 h-5.5')}</span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-sm font-semibold text-ink-900">${esc(p.name)}</h3>
            ${badge('Pack selected', 'bg-primary-50 text-primary-700 ring-primary-100', 'check')}
          </div>
          <p class="text-sm text-ink-500 mt-1 line-clamp-2">${esc(p.description)}</p>
          <div class="flex items-center gap-2 text-xs text-ink-500 mt-2">${icon('layers', 'w-3.5 h-3.5')} ${p.items.length} templates · ${p.defaultVisits.length} visit slots</div>
        </div>
        ${btn('Change', { href: '#/apply?su=' + selectedSu, variant: 'ghost', size: 'sm' })}
      </div>`
    }
    return ''
  })()

  const picker = (t || p) ? '' : html`
    <div x-data="{ q: '' }">
      <div class="relative mb-3">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
        <input x-model="q" placeholder="Search templates by name or code…" class="field field-md pl-9" />
      </div>
      <div class="card overflow-hidden">
        <table class="data-table">
          <thead><tr><th>Template</th><th>Category</th><th>Type</th><th>Visits</th><th>Priority</th><th class="text-center">Alerts</th><th>Status</th><th class="text-center">Used</th></tr></thead>
          <tbody>
            ${map(TEMPLATES.filter((x) => x.governance.status === 'published').slice(0, 18), (x) => templateRow(x, `data-name="${esc((x.name + ' ' + x.code).toLowerCase())}" x-show="q==='' || $el.dataset.name.includes(q.toLowerCase())"`))}
          </tbody>
        </table>
      </div>
      <p class="hint mt-2">Showing published templates. Open a template to apply it directly, or pick a pack from the library.</p>
    </div>`

  const step1 = html`
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        ${sectionCard({ title: t || p ? 'Selected to apply' : 'Choose a template or pack', icon: 'library', body: chosenCard || picker })}
      </div>
      <div class="space-y-4">
        ${sectionCard({ title: 'Apply to service user', icon: 'users', body: html`<div class="space-y-2.5">
          ${map(SERVICE_USERS, (s) => html`
            <label class="flex items-center gap-3 p-3 rounded-xl ring-1 cursor-pointer transition-all"
              :class="su==='${s.id}' ? 'ring-2 ring-primary-300 bg-primary-50/40' : 'ring-ink-200 hover:ring-primary-200'">
              <input type="radio" name="apply-su" value="${s.id}" x-model="su" class="w-4 h-4 text-primary-600" ${s.id === selectedSu ? 'checked' : ''} />
              <span class="inline-flex items-center justify-center rounded-full font-semibold w-9 h-9 text-xs bg-${s.color}-100 text-${s.color}-700">${esc(s.initials)}</span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-semibold text-ink-900 truncate">${esc(s.name)}</span>
                <span class="block text-xs text-ink-500">${s.age} yrs · ${esc(s.package)}</span>
              </span>
              <span class="text-xs font-semibold text-ink-500 shrink-0">${s.activeTaskCount} tasks</span>
            </label>`)}
        </div>` })}
      </div>
    </div>`

  /* ---- Step 2: personalise ---- */
  const step2 = html`
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        ${sectionCard({ title: 'Personalised instruction for the carer', icon: 'mobile', body: html`
          <label class="label">Instruction shown in the carer app</label>
          <textarea x-model="instruction" rows="4" class="field px-3 py-2">${esc(defaultShort)}</textarea>
          <p class="hint mt-1.5">Write it the way the carer should read it at the door — name the person and their preferences.</p>
          <div class="mt-4">
            <label class="label">Priority for this person</label>
            <select x-model="priority" class="field field-md sm:w-60">
              ${map(Object.entries(PRIORITIES), ([k, v]) => `<option value="${k}" ${k === (t?.priority || 'recommended') ? 'selected' : ''}>${esc(v.label)}</option>`)}
            </select>
          </div>
        ` })}
      </div>
      <div class="space-y-6">
        ${sectionCard({ title: 'Personalised example', icon: 'sparkles', body: html`
          <div class="rounded-lg bg-teal-50 ring-1 ring-teal-100 p-3">
            <p class="text-xs font-semibold text-teal-700 mb-0.5">How Mary likes it</p>
            <p class="text-sm text-teal-800">"Mary prefers tea with milk in the morning. Offer a biscuit and sit with her while she drinks — she takes more when she has company."</p>
          </div>
          <p class="hint mt-3">Personalisation is recorded against the service-user task only — the master template is unchanged.</p>
        ` })}
      </div>
    </div>`

  /* ---- Step 3: link to visits ---- */
  const defaultVisits = t?.defaultVisits || p?.defaultVisits || ['Lunch', 'Tea']
  const step3 = html`
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      ${sectionCard({ title: 'Show this task at these visits', icon: 'clock', body: html`<div class="grid grid-cols-2 gap-2">
        ${map(VISIT_TIMES, (v) => html`
          <label class="flex items-center gap-2.5 p-2.5 rounded-lg ring-1 ring-ink-200 hover:bg-ink-50 cursor-pointer">
            <input type="checkbox" value="${esc(v)}" x-model="visits" class="w-4 h-4 rounded text-primary-600" ${defaultVisits.includes(v) ? 'checked' : ''} />
            <span class="text-sm text-ink-700">${esc(v)}</span>
          </label>`)}
      </div>` })}
      ${sectionCard({ title: 'Advanced — only show this task if', icon: 'settings', body: html`<div class="divide-y divide-ink-100">
        ${toggleRow('Visit has two carers', false, { desc: 'Hide from single-carer visits', model: 'condTwoCarers' })}
        ${toggleRow('Medication support is active', false, { desc: 'Only when an eMAR plan is in place', model: 'condMeds' })}
        ${toggleRow('Hydration risk is active', true, { desc: 'Linked to the dehydration risk assessment', model: 'condHydration' })}
        ${toggleRow('Hospital discharge plan is active', false, { desc: 'Only during a discharge-to-assess period', model: 'condDischarge' })}
      </div>` })}
    </div>`

  /* ---- Step 4: evidence & alerts ---- */
  const step4 = html`
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      ${sectionCard({ title: 'Evidence the carer must record', icon: 'file-check', actions: badge(`${schema.fields.length} fields`, 'bg-ink-100 text-ink-600 ring-ink-200'), body: evidenceSchemaPreview(schema) })}
      ${sectionCard({ title: 'Office alerts for this task', icon: 'bell', body: html`<div class="divide-y divide-ink-100">
        ${toggleRow('Below visit target', true, { desc: 'Raise if recorded amount is under the daily target', model: 'alertBelowTarget' })}
        ${toggleRow('No fluid by tea visit', true, { desc: 'Flag if nothing logged before the Tea visit', model: 'alertNoFluid' })}
        ${toggleRow('Refused twice in 24h', true, { desc: 'Escalate repeated refusals to the office', model: 'alertRefused' })}
        ${toggleRow('Concern raised on record', false, { desc: 'Notify the care coordinator immediately', model: 'alertConcern' })}
        ${toggleRow('Task missed at any visit', false, { desc: 'Open an exception when a visit ends without it', model: 'alertMissed' })}
      </div>` })}
    </div>`

  /* ---- Step 5: review & publish ---- */
  const summaryName = t?.name || p?.name || 'Selected task'
  const step5 = html`
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        ${sectionCard({ title: 'What will be added to the task plan', icon: 'check-circle', body: html`
          <div class="rounded-lg bg-primary-50 ring-1 ring-primary-100 p-4">
            <p class="text-sm text-ink-800">This task will appear at <span class="font-semibold text-primary-700" x-text="visits.length ? visits.join(' and ') : 'the selected'"></span> visits every day, with a personalised instruction for the carer and the evidence below required before the visit can be completed.</p>
          </div>
          <div class="mt-4">${defList([
            { label: 'Task', value: `<span class="font-medium text-ink-900">${esc(summaryName)}</span>`, full: true },
            { label: 'Service user', value: 'Mary Adams' },
            { label: 'Priority', value: '<span class="capitalize" x-text="priority"></span>' },
            { label: 'Visits', value: '<span x-text="visits.length ? visits.join(\', \') : \'—\'"></span>', full: true },
            { label: 'Care-plan link', value: t?.carePlanDomain ? badge(t.carePlanDomain, 'bg-primary-50 text-primary-700 ring-primary-100', 'link') : badge('Hydration', 'bg-primary-50 text-primary-700 ring-primary-100', 'link') },
          ])}</div>
        ` })}
        ${sectionCard({ title: 'Required evidence', icon: 'file-check', body: evidenceSchemaPreview(schema) })}
      </div>
      <div class="space-y-6">
        ${sectionCard({ title: 'Office alerts', icon: 'bell', body: html`<ul class="space-y-2 text-sm text-ink-700">
          <li class="flex items-start gap-2" x-show="alertBelowTarget">${icon('check', 'w-4 h-4 text-success-600 mt-0.5 shrink-0')}Below visit target</li>
          <li class="flex items-start gap-2" x-show="alertNoFluid">${icon('check', 'w-4 h-4 text-success-600 mt-0.5 shrink-0')}No fluid by tea visit</li>
          <li class="flex items-start gap-2" x-show="alertRefused">${icon('check', 'w-4 h-4 text-success-600 mt-0.5 shrink-0')}Refused twice in 24h</li>
          <li class="flex items-start gap-2" x-show="alertConcern">${icon('check', 'w-4 h-4 text-success-600 mt-0.5 shrink-0')}Concern raised on record</li>
          <li class="flex items-start gap-2" x-show="alertMissed">${icon('check', 'w-4 h-4 text-success-600 mt-0.5 shrink-0')}Task missed at any visit</li>
        </ul>` })}
        ${sectionCard({ title: 'Governance', icon: 'shield', body: defList([
          { label: 'Source', value: t ? statusBadge(t.governance.status) : badge('Pack', 'bg-ink-100 text-ink-600 ring-ink-200'), full: true },
          { label: 'Version', value: t?.governance?.version || '1.0' },
          { label: 'Applied by', value: 'Care Coordinator' },
        ]) })}
      </div>
    </div>`

  const steps = [step1, step2, step3, step4, step5]

  return page(html`
    ${pageHeader({
      breadcrumbs: [{ label: 'Service Users', href: '#/service-users' }, { label: 'Apply' }],
      title: 'Apply template / pack to service user',
      subtitle: 'Turn a governed master template into a personalised, visit-linked task on a care plan.',
    })}

    <div x-data="{
      step: 1,
      su: ${esc(JSON.stringify(selectedSu))},
      instruction: ${esc(JSON.stringify(defaultShort))},
      priority: ${esc(JSON.stringify(t?.priority || 'recommended'))},
      visits: ${esc(JSON.stringify(defaultVisits))},
      condTwoCarers: false, condMeds: false, condHydration: true, condDischarge: false,
      alertBelowTarget: true, alertNoFluid: true, alertRefused: true, alertConcern: false, alertMissed: false
    }">
      <div class="card p-5 mb-6">
        ${map(STEPS, (_s, i) => `<div x-show="step===${i + 1}"${i === 0 ? '' : ' x-cloak'}>${stepper(STEPS, i)}</div>`)}
      </div>

      ${map(steps, (panel, i) => html`<div x-show="step===${i + 1}"${i === 0 ? '' : ' x-cloak'} class="animate-fade-in">${panel}</div>`)}

      <!-- footer nav -->
      <div class="flex items-center justify-between mt-8 pt-5 border-t border-ink-100">
        <button class="btn btn-secondary btn-md" :disabled="step===1" :class="step===1 && 'opacity-40 pointer-events-none'" @click="step = Math.max(1, step-1)">${icon('arrow-left', 'w-4 h-4')}<span>Back</span></button>
        <div class="flex items-center gap-2 text-xs text-ink-500"><span x-text="'Step '+step+' of ${STEPS.length}'"></span></div>
        <button class="btn btn-primary btn-md" x-show="step < ${STEPS.length}" @click="step = Math.min(${STEPS.length}, step+1)"><span>Next</span>${icon('arrow-right', 'w-4 h-4')}</button>
        <button class="btn btn-primary btn-md" x-show="step === ${STEPS.length}" x-cloak
          onclick="window.__notify('Task published to Mary Adams task plan','success');location.hash='#/service-users/su-mary/planner'">${icon('check', 'w-4 h-4')}<span>Publish to task plan</span></button>
      </div>
    </div>
  `)
}
