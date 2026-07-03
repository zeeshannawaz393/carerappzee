/** §28 — Skills & competency: two tracks (e-learning completion + observed sign-off). */
import { html, esc, map } from '../lib/dom.js'
import { fmtDMY } from '../lib/dates.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { SKILLS, SKILL_TO_COURSE, LEARNING_COURSES } from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'

const GATE_LABEL = {
  'medication': 'medication',
  'moving-handling': 'moving & handling',
  'catheter': 'catheter care',
  'peg': 'PEG feeding',
  'insulin': 'insulin administration',
}

const STATUS = {
  valid: { tone: 'success', label: 'Competent' },
  expiring: { tone: 'warning', label: 'Expiring' },
  'pending-signoff': { tone: 'warning', label: 'Awaiting sign-off' },
  'not-held': { tone: 'ink', label: 'Not held' },
}

function badge(tone, text) {
  return html`<span class="badge bg-${tone}-50 text-${tone}-700 ring-${tone}-100">${esc(text)}</span>`
}

/* --------------------------------------------- learning → skills wiring */
/** True when the mapped learning course is complete — live (persisted) state
 *  wins, falling back to the seeded course status. This is what makes the
 *  e-learning track dynamic: completing the course in the learning centre
 *  flips this skill's e-learning track to Complete. */
function courseComplete(courseId) {
  const st = carerStore.courseState(courseId)          // live completion (persisted)
  if (st && st.status === 'complete') return true
  const seed = LEARNING_COURSES.find((c) => c.id === courseId)  // seeded completion
  return !!(seed && seed.status === 'complete')
}

/* -------------------------------------------------------- track rows */
function elearningRow(elearning) {
  const map_ = {
    complete: { tone: 'success', ic: 'check-circle', label: 'Complete' },
    due: { tone: 'warning', ic: 'clock', label: 'Refresher due' },
    '—': { tone: 'ink', ic: 'file-check', label: '—' },
  }
  const e = map_[elearning] || map_['—']
  return html`<div class="flex items-start gap-2.5">
    ${icon(e.ic, `w-4 h-4 mt-0.5 text-${e.tone}-500 shrink-0`)}
    <div class="min-w-0">
      <p class="text-[11px] font-medium uppercase tracking-wide text-ink-400">E-learning</p>
      <p class="text-sm font-medium text-${e.tone === 'ink' ? 'ink-500' : e.tone + '-700'}">${esc(e.label)}</p>
    </div>
  </div>`
}

function observedRow(s) {
  let ic, tone, primary, secondary
  if (s.observed === 'signed-off') {
    ic = 'user-check'; tone = 'success'
    primary = `Signed off by ${esc(s.signedBy)} · ${esc(fmtDMY(s.signedDate))}`
    secondary = s.expiry ? `Expires ${esc(fmtDMY(s.expiry))}` : ''
  } else if (s.observed === 'pending') {
    ic = 'clock'; tone = 'warning'
    primary = 'Awaiting senior sign-off'
    secondary = ''
  } else {
    ic = 'flag'; tone = 'ink'
    primary = 'Not yet started'
    secondary = ''
  }
  return html`<div class="flex items-start gap-2.5">
    ${icon(ic, `w-4 h-4 mt-0.5 text-${tone}-500 shrink-0`)}
    <div class="min-w-0">
      <p class="text-[11px] font-medium uppercase tracking-wide text-ink-400">Observed sign-off</p>
      <p class="text-sm font-medium text-${tone === 'ink' ? 'ink-500' : tone + '-700'}">${primary}</p>
      ${secondary ? `<p class="text-xs text-ink-500 mt-0.5">${secondary}</p>` : ''}
    </div>
  </div>`
}

/* ---------------------------------------------------------- skill card */
function skillCard(s) {
  const st = STATUS[s.status] || STATUS['not-held']
  const gateText = GATE_LABEL[s.gated] || s.gated
  const showGateWarn = (s.status === 'expiring' || s.status === 'pending-signoff' || s.status === 'not-held')
  // Effective e-learning status — dynamic once the mapped course is completed.
  const mapped = SKILL_TO_COURSE[s.id]
  const elearning = (mapped && courseComplete(mapped)) ? 'complete' : s.elearning
  // E-learning done but observation still outstanding — reinforce the two-track gate.
  const awaitingObservation = (elearning === 'complete' && s.observed !== 'signed-off')
  return html`<div class="card p-4 space-y-3">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-ink-900 leading-tight">${esc(s.name)}</h3>
        <span class="badge bg-teal-50 text-teal-700 ring-teal-100 mt-1.5">${icon('shield', 'w-3 h-3')}gates ${esc(gateText)}</span>
      </div>
      ${badge(st.tone, st.label)}
    </div>

    <div class="rounded-xl bg-ink-50 ring-1 ring-ink-100 divide-y divide-ink-100">
      <div class="p-3">${elearningRow(elearning)}</div>
      <div class="p-3">${observedRow(s)}</div>
    </div>

    ${awaitingObservation ? html`<div class="flex items-start gap-2.5 rounded-xl bg-info-50 ring-1 ring-info-100 p-3">
      ${icon('info', 'w-4 h-4 mt-0.5 text-info-600 shrink-0')}
      <p class="text-xs text-info-700 leading-snug">E-learning complete — awaiting senior observation &amp; sign-off.</p>
    </div>` : ''}

    ${showGateWarn ? html`<div class="flex items-start gap-2.5 rounded-xl bg-warning-50 ring-1 ring-warning-100 p-3">
      ${icon('shield', 'w-4 h-4 mt-0.5 text-warning-600 shrink-0')}
      <p class="text-xs text-warning-700 leading-snug">This competency gates ${esc(gateText)}. A senior must observe and sign you off before you can perform it.</p>
    </div>` : ''}
  </div>`
}

/* ----------------------------------------------------------- screen */
export function renderSkills() {
  const inner = html`
    ${flowHeader({ title: 'Skills & competency', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">

      <div class="card p-4">
        <div class="flex items-start gap-2.5">
          ${icon('info', 'w-5 h-5 mt-0.5 text-primary-500 shrink-0')}
          <div class="min-w-0">
            <p class="text-sm font-semibold text-ink-900">Two tracks to competency</p>
            <p class="text-sm text-ink-600 mt-1 leading-snug">A skill is only competent when BOTH tracks are met — the e-learning is completed AND a senior has observed and signed you off. E-learning alone doesn't unlock a gated task.</p>
          </div>
        </div>
      </div>

      ${map(SKILLS, (s) => skillCard(s))}

      <div class="card p-4 bg-info-50 ring-info-100">
        <div class="flex items-start gap-2.5">
          ${icon('info', 'w-4 h-4 mt-0.5 text-info-600 shrink-0')}
          <p class="text-xs text-info-700 leading-snug">Observed competency sign-off is recorded by a Senior Carer / nurse — it is role-gated. Your certificates and completions sync to the office training matrix.</p>
        </div>
      </div>

    </div>`
  return mobileFlow(inner)
}
