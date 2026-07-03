/**
 * E10 — Carer reports (§29b) + field print/export hardening (§29a AC-29a.6).
 * Reports are scoped to the carer's own work; sharing a document requires
 * recipient verification, a reason, a watermark, an expiry and an approved
 * target — never a permanent file in Downloads.
 */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { SHARE_TARGETS } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'

export function renderReports() {
  const meds = carerStore.allMeds().length
  const obs = carerStore.allObservations().length
  const incidents = carerStore.allIncidents().length
  const REPORTS = [
    { ic: 'calendar', label: 'My visit history', note: 'Visits, times & outcomes', tone: 'bg-primary-50 text-primary-600' },
    { ic: 'clock', label: 'Hours & earnings', note: 'This week: 32h · £402 est.', tone: 'bg-teal-50 text-teal-600' },
    { ic: 'file-check', label: 'CPD & training log', note: '4 modules · 2 expiring', tone: 'bg-warning-50 text-warning-600' },
    { ic: 'shield', label: 'My compliance', note: 'DBS, right-to-work, competencies', tone: 'bg-success-50 text-success-600' },
    { ic: 'activity', label: 'Care I recorded', note: `${meds} eMAR · ${obs} obs · ${incidents} incidents`, tone: 'bg-ink-100 text-ink-500' },
  ]
  const inner = html`
    ${flowHeader({ title: 'My reports', subtitle: 'Within your access scope', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
      <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-[13px] text-info-800 flex items-start gap-2">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')}<span>Reports cover your own work only. Client-identifiable exports go through the hardened share flow.</span></div>
      ${map(REPORTS, (r) => html`<button onclick="window.__notify('Generating ${esc(r.label)}…','info')" class="w-full text-left card p-3.5 flex items-center gap-3 active:scale-[.99]">
        <span class="w-10 h-10 rounded-xl grid place-items-center ${r.tone}">${icon(r.ic, 'w-5 h-5')}</span>
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(r.label)}</p><p class="text-xs text-ink-400">${esc(r.note)}</p></div>
        ${icon('chevron-right', 'w-4 h-4 text-ink-300')}
      </button>`)}
      <a href="#/carer/export" class="w-full text-left card p-3.5 flex items-center gap-3 active:scale-[.99]"><span class="w-10 h-10 rounded-xl bg-danger-50 text-danger-600 grid place-items-center">${icon('download', 'w-5 h-5')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Share / export a document</p><p class="text-xs text-ink-400">Hardened field export — verified recipient only</p></div>${icon('chevron-right', 'w-4 h-4 text-ink-300')}</a>
    </div>`
  return mobileFlow(inner)
}

/** §29a AC-29a.6 — hardened export: recipient verify, reason, watermark, expiry, approved target. */
export function renderExport() {
  const inner = html`
    ${flowHeader({ title: 'Share document', subtitle: 'Hardened field export', back: '#/carer/reports' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{
      doc: '', target: '', reason: '', recipient: '', confirmRecipient: '', watermark: true, expiry: '24h', preview: false,
      get ready() { return this.doc && this.target && this.reason.trim() && this.recipient.trim() && this.recipient === this.confirmRecipient },
      share() {
        if (!this.doc || !this.target) { window.__notify('Choose a document and an approved target','warning'); return }
        if (!this.reason.trim()) { window.__notify('A share reason is required','warning'); return }
        if (this.recipient !== this.confirmRecipient || !this.recipient.trim()) { window.__notify('Recipient must be verified (enter twice)','warning'); return }
        window.__notify('Shared to '+this.target+' — watermarked, expires in '+this.expiry+', audited','success')
      }
    }">
      <div class="rounded-xl bg-warning-50 ring-1 ring-warning-100 p-3 text-[13px] text-warning-800 flex items-start gap-2">${icon('shield', 'w-4 h-4 mt-0.5 shrink-0')}<span>No file is saved to the device. The document is watermarked with your name & time, expires automatically, and both success and failure are audited.</span></div>
      <div class="card p-4 space-y-3">
        <div><label class="label">Document</label><select x-model="doc" class="field field-md"><option value="">Select…</option>${map(['Care plan (v4)', 'MAR chart', 'Risk assessment', 'Body map history', 'Hospital passport'], (d) => `<option>${esc(d)}</option>`)}</select></div>
        <div><label class="label">Approved recipient</label><select x-model="target" class="field field-md"><option value="">Select…</option>${map(SHARE_TARGETS, (t) => `<option>${esc(t)}</option>`)}</select><p class="text-[11px] text-ink-400 mt-1">Only approved, secure targets — no personal email or messaging.</p></div>
        <div><label class="label">Recipient name (verify)</label><input x-model="recipient" class="field field-md" placeholder="e.g. Nurse J. Owens" /></div>
        <div><label class="label">Confirm recipient name</label><input x-model="confirmRecipient" class="field field-md" placeholder="Type it again" /><template x-if="recipient && confirmRecipient && recipient!==confirmRecipient"><p class="text-[11px] text-danger-600 mt-1">Names don't match.</p></template></div>
        <div><label class="label">Reason for sharing</label><input x-model="reason" class="field field-md" placeholder="e.g. District nurse wound review" /></div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="label">Expiry</label><select x-model="expiry" class="field field-sm"><option>1h</option><option>24h</option><option>72h</option></select></div>
          <label class="flex items-end gap-2 text-[13px] text-ink-700 pb-2"><input type="checkbox" x-model="watermark" class="w-4 h-4 rounded" />Watermark</label>
        </div>
        <button @click="share()" class="btn btn-primary btn-md w-full" :class="ready ? '' : 'opacity-60'">${icon('link', 'w-4 h-4')}Share securely</button>
      </div>
    </div>`
  return mobileFlow(inner)
}
