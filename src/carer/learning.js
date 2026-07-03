/** §28 — Learning centre: course catalogue + a real complete-a-course flow
 *  (lesson → knowledge check → completion) persisted to carerStore, plus the
 *  just-in-time client-condition micro-lesson. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { LEARNING_COURSES, LEARNING_CONTENT, CARE_CERT_STANDARDS, ROTA, jitCourseForSU, courseRefreshStatus, courseExpiry, DEMO_TODAY } from '../data/carer.js'
import { getServiceUser } from '../data/index.js'
import { carerStore } from '../lib/carerStore.js'

const CAT_TONE = {
  'Care Certificate': 'bg-teal-50 text-teal-700 ring-teal-100',
  Statutory: 'bg-warning-50 text-warning-700 ring-warning-100',
  Mandatory: 'bg-primary-50 text-primary-700 ring-primary-100',
  Specialist: 'bg-info-50 text-info-700 ring-info-100',
  Condition: 'bg-info-50 text-info-700 ring-info-100',
}

/** The assessment pass mark (80%). */
const PASS_RATIO = 0.8

/** Present a completion date (falls back to the demo clock) for a course. */
function completedDate(c) {
  return c.completed || DEMO_TODAY
}

/** A deterministic certificate reference number for a course. */
function certRef(c) {
  return 'CPD-' + String(c.id).toUpperCase()
}

/** Format an ISO date (YYYY-MM-DD) as e.g. "3 Jul 2026". */
const CERT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00Z')
  if (isNaN(d)) return esc(iso)
  return `${d.getUTCDate()} ${CERT_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** merge catalogue defaults with persisted completion, else a resume bookmark. */
function withState(c) {
  const st = carerStore.courseState(c.id)
  if (st) return { ...c, ...st }
  const prog = carerStore.courseProgress(c.id)
  if (prog) {
    const ct = LEARNING_CONTENT[c.id]
    const n = ct && Array.isArray(ct.blocks) && ct.blocks.length ? ct.blocks.length : 1
    return { ...c, status: 'in-progress', progress: Math.min(99, Math.round((prog.screen / n) * 100)), resumeScreen: prog.screen }
  }
  return c
}

function statusBadge(c) {
  if (c.status === 'complete') return html`<span class="badge bg-success-50 text-success-700 ring-success-100">${icon('check-circle', 'w-3 h-3')}Complete</span>`
  if (c.status === 'in-progress') return html`<span class="badge bg-primary-50 text-primary-700 ring-primary-100">${esc(c.progress)}%</span>`
  if (c.status === 'due') return html`<span class="badge bg-warning-50 text-warning-700 ring-warning-100">${icon('clock', 'w-3 h-3')}Refresher due</span>`
  return html`<span class="badge bg-ink-100 text-ink-600 ring-ink-200">Not started</span>`
}

/** the Care Certificate's 16-standard checklist (done derived from progress). */
function ccStandards(c) {
  const done = c.status === 'complete' ? 16 : Math.round((c.progress || 0) / 100 * 16)
  return html`<div class="rounded-lg ring-1 ring-ink-100 divide-y divide-ink-100 mt-2">
    ${map(CARE_CERT_STANDARDS, (s, i) => html`<div class="flex items-center gap-2 px-3 py-1.5 text-[12px]">
      ${i < done ? icon('check-circle', 'w-3.5 h-3.5 text-success-600') : '<span class="inline-block w-3 h-3 rounded-full ring-1 ring-ink-300 shrink-0"></span>'}
      <span class="text-ink-300 w-4 text-right">${i + 1}</span>
      <span class="${i < done ? 'text-ink-700' : 'text-ink-400'}">${esc(s)}</span>
    </div>`)}
    <p class="px-3 py-1.5 text-[11px] text-ink-400">${done} of 16 standards complete</p>
  </div>`
}

/* ------------------------------------------------ §28 lesson content blocks */

/** Minimal inline formatting for text blocks: **bold** + `- ` bullet lines. */
function fmtText(s) {
  const bold = esc(s || '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  const lines = bold.split('\n')
  let out = ''
  let bullets = []
  const flush = () => { if (bullets.length) { out += `<ul class="list-disc pl-5 space-y-0.5 my-1.5">${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`; bullets = [] } }
  for (const ln of lines) {
    const t = ln.trim()
    if (t.startsWith('- ')) bullets.push(t.slice(2))
    else { flush(); if (t) out += `<p class="mb-2">${t}</p>` }
  }
  flush()
  return out
}

const CALLOUT = {
  info: { cls: 'bg-info-50 ring-info-100 text-info-800', ic: 'info' },
  warning: { cls: 'bg-warning-50 ring-warning-100 text-warning-800', ic: 'alert' },
  danger: { cls: 'bg-danger-50 ring-danger-100 text-danger-800', ic: 'alert' },
  success: { cls: 'bg-success-50 ring-success-100 text-success-800', ic: 'check-circle' },
}

/** Render one lesson content block by type. */
function renderBlock(b) {
  if (!b || !b.t) return ''
  switch (b.t) {
    case 'text':
      return html`<div class="text-[13px] text-ink-700 leading-relaxed">${fmtText(b.md)}</div>`
    case 'video':
      return html`<div x-data="{ tr:false }" class="rounded-xl overflow-hidden ring-1 ring-ink-100">
        <button type="button" onclick="window.__notify('Playing video…','info')" class="relative w-full aspect-video bg-ink-900 grid place-items-center">
          <span class="w-14 h-14 rounded-full bg-white/90 text-primary-700 grid place-items-center shadow-lg"><svg viewBox="0 0 24 24" class="w-6 h-6 ml-0.5" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>
          <span class="absolute top-2 left-3 text-[11px] font-medium text-white/90">${esc(b.title || 'Video lesson')}</span>
          <span class="absolute bottom-2 right-2 text-[11px] font-medium text-white bg-black/50 rounded px-1.5 py-0.5">${esc(b.duration || '')}</span>
        </button>
        ${b.transcript ? html`<div class="bg-surface"><button @click="tr=!tr" class="w-full text-left px-3 py-2 text-[12px] font-medium text-primary-700 flex items-center gap-1.5">${icon('list', 'w-3.5 h-3.5')}<span x-text="tr ? 'Hide transcript' : 'View transcript'"></span></button><div x-show="tr" x-cloak class="px-3 pb-3 text-[12px] text-ink-600">${esc(b.transcript)}</div></div>` : ''}
      </div>`
    case 'callout': {
      const cc = CALLOUT[b.tone] || CALLOUT.info
      return html`<div class="rounded-xl ring-1 ${cc.cls} p-3 flex items-start gap-2">${icon(cc.ic, 'w-4 h-4 shrink-0 mt-0.5')}<div class="text-[13px]">${b.title ? html`<p class="font-semibold">${esc(b.title)}</p>` : ''}<p>${esc(b.body)}</p></div></div>`
    }
    case 'keypoints':
      return html`<div class="rounded-xl ring-1 ring-ink-100 p-3"><p class="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1.5">Key points</p><ul class="space-y-1.5">${map(b.items || [], (it) => html`<li class="flex items-start gap-2 text-[13px] text-ink-700">${icon('check', 'w-4 h-4 text-primary-500 mt-0.5 shrink-0')}<span>${esc(it)}</span></li>`)}</ul></div>`
    case 'scenario':
      return html`<div x-data="{ pick:null }" class="rounded-xl ring-1 ring-primary-100 bg-primary-50 p-3">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-primary-600 mb-1 flex items-center gap-1">${icon('sparkles', 'w-3 h-3')}Scenario</p>
        <p class="text-[13px] text-ink-700">${esc(b.situation)}</p>
        <p class="text-[13px] font-semibold text-ink-900 mt-2">${esc(b.prompt || 'What would you do?')}</p>
        <div class="space-y-2 mt-2">${map(b.options || [], (o, i) => html`<button type="button" @click="pick=${i}" :class="pick===${i} ? '${o.correct ? 'ring-success-500 bg-success-50' : 'ring-danger-400 bg-danger-50'}' : 'ring-ink-200 bg-surface'" class="w-full text-left rounded-lg ring-1 px-3 py-2 text-[13px]">${esc(o.label)}</button>`)}</div>
        ${map(b.options || [], (o, i) => html`<p x-show="pick===${i}" x-cloak class="mt-2 text-[12px] ${o.correct ? 'text-success-700' : 'text-danger-600'} flex items-start gap-1.5">${icon(o.correct ? 'check-circle' : 'alert', 'w-3.5 h-3.5 mt-0.5 shrink-0')}<span>${esc(o.feedback)}</span></p>`)}
      </div>`
    case 'dosdonts':
      return html`<div class="grid grid-cols-2 gap-2">
        <div class="rounded-xl ring-1 ring-success-100 bg-success-50 p-3"><p class="text-[11px] font-semibold text-success-700 mb-1.5">Do</p><ul class="space-y-1">${map(b.dos || [], (d) => html`<li class="flex items-start gap-1.5 text-[12px] text-ink-700">${icon('check', 'w-3.5 h-3.5 text-success-600 mt-0.5 shrink-0')}<span>${esc(d)}</span></li>`)}</ul></div>
        <div class="rounded-xl ring-1 ring-danger-100 bg-danger-50 p-3"><p class="text-[11px] font-semibold text-danger-700 mb-1.5">Do not</p><ul class="space-y-1">${map(b.donts || [], (d) => html`<li class="flex items-start gap-1.5 text-[12px] text-ink-700">${icon('x-circle', 'w-3.5 h-3.5 text-danger-500 mt-0.5 shrink-0')}<span>${esc(d)}</span></li>`)}</ul></div>
      </div>`
    case 'definition':
      return html`<div class="rounded-xl ring-1 ring-ink-100 p-3 flex items-start gap-2">${icon('info', 'w-4 h-4 text-ink-400 shrink-0 mt-0.5')}<p class="text-[13px]"><span class="font-semibold text-ink-900">${esc(b.term)}</span> <span class="text-ink-600">— ${esc(b.meaning)}</span></p></div>`
    case 'resource':
      return html`<div class="rounded-xl ring-1 ring-ink-100 p-3 flex items-center gap-2.5"><span class="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon('file-check', 'w-4 h-4')}</span><p class="flex-1 text-[13px] font-medium text-ink-800">${esc(b.label || 'Resource')}</p><button type="button" onclick="window.__notify('Resource downloaded','success')" class="btn btn-secondary btn-sm shrink-0">${icon('download', 'w-3.5 h-3.5')}Get</button></div>`
    case 'standard':
      return html`<div class="flex"><span class="inline-flex items-center gap-1 rounded-md bg-teal-50 text-teal-700 ring-1 ring-teal-100 px-2 py-1 text-[11px] font-medium">${icon('shield', 'w-3 h-3')}${esc(b.text)}</span></div>`
    case 'image':
      return html`<div class="rounded-xl ring-1 ring-ink-100 bg-ink-50 p-4 text-center"><span class="w-10 h-10 rounded-lg bg-ink-200 text-ink-500 grid place-items-center mx-auto mb-1.5">${icon('layers', 'w-5 h-5')}</span><p class="text-[12px] text-ink-500">${esc(b.caption || 'Diagram')}</p></div>`
    default:
      return ''
  }
}

/** The lesson body: rich blocks when present, else a bullet list of points. */
function lessonBody(ct) {
  if (Array.isArray(ct.blocks) && ct.blocks.length) return html`<div class="space-y-3">${map(ct.blocks, renderBlock)}</div>`
  return html`<ul class="space-y-2">${map(ct.points || [], (p) => html`<li class="flex items-start gap-2 text-[13px] text-ink-700">${icon('check', 'w-4 h-4 text-primary-500 mt-0.5 shrink-0')}<span>${esc(p)}</span></li>`)}</ul>`
}

/** lesson → multi-question assessment (80% pass) → pass, in a per-card Alpine modal. */
function courseModal(c) {
  const ct = LEARNING_CONTENT[c.id]
  if (!ct) return ''
  // Normalise: quiz is now an ARRAY of questions.
  const quiz = Array.isArray(ct.quiz) ? ct.quiz : [ct.quiz]
  const total = quiz.length
  const isCC = !!c.observationRequired
  // Lesson is paged one block per screen (the real "screen-by-screen" model).
  const blocks = Array.isArray(ct.blocks) && ct.blocks.length ? ct.blocks : null
  const nScreens = blocks ? blocks.length : 1
  // Number of correct answers required to pass (>= 80%).
  const passNeeded = Math.ceil(total * PASS_RATIO)
  // Alpine score expression: sum of correct picks across all questions.
  const scoreExpr = quiz.map((q, i) => {
    if (q.t === 'multi') {
      const correct = [...(q.answers || [])].sort((a, b) => a - b).join(',')
      return `((answers[${i}]||[]).slice().sort((a,b)=>a-b).join(',')==='${correct}'?1:0)`
    }
    return `(answers[${i}]===${q.answer}?1:0)`
  }).join('+')
  return html`<div x-show="modal" x-cloak class="absolute inset-0 z-50 bg-black/40 flex items-end" @click.self="modal=false">
    <div class="bg-surface rounded-t-2xl w-full max-h-[88%] overflow-y-auto">
      <div class="sticky top-0 bg-surface px-4 py-3 border-b border-ink-100 flex items-center justify-between">
        <p class="text-sm font-semibold text-ink-900 truncate">${esc(c.title)}</p>
        <button @click="modal=false" class="text-ink-400">${icon('x', 'w-5 h-5')}</button>
      </div>
      <div class="p-4">
        <div x-show="step===0">
          ${isCC ? html`<div class="mb-3 rounded-xl bg-warning-50 ring-1 ring-warning-100 p-3 text-[12px] text-warning-800 flex items-start gap-2">${icon('info', 'w-4 h-4 shrink-0 mt-0.5')}<span>This is the <strong>knowledge element only</strong>. The Care Certificate is awarded after <strong>workplace observation and assessor sign-off</strong>.</span></div>` : ''}
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Lesson · ${esc(c.mins)} min</p>
              <span class="text-[11px] text-ink-400">Screen <span x-text="screen+1"></span> of ${nScreens}</span>
            </div>
            <div class="h-1.5 rounded-full bg-ink-100 overflow-hidden"><div class="h-full rounded-full bg-primary-500 transition-all" :style="'width:'+Math.round((screen+1)/${nScreens}*100)+'%'"></div></div>
          </div>
          <div class="min-h-[180px]">
            ${blocks
              ? map(blocks, (b, i) => html`<div x-show="screen===${i}" x-cloak>${renderBlock(b)}</div>`)
              : lessonBody(ct)}
            ${isCC ? html`<div x-show="screen===0" x-cloak class="mt-4"><p class="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1">The 16 standards</p>${ccStandards(c)}</div>` : ''}
          </div>
          <div class="flex gap-2 mt-4">
            <button x-show="screen>0" x-cloak @click="screen--" class="btn btn-secondary btn-md flex-1">${icon('chevron-left', 'w-4 h-4')}Back</button>
            <button x-show="screen < ${nScreens - 1}" @click="screen=Math.min(screen+1,${nScreens - 1}); window.__courseProgress('${c.id}', screen)" class="btn btn-primary btn-md flex-1">Continue ${icon('chevron-right', 'w-4 h-4')}</button>
            <button x-show="screen >= ${nScreens - 1}" x-cloak @click="step=1" class="btn btn-primary btn-md flex-1">Continue to assessment ${icon('chevron-right', 'w-4 h-4')}</button>
          </div>
        </div>
        <div x-show="step===1">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Assessment · ${esc(total)} questions</p>
            <span class="badge bg-ink-50 text-ink-600 ring-ink-200">Pass mark 80%</span>
          </div>
          <div class="space-y-4">
            ${map(quiz, (q, qi) => {
              const isMulti = q.t === 'multi'
              const correctStr = isMulti ? [...(q.answers || [])].sort((a, b) => a - b).join(',') : ''
              const correctTexts = isMulti ? (q.answers || []).map((i) => q.options[i]).join(', ') : ''
              return html`<div>
                <p class="text-sm font-semibold text-ink-900 mb-2"><span class="text-ink-400">${qi + 1}.</span> ${esc(q.q)}</p>
                ${isMulti
                  ? html`<p class="text-[11px] text-ink-400 mb-1.5">Select all that apply</p><div class="space-y-2">${map(q.options, (o, oi) => html`<button type="button" @click="answers[${qi}]=((answers[${qi}]||[]).includes(${oi}) ? answers[${qi}].filter(x=>x!==${oi}) : [...(answers[${qi}]||[]),${oi}]);submitted=false" :class="submitted ? (${q.answers.includes(oi)} ? 'ring-success-500 bg-success-50 text-success-800' : ((answers[${qi}]||[]).includes(${oi}) ? 'ring-danger-400 bg-danger-50 text-danger-700' : 'ring-ink-200 text-ink-400')) : ((answers[${qi}]||[]).includes(${oi}) ? 'ring-primary-500 bg-primary-50 text-primary-800' : 'ring-ink-200 text-ink-700')" class="w-full text-left rounded-xl ring-1 px-3 py-2.5 text-[13px] font-medium flex items-center gap-2"><span class="w-4 h-4 rounded ring-1 shrink-0 grid place-items-center" :class="(answers[${qi}]||[]).includes(${oi}) ? 'bg-primary-600 ring-primary-600 text-white' : 'ring-ink-300'"><span x-show="(answers[${qi}]||[]).includes(${oi})" x-cloak>${icon('check', 'w-3 h-3')}</span></span><span>${esc(o)}</span></button>`)}</div>
                    <p x-show="submitted && (answers[${qi}]||[]).slice().sort((a,b)=>a-b).join(',')!=='${correctStr}'" x-cloak class="mt-2 text-[12px] text-success-700 flex items-start gap-1.5">${icon('check-circle', 'w-3.5 h-3.5 mt-0.5 shrink-0')}<span>Correct answers: <strong>${esc(correctTexts)}</strong></span></p>`
                  : html`<div class="space-y-2">${map(q.options, (o, oi) => html`<button type="button" @click="answers[${qi}]=${oi};submitted=false" :class="submitted ? (${oi}===${q.answer} ? 'ring-success-500 bg-success-50 text-success-800' : (answers[${qi}]===${oi} ? 'ring-danger-400 bg-danger-50 text-danger-700' : 'ring-ink-200 text-ink-400')) : (answers[${qi}]===${oi} ? 'ring-primary-500 bg-primary-50 text-primary-800' : 'ring-ink-200 text-ink-700')" class="w-full text-left rounded-xl ring-1 px-3 py-2.5 text-[13px] font-medium">${esc(o)}</button>`)}</div>
                    <p x-show="submitted && answers[${qi}]!==${q.answer}" x-cloak class="mt-2 text-[12px] text-success-700 flex items-start gap-1.5">${icon('check-circle', 'w-3.5 h-3.5 mt-0.5 shrink-0')}<span>Correct answer: <strong>${esc(q.options[q.answer])}</strong></span></p>`}
              </div>`
            })}
          </div>
          <template x-if="submitted">
            <div class="mt-4">
              <p class="text-[13px] font-medium text-ink-700">You scored <span x-text="score"></span>/${esc(total)} — <span x-text="Math.round(score/${total}*100)"></span>%</p>
              <p x-show="!passed" x-cloak class="text-[12px] text-danger-600 mt-1 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}Not passed — 80% needed. The correct answers are shown in green above.</p>
            </div>
          </template>
          <div class="flex gap-2 mt-4">
            <button @click="step=0" class="btn btn-secondary btn-md flex-1">Back</button>
            <button x-show="!(submitted && !passed)" @click="score=(${scoreExpr}); submitted=true; passed=score>=${passNeeded}; passed ? (step=2) : null" :disabled="answers.includes(null)" :class="answers.includes(null) ? 'opacity-50' : ''" class="btn btn-primary btn-md flex-1">Submit assessment</button>
            <button x-show="submitted && !passed" x-cloak @click="answers=answers.map(()=>null); submitted=false; passed=false" class="btn btn-primary btn-md flex-1">${icon('refresh', 'w-4 h-4')}Retry</button>
          </div>
        </div>
        <div x-show="step===2" class="text-center py-2">
          <span class="w-14 h-14 rounded-full bg-success-50 text-success-600 grid place-items-center mx-auto mb-3">${icon('check-circle', 'w-8 h-8')}</span>
          <p class="text-base font-bold text-ink-900">Passed</p>
          <p class="text-[13px] text-ink-500 mt-1">You scored <span x-text="score"></span>/${esc(total)}. ${isCC ? 'Knowledge element recorded' : 'Certificate issued'} and ${esc(c.cpd)} CPD hours added to your record.</p>
          <button onclick="window.__completeCourse('${c.id}')" class="btn btn-primary btn-md w-full mt-4">${icon('file-check', 'w-4 h-4')}${isCC ? 'Record knowledge element' : 'Finish &amp; record completion'}</button>
        </div>
      </div>
    </div>
  </div>`
}

/** The x-data init string for a course card's Alpine state (quiz-length aware). */
function courseCardState(c) {
  const ct = LEARNING_CONTENT[c.id]
  const quiz = ct ? (Array.isArray(ct.quiz) ? ct.quiz : [ct.quiz]) : []
  const nulls = quiz.map(() => 'null').join(',')
  return `{ modal:false, step:0, screen:${c.resumeScreen || 0}, cert:false, answers:[${nulls}], submitted:false, passed:false, score:0 }`
}

/** Reset expression run when (re)opening the modal to start the flow clean. */
function openModalExpr(c) {
  const ct = LEARNING_CONTENT[c.id]
  const quiz = ct ? (Array.isArray(ct.quiz) ? ct.quiz : [ct.quiz]) : []
  const nulls = quiz.map(() => 'null').join(',')
  return `modal=true;step=0;answers=[${nulls}];submitted=false;passed=false;score=0`
}

/** certificate view for a completed course. */
function certModal(c) {
  const completed = completedDate(c)
  const expiry = c.validityMonths ? courseExpiry(completed, c.validityMonths) : null
  const expired = courseRefreshStatus(c) === 'expired'
  return html`<div x-show="cert" x-cloak class="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-4" @click.self="cert=false">
    <div class="bg-surface rounded-2xl w-full max-w-sm overflow-hidden">
      <div class="bg-primary-600 text-white p-5 text-center">
        <span class="w-12 h-12 rounded-xl bg-white/15 grid place-items-center mx-auto mb-2">${icon('file-check', 'w-6 h-6')}</span>
        <p class="text-[11px] uppercase tracking-wide text-primary-100">Certificate of completion</p>
        <p class="text-base font-bold mt-1">${esc(c.title)}</p>
      </div>
      <div class="p-4 space-y-1.5 text-[13px]">
        <div class="flex justify-between"><span class="text-ink-400">Carer</span><span class="font-medium text-ink-800">Aisha Khan</span></div>
        <div class="flex justify-between"><span class="text-ink-400">Reference</span><span class="font-medium text-ink-800">${esc(certRef(c))}</span></div>
        <div class="flex justify-between"><span class="text-ink-400">CPD hours</span><span class="font-medium text-ink-800">${esc(c.cpd)}</span></div>
        <div class="flex justify-between"><span class="text-ink-400">Completed</span><span class="font-medium text-ink-800">${esc(fmtDate(completed))}</span></div>
        <div class="flex justify-between"><span class="text-ink-400">Expires</span><span class="font-medium ${expired ? 'text-danger-700' : 'text-ink-800'}">${expiry ? esc(fmtDate(expiry)) : 'No expiry'}</span></div>
        <div class="flex justify-between"><span class="text-ink-400">Status</span><span class="font-medium ${expired ? 'text-danger-700' : 'text-success-700'}">${expired ? 'Expired — retake' : 'Complete'}</span></div>
        <button onclick="window.__notify('Certificate downloaded (PDF)','success')" class="btn btn-secondary btn-sm w-full mt-3">${icon('download', 'w-3.5 h-3.5')}Download PDF</button>
        <button @click="cert=false" class="btn btn-primary btn-sm w-full">Close</button>
      </div>
    </div>
  </div>`
}

/** Subtle accreditation chips (max 3) rendered under the title. */
function accreditationChips(c) {
  const accs = (c.accreditation || []).slice(0, 3)
  if (!accs.length) return ''
  return html`<div class="flex flex-wrap items-center gap-1 mt-1.5">${map(accs, (a) => html`<span class="inline-flex items-center rounded-md bg-ink-50 text-ink-500 ring-1 ring-ink-200 px-1.5 py-0.5 text-[10px] font-medium">${esc(a)}</span>`)}</div>`
}

/** A refresh chip shown on completed courses whose validity has lapsed. */
function refreshChip(c) {
  const rs = courseRefreshStatus(c)
  if (rs === 'expiring') return html`<span class="badge bg-warning-50 text-warning-700 ring-warning-100">${icon('clock', 'w-3 h-3')}Refresher due</span>`
  if (rs === 'expired') return html`<span class="badge bg-danger-50 text-danger-700 ring-danger-100">${icon('alert', 'w-3 h-3')}Expired — retake</span>`
  return ''
}

function actionButton(c) {
  const rs = courseRefreshStatus(c)
  const lapsed = rs === 'expiring' || rs === 'expired'
  // A completed course whose validity lapsed should be retakeable.
  if (c.status === 'complete' && lapsed) {
    return html`<button type="button" @click="${openModalExpr(c)}" class="btn btn-primary btn-sm shrink-0">${icon('refresh', 'w-3.5 h-3.5')}Retake</button>`
  }
  if (c.status === 'complete') return html`<button type="button" @click="cert=true" class="btn btn-secondary btn-sm shrink-0">${icon('file-check', 'w-3.5 h-3.5')}Certificate</button>`
  const label = c.status === 'in-progress' ? 'Resume' : 'Start'
  return html`<button type="button" @click="${openModalExpr(c)}" class="btn btn-primary btn-sm shrink-0">${label}</button>`
}

function courseCard(c) {
  return html`<div class="card p-4" x-data="${courseCardState(c)}">
    <div class="flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-ink-900 leading-snug">${esc(c.title)}</p>
        ${accreditationChips(c)}
        <div class="flex flex-wrap items-center gap-1.5 mt-2">
          <span class="badge ${CAT_TONE[c.cat] || 'bg-ink-100 text-ink-600 ring-ink-200'}">${esc(c.cat)}</span>
          ${statusBadge(c)}
          ${refreshChip(c)}
          ${c.offline ? html`<span class="badge bg-ink-50 text-ink-600 ring-ink-200">${icon('download', 'w-3 h-3')}Offline</span>` : ''}
        </div>
        <p class="text-[12px] text-ink-400 mt-2 flex items-center gap-1.5">${icon('clock', 'w-3.5 h-3.5')}${esc(c.mins)} min<span class="text-ink-300">·</span>${esc(c.cpd)} CPD hrs${c.standards ? html`<span class="text-ink-300">·</span>16 standards` : ''}</p>
      </div>
      ${actionButton(c)}
    </div>
    ${c.status === 'in-progress' ? html`<div class="mt-3 h-1.5 rounded-full bg-ink-100 overflow-hidden"><div class="h-full rounded-full bg-primary-500" style="width:${esc(c.progress)}%"></div></div>` : ''}
    ${courseModal(c)}
    ${certModal(c)}
  </div>`
}

export function renderLearning() {
  const courses = LEARNING_COURSES.map(withState)
  const completed = courses.filter((c) => c.status === 'complete')
  const cpdHours = completed.reduce((sum, c) => sum + (c.cpd || 0), 0)

  // §28 JIT — derive the recommendation from the carer's next visit's service user.
  let jit = null
  for (const r of ROTA) {
    const su = getServiceUser(r.suId)
    const rec = jitCourseForSU(su)   // → { courseId, course, condition, mins } or null
    if (rec) { jit = { ...rec, client: su.name }; break }
  }
  // Merged state for the recommended course + its lesson/quiz content (first question only).
  const jitCourse = jit ? (courses.find((c) => c.id === jit.courseId) || jit.course) : null
  const jitContent = jit ? LEARNING_CONTENT[jit.courseId] : null
  const jitQuiz = jitContent ? (Array.isArray(jitContent.quiz) ? jitContent.quiz[0] : jitContent.quiz) : null
  const jitDone = jit ? jitCourse.status === 'complete' : false

  // CPD transcript — every completed course as a dated row + a running total.
  const completedRows = LEARNING_COURSES.map(withState).filter((c) => c.status === 'complete')
    .map((c) => ({ title: c.title, cpd: c.cpd, date: c.completed || DEMO_TODAY }))
  const cpdTotal = completedRows.reduce((sum, r) => sum + (r.cpd || 0), 0)

  const inner = html`
    ${flowHeader({ title: 'Learning centre', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ jit:false, jstep:0, jpicked:null, jwrong:false, cpd:false }">

      ${jit && jitContent ? html`<div class="card p-4 bg-primary-600 text-white ring-0">
        <div class="flex items-center justify-between gap-2 mb-2">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-primary-100">Recommended before your next visit</p>
          <span class="badge bg-white/15 text-white ring-white/20">${icon('sparkles', 'w-3 h-3')}just-in-time</span>
        </div>
        <p class="text-base font-semibold leading-snug">${esc(jitCourse.title)}</p>
        <p class="text-[13px] text-primary-100 mt-1 flex items-center gap-1.5">${icon('user-check', 'w-3.5 h-3.5')}For ${esc(jit.client)} · ${esc(jit.condition)}</p>
        ${jitDone
          ? html`<div class="mt-3 rounded-lg bg-white/15 p-2 text-[12px] font-medium flex items-center justify-center gap-1.5">${icon('check-circle', 'w-3.5 h-3.5')}Refresher completed</div>`
          : html`<button type="button" @click="jit=true;jstep=0;jpicked=null;jwrong=false" class="btn btn-md w-full mt-3 bg-white text-primary-700 font-semibold active:bg-primary-50">${icon('sparkles', 'w-4 h-4')}Start · ${esc(jit.mins || jitCourse.mins)} min</button>`}
      </div>

      <div x-show="jit" x-cloak class="absolute inset-0 z-50 bg-black/40 flex items-end" @click.self="jit=false">
        <div class="bg-surface rounded-t-2xl w-full max-h-[88%] overflow-y-auto">
          <div class="sticky top-0 bg-surface px-4 py-3 border-b border-ink-100 flex items-center justify-between"><p class="text-sm font-semibold text-ink-900 truncate">${esc(jitCourse.title)}</p><button @click="jit=false" class="text-ink-400">${icon('x', 'w-5 h-5')}</button></div>
          <div class="p-4">
            <div x-show="jstep===0">
              <ul class="space-y-2">${map(jitContent.points, (p) => html`<li class="flex items-start gap-2 text-[13px] text-ink-700">${icon('check', 'w-4 h-4 text-primary-500 mt-0.5 shrink-0')}<span>${esc(p)}</span></li>`)}</ul>
              <button @click="jstep=1" class="btn btn-primary btn-md w-full mt-4">Knowledge check ${icon('chevron-right', 'w-4 h-4')}</button>
            </div>
            <div x-show="jstep===1">
              <p class="text-sm font-semibold text-ink-900 mb-3">${esc(jitQuiz.q)}</p>
              <div class="space-y-2">${map(jitQuiz.options, (o, i) => html`<button type="button" @click="jpicked=${i};jwrong=false" :class="jpicked===${i} ? 'ring-primary-500 bg-primary-50 text-primary-800' : 'ring-ink-200 text-ink-700'" class="w-full text-left rounded-xl ring-1 px-3 py-2.5 text-[13px] font-medium">${esc(o)}</button>`)}</div>
              <p x-show="jwrong" x-cloak class="text-[12px] text-danger-600 mt-2">Not quite — try again.</p>
              <button @click="jpicked===${jitQuiz.answer} ? window.__completeCourse('${jit.courseId}') : (jwrong=true)" :disabled="jpicked===null" :class="jpicked===null ? 'opacity-50' : ''" class="btn btn-primary btn-md w-full mt-4">Complete refresher</button>
            </div>
          </div>
        </div>
      </div>` : ''}

      <div class="card p-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-2xl font-bold text-ink-900">${completed.length}<span class="text-base font-semibold text-ink-400">/${LEARNING_COURSES.length}</span></p>
            <p class="text-[12px] text-ink-500 flex items-center gap-1 mt-0.5">${icon('check-circle', 'w-3.5 h-3.5 text-success-600')}Courses complete</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-ink-900">${esc(cpdHours)}<span class="text-base font-semibold text-ink-400"> hrs</span></p>
            <p class="text-[12px] text-ink-500 flex items-center gap-1 mt-0.5">${icon('star', 'w-3.5 h-3.5 text-warning-500')}CPD earned</p>
          </div>
        </div>
        <button type="button" @click="cpd=true" class="btn btn-secondary btn-sm w-full mt-3">${icon('file-check', 'w-3.5 h-3.5')}CPD record</button>
      </div>

      <div x-show="cpd" x-cloak class="absolute inset-0 z-50 bg-black/40 flex items-end" @click.self="cpd=false">
        <div class="bg-surface rounded-t-2xl w-full max-h-[88%] overflow-y-auto">
          <div class="sticky top-0 bg-surface px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <p class="text-sm font-semibold text-ink-900 truncate">CPD record</p>
            <button @click="cpd=false" class="text-ink-400">${icon('x', 'w-5 h-5')}</button>
          </div>
          <div class="p-4">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-2">Transcript · ${esc(completedRows.length)} completed</p>
            ${completedRows.length
              ? html`<div class="rounded-lg ring-1 ring-ink-100 divide-y divide-ink-100">
                  ${map(completedRows, (r) => html`<div class="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div class="min-w-0">
                      <p class="text-[13px] font-medium text-ink-800 truncate">${esc(r.title)}</p>
                      <p class="text-[11px] text-ink-400 mt-0.5 flex items-center gap-1">${icon('calendar', 'w-3 h-3')}${esc(fmtDate(r.date))}</p>
                    </div>
                    <span class="text-[13px] font-semibold text-ink-700 shrink-0">${esc(r.cpd)} hrs</span>
                  </div>`)}
                  <div class="flex items-center justify-between px-3 py-2.5 bg-ink-50">
                    <span class="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Total CPD</span>
                    <span class="text-[13px] font-bold text-ink-900">${esc(cpdTotal)} hrs</span>
                  </div>
                </div>`
              : html`<p class="text-[13px] text-ink-400">No completed courses yet.</p>`}
            <button @click="cpd=false" class="btn btn-primary btn-md w-full mt-4">Close</button>
          </div>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Course catalogue</p>
        <div class="space-y-3">${map(courses, courseCard)}</div>
      </div>

      <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-[13px] text-info-800 flex items-start gap-2">${icon('info', 'w-4 h-4 shrink-0 mt-0.5')}<span>Completions are saved on this device and sync to your CPD record and the office training matrix. Content is machine-assisted, not a certified determination.</span></div>
    </div>`

  return mobileFlow(inner)
}
