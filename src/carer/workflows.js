/** P5 — sensitive & operational workflows: death (§55.4), absence & fitness (§55.5), feedback & whistleblowing (§25). */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'

/* ======================================================= Death workflow (§55.4) */
export function renderDeathWorkflow() {
  const contact = (label, sub, ic, tone) => html`<button onclick="window.__notify('Calling ${esc(label)}…','info')" class="w-full text-left rounded-lg ring-1 ring-ink-200 p-3 flex items-center gap-3 active:scale-[.99]">
    <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0 ${tone}">${icon(ic, 'w-4.5 h-4.5')}</span>
    <div class="flex-1 min-w-0"><p class="text-[13px] font-semibold text-ink-800">${esc(label)}</p><p class="text-[11px] text-ink-400">${esc(sub)}</p></div>
    ${icon('mobile', 'w-4 h-4 text-ink-300')}
  </button>`

  const stepRow = (n, title, body) => html`<div class="flex gap-3">
    <span class="w-7 h-7 rounded-full bg-primary-50 text-primary-700 grid place-items-center text-[13px] font-bold shrink-0">${n}</span>
    <div class="min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(title)}</p><p class="text-[13px] text-ink-600">${esc(body)}</p></div>
  </div>`

  const unexpectedSteps = [
    ['Call 999 immediately', 'Request emergency services. Follow the call handler’s instructions.'],
    ['Do not move the person', 'Leave the person and surroundings undisturbed. Do not remove or tidy anything.'],
    ['Note the time found', 'Record the exact time you found the person and what you observed, factually.'],
    ['Begin CPR only if appropriate', 'Check the DNACPR / ReSPECT status above before starting any resuscitation.'],
    ['Stay until help arrives', 'Remain with the person and provide information to attending professionals.'],
  ]
  const expectedSteps = [
    ['Follow the anticipatory care plan', 'Refer to the end-of-life / anticipatory plan and agreed wishes.'],
    ['Contact GP or on-call clinician', 'Notify the GP practice, or the out-of-hours / on-call service if outside hours.'],
    ['Verification of death', 'Verification must be completed by an appropriate professional (GP or trained nurse).'],
    ['Support anyone present', 'Offer calm, dignified support to family or others present.'],
    ['Record factually', 'Note the time, who was contacted, and actions taken. Do not certify the cause.'],
  ]

  const inner = html`
    ${flowHeader({ title: 'When someone dies', subtitle: 'Calm, step-by-step guidance', back: '#/carer' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ kind:'', step:1 }">

      <!-- DNACPR / ReSPECT surfaced first -->
      <div class="card p-4 ring-2 ring-primary-200 bg-primary-50/60">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-primary-700 mb-1 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Resuscitation status — check first</p>
        <p class="text-base font-bold text-ink-900">ReSPECT in place — not for CPR</p>
        <p class="text-[12px] text-ink-500 mt-1">A valid DNACPR / ReSPECT decision is recorded. Respect the person’s documented wishes before taking any action.</p>
      </div>

      <div class="rounded-xl bg-teal-50 ring-1 ring-teal-100 p-3 text-[13px] text-teal-800 flex items-center gap-2">${icon('info', 'w-4 h-4')}Take a breath. Follow the steps calmly. The office is here to support you.</div>

      <!-- choose expected / unexpected -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Is this an expected or unexpected death?</p>
        <div class="grid grid-cols-2 gap-2.5">
          <button @click="kind='expected'" :class="kind==='expected' ? 'ring-2 ring-primary-500 bg-primary-50' : 'ring-1 ring-ink-200'" class="card p-3.5 text-center active:scale-[.99]">
            <span class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 grid place-items-center mx-auto mb-1.5">${icon('heart', 'w-5 h-5')}</span>
            <p class="text-sm font-semibold text-ink-900">Expected</p><p class="text-[11px] text-ink-400">Anticipated / on end-of-life plan</p>
          </button>
          <button @click="kind='unexpected'" :class="kind==='unexpected' ? 'ring-2 ring-danger-500 bg-danger-50' : 'ring-1 ring-ink-200'" class="card p-3.5 text-center active:scale-[.99]">
            <span class="w-10 h-10 rounded-xl bg-danger-50 text-danger-600 grid place-items-center mx-auto mb-1.5">${icon('alert', 'w-5 h-5')}</span>
            <p class="text-sm font-semibold text-ink-900">Unexpected</p><p class="text-[11px] text-ink-400">Sudden / no anticipatory plan</p>
          </button>
        </div>
      </div>

      <!-- adaptive guidance -->
      <div x-show="kind==='unexpected'" x-cloak class="card p-4 space-y-3">
        <p class="text-sm font-semibold text-danger-700 flex items-center gap-1.5">${icon('alert', 'w-4 h-4')}Unexpected death — immediate steps</p>
        ${map(unexpectedSteps, (s, i) => stepRow(i + 1, s[0], s[1]))}
      </div>

      <div x-show="kind==='expected'" x-cloak class="card p-4 space-y-3">
        <p class="text-sm font-semibold text-primary-700 flex items-center gap-1.5">${icon('heart', 'w-4 h-4')}Expected death — following the plan</p>
        ${map(expectedSteps, (s, i) => stepRow(i + 1, s[0], s[1]))}
      </div>

      <!-- contacts log -->
      <div class="card p-4">
        <p class="text-sm font-semibold text-ink-900 mb-1">Contacts log</p>
        <p class="text-[12px] text-ink-400 mb-2.5">Each call is time-stamped and recorded (who / when).</p>
        <div class="space-y-2">
          ${contact('999 emergency services', 'Ambulance / police', 'alert', 'bg-danger-50 text-danger-600')}
          ${contact('On-call manager', 'CareTask out-of-hours line', 'bell', 'bg-warning-50 text-warning-600')}
          ${contact('GP / on-call clinician', 'For verification of death', 'cross', 'bg-primary-50 text-primary-600')}
          ${contact('Family / next of kin', 'As recorded in the care plan', 'users', 'bg-teal-50 text-teal-600')}
        </div>
      </div>

      <!-- sensitive suspension -->
      <div class="card p-4">
        <div class="flex items-start gap-3">
          <span class="w-9 h-9 rounded-lg bg-ink-100 text-ink-500 grid place-items-center shrink-0">${icon('calendar', 'w-4.5 h-4.5')}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ink-900">Remaining visits</p>
            <p class="text-[13px] text-ink-600">Your remaining visits with this person are sensitively suspended. Notifications to colleagues are privacy-preserving and do not share details.</p>
          </div>
        </div>
        <button onclick="window.__notify('Remaining visits sensitively suspended','info')" class="btn btn-secondary btn-md w-full mt-3">${icon('calendar', 'w-4 h-4')}Suspend remaining visits</button>
      </div>

      <button onclick="window.__notify('Recorded and the office has been notified','success')" class="btn btn-primary btn-md w-full">${icon('check-circle', 'w-4 h-4')}Record and notify office</button>
    </div>`
  return mobileFlow(inner)
}

/* ================================================= Absence & fitness to work (§55.5) */
export function renderAbsence() {
  const action = (ic, tone, title, sub, msg, type) => html`<button onclick="window.__notify('${esc(msg)}','${type}')" class="w-full text-left card p-3.5 flex items-center gap-3 active:scale-[.99]">
    <span class="w-10 h-10 rounded-xl grid place-items-center shrink-0 ${tone}">${icon(ic, 'w-5 h-5')}</span>
    <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(title)}</p><p class="text-xs text-ink-400">${esc(sub)}</p></div>
    ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
  </button>`

  const inner = html`
    ${flowHeader({ title: 'Absence & fitness to work', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">

      <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-[13px] text-info-800 flex items-center gap-2">${icon('info', 'w-4 h-4')}Replacement cover: office notified automatically — 2 of 3 affected visits recovered.</div>

      <div class="space-y-2">
        ${action('thermometer', 'bg-warning-50 text-warning-600', 'Report sickness', 'Off sick today — office & payroll notified', 'Sickness reported to the office', 'warning')}
      </div>

      <!-- can't attend a shift, with reason -->
      <div class="card p-4" x-data="{ reason:'' }">
        <div class="flex items-center gap-3 mb-2.5">
          <span class="w-10 h-10 rounded-xl bg-warning-50 text-warning-600 grid place-items-center shrink-0">${icon('calendar', 'w-5 h-5')}</span>
          <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Can’t attend a shift</p><p class="text-xs text-ink-400">Give as much notice as you can</p></div>
        </div>
        <label class="label">Reason</label>
        <select class="field field-md" x-model="reason">
          <option value="">Select a reason…</option>
          <option>Illness</option>
          <option>Family emergency</option>
          <option>Transport / travel problem</option>
          <option>Childcare</option>
          <option>Other</option>
        </select>
        <button @click="window.__notify(reason ? 'Can’t-attend reported: '+reason : 'Can’t-attend reported to the office','warning')" class="btn btn-secondary btn-md w-full mt-3">${icon('bell', 'w-4 h-4')}Report can’t attend</button>
      </div>

      <div class="space-y-2">
        ${action('alert', 'bg-danger-50 text-danger-600', 'Emergency shift relinquishment', 'Hand back your current shift urgently', 'Emergency relinquishment sent — on-call manager alerted', 'warning')}
      </div>

      <!-- fit-to-work declaration -->
      <div class="card p-4" x-data="{ fit:false }">
        <div class="flex items-start gap-3">
          <span class="w-10 h-10 rounded-xl bg-success-50 text-success-600 grid place-items-center shrink-0">${icon('check-circle', 'w-5 h-5')}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ink-900">Fit-to-work declaration</p>
            <p class="text-xs text-ink-400" x-text="fit ? 'Declared fit for today’s shifts' : 'Confirm you are fit and rested to work'"></p>
          </div>
          <button @click="fit=!fit; window.__notify(fit?'Fit-to-work declared':'Fit-to-work declaration withdrawn', fit?'success':'warning')" :class="fit ? 'bg-success-600' : 'bg-ink-300'" class="relative w-11 h-6 rounded-full transition-colors shrink-0"><span :class="fit ? 'translate-x-5' : ''" class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"></span></button>
        </div>
      </div>

      <div class="space-y-2">
        ${action('droplet', 'bg-warning-50 text-warning-600', 'Report exposure / infection', 'e.g. contact with an infectious illness', 'Exposure / infection reported to the office', 'warning')}
        ${action('activity', 'bg-danger-50 text-danger-600', 'Report occupational injury', 'An injury sustained at work', 'Occupational injury reported — RIDDOR check started', 'warning')}
      </div>
    </div>`
  return mobileFlow(inner)
}

/* ============================================ Feedback & whistleblowing (§25) */
export function renderFeedback() {
  const inner = html`
    ${flowHeader({ title: 'Feedback & whistleblowing', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ category:'', text:'', anon:false }">

      <div class="rounded-xl bg-teal-50 ring-1 ring-teal-100 p-3 text-[13px] text-teal-800 flex items-center gap-2">${icon('shield', 'w-4 h-4')}Whistleblowing is confidential and protected. You can raise a concern without fear of reprisal.</div>

      <div class="card p-4 space-y-3">
        <div>
          <label class="label">Category</label>
          <select class="field field-md" x-model="category">
            <option value="">Choose a category…</option>
            <option>Suggestion</option>
            <option>Compliment</option>
            <option>Complaint</option>
            <option>Concern about care</option>
            <option>Whistleblowing</option>
          </select>
        </div>

        <div>
          <label class="label">Your message</label>
          <textarea x-model="text" rows="5" class="field field-md" placeholder="Tell us what happened or what you’d like to share…"></textarea>
        </div>

        <div class="flex items-start gap-3 pt-1">
          <div class="flex-1 min-w-0"><p class="text-sm font-medium text-ink-800">Submit anonymously</p><p class="text-xs text-ink-400">Your name won’t be attached to this submission</p></div>
          <button @click="anon=!anon" :class="anon ? 'bg-primary-600' : 'bg-ink-300'" class="relative w-11 h-6 rounded-full transition-colors shrink-0"><span :class="anon ? 'translate-x-5' : ''" class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"></span></button>
        </div>

        <button @click="window.__notify(anon ? 'Submitted anonymously — thank you' : 'Feedback submitted — thank you','success')" class="btn btn-primary btn-md w-full">${icon('check', 'w-4 h-4')}Submit</button>
      </div>

      <a href="#/carer/me/help" class="card p-3.5 flex items-center gap-3 active:scale-[.99]">
        <span class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 grid place-items-center">${icon('file-check', 'w-4.5 h-4.5')}</span>
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Policies & procedures</p><p class="text-xs text-ink-400">Complaints, safeguarding & whistleblowing</p></div>
        ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
      </a>
    </div>`
  return mobileFlow(inner)
}
