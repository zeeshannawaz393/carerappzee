/** P2 — client care-context screens: care plan, medications, history, documents. */
import { html, esc, map } from '../lib/dom.js'
import { fmtDMY } from '../lib/dates.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { getServiceUser } from '../data/index.js'
import { carePlan, risksFor, medHistory, obsTrends, visitHistory, clientDocs, MED_SCHEDULE, capacityFor, documentSetFor, assessmentsFor, continuityFor, leadCarerFor } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'

const notFound = (back) => mobileFlow(html`${flowHeader({ title: 'Not found', back })}${emptyMobile({ title: 'Client not found' })}`)
const riskTone = (l) => l === 'High' ? 'bg-danger-50 text-danger-700 ring-danger-100' : l === 'Medium' ? 'bg-warning-50 text-warning-700 ring-warning-100' : 'bg-success-50 text-success-700 ring-success-100'

function sparkBars(rows, getVal, { max, target, tone = 'bg-primary-400' } = {}) {
  const m = max || Math.max(...rows.map(getVal), 1)
  return html`<div class="flex items-end gap-1.5" style="height:96px">
    ${rows.map((r) => { const v = getVal(r); const below = target && v < target; return `<div class="flex-1 flex flex-col items-center justify-end h-full"><span class="text-[10px] font-medium text-ink-500 mb-0.5">${v}</span><div class="w-full rounded-t ${below ? 'bg-warning-400' : tone}" style="height:${Math.max(6, (v / m) * 72)}px"></div><span class="text-[10px] text-ink-400 mt-1">${esc(r.d)}</span></div>` }).join('')}
  </div>`
}

/* -------------------------------------------------------------- Care plan */
export function renderCarePlan({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound(`#/carer/clients`)
  const plan = carePlan(id)
  const risks = risksFor(id)

  const acked = carerStore.planAcked(id, plan.version)
  const inner = html`
    ${flowHeader({ title: 'Care plan', subtitle: `${esc(su.name)} · ${plan.version} · review ${esc(fmtDMY(plan.review))}`, back: `#/carer/clients/${id}` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      ${plan.changedSince && !acked ? html`<div class="rounded-xl bg-warning-50 ring-1 ring-warning-100 p-4">
        <p class="text-xs font-semibold text-warning-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}Plan changed since your last visit (${esc(plan.version)})</p>
        <p class="text-sm text-warning-800">${esc(plan.changedSince)}</p>
        <button onclick="window.__ackPlan('${id}','${esc(plan.version)}')" class="btn btn-primary btn-sm mt-2">${icon('check', 'w-3.5 h-3.5')}Acknowledge current version</button>
      </div>` : ''}
      ${acked ? `<div class="rounded-xl bg-success-50 ring-1 ring-success-100 p-2.5 text-xs text-success-700 flex items-center gap-1.5">${icon('check-circle', 'w-3.5 h-3.5')}You acknowledged ${esc(plan.version)}.</div>` : ''}
      <a href="#/carer/clients/${id}/mca" class="card p-4 flex items-center gap-3 active:bg-ink-50"><span class="w-9 h-9 rounded-xl bg-ink-100 text-ink-600 grid place-items-center">${icon('scale', 'w-4.5 h-4.5')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Consent & mental capacity</p><p class="text-xs text-ink-500">Decision-specific capacity & LPA</p></div>${icon('chevron-right', 'w-4 h-4 text-ink-300')}</a>
      <div class="rounded-xl bg-teal-50 ring-1 ring-teal-100 p-3 text-sm text-teal-800 flex items-center gap-2">${icon('info', 'w-4 h-4')}Read-only. Something not right? Flag an issue to the office.</div>

      ${map(plan.sections, (s) => html`
        <div class="card p-4">
          <div class="flex items-center gap-2.5 mb-2"><span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 grid place-items-center">${icon(s.icon, 'w-4.5 h-4.5')}</span><p class="text-sm font-semibold text-ink-900">${esc(s.domain)}</p></div>
          <p class="text-sm text-ink-700"><span class="font-medium text-ink-500">Goal:</span> ${esc(s.goal)}</p>
          <div class="mt-2 rounded-lg bg-ink-50 p-2.5"><p class="section-title mb-0.5">How I like my care</p><p class="text-sm text-ink-700">${esc(s.how)}</p></div>
          <ul class="mt-2 space-y-1">${map(s.actions, (a) => `<li class="flex items-start gap-2 text-sm text-ink-700">${icon('check', 'w-3.5 h-3.5 text-success-600 mt-0.5 shrink-0')}${esc(a)}</li>`)}</ul>
          ${s.risks.length ? `<div class="flex flex-wrap gap-1.5 mt-2">${s.risks.map((r) => `<span class="badge bg-warning-50 text-warning-700 ring-warning-100">${icon('alert', 'w-3 h-3')}${esc(r)}</span>`).join('')}</div>` : ''}
        </div>`)}

      <div class="card p-4">
        <p class="text-sm font-semibold text-ink-900 flex items-center gap-2 mb-2.5">${icon('shield', 'w-4 h-4 text-ink-400')}Risk assessments</p>
        <div class="space-y-2">
          ${map(risks, (r) => html`<div class="rounded-lg ring-1 ring-ink-200 p-3">
            <div class="flex items-center justify-between"><p class="text-sm font-semibold text-ink-900">${esc(r.name)}</p><span class="badge ${riskTone(r.level)}">${esc(r.level)}</span></div>
            <div class="flex flex-wrap gap-1.5 mt-2">${r.controls.map((c) => `<span class="badge bg-ink-50 text-ink-600 ring-ink-200">${esc(c)}</span>`).join('')}</div>
            <p class="text-xs text-ink-500 mt-1.5">Review ${esc(fmtDMY(r.review))}</p>
          </div>`)}
        </div>
      </div>

      <button onclick="window.__notify('Care-plan issue flagged to the office','warning')" class="btn btn-secondary btn-md w-full">${icon('flag', 'w-4 h-4')}Flag an issue with this plan</button>
    </div>`
  return mobileFlow(inner)
}

/* ----------------------------------------------------------- Medications */
export function renderMedProfile({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound(`#/carer/clients`)
  const meds = MED_SCHEDULE[id] || []
  const hist = medHistory(id)
  const given = hist.filter((h) => h.outcome === 'Given').length
  const compliance = hist.length ? Math.round((given / hist.length) * 100) : 100

  const medRow = (m) => html`<div class="p-4 flex items-center gap-3">
    <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0 ${m.controlled ? 'bg-warning-100 text-warning-700' : m.relatedAllergy && (su.allergies || []).includes(m.relatedAllergy) ? 'bg-danger-100 text-danger-700' : 'bg-danger-50 text-danger-600'}">${icon('pill', 'w-4.5 h-4.5')}</span>
    <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(m.name)}</p><p class="text-xs text-ink-500">${esc(m.dose)} · ${esc(m.route)} · ${esc(m.due)}</p></div>
    <div class="flex flex-col items-end gap-1">${m.controlled ? '<span class="badge bg-warning-50 text-warning-700 ring-warning-100">CD</span>' : ''}${m.covert ? '<span class="badge bg-ink-100 text-ink-600 ring-ink-200">Covert</span>' : ''}${m.relatedAllergy && (su.allergies || []).includes(m.relatedAllergy) ? '<span class="badge bg-danger-50 text-danger-700 ring-danger-100">Allergy</span>' : ''}</div>
  </div>`

  const inner = html`
    ${flowHeader({ title: 'Medications', subtitle: esc(su.name), back: `#/carer/clients/${id}` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      ${(su.allergies || []).length ? `<div class="rounded-xl bg-danger-50 ring-1 ring-danger-100 p-3"><p class="text-xs font-semibold text-danger-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}Allergies</p><div class="flex flex-wrap gap-1.5">${su.allergies.map((a) => `<span class="badge bg-danger-100 text-danger-800 ring-danger-200">${esc(a)}</span>`).join('')}</div></div>` : ''}

      <div class="grid grid-cols-3 gap-2.5">
        <div class="card p-3 text-center"><p class="text-xl font-bold text-ink-900">${meds.length}</p><p class="text-xs text-ink-500">Medicines</p></div>
        <div class="card p-3 text-center"><p class="text-xl font-bold text-ink-900">${meds.filter((m) => m.group === 'PRN').length}</p><p class="text-xs text-ink-500">PRN</p></div>
        <div class="card p-3 text-center"><p class="text-xl font-bold ${compliance >= 90 ? 'text-success-600' : 'text-warning-600'}">${compliance}%</p><p class="text-xs text-ink-500">7-day</p></div>
      </div>

      <div><p class="section-title mb-2">Current medicines</p><div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">${map(meds, medRow)}</div></div>

      <div>
        <p class="section-title mb-2">Administration history</p>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${hist.length ? map(hist, (h) => html`<div class="flex items-center gap-3 p-4">
            <span class="w-7 h-7 rounded-md grid place-items-center shrink-0 ${h.outcome === 'Given' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}">${icon(h.outcome === 'Given' ? 'check' : 'refuse', 'w-3.5 h-3.5')}</span>
            <div class="flex-1 min-w-0"><p class="text-sm font-medium text-ink-800 truncate">${esc(h.name)}</p><p class="text-xs text-ink-500">${esc(fmtDMY(h.date))} ${esc(h.time)} · ${esc(h.by)}</p></div>
            <span class="badge ${h.outcome === 'Given' ? 'bg-success-50 text-success-700 ring-success-100' : 'bg-danger-50 text-danger-700 ring-danger-100'}">${esc(h.outcome)}</span>
          </div>`) : '<p class="text-sm text-ink-500 text-center py-4">No history yet.</p>'}
        </div>
      </div>
    </div>`
  return mobileFlow(inner)
}

/* ------------------------------------------------------- History & trends */
export function renderHistory({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound(`#/carer/clients`)
  const t = obsTrends(id)
  const visits = visitHistory(id)

  const chart = (title, ic, body) => html`<div class="card p-4"><p class="text-sm font-semibold text-ink-900 flex items-center gap-1.5 mb-2">${icon(ic, 'w-4 h-4 text-ink-400')}${title}</p>${body}</div>`

  const inner = html`
    ${flowHeader({ title: 'History & trends', subtitle: esc(su.name), back: `#/carer/clients/${id}` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      ${t.bp ? chart('Blood pressure (systolic)', 'activity', sparkBars(t.bp, (r) => r.sys, { max: 200, tone: 'bg-primary-400' }) + `<p class="text-xs text-ink-500 mt-1">Latest ${t.bp[t.bp.length - 1].sys}/${t.bp[t.bp.length - 1].dia} mmHg</p>`) : ''}
      ${t.fluid ? chart('Fluid intake (ml)', 'droplet', sparkBars(t.fluid, (r) => r.ml, { max: 1800, target: 1500, tone: 'bg-info-400' }) + `<p class="text-xs text-ink-500 mt-1">Target 1500ml · amber = below</p>`) : ''}
      ${t.weight ? chart('Weight (kg)', 'scale', sparkBars(t.weight, (r) => r.kg, { max: 65, tone: 'bg-teal-400' })) : ''}
      ${t.mood ? chart('Mood (1–5)', 'smile', sparkBars(t.mood, (r) => r.s, { max: 5, tone: 'bg-warning-400' })) : ''}

      <div>
        <p class="section-title mb-2">Recent visits</p>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${visits.length ? map(visits, (v) => html`<div class="flex items-center gap-3 p-4">
            <span class="w-7 h-7 rounded-md grid place-items-center shrink-0 ${v.status === 'Completed' ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'}">${icon(v.status === 'Completed' ? 'check' : 'alert', 'w-3.5 h-3.5')}</span>
            <div class="flex-1 min-w-0"><p class="text-sm font-medium text-ink-800">${esc(v.visit)} visit</p><p class="text-xs text-ink-500">${esc(fmtDMY(v.date))} · ${esc(v.carer)}</p></div>
            <span class="text-xs ${v.status === 'Completed' ? 'text-success-600' : 'text-warning-600'} font-medium">${esc(v.status)}</span>
          </div>`) : '<p class="text-sm text-ink-500 text-center py-4">No visit history.</p>'}
        </div>
      </div>
    </div>`
  return mobileFlow(inner)
}

/* ------------------------------------------------ Consent & capacity (§16) */
export function renderCapacity({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound(`#/carer/clients`)
  const cap = capacityFor(id)
  const capTone = (c) => c === 'Has capacity' ? 'bg-success-50 text-success-700 ring-success-100' : 'bg-danger-50 text-danger-700 ring-danger-100'
  const inner = html`
    ${flowHeader({ title: 'Consent & capacity', subtitle: esc(su.name), back: `#/carer/clients/${id}` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="rounded-xl bg-primary-50 ring-1 ring-primary-100 p-3 text-sm text-primary-800 flex items-center gap-2">${icon('info', 'w-4 h-4')}Capacity is <b>decision-specific and time-specific</b> — never a person-level yes/no. A refusal is not a lack of capacity.</div>

      ${cap.lpa ? html`<div class="card p-4">
        <p class="section-title mb-1.5 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Lasting Power of Attorney</p>
        <p class="text-sm font-semibold text-ink-900">${esc(cap.lpa.type)}</p>
        <p class="text-sm text-ink-600">${esc(cap.lpa.holder)}</p>
        <div class="mt-2 rounded-lg bg-warning-50 ring-1 ring-warning-100 p-2.5"><p class="text-xs font-semibold text-warning-800">Scope: ${esc(cap.lpa.scope)}</p></div>
        <p class="text-xs text-ink-500 mt-1.5">Registered ${esc(cap.lpa.registered)}</p>
      </div>` : `<div class="card p-4 text-sm text-ink-500">No LPA recorded.</div>`}

      <div>
        <p class="section-title mb-2">Decision-specific capacity</p>
        <div class="space-y-2.5">
          ${map(cap.decisions, (d) => html`<div class="card p-4">
            <div class="flex items-center justify-between gap-2"><p class="text-sm font-semibold text-ink-900">${esc(d.decision)}</p><span class="badge ${capTone(d.capacity)}">${esc(d.capacity)}</span></div>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs">
              <div><dt class="text-ink-500">Assessed</dt><dd class="text-ink-700">${esc(fmtDMY(d.assessed))}</dd></div>
              <div><dt class="text-ink-500">Review</dt><dd class="text-ink-700">${esc(fmtDMY(d.review))}</dd></div>
              <div class="col-span-2"><dt class="text-ink-500">Assessor</dt><dd class="text-ink-700">${esc(d.assessor)}</dd></div>
            </dl>
            ${d.fluctuates ? `<div class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-warning-50 text-warning-700 ring-1 ring-warning-100 px-2 py-1 text-xs font-semibold">${icon('clock', 'w-3.5 h-3.5')}Capacity fluctuates — reassess at the time</div>` : ''}
            ${d.note ? `<p class="text-xs text-ink-500 mt-1.5">${esc(d.note)}</p>` : ''}
            ${d.authority ? `<div class="mt-2 rounded-lg bg-danger-50 ring-1 ring-danger-100 p-2.5"><p class="text-xs font-semibold text-danger-800">Decision authority: ${esc(d.authority)}</p></div>` : ''}
          </div>`)}
          ${!cap.decisions.length ? '<div class="card p-4 text-sm text-ink-500">No capacity assessments recorded.</div>' : ''}
        </div>
      </div>
      <button onclick="window.__notify('Request for formal capacity review sent','success')" class="btn btn-secondary btn-md w-full">${icon('flag', 'w-4 h-4')}Request a formal capacity review</button>
    </div>`
  return mobileFlow(inner)
}

/* ---------------------------------------------------- Documents (§29a / E10) */
export function renderDocuments({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound(`#/carer/clients`)
  const docs = documentSetFor(id).length ? documentSetFor(id) : clientDocs(id).map((d) => ({ ...d, offline: true }))
  const inner = html`
    ${flowHeader({ title: 'Documents', subtitle: esc(su.name), back: `#/carer/clients/${id}`, right: `<a href="#/carer/export" class="text-sm font-semibold text-primary-600">Share</a>` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div class="rounded-xl bg-teal-50 ring-1 ring-teal-100 p-3 text-sm text-teal-800 flex items-center gap-2">${icon('wifi', 'w-4 h-4')}These documents are cached for offline access at the point of care.</div>
      ${docs.length ? html`<div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">${map(docs, (d) => html`<div class="p-4 flex items-center gap-3">
        <span class="w-10 h-10 rounded-xl grid place-items-center ${d.critical ? 'bg-danger-50 text-danger-600' : 'bg-ink-100 text-ink-600'}">${icon(d.icon || 'file-check', 'w-5 h-5')}</span>
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(d.name)}${d.critical ? ' ⚠' : ''}</p><p class="text-xs text-ink-500">${esc(d.type)} · ${esc(fmtDMY(d.date))}${d.offline ? ' · offline' : ''}</p></div>
        <button onclick="window.__notify('Opening ${esc(d.name)}…','info')" class="w-8 h-8 rounded-lg bg-ink-50 text-ink-500 grid place-items-center">${icon('eye', 'w-4 h-4')}</button>
        <a href="#/carer/export" class="w-8 h-8 rounded-lg bg-ink-50 text-ink-500 grid place-items-center">${icon('link', 'w-4 h-4')}</a>
      </div>`)}</div>` : emptyMobile({ icon: 'file-check', title: 'No documents', body: 'Care plan and consent documents will appear here.' })}
    </div>`
  return mobileFlow(inner)
}

/* --------------------------------------------- Assessments & continuity (§23.3/§15) */
export function renderAssessments({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound(`#/carer/clients`)
  const list = assessmentsFor(id)
  const cont = continuityFor(id)
  const inner = html`
    ${flowHeader({ title: 'Assessments & continuity', subtitle: esc(su.name), back: `#/carer/clients/${id}` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="card p-4">
        <p class="section-title mb-2 flex items-center gap-1.5">${icon('users', 'w-3.5 h-3.5')}Continuity of care</p>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div><p class="text-lg font-bold text-ink-900">${cont.visits30d}</p><p class="text-xs text-ink-500">Visits / 30d</p></div>
          <div><p class="text-lg font-bold ${cont.differentCarers > 4 ? 'text-warning-600' : 'text-ink-900'}">${cont.differentCarers}</p><p class="text-xs text-ink-500">Carers</p></div>
          <div><p class="text-lg font-bold ${cont.regular ? 'text-success-600' : 'text-warning-600'}">${cont.regular ? 'Yes' : 'No'}</p><p class="text-xs text-ink-500">Regular team</p></div>
        </div>
        <p class="text-xs text-ink-500 mt-2">Lead carer: <b>${esc(leadCarerFor(id))}</b> · last gap: ${esc(cont.lastGap)}</p>
      </div>
      <div>
        <p class="section-title mb-2">Assessments</p>
        <div class="space-y-2">
          ${map(list, (a) => html`<div class="card p-4">
            <div class="flex items-center justify-between gap-2"><p class="text-sm font-semibold text-ink-900">${esc(a.name)}</p><span class="badge bg-ink-50 text-ink-600 ring-ink-200">${esc(a.score)}</span></div>
            <p class="text-xs text-ink-500 mt-0.5">Updated ${esc(fmtDMY(a.updated))} · ${esc(a.by)}</p>
            <div class="mt-2 flex gap-2">
              ${a.carerEditable ? `<button onclick="window.__notify('Assessment update saved — sent for clinical review','success')" class="btn btn-secondary btn-sm">${icon('check', 'w-3.5 h-3.5')}Update reading</button>` : `<span class="text-xs text-ink-500 self-center">${icon('shield', 'w-3.5 h-3.5')}Clinician-owned — read only</span>`}
              <button onclick="window.__notify('Flagged for clinical review','warning')" class="btn btn-ghost btn-sm">${icon('flag', 'w-3.5 h-3.5')}Flag for review</button>
            </div>
          </div>`)}
        </div>
        <p class="text-xs text-ink-500 mt-2 text-center">You can complete, update or flag assessments — clinical <b>determinations</b> stay with the assessor.</p>
      </div>
    </div>`
  return mobileFlow(inner)
}
