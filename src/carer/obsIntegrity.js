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
    // Tier 2 (clinical, condition-gated)
    news2: [2, 3, 3, 4, 5, 4],
    glucose: { targetLo: 4, targetHi: 8.5, slots: ['Pre-bfast', 'Post-bfast', 'Pre-lunch', 'Bed'],
      days: [['Thu', [6.2, 9.1, 5.8, 7.0]], ['Fri', [5.4, 8.2, 6.1, 11.2]], ['Sat', [4.1, 7.8, 5.5, 6.9]], ['Today', [6.0, 8.4, null, null]]] },
    // Tier 3 (wellbeing)
    mood: ['happy', 'content', 'settled', 'low', 'low', 'content', 'low'],
    sleep: [6.5, 5, 7, 4.5, 6, 3.5, 5.5],
    pain: [2, 3, 2, 4, 5, 3, 4],
    // Safety & medication (quick-win charts from data we already capture)
    medPct: [100, 100, 75, 100, 75, 100, 100], // % of due doses given per day
    incidents: [{ ago: 5, type: 'Fall / slip' }, { ago: 19, type: 'Near miss' }], // last 30 days
  },
}
const barColor = (v, t) => (v >= t ? 'bg-success-500' : v >= t * 0.6 ? 'bg-info-500' : 'bg-warning-500')
const dayLabels = (n) => TREND_DAYS.slice(-n).map((d) => `<span class="flex-1 text-center text-[9px] text-ink-400 font-semibold">${d}</span>`).join('')
const chip = (tone, text) => `<span class="badge bg-${tone}-50 text-${tone}-700 ring-${tone}-100">${text}</span>`
const trendNote = (tone, inner) => `<p class="text-[11.5px] text-${tone}-700 mt-3 flex gap-1.5">${icon('info', 'w-3.5 h-3.5 shrink-0')}<span>${inner}</span></p>`
const section = (label, cards) => (cards ? html`<div><p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">${label}</p><div class="space-y-3">${cards}</div></div>` : '')
/** live "today" observations of a type for this client (newest first). */
const liveOf = (live, typeId) => live.filter((o) => o.typeId === typeId)

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

function buildTrends(h, live) {
  // ---- hydration (today's total pulled from live fluid observations) ----
  const tgt = h.fluidTarget
  const f = h.fluid.slice()
  const liveMl = liveOf(live, 'fluid').reduce((s, o) => s + (Number(o.values.amount) || 0), 0)
  if (liveMl > 0) f[f.length - 1] = liveMl
  const today = f[f.length - 1]
  const below = f.filter((v) => v < tgt).length
  const fMax = Math.max(tgt, ...f) * 1.05
  const hTone = today >= tgt ? 'success' : today >= tgt * 0.6 ? 'warning' : 'danger'
  const hydration = trendCard('bg-info-500 text-white', 'droplet', 'Hydration',
    chip(hTone, today >= tgt ? 'On target' : 'Behind today'), html`
    <p class="text-2xl font-bold tabular-nums text-ink-900">${today} <span class="text-sm font-semibold text-ink-400">/ ${tgt} ml today</span></p>
    <div class="h-2.5 rounded-full bg-ink-100 overflow-hidden mt-2"><div class="h-2.5 rounded-full ${barColor(today, tgt)}" style="width:${Math.min(100, Math.round((today / tgt) * 100))}%"></div></div>
    <div class="flex items-end gap-1.5 h-11 mt-4">${f.map((v) => `<div class="flex-1 rounded-t ${barColor(v, tgt)}" style="height:${Math.round((v / fMax) * 100)}%"></div>`).join('')}</div>
    <div class="flex gap-1.5 mt-1">${dayLabels(7)}</div>
    ${trendNote('warning', `<b>${below} of 7 days below target</b> — prompt fluids at tea &amp; bedtime.`)}`)

  // ---- nutrition (today from live meal) ----
  const fc = { good: 'bg-success-500', ok: 'bg-warning-500', poor: 'bg-danger-500' }
  const fm = { good: '✓', ok: '◑', poor: '◔' }
  const food = h.food.slice()
  const liveFood = liveOf(live, 'food')
  if (liveFood.length) { const e = liveFood[0].values.eaten; food[food.length - 1] = ['All', 'Most'].includes(e) ? 'good' : e === 'Half' ? 'ok' : 'poor' }
  const poorRun = food[food.length - 1] === 'poor' && food[food.length - 2] === 'poor'
  const nutrition = trendCard('bg-warning-500 text-white', 'soup', 'Nutrition',
    chip(poorRun ? 'warning' : 'success', poorRun ? 'Poor appetite' : 'Eating well'), html`
    <div class="flex gap-1.5">${food.map((q, i) => `<div class="flex-1"><div class="aspect-square rounded-md ${fc[q]} grid place-items-center text-white text-[11px] font-bold">${fm[q]}</div><span class="block text-center text-[9px] text-ink-400 mt-1 font-semibold">${TREND_DAYS[i]}</span></div>`).join('')}</div>
    ${trendNote(poorRun ? 'warning' : 'ink', poorRun ? '<b>2 poor-intake days in a row</b> — offer fortified snacks; feeds the weight trend.' : 'Appetite steady over the week.')}`)

  // ---- weight / MUST (latest reading from live) ----
  const w = h.weight, base = w.baseline, pts = w.points.slice()
  const liveW = liveOf(live, 'weight'); if (liveW.length) { const kg = Number(liveW[0].values.value); if (kg) pts[pts.length - 1] = kg }
  const cur = pts[pts.length - 1]
  const loss = ((base - cur) / base) * 100
  const wTone = loss >= 10 ? 'danger' : loss >= 5 ? 'warning' : 'success'
  const yFor = (kg) => 12 + ((base - kg) / (base * 0.1)) * 66 // baseline→12, −10%→78
  const aY = yFor(base * 0.95), rY = yFor(base * 0.9)
  const n = pts.length, x0 = 34, x1 = 292
  const xy = pts.map((kg, i) => [x0 + ((x1 - x0) * i) / (n - 1), yFor(kg)])
  const line = xy.map((p) => `${p[0].toFixed(0)},${p[1].toFixed(1)}`).join(' ')
  const last = xy[xy.length - 1]
  const weight = trendCard('bg-primary-600 text-white', 'weight', 'Weight &amp; malnutrition',
    chip(wTone, `MUST · ${loss >= 10 ? 'high' : loss >= 5 ? 'medium' : 'low'}`), html`
    <div class="flex items-baseline gap-2 flex-wrap">
      <p class="text-2xl font-bold tabular-nums text-ink-900">${cur} <span class="text-sm font-semibold text-ink-400">kg</span></p>
      ${chip(wTone, `${loss >= 0 ? '&#9660;' : '&#9650;'} ${Math.abs(loss).toFixed(1)}% in 3 months`)}
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

  // ---- bowels (today from live) ----
  const b = h.bowel.slice()
  const liveB = liveOf(live, 'bowel'); if (liveB.length) { const t = Number(liveB[0].values.type); if (t) b[b.length - 1] = t }
  let since = 0
  for (let i = b.length - 1; i >= 0 && b[i] === 0; i--) since++
  const bColor = (t) => (t === 0 ? '' : t <= 2 ? 'bg-warning-500' : t <= 4 ? 'bg-success-500' : 'bg-danger-500')
  const bTone = since >= 4 ? 'danger' : since >= 3 ? 'warning' : 'success'
  const bowels = trendCard('bg-ink-700 text-white', 'toilet', 'Bowels &middot; Bristol',
    chip(bTone, since >= 3 ? `${since} days` : 'Regular'), html`
    <p class="text-lg font-bold text-ink-900"><span class="tabular-nums">${since} days</span> since last movement</p>
    <p class="text-[12px] text-ink-500">Amber at 3 days &middot; type 1&ndash;2 = constipation</p>
    <div class="flex gap-1.5 mt-3">${b.map((t, i) => `<div class="flex-1"><div class="aspect-square rounded-md grid place-items-center text-[11px] font-bold ${t === 0 ? 'bg-ink-50 border border-dashed border-ink-200 text-ink-300' : bColor(t) + ' text-white'}">${t === 0 ? '&ndash;' : t}</div><span class="block text-center text-[9px] text-ink-400 mt-1 font-semibold">${TREND_DAYS[i]}</span></div>`).join('')}</div>
    <div class="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
      <span class="text-[10px] text-ink-500 font-semibold inline-flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm bg-warning-500 inline-block"></i>1–2 hard</span>
      <span class="text-[10px] text-ink-500 font-semibold inline-flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm bg-success-500 inline-block"></i>3–4 normal</span>
      <span class="text-[10px] text-ink-500 font-semibold inline-flex items-center gap-1"><i class="w-2.5 h-2.5 rounded-sm bg-danger-500 inline-block"></i>6–7 loose</span>
    </div>
    ${trendNote(bTone === 'success' ? 'ink' : bTone, since >= 3 ? `<b>No movement in ${since} days</b> — offer fluids/fibre, review laxatives, watch for delirium.` : 'Passing regularly — types within normal range.')}`)

  return section('Daily trends &middot; across all visits', html`${hydration}${nutrition}${weight}${bowels}`)
}

/* ---- Tier 2: clinical, condition-gated (NEWS2 deterioration + glucose logbook) ---- */
function buildClinical(h, live, su) {
  const cond = ((su.flags || []).join(' ') + ' ' + (su.risks || []).join(' ')).toLowerCase()
  const cards = []

  if (h.news2) {
    const s = h.news2.slice()
    const ln = liveOf(live, 'news2'); if (ln.length) { const v = Number(ln[0].values.value); if (!isNaN(v)) s[s.length - 1] = v }
    const cur = s[s.length - 1], nMax = Math.max(6, ...s)
    const tone = cur >= 5 ? 'danger' : cur >= 3 ? 'warning' : 'success'
    const nColor = (v) => (v >= 5 ? 'bg-danger-500' : v >= 3 ? 'bg-warning-500' : 'bg-success-500')
    cards.push(trendCard('bg-danger-500 text-white', 'clipboard-list', 'NEWS2 &middot; deterioration',
      chip(tone, cur >= 5 ? 'Escalate' : cur >= 3 ? 'Watch' : 'Stable'), html`
      <p class="text-2xl font-bold tabular-nums text-ink-900">${cur} <span class="text-sm font-semibold text-ink-400">latest score</span></p>
      <div class="relative flex items-end gap-1.5 h-12 mt-3">
        ${s.map((v) => `<div class="flex-1 rounded-t ${nColor(v)}" style="height:${Math.max(8, Math.round((v / nMax) * 100))}%"></div>`).join('')}
        <div class="absolute left-0 right-0" style="bottom:${Math.round((5 / nMax) * 100)}%;border-top:1.5px dashed #d4351c"></div>
      </div>
      <div class="flex gap-1.5 mt-1">${dayLabels(s.length)}</div>
      ${trendNote(tone === 'success' ? 'ink' : tone, 'Dashed line = <b>escalation threshold (&ge;5)</b>. A rising trend precedes deterioration by hours.')}`))
  }

  if (/diab/.test(cond) && h.glucose) {
    const g = h.glucose
    const days = g.days.map((d) => [d[0], d[1].slice()])
    const lg = liveOf(live, 'glucose').map((o) => Number(o.values.value)).filter((v) => !isNaN(v)).reverse()
    if (lg.length) { const row = g.slots.map(() => null); lg.slice(0, 4).forEach((v, i) => (row[i] = v)); days[days.length - 1] = ['Today', row] }
    const cellCls = (v) => (v == null ? 'bg-ink-50 text-ink-300' : v < g.targetLo ? 'bg-danger-500 text-white' : v > g.targetHi ? 'bg-warning-500 text-white' : 'bg-success-500 text-white')
    const flat = days.flatMap((d) => d[1]).filter((v) => v != null)
    const anyLo = flat.some((v) => v < g.targetLo), anyHi = flat.some((v) => v > g.targetHi)
    const tone = anyLo ? 'danger' : anyHi ? 'warning' : 'success'
    cards.push(trendCard('bg-warning-500 text-white', 'droplet', 'Blood glucose',
      chip(tone, anyLo ? 'Hypo seen' : anyHi ? 'Some highs' : 'In range'), html`
      <div class="grid gap-1 items-center" style="grid-template-columns:38px repeat(4,1fr)">
        <span></span>${g.slots.map((sl) => `<span class="text-center text-[9px] text-ink-400 font-semibold">${sl}</span>`).join('')}
        ${days.map((d) => `<span class="text-[10px] text-ink-500 font-semibold">${d[0]}</span>` + d[1].map((v) => `<span class="rounded-md ${cellCls(v)} grid place-items-center py-1.5 font-bold text-[11px] tabular-nums">${v == null ? '&ndash;' : v}</span>`).join('')).join('')}
      </div>
      <p class="text-[10px] text-ink-500 mt-2">Target ${g.targetLo}&ndash;${g.targetHi} mmol/L pre-meal &middot; <span class="text-danger-600 font-semibold">&lt;${g.targetLo} hypo</span></p>
      ${trendNote(tone === 'success' ? 'ink' : tone, anyHi ? 'A <b>bedtime high on Fri (11.2)</b> — check evening carbs / insulin timing.' : 'Readings mostly in range.')}`))
  }

  return section('Clinical &middot; monitored for this client', cards.join(''))
}

/* ---- Tier 3: wellbeing (mood faces, sleep, pain) ---- */
function buildWellbeing(h, live) {
  const cards = []

  if (h.mood) {
    const MF = { happy: ['laugh', 'text-success-600 bg-success-50'], content: ['smile', 'text-emerald-600 bg-emerald-50'], settled: ['meh', 'text-amber-600 bg-amber-50'], low: ['frown', 'text-orange-600 bg-orange-50'], distressed: ['angry', 'text-danger-600 bg-danger-50'] }
    const mood = h.mood.slice()
    const lm = liveOf(live, 'mood')
    if (lm.length) { const v = (lm[0].values.mood || '').toLowerCase(); mood[mood.length - 1] = v.includes('happy') ? 'happy' : v.includes('content') ? 'content' : v.includes('settled') ? 'settled' : v.includes('distress') ? 'distressed' : 'low' }
    const lows = mood.filter((m) => m === 'low' || m === 'distressed').length
    cards.push(trendCard('bg-teal-500 text-white', 'smile', 'Mood &amp; wellbeing',
      chip(lows >= 3 ? 'warning' : 'success', lows >= 3 ? `${lows} low days` : 'Settled'), html`
      <div class="flex gap-1.5">${mood.map((m, i) => { const fmf = MF[m] || MF.settled; return `<div class="flex-1"><div class="aspect-square rounded-lg ${fmf[1]} grid place-items-center">${icon(fmf[0], 'w-5 h-5')}</div><span class="block text-center text-[9px] text-ink-400 mt-1 font-semibold">${TREND_DAYS[i]}</span></div>` }).join('')}</div>
      ${trendNote(lows >= 3 ? 'warning' : 'ink', lows >= 3 ? '<b>Low mood on several days</b> — often afternoons (?sundowning). Note triggers &amp; comfort measures.' : 'Mood settled across the week.')}`))
  }

  if (h.sleep) {
    const sl = h.sleep.slice()
    const ls = liveOf(live, 'sleep'); if (ls.length) { const hh = Number(ls[0].values.hours); if (!isNaN(hh)) sl[sl.length - 1] = hh }
    const poor = sl.filter((x) => x < 5).length
    cards.push(trendCard('bg-primary-500 text-white', 'moon', 'Sleep',
      chip(poor >= 2 ? 'warning' : 'success', poor >= 2 ? `${poor} poor nights` : 'Sleeping well'), html`
      <div class="flex items-end gap-1.5 h-14 mt-1">${sl.map((x) => `<div class="flex-1 rounded-t ${x < 5 ? 'bg-warning-500' : 'bg-primary-500'}" style="height:${Math.round((x / 9) * 100)}%"></div>`).join('')}</div>
      <div class="flex gap-1.5 mt-1">${dayLabels(sl.length)}</div>
      ${trendNote(poor >= 2 ? 'warning' : 'ink', poor >= 2 ? `<b>${poor} nights under 5h</b> — review night comfort, pain, toileting.` : 'Sleeping around 6h a night.')}`))
  }

  if (h.pain) {
    const p = h.pain.slice()
    const lp = liveOf(live, 'pain'); if (lp.length) { const v = Number(lp[0].values.value); if (!isNaN(v)) p[p.length - 1] = v }
    const cur = p[p.length - 1], pMax = 10
    const tone = cur >= 7 ? 'danger' : cur >= 4 ? 'warning' : 'success'
    const n = p.length, x0 = 6, x1 = 294
    const xy = p.map((v, i) => [x0 + ((x1 - x0) * i) / (n - 1), 46 - (v / pMax) * 40])
    const line = xy.map((q) => `${q[0].toFixed(0)},${q[1].toFixed(1)}`).join(' ')
    const thr = (46 - (7 / pMax) * 40).toFixed(1)
    cards.push(trendCard('bg-danger-500 text-white', 'activity', 'Pain score',
      chip(tone, `${cur}/10 latest`), html`
      <svg viewBox="0 0 300 52" class="w-full mt-1" style="height:52px" preserveAspectRatio="none">
        <line x1="6" y1="${thr}" x2="294" y2="${thr}" stroke="#f3b0a5" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"></line>
        <polyline points="${line}" fill="none" stroke="#d4351c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline>
      </svg>
      <div class="flex gap-1.5">${dayLabels(n)}</div>
      ${trendNote(tone === 'danger' ? 'danger' : 'ink', 'Dashed = <b>escalation (&ge;7)</b>. Peaked midweek — check analgesia timing.')}`))
  }

  return section('Wellbeing', cards.join(''))
}

/* ---- Safety & medication (built from data we already capture) ---- */
function buildSafety(h, meds, incs) {
  const cards = []

  // Medication adherence — % of due doses given per day, live "today" from eMAR
  if (h.medPct) {
    const pct = h.medPct.slice()
    const givenL = meds.filter((m) => m.status === 'completed').length
    const notL = meds.filter((m) => ['refused', 'unable', 'partial'].includes(m.status)).length
    if (givenL + notL > 0) pct[pct.length - 1] = Math.round((givenL / (givenL + notL)) * 100)
    const cur = pct[pct.length - 1]
    const avg = Math.round(pct.reduce((a, b) => a + b, 0) / pct.length)
    const tone = avg >= 95 ? 'success' : avg >= 85 ? 'warning' : 'danger'
    const bColor = (v) => (v >= 95 ? 'bg-success-500' : v >= 85 ? 'bg-warning-500' : 'bg-danger-500')
    cards.push(trendCard('bg-danger-500 text-white', 'pill', 'Medication adherence',
      chip(tone, `${avg}% given`), html`
      <p class="text-2xl font-bold tabular-nums text-ink-900">${cur}% <span class="text-sm font-semibold text-ink-400">given today</span></p>
      <div class="flex items-end gap-1.5 h-11 mt-3">${pct.map((v) => `<div class="flex-1 rounded-t ${bColor(v)}" style="height:${Math.max(6, v)}%"></div>`).join('')}</div>
      <div class="flex gap-1.5 mt-1">${dayLabels(pct.length)}</div>
      ${trendNote(tone === 'success' ? 'ink' : tone, 'Every refused / missed dose is coded on the eMAR and flagged to the office — no silent gaps.')}`))
  }

  // Falls & incidents — days-since-last-fall + 30-day tally by type
  const demo = h.incidents || []
  const all = [...incs.map((i) => ({ ago: 0, type: i.typeName || i.type || 'Incident' })), ...demo]
  const falls = all.filter((x) => /fall|slip/i.test(x.type))
  const sinceFall = falls.length ? Math.min(...falls.map((f) => f.ago)) : null
  const byType = {}; all.forEach((x) => (byType[x.type] = (byType[x.type] || 0) + 1))
  const recentFall = sinceFall != null && sinceFall <= 7
  const iTone = recentFall ? 'warning' : all.length ? 'ink' : 'success'
  cards.push(trendCard('bg-warning-500 text-white', 'alert', 'Falls &amp; incidents',
    chip(recentFall ? 'warning' : 'success', all.length ? `${all.length} in 30d` : 'None'), html`
    <p class="text-lg font-bold text-ink-900">${sinceFall != null ? `<span class="tabular-nums">${sinceFall}</span> day${sinceFall === 1 ? '' : 's'} since last fall` : 'No falls recorded'}</p>
    <div class="flex flex-wrap gap-1.5 mt-2.5">${Object.entries(byType).map(([t, n]) => `<span class="badge bg-ink-50 text-ink-600 ring-ink-200">${esc(t)} &middot; ${n}</span>`).join('') || '<span class="text-[12px] text-ink-400">Nothing in the last 30 days.</span>'}</div>
    ${trendNote(iTone === 'ink' ? 'ink' : recentFall ? 'warning' : 'ink', 'Trend of accidents/near-misses for learning from events (CQC) &mdash; a fall triggers a post-fall observation set.')}`))

  return section('Safety &amp; medication', cards.join(''))
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
  // Charts read live observations for "today" so recording a drink / weight /
  // reading updates them immediately, blended with the demo trend history.
  const live = carerStore.observationsForUser(id)
  const meds = carerStore.allMeds().filter((m) => m.suId === id)
  const incs = carerStore.allIncidents().filter((i) => i.suId === id)
  const h = TREND_HISTORY[id]
  const trends = h ? buildTrends(h, live) : ''
  const safety = h ? buildSafety(h, meds, incs) : ''
  const clinical = h ? buildClinical(h, live, su) : ''
  const wellbeing = h ? buildWellbeing(h, live) : ''

  const inner = html`
    ${flowHeader({ title: 'Monitoring', subtitle: esc(su.name), back: `#/carer/clients/${id}/history` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{
      pos: '', skin: '',
      log() { if(!this.pos){ window.__notify('Choose a position','warning'); return } window.__reposition('${id}', this.pos, this.skin||'Intact'); this.pos=''; this.skin='' }
    }">

      <!-- Daily-trend charts (§19) — cross-visit, live "today" -->
      ${trends}
      ${safety}
      ${clinical}
      ${wellbeing}

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
