/** CLIENTS — the carer's caseload directory + a baseline client profile. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileApp, mobileHeader, mobileFlow, flowHeader, keySafe } from './frame.js'
import { emptyMobile } from './states.js'
import { ROTA, leadCarerFor, continuityFor } from '../data/carer.js'
import { SERVICE_USERS, getServiceUser } from '../data/index.js'
import { buildVisit, visitProgressFor } from '../screens/carer.js'

/** Clients the carer supports (today's round first, then the rest of the caseload). */
function caseload() {
  const todayIds = [...new Set(ROTA.map((r) => r.suId))]
  const ordered = [...todayIds, ...SERVICE_USERS.map((s) => s.id).filter((id) => !todayIds.includes(id))]
  return ordered.map(getServiceUser).filter(Boolean)
}

function tone(color) {
  return { warning: 'bg-warning-100 text-warning-700', teal: 'bg-teal-100 text-teal-700', danger: 'bg-danger-100 text-danger-700', primary: 'bg-primary-100 text-primary-700' }[color] || 'bg-primary-100 text-primary-700'
}

export function renderClients() {
  const people = caseload()
  const inner = html`
    ${mobileHeader({ title: 'Clients', subtitle: `${people.length} people on your round` })}
    <div class="p-4" x-data="{ q:'' }">
      <div class="relative mb-4">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">${icon('search', 'w-4 h-4')}</span>
        <input x-model="q" placeholder="Search clients…" class="field field-md pl-9" />
      </div>
      <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
        ${map(people, (s) => html`
          <a href="#/carer/clients/${s.id}" data-name="${esc(s.name.toLowerCase())}" x-show="q==='' || $el.dataset.name.includes(q.toLowerCase())" class="block p-4 active:bg-ink-50">
            <div class="flex items-center gap-3">
              <span class="w-11 h-11 rounded-full grid place-items-center font-semibold text-sm ${tone(s.color)}">${esc(s.initials)}</span>
              <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900 truncate">${esc(s.name)}</p><p class="text-xs text-ink-500 truncate">${s.age} yrs · ${esc(s.package)}</p></div>
              ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
            </div>
            ${((s.allergies || []).length || (s.risks || []).length) ? html`<div class="flex flex-wrap gap-1.5 mt-2.5">
              ${(s.allergies || []).length ? `<span class="badge bg-danger-50 text-danger-700 ring-danger-100">${icon('alert', 'w-3 h-3')}${esc((s.allergies || []).join(', '))}</span>` : ''}
              ${(s.risks || []).slice(0, 2).map((r) => `<span class="badge bg-warning-50 text-warning-700 ring-warning-100">${esc(r)}</span>`).join('')}
            </div>` : ''}
          </a>`)}
      </div>
    </div>`
  return mobileApp(inner, { tab: 'clients', badges: { inbox: 2 } })
}

export function renderClientProfile({ id }) {
  const s = getServiceUser(id)
  if (!s) return mobileFlow(html`${flowHeader({ title: 'Client', back: '#/carer/clients' })}${emptyMobile({ title: 'Client not found' })}`)
  const todays = ROTA.filter((r) => r.suId === id).map((r) => {
    const v = buildVisit(r.id)
    return { rota: r, prog: visitProgressFor(v) }
  })

  // Safety-at-a-glance derivations — mirror the visit workspace so a carer
  // reviewing a client between visits gets the same top-tier safety picture.
  const flags = s.flags || []
  const resus = s.resus
  const resusView = !resus
    ? { tone: 'warning', label: 'Resuscitation not recorded — check ReSPECT' }
    : /dnacpr|dnar|not for/i.test(resus) ? { tone: 'danger', label: resus } : { tone: 'ok', label: resus }
  const chipTone = { danger: 'bg-danger-50 text-danger-700 ring-danger-100', warning: 'bg-warning-50 text-warning-700 ring-warning-100', ok: 'bg-success-50 text-success-700 ring-success-100' }
  const careRows = s.careNeeds || []
  const allergyOk = s.allergyStatus === 'confirmed'

  // Neutral (monochrome) list rows — colour reserved for the safety block.
  const link = (ic, label, href, note) => `<a href="${href}" class="block p-4 flex items-center gap-3 active:bg-ink-50"><span class="w-9 h-9 rounded-xl bg-ink-100 text-ink-600 grid place-items-center shrink-0">${icon(ic, 'w-4.5 h-4.5')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${label}</p>${note ? `<p class="text-xs text-ink-500">${note}</p>` : ''}</div>${icon('chevron-right', 'w-4 h-4 text-ink-300')}</a>`
  const group = (title, rows) => `<div><p class="section-title mb-2">${title}</p><div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">${rows.join('')}</div></div>`
  const contactRow = (ic, label, value) => `<div class="p-4 flex items-center gap-3"><span class="w-9 h-9 rounded-xl bg-ink-100 text-ink-600 grid place-items-center shrink-0">${icon(ic, 'w-4.5 h-4.5')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${label}</p><p class="text-xs text-ink-500 truncate">${esc(value || '—')}</p></div>${label === 'Emergency contact' ? `<button onclick="window.__notify('Calling…','info')" class="btn btn-secondary btn-sm">Call</button>` : ''}</div>`

  const inner = html`
    ${flowHeader({ title: s.name, subtitle: `${s.age} yrs · NHS ${esc(s.nhs)}`, back: '#/carer/clients' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">

      <!-- allergies + status -->
      ${(s.allergies || []).length
        ? `<div class="rounded-2xl bg-danger-50 ring-1 ring-danger-100 p-4"><p class="text-xs font-semibold text-danger-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}Allergies${allergyOk ? '' : ' · not confirmed'}</p><div class="flex flex-wrap gap-1.5">${s.allergies.map((a) => `<span class="badge bg-danger-100 text-danger-800 ring-danger-200">${esc(a)}</span>`).join('')}</div></div>`
        : `<div class="rounded-2xl ${allergyOk ? 'bg-success-50 ring-success-100 text-success-800' : 'bg-warning-50 ring-warning-100 text-warning-800'} ring-1 p-4 flex items-center gap-2 text-sm font-semibold">${icon(allergyOk ? 'check-circle' : 'alert', 'w-4 h-4')}${allergyOk ? 'No known allergies (confirmed)' : 'Allergy status not confirmed — verify before care'}</div>`}

      <!-- safety at a glance: resuscitation status + clinical flags -->
      <div class="card p-4">
        <p class="section-title mb-2.5 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Safety at a glance</p>
        <span class="inline-flex items-center gap-1.5 rounded-lg ${chipTone[resusView.tone]} ring-1 px-2.5 py-1 text-xs font-semibold">${icon('heart', 'w-3.5 h-3.5')}${esc(resusView.label)}</span>
        ${flags.length ? `<div class="flex flex-wrap gap-1.5 mt-2.5">${flags.map((f) => `<span class="badge bg-ink-100 text-ink-700 ring-ink-200">${esc(f)}</span>`).join('')}</div>` : ''}
      </div>

      <!-- today's visits -->
      ${todays.length ? `<div><p class="section-title mb-2">Today’s visits</p><div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">${todays.map((t) => `<a href="#/carer/visit/${t.rota.id}" class="block p-4 flex items-center gap-3 active:bg-ink-50"><span class="w-9 h-9 rounded-xl bg-ink-100 text-ink-600 grid place-items-center shrink-0">${icon('clock', 'w-4 h-4')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(t.rota.visit)} visit</p><p class="text-xs text-ink-500">${esc(t.rota.time)}</p></div><span class="text-xs font-medium text-ink-500 tabular-nums">${t.prog.done}/${t.prog.total}</span></a>`).join('')}</div></div>` : ''}

      <!-- care plan essentials (clinical detail behind the flags) -->
      ${careRows.length ? `<div class="card p-4"><p class="section-title mb-3 flex items-center gap-1.5">${icon('file-check', 'w-3.5 h-3.5')}Care plan essentials</p><div class="space-y-3.5">${careRows.map((r) => `<div class="flex gap-3"><span class="w-8 h-8 rounded-lg bg-ink-100 text-ink-600 grid place-items-center shrink-0">${icon(r.icon || 'file-check', 'w-4 h-4')}</span><div class="min-w-0 flex-1"><p class="text-sm font-semibold text-ink-900">${esc(r.label)}</p>${(r.lines || []).map((l, i) => `<p class="text-xs ${i === r.lines.length - 1 && r.lines.length > 1 ? 'text-ink-500 mt-1' : 'text-ink-600 mt-0.5'}">${esc(l)}</p>`).join('')}</div></div>`).join('')}</div></div>` : ''}

      <!-- communication & sensory (AIS) -->
      ${s.commsNeeds ? html`<div class="card p-4"><p class="section-title mb-1.5 flex items-center gap-1.5">${icon('info', 'w-3.5 h-3.5')}Communication & sensory (AIS)</p><div class="flex flex-wrap gap-1.5">${[s.commsNeeds.hearing && s.commsNeeds.hearing !== 'Good' ? 'Hearing: ' + s.commsNeeds.hearing : '', s.commsNeeds.vision && s.commsNeeds.vision !== 'Reading glasses' ? s.commsNeeds.vision : '', s.commsNeeds.easyRead ? 'Easy Read' : '', s.commsNeeds.largePrint ? 'Large print' : '', s.commsNeeds.bsl ? 'BSL' : ''].filter(Boolean).map((x) => `<span class="badge bg-info-50 text-info-600 ring-info-100">${esc(x)}</span>`).join('')}</div>${s.commsNeeds.aid ? `<p class="text-sm text-ink-600 mt-1.5">${esc(s.commsNeeds.aid)}</p>` : ''}</div>` : ''}

      <!-- lead carer / continuity -->
      <div class="card p-4 flex items-center gap-3"><span class="w-9 h-9 rounded-xl bg-ink-100 text-ink-600 grid place-items-center shrink-0">${icon('user-check', 'w-4.5 h-4.5')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Lead carer · ${esc(leadCarerFor(id))}</p><p class="text-xs text-ink-500">${continuityFor(id).regular ? 'Regular team' : 'Cover — reduced continuity'} · ${continuityFor(id).visits30d} visits/30d</p></div></div>

      <!-- care record (grouped, de-duplicated) -->
      ${group('Care & clinical', [
        link('file-check', 'Care plan', `#/carer/clients/${id}/careplan`, 'Goals, preferences, risks & how I like my care'),
        link('pill', 'Medications', `#/carer/clients/${id}/meds`, 'MAR & administration history'),
        link('footprints', 'Monitoring & repositioning', `#/carer/clients/${id}/monitoring`, 'Schedules & pressure-care chart'),
        link('chart', 'History & trends', `#/carer/clients/${id}/history`, 'Past visits & observation trends'),
      ])}
      ${group('Assessments & legal', [
        link('scale', 'Assessments & continuity', `#/carer/clients/${id}/assessments`, 'Waterlow/MUST, lead carer & continuity'),
        link('shield', 'Consent & capacity', `#/carer/clients/${id}/mca`, 'MCA, best interests & DoLS'),
      ])}
      ${group('Records & logistics', [
        link('file-check', 'Documents', `#/carer/clients/${id}/documents`, 'Offline set, ReSPECT & secure share'),
        link('archive', 'Equipment & consumables', `#/carer/clients/${id}/equipment`, 'Hoist, bed, LOLER & stock'),
        link('refresh', 'Medication orders', `#/carer/clients/${id}/orders`, 'Order lifecycle & reconciliation (§49)'),
        link('target', 'Reablement goals', `#/carer/clients/${id}/reablement`, 'Outcome goals & progress'),
      ])}

      <!-- about me -->
      <div class="card p-4"><p class="section-title mb-1">About me</p><p class="text-sm text-ink-700">${esc(s.aboutMe || '—')}</p></div>

      <!-- key-safe / access + address -->
      <div class="card p-4"><p class="section-title mb-1.5">Key-safe / access</p>${keySafe(s.keySafeCode)}<p class="text-sm text-ink-700 mt-1.5">${esc(s.access || '—')}</p>${s.address ? `<p class="text-xs text-ink-500 mt-1.5 flex items-center gap-1.5">${icon('map-pin', 'w-3.5 h-3.5')}${esc(s.address)}</p>` : ''}</div>

      <!-- contacts -->
      ${group('Contacts', [
        contactRow('bell', 'Emergency contact', s.emergencyContact || s.keyContact),
        s.keyContact ? contactRow('users', 'Key contact', s.keyContact) : '',
        s.gp ? contactRow('shield', 'GP', s.gp) : '',
      ].filter(Boolean))}

      <p class="text-xs text-ink-400 text-center pt-1">${esc(s.package || '')}${s.startedCare ? ' · since ' + esc(s.startedCare) : ''}</p>
    </div>`
  return mobileFlow(inner)
}
