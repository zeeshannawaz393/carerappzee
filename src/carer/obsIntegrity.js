/**
 * E9 — Observation integrity (§19). Monitoring schedules (who requested, how
 * often, until when) and a repositioning chart that is shared ACROSS carers &
 * visits, with an overdue flag against the person's turning interval.
 */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { getServiceUser } from '../data/index.js'
import { monitoringFor, repositionFor, WOUND_VOCAB } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'

const notFound = (back) => mobileFlow(html`${flowHeader({ title: 'Not found', back })}${emptyMobile({ title: 'Client not found' })}`)

/* ---------------------------------------------------------------------------
   Daily-trend charts (§19). These aggregate ACROSS visits — the whole point of
   charting in home care is the trend, not one visit. Data here is a prototype
   demo history; the real build buckets carerStore.observationsForUser(id) by
   day and reads each target/interval from the person's care plan.
   Grounding: MUST weight-loss 5%/10% over 3–6 months · NHS care-home hydration
   targets · daily Bristol bowel monitoring · declining appetite → malnutrition.
--------------------------------------------------------------------------- */
const TREND_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const TREND_HISTORY = {
  'su-mary': {
    fluidTarget: 1500,
    fluid: [1520, 1180, 1450, 980, 860, 900, 640],
    food: ['good', 'good', 'ok', 'good', 'ok', 'poor', 'poor'],
    bowel: [4, 2, 3, 4, 0, 0, 0], // Bristol type; 0 = none passed
    weight: { baseline: 62.3, points: [62.3, 61.6, 61.0, 59.8, 58.9, 58.4] },
  },
}
const barColor = (v, t) => (v >= t ? 'bg-success-500' : v >= t * 0.6 ? 'bg-info-500' : 'bg-warning-500')
const dayLabels = (n) => TREND_DAYS.slice(-n).map((d) => `<span class="flex-1 text-center text-[9px] text-ink-400 font-semibold">${d}</span>`).join('')
const chip = (tone, text) => `<span class="badge bg-${tone}-50 text-${tone}-700 ring-${tone}-100">${text}</span>`
const trendNote = (tone, inner) => `<p class="text-[11.5px] text-${tone}-700 mt-3 flex gap-1.5">${icon('info', 'w-3.5 h-3.5 shrink-0')}<span>${inner}</span></p>`

/** A trend card shell: tinted icon, title, RAG chip, then the mini-viz body. */
function trendCard(icBg, ic, title, chipHtml, body) {
  return html`<div class="card p-4">
    <div class="flex items-center gap-2.5 mb-3">
      <span class="w-8 h-8 rounded-lg ${icBg} grid place-items-center shrink-0">${icon(ic, 'w-4 h-4')}</span>
      <h3 class="text-[15px] font-semibold text-ink-900 flex-1">${title}</h3>
      ${chipHtml}
    </div>
    ${body}
  </div>`
}

function buildTrends(h) {
  // ---- hydration ----
  const f = h.fluid, tgt = h.fluidTarget, today = f[f.length - 1]
  const below = f.filter((v) => v < tgt).length
  const fMax = Math.max(tgt, ...f) * 1.05
  const hydration = trendCard('bg-info-500 text-white', 'droplet', 'Hydration',
    chip('warning', 'Behind today'), html`
    <p class="text-2xl font-bold tabular-nums text-ink-900">${today} <span class="text-sm font-semibold text-ink-400">/ ${tgt} ml today</span></p>
    <div class="h-2.5 rounded-full bg-ink-100 overflow-hidden mt-2"><div class="h-2.5 rounded-full ${barColor(today, tgt)}" style="width:${Math.min(100, Math.round((today / tgt) * 100))}%"></div></div>
    <div class="flex items-end gap-1.5 h-11 mt-4">${f.map((v) => `<div class="flex-1 rounded-t ${barColor(v, tgt)}" style="height:${Math.round((v / fMax) * 100)}%"></div>`).join('')}</div>
    <div class="flex gap-1.5 mt-1">${dayLabels(7)}</div>
    ${trendNote('warning', `<b>${below} of 7 days below target</b> — prompt fluids at tea &amp; bedtime.`)}`)

  // ---- nutrition ----
  const fc = { good: 'bg-success-500', ok: 'bg-warning-500', poor: 'bg-danger-500' }
  const fm = { good: '✓', ok: '◑', poor: '◔' }
  const nutrition = trendCard('bg-warning-500 text-white', 'soup', 'Nutrition',
    chip('warning', 'Poor appetite'), html`
    <div class="flex gap-1.5">${h.food.map((q, i) => `<div class="flex-1"><div class="aspect-square rounded-md ${fc[q]} grid place-items-center text-white text-[11px] font-bold">${fm[q]}</div><span class="block text-center text-[9px] text-ink-400 mt-1 font-semibold">${TREND_DAYS[i]}</span></div>`).join('')}</div>
    ${trendNote('warning', '<b>2 poor-intake days in a row</b> — offer fortified snacks; feeds the weight trend.')}`)

  // ---- weight / MUST ----
  const w = h.weight, base = w.baseline, pts = w.points, cur = pts[pts.length - 1]
  const loss = ((base - cur) / base) * 100
  const yFor = (kg) => 12 + ((base - kg) / (base * 0.1)) * 66 // baseline→12, −10%→78
  const aY = yFor(base * 0.95), rY = yFor(base * 0.9)
  const n = pts.length, x0 = 34, x1 = 292
  const xy = pts.map((kg, i) => [x0 + ((x1 - x0) * i) / (n - 1), yFor(kg)])
  const line = xy.map((p) => `${p[0].toFixed(0)},${p[1].toFixed(1)}`).join(' ')
  const last = xy[xy.length - 1]
  const weight = trendCard('bg-primary-600 text-white', 'weight', 'Weight &amp; malnutrition',
    chip('warning', 'MUST · medium'), html`
    <div class="flex items-baseline gap-2 flex-wrap">
      <p class="text-2xl font-bold tabular-nums text-ink-900">${cur} <span class="text-sm font-semibold text-ink-400">kg</span></p>
      ${chip('warning', `&#9660; ${loss.toFixed(1)}% in 3 months`)}
    </div>
    <svg viewBox="0 0 300 90" class="w-full mt-1" style="height:92px" preserveAspectRatio="none">
      <rect x="34" y="${aY.toFixed(1)}" width="258" height="${(rY - aY).toFixed(1)}" fill="#fff8eb"></rect>
      <rect x="34" y="${rY.toFixed(1)}" width="258" height="${(90 - rY).toFixed(1)}" fill="#fef3f2"></rect>
      <line x1="34" y1="${yFor(base).toFixed(1)}" x2="292" y2="${yFor(base).toFixed(1)}" stroke="#dce1e9" stroke-width="1" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"></line>
      <polyline points="${line}" fill="none" stroke="#0f5aa0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline>
      <circle cx="${last[0].toFixed(0)}" cy="${last[1].toFixed(1)}" r="4" fill="#0f5aa0" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"></circle>
      <text x="30" y="${(yFor(base) + 3).toFixed(1)}" font-size="8" fill="#94a0b1" text-anchor="end">${base}</text>
      <text x="30" y="${(aY + 3).toFixed(1)}" font-size="8" fill="#9e6310" text-anchor="end">-5%</text>
      <text x="30" y="${(rY + 3).toFixed(1)}" font-size="8" fill="#b02a14" text-anchor="end">-10%</text>
    </svg>
    ${trendNote('warning', '<b>Crossed the 5% MUST threshold</b> — weigh weekly; dietitian referral at 10%.')}`)

  // ---- bowels ----
  const b = h.bowel
  let since = 0
  for (let i = b.length - 1; i >= 0 && b[i] === 0; i--) since++
  const bColor = (t) => (t === 0 ? '' : t <= 2 ? 'bg-warning-500' : t <= 4 ? 'bg-success-500' : 'bg-danger-500')
  const bowels = trendCard('bg-ink-700 text-white', 'toilet', 'Bowels &middot; Bristol',
    chip(since >= 4 ? 'danger' : 'warning', `${since} days`), html`
    <p class="text-lg font-bold text-ink-900"><span class="tabular-nums">${since} days</span> since last movement</p>
    <p class="text-[12px] text-ink-500">Amber at 3 days &middot; type 1&ndash;2 = constipation</p>
    <div class="flex gap-1.5 mt-3">${b.map((t, i) => `<div class="flex-1"><div class="aspect-square rounded-md grid place-items-center text-[11px] font-bold ${t === 0 ? 'bg-ink-50 border border-dashed border-ink-200 text-ink-300' : bColor(t) + ' text-white'}">${t === 0 ? '&ndash;' : t}</div><span class="block text-center text-[9px] text-ink-400 mt-1 font-semibold">${TREND_DAYS[i]}</span></div>`).join('')}</div>
    <div class="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
      <span class="text-[10px] text-ink-500 font-semibold inline-flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm bg-warning-500 inline-block"></i>1–2 hard</span>
      <span class="text-[10px] text-ink-500 font-semibold inline-flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm bg-success-500 inline-block"></i>3–4 normal</span>
      <span class="text-[10px] text-ink-500 font-semibold inline-flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm bg-danger-500 inline-block"></i>6–7 loose</span>
    </div>
    ${trendNote(since >= 4 ? 'danger' : 'warning', `<b>No movement in ${since} days</b> — offer fluids/fibre, review laxatives, watch for delirium.`)}`)

  return html`<div>
    <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Daily trends &middot; across all visits</p>
    <div class="space-y-3">${hydration}${nutrition}${weight}${bowels}</div>
  </div>`
}

export function renderMonitoring({ id }) {
  const su = getServiceUser(id)
  if (!su) return notFound('#/carer/clients')
  const sched = monitoringFor(id)
  const plan = repositionFor(id)
  const logged = carerStore.repositions(id)
  // Combine seed + carer-added; newest first.
  const turns = [...logged.map((r) => ({ at: r.at, to: r.to, by: 'You', skin: r.skin })), ...(plan ? plan.log.slice().reverse() : [])]
  const lastTurn = turns[0]
  // Simulated "overdue" state: no carer turn logged yet this visit.
  const overdue = plan && !logged.length
  const trends = TREND_HISTORY[id] ? buildTrends(TREND_HISTORY[id]) : ''

  const inner = html`
    ${flowHeader({ title: 'Monitoring', subtitle: esc(su.name), back: `#/carer/clients/${id}/history` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{
      pos: '', skin: '',
      log() { if(!this.pos){ window.__notify('Choose a position','warning'); return } window.__reposition('${id}', this.pos, this.skin||'Intact'); this.pos=''; this.skin='' }
    }">

      <!-- Daily-trend charts (§19) — cross-visit -->
      ${trends}

      <!-- Monitoring schedule (§19.14) -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Monitoring schedule</p>
        ${sched.length ? html`<div class="space-y-2">${map(sched, (m) => html`<div class="card p-3.5">
          <div class="flex items-center justify-between gap-2"><p class="text-sm font-semibold text-ink-900">${esc(m.obs)}</p><span class="badge bg-primary-50 text-primary-700 ring-primary-100">${esc(m.freq)}</span></div>
          <p class="text-[12px] text-ink-500 mt-1">Until ${esc(m.until)} · requested by ${esc(m.by)}</p>
          <p class="text-[12px] text-ink-400">${esc(m.reason)}</p>
        </div>`)}</div>` : `<div class="card p-3.5 text-[13px] text-ink-500">No active monitoring schedule.</div>`}
      </div>

      <!-- Repositioning chart (§19.15/16) -->
      ${plan ? html`<div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Repositioning · every ${plan.intervalH}h · shared across carers</p>
        <div class="rounded-xl ${overdue ? 'bg-danger-50 ring-danger-100' : 'bg-success-50 ring-success-100'} ring-1 p-3 mb-2 flex items-center gap-2 text-[13px] ${overdue ? 'text-danger-800' : 'text-success-800'}">
          ${icon(overdue ? 'warning' : 'check-circle', 'w-4 h-4 shrink-0')}
          <span>${overdue ? `Turn may be due — last recorded ${esc(lastTurn ? lastTurn.to + ' at ' + lastTurn.at : 'none')}. Reposition and log below.` : `Last turned to <b>${esc(lastTurn.to)}</b> at ${esc(lastTurn.at)}${lastTurn.by ? ' (' + esc(lastTurn.by) + ')' : ''}.`}</span>
        </div>
        <div class="card p-3.5 space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div><label class="label">Reposition to</label><select x-model="pos" class="field field-sm"><option value="">Select…</option>${map(['Back', 'Left side', 'Right side', 'Sat up', 'Chair'], (p) => `<option>${p}</option>`)}</select></div>
            <div><label class="label">Skin on inspection</label><select x-model="skin" class="field field-sm">${map(['Intact', 'Red', 'Broken'], (s) => `<option>${s}</option>`)}</select></div>
          </div>
          <button @click="log()" class="btn btn-primary btn-sm w-full">${icon('check', 'w-3.5 h-3.5')}Log repositioning</button>
        </div>
        <div class="card divide-y divide-ink-100 mt-2">
          ${turns.length ? map(turns, (t) => html`<div class="flex items-center gap-3 p-2.5">
            <span class="w-7 h-7 rounded-md grid place-items-center shrink-0 ${t.skin && t.skin !== 'Intact' ? 'bg-warning-50 text-warning-600' : 'bg-ink-100 text-ink-500'}">${icon('footprints', 'w-3.5 h-3.5')}</span>
            <div class="flex-1 min-w-0"><p class="text-[13px] font-medium text-ink-800">${esc(t.to)}</p><p class="text-[11px] text-ink-400">${esc(t.at)}${t.by ? ' · ' + esc(t.by) : ''}</p></div>
            <span class="badge ${t.skin && t.skin !== 'Intact' ? 'bg-warning-50 text-warning-700 ring-warning-100' : 'bg-ink-50 text-ink-500 ring-ink-200'}">${esc(t.skin || 'Intact')}</span>
          </div>`) : '<p class="text-[13px] text-ink-400 text-center py-4">No turns recorded.</p>'}
        </div>
      </div>` : ''}

      <!-- Structured wound vocabulary (§19.20) -->
      <details class="card p-3.5"><summary class="text-sm font-semibold text-ink-900 cursor-pointer list-none flex items-center gap-2">${icon('activity', 'w-4 h-4 text-ink-400')}Structured wound assessment vocabulary</summary>
        <p class="text-[12px] text-ink-500 mt-2">Body-map marks use a fixed vocabulary — no free text for the clinical fields — so wounds are comparable across carers and time.</p>
        <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
          ${map(Object.entries(WOUND_VOCAB), ([k, opts]) => html`<div class="col-span-2"><dt class="text-ink-400 capitalize">${esc(k)}</dt><dd class="text-ink-700">${opts.filter((o) => o !== '—').join(' · ')}</dd></div>`)}
        </dl>
      </details>
    </div>`
  return mobileFlow(inner)
}
