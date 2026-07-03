/** §29 (AC-29.4/5) — My documents: carer submits compliance docs; office verifies. */
import { html, esc, map } from '../lib/dom.js'
import { fmtDMY } from '../lib/dates.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { STAFF_DOCS } from '../data/carer.js'

/* Status → badge presentation (tone + label). Verified state is office-owned. */
const STATUS = {
  verified: { tone: 'success', label: 'Verified' },
  submitted: { tone: 'info', label: 'Submitted — awaiting office' },
  expiring: { tone: 'warning', label: 'Expiring soon' },
  missing: { tone: 'danger', label: 'Missing' },
}

/* Action button per status. Verified/office-owned states can't be self-approved. */
function docAction(doc) {
  switch (doc.status) {
    case 'missing':
      return html`<button onclick="window.__notify('Document submitted — the office will verify it','success')" class="btn btn-primary btn-sm">${icon('file-check', 'w-4 h-4')}Upload</button>`
    case 'expiring':
      return html`<button onclick="window.__notify('Document submitted — the office will verify it','success')" class="btn btn-primary btn-sm">${icon('file-check', 'w-4 h-4')}Re-submit updated</button>`
    case 'submitted':
      return html`<button disabled class="btn btn-secondary btn-sm opacity-60 cursor-not-allowed">${icon('clock', 'w-4 h-4')}Awaiting office</button>`
    case 'verified':
      return html`<button onclick="window.__notify('New version submitted — awaiting office verification','info')" class="btn btn-secondary btn-sm">${icon('download', 'w-4 h-4')}Replace</button>`
    default:
      return ''
  }
}

function docCard(doc) {
  const s = STATUS[doc.status] || STATUS.submitted
  return html`<div class="card p-4">
    <div class="flex items-start gap-3">
      <span class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon('file-check', 'w-4 h-4')}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-ink-900 truncate">${esc(doc.name)}</p>
        <p class="text-xs text-ink-500 truncate">${esc(doc.kind)}</p>
      </div>
      <span class="badge bg-${s.tone}-50 text-${s.tone}-700 ring-${s.tone}-100 shrink-0">${esc(s.label)}</span>
    </div>
    ${doc.expiry
      ? html`<p class="text-xs mt-2 flex items-center gap-1.5 ${doc.status === 'expiring' ? 'text-warning-700 font-medium' : 'text-ink-500'}">${icon('calendar', 'w-3.5 h-3.5')}Expires ${esc(fmtDMY(doc.expiry))}</p>`
      : ''}
    ${doc.status === 'verified' && doc.verifiedBy
      ? html`<p class="text-xs mt-1.5 flex items-center gap-1.5 text-success-700">${icon('check-circle', 'w-3.5 h-3.5')}Verified by ${esc(doc.verifiedBy)}${doc.updated ? ' · ' + esc(fmtDMY(doc.updated)) : ''}</p>`
      : ''}
    <div class="mt-3 flex justify-end">${docAction(doc)}</div>
  </div>`
}

export function renderStaffDocs() {
  const needAction = STAFF_DOCS.filter((d) => d.status === 'missing' || d.status === 'expiring').length

  const summary = needAction > 0
    ? html`<div class="rounded-xl bg-warning-50 ring-1 ring-warning-100 p-3 text-sm text-warning-800 flex items-center gap-2">${icon('alert', 'w-4 h-4')}${needAction} document${needAction === 1 ? '' : 's'} need${needAction === 1 ? 's' : ''} your attention</div>`
    : html`<div class="rounded-xl bg-success-50 ring-1 ring-success-100 p-3 text-sm text-success-700 flex items-center gap-2">${icon('check-circle', 'w-4 h-4')}All documents up to date</div>`

  const inner = html`
    ${flowHeader({ title: 'My documents', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">

      <!-- intro -->
      <div class="card p-4 flex items-start gap-3">
        <span class="w-9 h-9 rounded-xl bg-info-50 text-info-600 grid place-items-center shrink-0">${icon('info', 'w-4 h-4')}</span>
        <p class="text-xs text-ink-600 leading-relaxed">Upload your own compliance documents here. You submit — the office verifies. The "Verified" status is set by the office; you can't self-approve.</p>
      </div>

      <!-- summary strip -->
      ${summary}

      <!-- documents -->
      <div class="space-y-3">${map(STAFF_DOCS, docCard)}</div>

      <!-- regulatory footer -->
      <div class="card p-4 flex items-start gap-3 bg-info-50/60 ring-info-100">
        <span class="w-9 h-9 rounded-xl bg-info-50 text-info-600 grid place-items-center shrink-0">${icon('shield', 'w-4 h-4')}</span>
        <p class="text-xs text-ink-600 leading-relaxed">Verification is a regulated employer duty (CQC Reg 19). Submitting a document sends it to the office for review — it isn't active until they verify it.</p>
      </div>
    </div>`
  return mobileFlow(inner)
}
