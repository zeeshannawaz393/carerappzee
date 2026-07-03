import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, btn, badge, sectionCard, defList, toggleRow } from '../components/ui.js'
import { evidenceSchemaPreview } from '../components/domain.js'
import { getTemplate, CATEGORIES, TEMPLATE_TYPES, PRIORITIES, VISIT_TIMES, CQC_KEY_QUESTIONS, SEVERITY, SCHEMAS } from '../data/index.js'

const STEP_LABELS = [
  'Basic details',
  'Care-plan & risk',
  'Visit & repeat',
  'Carer instructions',
  'Evidence form',
  'Completion rules',
  'Alert rules',
  'Visibility & governance',
  'Review & submit',
]

const COMPLETION_OPTIONS = [
  { id: 'optional', label: 'Optional', desc: 'Carer may record if relevant. No prompt.' },
  { id: 'recommended', label: 'Recommended', desc: 'Surfaced as recommended on the visit checklist.' },
  { id: 'essential', label: 'Essential', desc: 'Highlighted; office notified if repeatedly skipped.' },
  { id: 'critical', label: 'Critical', desc: 'Always shown first; non-completion raises an exception.' },
  { id: 'required_before_visit', label: 'Required before visit completion', desc: 'Carer cannot close the visit until this is recorded.' },
  { id: 'manager_review', label: 'Requires manager review', desc: 'Each record is held for office sign-off.' },
  { id: 'second_carer', label: 'Requires second carer confirmation', desc: 'Two-carer task — a second signature is required.' },
]

const ALERT_TYPES = [
  { id: 'missed', label: 'Task missed', desc: 'No record captured by end of visit window.', sev: 'high' },
  { id: 'refused', label: 'Care refused', desc: 'Service user declined the support.', sev: 'medium' },
  { id: 'overdue', label: 'Task overdue', desc: 'Past its scheduled time with no record.', sev: 'medium' },
  { id: 'repeated_refusal', label: 'Repeated refusal', desc: 'Refused across consecutive visits.', sev: 'high' },
  { id: 'low_intake', label: 'Low intake', desc: 'Fluid / food below the agreed threshold.', sev: 'high' },
  { id: 'abnormal_observation', label: 'Abnormal observation', desc: 'Reading outside the safe range.', sev: 'critical' },
  { id: 'medication_not_given', label: 'Medication not given', desc: 'eMAR outcome other than “Given”.', sev: 'critical' },
  { id: 'concern_keyword', label: 'Concern keyword', desc: 'Note contains a flagged safeguarding keyword.', sev: 'high' },
  { id: 'late', label: 'Late completion', desc: 'Recorded significantly after scheduled time.', sev: 'low' },
  { id: 'no_evidence', label: 'No evidence attached', desc: 'Required photo / signature missing.', sev: 'medium' },
]

const VISIBILITY_ROWS = [
  { key: 'carer', label: 'Carer mobile app', desc: 'Appears on the carer visit checklist.', on: true },
  { key: 'office', label: 'Office dashboard', desc: 'Visible to coordinators and managers.', on: true },
  { key: 'family', label: 'Family portal', desc: 'Shared with approved family contacts.', on: false },
  { key: 'reports', label: 'Reports & analytics', desc: 'Included in outcome and compliance reports.', on: true },
  { key: 'carePlanPrint', label: 'Care plan printout', desc: 'Printed onto the service user care plan.', on: true },
  { key: 'auditPack', label: 'Audit / CQC pack', desc: 'Bundled into the inspection evidence pack.', on: true },
]

/** Build a select control from an array of {value,label} (or strings). */
function select(model, options, { placeholder } = {}) {
  const opts = options.map((o) => {
    const value = typeof o === 'string' ? o : o.value
    const label = typeof o === 'string' ? o : o.label
    return `<option value="${esc(value)}">${esc(label)}</option>`
  }).join('')
  return `<select class="field field-md" x-model="${model}">${placeholder ? `<option value="">${esc(placeholder)}</option>` : ''}${opts}</select>`
}

/** Reactive top stepper — same visual language as the stepper() component,
 *  but driven by the Alpine `step` (1-based) so it lights up as the user advances. */
function reactiveStepper(labels) {
  return html`<ol class="flex items-center w-full">
    ${map(labels, (s, i) => {
      const n = i + 1
      const last = i === labels.length - 1
      return html`<li class="flex items-center ${last ? '' : 'flex-1'}">
        <div class="flex items-center gap-2.5 shrink-0">
          <span class="w-8 h-8 rounded-full grid place-items-center text-sm font-semibold shrink-0 transition-colors"
            :class="step>${n} ? 'bg-success-500 text-white' : step===${n} ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-ink-100 text-ink-400'">
            <template x-if="step>${n}">${icon('check', 'w-4 h-4')}</template>
            <template x-if="step<=${n}"><span>${n}</span></template>
          </span>
          <span class="text-sm font-medium hidden lg:block"
            :class="step===${n} ? 'text-ink-900' : step>${n} ? 'text-ink-600' : 'text-ink-400'">${esc(s)}</span>
        </div>
        ${last ? '' : `<span class="flex-1 h-0.5 mx-3 rounded transition-colors" :class="step>${n} ? 'bg-success-400' : 'bg-ink-200'"></span>`}
      </li>`
    })}
  </ol>`
}

function fieldBlock(label, control, hint) {
  return html`<div>
    <label class="label">${esc(label)}</label>
    ${control}
    ${hint ? `<p class="hint">${esc(hint)}</p>` : ''}
  </div>`
}

export function renderTemplateWizard(params = {}) {
  const editing = !!params.id
  const t = editing ? getTemplate(params.id) : null
  const c = t ? (CATEGORIES.find((x) => x.id === t.categoryId) || CATEGORIES[0]) : null

  // Prefill values (escaped for safe insertion into Alpine x-data JSON string).
  const init = {
    name: t ? t.name : '',
    code: t ? t.code : '',
    categoryId: t ? t.categoryId : '',
    subcategory: t ? t.subcategory || '' : '',
    type: t ? t.type : '',
    description: t ? t.description || '' : '',
    purpose: t ? t.purpose || '' : '',
    priority: t ? t.priority : 'recommended',
    ownerTeam: t ? t.governance?.ownerTeam || '' : '',
    carePlanDomain: t ? t.carePlanDomain || '' : '',
    riskLink: t ? t.riskLink || '' : '',
    qualityStatement: t ? t.qualityStatement || '' : '',
    frequency: t ? t.frequency || '' : '',
    duration: t ? t.duration || '' : '',
    completionRule: t ? t.completionRule || 'recommended' : 'recommended',
    version: t ? t.governance?.version || 'v1.0' : 'v1.0',
  }
  const initJson = esc(JSON.stringify(init))

  const TYPE_OPTIONS = Object.entries(TEMPLATE_TYPES).map(([value, v]) => ({ value, label: v.label }))
  const PRIORITY_OPTIONS = Object.entries(PRIORITIES).map(([value, v]) => ({ value, label: v.label }))
  const CATEGORY_OPTIONS = CATEGORIES.map((cat) => ({ value: cat.id, label: cat.name }))

  /* ---------------------------------------------------------------- Step 1 */
  const step1 = html`
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      ${fieldBlock('Template name', `<input type="text" class="field field-md" x-model="form.name" placeholder="e.g. Morning personal care & dignity support"/>`)}
      ${fieldBlock('Template code', `<input type="text" class="field field-md font-mono" x-model="form.code" placeholder="e.g. PC-MORN-01"/>`, 'Short unique reference used in reports and audit.')}
      ${fieldBlock('Category', select('form.categoryId', CATEGORY_OPTIONS, { placeholder: 'Select a care category…' }))}
      ${fieldBlock('Sub-category', `<input type="text" class="field field-md" x-model="form.subcategory" placeholder="e.g. Washing & dressing"/>`)}
      ${fieldBlock('Template type', select('form.type', TYPE_OPTIONS, { placeholder: 'Select how carers record this…' }), 'Controls the carer recording UI on the mobile app.')}
      ${fieldBlock('Default priority', select('form.priority', PRIORITY_OPTIONS))}
      <div class="md:col-span-2">${fieldBlock('Description', `<textarea rows="2" class="field px-3 py-2" x-model="form.description" placeholder="Plain-English summary of the support this task covers."></textarea>`)}</div>
      <div class="md:col-span-2">${fieldBlock('Purpose — why this task matters', `<textarea rows="2" class="field px-3 py-2" x-model="form.purpose" placeholder="Outcome this supports, e.g. maintain skin integrity and dignity during morning routine."></textarea>`)}</div>
      ${fieldBlock('Owner team', `<input type="text" class="field field-md" x-model="form.ownerTeam" placeholder="e.g. Clinical Governance"/>`)}
    </div>`

  /* ---------------------------------------------------------------- Step 2 */
  const step2 = html`
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      ${fieldBlock('Care plan domain', `<input type="text" class="field field-md" x-model="form.carePlanDomain" placeholder="e.g. Personal care & continence"/>`)}
      ${fieldBlock('Outcome area', `<input type="text" class="field field-md" placeholder="e.g. Maintained independence & dignity"/>`)}
      ${fieldBlock('Risk assessment link', `<input type="text" class="field field-md" x-model="form.riskLink" placeholder="e.g. Moving & handling risk assessment"/>`, 'Links the task to the relevant risk assessment in the care record.')}
      ${fieldBlock('Related policy', `<input type="text" class="field field-md" placeholder="e.g. Dignity in Care policy DC-04"/>`)}
      <div class="md:col-span-2">
        <label class="label">CQC key questions</label>
        <div class="flex flex-wrap gap-2" x-data="{ cqc: [] }">
          ${map(CQC_KEY_QUESTIONS, (q) => html`
            <label class="cursor-pointer">
              <input type="checkbox" value="${esc(q)}" x-model="cqc" class="peer sr-only"/>
              <span class="badge bg-ink-50 text-ink-600 ring-ink-200 peer-checked:bg-primary-50 peer-checked:text-primary-700 peer-checked:ring-primary-200 transition-colors">${icon('shield', 'w-3 h-3')}${esc(q)}</span>
            </label>`)}
        </div>
        <p class="hint">Tag the CQC key questions this task provides evidence for.</p>
      </div>
      <div class="md:col-span-2">${fieldBlock('Quality statement', `<input type="text" class="field field-md" x-model="form.qualityStatement" placeholder="e.g. We treat people with dignity and respect (Caring)."/>`)}</div>
    </div>`

  /* ---------------------------------------------------------------- Step 3 */
  const step3 = html`
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="label">Default visits</label>
        <div class="grid grid-cols-2 gap-2" x-data="{ visits: [] }">
          ${map(VISIT_TIMES, (v) => html`
            <label class="flex items-center gap-2.5 p-2.5 rounded-lg ring-1 ring-ink-200 hover:bg-ink-50 cursor-pointer">
              <input type="checkbox" value="${esc(v)}" x-model="visits" class="w-4 h-4 rounded text-primary-600"/>
              <span class="text-sm text-ink-700">${esc(v)}</span>
            </label>`)}
        </div>
        <p class="hint">Visit slots this task is scheduled into by default.</p>
      </div>
      <div class="space-y-5">
        ${fieldBlock('Frequency', `<input type="text" class="field field-md" x-model="form.frequency" placeholder="e.g. Every visit / Daily / Twice weekly"/>`)}
        ${fieldBlock('Suggested duration', `<div class="relative"><input type="number" min="0" class="field field-md pr-12" x-model="form.duration" placeholder="e.g. 15"/><span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">min</span></div>`)}
        <div class="grid grid-cols-2 gap-3">
          ${fieldBlock('Start rule', `<input type="text" class="field field-md" placeholder="e.g. From care start date"/>`)}
          ${fieldBlock('End rule', `<input type="text" class="field field-md" placeholder="e.g. Until review / ongoing"/>`)}
        </div>
      </div>
    </div>
    <div class="mt-6 rounded-xl ring-1 ring-ink-200 divide-y divide-ink-100 px-4">
      ${toggleRow('Temporary task', false, { desc: 'Time-limited task that ends on a set date.' })}
      ${toggleRow('Review date required', true, { desc: 'A review date must be set when applied to a service user.' })}
      ${toggleRow('Can appear multiple times per visit', false, { desc: 'Allow this task to be added more than once in a single visit.' })}
    </div>`

  /* ---------------------------------------------------------------- Step 4 */
  const i = t ? t.instructions || {} : {}
  const step4 = html`
    <div class="grid grid-cols-1 gap-5">
      ${fieldBlock('Short instruction', `<input type="text" class="field field-md" value="${esc(i.short || '')}" placeholder="One line shown on the carer checklist, e.g. Support with wash, dress and oral care."/>`, 'Keep concise — this is the headline carers see first.')}
      ${fieldBlock('Detailed instruction', `<textarea rows="3" class="field px-3 py-2" placeholder="Step-by-step guidance, equipment, products and any agreed approach.">${esc(i.detailed || '')}</textarea>`)}
      ${fieldBlock('Do / do not', `<textarea rows="3" class="field px-3 py-2" placeholder="One item per line, e.g.\nDo offer choice of clothing\nDo not rush — allow the person to do what they can"></textarea>`)}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        ${fieldBlock('Communication & cultural preference', `<textarea rows="2" class="field px-3 py-2" placeholder="e.g. Prefers female carer; speak slowly; observes daily prayer at 07:00."></textarea>`)}
        ${fieldBlock('Dignity & privacy', `<textarea rows="2" class="field px-3 py-2" placeholder="e.g. Keep covered where possible; close curtains; explain each step.">${esc(i.dignity || '')}</textarea>`)}
      </div>
      ${fieldBlock('Escalation instruction', `<textarea rows="2" class="field px-3 py-2" placeholder="e.g. If skin is broken or red, do not proceed — photograph, record and call the office immediately.">${esc(i.escalation || '')}</textarea>`)}
    </div>`

  /* ---------------------------------------------------------------- Step 5 */
  const fieldTypeOptions = ['boolean', 'select', 'multiselect', 'number', 'text', 'textarea', 'datetime', 'signature', 'bodymap', 'photo', 'score', 'checklist']
  const step5 = html`
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      ${sectionCard({ title: 'Add evidence field', icon: 'plus', body: html`
        <div class="space-y-4">
          ${fieldBlock('Field label', `<input type="text" class="field field-md" placeholder="e.g. Amount taken"/>`)}
          ${fieldBlock('Field type', `<select class="field field-md">${fieldTypeOptions.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`, 'Field types map to the carer recording UI on the mobile app.')}
          <div class="rounded-xl ring-1 ring-ink-200 px-4">
            ${toggleRow('Required field', true, { desc: 'Carer must complete this before saving the record.' })}
          </div>
          <button type="button" class="btn btn-secondary btn-md w-full" onclick="window.__notify('Field builder is a preview in this demo','info')">${icon('plus', 'w-4 h-4')}Add field</button>
        </div>` })}
      ${sectionCard({ title: 'Live carer form preview', icon: 'mobile', actions: badge(`${SCHEMAS.completionNote.fields.length} fields`, 'bg-ink-100 text-ink-600 ring-ink-200'), body: html`
        <p class="text-xs text-ink-500 mb-3">Starting schema — “Completion + note”. Edit fields on the left to shape what carers capture.</p>
        ${evidenceSchemaPreview(SCHEMAS.completionNote)}` })}
    </div>`

  /* ---------------------------------------------------------------- Step 6 */
  const step6 = html`
    <div class="space-y-2.5" x-data="{ rule: form.completionRule }">
      ${map(COMPLETION_OPTIONS, (o) => html`
        <label class="flex items-start gap-3 p-3.5 rounded-xl ring-1 cursor-pointer transition-colors"
          :class="rule==='${o.id}' ? 'ring-primary-400 bg-primary-50/50' : 'ring-ink-200 hover:bg-ink-50'">
          <input type="radio" name="completionRule" value="${o.id}" x-model="rule" class="mt-0.5 w-4 h-4 text-primary-600"/>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-ink-800">${esc(o.label)}</span>
            <span class="block text-xs text-ink-500">${esc(o.desc)}</span>
          </span>
        </label>`)}
    </div>`

  /* ---------------------------------------------------------------- Step 7 */
  const SEV_OPTIONS = Object.entries(SEVERITY).map(([value, v]) => ({ value, label: v.label }))
  const step7 = html`
    <p class="text-sm text-ink-500 mb-4">Choose which conditions raise an alert, and set the severity each is routed at.</p>
    <div class="space-y-2.5">
      ${map(ALERT_TYPES, (a) => html`
        <div class="flex items-center gap-3 p-3 rounded-xl ring-1 ring-ink-200 hover:bg-ink-50/60" x-data="{ on: false, sev: '${a.sev}' }">
          <label class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
            <input type="checkbox" x-model="on" class="w-4 h-4 rounded text-primary-600 shrink-0"/>
            <span class="min-w-0">
              <span class="block text-sm font-medium text-ink-800">${esc(a.label)}</span>
              <span class="block text-xs text-ink-500">${esc(a.desc)}</span>
            </span>
          </label>
          <select class="field field-md w-36 shrink-0" x-model="sev" :disabled="!on" :class="!on && 'opacity-50'">
            ${SEV_OPTIONS.map((s) => `<option value="${esc(s.value)}">${esc(s.label)}</option>`).join('')}
          </select>
        </div>`)}
    </div>`

  /* ---------------------------------------------------------------- Step 8 */
  const vis = t ? t.visibility || {} : {}
  const step8 = html`
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      ${sectionCard({ title: 'Visibility', icon: 'eye', body: html`
        <div class="divide-y divide-ink-100">
          ${map(VISIBILITY_ROWS, (r) => toggleRow(r.label, t ? !!vis[r.key] : r.on, { desc: r.desc }))}
        </div>` })}
      ${sectionCard({ title: 'Governance', icon: 'shield', body: html`
        <div class="space-y-5">
          ${fieldBlock('Version number', `<input type="text" class="field field-md font-mono" x-model="form.version" placeholder="v1.0"/>`)}
          ${fieldBlock('Change reason', `<textarea rows="2" class="field px-3 py-2" placeholder="e.g. New template aligned to updated dignity policy DC-04."></textarea>`)}
          ${fieldBlock('Approval workflow', `<input type="text" class="field field-md" value="Clinical Governance → Registered Manager" readonly/>`, 'Submitting sends this template to the approval queue for sign-off before it can be published.')}
        </div>` })}
    </div>`

  /* ---------------------------------------------------------------- Step 9 */
  const step9 = html`
    <div class="space-y-6">
      ${sectionCard({ title: 'Review template', icon: 'file-check', body: html`
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <div><dt class="section-title">Name</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="form.name || '—'"></dd></div>
          <div><dt class="section-title">Code</dt><dd class="text-sm text-ink-800 mt-0.5 font-mono" x-text="form.code || '—'"></dd></div>
          <div><dt class="section-title">Category</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="categoryLabel(form.categoryId) || '—'"></dd></div>
          <div><dt class="section-title">Sub-category</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="form.subcategory || '—'"></dd></div>
          <div><dt class="section-title">Type</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="typeLabel(form.type) || '—'"></dd></div>
          <div><dt class="section-title">Priority</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="priorityLabel(form.priority) || '—'"></dd></div>
          <div><dt class="section-title">Care plan domain</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="form.carePlanDomain || '—'"></dd></div>
          <div><dt class="section-title">Risk link</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="form.riskLink || '—'"></dd></div>
          <div><dt class="section-title">Frequency</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="form.frequency || '—'"></dd></div>
          <div><dt class="section-title">Duration</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="form.duration ? form.duration + ' min' : '—'"></dd></div>
          <div><dt class="section-title">Completion rule</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="completionLabel(form.completionRule) || '—'"></dd></div>
          <div><dt class="section-title">Owner team</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="form.ownerTeam || '—'"></dd></div>
          <div class="sm:col-span-2"><dt class="section-title">Purpose</dt><dd class="text-sm text-ink-800 mt-0.5" x-text="form.purpose || form.description || '—'"></dd></div>
        </dl>` })}
      ${sectionCard({ title: 'Governance summary', icon: 'shield', body: defList([
        { label: 'Version', value: `<span x-text="form.version"></span>` },
        { label: 'Status on submit', value: badge('Pending approval', 'bg-warning-50 text-warning-700 ring-warning-100') },
        { label: 'Approval workflow', value: 'Clinical Governance → Registered Manager', full: true },
      ]) })}
      <div class="rounded-xl bg-primary-50/60 ring-1 ring-primary-100 p-4 flex items-start gap-3">
        <span class="text-primary-600 mt-0.5">${icon('info', 'w-5 h-5')}</span>
        <p class="text-sm text-ink-600">Submitting sends this template to the approval queue. It will not be applied to any service users until a Registered Manager approves and publishes it.</p>
      </div>
    </div>`

  const steps = [step1, step2, step3, step4, step5, step6, step7, step8, step9]
  const last = steps.length

  const submitOnclick = `window.__notify('Template submitted for approval','success'); location.hash='#/templates'`

  return page(html`
    <div x-data='{
      step: 1,
      total: ${last},
      form: ${initJson},
      categoryLabel(id) { const m = ${esc(JSON.stringify(Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]))))}; return m[id] || "" },
      typeLabel(id) { const m = ${esc(JSON.stringify(Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]))))}; return m[id] || "" },
      priorityLabel(id) { const m = ${esc(JSON.stringify(Object.fromEntries(PRIORITY_OPTIONS.map((o) => [o.value, o.label]))))}; return m[id] || "" },
      completionLabel(id) { const m = ${esc(JSON.stringify(Object.fromEntries(COMPLETION_OPTIONS.map((o) => [o.id, o.label]))))}; return m[id] || "" }
    }'>
      ${pageHeader({
        breadcrumbs: [{ label: 'Library', href: '#/templates' }, { label: editing ? `Edit · ${c ? c.name : ''}` : 'New template' }],
        title: editing ? `Edit ${t ? t.name : 'template'}` : 'Create master template',
        subtitle: 'Define a reusable care task template — instructions, evidence, alerts and governance — before it is applied to service users.',
      })}

      <div class="card p-5 mb-6 hidden sm:block">${reactiveStepper(STEP_LABELS)}</div>
      <div class="card p-5 mb-6 lg:hidden">
        <p class="text-sm font-semibold text-ink-800"><span x-text="step"></span>. <span x-text="${esc(JSON.stringify(STEP_LABELS))}[step-1]"></span></p>
        <p class="text-xs text-ink-500 mt-0.5">Step <span x-text="step"></span> of <span x-text="total"></span></p>
      </div>

      <div class="card p-6">
        ${map(steps, (content, idx) => html`<div x-show="step===${idx + 1}" x-cloak class="animate-fade-in">
          <h2 class="text-base font-semibold text-ink-900 mb-1">${esc(STEP_LABELS[idx])}</h2>
          <p class="text-sm text-ink-500 mb-5">Step ${idx + 1} of ${last}</p>
          ${content}
        </div>`)}

        <div class="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-ink-100">
          <button class="btn btn-secondary btn-md" x-show="step>1" @click="step--; window.scrollTo({top:0})">${icon('arrow-left', 'w-4 h-4')}Back</button>
          <span x-show="step===1"></span>
          <div class="flex items-center gap-2 ml-auto">
            <button class="btn btn-ghost btn-md" onclick="${submitOnclick.replace(/'/g, '&#39;')}" x-show="step<total">Save draft</button>
            <button class="btn btn-primary btn-md" x-show="step<total" @click="step++; window.scrollTo({top:0})">Next${icon('arrow-right', 'w-4 h-4')}</button>
            <button class="btn btn-primary btn-md" x-show="step===total" x-cloak onclick="${submitOnclick.replace(/'/g, '&#39;')}">${icon('check', 'w-4 h-4')}Submit for approval</button>
          </div>
        </div>
      </div>
    </div>
  `)
}
