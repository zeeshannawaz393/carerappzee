/** P5 — access & sharing: emergency break-glass (§50) and lawful-basis sharing (§53). */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { PARAMS } from '../data/carer.js'
import { getServiceUser } from '../data/index.js'

const BREAKGLASS_H = PARAMS.BREAKGLASS ?? 2

/* --------------------------------------------- Break-glass emergency access (§50) */
export function renderBreakGlass() {
  const su = getServiceUser('su-mary')
  const contacts = [
    { name: su.keyContact || 'Susan Adams (daughter)', tel: '07700 900112', role: 'Next of kin' },
    { name: su.gp || 'Riverside Medical Practice', tel: '01632 960221', role: 'GP surgery' },
  ]
  const inner = html`
    ${flowHeader({ title: 'Emergency access', subtitle: 'Break-glass', back: '#/carer' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ reason:'', granted:false }">

      <!-- BEFORE access: red warning + reason + gated search -->
      <div x-show="!granted">
        <div class="rounded-xl bg-danger-50 ring-1 ring-danger-100 p-4">
          <p class="text-xs font-semibold text-danger-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">${icon('alert', 'w-4 h-4')}Break-glass access</p>
          <p class="text-[13px] text-danger-800">Use only in a genuine emergency where you need a person's critical information and normal access is not available. Every break-glass access is <b>fully audited</b> and <b>time-boxed to ${BREAKGLASS_H} hours</b>, after which it ends automatically.</p>
        </div>

        <div class="card p-4 mt-4">
          <label class="label" for="bg-reason">Reason for emergency access</label>
          <textarea id="bg-reason" x-model="reason" rows="3" class="field field-md" placeholder="e.g. Client found collapsed — need allergies and emergency contacts"></textarea>
          <p class="text-[11px] text-ink-400 mt-1">Required. This reason is recorded against the audit trail.</p>
        </div>

        <div class="card p-4 mt-4">
          <label class="label" for="bg-search">Search person</label>
          <input id="bg-search" type="text" class="field field-md" placeholder="Enter a name to search" :disabled="!reason.trim()" />
          <p class="text-[12px] text-ink-500 mt-2 flex items-start gap-1.5">${icon('info', 'w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-400')}Enter a name to search — results appear after a reason is recorded. The full client list is never shown here.</p>
        </div>

        <button
          @click="if(reason.trim()){ granted=true; window.__notify('Break-glass access granted — audited, expires in 2h','warning') }"
          :disabled="!reason.trim()"
          :class="reason.trim() ? '' : 'opacity-50 pointer-events-none'"
          class="btn btn-danger btn-md w-full mt-4">${icon('shield', 'w-4 h-4')}Grant emergency access</button>
      </div>

      <!-- AFTER granted: minimal emergency profile only -->
      <div x-show="granted" x-cloak>
        <div class="rounded-xl bg-warning-50 ring-1 ring-warning-100 p-3 text-[13px] text-warning-800 flex items-start gap-2">${icon('clock', 'w-4 h-4 mt-0.5 shrink-0')}<span>Emergency access active — <b>audited</b> and expires in ${BREAKGLASS_H} hours. This is the <b>minimal emergency profile</b> only, not the full record.</span></div>

        <div class="card p-4 mt-4">
          <div class="flex items-center gap-3">
            <span class="w-11 h-11 rounded-xl bg-danger-50 text-danger-600 grid place-items-center font-semibold">${esc(su.initials)}</span>
            <div class="min-w-0"><p class="text-base font-bold text-ink-900">${esc(su.name)}</p><p class="text-xs text-ink-400">DOB ${esc(su.dob)} · age ${esc(String(su.age))}</p></div>
          </div>
        </div>

        <div class="card p-4 mt-4">
          <p class="text-xs font-semibold text-danger-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}Critical allergies</p>
          ${(su.allergies || []).length
            ? `<div class="flex flex-wrap gap-1.5">${su.allergies.map((a) => `<span class="badge bg-danger-100 text-danger-800 ring-danger-200">${esc(a)}</span>`).join('')}</div>`
            : '<p class="text-[13px] text-ink-500">None recorded.</p>'}
        </div>

        <div class="card p-4 mt-4">
          <p class="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">${icon('heart', 'w-3.5 h-3.5')}Resuscitation status</p>
          <div class="rounded-lg bg-info-50 ring-1 ring-info-100 p-2.5"><p class="text-[13px] font-semibold text-info-800">ReSPECT in place</p><p class="text-[12px] text-info-700 mt-0.5">DNACPR / ReSPECT documented — check the physical form on scene.</p></div>
        </div>

        <div class="card p-4 mt-4">
          <p class="text-xs font-semibold text-warning-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Critical risks</p>
          <div class="flex flex-wrap gap-1.5">${(su.risks || []).map((r) => `<span class="badge bg-warning-50 text-warning-700 ring-warning-100">${icon('alert', 'w-3 h-3')}${esc(r)}</span>`).join('')}</div>
        </div>

        <div class="card p-4 mt-4">
          <p class="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">${icon('bell', 'w-3.5 h-3.5')}Emergency contacts</p>
          <div class="space-y-2">
            ${map(contacts, (c) => html`<div class="rounded-lg ring-1 ring-ink-200 p-3 flex items-center gap-3">
              <span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 grid place-items-center">${icon('users', 'w-4 h-4')}</span>
              <div class="flex-1 min-w-0"><p class="text-[13px] font-semibold text-ink-800">${esc(c.name)}</p><p class="text-[11px] text-ink-400">${esc(c.role)} · ${esc(c.tel)}</p></div>
              <button onclick="window.__notify('Calling ${esc(c.name)}…','info')" class="btn btn-primary btn-sm">${icon('bell', 'w-3.5 h-3.5')}Call</button>
            </div>`)}
          </div>
        </div>

        <button @click="granted=false; window.__notify('Emergency access ended','info')" class="btn btn-secondary btn-md w-full mt-4">${icon('x-circle', 'w-4 h-4')}End emergency access</button>
      </div>
    </div>`
  return mobileFlow(inner)
}

/* --------------------------------------------- Lawful-basis information sharing (§53) */
const PURPOSES = [
  { id: 'emergency', label: 'Medical emergency', icon: 'alert' },
  { id: 'safeguarding', label: 'Safeguarding concern', icon: 'shield' },
  { id: 'handover', label: 'Planned professional handover', icon: 'users' },
  { id: 'family', label: 'Family / representative request', icon: 'heart' },
  { id: 'hospital', label: 'Hospital transfer', icon: 'cross' },
]

const SHARE_MAP = {
  emergency: {
    label: 'Medical emergency',
    art6: 'Art 6(1)(d) — Vital interests',
    art9: 'Art 9(2)(c) — Vital interests (data subject physically incapable of consent)',
    confidentiality: 'Common-law duty of confidentiality overridden by vital interests in a life-threatening situation.',
    authority: 'Attending carer / clinician on scene',
    recipient: 'Emergency services / clinician',
    minimum: 'Name, allergies, meds, ReSPECT, contacts',
  },
  safeguarding: {
    label: 'Safeguarding concern',
    art6: 'Art 6(1)(c)/(e) — Legal obligation / Public task',
    art9: 'Art 9(2)(b) — Safeguarding of children & individuals at risk',
    confidentiality: 'Disclosure in the public interest to protect an adult at risk of harm.',
    authority: 'Safeguarding lead / registered manager',
    recipient: 'Safeguarding lead / Local Authority',
    minimum: 'Name, DOB, nature of concern, relevant risks',
  },
  handover: {
    label: 'Planned professional handover',
    art6: 'Art 6(1)(e) — Public task (provision of health & social care)',
    art9: 'Art 9(2)(h) — Provision of health or social care',
    confidentiality: 'Sharing within the direct care team on a need-to-know basis.',
    authority: 'Registered manager / care coordinator',
    recipient: 'Incoming care professional / provider',
    minimum: 'Care plan summary, current risks, meds, recent changes',
  },
  family: {
    label: 'Family / representative request',
    art6: 'Art 6(1)(a)/(e) — Consent / Public task',
    art9: 'Art 9(2)(a)/(h) — Explicit consent / Health & social care',
    confidentiality: 'Share only with the person’s consent, or a lawfully authorised representative (LPA / deputy).',
    authority: 'Data subject or authorised representative',
    recipient: 'Named family member / representative',
    minimum: 'Only information the person has consented to share',
  },
  hospital: {
    label: 'Hospital transfer',
    art6: 'Art 6(1)(e) — Public task (continuity of care)',
    art9: 'Art 9(2)(h) — Provision of health or social care',
    confidentiality: 'Direct-care sharing to ensure safe transfer and continuity of treatment.',
    authority: 'Registered manager / transferring clinician',
    recipient: 'Receiving hospital / admissions team',
    minimum: 'Name, NHS number, meds, allergies, ReSPECT, care needs',
  },
}

export function renderShare() {
  const rows = [
    ['Article 6 basis', 'art6'],
    ['Article 9 condition', 'art9'],
    ['Confidentiality justification', 'confidentiality'],
    ['Decision authority', 'authority'],
    ['Recipient', 'recipient'],
    ['Minimum-necessary data', 'minimum'],
  ]
  const rowsJson = esc(JSON.stringify(rows))
  const mapJson = esc(JSON.stringify(SHARE_MAP))

  const inner = html`
    ${flowHeader({ title: 'Share information', subtitle: 'Lawful basis', back: '#/carer' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ purpose:'', MAP:JSON.parse('${mapJson}'), ROWS:JSON.parse('${rowsJson}') }">

      <div class="rounded-xl bg-primary-50 ring-1 ring-primary-100 p-3.5 text-[13px] text-primary-800 flex items-start gap-2">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')}<span>Pick a <b>plain-language purpose</b> for the share. The system maps it to the correct legal basis for you — you are never asked to choose an Article yourself.</span></div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Why are you sharing?</p>
        <div class="space-y-2">
          ${map(PURPOSES, (p) => html`<button
            @click="purpose='${p.id}'"
            :class="purpose==='${p.id}' ? 'ring-2 ring-primary-500 bg-primary-50' : 'ring-1 ring-ink-200 bg-surface'"
            class="w-full text-left rounded-xl p-3.5 flex items-center gap-3 active:scale-[.99]">
            <span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon(p.icon, 'w-4.5 h-4.5')}</span>
            <span class="flex-1 text-sm font-semibold text-ink-900">${esc(p.label)}</span>
            <span x-show="purpose==='${p.id}'" x-cloak class="text-primary-600">${icon('check-circle', 'w-5 h-5')}</span>
          </button>`)}
        </div>
      </div>

      <!-- mapped legal basis -->
      <template x-if="purpose">
        <div>
          <div class="card p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-3 flex items-center gap-1.5">${icon('scale', 'w-3.5 h-3.5')}Mapped legal basis · <span x-text="MAP[purpose].label"></span></p>
            <dl class="space-y-2.5">
              <template x-for="r in ROWS" :key="r[1]">
                <div class="rounded-lg bg-ink-50 p-2.5">
                  <dt class="text-[11px] font-semibold text-ink-400 uppercase tracking-wide" x-text="r[0]"></dt>
                  <dd class="text-[13px] text-ink-800 mt-0.5" x-text="MAP[purpose][r[1]]"></dd>
                </div>
              </template>
            </dl>
          </div>

          <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3.5 text-[13px] text-info-800 flex items-start gap-2 mt-4">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')}<span>In a genuine emergency the app does <b>not</b> block a proportionate share for lack of consent — it records a <b>vital-interests</b> basis instead.</span></div>

          <button onclick="window.__notify('Information shared — lawful basis recorded &amp; audited','success')" class="btn btn-primary btn-md w-full mt-4">${icon('link', 'w-4 h-4')}Share (audited)</button>
        </div>
      </template>
    </div>`
  return mobileFlow(inner)
}
