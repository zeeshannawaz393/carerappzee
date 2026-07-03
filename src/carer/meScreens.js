/** P4 — Me & safety: timesheet, availability, training, settings, lone-worker. */
import { html, esc, map } from '../lib/dom.js'
import { fmtDMY } from '../lib/dates.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { ROTA, getRota, WORKING_PATTERN, patternWeek, nextWeekIso, contractedWeeklyHours, DEMO_TODAY, TRAINING_RECORDS, expiryStatus } from '../data/carer.js'
import { getServiceUser } from '../data/index.js'
import { carerStore } from '../lib/carerStore.js'

const mins = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m }
const dur = (a, b) => { const d = mins(b) - mins(a); return d > 0 ? `${Math.floor(d / 60)}h ${d % 60}m` : '—' }

/* -------------------------------------------------------------- Timesheet */
export function renderTimesheet() {
  const rows = ROTA.map((r) => ({ rota: r, su: getServiceUser(r.suId), clock: carerStore.clock(r.id) })).filter((x) => x.clock.in)
  const totalMin = rows.reduce((s, x) => s + (x.clock.out ? mins(x.clock.out) - mins(x.clock.in) : 0), 0)
  const inner = html`
    ${flowHeader({ title: 'Timesheet & mileage', subtitle: 'Tue 30/06/2026', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="grid grid-cols-3 gap-2.5">
        <div class="card p-3 text-center"><p class="text-xl font-bold text-ink-900">${rows.length}</p><p class="text-xs text-ink-500">Visits</p></div>
        <div class="card p-3 text-center"><p class="text-xl font-bold text-ink-900">${Math.floor(totalMin / 60)}h ${totalMin % 60}m</p><p class="text-xs text-ink-500">Clocked</p></div>
        <div class="card p-3 text-center"><p class="text-xl font-bold text-ink-900">14.2</p><p class="text-xs text-ink-500">Miles</p></div>
      </div>
      <div>
        <p class="section-title mb-2">Clocked visits</p>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${rows.length ? map(rows, (x) => html`<div class="flex items-center gap-3 p-4">
            <span class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 grid place-items-center">${icon('clock', 'w-4 h-4')}</span>
            <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(x.su.name)} · ${esc(x.rota.visit)}</p><p class="text-xs text-ink-500">In ${esc(x.clock.in)}${x.clock.out ? ' · Out ' + esc(x.clock.out) : ' · in progress'}</p></div>
            <span class="text-xs font-medium text-ink-700">${x.clock.out ? dur(x.clock.in, x.clock.out) : '•••'}</span>
          </div>`) : '<p class="text-sm text-ink-400 text-center py-6">No clocked visits yet today.</p>'}
        </div>
      </div>
      <button onclick="window.__notify('Timesheet submitted for approval','success')" class="btn btn-primary btn-md w-full">${icon('check', 'w-4 h-4')}Submit timesheet</button>
    </div>`
  return mobileFlow(inner)
}

/* ----------------------------------------------------------- Availability */
/** §12 — availability & shifts driven by the rolling WORKING_PATTERN (CM2000-style):
 *  shows the current cycle-week, this-week's projected rota, and a next-week preview. */
/* Availability editor — a repeating 2-week pattern the carer sets and the office
   confirms. Each day is Fully / Partial / None; Fully & Partial carry a time window. */
const AVAIL_TIME_OPTS = (() => {
  let s = ''
  for (let h = 0; h < 24; h++) for (const m of ['00', '30']) {
    const v = `${String(h).padStart(2, '0')}:${m}`
    s += `<option value="${v}">${v}</option>`
  }
  return s
})()

/* Seed pattern (24-hour times). Reactive Alpine state clones this per session. */
const AVAIL_INIT = {
  1: [
    { day: 'Mon', mode: 'fully', from: '07:00', to: '14:00' },
    { day: 'Tue', mode: 'fully', from: '07:00', to: '14:00' },
    { day: 'Wed', mode: 'partial', from: '13:00', to: '18:00' },
    { day: 'Thu', mode: 'fully', from: '08:00', to: '13:30' },
    { day: 'Fri', mode: 'partial', from: '09:00', to: '13:00' },
    { day: 'Sat', mode: 'none', from: '09:00', to: '17:00' },
    { day: 'Sun', mode: 'none', from: '09:00', to: '17:00' },
  ],
  2: [
    { day: 'Mon', mode: 'partial', from: '09:00', to: '13:00' },
    { day: 'Tue', mode: 'fully', from: '07:00', to: '14:00' },
    { day: 'Wed', mode: 'fully', from: '16:30', to: '21:30' },
    { day: 'Thu', mode: 'none', from: '09:00', to: '17:00' },
    { day: 'Fri', mode: 'partial', from: '08:00', to: '13:30' },
    { day: 'Sat', mode: 'fully', from: '08:00', to: '14:00' },
    { day: 'Sun', mode: 'fully', from: '08:00', to: '14:00' },
  ],
}
/* Single-quoted so it can live inside a double-quoted x-data attribute. */
const AVAIL_INIT_LITERAL = JSON.stringify(AVAIL_INIT).replace(/"/g, "'")

/* One Fully/Partial/None toggle button (evaluated inside the x-for `d` scope). */
const availModeBtn = (mode, label, onCls) => html`<button type="button" @click="d.mode='${mode}'" :class="d.mode==='${mode}' ? '${onCls}' : 'bg-white text-ink-600 ring-ink-200'" class="px-3 h-8 rounded-lg text-[13px] font-semibold ring-1 ring-inset transition-colors active:scale-[.97]">${label}</button>`

/* A 24-hour time picker bound to `model` (e.g. 'd.from'). */
const availTimeSelect = (model) => html`<div class="relative flex-1 min-w-0">
  <select x-model="${model}" class="field field-md appearance-none pr-8 font-medium tabular-nums">${AVAIL_TIME_OPTS}</select>
  <span class="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-ink-400">${icon('clock', 'w-4 h-4')}</span>
</div>`

/** §12 — availability & shifts: the carer's repeating 2-week availability pattern.
 *  Each day is Fully / Partial / None; Fully & Partial carry a 24-hour time window. */
export function renderAvailability() {
  const inner = html`
    ${flowHeader({ title: 'Availability & shifts', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ week: 1, weeks: ${AVAIL_INIT_LITERAL} }">

      <!-- pattern banner -->
      <div class="card p-4 bg-primary-600 ring-primary-600 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wide text-white/70">Your availability pattern</p>
            <p class="text-lg font-bold leading-tight">Repeating 2-week pattern</p>
          </div>
          <span class="w-11 h-11 rounded-xl bg-white/15 grid place-items-center">${icon('calendar', 'w-5 h-5')}</span>
        </div>
        <p class="text-[12px] text-white/80 mt-1">Set when you can work across a repeating two-week pattern. The office confirms any change.</p>
      </div>

      <!-- week tabs -->
      <div class="grid grid-cols-2 gap-1 p-1 bg-ink-100 rounded-xl">
        ${[1, 2].map((w) => html`<button type="button" @click="week=${w}" :class="week===${w} ? 'bg-primary-600 text-white shadow-sm' : 'text-ink-600'" class="h-9 rounded-lg text-sm font-semibold transition-colors">Week ${w}</button>`).join('')}
      </div>

      <!-- legend -->
      <div class="flex items-center justify-center gap-4 text-[11px] text-ink-500">
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-success-500"></span>Fully</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-warning-500"></span>Partial</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-ink-500"></span>None</span>
      </div>

      <!-- day editor -->
      <div class="space-y-3">
        <template x-for="(d, i) in weeks[week]" :key="week + '-' + i">
          <div class="card p-4">
            <div class="flex items-center justify-between gap-2">
              <span class="text-base font-bold text-ink-900" x-text="d.day"></span>
              <div class="inline-flex gap-1">
                ${availModeBtn('fully', 'Fully', 'bg-success-600 text-white ring-success-600')}
                ${availModeBtn('partial', 'Partial', 'bg-warning-500 text-white ring-warning-500')}
                ${availModeBtn('none', 'None', 'bg-ink-600 text-white ring-ink-600')}
              </div>
            </div>
            <div x-show="d.mode !== 'none'" x-cloak class="mt-3 pt-3 border-t border-ink-100 flex items-center gap-2">
              <span class="text-xs text-ink-400 shrink-0">Available</span>
              ${availTimeSelect('d.from')}
              <span class="text-ink-400">–</span>
              ${availTimeSelect('d.to')}
            </div>
            <p x-show="d.mode === 'none'" x-cloak class="mt-3 pt-3 border-t border-ink-100 text-xs text-ink-400">Not available this day.</p>
          </div>
        </template>
      </div>

      <button type="button" onclick="window.__notify('Availability sent to the office for confirmation','success')" class="btn btn-primary btn-md w-full">${icon('check-circle', 'w-4 h-4')}Save availability</button>
      <p class="text-[11px] text-ink-400 text-center">Your two-week pattern repeats automatically. One-off changes and leave don't alter it — the office confirms pattern changes from a future date.</p>
    </div>`
  return mobileFlow(inner)
}

/* ------------------------------------------------------------- Training */
const trainBadge = { valid: 'bg-success-50 text-success-700 ring-success-100', expiring: 'bg-warning-50 text-warning-700 ring-warning-100', expired: 'bg-danger-50 text-danger-700 ring-danger-100' }
const trainDot = { valid: 'bg-success-50 text-success-600', expiring: 'bg-warning-50 text-warning-600', expired: 'bg-danger-50 text-danger-600' }
const trainIco = { valid: 'check-circle', expiring: 'clock', expired: 'x-circle' }
const trainLabel = { valid: 'Valid', expiring: 'Expiring', expired: 'Expired' }
const fmtDate = (iso) => fmtDMY(iso)

/** §28 — training records with expiry computed from the demo clock; links to the
 *  learning centre, skills matrix and staff documents. */
export function renderTraining() {
  const recs = TRAINING_RECORDS.map((r) => {
    const rn = carerStore.trainingRenewal(r.id)
    const expiry = rn ? rn.expiry : r.expiry
    return { ...r, expiry, renewed: !!rn, st: expiryStatus(expiry) }
  })
  const attention = recs.filter((r) => r.st !== 'valid').length

  const inner = html`
    ${flowHeader({ title: 'Training & compliance', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      ${attention
        ? html`<div class="rounded-xl bg-warning-50 ring-1 ring-warning-100 p-3 text-sm text-warning-800 flex items-center gap-2">${icon('alert', 'w-4 h-4')}${attention} certificate${attention === 1 ? '' : 's'} need attention (expiring or expired).</div>`
        : html`<div class="rounded-xl bg-success-50 ring-1 ring-success-100 p-3 text-sm text-success-800 flex items-center gap-2">${icon('check-circle', 'w-4 h-4')}All mandatory training is up to date.</div>`}

      <div class="grid grid-cols-2 gap-2">
        <a href="#/carer/me/learning" class="card p-3 flex items-center gap-2.5 active:scale-[.99]"><span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 grid place-items-center">${icon('sparkles', 'w-4.5 h-4.5')}</span><div class="min-w-0"><p class="text-[13px] font-semibold text-ink-900">Learning centre</p><p class="text-[11px] text-ink-400">Courses & CPD</p></div></a>
        <a href="#/carer/me/skills" class="card p-3 flex items-center gap-2.5 active:scale-[.99]"><span class="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 grid place-items-center">${icon('shield', 'w-4.5 h-4.5')}</span><div class="min-w-0"><p class="text-[13px] font-semibold text-ink-900">Skills</p><p class="text-[11px] text-ink-400">Competency</p></div></a>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Mandatory training</p>
        <div class="card divide-y divide-ink-100">
          ${map(recs, (r) => html`<div class="p-4 flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl grid place-items-center ${trainDot[r.st]}">${icon(trainIco[r.st], 'w-4.5 h-4.5')}</span>
            <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(r.name)}</p><p class="text-xs text-ink-500">${r.renewed ? 'Renewed in learning centre · ' : `Issued ${esc(fmtDMY(r.issued))} · `}expires ${fmtDate(r.expiry)}</p></div>
            <span class="badge ${trainBadge[r.st]}">${trainLabel[r.st]}</span>
          </div>`)}
        </div>
      </div>

      <a href="#/carer/me/documents" class="btn btn-secondary btn-md w-full">${icon('file-check', 'w-4 h-4')}My compliance documents</a>
      <a href="#/carer/me/learning" class="btn btn-primary btn-md w-full">${icon('sparkles', 'w-4 h-4')}Book / start refresher training</a>
      <p class="text-[11px] text-ink-400 text-center">Status is computed from each certificate's expiry date. Completing a refresher in the learning centre updates the matrix.</p>
    </div>`
  return mobileFlow(inner)
}

/* ------------------------------------------------------------- Settings */
export function renderSettings() {
  const toggle = (label, desc, on) => html`<div class="flex items-start gap-3 py-3" x-data="{ on:${on} }">
    <div class="flex-1 min-w-0"><p class="text-sm font-medium text-ink-900">${esc(label)}</p><p class="text-xs text-ink-500">${esc(desc)}</p></div>
    <button @click="on=!on" :class="on ? 'bg-primary-600' : 'bg-ink-300'" class="relative w-11 h-6 rounded-full transition-colors shrink-0"><span :class="on ? 'translate-x-5' : ''" class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"></span></button>
  </div>`
  // §34 — accessibility toggles bound to the real (persisted) preference
  const a11yToggle = (label, desc, kind) => html`<div class="flex items-start gap-3 py-3" x-data="{ on: window.__a11yGet('${kind}') }">
    <div class="flex-1 min-w-0"><p class="text-sm font-medium text-ink-900">${esc(label)}</p><p class="text-xs text-ink-500">${esc(desc)}</p></div>
    <button @click="on=!on; window.__a11y('${kind}', on)" :class="on ? 'bg-primary-600' : 'bg-ink-300'" class="relative w-11 h-6 rounded-full transition-colors shrink-0"><span :class="on ? 'translate-x-5' : ''" class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"></span></button>
  </div>`
  const inner = html`
    ${flowHeader({ title: 'Settings', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="card px-4 divide-y divide-ink-100">
        <p class="section-title pt-3 pb-1">Notifications</p>
        ${toggle('Push notifications', 'Schedule changes & messages', true)}
        ${toggle('Medication reminders', 'Time-critical medicine alerts', true)}
      </div>
      <div class="card px-4 divide-y divide-ink-100">
        <p class="section-title pt-3 pb-1">Security</p>
        ${toggle('Face ID sign-in', 'Use biometrics to unlock', true)}
        ${toggle('Auto-lock after 5 min', 'Re-authenticate when idle', true)}
      </div>
      <div class="card px-4 divide-y divide-ink-100">
        <p class="section-title pt-3 pb-1">Accessibility</p>
        ${a11yToggle('Larger text', 'Increase text size', 'large')}
        ${a11yToggle('High contrast', 'Stronger colour contrast', 'contrast')}
      </div>
      <div class="card p-4"><p class="section-title mb-1">Language</p><select class="field field-md"><option>English (UK)</option><option>Polski</option><option>Română</option><option>Español</option></select></div>
      <p class="text-center text-xs text-ink-400">CareTask Carer · v2.4 · build 2026.06.30</p>
    </div>`
  return mobileFlow(inner)
}

/* --------------------------------------------------------- Lone-worker / SOS */
export function renderSafety() {
  const inner = html`
    ${flowHeader({ title: 'Lone-worker & safety', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{
      timer:false, shared:false, noService:false, sosState:'', retries:0,
      sos() {
        if (this.noService) {
          this.sosState = 'unsent'; this.retries = 0
          const tryAgain = () => { this.retries++; if (this.retries < 3) { setTimeout(tryAgain, 800) } else { this.sosState = 'queued'; window.__notify('No signal — SOS NOT transmitted. Queued + last-known location stored. Call 999 by phone.','error') } }
          window.__notify('No signal — retrying SOS…','warning'); setTimeout(tryAgain, 800)
        } else { this.sosState = 'sent'; window.__notify('SOS sent to office & on-call with your location','error') }
      },
      cancelSos() { /* duress-safe: silent to an onlooker, but office keeps ownership */ this.sosState=''; window.__notify('SOS cancel recorded — office retains ownership until they confirm you are safe','info') }
    }">
      <!-- SOS -->
      <div class="card p-5 text-center">
        <button @click="sos()" class="w-32 h-32 rounded-full bg-danger-500 text-white grid place-items-center mx-auto shadow-[var(--shadow-pop)] active:scale-95 ring-8 ring-danger-100">
          <span class="flex flex-col items-center">${icon('alert', 'w-9 h-9')}<span class="text-lg font-bold mt-1">SOS</span></span>
        </button>
        <p class="text-xs text-ink-500 mt-3">Hold to alert the office & on-call manager with your location.</p>
        <template x-if="sosState==='sent'"><div class="mt-3 rounded-lg bg-success-50 ring-1 ring-success-100 p-2 text-xs text-success-700">${icon('check-circle', 'w-3.5 h-3.5')} Delivered — office has ownership. <button @click="cancelSos()" class="underline">Cancel (safe)</button></div></template>
        <template x-if="sosState==='unsent'"><div class="mt-3 rounded-lg bg-warning-50 ring-1 ring-warning-100 p-2 text-xs text-warning-800">${icon('wifi', 'w-3.5 h-3.5')} Retrying… (<span x-text="retries"></span>/3)</div></template>
        <template x-if="sosState==='queued'"><div class="mt-3 rounded-lg bg-danger-50 ring-1 ring-danger-200 p-2 text-xs text-danger-800 text-left">${icon('alert', 'w-3.5 h-3.5')} <b>Not transmitted.</b> Queued to send when signal returns; last-known location stored. <b>Call 999 by phone now.</b> The office will also see your missed check-in. <button @click="cancelSos()" class="underline">Cancel (duress-safe)</button></div></template>
      </div>
      <!-- §22.4 carer-directed-harm + §22.5 no-service simulation -->
      <div class="grid grid-cols-2 gap-2">
        <button @click="window.__nav('/carer/visit/' + 'v-mary-am')" class="card p-3 text-left"><span class="w-8 h-8 rounded-xl bg-danger-50 text-danger-600 grid place-items-center mb-1.5">${icon('shield', 'w-4 h-4')}</span><p class="text-xs font-semibold text-ink-900">I feel unsafe / harm to me</p><p class="text-xs text-ink-500">Report carer-directed harm</p></button>
        <label class="card p-3 text-left cursor-pointer"><span class="w-8 h-8 rounded-xl bg-ink-100 text-ink-500 grid place-items-center mb-1.5">${icon('wifi', 'w-4 h-4')}</span><p class="text-xs font-semibold text-ink-900">Simulate no signal</p><label class="flex items-center gap-1.5 text-xs text-ink-500"><input type="checkbox" x-model="noService" class="w-3.5 h-3.5 rounded" />SOS-no-service test</label></label>
      </div>
      <!-- safety timer -->
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 grid place-items-center">${icon('clock', 'w-5 h-5')}</span>
          <div class="flex-1"><p class="text-sm font-semibold text-ink-900">Safety timer</p><p class="text-xs text-ink-500" x-text="timer ? 'Active — check-in due in 20 min' : 'Off — start when entering a visit'"></p></div>
          <button @click="timer=!timer; window.__notify(timer?'Safety timer started':'Safety timer stopped', timer?'success':'info')" :class="timer ? 'btn-danger' : 'btn-secondary'" class="btn btn-sm" x-text="timer ? 'Stop' : 'Start'"></button>
        </div>
      </div>
      <!-- share location -->
      <div class="card p-4 flex items-center gap-3">
        <span class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 grid place-items-center">${icon('map-pin', 'w-5 h-5')}</span>
        <div class="flex-1"><p class="text-sm font-semibold text-ink-900">Share live location</p><p class="text-xs text-ink-500" x-text="shared ? 'Sharing with office' : 'Off'"></p></div>
        <button @click="shared=!shared; window.__notify(shared?'Location shared with office':'Location sharing off','info')" :class="shared ? 'bg-primary-600' : 'bg-ink-300'" class="relative w-11 h-6 rounded-full transition-colors shrink-0"><span :class="shared ? 'translate-x-5' : ''" class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"></span></button>
      </div>
      <!-- safe arrival -->
      <button @click="window.__notify('Safe-arrival check-in sent','success')" class="btn btn-teal btn-md w-full">${icon('check-circle', 'w-4 h-4')}Send safe-arrival check-in</button>
      <a href="#/carer/oncall" class="btn btn-secondary btn-md w-full">${icon('bell', 'w-4 h-4')}On-call & emergency contacts</a>
    </div>`
  return mobileFlow(inner)
}
