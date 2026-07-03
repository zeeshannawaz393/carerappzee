/** TODAY — the carer's home hub: next-visit focus, day timeline, shortcuts. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileApp, mobileFlow, flowHeader } from './frame.js'
import { syncChip, emptyMobile } from './states.js'
import { session } from './session.js'
import { ROTA, MEDICATION_ORDERS, orderBlocked, RECON_STATES } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'
import { buildVisit, visitProgressFor } from '../screens/carer.js'

/** §24.6 — every open safety item that must be handed over with an ownership ack. */
function openSafetyItems() {
  const items = []
  carerStore.changeRequests().filter((c) => c.state !== 'Actioned' && c.state !== 'Declined').forEach((c) => items.push({ icon: 'flag', label: `Change request ${c.ref} — ${c.target}`, tone: 'warning' }))
  carerStore.allProtocols().filter((p) => !/resolved|recovered|improved/i.test(p.outcome || '')).forEach((p) => items.push({ icon: 'alert', label: `Active protocol — ${p.name}`, tone: 'danger' }))
  carerStore.allMeds().filter((m) => m.group === 'PRN' && m.status === 'completed' && !m.effect).forEach((m) => items.push({ icon: 'clock', label: `PRN follow-up due — ${m.name}`, tone: 'warning' }))
  carerStore.allObservations().filter((o) => o.flag === 'abnormal').forEach((o) => items.push({ icon: 'activity', label: `Abnormal ${o.typeName} — monitor`, tone: 'warning' }))
  carerStore.allIncidents().filter((i) => i.status !== 'Closed').forEach((i) => items.push({ icon: 'warning', label: `Open incident ${i.ref} — ${i.typeName}`, tone: 'danger' }))
  Object.entries(MEDICATION_ORDERS).forEach(([suId, orders]) => orders.filter(orderBlocked).forEach((o) => {
    const acted = carerStore.reconFor(suId, o.medId)
    if (!acted || RECON_STATES[acted.action]?.blocks) items.push({ icon: 'refresh', label: `Reconciliation pending — ${o.name}`, tone: 'warning' })
  }))
  if (carerStore.queued() > 0) items.push({ icon: 'wifi', label: `${carerStore.queued()} record(s) not yet synced`, tone: 'warning' })
  return items
}

const ETA = { 'v-mary-am': '', 'v-doris-am': '6 min · 1.4 mi', 'v-george-am': '9 min · 2.8 mi', 'v-mary-lunch': '12 min · 3.1 mi', 'v-doris-lunch': '5 min · 1.4 mi', 'v-mary-tea': '11 min · 3.0 mi', 'v-george-tea': '9 min · 2.8 mi', 'v-mary-bed': '7 min · 2.2 mi' }

function visits() {
  return ROTA.map((r) => {
    const v = buildVisit(r.id)
    const clock = carerStore.clock(r.id)
    const prog = visitProgressFor(v)
    const status = clock.out ? 'completed' : clock.in ? 'in-progress' : 'upcoming'
    // Derived highlights surfaced on each home-screen visit row (safety first).
    const scheduled = v.meds.scheduled || []
    const prn = v.meds.prn || []
    const highlights = {
      allergies: v.su.allergies || [],
      medsDue: scheduled.length,
      timeCritical: scheduled.filter((m) => m.timeCritical).length,
      twoCarer: !!r.twoCarer,
      requiredCount: (v.tasks || []).filter((t) => t.required && !t.isMed).length,
      controlled: prn.filter((m) => m.controlled).length,
    }
    return { rota: r, su: v.su, clock, prog, status, highlights }
  })
}

/* =============================================================================
   TODAY — redesigned surface (clean / Uber-Shopify direction)

   Design rules applied here (vs. the rest of the app):
   • Light header — no saturated blue band; dark text on canvas, blue is an accent.
   • Type scale limited to 5 steps: text-xs / sm / base / lg / xl. No text-[Npx].
   • Color is semantic only — one blue accent + status red/amber/green; quick
     actions are monochrome (kills the rainbow). Avatars keep a person tint.
   • De-boxed — the visit list is ONE grouped card with hairline dividers instead
     of a stack of ringed+shadowed boxes. Secondary text lifted ink-400 → ink-500.
   • Spacing on an 8px rhythm (p-4 / p-5, gap-2 / gap-3), fewer radii (xl + full).
   ========================================================================== */
export function renderToday() {
  const carer = session.carer()
  const list = visits()
  const done = list.filter((v) => v.status === 'completed').length
  const next = list.find((v) => v.status === 'in-progress') || list.find((v) => v.status === 'upcoming')
  const queued = carerStore.queued()
  const dayPct = Math.round((done / list.length) * 100)
  const inProgress = next && next.status === 'in-progress'

  // Header is deliberately quiet — an orientation line, not the focal point.
  // The greeting recedes (label + medium name) so the hero card can lead.
  const header = html`<div class="px-5 pt-9 pb-1 flex items-center justify-between gap-3">
    <div class="min-w-0">
      <p class="text-xs font-medium uppercase tracking-wide text-ink-400">Good morning</p>
      <h1 class="text-lg font-semibold text-ink-900 leading-tight truncate">${esc(carer.name)} · <span class="font-normal text-ink-500">Tue 30/06/2026</span></h1>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      ${syncChip(queued)}
      <a href="#/carer/notifications" aria-label="Notifications" class="relative w-10 h-10 rounded-full bg-white ring-1 ring-ink-200 text-ink-600 grid place-items-center active:bg-ink-50">${icon('bell', 'w-5 h-5')}<span class="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-danger-500 ring-2 ring-white"></span></a>
    </div>
  </div>`

  // Focus card — the ONE hero. It out-weighs everything: largest name on screen,
  // extra elevation (shadow-pop), a thin primary ring tying it to the accent,
  // and the single most important action as a full-width primary button.
  const heroCard = next
    ? html`<div class="mx-4 mt-2 rounded-2xl bg-white ring-1 ring-primary-100 shadow-[var(--shadow-pop)] p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${inProgress ? 'text-warning-600' : 'text-primary-600'}">${inProgress ? `<span class="w-1.5 h-1.5 rounded-full bg-warning-500"></span>In progress` : 'Next visit'}</span>
          <span class="text-sm font-medium text-ink-500 tabular-nums">${esc(next.rota.time)}</span>
        </div>
        <div class="flex items-center gap-3.5">
          ${avatar(next.su, 'lg')}
          <div class="min-w-0 flex-1"><p class="text-xl font-bold text-ink-900 leading-tight truncate">${esc(next.su.name)}</p><p class="text-sm text-ink-500 truncate mt-0.5">${esc(next.rota.visit)} visit${next.rota.twoCarer ? ' · 2 carers' : ''}${ETA[next.rota.id] ? ' · ' + ETA[next.rota.id] : ''}</p></div>
        </div>
        ${(next.su.allergies || []).length ? `<div class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-danger-50 text-danger-700 px-2.5 py-1 text-xs font-semibold">${icon('alert', 'w-3.5 h-3.5')}Allergies: ${esc(next.su.allergies.join(', '))}</div>` : ''}
        <div class="flex gap-2 mt-4">
          <a href="#/carer/visit/${next.rota.id}" class="btn btn-primary btn-lg flex-1">${icon(inProgress ? 'arrow-right' : 'clock', 'w-4 h-4')}${inProgress ? 'Resume visit' : 'Start visit'}</a>
          <button onclick="window.__notify('Opening directions…','info')" aria-label="Directions" class="btn btn-secondary btn-lg !px-3.5">${icon('map-pin', 'w-4 h-4')}</button>
        </div>
      </div>`
    : html`<div class="mx-4 mt-2 rounded-2xl bg-white ring-1 ring-primary-100 shadow-[var(--shadow-pop)] p-6 text-center"><span class="w-12 h-12 rounded-full bg-success-50 text-success-600 grid place-items-center mx-auto mb-3">${icon('check-circle', 'w-6 h-6')}</span><p class="text-lg font-bold text-ink-900">Round complete</p><p class="text-sm text-ink-500 mt-1">All ${list.length} visits done. Great work today.</p></div>`

  // Quick actions — uniform neutral tiles. Status colour is intentionally NOT
  // used here; the calm, single-treatment row is what reads as "clean".
  const shortcut = (ic, label, onclick) => html`<button onclick="${onclick}" class="flex-1 rounded-xl bg-white ring-1 ring-ink-100 py-3 flex flex-col items-center gap-1.5 active:bg-ink-50"><span class="text-ink-600">${icon(ic, 'w-5 h-5')}</span><span class="text-xs font-medium text-ink-700">${label}</span></button>`

  const inner = html`
    ${header}
    ${heroCard}

    <div class="px-4 pt-6 pb-4 space-y-6">
      <!-- day progress — flat row, no box, neutral ring -->
      <div class="flex items-center gap-3">
        <div class="relative w-11 h-11 shrink-0">
          <svg viewBox="0 0 40 40" class="w-11 h-11 -rotate-90"><circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-ink-100)" stroke-width="4"/><circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-primary-500)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(dayPct / 100) * 100.5} 100.5"/></svg>
          <span class="absolute inset-0 grid place-items-center text-xs font-semibold text-ink-800">${dayPct}%</span>
        </div>
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${done} of ${list.length} visits done</p><p class="text-xs text-ink-500">${list.length - done} remaining today</p></div>
        <a href="#/carer/schedule" class="btn btn-ghost btn-sm">${icon('calendar', 'w-4 h-4')}Schedule</a>
      </div>

      <!-- quick actions -->
      <div class="flex gap-2.5">
        ${shortcut('flag', 'Incident', "window.__nav('/carer/visit/' + '" + (next ? next.rota.id : ROTA[0].id) + "')")}
        ${shortcut('bell', 'Message', "window.__nav('/carer/inbox')")}
        ${shortcut('shield', 'Safety', "window.__nav('/carer/me/safety')")}
      </div>

      <!-- visits — one grouped card, hairline dividers (de-boxed) -->
      <div>
        <div class="flex items-baseline justify-between mb-2.5">
          <p class="section-title">Your visits</p>
          <span class="text-xs font-medium text-ink-400 tabular-nums">${done}/${list.length} done</span>
        </div>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${map(list, (v) => visitRow(v))}
        </div>
      </div>

      <a href="#/carer/shift-summary" class="rounded-2xl bg-white ring-1 ring-ink-100 p-4 flex items-center gap-3 active:bg-ink-50"><span class="text-ink-500">${icon('file-check', 'w-5 h-5')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">End-of-shift summary</p><p class="text-xs text-ink-500">Hours, outstanding items &amp; pay</p></div>${icon('chevron-right', 'w-5 h-5 text-ink-300')}</a>
    </div>`

  return mobileApp(inner, { tab: 'today', badges: { inbox: 2 } })
}

function avatar(su, size = 'md') {
  const tone = { warning: 'bg-warning-100 text-warning-700', teal: 'bg-teal-100 text-teal-700', danger: 'bg-danger-100 text-danger-700', primary: 'bg-primary-100 text-primary-700' }[su.color] || 'bg-primary-100 text-primary-700'
  const dim = size === 'lg' ? 'w-12 h-12 text-base' : 'w-11 h-11 text-sm'
  return `<span class="${dim} rounded-full grid place-items-center font-semibold shrink-0 ${tone}">${esc(su.initials)}</span>`
}

/** Compact semantic chip — icon + short label/count. Max 2–3 per row. */
function chip(ic, label, tint) {
  return `<span class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${tint}">${icon(ic, 'w-3.5 h-3.5')}${esc(label)}</span>`
}

/** Priority-ordered highlights for a visit row — allergies first, then meds,
 *  two-carer, required tasks. Capped so the row stays clean (Uber/Shopify). */
function visitChips(h) {
  const chips = []
  if (h.allergies.length) chips.push(chip('alert', 'Allergy', 'bg-danger-50 text-danger-700'))
  if (h.medsDue) chips.push(chip('pill', h.timeCritical ? `${h.medsDue} · time-crit` : String(h.medsDue), h.timeCritical ? 'bg-warning-50 text-warning-700' : 'bg-primary-50 text-primary-700'))
  if (h.twoCarer) chips.push(chip('users', '2 carers', 'bg-ink-100 text-ink-600'))
  if (!h.medsDue && h.requiredCount) chips.push(chip('flag', `${h.requiredCount} req`, 'bg-ink-100 text-ink-600'))
  return chips.slice(0, 3).join('')
}

function visitRow(v) {
  // Status expressed with a small dot + muted label — no filled pill boxes.
  const status = v.status === 'completed'
    ? `<span class="inline-flex items-center gap-1.5 text-xs font-medium text-success-600">${icon('check', 'w-3.5 h-3.5')}Done</span>`
    : v.status === 'in-progress'
      ? `<span class="inline-flex items-center gap-1.5 text-xs font-medium text-warning-600"><span class="w-1.5 h-1.5 rounded-full bg-warning-500"></span>In progress</span>`
      : `<span class="text-xs font-medium text-ink-400">${esc(v.rota.time.split(' ')[0])}</span>`
  const chips = visitChips(v.highlights)
  return html`
    <a href="#/carer/visit/${v.rota.id}" class="block p-4 active:bg-ink-50">
      <div class="flex items-center gap-3">
        ${avatar(v.su)}
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900 truncate">${esc(v.su.name)}</p><p class="text-xs text-ink-500 truncate">${esc(v.rota.visit)} · ${esc(v.rota.time)}</p></div>
        ${status}
      </div>
      ${chips ? `<div class="mt-2.5 flex flex-wrap items-center gap-1.5">${chips}</div>` : ''}
      ${v.status !== 'upcoming' ? html`<div class="mt-3 flex items-center gap-2.5"><div class="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden"><div class="h-1.5 ${v.prog.pct === 100 ? 'bg-success-500' : 'bg-primary-500'} rounded-full" style="width:${v.prog.pct}%"></div></div><span class="text-xs font-medium text-ink-500 tabular-nums">${v.prog.done}/${v.prog.total}</span></div>` : ''}
    </a>`
}

/* ------------------------------------------------- End-of-shift summary (§11) */
const mins = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m }

export function renderShiftSummary() {
  const rows = visits()
  const done = rows.filter((v) => v.clock.out).length
  const worked = rows.reduce((s, v) => s + (v.clock.in && v.clock.out ? mins(v.clock.out) - mins(v.clock.in) : 0), 0)
  const outstanding = rows.filter((v) => v.clock.in && !v.clock.out)
  const safety = openSafetyItems()
  const miles = 14.2
  const pay = (worked / 60) * 12.5 + miles * 0.45

  const inner = html`
    ${flowHeader({ title: 'End of shift', subtitle: 'Tue 30/06/2026', back: '#/carer' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-3 text-center"><p class="text-2xl font-bold text-ink-900">${done}/${rows.length}</p><p class="text-xs text-ink-400">Visits completed</p></div>
        <div class="card p-3 text-center"><p class="text-2xl font-bold text-ink-900">${Math.floor(worked / 60)}h ${worked % 60}m</p><p class="text-xs text-ink-400">Hours clocked</p></div>
        <div class="card p-3 text-center"><p class="text-2xl font-bold text-ink-900">${miles}</p><p class="text-xs text-ink-400">Miles</p></div>
        <div class="card p-3 text-center"><p class="text-2xl font-bold text-ink-900">£${pay.toFixed(2)}</p><p class="text-xs text-ink-400">Est. pay</p></div>
      </div>

      ${outstanding.length ? html`<div class="card p-3.5">
        <p class="text-xs font-semibold text-warning-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}Outstanding — not clocked out</p>
        <div class="space-y-2">${map(outstanding, (v) => `<a href="#/carer/visit/${v.rota.id}" class="flex items-center gap-2.5 p-2 rounded-lg ring-1 ring-ink-200"><span class="w-7 h-7 rounded-lg bg-warning-50 text-warning-600 grid place-items-center">${icon('clock', 'w-3.5 h-3.5')}</span><div class="flex-1"><p class="text-sm font-semibold text-ink-800">${esc(v.su.name)} · ${esc(v.rota.visit)}</p><p class="text-xs text-ink-400">${v.prog.done}/${v.prog.total} recorded</p></div>${icon('chevron-right', 'w-4 h-4 text-ink-300')}</a>`)}</div>
      </div>` : `<div class="rounded-xl bg-success-50 ring-1 ring-success-100 p-3.5 text-sm text-success-800 flex items-center gap-2">${icon('check-circle', 'w-4 h-4')}All visits clocked out. Nothing outstanding.</div>`}

      <div class="card p-3.5">
        <p class="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Your visits</p>
        <div class="space-y-1.5">${map(rows, (v) => `<div class="flex items-center justify-between text-sm"><span class="text-ink-700">${esc(v.su.name)} · ${esc(v.rota.visit)}</span><span class="${v.clock.out ? 'text-success-600' : v.clock.in ? 'text-warning-600' : 'text-ink-400'} font-medium">${v.clock.out ? 'Completed' : v.clock.in ? 'In progress' : 'Not started'}</span></div>`)}</div>
      </div>

      <!-- §24.6 — open safety items handed over with an ownership ack -->
      <div x-data="{ received: '', acked: false }">
        <div class="card p-3.5">
          <p class="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${safety.length ? 'text-danger-700' : 'text-success-700'}">${icon('shield', 'w-3.5 h-3.5')}Cross-shift safety handover</p>
          ${safety.length ? html`<div class="space-y-1.5">${map(safety, (s) => `<div class="flex items-center gap-2 text-sm rounded-lg ring-1 ${s.tone === 'danger' ? 'ring-danger-100 bg-danger-50 text-danger-800' : 'ring-warning-100 bg-warning-50 text-warning-800'} p-2"><span class="shrink-0">${icon(s.icon, 'w-3.5 h-3.5')}</span><span class="flex-1">${esc(s.label)}</span></div>`)}</div>
          <div class="mt-3 space-y-2">
            <label class="label">Handed over to (receiving carer / office)</label>
            <input x-model="received" class="field field-sm" placeholder="e.g. D. Roy (night team)" />
            <button @click="if(!received.trim()){window.__notify('Name who is taking ownership','warning');return} acked=true; window.__notify('Safety items handed over — ownership acknowledged','success')" class="btn btn-primary btn-sm w-full" x-show="!acked">${icon('check', 'w-3.5 h-3.5')}Confirm handover & ownership</button>
            <p x-show="acked" x-cloak class="text-xs text-success-700 flex items-center gap-1.5">${icon('check-circle', 'w-3.5 h-3.5')}<span x-text="received + ' has accepted ownership of the above.'"></span></p>
          </div>` : `<p class="text-sm text-success-800 flex items-center gap-1.5">${icon('check-circle', 'w-3.5 h-3.5')}No open safety items to hand over.</p>`}
        </div>
        <button @click="if(${safety.length ? 'true' : 'false'} && !acked){window.__notify('Acknowledge the safety handover first','warning');return} window.__notify('End-of-shift summary confirmed & submitted','success')" class="btn btn-primary btn-lg w-full mt-4">${icon('check', 'w-5 h-5')}Confirm end of shift</button>
      </div>
    </div>`
  return mobileFlow(inner)
}
