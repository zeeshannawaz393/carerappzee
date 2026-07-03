/** MY PROFILE & RECORD — the carer's own HR record: personal details, next of kin,
 *  employment (branches + history) and the periodic checks required by CQC (Reg 19 /
 *  Schedule 3) and the Home Office (right-to-work). Read-only for the carer; the office
 *  owns verification. Data: CARER_PROFILE in ../data/carer.js. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { CARER_PROFILE as P } from '../data/carer.js'
import { session } from './session.js'

const CHECK_TONE = { valid: 'bg-success-50 text-success-700 ring-success-100', due: 'bg-warning-50 text-warning-700 ring-warning-100', overdue: 'bg-danger-50 text-danger-700 ring-danger-100' }
const CHECK_LABEL = { valid: 'Valid', due: 'Due soon', overdue: 'Overdue' }

/** A labelled detail row (definition-list style). */
const detail = (label, value) => `<div class="flex items-start justify-between gap-3 py-2.5"><span class="text-xs text-ink-500 shrink-0">${esc(label)}</span><span class="text-sm font-medium text-ink-900 text-right min-w-0">${value || '<span class="text-ink-400">—</span>'}</span></div>`

export function renderProfile() {
  const c = session.carer()
  const initials = P.name.split(' ').map((w) => w[0]).join('').slice(0, 2)
  const dueCount = P.checks.filter((k) => k.status !== 'valid').length

  const inner = html`
    ${flowHeader({ title: 'My profile', subtitle: 'Personal & employment record', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">

      <!-- identity -->
      <div class="card p-4 flex items-center gap-4">
        <span class="w-14 h-14 rounded-full bg-primary-100 text-primary-700 grid place-items-center text-lg font-bold shrink-0">${esc(initials)}</span>
        <div class="min-w-0"><p class="text-base font-semibold text-ink-900 truncate">${esc(P.name)}</p><p class="text-xs text-ink-500">${esc(P.role)} · ${esc(c.org)}</p><p class="text-xs text-ink-400 mt-0.5">Employee ${esc(P.employeeId)} · since ${esc(P.startDate)}</p></div>
      </div>

      <!-- checks & clearances (CQC Reg 19 + Home Office) -->
      <div>
        <div class="flex items-baseline justify-between mb-2">
          <p class="section-title">Checks & clearances</p>
          ${dueCount ? `<span class="text-xs font-medium text-warning-600">${dueCount} due</span>` : `<span class="text-xs font-medium text-success-600">All valid</span>`}
        </div>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${map(P.checks, (k) => `<div class="p-4 flex items-start gap-3">
            <span class="w-9 h-9 rounded-xl bg-ink-100 text-ink-600 grid place-items-center shrink-0">${icon('shield', 'w-4 h-4')}</span>
            <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(k.name)}</p><p class="text-xs text-ink-500">${esc(k.detail)}</p>${k.due ? `<p class="text-xs mt-0.5 ${k.status === 'valid' ? 'text-ink-400' : 'text-warning-700 font-medium'}">${icon('calendar', 'w-3 h-3 inline')} ${esc(k.due)}</p>` : ''}</div>
            <span class="badge ${CHECK_TONE[k.status]} shrink-0">${esc(CHECK_LABEL[k.status] || k.status)}</span>
          </div>`)}
        </div>
        <a href="#/carer/me/documents" class="btn btn-secondary btn-sm w-full mt-2.5">${icon('file-check', 'w-4 h-4')}Upload or update a document</a>
      </div>

      <!-- personal details -->
      <div class="card p-4">
        <p class="section-title mb-1">Personal details</p>
        <div class="divide-y divide-ink-100">
          ${detail('Date of birth', esc(P.dob))}
          ${detail('National Insurance', `<span class="font-mono">${esc(P.ni)}</span>`)}
          ${detail('Phone', esc(P.phone))}
          ${detail('Email', esc(P.email))}
          ${detail('Address', esc(P.address))}
        </div>
        <button onclick="window.__notify('Change request sent to the office','info')" class="btn btn-ghost btn-sm mt-2">${icon('edit', 'w-3.5 h-3.5')}Request a change</button>
      </div>

      <!-- next of kin -->
      <div class="card p-4">
        <p class="section-title mb-1 flex items-center gap-1.5">${icon('user-check', 'w-3.5 h-3.5')}Next of kin / emergency contact</p>
        <div class="divide-y divide-ink-100">
          ${detail('Name', esc(P.nextOfKin.name))}
          ${detail('Relationship', esc(P.nextOfKin.relationship))}
          ${detail('Phone', esc(P.nextOfKin.phone))}
        </div>
      </div>

      <!-- employment + branches -->
      <div class="card p-4">
        <p class="section-title mb-1">Employment</p>
        <div class="divide-y divide-ink-100">
          ${detail('Role', esc(P.role))}
          ${detail('Contract', esc(P.contract))}
          ${detail('Probation', esc(P.probation))}
          ${detail('Notice period', esc(P.notice))}
          ${detail('Line manager', esc(P.lineManager))}
          ${detail('Start date', esc(P.startDate))}
          ${detail('Home branch', esc(P.homeBranch))}
        </div>
        <div class="mt-3">
          <p class="text-xs text-ink-500 mb-1.5">${P.allBranches ? 'Works across' : 'Also works at'}</p>
          <div class="flex flex-wrap gap-1.5">
            ${P.allBranches
              ? `<span class="badge bg-primary-50 text-primary-700 ring-primary-100">${icon('users', 'w-3 h-3')}All branches</span>`
              : map(P.branches.filter((b) => b !== P.homeBranch), (b) => `<span class="badge bg-ink-100 text-ink-700 ring-ink-200">${esc(b)}</span>`) || '<span class="text-xs text-ink-400">Home branch only</span>'}
          </div>
        </div>
      </div>

      <!-- employment history (Schedule 3) -->
      <div>
        <p class="section-title mb-2">Employment history</p>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${map(P.employmentHistory, (h) => `<div class="p-4">
            <div class="flex items-start justify-between gap-3">
              <p class="text-sm font-semibold text-ink-900">${esc(h.employer)}</p>
              <span class="text-xs text-ink-500 shrink-0 tabular-nums">${esc(h.period)}</span>
            </div>
            ${h.role ? `<p class="text-xs text-ink-500 mt-0.5">${esc(h.role)}</p>` : ''}
            <p class="text-xs mt-1 inline-flex items-center gap-1 ${/gap/i.test(h.note) ? 'text-warning-700' : 'text-success-700'}">${icon(/gap/i.test(h.note) ? 'info' : 'check-circle', 'w-3.5 h-3.5')}${esc(h.note)}</p>
          </div>`)}
        </div>
      </div>

      <!-- regulatory footer -->
      <div class="card p-4 flex items-start gap-3 bg-info-50/60 ring-info-100">
        <span class="w-9 h-9 rounded-xl bg-info-50 text-info-600 grid place-items-center shrink-0">${icon('shield', 'w-4 h-4')}</span>
        <p class="text-xs text-ink-600 leading-relaxed">Your record is held to meet CQC Regulation 19 (fit &amp; proper persons — Schedule 3) and Home Office right-to-work duties. The office maintains and verifies it; ask them to correct anything that's wrong.</p>
      </div>
    </div>`
  return mobileFlow(inner)
}
