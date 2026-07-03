import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, btn, badge, sectionCard } from '../components/ui.js'
import { catIcon } from '../components/domain.js'
import { getServiceUser, tasksForUser, getTemplate, TEMPLATE_TYPES } from '../data/index.js'
import {
  ROTA, getRota, INLINE_TASKS, medsForVisit, MED_OUTCOMES, MED_OUTCOME_STATUS,
  OBSERVATION_TYPES, OBSERVATION_GROUPS, evaluateObsFlag, INCIDENT_TYPES,
  INCIDENT_SEVERITY, INFORMED_OPTIONS, incidentType, observationType, BODY_REGIONS,
  SUPPORT_ACTIONS, DOSE_OUTCOMES, deriveDose, ALLERGY_STATES, medRule, PARAMS,
  PROTOCOLS, protocol, PROTOCOL_LIST, protocolFor,
  CHECKIN_METHODS, WELFARE_OUTCOMES, geofenceFor, LEAVING_SAFE_ITEMS, LEAVING_SAFE_EXCEPTIONS, VISIT_REASON_CODES,
  visitTypeFor, VISIT_TYPE_META,
  WITNESS_RULE, ELIGIBLE_WITNESSES, WITNESS_FALLBACKS, orderFor, orderBlocked, RECON_STATES, implausible,
  jitCourseForSU,
} from '../data/carer.js'
import { carerStore } from '../lib/carerStore.js'
import { mobileFlow, keySafe } from '../carer/frame.js'
import { MAR_STATUS_CODES } from '../data/marCodes.js'
import { BODY_PART_SUGGESTIONS, SITTING_HOTSPOTS, LYING_HOTSPOTS } from '../data/bodyMapHotspots.js'

/* Map a chosen MAR code → the app's existing dose-outcome id so all the eMAR
 * safety gating (witness, allergy, reconciliation, reason) keeps working. */
const MAR_TO_DOSEOUT = { G: 'taken', R: 'refused', N: 'omitted', U: 'unavailable', H: 'withheld', A: 'withheld', C: 'withheld', F: 'administered-by-other', I: 'not-required', S: 'administered-by-other', T: 'taken', O: 'omitted', P: 'refused', PCI: 'omitted', Pending: '' }

const REQUIRED_RULES = ['essential', 'critical', 'required_before_visit', 'manager_review']
// non-reactive holders for the MediaRecorder (§21 voice notes)
let __voiceRec = null
let __voiceChunks = []

/* ------------------------------------------------------- Visit model */
function taskFromDef(rawId, def, i) {
  const tpl = getTemplate(def.tpl || def.sourceTemplateId)
  const fields = (tpl?.evidenceSchema?.fields || []).map((f) => ({
    ...f,
    range: f.type === 'score' ? Array.from({ length: (f.max ?? 5) - (f.min ?? 0) + 1 }, (_, k) => (f.min ?? 0) + k) : undefined,
  }))
  return {
    id: rawId,
    title: def.title || tpl?.name || 'Task',
    categoryId: def.categoryId || tpl?.categoryId || 'personal-care',
    type: def.type || tpl?.type || 'simple',
    typeLabel: TEMPLATE_TYPES[def.type || tpl?.type]?.label || 'Task',
    priority: def.priority || tpl?.priority || 'recommended',
    instructions: def.instr || def.instructions || tpl?.instructions?.short || '',
    why: tpl?.purpose || tpl?.description || '',
    isMed: (def.type || tpl?.type) === 'medication',
    medIds: def.medIds || tpl?.medIds || [],
    twoPerson: (tpl?.dependencies || []).some((dep) => /two carer/i.test(dep)),
    required: REQUIRED_RULES.includes(tpl?.completionRule) || ['essential', 'critical'].includes(def.priority || tpl?.priority),
    fields,
  }
}

export function buildVisit(visitId) {
  const rota = getRota(visitId) || ROTA[0]
  const su = getServiceUser(rota.suId)
  let tasks
  if (rota.suId === 'su-mary') {
    tasks = tasksForUser('su-mary').filter((t) => t.visit === rota.visit).map((t) => taskFromDef(t.id, t))
  } else {
    tasks = (INLINE_TASKS[visitId] || []).map((d, i) => taskFromDef(`${visitId}-t${i}`, d, i))
  }
  const meds = medsForVisit(rota.suId, rota.visit)
  return { rota, su, tasks, meds }
}

/** Progress used on the home rota (tasks + scheduled meds). */
export function visitProgressFor(v) {
  // Medication tasks are counted via their scheduled meds (eMAR), not as tasks.
  const hasMeds = v.meds.scheduled.length > 0
  const tasks = v.tasks.filter((t) => !(t.isMed && hasMeds))
  const total = tasks.length + v.meds.scheduled.length
  let done = tasks.filter((t) => carerStore.task(v.rota.id, t.id)).length
  done += v.meds.scheduled.filter((m) => carerStore.medRecord(v.rota.id, m.id)).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

/* =====================================================================
   Alpine component
   ===================================================================== */
export function registerCarerApp(Alpine) {
  Alpine.data('carerApp', (visitId) => ({
    visitId,
    rota: {}, su: {},
    tab: 'overview', sheet: null,
    taskDefs: [], scheduled: [], prn: [],
    obsGroups: OBSERVATION_GROUPS,
    incidentTypes: INCIDENT_TYPES, severities: INCIDENT_SEVERITY, informedOpts: INFORMED_OPTIONS,
    tasks: [], observations: [], incidents: [], medRows: [],
    clock: { in: null, out: null, late: false },
    note: '', queued: 0, obsFilter: 'all',
    // active forms
    activeId: null, activeMed: null, activeObs: null,
    form: {}, outcome: '', witnessedBy: '', prnReason: '', errors: [],
    inc: {},
    msgText: '', messages: [],
    sigCarer: '', sigClient: '',
    // E1 — two-field eMAR + wrong-person + med-safety
    supportAction: '', doseOut: '', marCode: '', medBlock: null, medOverride: false, overrideReason: '',
    personConfirmed: false, pendingAction: null,
    // E9 — CD witness eligibility + order reconciliation
    witnessFallback: '', medRecon: null,
    WITNESS_RULE, ELIGIBLE_WITNESSES, WITNESS_FALLBACKS,
    SUPPORT_ACTIONS, DOSE_OUTCOMES, ALLERGY_STATES, PROTOCOL_LIST, MAR_STATUS_CODES,
    CHECKIN_METHODS, WELFARE_OUTCOMES, LEAVING_SAFE_ITEMS, LEAVING_SAFE_EXCEPTIONS, VISIT_REASON_CODES,
    // E1 — protocol runner (§51)
    activeProtocol: null, protoStep: 0, protoLog: {}, protoAdvice: '', protoContact: '', protoOutcome: '',
    // E2 — check-in / leaving-safe / outcome
    checkinMethod: '', checkinReason: '', checkinGeofence: 'inside', welfare: '',
    leavingSafe: {}, reasonCode: '',
    coCarerPresent: false, handoverAcked: false,
    photoPreviews: {},
    voiceRecording: false, voiceUrl: '',

    init() {
      const m = buildVisit(this.visitId)
      this.rota = m.rota
      this.su = m.su
      this.taskDefs = m.tasks
      this.scheduled = m.meds.scheduled
      this.prn = m.meds.prn
      this.clock = carerStore.clock(this.visitId)
      // Land on the working tab once a visit is in progress; Overview is pre-visit orientation.
      this.tab = this.clock.in && !this.clock.out ? 'tasks' : 'overview'
      this.note = carerStore.note(this.visitId)
      this.queued = carerStore.queued()
      this.handoverAcked = carerStore.handoverAcked(this.visitId)
      this.resetIncident()
      this.refresh()
    },
    refresh() {
      this.tasks = this.taskDefs.map((t) => ({ ...t, record: carerStore.task(this.visitId, t.id) }))
      this.observations = carerStore.observations(this.visitId)
      this.incidents = carerStore.incidents(this.visitId)
      this.medRows = carerStore.medsForVisit(this.visitId)
      this.messages = carerStore.messages(this.visitId)
      this.queued = carerStore.queued()
    },

    /* ---------- computed ---------- */
    get requiredTasks() { return this.tasks.filter((t) => t.required) },
    get optionalTasks() { return this.tasks.filter((t) => !t.required) },
    get obsByGroup() { return this.obsGroups.map((g) => ({ g, items: OBSERVATION_TYPES.filter((t) => t.group === g) })).filter((x) => x.items.length) },
    get recommendedObs() {
      const f = (this.su.flags || []).concat(this.su.risks || []).join(' ').toLowerCase()
      const ids = []
      if (/diab/.test(f)) ids.push('glucose')
      if (/copd|respir/.test(f)) ids.push('spo2', 'respirations')
      if (/dehydr/.test(f)) ids.push('fluid')
      if (/pressure|skin/.test(f)) ids.push('skin', 'reposition')
      if (/dementia|cogn/.test(f)) ids.push('mood', 'behaviour')
      if (/palliat|end of life/.test(f)) ids.push('pain')
      return [...new Set(ids)].map((id) => OBSERVATION_TYPES.find((o) => o.id === id)).filter(Boolean)
    },
    get abnormalObsCount() { return this.observations.filter((o) => o.flag === 'abnormal').length },
    get sortedObs() { return [...this.observations].sort((a, b) => (b.flag === 'abnormal') - (a.flag === 'abnormal')) },
    get vitalObs() { return (this.obsByGroup.find((g) => g.g === 'Vital signs') || {}).items || [] },
    get moreObsGroups() { return this.obsByGroup.filter((g) => g.g !== 'Vital signs') },
    get progress() {
      // Medication tasks are represented by their scheduled meds (recorded on the
      // eMAR), so exclude them here to avoid double-counting.
      const tasks = this.tasks.filter((t) => !(t.isMed && this.medsForTask(t).length))
      const total = tasks.length + this.scheduled.length
      let done = tasks.filter((t) => t.record).length + this.scheduled.filter((m) => this.medRec(m.id)).length
      return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
    },
    get blocking() {
      // A medication task is satisfied by recording its scheduled meds on the eMAR.
      const t = this.tasks.filter((x) => x.required && !x.record && !(x.isMed && this.medsForTask(x).length))
      const meds = this.scheduled.filter((m) => !this.medRec(m.id))
      return [...t.map((x) => x.title), ...meds.map((m) => m.name)]
    },
    get canClockOut() { return !!this.clock.in && this.blocking.length === 0 },
    get activeTask() { return this.tasks.find((t) => t.id === this.activeId) || null },

    /* ---------- status helpers ---------- */
    statusOf(t) {
      // Medication tasks derive their status from their linked medicines (eMAR).
      if (t.isMed && this.medsForTask(t).length) return this.medTaskStatus(t)
      return t.record ? t.record.status : 'pending'
    },
    /** Roll a med task's linked-medicine eMAR outcomes up into one task status. */
    medTaskStatus(t) {
      const recs = this.medsForTask(t).map((m) => this.medRec(m.id))
      if (recs.some((r) => !r)) return 'pending'
      if (recs.some((r) => ['refused', 'unable'].includes(r.status))) return 'refused'
      if (recs.some((r) => r.status === 'partial')) return 'partial'
      return 'completed'
    },
    statusColor(sname) { return { completed: 'text-success-600', refused: 'text-danger-600', unable: 'text-warning-600', partial: 'text-warning-600', flagged: 'text-danger-600', pending: 'text-ink-300' }[sname] || 'text-ink-300' },
    // Read from the reactive medRows (kept current by refresh()) so the MAR rows,
    // ticks and the med-task count re-render as soon as a medicine is recorded.
    medRec(medId) { return this.medRows.find((m) => m.medId === medId) || null },
    /** All eMAR records for a PRN medicine this visit (PRN may be given repeatedly). */
    prnRecs(medId) { return this.medRows.filter((m) => m.medId === medId) },
    prnLast(medId) { const r = this.prnRecs(medId); return r.length ? r[r.length - 1] : null },
    medAllergyWarn(med) { return med.relatedAllergy && (this.su.allergies || []).includes(med.relatedAllergy) },

    /* ---------- clock ---------- */
    /* ---- check-in (§14 ECM + welfare) ---- */
    openCheckin() {
      this.errors = []
      this.checkinGeofence = geofenceFor(this.visitId)
      this.checkinMethod = this.checkinGeofence === 'inside' ? 'gps' : 'manual'
      this.checkinReason = ''; this.welfare = ''
      this.sheet = 'checkin'
    },
    performCheckin() {
      const e = []
      if ((this.checkinMethod === 'manual' || this.checkinGeofence === 'outside') && !this.checkinReason) e.push('A reason is required for manual / out-of-geofence check-in.')
      if (!this.welfare) e.push('Record the on-entry welfare outcome.')
      this.errors = e
      if (e.length) { window.__notify('Complete check-in', 'warning'); return }
      this.clock = carerStore.clockIn(this.visitId, { method: this.checkinMethod, geofence: this.checkinGeofence, reason: this.checkinReason, welfare: this.welfare, verified: this.checkinGeofence === 'inside' && this.checkinMethod === 'gps' })
      this.sheet = null
      window.__notify(this.checkinGeofence === 'inside' ? 'Clocked in · GPS confirmed' : `Clocked in · exception (${this.checkinMethod})`, this.checkinGeofence === 'inside' ? 'success' : 'warning')
      if (this.welfare === 'emergency') { this.personConfirmed = true; this.launchProtocol('unresponsive') }
      else if (this.welfare === 'seen-concern') window.__notify('Welfare concern noted — record details in observations', 'warning')
    },
    welfareLabel(id) { return (WELFARE_OUTCOMES.find((w) => w.id === id) || {}).label || '' },

    /* ---- outcome dimensions (§14) ---- */
    get visitDimensions() {
      const w = this.clock.welfare
      const attendance = w === 'no-access' ? 'No access' : w === 'not-present' ? 'Person absent' : w === 'declined' ? 'Person refused entry' : 'Attended'
      const req = this.tasks.filter((t) => t.required)
      const allTasksMet = req.every((t) => t.record && ['completed'].includes(t.record.status))
      const medsMet = this.scheduled.every((m) => { const r = this.medRec(m.id); return r && r.planMet })
      const plannedCare = this.blocking.length ? 'Partially met' : (allTasksMet && medsMet ? 'Met' : 'Partially met')
      const careSummary = this.blocking.length ? 'Partial planned care' : 'Full planned care'
      const verification = this.clock.verified ? 'Verified' : 'Manual exception'
      const recordCompletion = this.blocking.length ? 'Missing required information' : 'Complete record'
      const display = attendance !== 'Attended' ? attendance : plannedCare === 'Met' ? 'Completed' : 'Partially completed'
      return { attendance, plannedCare, careSummary, verification, recordCompletion, display }
    },
    get needsReasonCode() { return this.visitDimensions.plannedCare !== 'Met' || this.visitDimensions.attendance !== 'Attended' },

    /* ---- clock-out (§14 + §55.7 leaving-safe) ---- */
    startClockOut() {
      if (!this.canClockOut) { this.sheet = null; this.tab = 'tasks'; window.__notify('Record required tasks & scheduled medication first', 'warning'); return }
      // seed leaving-safe items to unset
      const ls = {}; LEAVING_SAFE_ITEMS.forEach((i) => (ls[i] = '')); this.leavingSafe = ls; this.reasonCode = ''; this.errors = []
      this.sheet = 'leavingSafe'
    },
    setLeavingSafe(item, val) { this.leavingSafe[item] = val },
    confirmClockOut() {
      const e = []
      LEAVING_SAFE_ITEMS.forEach((i) => { if (!this.leavingSafe[i]) e.push(`Resolve: ${i}`) })
      if (this.needsReasonCode && !this.reasonCode) e.push('Choose a reason code.')
      this.errors = e
      if (e.length) { window.__notify('Complete the leaving-safe checklist', 'warning'); return }
      const dims = this.visitDimensions
      this.clock = carerStore.clockOut(this.visitId, { leavingSafe: { ...this.leavingSafe }, reasonCode: this.reasonCode, dimensions: dims })
      this.sheet = null
      window.__notify(`Visit ${dims.display} — clocked out ${this.clock.out}`, dims.display === 'Completed' ? 'success' : 'warning')
    },

    /* ---------- shared field engine ---------- */
    fieldNeeded(f) { return f.required || (f.requiredIf && this.evalCond(f.requiredIf)) },
    hasValue(f) { const v = this.form[f.key]; return Array.isArray(v) ? v.length > 0 : v !== '' && v != null },
    setBool(k, v) { this.form[k] = v },
    setScore(k, v) { this.form[k] = v },
    toggleCheck(k, o) { if (!Array.isArray(this.form[k])) this.form[k] = []; const i = this.form[k].indexOf(o); i > -1 ? this.form[k].splice(i, 1) : this.form[k].push(o) },
    toggleBody(k, r) { if (!Array.isArray(this.form[k])) this.form[k] = []; const i = this.form[k].indexOf(r); i > -1 ? this.form[k].splice(i, 1) : this.form[k].push(r) },
    sign(k) { this.form[k] = `Aisha Khan · ${this.clock.in || '07:35'}` },
    addPhoto(k) { this.form[k] = 'photo_2026-06-30.jpg' },
    /* §21 — real photo capture with preview (consent-gated) */
    onPhoto(ev, k) { const f = ev.target && ev.target.files && ev.target.files[0]; if (!f) return; this.photoPreviews[k] = URL.createObjectURL(f); this.form[k] = f.name; window.__notify('Photo captured (consent required to keep)', 'success') },
    onIncPhoto(ev) { const f = ev.target && ev.target.files && ev.target.files[0]; if (!f) return; this.photoPreviews.incPhoto = URL.createObjectURL(f); this.inc.photo = f.name; window.__notify('Photo attached', 'success') },
    evalCond(expr) {
      try {
        let m
        if ((m = expr.match(/^(\w+)\s+in\s+\[(.*)\]$/))) return m[2].split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, '')).includes(String(this.form[m[1]]))
        if ((m = expr.match(/^(\w+)\s*(==|!=)\s*(.+)$/))) {
          let rhs = m[3].trim().replace(/^['"]|['"]$/g, ''); const v = this.form[m[1]]
          if (rhs === 'true' || rhs === 'false') { const vb = v === true || v === 'true'; return m[2] === '==' ? vb === (rhs === 'true') : vb !== (rhs === 'true') }
          return m[2] === '==' ? String(v) === rhs : String(v) !== rhs
        }
      } catch { /* noop */ }
      return false
    },
    defaultForm(fields) {
      const f = {}
      ;(fields || []).forEach((x) => { f[x.key] = x.type === 'checklist' || x.type === 'bodymap' ? [] : x.type === 'datetime' ? (this.clock.in || '07:35') : '' })
      return f
    },

    /* ---------- tasks ---------- */
    openTask(id) {
      const t0 = this.tasks.find((t) => t.id === id)
      if (t0 && t0.twoPerson && !this.coCarerPresent && !(t0.record)) {
        window.__notify('Two-person task — unsafe to perform alone. Co-carer must be present.', 'warning')
        return
      }
      // Medication tasks are recorded on the eMAR (MAR status codes), not a separate
      // task-outcome sheet. Route to the medicine list when the task has linked meds.
      if (t0 && t0.isMed && this.medsForTask(t0).length) { this.openMedFromTask(); return }
      this.activeId = id; this.errors = []
      const t = this.activeTask; const rec = t.record
      this.form = rec ? { ...rec.evidence } : this.defaultForm(t.fields)
      this.outcome = rec ? rec.outcomeRaw || '' : t.isMed ? '' : 'Completed'
      this.sheet = 'task'
    },
    /** A medication task navigates to the eMAR medicine list, where each of its
     *  linked medicines is recorded individually. */
    openMedFromTask() { this.sheet = null; this.tab = 'mar' },
    /** The specific medicines a medication task covers (its linked meds, else all
     *  scheduled meds for the visit). */
    medsForTask(t) {
      if (Array.isArray(t.medIds) && t.medIds.length) return this.scheduled.filter((m) => t.medIds.includes(m.id))
      return this.scheduled
    },
    /** How many of a med task's medicines have been recorded, and how many total. */
    medTaskCount(t) {
      const meds = this.medsForTask(t)
      return { given: meds.filter((m) => this.medRec(m.id)).length, total: meds.length }
    },
    /** Sub-label for a med task row: "1 of 2 medicines given". */
    medTaskLabel(t) {
      const { given, total } = this.medTaskCount(t)
      if (!total) return t.typeLabel
      if (given >= total) return `All ${total} medicine${total > 1 ? 's' : ''} given`
      return `${given} of ${total} medicine${total > 1 ? 's' : ''} given`
    },
    validateTask() {
      const t = this.activeTask; const e = []
      if (!t.isMed && !this.outcome) e.push('Choose an outcome.')
      t.fields.forEach((f) => { if (this.fieldNeeded(f) && !this.hasValue(f)) e.push(`"${f.label}" is required.`) })
      if (!t.isMed && ['Refused', 'Unable', 'Partial'].includes(this.outcome) && !this.hasValue({ key: 'reason' }) && !this.hasValue({ key: 'note' })) e.push('Add a reason / note.')
      this.errors = e; return !e.length
    },
    saveTask() {
      const t = this.activeTask
      if (!this.validateTask()) { window.__notify('Complete the required fields', 'warning'); return }
      let status = 'completed', raw = this.outcome
      if (t.isMed) { raw = this.form.outcome || ''; status = MED_OUTCOME_STATUS[raw] || 'completed' }
      else status = { Completed: 'completed', Refused: 'refused', Unable: 'unable', Partial: 'partial' }[this.outcome] || 'completed'
      const flagged = this.form.concern === true || this.form.escalate === true || (this.form.condition && this.form.condition !== 'Intact / healthy') || (this.form.skin && ['Red', 'Sore', 'Broken'].includes(this.form.skin))
      if (flagged && status === 'completed') status = 'flagged'
      const label = { completed: 'Completed', refused: 'Refused', unable: 'Unable', partial: 'Partial', flagged: 'Flagged — concern raised' }[status]
      carerStore.saveTask(this.visitId, t.id, { status, outcomeRaw: raw, outcomeLabel: label, evidence: { ...this.form } })
      this.refresh(); this.sheet = null
      window.__notify(flagged || status === 'refused' ? `Office alerted: ${t.title} — ${label}` : `Saved: ${t.title}`, flagged || status === 'refused' ? 'warning' : 'success')
    },

    /* ---------- wrong-person protection (§14.2) ---------- */
    get allergyState() { return this.ALLERGY_STATES[this.su.allergyStatus] || this.ALLERGY_STATES.none },
    toMinutes(t) { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m },
    /** Require a two-identifier confirmation before eMAR / high-risk. */
    requirePerson(then) {
      if (this.personConfirmed) { then(); return }
      this.pendingAction = then; this.sheet = 'confirmPerson'
    },
    confirmPerson() {
      this.personConfirmed = true
      window.__notify('Identity confirmed', 'success')
      this.sheet = null
      const fn = this.pendingAction; this.pendingAction = null
      if (fn) fn()
    },

    /* ---------- medication (eMAR) — two-field model + safety rules (§18/§49) ---------- */
    openMed(med) { this.requirePerson(() => this._openMed(med)) },
    _openMed(med) {
      this.activeMed = med; this.errors = []; this.medOverride = false; this.overrideReason = ''
      this.witnessFallback = ''
      const rec = this.medRec(med.id)
      this.supportAction = rec ? rec.supportAction || '' : (med.covert ? 'administered' : '')
      this.doseOut = rec ? rec.doseOut || '' : ''
      this.marCode = rec ? rec.marCode || '' : ''
      this.witnessedBy = rec ? rec.witnessedBy || '' : ''
      this.prnReason = rec ? rec.prnReason || med.prnReason || '' : med.prnReason || ''
      this.form = { note: rec ? rec.note || '' : '', time: rec ? rec.time || (this.clock.in || '07:35') : (this.clock.in || '07:35'), effect: rec ? rec.effect || '' : '' }
      this.medBlock = this.evaluateMedSafety(med)
      this.medRecon = this.evaluateRecon(med)
      this.sheet = 'med'
    },
    /** §49 — open reconciliation blocks this medicine unless resolved / overridden. */
    evaluateRecon(med) {
      const order = orderFor(this.rota.suId, med.id)
      if (!order || !order.recon) return null
      const acted = carerStore.reconFor(this.rota.suId, med.id)
      const state = acted ? acted.action : order.recon.state
      const meta = RECON_STATES[state] || { blocks: true }
      if (!meta.blocks) return null
      return { reason: order.recon.reason, state, conflict: order.recon.conflict }
    },
    /** §18.1 — is the chosen CD witness eligible under the configured rule? */
    witnessEligible() { return (ELIGIBLE_WITNESSES.find((w) => w.name === this.witnessedBy) || {}).eligible === true },
    /** Three independent rules → exact block reason (§49). */
    evaluateMedSafety(med) {
      const rule = medRule(med.id)
      const now = this.toMinutes(this.clock.in || '07:35')
      const priors = carerStore.allMeds().filter((m) => m.suId === this.rota.suId && m.medId === med.id && ['completed', 'partial'].includes(m.status))
      // minimum interval
      if (rule.minIntervalMin) {
        const last = priors.map((m) => this.toMinutes(m.time || m.at)).sort((a, b) => b - a)[0]
        if (last != null && now - last < rule.minIntervalMin) {
          return { reason: 'Minimum interval not met', detail: `Last dose ${Math.round((now - last))} min ago · needs ${rule.minIntervalMin} min`, hard: true }
        }
      }
      // rolling 24h maximum
      if (rule.max24hDoses && priors.length >= rule.max24hDoses) {
        return { reason: '24-hour maximum reached', detail: rule.ceilingLabel || `${rule.max24hDoses} doses in 24h`, hard: true }
      }
      // scheduled window (soft warning)
      if (rule.scheduledTime) {
        const sched = this.toMinutes(rule.scheduledTime)
        if (now < sched - PARAMS.MEDWINDOW_EARLY_MIN) return { reason: 'Too early for scheduled dose', detail: `Due ${rule.scheduledTime}`, hard: false }
        if (now > sched + PARAMS.MEDWINDOW_LATE_MIN) return { reason: 'Late administration', detail: `Due ${rule.scheduledTime}`, hard: false }
      }
      return null
    },
    pickMar(code) { this.marCode = code; this.doseOut = MAR_TO_DOSEOUT[code] || '' },
    saveMed() {
      const med = this.activeMed; const e = []
      if (!this.supportAction) e.push('Select a support action.')
      if (!this.doseOut) e.push('Select a MAR code.')
      if (['refused', 'omitted', 'unavailable', 'withheld', 'partly-taken'].includes(this.doseOut) && !this.form.note) e.push('Add a reason / note.')
      if (med.controlled && this.doseOut === 'taken' && !this.witnessedBy && !this.witnessFallback) e.push('Controlled drug requires an eligible witness or a recorded fallback.')
      if (med.controlled && this.doseOut === 'taken' && this.witnessedBy && !this.witnessEligible() && !this.witnessFallback) e.push('Chosen witness is not eligible — pick an eligible witness or a fallback.')
      if (med.group === 'PRN' && this.doseOut === 'taken' && !this.prnReason) e.push('PRN requires a reason.')
      if (this.allergyState.warn && this.doseOut === 'taken' && !this.medOverride) e.push('Allergy status not confirmed — acknowledge before giving.')
      if (this.medRecon && this.doseOut === 'taken' && !this.medOverride) e.push(`Order not reconciled: ${this.medRecon.reason}. Resolve or override.`)
      if (this.medBlock && this.medBlock.hard && this.doseOut === 'taken' && !this.medOverride) e.push(`Blocked: ${this.medBlock.reason}. Override required.`)
      if (this.medOverride && !this.overrideReason) e.push('Override needs a reason.')
      this.errors = e
      if (e.length) { window.__notify('Complete the required fields', 'warning'); return }
      const { status, planMet } = deriveDose(this.supportAction, this.doseOut)
      const label = (DOSE_OUTCOMES.find((d) => d.id === this.doseOut) || {}).label
      const saLabel = (SUPPORT_ACTIONS.find((s) => s.id === this.supportAction) || {}).label
      const mar = MAR_STATUS_CODES.find((m) => m.code === this.marCode) || {}
      const witnessNote = this.witnessedBy ? (this.witnessEligible() ? this.witnessedBy : `${this.witnessedBy} (not eligible)`) : (this.witnessFallback ? `Fallback: ${(WITNESS_FALLBACKS.find((f) => f.id === this.witnessFallback) || {}).label}` : '')
      carerStore.saveMed({ visitId: this.visitId, suId: this.rota.suId, medId: med.id, name: med.name, dose: med.dose, group: med.group, supportAction: this.supportAction, doseOut: this.doseOut, marCode: this.marCode, managerReview: mar.managerReview === 'required', outcome: `[${this.marCode}] ${mar.label || label}`, status, planMet, witnessedBy: witnessNote, prnReason: this.prnReason, note: this.form.note, time: this.form.time, effect: this.form.effect, override: this.medOverride ? this.overrideReason : '', reconFlag: this.medRecon ? this.medRecon.reason : '' })
      this.refresh(); this.sheet = null
      const bad = ['refused', 'unavailable', 'omitted'].includes(this.doseOut)
      if (this.medOverride) window.__notify(`Override recorded — office alerted (${med.name})`, 'warning')
      else window.__notify(bad ? `eMAR alert: ${med.name} — ${label}` : `eMAR: ${med.name} — ${label}`, bad ? 'warning' : 'success')
    },

    /* ---------- observations ---------- */
    openObs(type) {
      this.activeObs = type; this.errors = []
      this.form = this.defaultForm(type.fields)
      this.sheet = 'obsForm'
    },
    validateObs() {
      const e = []
      this.activeObs.fields.forEach((f) => { if (this.fieldNeeded(f) && !this.hasValue(f)) e.push(`"${f.label}" is required.`) })
      // §19.17 — physiologically-impossible value → correct & re-read before it can escalate.
      this.activeObs.fields.forEach((f) => { const msg = implausible(this.activeObs.id, f.key, this.form[f.key]); if (msg) e.push(msg) })
      this.errors = e; return !e.length
    },
    saveObs() {
      if (!this.validateObs()) { window.__notify('Complete the required fields', 'warning'); return }
      const flag = evaluateObsFlag(this.activeObs, this.form)
      const pid = flag === 'abnormal' ? protocolFor(this.activeObs.id, this.form) : null
      carerStore.addObservation({ visitId: this.visitId, suId: this.rota.suId, typeId: this.activeObs.id, typeName: this.activeObs.name, icon: this.activeObs.icon, values: { ...this.form }, flag, protocolId: pid })
      this.refresh()
      if (pid) { window.__notify(`Abnormal ${this.activeObs.name} — launching protocol`, 'warning'); this.launchProtocol(pid); return }
      this.sheet = null; this.tab = 'obs'
      window.__notify(flag === 'abnormal' ? `Abnormal ${this.activeObs.name} — office alerted` : `${this.activeObs.name} recorded`, flag === 'abnormal' ? 'warning' : 'success')
    },

    /* ---------- emergency protocol runner (§51) ---------- */
    launchProtocol(id) {
      const p = protocol(id); if (!p) return
      this.activeProtocol = { id: p.id, name: p.name, version: p.version, steps: p.steps } // version pinned at launch
      this.protoStep = 0; this.protoLog = {}; this.protoAdvice = ''; this.protoContact = ''; this.protoOutcome = ''
      this.sheet = 'protocol'
    },
    get protoCurrent() { return this.activeProtocol ? this.activeProtocol.steps[this.protoStep] : null },
    protoMark(k) { this.protoLog[k] = !this.protoLog[k] },
    protoContactPick(o) { this.protoContact = o.label; window.__notify(`Calling ${o.label}…`, 'info') },
    get protoCanAdvance() {
      const s = this.protoCurrent; if (!s) return false
      if (s.type === 'acknowledge') return !!this.protoLog.ack
      if (s.type === 'advice') return !!this.protoAdvice.trim()
      if (s.type === 'contact') return !!this.protoContact
      if (s.type === 'closure') return !!this.protoOutcome
      return true
    },
    protoNext() {
      if (!this.protoCanAdvance) { window.__notify('Complete this step first', 'warning'); return }
      if (this.protoStep < this.activeProtocol.steps.length - 1) this.protoStep++
    },
    closeProtocol() {
      if (!this.protoOutcome) { window.__notify('Record an outcome to close', 'warning'); return }
      const row = carerStore.addProtocolRun({ visitId: this.visitId, suId: this.rota.suId, suName: this.su.name, protocolId: this.activeProtocol.id, name: this.activeProtocol.name, version: this.activeProtocol.version, contact: this.protoContact, advice: this.protoAdvice, outcome: this.protoOutcome })
      this.refresh(); this.sheet = null
      window.__notify(`${row.ref} closed — ${this.activeProtocol.name} · office alerted`, 'warning')
      this.activeProtocol = null
    },
    obsSummary(o) {
      const t = observationType(o.typeId)
      return (t?.fields || []).filter((f) => f.key !== 'note' && o.values[f.key] !== '' && o.values[f.key] != null)
        .map((f) => `${f.type === 'bodymap' ? (o.values[f.key] || []).map((m) => (m && (m.part || m.view)) || '').filter(Boolean).join(', ') : o.values[f.key]}${f.unit ? ' ' + f.unit : ''}`).filter(Boolean).slice(0, 3).join(' · ')
    },
    /** The normal range for the breached numeric field of an observation type. */
    normalRange(o) {
      const t = observationType(o.typeId); if (!t) return ''
      const f = (t.fields || []).find((x) => x.type === 'number' && (x.normalMin != null || x.normalMax != null))
      return f ? `Normal ${f.normalMin}–${f.normalMax}${f.unit ? ' ' + f.unit : ''}` : ''
    },

    /* ---------- incidents ---------- */
    resetIncident() { this.inc = { typeId: '', severity: '', datetime: this.clock?.in || '07:40', location: 'Service user home', description: '', witnesses: '', injuries: [], actions: '', informed: [], riddor: false, safeguarding: false, photo: '', verbatim: '', fact: '', interpretation: '' } },
    /* §55.6 — drafts / auto-save */
    get incidentDraft() { return carerStore.getDraft(this.visitId, 'incident') },
    openIncident() {
      const dr = carerStore.getDraft(this.visitId, 'incident')
      if (dr) { this.inc = { ...dr }; window.__notify('Resumed your saved draft', 'info') } else this.resetIncident()
      this.errors = []; this.sheet = 'incident'
    },
    persistDraft() {
      const i = this.inc
      if (!i || (!i.typeId && !i.description && !i.actions)) return
      carerStore.saveDraft(this.visitId, 'incident', JSON.parse(JSON.stringify(i)))
    },
    discardDraft() { carerStore.clearDraft(this.visitId, 'incident'); this.resetIncident(); window.__notify('Draft discarded', 'info') },
    pickIncidentType(t) { this.inc.typeId = t.id; this.inc.riddor = !!t.riddor; this.inc.safeguarding = !!t.safeguarding },
    toggleInformed(o) { const i = this.inc.informed.indexOf(o); i > -1 ? this.inc.informed.splice(i, 1) : this.inc.informed.push(o) },
    toggleInjury(r) { const i = this.inc.injuries.indexOf(r); i > -1 ? this.inc.injuries.splice(i, 1) : this.inc.injuries.push(r) },
    submitIncident() {
      const e = []
      if (!this.inc.typeId) e.push('Choose an incident type.')
      if (!this.inc.severity) e.push('Choose a severity.')
      if (!this.inc.description.trim()) e.push('Describe what happened.')
      if (!this.inc.actions.trim()) e.push('Record the immediate action taken.')
      if (!this.inc.informed.length) e.push('Record who was informed.')
      if (this.inc.typeId === 'safeguarding') {
        if (!this.inc.verbatim.trim()) e.push('Record the person’s exact words (verbatim).')
        if (!this.inc.fact.trim()) e.push('Record the facts (what you observed).')
      }
      this.errors = e
      if (e.length) { window.__notify('Complete the incident report', 'warning'); return }
      const t = incidentType(this.inc.typeId)
      const row = carerStore.addIncident({ visitId: this.visitId, suId: this.rota.suId, suName: this.su.name, typeId: this.inc.typeId, typeName: t.name, ...this.inc })
      carerStore.clearDraft(this.visitId, 'incident')
      this.refresh(); this.sheet = null; this.tab = 'log'; this.resetIncident()
      window.__notify(`${row.ref} reported & escalated to office${row.riddor ? ' · RIDDOR flagged' : ''}`, 'warning')
    },

    /* ---------- notes / messages / sync ---------- */
    saveNote() { carerStore.setNote(this.visitId, this.note); window.__notify('Handover note saved', 'success') },
    ackHandover() { carerStore.ackHandover(this.visitId); this.handoverAcked = true; window.__notify('Handover acknowledged', 'success') },
    /* §21 — voice notes (real MediaRecorder, graceful fallback) */
    async startVoice() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        __voiceChunks = []
        __voiceRec = new MediaRecorder(stream)
        __voiceRec.ondataavailable = (e) => __voiceChunks.push(e.data)
        __voiceRec.onstop = () => { this.voiceUrl = URL.createObjectURL(new Blob(__voiceChunks, { type: 'audio/webm' })); stream.getTracks().forEach((t) => t.stop()) }
        __voiceRec.start(); this.voiceRecording = true
      } catch (e) {
        window.__notify('Microphone unavailable — voice note simulated', 'info'); this.voiceUrl = 'voice_note.webm'; this.voiceRecording = false
      }
    },
    stopVoice() { try { if (__voiceRec && __voiceRec.state !== 'inactive') __voiceRec.stop() } catch (e) { /* noop */ } this.voiceRecording = false; window.__notify('Voice note saved to visit', 'success') },
    sendMessage() { if (!this.msgText.trim()) return; carerStore.addMessage({ visitId: this.visitId, to: 'Office', text: this.msgText }); this.msgText = ''; this.refresh(); window.__notify('Message sent to office', 'success') },
    syncNow() { carerStore.sync(); this.queued = 0; window.__notify('All records synced', 'success') },

    /* ---------- charts / running totals ---------- */
    get fluidTarget() { return this.su.id === 'su-mary' ? 1500 : 1200 },
    get fluidRecords() {
      const rows = []
      this.observations.filter((o) => o.typeId === 'fluid').forEach((o) => rows.push({ time: o.at, label: o.values.drinkType || 'Drink', ml: Number(o.values.amount) || 0 }))
      this.tasks.forEach((t) => { const e = t.record && t.record.evidence; if (e && e.amountMl) rows.push({ time: t.record.at, label: e.drinkType || t.title, ml: Number(e.amountMl) || 0 }) })
      return rows.sort((a, b) => a.time.localeCompare(b.time))
    },
    get fluidTotal() { return this.fluidRecords.reduce((s, r) => s + r.ml, 0) },
    get fluidPct() { return Math.min(100, Math.round((this.fluidTotal / this.fluidTarget) * 100)) },
    get foodRecords() {
      const rows = []
      this.observations.filter((o) => o.typeId === 'food').forEach((o) => rows.push({ time: o.at, label: o.values.meal || 'Meal', eaten: o.values.eaten }))
      this.tasks.forEach((t) => { const e = t.record && t.record.evidence; if (e && e.amountEaten) rows.push({ time: t.record.at, label: e.mealOffered || t.title, eaten: e.amountEaten }) })
      return rows.sort((a, b) => a.time.localeCompare(b.time))
    },
    get repositions() { return this.observations.filter((o) => o.typeId === 'reposition').map((o) => ({ time: o.at, position: o.values.position })) },
    get obsTrend() { return this.observations.slice(0, 8) },

    /* ---------- daily-log timeline ---------- */
    get timeline() {
      const ev = []
      if (this.clock.in) ev.push({ time: this.clock.in, title: 'Clocked in', detail: 'GPS confirmed', tone: 'primary' })
      this.tasks.filter((t) => t.record).forEach((t) => ev.push({ time: t.record.at, title: t.title, detail: t.record.outcomeLabel, tone: ['refused', 'flagged', 'unable'].includes(t.record.status) ? 'danger' : 'success' }))
      this.medRows.forEach((m) => ev.push({ time: m.at, title: `${m.name} ${m.dose}`, detail: m.outcome, tone: ['refused', 'unable'].includes(m.status) ? 'danger' : 'success' }))
      this.observations.forEach((o) => ev.push({ time: o.at, title: o.typeName, detail: this.obsSummary(o), tone: o.flag === 'abnormal' ? 'danger' : 'teal' }))
      this.incidents.forEach((i) => ev.push({ time: i.at, title: `${i.ref} · ${i.typeName}`, detail: i.severity, tone: 'danger' }))
      this.messages.forEach((m) => ev.push({ time: m.at, title: 'Message to office', detail: m.text, tone: 'ink' }))
      if (this.clock.out) ev.push({ time: this.clock.out, title: 'Clocked out', detail: 'Visit complete', tone: 'success' })
      return ev.sort((a, b) => a.time.localeCompare(b.time))
    },

    /* ---------- signatures ---------- */
    signVisit(who) {
      const t = this.clock.out || this.clock.in || '07:35'
      if (who === 'carer') this.sigCarer = `Aisha Khan · ${t}`
      else this.sigClient = `${this.su.name} · ${t}`
    },
  }))
}

export function openEvidenceSheet() {}

/* =====================================================================
   Phone frame + reusable markup
   ===================================================================== */
function phone(inner) {
  return html`
    <div class="mx-auto" style="max-width:420px">
      <div class="rounded-[2.25rem] bg-ink-900 p-3 shadow-2xl">
        <div class="rounded-[1.85rem] bg-canvas overflow-hidden h-[820px] flex flex-col relative">
          <div class="absolute top-0 inset-x-0 h-7 flex items-center justify-center z-40 pointer-events-none"><span class="w-24 h-5 bg-ink-900 rounded-b-2xl"></span></div>
          ${inner}
        </div>
      </div>
    </div>`
}

/* schema field controls (reused by task + observation forms) */
function fieldControls(loopExpr) {
  return html`
    <template x-for="f in ${loopExpr}" :key="f.key">
      <div class="mb-4">
        <label class="label" x-text="f.label + (fieldNeeded(f) ? ' *' : '')"></label>
        <template x-if="f.type==='boolean'">
          <div class="flex gap-2.5">
            <button type="button" @click="setBool(f.key,true)" :class="form[f.key]===true ? 'bg-success-600 text-white' : 'bg-ink-100 text-ink-500'" class="flex-1 h-11 rounded-xl inline-flex items-center justify-center gap-1.5 text-sm font-semibold">${icon('check', 'w-4 h-4')}Yes</button>
            <button type="button" @click="setBool(f.key,false)" :class="form[f.key]===false ? 'bg-danger-500 text-white' : 'bg-ink-100 text-ink-500'" class="flex-1 h-11 rounded-xl inline-flex items-center justify-center gap-1.5 text-sm font-semibold">${icon('x', 'w-4 h-4')}No</button>
          </div>
        </template>
        <template x-if="f.type==='select'">
          <select x-model="form[f.key]" class="field field-md"><option value="">Select…</option><template x-for="o in f.options" :key="o"><option :value="o" x-text="o"></option></template></select>
        </template>
        <template x-if="f.type==='checklist'">
          <div class="space-y-1.5"><template x-for="o in f.options" :key="o">
            <button type="button" @click="toggleCheck(f.key,o)" :class="(form[f.key]||[]).includes(o) ? 'ring-primary-400 bg-primary-50' : 'ring-ink-200'" class="w-full flex items-center gap-2.5 p-2.5 rounded-lg ring-1 text-left">
              <span class="w-5 h-5 rounded grid place-items-center shrink-0" :class="(form[f.key]||[]).includes(o) ? 'bg-primary-600 text-white' : 'ring-1 ring-ink-300'"><span x-show="(form[f.key]||[]).includes(o)">${icon('check', 'w-3.5 h-3.5')}</span></span>
              <span class="text-sm text-ink-700" x-text="o"></span>
            </button></template></div>
        </template>
        <template x-if="f.type==='number'">
          <div class="relative"><input type="number" :min="f.min" :max="f.max" :step="f.step||1" x-model.number="form[f.key]" class="field field-md" :class="f.unit && 'pr-14'" placeholder="0" /><span x-show="f.unit" class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-400" x-text="f.unit"></span></div>
        </template>
        <template x-if="f.type==='score'">
          <div class="flex flex-wrap gap-1.5"><template x-for="sv in f.range" :key="sv"><button type="button" @click="setScore(f.key,sv)" :class="form[f.key]===sv ? 'bg-primary-600 text-white ring-primary-600' : 'ring-ink-200 text-ink-600'" class="w-9 h-9 rounded-lg ring-1 text-sm font-semibold" x-text="sv"></button></template></div>
        </template>
        <template x-if="f.type==='textarea'"><textarea x-model="form[f.key]" rows="3" class="field px-3 py-2" placeholder="Type a note…"></textarea></template>
        <template x-if="f.type==='text'"><input type="text" x-model="form[f.key]" class="field field-md" placeholder="…" /></template>
        <template x-if="f.type==='datetime'"><input type="time" x-model="form[f.key]" class="field field-md" /></template>
        <template x-if="f.type==='signature'">
          <button type="button" @click="sign(f.key)" class="w-full h-16 rounded-lg ring-1 ring-dashed grid place-items-center text-sm" :class="form[f.key] ? 'ring-success-300 bg-success-50 text-success-700' : 'ring-ink-300 bg-ink-50/50 text-ink-400'">
            <span x-show="!form[f.key]" class="inline-flex items-center gap-2">${icon('signature', 'w-5 h-5')}Tap to sign</span>
            <span x-show="form[f.key]" class="inline-flex items-center gap-2 font-medium">${icon('check-circle', 'w-5 h-5')}<span x-text="form[f.key]"></span></span>
          </button>
        </template>
        <template x-if="f.type==='photo'">
          <label class="w-full min-h-14 py-2 rounded-lg ring-1 ring-dashed grid place-items-center text-sm cursor-pointer" :class="form[f.key] ? 'ring-success-300 bg-success-50 text-success-700' : 'ring-ink-300 bg-ink-50/50 text-ink-400'">
            <input type="file" accept="image/*" capture="environment" class="hidden" @change="onPhoto($event, f.key)" />
            <span x-show="!form[f.key]" class="inline-flex items-center gap-2">${icon('eye', 'w-5 h-5')}Take / add photo</span>
            <span x-show="form[f.key]" class="inline-flex items-center gap-2"><img :src="photoPreviews[f.key]" x-show="photoPreviews[f.key]" class="w-10 h-10 rounded object-cover" /><span x-text="form[f.key]"></span></span>
          </label>
        </template>
        <template x-if="f.type==='bodymap'">${bodyMapControl('form[f.key]', (r) => `toggleBody(f.key, '${r}')`)}</template>
      </div>
    </template>`
}

/** Interactive body-map recorder. Standing / Sitting / Lying posture SVGs
 *  (public/body-map/*.svg, pulled from careflow-platform). Tap the body to drop a
 *  marker stored as { view, x, y, part } where x/y are % of the rendered figure
 *  (careflow's viewBox-percent approach). `arrExpr` is the Alpine array to bind
 *  (e.g. 'form[f.key]' or 'inc.injuries'); it's read/written in place. */
function bodyMapControl(arrExpr) {
  const views = [['standing', 'Standing'], ['sitting', 'Sitting'], ['lying', 'Lying']]
  const seg = views.map(([id, label]) => `<button type="button" @click="view='${id}'" :class="view==='${id}' ? 'bg-white text-ink-900 shadow-[var(--shadow-card)]' : 'text-ink-500'" class="flex-1 h-8 rounded-md text-xs font-semibold">${label}</button>`).join('')
  return html`
    <div x-data="{ view:'standing' }">
      <div class="flex gap-1 bg-ink-100 rounded-lg p-1 mb-2">${seg}</div>
      <datalist id="bm-parts">${BODY_PART_SUGGESTIONS.map((p) => `<option value="${esc(p)}"></option>`).join('')}</datalist>
      <div class="relative mx-auto rounded-lg ring-1 ring-ink-200 bg-white overflow-hidden select-none" style="max-width:280px"
        @click="if($event.target.closest('[data-pin]'))return; const r=$event.currentTarget.getBoundingClientRect(); const x=Math.round((($event.clientX-r.left)/r.width)*1000)/10; const y=Math.round((($event.clientY-r.top)/r.height)*1000)/10; if(x<0||x>100||y<0||y>100)return; const p=(window.__bodySnap?window.__bodySnap(view,x,y):''); (${arrExpr} = ${arrExpr} || []).push({ view, x, y, part:p }); if(p) window.__notify('Marked: '+p,'info')">
        <img :src="'/body-map/'+view+'.svg'" class="w-full block pointer-events-none" alt="Body map — tap to mark a point" />
        ${[['sitting', SITTING_HOTSPOTS], ['lying', LYING_HOTSPOTS]].map(([v, spots]) => spots.map((s) => `<span x-show="view==='${v}'" class="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-1 ring-primary-400/70 bg-primary-400/15 pointer-events-none" style="left:${s.x}%;top:${s.y}%" title="${esc(s.part)}"></span>`).join('')).join('')}
        <template x-for="(m,i) in (${arrExpr}||[])" :key="i">
          <button data-pin type="button" x-show="m.view===view" @click.stop="${arrExpr}.splice(i,1)" class="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-danger-500 text-white text-[10px] font-bold grid place-items-center ring-2 ring-white shadow-[var(--shadow-pop)]" :style="'left:'+m.x+'%;top:'+m.y+'%'" x-text="i+1"></button>
        </template>
      </div>
      <p class="text-xs text-ink-400 mt-1.5 text-center">Tap the body to mark a point · tap a pin to remove</p>
      <div class="mt-2 space-y-1.5" x-show="(${arrExpr}||[]).length" x-cloak>
        <template x-for="(m,i) in (${arrExpr}||[])" :key="i">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-danger-500 text-white grid place-items-center text-[10px] font-bold shrink-0" x-text="i+1"></span>
            <span class="text-xs text-ink-400 capitalize w-12 shrink-0" x-text="m.view"></span>
            <input x-model="m.part" list="bm-parts" class="field field-md !h-8 !text-xs flex-1" placeholder="Body part / note (e.g. left heel — redness)" />
            <button type="button" @click="${arrExpr}.splice(i,1)" aria-label="Remove" class="text-ink-400 text-lg leading-none px-1">×</button>
          </div>
        </template>
      </div>
    </div>`
}

/* Header for a bottom-sheet record form: a grabber handle + title + close.
   Used by the task / medication / observation record sheets. */
const recordSheetHeader = (titleExpr, subExpr) => html`
  <div class="shrink-0 bg-surface">
    <div class="mx-auto w-9 h-1.5 rounded-full bg-ink-200 mt-2.5"></div>
    <div class="px-4 py-2.5 border-b border-ink-100 flex items-center gap-2">
      <div class="min-w-0 flex-1"><p class="text-base font-bold tracking-tight text-ink-900 truncate" x-text="${titleExpr}"></p><p class="text-xs text-ink-400" x-text="${subExpr}"></p></div>
      <button @click="sheet=null; errors=[]" class="btn btn-ghost btn-sm !px-2">${icon('x', 'w-5 h-5')}</button>
    </div>
  </div>`

const errorBox = html`<div x-show="errors.length" x-cloak class="rounded-xl bg-danger-50 ring-1 ring-danger-100 p-3"><p class="text-xs font-semibold text-danger-700 mb-1 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}Please fix:</p><ul class="text-sm text-danger-800 list-disc pl-5 space-y-0.5"><template x-for="e in errors" :key="e"><li x-text="e"></li></template></ul></div>`

/* One consistent alert banner for every sheet. tone → colours + default icon.
   Pass `inner` (a title <p> and/or body <p>s, or a plain string) — the shell owns
   radius, tone, top-aligned icon, padding and 13px text so banners never drift. */
const BANNER_TONE = {
  info: { cls: 'bg-info-50 ring-info-100 text-info-800', ic: 'info' },
  warning: { cls: 'bg-warning-50 ring-warning-100 text-warning-800', ic: 'alert' },
  danger: { cls: 'bg-danger-50 ring-danger-200 text-danger-800', ic: 'alert' },
  primary: { cls: 'bg-primary-50 ring-primary-100 text-primary-800', ic: 'info' },
  success: { cls: 'bg-success-50 ring-success-100 text-success-800', ic: 'check-circle' },
}
const banner = (tone, inner, iconName) => {
  const t = BANNER_TONE[tone] || BANNER_TONE.warning
  return html`<div class="rounded-xl ring-1 ${t.cls} p-3.5 flex items-start gap-2.5">${icon(iconName || t.ic, 'w-4 h-4 shrink-0 mt-0.5')}<div class="min-w-0 flex-1 text-[13px] leading-relaxed">${inner}</div></div>`
}

/* One selectable MAR outcome row (colour dot + label + manager-review flag + tick).
   Rendered inside an x-for over `m` — used for both the default set and the rest. */
const marOutcomeRow = html`<button type="button" @click="pickMar(m.code)" :class="marCode===m.code ? 'bg-primary-50' : 'bg-surface'" class="w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-ink-50"><span class="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/5" :style="'background:'+m.color"></span><span class="flex-1 text-sm font-medium text-ink-800" x-text="m.label"></span><template x-if="m.managerReview==='required'"><span class="text-[11px] font-medium text-warning-700 shrink-0">review</span></template><span x-show="marCode===m.code" x-cloak class="text-primary-600 shrink-0">${icon('check', 'w-4 h-4')}</span></button>`

/* =====================================================================
   Home — rota across service users
   ===================================================================== */
export function renderCarer() {
  const visits = ROTA.map((r) => {
    const v = buildVisit(r.id)
    return { ...r, su: v.su, prog: visitProgressFor(v), clock: carerStore.clock(r.id) }
  })
  const queued = carerStore.queued()
  const done = visits.filter((v) => v.clock.out).length

  const inner = html`
    <div class="flex flex-col h-full">
      <div class="bg-primary-700 text-white px-5 pt-9 pb-4">
        <div class="flex items-center justify-between">
          <div><p class="text-xs text-primary-100">Tuesday, 30 June 2026</p><h2 class="text-lg font-bold mt-0.5">Your round today</h2></div>
          <span class="w-10 h-10 rounded-full bg-primary-600 grid place-items-center text-sm font-semibold ring-2 ring-primary-400">AK</span>
        </div>
        <div class="mt-3 flex items-center gap-3 text-primary-100 text-xs">
          <span class="flex items-center gap-1">${icon('map-pin', 'w-3.5 h-3.5')}${ROTA.length} visits</span>
          <span class="flex items-center gap-1">${icon('check-circle', 'w-3.5 h-3.5')}${done} done</span>
          <span class="flex items-center gap-1">${icon('users', 'w-3.5 h-3.5')}Aisha Khan</span>
        </div>
      </div>

      <div class="px-4 pt-3">
        <div class="rounded-xl ${queued ? 'bg-warning-50 ring-warning-100' : 'bg-success-50 ring-success-100'} ring-1 p-3 flex items-center gap-3">
          <span class="${queued ? 'text-warning-600' : 'text-success-600'}">${icon(queued ? 'wifi' : 'check-circle', 'w-5 h-5')}</span>
          <div class="flex-1 min-w-0"><p class="text-sm font-semibold ${queued ? 'text-warning-800' : 'text-success-800'}">${queued ? `${queued} record${queued > 1 ? 's' : ''} queued offline` : 'All records synced'}</p><p class="text-xs ${queued ? 'text-warning-700' : 'text-success-700'}">Point-of-care recording works offline.</p></div>
          ${queued ? `<button onclick="window.__carerSync()" class="btn btn-secondary btn-sm">${icon('refresh', 'w-3.5 h-3.5')}Sync</button>` : ''}
        </div>
      </div>

      <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
        ${map(visits, (v) => {
          const status = v.clock.out ? 'Completed' : v.clock.in ? 'In progress' : 'Upcoming'
          const tone = v.clock.out ? 'bg-success-50 text-success-700 ring-success-100' : v.clock.in ? 'bg-warning-50 text-warning-700 ring-warning-100' : 'bg-ink-100 text-ink-500 ring-ink-200'
          return html`<a href="#/carer/${v.id}" class="block card p-4 active:scale-[.99] transition-transform">
            <div class="flex items-center gap-3">
              ${`<span class="w-11 h-11 rounded-xl grid place-items-center font-semibold text-sm ${v.su.color === 'warning' ? 'bg-warning-100 text-warning-700' : v.su.color === 'teal' ? 'bg-teal-100 text-teal-700' : v.su.color === 'danger' ? 'bg-danger-100 text-danger-700' : 'bg-primary-100 text-primary-700'}">${v.su.initials}</span>`}
              <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(v.su.name)}</p><p class="text-xs text-ink-400">${esc(v.visit)} · ${esc(v.time)}${v.twoCarer ? ' · 2 carers' : ''}</p></div>
              ${badge(status, tone)}
            </div>
            <div class="mt-3 flex items-center gap-3">
              <div class="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden"><div class="h-1.5 ${v.prog.pct === 100 ? 'bg-success-500' : 'bg-primary-500'} rounded-full" style="width:${v.prog.pct}%"></div></div>
              <span class="text-xs font-medium text-ink-500">${v.prog.done}/${v.prog.total}</span>
            </div>
          </a>`
        })}
      </div>
      <div class="p-3 border-t border-ink-200 bg-surface flex items-center justify-between">
        <p class="text-xs text-ink-400">Riverside Care · v2</p>
        <button onclick="window.__carerReset()" class="text-xs text-ink-400 hover:text-danger-600 flex items-center gap-1">${icon('refresh', 'w-3 h-3')}Reset demo</button>
      </div>
    </div>`

  return page(html`
    ${pageHeader({ title: 'Carer mobile app', subtitle: 'Enterprise point-of-care: rota, tasks, eMAR, clinical observations and incident reporting — fully working, persisted, offline-ready.', breadcrumbs: [{ label: 'Carer App' }] })}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      ${phone(inner)}
      <div class="space-y-4 max-w-md">
        ${sectionCard({ title: 'Capabilities', icon: 'sparkles', body: html`<div class="grid grid-cols-2 gap-2 text-sm text-ink-600">
          ${map(['Multi-user rota', 'Clock in/out + GPS', 'Required-task gating', 'Full eMAR / MAR chart', 'Controlled-drug witness', 'Allergy cross-check', 'PRN + effectiveness', '20+ observation types', 'NEWS2 & vital signs', 'Auto normal-range flags', 'Incident reporting', 'RIDDOR / safeguarding', 'Body-map injuries', 'Signatures & photos', 'Handover + messaging', 'Offline + persistence'], (f) => `<span class="flex items-center gap-1.5">${icon('check', 'w-3.5 h-3.5 text-success-600')}${f}</span>`)}
        </div>` })}
        ${btn('Open first visit — Mary Adams', { href: '#/carer/v-mary-am', icon: 'arrow-right', full: true })}
      </div>
    </div>
  `)
}

/* =====================================================================
   Visit app
   ===================================================================== */
export function renderCarerVisit({ visit }) {
  const vid = getRota(visit) ? visit : 'v-mary-am'
  const su0 = getServiceUser(getRota(vid).suId)
  const keySafeMarkup = keySafe(su0.keySafeCode)
  const vType = visitTypeFor(vid)
  const vTypeMeta = VISIT_TYPE_META[vType] || VISIT_TYPE_META.standard
  const isBedtime = (getRota(vid).visit || '') === 'Bedtime'

  /* ---- Care-safety info surfaced at the point of care (person-centred / safe) ----
     Critical, glanceable facts (resus status, clinical flags) mirror the allergy
     pattern: a header chip + the About reference sheet. The "how to approach"
     communication/sensory guidance goes on Overview. */
  const flags = su0.flags || []
  const cn = su0.commsNeeds
  const resus = su0.resus
  const resusView = !resus
    ? { tone: 'warning', label: 'Resuscitation not recorded — check ReSPECT', short: 'Resus: check ReSPECT' }
    : /dnacpr|dnar|not for/i.test(resus)
      ? { tone: 'danger', label: resus, short: 'DNACPR' }
      : { tone: 'ok', label: resus, short: resus }
  const chipTone = { danger: 'bg-danger-50 text-danger-700 ring-danger-100', warning: 'bg-warning-50 text-warning-700 ring-warning-100', ok: 'bg-success-50 text-success-700 ring-success-100' }
  const hasHeaderCare = resusView.tone !== 'ok' || flags.length
  const headerCareChips =
    (resusView.tone !== 'ok' ? `<span class="inline-flex items-center gap-1.5 rounded-lg ${chipTone[resusView.tone]} px-2 py-0.5 text-xs font-semibold">${icon('heart', 'w-3.5 h-3.5')}${esc(resusView.short)}</span>` : '') +
    flags.map((f) => `<span class="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 text-ink-700 px-2 py-0.5 text-xs font-semibold">${esc(f)}</span>`).join('')
  const commsChips = cn ? [cn.vision, cn.hearing && cn.hearing !== 'Good' ? 'Hearing: ' + cn.hearing : '', cn.largePrint ? 'Large print' : '', cn.easyRead ? 'Easy Read' : '', cn.bsl ? 'BSL' : ''].filter(Boolean) : []
  const commsCardMarkup = cn ? `<div class="card p-4">
      <p class="section-title mb-1.5 flex items-center gap-1.5">${icon('info', 'w-3.5 h-3.5')}Communication &amp; sensory</p>
      ${cn.aid ? `<p class="text-sm text-ink-700">${esc(cn.aid)}</p>` : ''}
      ${commsChips.length ? `<div class="flex flex-wrap gap-1.5 mt-2">${commsChips.map((x) => `<span class="badge bg-info-50 text-info-600 ring-info-100">${esc(x)}</span>`).join('')}</div>` : ''}
    </div>` : ''
  const aboutCareMarkup = `
      <div class="card p-4"><p class="section-title mb-1.5 flex items-center gap-1.5">${icon('heart', 'w-3.5 h-3.5')}Resuscitation status</p><span class="inline-flex items-center gap-1.5 rounded-lg ${chipTone[resusView.tone]} ring-1 px-2.5 py-1 text-xs font-semibold">${esc(resusView.label)}</span></div>
      ${flags.length ? `<div class="card p-4"><p class="section-title mb-1.5">Clinical flags</p><div class="flex flex-wrap gap-1.5">${flags.map((f) => `<span class="badge bg-ink-100 text-ink-700 ring-ink-200">${esc(f)}</span>`).join('')}</div></div>` : ''}
      ${cn ? `<div class="card p-4"><p class="section-title mb-1.5">Communication &amp; sensory needs</p>${cn.aid ? `<p class="text-sm text-ink-700 mb-1.5">${esc(cn.aid)}</p>` : ''}<div class="flex flex-wrap gap-1.5">${commsChips.map((x) => `<span class="badge bg-info-50 text-info-600 ring-info-100">${esc(x)}</span>`).join('')}</div></div>` : ''}`

  // Care-plan essentials — clinical detail behind the flags. `careNeeds` is an
  // array of { icon, label, lines[] } so it scales to any client's conditions
  // (catheter, moving & handling, dysphagia/SALT, syringe driver, COPD, diabetes…).
  const careRows = su0.careNeeds || []
  const carePlanMarkup = careRows.length ? `<div class="card p-4">
      <p class="section-title mb-3 flex items-center gap-1.5">${icon('file-check', 'w-3.5 h-3.5')}Care plan essentials</p>
      <div class="space-y-3.5">${careRows.map((r) => `<div class="flex gap-3"><span class="w-8 h-8 rounded-lg bg-ink-100 text-ink-600 grid place-items-center shrink-0">${icon(r.icon || 'file-check', 'w-4 h-4')}</span><div class="min-w-0 flex-1"><p class="text-sm font-semibold text-ink-900">${esc(r.label)}</p>${(r.lines || []).map((l, i) => `<p class="text-xs ${i === r.lines.length - 1 && r.lines.length > 1 ? 'text-ink-500 mt-1' : 'text-ink-600 mt-0.5'}">${esc(l)}</p>`).join('')}</div></div>`).join('')}</div>
      <a :href="'#/carer/clients/'+rota.suId+'/careplan'" class="btn btn-secondary btn-sm mt-3.5">${icon('file-check', 'w-3.5 h-3.5')}Full care plan</a>
    </div>` : ''

  // Just-in-time learning — recommend a short course relevant to this client's
  // condition, surfaced at the point of care on Overview.
  const jit = jitCourseForSU(su0)
  const jitMarkup = jit ? `<div class="card p-4 ring-1 ring-primary-100 bg-primary-50/40">
      <p class="section-title mb-1.5 flex items-center gap-1.5 text-primary-700">${icon('sparkles', 'w-3.5 h-3.5')}Just-in-time learning</p>
      <p class="text-sm text-ink-800">Recommended before this visit: <b>${esc(jit.course.title)}</b></p>
      <p class="text-xs text-ink-500 mt-0.5">${esc(String(jit.mins))} min · for ${esc(jit.condition)}</p>
      <a href="#/carer/me/learning" class="btn btn-secondary btn-sm mt-2.5">${icon('sparkles', 'w-3.5 h-3.5')}Open in learning centre</a>
    </div>` : ''

  const inner = html`
    <div class="flex flex-col h-full" x-data="carerApp('${vid}')" x-init="init()">

      <!-- header (minimal — blends into canvas like today.js; identity + safety only) -->
      <div class="bg-canvas text-ink-900 px-5 pt-8 pb-3 shrink-0">
        <div class="flex items-center justify-between">
          <a href="#/carer" class="inline-flex items-center gap-1 text-sm font-medium text-ink-500 active:text-ink-700">${icon('chevron-left', 'w-4 h-4')}Round</a>
          <div class="flex items-center gap-4">
            <button @click="sheet='context'" class="text-sm font-medium text-ink-500 inline-flex items-center gap-1 active:text-ink-700">${icon('info', 'w-4 h-4')}About</button>
            <button @click="sheet='message'" class="text-sm font-medium text-primary-600 inline-flex items-center gap-1 active:text-primary-700">${icon('bell', 'w-4 h-4')}Office</button>
          </div>
        </div>
        <div class="flex items-center gap-3 mt-2.5">
          <span class="w-10 h-10 rounded-full bg-primary-100 text-primary-700 grid place-items-center text-sm font-semibold shrink-0" x-text="su.initials"></span>
          <div class="min-w-0 flex-1"><h2 class="text-lg font-bold leading-tight truncate" x-text="su.name"></h2><p class="text-xs text-ink-500 truncate">DOB <span x-text="su.dob"></span> · <span x-text="rota.visit"></span> · <span x-text="rota.time"></span>${vType !== 'standard' ? ` · ${esc(vTypeMeta.label)}` : ''}</p></div>
          <span x-show="personConfirmed" class="inline-flex items-center gap-1 rounded-full bg-success-50 text-success-700 ring-1 ring-success-100 px-2 py-0.5 text-xs font-semibold shrink-0">${icon('check', 'w-3 h-3')}ID</span>
        </div>
        <div x-show="(su.allergies||[]).length || allergyState.warn || ${hasHeaderCare ? 'true' : 'false'}" class="flex flex-wrap items-center gap-1.5 mt-2">
          <template x-if="(su.allergies||[]).length">
            <span class="inline-flex items-center gap-1.5 rounded-lg bg-danger-50 text-danger-700 px-2 py-0.5 text-xs font-semibold">${icon('alert', 'w-3.5 h-3.5')}Allergies: <span x-text="su.allergies.join(', ')"></span></span>
          </template>
          <template x-if="allergyState.warn">
            <span class="inline-flex items-center gap-1.5 rounded-lg bg-warning-50 text-warning-700 px-2 py-0.5 text-xs font-semibold">${icon('alert', 'w-3.5 h-3.5')}<span x-text="allergyState.label"></span></span>
          </template>
          ${headerCareChips}
        </div>
        <template x-if="rota.twoCarer">
          <div class="mt-2 flex items-center gap-2 rounded-lg bg-primary-50 ring-1 ring-primary-100 px-2.5 py-1">
            <span class="text-xs font-semibold text-primary-700 inline-flex items-center gap-1.5">${icon('users', 'w-3.5 h-3.5')}Two-carer</span>
            <span class="text-xs font-medium" :class="coCarerPresent ? 'text-success-600' : 'text-warning-600'" x-text="coCarerPresent ? '· present' : '· not in'"></span>
            <button @click="coCarerPresent=!coCarerPresent; window.__notify(coCarerPresent ? 'Co-carer checked in' : 'Co-carer left','info')" class="ml-auto text-xs font-semibold rounded-full bg-white ring-1 ring-ink-200 px-2 py-0.5 text-ink-700" x-text="coCarerPresent ? 'Mark left' : 'Arrived'"></button>
          </div>
        </template>
        <div class="mt-3" x-show="clock.in || clock.out" x-cloak>
          <template x-if="clock.in && !clock.out">
            <div><div class="flex justify-between text-xs font-medium text-ink-500 mb-1"><span x-text="'In '+clock.in"></span><span x-text="progress.done+'/'+progress.total+' complete'"></span></div><div class="h-1.5 rounded-full bg-ink-100 overflow-hidden"><div class="h-1.5 bg-primary-500 rounded-full transition-all" :style="'width:'+progress.pct+'%'"></div></div></div>
          </template>
          <template x-if="clock.out">
            <div class="rounded-lg bg-success-50 text-success-700 ring-1 ring-success-100 px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5">${icon('check-circle', 'w-4 h-4')}Clocked out <span x-text="clock.out"></span></div>
          </template>
        </div>
      </div>

      <!-- section tabs -->
      <div class="shrink-0 border-b border-ink-100 bg-surface overflow-x-auto no-scrollbar">
        <div class="flex px-1 min-w-max">
          ${['overview:Overview', 'tasks:Tasks', 'mar:MAR', 'obs:Obs', 'log:Log'].map((t) => { const [id, label] = t.split(':'); return `<button @click="tab='${id}';sheet=null" :class="tab==='${id}' ? 'text-primary-700 border-primary-600' : 'text-ink-500 border-transparent'" class="px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap">${label}</button>` }).join('')}
        </div>
      </div>

      <!-- ===================== TAB CONTENT ===================== -->
      <!-- Freeze the workspace scroll while a bottom sheet is open, so nothing
           behind the sheet can move or peek through on scroll. -->
      <div class="flex-1 overscroll-contain relative" :class="sheet ? 'overflow-hidden' : 'overflow-y-auto'">

        <!-- OVERVIEW -->
        <div x-show="tab==='overview'" class="p-4 space-y-4">
          <template x-if="!clock.in">
            <button @click="openCheckin()" class="btn btn-primary btn-lg w-full">${icon('clock', 'w-4 h-4')}Clock in to start visit</button>
          </template>
          <div class="grid grid-cols-3 gap-2.5">
            <div class="card p-3 text-center"><p class="text-xl font-bold text-ink-900" x-text="tasks.length"></p><p class="text-xs text-ink-500">Tasks</p></div>
            <div class="card p-3 text-center"><p class="text-xl font-bold text-ink-900" x-text="scheduled.length"></p><p class="text-xs text-ink-500">Meds due</p></div>
            <div class="card p-3 text-center"><p class="text-xl font-bold text-ink-900" x-text="observations.length"></p><p class="text-xs text-ink-500">Obs done</p></div>
          </div>
          ${vType !== 'standard' ? `<div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3"><p class="text-xs font-semibold text-info-700 uppercase tracking-wide mb-0.5 flex items-center gap-1.5">${icon('info', 'w-3.5 h-3.5')}${esc(vTypeMeta.label)} visit</p><p class="text-sm text-info-800">${esc(vTypeMeta.note)}</p></div>` : ''}
          ${jitMarkup}
          <!-- §22 pre-visit safety briefing -->
          <div class="rounded-xl bg-warning-50 ring-1 ring-warning-100 p-3.5">
            <p class="text-xs font-semibold text-warning-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Pre-visit safety briefing</p>
            <div class="flex flex-wrap gap-1.5 mb-1.5"><template x-for="r in (su.risks||[])" :key="r"><span class="badge bg-warning-100 text-warning-800 ring-warning-200" x-text="r"></span></template></div>
            <p class="text-xs text-warning-800">Lone-worker visit — keep your phone to hand; start a safety check-in. Report any home/pet hazards.</p>
            <a href="#/carer/me/safety" class="btn btn-secondary btn-sm mt-2">${icon('shield', 'w-3.5 h-3.5')}Lone-worker & SOS</a>
          </div>
          ${commsCardMarkup}
          ${carePlanMarkup}
          ${isBedtime ? `<a href="#/carer/night/${vid}" class="card p-3 flex items-center gap-2.5 active:scale-[.99]"><span class="w-9 h-9 rounded-xl bg-ink-900 text-white grid place-items-center">${icon('clock', 'w-4.5 h-4.5')}</span><div class="flex-1"><p class="text-sm font-semibold text-ink-900">Night rounds</p><p class="text-xs text-ink-400">Interval rounds, wake events, quiet mode</p></div>${icon('chevron-right', 'w-4 h-4 text-ink-300')}</a>` : ''}
          <div class="card p-4"><p class="section-title mb-1.5 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Key-safe / access</p>${keySafeMarkup}<p class="text-xs text-ink-500 mt-1.5" x-text="su.access"></p></div>
          <div class="card p-3.5">
            <div class="flex items-center gap-2 mb-1"><p class="text-xs font-semibold text-ink-400 uppercase tracking-wide flex items-center gap-1.5">${icon('history', 'w-3.5 h-3.5')}Last handover</p><span class="badge bg-warning-50 text-warning-700 ring-warning-100">Temporary note</span></div>
            <p class="text-sm text-ink-700">Previous carer: settled overnight, ate most of supper, drank ~900ml. <b>Left heel slightly red — please recheck and reposition.</b></p>
            <template x-if="!handoverAcked"><button @click="ackHandover()" class="btn btn-primary btn-sm mt-2">${icon('check', 'w-3.5 h-3.5')}Acknowledge before care</button></template>
            <template x-if="handoverAcked"><p class="text-xs text-success-700 mt-1.5 flex items-center gap-1">${icon('check-circle', 'w-3.5 h-3.5')}Acknowledged</p></template>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <a :href="'#/carer/clients/'+rota.suId+'/careplan'" class="card p-3 flex items-center gap-2 active:bg-ink-50"><span class="w-8 h-8 rounded-lg bg-ink-100 text-ink-600 grid place-items-center">${icon('file-check', 'w-4 h-4')}</span><span class="text-sm font-semibold text-ink-800">Care plan</span></a>
            <a :href="'#/carer/clients/'+rota.suId" class="card p-3 flex items-center gap-2 active:bg-ink-50"><span class="w-8 h-8 rounded-lg bg-ink-100 text-ink-600 grid place-items-center">${icon('users', 'w-4 h-4')}</span><span class="text-sm font-semibold text-ink-800">Full profile</span></a>
          </div>
        </div>

        <!-- TASKS -->
        <div x-show="tab==='tasks'" class="p-4 space-y-5">
          <div>
            <p class="section-title mb-2.5">Required tasks</p>
            <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
              <template x-for="t in requiredTasks" :key="t.id">
                <button @click="openTask(t.id)" class="w-full text-left p-4 flex items-center gap-3 active:bg-ink-50">
                  <span class="w-6 h-6 rounded-md grid place-items-center shrink-0" :class="statusOf(t)==='completed' ? 'bg-success-500 text-white' : statusOf(t)==='pending' ? 'ring-1 ring-ink-300' : (statusOf(t)==='partial' ? 'bg-warning-500 text-white' : 'bg-danger-500 text-white')"><span x-show="statusOf(t)!=='pending'" x-html="window.__icon(statusOf(t))"></span></span>
                  <span x-html="window.__catIcon(t.categoryId)"></span>
                  <span class="min-w-0 flex-1"><span class="block text-sm font-semibold text-ink-900" :class="statusOf(t)==='completed' && 'line-through text-ink-400'" x-text="t.title"></span><span class="block text-xs"><span x-show="t.isMed" :class="statusColor(statusOf(t))" class="font-medium" x-text="medTaskLabel(t)"></span><span x-show="!t.isMed && t.record" :class="statusColor(statusOf(t))" class="font-medium" x-text="t.record ? t.record.outcomeLabel : ''"></span><span x-show="!t.isMed && !t.record" class="text-ink-500" x-text="t.typeLabel"></span></span></span>
                  <span x-show="t.isMed" class="badge bg-danger-50 text-danger-700 ring-danger-100">eMAR</span>
                  <span x-show="t.twoPerson" class="badge" :class="coCarerPresent ? 'bg-success-50 text-success-700 ring-success-100' : 'bg-warning-50 text-warning-700 ring-warning-100'">${icon('users', 'w-3 h-3')}2</span>
                  <span class="text-ink-300">${icon('chevron-right', 'w-4 h-4')}</span>
                </button>
              </template>
              <p x-show="!requiredTasks.length" class="text-sm text-ink-500 text-center py-4">No required tasks for this visit.</p>
            </div>
          </div>
          <div x-show="optionalTasks.length">
            <p class="section-title mb-2.5">Optional</p>
            <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
              <template x-for="t in optionalTasks" :key="t.id">
                <button @click="openTask(t.id)" class="w-full text-left p-4 flex items-center gap-3 active:bg-ink-50">
                  <span class="w-6 h-6 rounded-md grid place-items-center shrink-0" :class="statusOf(t)==='completed' ? 'bg-success-500 text-white' : statusOf(t)==='pending' ? 'ring-1 ring-ink-300' : 'bg-danger-500 text-white'"><span x-show="statusOf(t)!=='pending'" x-html="window.__icon(statusOf(t))"></span></span>
                  <span x-html="window.__catIcon(t.categoryId)"></span>
                  <span class="min-w-0 flex-1"><span class="block text-sm font-semibold text-ink-900" :class="statusOf(t)==='completed' && 'line-through text-ink-400'" x-text="t.title"></span><span class="block text-xs text-ink-500" x-text="t.record ? t.record.outcomeLabel : t.typeLabel"></span></span>
                  <span class="text-ink-300">${icon('chevron-right', 'w-4 h-4')}</span>
                </button>
              </template>
            </div>
          </div>

          <!-- clock-out -->
          <div x-show="clock.in && !clock.out" class="pt-1">
            <div x-show="blocking.length" x-cloak class="rounded-lg bg-warning-50 ring-1 ring-warning-100 p-2.5 mb-2.5"><p class="text-xs font-semibold text-warning-800 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}<span x-text="blocking.length+' required before clock-out'"></span></p><p class="text-xs text-warning-700 mt-0.5" x-text="blocking.join(', ')"></p></div>
            <button @click="sheet='summary'" class="btn btn-secondary btn-md w-full mb-2">${icon('list', 'w-4 h-4')}Review visit summary</button>
            <button @click="startClockOut()" :disabled="!canClockOut" class="btn btn-lg w-full" :class="canClockOut ? 'btn-primary' : 'btn-secondary opacity-60'">${icon('check-circle', 'w-5 h-5')}<span x-text="canClockOut ? 'Complete visit & clock out' : 'Record required items first'"></span></button>
          </div>
        </div>

        <!-- MAR -->
        <div x-show="tab==='mar'" x-cloak class="p-4 space-y-5">
          <div class="rounded-xl bg-primary-50 ring-1 ring-primary-100 p-3 text-sm text-primary-800 flex items-center gap-2">${icon('pill', 'w-4 h-4')}Electronic MAR — record every scheduled medicine before clock-out.</div>
          <div>
            <p class="section-title mb-2.5">Scheduled — <span x-text="rota.visit"></span></p>
            <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
              <template x-for="m in scheduled" :key="m.id">
                <button @click="openMed(m)" class="w-full text-left p-4 flex items-center gap-3 active:bg-ink-50">
                  <span class="w-6 h-6 rounded-md grid place-items-center shrink-0" :class="medRec(m.id) ? (['refused','unable'].includes(medRec(m.id).status) ? 'bg-danger-500 text-white' : medRec(m.id).status==='partial' ? 'bg-warning-500 text-white' : 'bg-success-500 text-white') : 'ring-1 ring-ink-300'"><span x-show="medRec(m.id)" x-html="window.__icon(medRec(m.id) ? medRec(m.id).status : 'pending')"></span></span>
                  <span class="w-8 h-8 rounded-lg bg-danger-50 text-danger-600 grid place-items-center shrink-0">${icon('pill', 'w-4 h-4')}</span>
                  <span class="min-w-0 flex-1"><span class="block text-sm font-semibold text-ink-900" x-text="m.name"></span><span class="block text-xs text-ink-500"><span x-text="m.dose+' · '+m.route+' · '+m.form"></span></span></span>
                  <span class="flex flex-col items-end gap-1">
                    <template x-if="m.timeCritical"><span class="badge bg-warning-50 text-warning-700 ring-warning-100">Time-critical</span></template>
                    <template x-if="m.covert"><span class="badge bg-ink-100 text-ink-600 ring-ink-200">Covert</span></template>
                    <span x-show="medRec(m.id)" class="text-xs font-medium" :class="statusColor(medRec(m.id) ? medRec(m.id).status : '')" x-text="medRec(m.id) ? medRec(m.id).outcome : ''"></span>
                  </span>
                </button>
              </template>
              <p x-show="!scheduled.length" class="text-sm text-ink-500 text-center py-4">No scheduled medication this visit.</p>
            </div>
          </div>
          <div x-show="prn.length">
            <p class="section-title mb-2.5">PRN (as required)</p>
            <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
              <template x-for="m in prn" :key="m.id">
                <button @click="openMed(m)" class="w-full text-left p-4 flex items-center gap-3 active:bg-ink-50">
                  <span class="w-8 h-8 rounded-lg grid place-items-center shrink-0" :class="medAllergyWarn(m) ? 'bg-danger-100 text-danger-700' : m.controlled ? 'bg-warning-100 text-warning-700' : 'bg-ink-100 text-ink-500'">${icon('pill', 'w-4 h-4')}</span>
                  <span class="min-w-0 flex-1"><span class="block text-sm font-semibold text-ink-900" x-text="m.name"></span><span class="block text-xs text-ink-500" x-text="m.dose+' · '+(m.prnReason||'PRN')"></span><span x-show="prnLast(m.id)" x-cloak class="block text-xs font-medium mt-0.5" :class="statusColor((prnLast(m.id)||{}).status)" x-text="'Given '+prnRecs(m.id).length+'× · '+((prnLast(m.id)||{}).outcome||'')"></span></span>
                  <template x-if="m.controlled"><span class="badge bg-warning-50 text-warning-700 ring-warning-100">CD</span></template>
                  <template x-if="medAllergyWarn(m)"><span class="badge bg-danger-50 text-danger-700 ring-danger-100">Allergy</span></template>
                  <span class="text-ink-300">${icon('chevron-right', 'w-4 h-4')}</span>
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- OBSERVATIONS -->
        <div x-show="tab==='obs'" x-cloak class="p-4 space-y-5" x-data="{ moreObs:false }">

          <!-- 1 · abnormal summary (only when something needs attention) -->
          <template x-if="abnormalObsCount">
            ${banner('danger', html`<span class="font-semibold"><span x-text="abnormalObsCount"></span> abnormal reading<span x-show="abnormalObsCount>1" x-cloak>s</span></span> this visit — office alerted. Review below.`)}
          </template>

          <!-- 2 · record an observation (primary task) -->
          <div>
            <p class="text-[15px] font-semibold text-ink-900 mb-3">Record observation</p>

            <template x-if="recommendedObs.length">
              <div class="mb-4">
                <p class="section-title mb-2">Suggested for this client</p>
                <div class="flex flex-wrap gap-2">
                  <template x-for="ot in recommendedObs" :key="ot.id">
                    <button @click="openObs(ot)" class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-700 px-3 py-2 text-[13px] font-medium active:bg-primary-100"><span x-html="window.__obsIcon(ot.icon)"></span><span x-text="ot.name"></span></button>
                  </template>
                </div>
              </div>
            </template>

            <p class="section-title mb-2">Vital signs</p>
            <div class="grid grid-cols-2 gap-2.5">
              <template x-for="ot in vitalObs" :key="ot.id">
                <button @click="openObs(ot)" class="rounded-2xl bg-white ring-1 ring-ink-100 p-3.5 min-h-[60px] flex items-center gap-3 text-left active:bg-ink-50">
                  <span class="w-9 h-9 rounded-lg bg-ink-50 text-ink-500 grid place-items-center shrink-0" x-html="window.__obsIcon(ot.icon)"></span>
                  <span class="text-[13px] font-medium text-ink-700 leading-tight" x-text="ot.name"></span>
                </button>
              </template>
            </div>

            <template x-if="moreObsGroups.length">
              <div>
                <button @click="moreObs=!moreObs" class="w-full mt-3 py-1.5 text-[13px] font-medium text-ink-500 flex items-center justify-center gap-1 active:text-ink-700">
                  <span x-text="moreObs ? 'Fewer observations' : 'More observations'"></span>
                  <span class="inline-flex transition-transform" :class="moreObs && 'rotate-180'">${icon('chevron-down', 'w-4 h-4')}</span>
                </button>
                <div x-show="moreObs" x-cloak class="space-y-4 mt-1">
                  <template x-for="grp in moreObsGroups" :key="grp.g">
                    <div>
                      <p class="section-title mb-2" x-text="grp.g"></p>
                      <div class="grid grid-cols-3 gap-2">
                        <template x-for="ot in grp.items" :key="ot.id">
                          <button @click="openObs(ot)" class="rounded-2xl bg-white ring-1 ring-ink-100 p-2.5 min-h-[64px] flex flex-col items-center justify-center gap-1.5 text-center active:bg-ink-50">
                            <span class="w-8 h-8 rounded-lg bg-ink-50 text-ink-500 grid place-items-center" x-html="window.__obsIcon(ot.icon)"></span>
                            <span class="text-[11px] font-medium text-ink-600 leading-tight" x-text="ot.name"></span>
                          </button>
                        </template>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>

          <!-- 3 · medical emergency — pinned here so it is ALWAYS at a fixed,
               reachable position, never pushed below a variable-length list -->
          <div class="rounded-xl ring-1 ring-danger-100 bg-danger-50 p-3.5">
            <button @click="sheet='protocolPick'" class="btn btn-danger btn-md w-full">${icon('shield', 'w-4 h-4')}Medical emergency — launch protocol</button>
            <p class="text-[13px] text-danger-600 mt-2 text-center">For collapse, choking or acute deterioration.</p>
          </div>

          <!-- 4 · recorded this visit — abnormal-first, value as the hero -->
          <div x-show="observations.length">
            <p class="section-title mb-2.5">Recorded this visit (<span x-text="observations.length"></span>)</p>
            <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
              <template x-for="o in sortedObs" :key="o.id">
                <div class="p-3.5 flex items-center gap-3" :class="o.flag==='abnormal' && 'bg-danger-50/50'">
                  <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0" :class="o.flag==='abnormal' ? 'bg-danger-100 text-danger-700' : 'bg-ink-100 text-ink-500'" x-html="window.__obsIcon(o.icon)"></span>
                  <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-medium text-ink-600" x-text="o.typeName"></p>
                    <p class="text-[15px] font-bold leading-tight" :class="o.flag==='abnormal' ? 'text-danger-700' : 'text-ink-900'" x-text="obsSummary(o)"></p>
                    <p x-show="o.flag==='abnormal' && normalRange(o)" x-cloak class="text-[12px] text-danger-500 mt-0.5" x-text="normalRange(o)"></p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-[12px] text-ink-400" x-text="o.at"></p>
                    <template x-if="o.flag==='abnormal'"><p class="text-[11px] font-semibold text-danger-600 mt-0.5" x-text="o.protocolId ? 'Protocol run' : 'Office alerted'"></p></template>
                    <template x-if="o.flag!=='abnormal'"><p class="text-[11px] text-success-600 mt-0.5">Normal</p></template>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- LOG — the "what happened this visit" review tab: timeline, incidents,
             charts (fluid/food/repositioning/obs) and the visit note/handover.
             Replaces the former Charts, Incident and Notes tabs. -->
        <div x-show="tab==='log'" x-cloak class="p-4 space-y-5">
          <!-- timeline -->
          <div>
            <p class="section-title mb-2.5">Visit timeline</p>
            <div class="card p-4">
              <div class="relative pl-5">
                <div class="absolute left-1.5 top-1 bottom-1 w-px bg-ink-200"></div>
                <template x-for="ev in timeline" :key="ev.time+ev.title">
                  <div class="relative pb-3 last:pb-0">
                    <span class="absolute -left-[13px] top-0.5 w-3 h-3 rounded-full ring-2 ring-white" :class="{'bg-success-500':ev.tone==='success','bg-danger-500':ev.tone==='danger','bg-teal-500':ev.tone==='teal','bg-primary-500':ev.tone==='primary','bg-ink-300':ev.tone==='ink'}"></span>
                    <div class="flex items-start gap-2"><span class="text-xs font-mono text-ink-400 mt-0.5 w-9 shrink-0" x-text="ev.time"></span><div class="min-w-0"><p class="text-sm font-medium text-ink-800" x-text="ev.title"></p><p class="text-xs text-ink-500 truncate" x-text="ev.detail"></p></div></div>
                  </div>
                </template>
                <p x-show="!timeline.length" class="text-sm text-ink-500">Nothing recorded yet.</p>
              </div>
            </div>
          </div>

          <!-- incidents (moved here from the old Incident tab; report action + list) -->
          <div>
            <p class="section-title mb-2.5">Incidents</p>
            <button @click="openIncident()" class="btn btn-danger btn-md w-full">${icon('flag', 'w-4 h-4')}<span x-text="incidentDraft ? 'Resume incident draft' : 'Report an incident'"></span></button>
            <p class="text-xs text-ink-500 mt-2">Accidents, incidents &amp; safeguarding concerns — auto-escalates to the office.</p>
            <div x-show="incidentDraft" x-cloak class="mt-2 rounded-lg bg-ink-50 ring-1 ring-ink-200 p-2.5 flex items-center gap-2"><span class="text-xs text-ink-500 flex-1">${icon('edit', 'w-3.5 h-3.5 inline')} You have an unsaved incident draft.</span><button @click="discardDraft()" class="text-xs font-semibold text-danger-600">Discard</button></div>
            <div x-show="incidents.length" class="mt-3 rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
              <template x-for="i in incidents" :key="i.id">
                <div class="p-4">
                  <div class="flex items-center gap-2"><span class="font-mono text-xs text-ink-400" x-text="i.ref"></span><span class="badge bg-danger-50 text-danger-700 ring-danger-100" x-text="i.typeName"></span><span class="badge bg-ink-100 text-ink-600 ring-ink-200" x-text="i.severity"></span></div>
                  <p class="text-sm text-ink-700 mt-1.5" x-text="i.description"></p>
                  <div class="flex flex-wrap gap-1.5 mt-2"><template x-if="i.riddor"><span class="badge bg-warning-50 text-warning-700 ring-warning-100">RIDDOR</span></template><template x-if="i.safeguarding"><span class="badge bg-danger-50 text-danger-700 ring-danger-100">Safeguarding</span></template><span class="badge bg-success-50 text-success-700 ring-success-100" x-text="i.status"></span></div>
                </div>
              </template>
            </div>
          </div>

          <!-- charts -->
          <div>
            <p class="section-title mb-2.5">Charts</p>
            <div class="space-y-3">
              <div class="card p-4">
                <div class="flex items-center justify-between mb-2"><p class="text-sm font-semibold text-ink-900 flex items-center gap-1.5">${icon('droplet', 'w-4 h-4 text-info-500')}Fluid balance</p><span class="text-xs text-ink-500" x-text="fluidTotal+' / '+fluidTarget+' ml'"></span></div>
                <div class="h-2.5 rounded-full bg-ink-100 overflow-hidden"><div class="h-2.5 rounded-full transition-all" :class="fluidPct>=100 ? 'bg-success-500' : fluidPct>=60 ? 'bg-info-500' : 'bg-warning-500'" :style="'width:'+fluidPct+'%'"></div></div>
                <div class="mt-3 space-y-1.5">
                  <template x-for="r in fluidRecords" :key="r.time+r.label"><div class="flex items-center justify-between text-sm"><span class="text-ink-600" x-text="r.time+' · '+r.label"></span><span class="font-semibold text-ink-800" x-text="r.ml+' ml'"></span></div></template>
                  <p x-show="!fluidRecords.length" class="text-sm text-ink-500">No fluids recorded yet.</p>
                </div>
              </div>
              <div class="card p-4">
                <p class="text-sm font-semibold text-ink-900 flex items-center gap-1.5 mb-2">${icon('utensils', 'w-4 h-4 text-warning-500')}Food intake</p>
                <div class="space-y-1.5"><template x-for="r in foodRecords" :key="r.time+r.label"><div class="flex items-center justify-between text-sm"><span class="text-ink-600" x-text="r.time+' · '+r.label"></span><span class="badge" :class="['Little','None'].includes(r.eaten)?'bg-danger-50 text-danger-700 ring-danger-100':'bg-success-50 text-success-700 ring-success-100'" x-text="r.eaten"></span></div></template><p x-show="!foodRecords.length" class="text-sm text-ink-500">No meals recorded yet.</p></div>
              </div>
              <div class="card p-4">
                <p class="text-sm font-semibold text-ink-900 flex items-center gap-1.5 mb-2">${icon('footprints', 'w-4 h-4 text-primary-500')}Repositioning</p>
                <div class="space-y-1.5"><template x-for="r in repositions" :key="r.time"><div class="flex items-center justify-between text-sm"><span class="text-ink-600" x-text="r.time"></span><span class="font-medium text-ink-800" x-text="r.position"></span></div></template><p x-show="!repositions.length" class="text-sm text-ink-500">No repositioning logged yet.</p></div>
              </div>
              <div class="card p-4">
                <p class="text-sm font-semibold text-ink-900 flex items-center gap-1.5 mb-2">${icon('activity', 'w-4 h-4 text-teal-500')}Recent observations</p>
                <div class="space-y-2"><template x-for="o in obsTrend" :key="o.id"><div class="flex items-center gap-2"><span class="w-7 h-7 rounded-lg grid place-items-center shrink-0" :class="o.flag==='abnormal'?'bg-danger-50 text-danger-600':'bg-success-50 text-success-600'" x-html="window.__obsIcon(o.icon)"></span><div class="flex-1 min-w-0"><p class="text-sm font-medium text-ink-800 truncate" x-text="o.typeName"></p><p class="text-xs text-ink-500 truncate" x-text="obsSummary(o)"></p></div><span class="badge" :class="o.flag==='abnormal'?'bg-danger-50 text-danger-700 ring-danger-100':'bg-success-50 text-success-700 ring-success-100'" x-text="o.flag==='abnormal'?'Abnormal':'Normal'"></span></div></template><p x-show="!obsTrend.length" class="text-sm text-ink-500">No observations yet.</p></div>
              </div>
            </div>
          </div>

          <!-- visit note / handover (write) -->
          <div>
            <p class="section-title mb-2.5">Visit note / handover</p>
            <div class="card p-4">
              <textarea x-model="note" rows="4" class="field px-3 py-2 text-sm" placeholder="Summary for the next carer & office…"></textarea>
              <div class="flex items-center gap-2 mt-2">
                <button @click="saveNote()" class="btn btn-secondary btn-sm">${icon('check', 'w-3.5 h-3.5')}Save note</button>
                <button @click="voiceRecording ? stopVoice() : startVoice()" :class="voiceRecording ? 'btn-danger' : 'btn-secondary'" class="btn btn-sm">${icon('mobile', 'w-3.5 h-3.5')}<span x-text="voiceRecording ? 'Stop recording' : 'Voice note'"></span></button>
              </div>
              <template x-if="voiceUrl"><div class="mt-2 flex items-center gap-2 text-xs text-success-700"><span>${icon('check-circle', 'w-4 h-4')}</span><audio x-show="voiceUrl.startsWith('blob')" :src="voiceUrl" controls class="h-8"></audio><span x-show="!voiceUrl.startsWith('blob')">Voice note attached</span></div></template>
            </div>
          </div>
        </div>

        <!-- ================= SHEETS (overlays) ================= -->

        <!-- task sheet -->
        <div x-show="sheet==='task'" x-cloak class="absolute inset-0 z-20 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <template x-if="activeTask">
            <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
              ${recordSheetHeader('activeTask.title', 'activeTask.typeLabel')}
              <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body">
                <div class="rounded-xl bg-primary-50 ring-1 ring-primary-100 p-3.5"><p class="section-title text-primary-700 mb-1.5">What to do</p><p class="text-sm leading-relaxed text-primary-900" x-text="activeTask.instructions"></p></div>
                <div x-show="activeTask.why" class="rounded-xl bg-teal-50 ring-1 ring-teal-100 p-3.5"><p class="section-title text-teal-700 mb-1.5">Why</p><p class="text-sm leading-relaxed text-teal-900" x-text="activeTask.why"></p></div>
                ${errorBox}
                <div x-show="!activeTask.isMed">
                  <p class="text-[15px] font-semibold text-ink-900 mb-2.5">How did it go?</p>
                  <div class="rounded-2xl ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden"><template x-for="o in ['Completed','Partial','Refused','Unable']" :key="o"><button type="button" @click="outcome=o" :class="outcome===o ? 'bg-primary-50' : 'bg-surface'" class="w-full flex items-center gap-3 px-3.5 py-3 text-left active:bg-ink-50"><span class="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/5" :class="o==='Completed' ? 'bg-success-500' : o==='Partial' ? 'bg-warning-500' : 'bg-danger-500'"></span><span class="flex-1 text-sm font-medium text-ink-800" x-text="o"></span><span x-show="outcome===o" x-cloak class="text-primary-600 shrink-0">${icon('check', 'w-4 h-4')}</span></button></template></div>
                </div>
                <p class="section-title pt-1">Record</p>
                ${fieldControls('activeTask.fields')}
              </div>
              <div class="p-4 border-t border-ink-200 bg-surface shrink-0"><button @click="saveTask()" class="btn btn-primary btn-lg w-full">${icon('check', 'w-5 h-5')}Save record</button></div>
            </div>
          </template>
        </div>

        <!-- medication sheet -->
        <div x-show="sheet==='med'" x-cloak class="absolute inset-0 z-20 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <template x-if="activeMed">
            <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
              ${recordSheetHeader('activeMed.name', 'activeMed.dose + " · " + activeMed.route')}
              <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body">
                <div class="space-y-2">
                  <template x-if="allergyState.warn"><div class="rounded-xl bg-warning-500 text-white p-3"><p class="text-[13px] font-semibold flex items-center gap-2">${icon('alert', 'w-4 h-4')}<span x-text="allergyState.label"></span></p><p class="text-[13px] mt-0.5">Allergy status is not confirmed. Acknowledge before administering; office confirmation may be required.</p></div></template>
                  <template x-if="medAllergyWarn(activeMed)"><div class="rounded-xl bg-danger-500 text-white p-3"><p class="text-[13px] font-semibold flex items-center gap-2">${icon('alert', 'w-4 h-4')}ALLERGY WARNING</p><p class="text-[13px] mt-0.5">Allergic to <span x-text="activeMed.relatedAllergy"></span>. Do not administer without prescriber confirmation.</p></div></template>
                  <template x-if="medBlock"><div class="rounded-xl p-3" :class="medBlock.hard ? 'bg-danger-50 ring-1 ring-danger-200' : 'bg-warning-50 ring-1 ring-warning-100'"><p class="text-[13px] font-semibold flex items-center gap-2" :class="medBlock.hard ? 'text-danger-700' : 'text-warning-700'">${icon('alert', 'w-4 h-4')}<span x-text="medBlock.reason"></span></p><p class="text-[13px] mt-0.5" :class="medBlock.hard ? 'text-danger-800' : 'text-warning-800'" x-text="medBlock.detail"></p></div></template>
                  <template x-if="medRecon">${banner('warning', html`<p class="font-semibold">Medication changed since last visit</p><p class="mt-0.5" x-text="medRecon.reason"></p><template x-if="medRecon.conflict"><p class="text-danger-700 mt-1 font-medium">Order stopped — a dose given before the stop synced will be flagged. Stop wins.</p></template><p class="mt-1">Withheld until reconciled — resolve in the client's <b>Medication orders</b> screen, or override with a reason.</p>`, 'refresh')}</template>
                </div>
                <div class="card p-4">
                  <div class="flex items-baseline justify-between gap-3">
                    <span class="text-xl font-bold text-ink-900" x-text="activeMed.dose"></span>
                    <span class="text-[13px] text-ink-500 text-right shrink-0" x-text="activeMed.route + ' · ' + activeMed.form"></span>
                  </div>
                  <p class="text-[13px] text-ink-500 mt-1">Due <span class="font-medium text-ink-700" x-text="activeMed.due"></span></p>
                  <template x-if="activeMed.instr"><p class="text-[13px] text-ink-600 mt-2 leading-relaxed" x-text="activeMed.instr"></p></template>
                  <div class="flex flex-wrap gap-1.5 mt-2.5" x-show="activeMed.controlled || activeMed.covert || activeMed.timeCritical" x-cloak><template x-if="activeMed.controlled"><span class="badge bg-warning-50 text-warning-700 ring-warning-100">Controlled drug</span></template><template x-if="activeMed.covert"><span class="badge bg-ink-100 text-ink-600 ring-ink-200">Covert (MCA)</span></template><template x-if="activeMed.timeCritical"><span class="badge bg-danger-50 text-danger-700 ring-danger-100">Time-critical</span></template></div>
                </div>
                ${errorBox}
                <div x-data="{ open:false, TOP:['G','R','N','U'] }">
                  <p class="text-[15px] font-semibold text-ink-900 mb-2.5" x-text="'Did '+((su.name||'they').split(' ')[0])+' take it?'"></p>
                  <div class="rounded-2xl ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
                    <template x-for="m in MAR_STATUS_CODES.filter(c=>TOP.includes(c.code))" :key="m.code">${marOutcomeRow}</template>
                  </div>
                  <button type="button" @click="open=!open" class="w-full mt-2 py-1 text-[13px] font-medium text-ink-500 flex items-center justify-center gap-1"><span x-text="open ? 'Fewer outcomes' : 'More outcomes'"></span><span :class="open && 'rotate-180'" class="transition-transform inline-flex">${icon('chevron-down', 'w-4 h-4')}</span></button>
                  <div x-show="open || (marCode && !TOP.includes(marCode))" x-cloak class="rounded-2xl ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
                    <template x-for="m in MAR_STATUS_CODES.filter(c=>!['G','R','N','U','Pending'].includes(c.code))" :key="m.code">${marOutcomeRow}</template>
                  </div>
                </div>
                <div>
                  <p class="text-[15px] font-semibold text-ink-900 mb-2.5">How did you support?</p>
                  <div class="flex flex-wrap gap-2">
                    <template x-for="s in SUPPORT_ACTIONS" :key="s.id">
                      <button type="button" @click="supportAction=s.id" :class="supportAction===s.id ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600'" class="rounded-full px-4 py-2.5 text-[13px] font-medium" x-text="s.label"></button>
                    </template>
                  </div>
                </div>
                <template x-if="activeMed.group==='PRN' && doseOut==='taken'"><div><label class="label">PRN reason *</label><input x-model="prnReason" class="field field-md" placeholder="e.g. pain" /></div></template>
                <template x-if="activeMed.controlled && doseOut==='taken'"><div class="rounded-lg ring-1 ring-warning-200 bg-warning-50 p-3 space-y-2">
                  <p class="text-xs font-semibold text-warning-800 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Controlled drug — second-carer witness required</p>
                  <div><label class="label">Eligible witness</label>
                    <select x-model="witnessedBy" class="field field-sm"><option value="">Select a witness…</option><template x-for="w in ELIGIBLE_WITNESSES" :key="w.name"><option :value="w.name" x-text="w.name + ' · ' + w.role + (w.eligible ? '' : ' — ' + w.why)"></option></template></select></div>
                  <template x-if="witnessedBy && !witnessEligible()"><p class="text-xs text-danger-700">${icon('alert', 'w-3.5 h-3.5')}Not eligible (must be on duty, present, CD-competent, separate account). Choose another or a fallback.</p></template>
                  <template x-if="witnessedBy && witnessEligible()"><p class="text-xs text-success-700">${icon('check-circle', 'w-3.5 h-3.5')}Eligible witness — independent confirmation.</p></template>
                  <div><label class="label">…or record a fallback (never leave the round open)</label>
                    <select x-model="witnessFallback" class="field field-sm"><option value="">No fallback</option><template x-for="f in WITNESS_FALLBACKS" :key="f.id"><option :value="f.id" x-text="f.label"></option></template></select>
                    <template x-if="witnessFallback"><p class="text-xs text-warning-700 mt-1" x-text="(WITNESS_FALLBACKS.find(f=>f.id===witnessFallback)||{}).note"></p></template>
                  </div>
                </div></template>
                <div class="space-y-3">
                  <div><label class="label">Time given</label><input type="time" x-model="form.time" class="field field-md" /></div>
                  <template x-if="activeMed.group==='PRN' && doseOut==='taken'"><div><label class="label">Effectiveness (follow-up in 60 min)</label><select x-model="form.effect" class="field field-md"><option value="">Review in 60 min</option><option>Effective</option><option>Partially effective</option><option>Not effective</option></select></div></template>
                  <div><label class="label"><span x-text="['refused','omitted','unavailable','withheld','partly-taken'].includes(doseOut) ? 'Reason *' : 'Note'"></span></label><textarea x-model="form.note" rows="2" class="field px-3 py-2" placeholder="Reason if not taken / comment…"></textarea></div>
                </div>
                <template x-if="(medBlock && medBlock.hard) || allergyState.warn || medRecon"><div class="rounded-lg ring-1 ring-danger-200 p-3"><label class="flex items-center gap-2 text-sm font-medium text-danger-700"><input type="checkbox" x-model="medOverride" class="w-4 h-4 rounded text-danger-600" />Override — I have checked the authorised source</label><template x-if="medOverride"><input x-model="overrideReason" class="field field-md mt-2" placeholder="Override reason (audited, office alerted)" /></template></div></template>
              </div>
              <div class="p-4 border-t border-ink-200 bg-surface shrink-0"><button @click="saveMed()" class="btn btn-primary btn-lg w-full">${icon('check', 'w-5 h-5')}Record on eMAR</button></div>
            </div>
          </template>
        </div>

        <!-- wrong-person: two-identifier confirmation (§14.2) -->
        <div x-show="sheet==='confirmPerson'" x-cloak class="absolute inset-0 z-30 bg-black/40 flex items-end" @click.self="sheet=null; pendingAction=null">
          <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
            ${recordSheetHeader("'Confirm the person'", "'Two-identifier check'")}
            <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body">
              ${banner('warning', 'Confirm you are recording for the right person before medication or high-risk care.')}
              <div class="card p-4 flex items-center gap-3">
                <span class="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 grid place-items-center text-lg font-bold" x-text="su.initials"></span>
                <div><p class="text-base font-semibold text-ink-900" x-text="su.name"></p><p class="text-sm text-ink-500">DOB <span x-text="su.dob"></span> · NHS <span x-text="su.nhs"></span></p></div>
              </div>
              <p class="text-sm text-ink-500">Check the <b>name</b> and <b>date of birth</b> match the person in front of you.</p>
            </div>
            <div class="p-4 border-t border-ink-200 bg-surface shrink-0 flex gap-2">
              <button @click="sheet=null; pendingAction=null" class="btn btn-secondary btn-lg flex-1">Not this person</button>
              <button @click="confirmPerson()" class="btn btn-primary btn-lg flex-1">${icon('check', 'w-5 h-5')}Confirm identity</button>
            </div>
          </div>
        </div>

        <!-- emergency protocol picker (§51) -->
        <div x-show="sheet==='protocolPick'" x-cloak class="absolute inset-0 z-30 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
            ${recordSheetHeader("'Emergency protocols'", 'su.name')}
            <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-2 sheet-body">
              <div class="rounded-xl bg-danger-50 ring-1 ring-danger-100 p-3 text-sm text-danger-800 flex items-center gap-2">${icon('shield', 'w-4 h-4')}Launch a closed-loop protocol. Each step is recorded to closure.</div>
              <template x-for="p in PROTOCOL_LIST" :key="p.id">
                <button @click="launchProtocol(p.id)" class="w-full text-left card p-4 flex items-center gap-3 active:scale-[.99]"><span class="w-9 h-9 rounded-lg bg-danger-50 text-danger-600 grid place-items-center">${icon('alert', 'w-4.5 h-4.5')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900" x-text="p.name"></p><p class="text-xs font-medium text-ink-600 truncate" x-text="p.trigger"></p><p class="text-[11px] text-ink-400" x-text="p.version"></p></div>${icon('chevron-right', 'w-4 h-4 text-ink-300')}</button>
              </template>
            </div>
          </div>
        </div>

        <!-- emergency protocol runner (§51) -->
        <div x-show="sheet==='protocol'" x-cloak class="absolute inset-0 bg-canvas flex flex-col z-30">
          <template x-if="activeProtocol">
            <div class="flex flex-col h-full">
              <div class="bg-danger-600 text-white px-4 pt-9 pb-3 shrink-0">
                <span class="text-xs text-danger-100 inline-flex items-center gap-1">${icon('shield', 'w-3.5 h-3.5')}Emergency protocol · <span x-text="activeProtocol.version"></span> · cannot be skipped</span>
                <h2 class="text-lg font-bold mt-1" x-text="activeProtocol.name"></h2>
                <div class="mt-2 flex gap-1"><template x-for="(s,i) in activeProtocol.steps" :key="i"><span class="h-1.5 flex-1 rounded-full" :class="i<=protoStep ? 'bg-white' : 'bg-white/30'"></span></template></div>
              </div>
              <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 sheet-body">
                <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Step <span x-text="protoStep+1"></span> of <span x-text="activeProtocol.steps.length"></span></p>
                <p class="text-base font-semibold text-ink-900" x-text="protoCurrent.title"></p>
                <template x-if="protoCurrent.type==='action'">
                  <div class="space-y-2"><template x-for="(it,i) in protoCurrent.items" :key="i"><button @click="protoMark('a'+i)" :class="protoLog['a'+i] ? 'ring-2 ring-primary-500 bg-primary-50' : 'ring-1 ring-ink-200'" class="w-full flex items-center gap-2.5 p-3 rounded-lg text-left"><span class="w-5 h-5 rounded grid place-items-center shrink-0" :class="protoLog['a'+i] ? 'text-primary-600' : 'ring-1 ring-ink-300'"><span x-show="protoLog['a'+i]">${icon('check', 'w-3.5 h-3.5')}</span></span><span class="text-sm text-ink-800" x-text="it"></span></button></template></div>
                </template>
                <template x-if="protoCurrent.type==='contact'">
                  <div class="space-y-2"><template x-for="o in protoCurrent.options" :key="o.label"><button @click="protoContactPick(o)" :class="protoContact===o.label ? 'ring-2 ring-primary-500 bg-primary-50' : 'ring-1 ring-ink-200'" class="w-full flex items-center gap-3 p-3 rounded-lg"><span class="w-9 h-9 rounded-lg grid place-items-center" :class="o.tone==='danger'?'bg-danger-100 text-danger-700':o.tone==='warning'?'bg-warning-100 text-warning-700':'bg-primary-100 text-primary-700'">${icon('bell', 'w-4.5 h-4.5')}</span><div class="flex-1 text-left"><p class="text-sm font-semibold text-ink-900" x-text="o.label"></p><p class="text-xs text-ink-400" x-text="o.num"></p></div><span x-show="protoContact===o.label" class="text-primary-600">${icon('check-circle', 'w-5 h-5')}</span></button></template></div>
                </template>
                <template x-if="protoCurrent.type==='advice'"><textarea x-model="protoAdvice" rows="3" class="field px-3 py-2" :placeholder="protoCurrent.placeholder"></textarea></template>
                <template x-if="protoCurrent.type==='repeatObs'"><div class="rounded-xl bg-primary-50 ring-1 ring-primary-100 p-3.5"><p class="text-sm text-primary-800" x-text="protoCurrent.detail"></p><label class="flex items-center gap-2 mt-2 text-sm text-primary-800"><input type="checkbox" x-model="protoLog.repeat" class="w-4 h-4 rounded text-primary-600" />Marked to repeat & monitor</label></div></template>
                <template x-if="protoCurrent.type==='acknowledge'"><label class="flex items-start gap-2.5 p-3 rounded-lg ring-1 ring-ink-200"><input type="checkbox" x-model="protoLog.ack" class="w-5 h-5 rounded text-primary-600 mt-0.5" /><span class="text-sm text-ink-700" x-text="protoCurrent.detail"></span></label></template>
                <template x-if="protoCurrent.type==='closure'"><div class="rounded-2xl ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden"><template x-for="o in protoCurrent.options" :key="o"><button @click="protoOutcome=o" :class="protoOutcome===o ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-surface'" class="w-full flex items-center gap-3 px-3.5 py-3 text-left"><span class="flex-1 text-sm font-medium text-ink-800" x-text="o"></span><span x-show="protoOutcome===o" class="text-primary-600 shrink-0">${icon('check', 'w-4 h-4')}</span></button></template></div></template>
              </div>
              <div class="p-4 border-t border-ink-200 bg-surface shrink-0">
                <template x-if="protoCurrent.type!=='closure'"><button @click="protoNext()" :disabled="!protoCanAdvance" :class="protoCanAdvance ? 'btn-danger' : 'btn-secondary opacity-60'" class="btn btn-lg w-full">Next step ${icon('arrow-right', 'w-4 h-4')}</button></template>
                <template x-if="protoCurrent.type==='closure'"><button @click="closeProtocol()" :disabled="!protoOutcome" :class="protoOutcome ? 'btn-primary' : 'btn-secondary opacity-60'" class="btn btn-lg w-full">${icon('check-circle', 'w-5 h-5')}Close protocol</button></template>
              </div>
            </div>
          </template>
        </div>

        <!-- observation form sheet -->
        <div x-show="sheet==='obsForm'" x-cloak class="absolute inset-0 z-20 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <template x-if="activeObs">
            <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
              ${recordSheetHeader('activeObs.name', 'activeObs.group')}
              <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body"><div class="card p-4"><p class="text-[15px] font-semibold text-ink-900" x-text="activeObs.name"></p><p class="text-[13px] text-ink-500 mt-0.5" x-text="activeObs.group"></p></div>${errorBox}${fieldControls('activeObs.fields')}</div>
              <div class="p-4 border-t border-ink-200 bg-surface shrink-0"><button @click="saveObs()" class="btn btn-primary btn-lg w-full">${icon('check', 'w-5 h-5')}Save observation</button></div>
            </div>
          </template>
        </div>

        <!-- incident sheet -->
        <div x-show="sheet==='incident'" x-cloak class="absolute inset-0 z-20 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
            ${recordSheetHeader("'Report an incident'", 'su.name')}
            <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body">
              <span x-effect="persistDraft()" class="hidden"></span>
              <div class="rounded-lg bg-ink-50 ring-1 ring-ink-200 p-2 flex items-center gap-2 text-xs text-ink-500">${icon('check', 'w-3.5 h-3.5 text-success-600')}Draft auto-saves as you type — safe to close and resume.</div>
              ${errorBox}
              <div><p class="text-[15px] font-semibold text-ink-900 mb-2.5">Incident type</p><div class="grid grid-cols-3 gap-2">
                <template x-for="it in incidentTypes" :key="it.id"><button type="button" @click="pickIncidentType(it)" :class="inc.typeId===it.id ? 'ring-danger-400 bg-danger-50' : 'ring-ink-200'" class="card p-2.5 flex flex-col items-center gap-1.5 text-center ring-1"><span class="w-7 h-7 rounded-lg bg-ink-50 text-ink-500 grid place-items-center" x-html="window.__obsIcon(it.icon)"></span><span class="text-xs font-medium text-ink-700 leading-tight" x-text="it.name"></span></button></template>
              </div></div>
              <div><p class="text-[15px] font-semibold text-ink-900 mb-2.5">Severity</p><div class="grid grid-cols-5 gap-1"><template x-for="sv in severities" :key="sv"><button type="button" @click="inc.severity=sv" :class="inc.severity===sv ? (['Severe','Death'].includes(sv) ? 'bg-danger-500 text-white ring-danger-500' : 'bg-primary-600 text-white ring-primary-600') : 'bg-white text-ink-600 ring-ink-200'" class="h-9 rounded-lg ring-1 text-xs font-semibold" x-text="sv"></button></template></div></div>
              <div class="grid grid-cols-2 gap-3"><div><label class="label">Time</label><input type="time" x-model="inc.datetime" class="field field-md" /></div><div><label class="label">Location</label><input x-model="inc.location" class="field field-md" /></div></div>
              <p class="section-title">What happened</p>
              <div><label class="label">What happened? *</label><textarea x-model="inc.description" rows="3" class="field px-3 py-2" placeholder="Factual account…"></textarea></div>
              <template x-if="inc.typeId==='safeguarding'">
                <div class="rounded-xl bg-danger-50 ring-1 ring-danger-100 p-3 space-y-2.5">
                  <p class="text-xs font-semibold text-danger-700 uppercase tracking-wide flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Safeguarding disclosure</p>
                  <div><label class="label">Person’s exact words (verbatim) *</label><textarea x-model="inc.verbatim" rows="2" class="field px-3 py-2" placeholder="Quote exactly what was said…"></textarea></div>
                  <div><label class="label">Facts — what you observed *</label><textarea x-model="inc.fact" rows="2" class="field px-3 py-2" placeholder="Only what you saw/heard…"></textarea></div>
                  <div><label class="label">Your interpretation (kept separate)</label><textarea x-model="inc.interpretation" rows="2" class="field px-3 py-2" placeholder="Your view — recorded separately from fact…"></textarea></div>
                </div>
              </template>
              <div><label class="label">Injuries — mark body map</label>${bodyMapControl('inc.injuries', (r) => `toggleInjury('${r}')`)}</div>
              <div><label class="label">Witnesses</label><input x-model="inc.witnesses" class="field field-md" placeholder="Names / none" /></div>
              <div><label class="label">Immediate action taken *</label><textarea x-model="inc.actions" rows="2" class="field px-3 py-2" placeholder="What you did…"></textarea></div>
              <p class="section-title">Escalation</p>
              <div><p class="label">Who was informed? *</p><div class="grid grid-cols-2 gap-1.5"><template x-for="o in informedOpts" :key="o"><button type="button" @click="toggleInformed(o)" :class="inc.informed.includes(o) ? 'ring-primary-400 bg-primary-50 text-primary-700' : 'ring-ink-200 text-ink-600'" class="p-2 rounded-lg ring-1 text-xs font-medium text-left" x-text="o"></button></template></div></div>
              <div class="rounded-lg ring-1 ring-danger-200 bg-danger-50 p-3 space-y-2">
                <label class="flex items-center gap-2 text-sm font-medium text-danger-700"><input type="checkbox" x-model="inc.riddor" class="w-4 h-4 rounded text-danger-600" />RIDDOR reportable</label>
                <label class="flex items-center gap-2 text-sm font-medium text-danger-700"><input type="checkbox" x-model="inc.safeguarding" class="w-4 h-4 rounded text-danger-600" />Safeguarding</label>
              </div>
              <label :class="inc.photo ? 'ring-success-300 bg-success-50 text-success-700' : 'ring-ink-300 text-ink-400'" class="w-full min-h-12 py-2 rounded-lg ring-1 ring-dashed grid place-items-center text-sm cursor-pointer"><input type="file" accept="image/*" capture="environment" class="hidden" @change="onIncPhoto($event)" /><span class="inline-flex items-center gap-2"><img :src="photoPreviews.incPhoto" x-show="photoPreviews.incPhoto" class="w-9 h-9 rounded object-cover" /><span x-text="inc.photo ? inc.photo : 'Take / attach photo'"></span></span></label>
            </div>
            <div class="p-4 border-t border-ink-200 bg-surface shrink-0"><button @click="submitIncident()" class="btn btn-danger btn-lg w-full">${icon('flag', 'w-5 h-5')}Submit & escalate</button></div>
          </div>
        </div>

        <!-- summary sheet -->
        <div x-show="sheet==='summary'" x-cloak class="absolute inset-0 z-20 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
            ${recordSheetHeader("'Visit summary'", 'su.name')}
            <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body">
              <p class="text-[15px] font-semibold text-ink-900 mb-2.5">This visit</p>
              <div class="grid grid-cols-2 gap-3">
                <div class="card p-3 text-center"><p class="text-2xl font-bold text-ink-900" x-text="tasks.filter(t=>t.record).length + '/' + tasks.length"></p><p class="text-xs text-ink-400">Tasks recorded</p></div>
                <div class="card p-3 text-center"><p class="text-2xl font-bold text-ink-900" x-text="medRows.length"></p><p class="text-xs text-ink-400">Medications</p></div>
                <div class="card p-3 text-center"><p class="text-2xl font-bold text-ink-900" x-text="observations.length"></p><p class="text-xs text-ink-400">Observations</p></div>
                <div class="card p-3 text-center"><p class="text-2xl font-bold" :class="incidents.length ? 'text-danger-600' : 'text-ink-900'" x-text="incidents.length"></p><p class="text-xs text-ink-400">Incidents</p></div>
              </div>
              <div x-show="blocking.length">${banner('warning', html`<span class="font-semibold">Outstanding:</span> <span x-text="blocking.join(', ')"></span>`)}</div>
              <div x-show="observations.some(o=>o.flag==='abnormal')">${banner('danger', html`<span class="font-semibold">Abnormal observations were recorded and escalated.</span>`)}</div>
              <div class="card p-3.5">
                <p class="section-title mb-2">Signatures</p>
                <div class="grid grid-cols-2 gap-2.5">
                  <button @click="signVisit('carer')" class="h-14 rounded-lg ring-1 ring-dashed grid place-items-center text-xs px-1 text-center" :class="sigCarer?'ring-success-300 bg-success-50 text-success-700':'ring-ink-300 text-ink-400'"><span x-show="!sigCarer" class="inline-flex items-center gap-1.5">${icon('signature', 'w-4 h-4')}Carer sign</span><span x-show="sigCarer" x-text="sigCarer" class="font-medium"></span></button>
                  <button @click="signVisit('client')" class="h-14 rounded-lg ring-1 ring-dashed grid place-items-center text-xs px-1 text-center" :class="sigClient?'ring-success-300 bg-success-50 text-success-700':'ring-ink-300 text-ink-400'"><span x-show="!sigClient" class="inline-flex items-center gap-1.5">${icon('signature', 'w-4 h-4')}Client sign</span><span x-show="sigClient" x-text="sigClient" class="font-medium"></span></button>
                </div>
              </div>
            </div>
            <div class="p-4 border-t border-ink-200 bg-surface shrink-0"><button @click="startClockOut()" :disabled="!canClockOut" class="btn btn-lg w-full" :class="canClockOut ? 'btn-primary' : 'btn-secondary opacity-60'">${icon('check-circle', 'w-5 h-5')}<span x-text="canClockOut ? 'Confirm clock out' : 'Record required items first'"></span></button></div>
          </div>
        </div>

        <!-- check-in sheet (§14 ECM + welfare) -->
        <div x-show="sheet==='checkin'" x-cloak class="absolute inset-0 z-30 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
            ${recordSheetHeader("'Check in'", 'su.name')}
            <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body">
              <div class="rounded-xl p-3.5" :class="checkinGeofence==='inside' ? 'bg-success-50 ring-1 ring-success-100' : 'bg-warning-50 ring-1 ring-warning-100'">
                <p class="text-sm font-semibold flex items-center gap-2" :class="checkinGeofence==='inside' ? 'text-success-700' : 'text-warning-700'">${icon('map-pin', 'w-4 h-4')}<span x-text="checkinGeofence==='inside' ? 'Inside geofence (100m)' : 'Outside geofence — reason required'"></span></p>
                <p class="text-xs mt-0.5" :class="checkinGeofence==='inside' ? 'text-success-700' : 'text-warning-800'" x-text="su.address"></p>
              </div>
              ${errorBox}
              <div><p class="text-[15px] font-semibold text-ink-900 mb-2.5">Check-in method</p><div class="flex flex-wrap gap-2"><template x-for="m in CHECKIN_METHODS" :key="m.id"><button type="button" @click="checkinMethod=m.id" :class="checkinMethod===m.id ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600'" class="rounded-full px-4 py-2.5 text-[13px] font-medium" x-text="m.label"></button></template></div></div>
              <template x-if="checkinMethod==='manual' || checkinGeofence==='outside'"><div><label class="label">Reason *</label><input x-model="checkinReason" class="field field-md" placeholder="Why manual / out of geofence?" /></div></template>
              <div><p class="text-[15px] font-semibold text-ink-900 mb-2.5">On-entry welfare</p><div class="rounded-2xl ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden"><template x-for="w in WELFARE_OUTCOMES" :key="w.id"><button type="button" @click="welfare=w.id" :class="welfare===w.id ? 'bg-primary-50' : ''" class="w-full flex items-center gap-3 px-3.5 py-3 text-left"><span class="w-3 h-3 rounded-full shrink-0" :class="w.tone==='ok'?'bg-success-500':w.tone==='warn'?'bg-warning-500':'bg-danger-500'"></span><span class="flex-1 text-sm font-medium text-ink-800" x-text="w.label"></span><span x-show="welfare===w.id" class="text-primary-600">${icon('check', 'w-4 h-4')}</span></button></template></div></div>
            </div>
            <div class="p-4 border-t border-ink-200 bg-surface shrink-0"><button @click="performCheckin()" class="btn btn-primary btn-lg w-full">${icon('clock', 'w-5 h-5')}Check in & start visit</button></div>
          </div>
        </div>

        <!-- leaving-safe checklist + outcome (§14/§55.7) -->
        <div x-show="sheet==='leavingSafe'" x-cloak class="absolute inset-0 z-30 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
            ${recordSheetHeader("'Leaving safe'", 'su.name')}
            <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body">
              <div class="rounded-xl bg-primary-50 ring-1 ring-primary-100 p-3 text-sm text-primary-800 flex items-center gap-2">${icon('shield', 'w-4 h-4')}Confirm the home is safe to leave. Each item: done or a defined exception.</div>
              ${errorBox}
              <p class="text-[15px] font-semibold text-ink-900 mb-2.5">Home safe to leave</p>
              <div class="space-y-3">
                <template x-for="item in LEAVING_SAFE_ITEMS" :key="item">
                  <div class="card p-3" :class="leavingSafe[item] ? 'ring-primary-100 bg-primary-50' : ''"><p class="text-sm font-medium text-ink-800 mb-1.5" x-text="item"></p><select @change="setLeavingSafe(item, $event.target.value)" class="field field-md text-sm"><option value="">Choose…</option><template x-for="ex in LEAVING_SAFE_EXCEPTIONS" :key="ex"><option :value="ex" x-text="ex"></option></template></select></div>
                </template>
              </div>
              <!-- derived visit outcome -->
              <div class="card p-3.5">
                <p class="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Visit outcome (derived)</p>
                <div class="space-y-1 text-[13px]">
                  <div class="flex justify-between"><span class="text-ink-400">Attendance</span><span class="font-medium text-ink-800" x-text="visitDimensions.attendance"></span></div>
                  <div class="flex justify-between"><span class="text-ink-400">Planned care</span><span class="font-medium text-ink-800" x-text="visitDimensions.plannedCare"></span></div>
                  <div class="flex justify-between"><span class="text-ink-400">Care summary</span><span class="font-medium text-ink-800" x-text="visitDimensions.careSummary"></span></div>
                  <div class="flex justify-between"><span class="text-ink-400">Verification</span><span class="font-medium" :class="visitDimensions.verification==='Verified' ? 'text-success-700' : 'text-warning-700'" x-text="visitDimensions.verification"></span></div>
                  <div class="flex justify-between pt-1 border-t border-ink-100 mt-1"><span class="text-ink-500 font-semibold">Display label</span><span class="font-bold" :class="visitDimensions.display==='Completed' ? 'text-success-700' : 'text-warning-700'" x-text="visitDimensions.display"></span></div>
                </div>
              </div>
              <template x-if="needsReasonCode">
                <div><p class="label">Reason code *</p><select x-model="reasonCode" class="field field-md">
                  <option value="">Choose a reason…</option>
                  ${Object.entries(VISIT_REASON_CODES).map(([g, codes]) => `<optgroup label="${g}">${codes.map((c) => `<option value="${c}">${c}</option>`).join('')}</optgroup>`).join('')}
                </select></div>
              </template>
            </div>
            <div class="p-4 border-t border-ink-200 bg-surface shrink-0"><button @click="confirmClockOut()" class="btn btn-primary btn-lg w-full">${icon('check-circle', 'w-5 h-5')}Confirm & clock out</button></div>
          </div>
        </div>

        <!-- context sheet -->
        <div x-show="sheet==='context'" x-cloak class="absolute inset-0 z-20 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
            ${recordSheetHeader('su.name', "'Care summary'")}
            <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body">
              <div class="card p-4 flex items-center gap-3"><span class="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 grid place-items-center text-lg font-bold" x-text="su.initials"></span><div><p class="text-xl font-bold text-ink-900" x-text="su.name"></p><p class="text-sm text-ink-500">DOB <span x-text="su.dob"></span></p></div></div>
              <div class="card p-4"><p class="section-title text-danger-700 mb-1.5 flex items-center gap-1.5">${icon('alert', 'w-3.5 h-3.5')}Allergies</p><div class="flex flex-wrap gap-1.5"><template x-for="a in (su.allergies||[])" :key="a"><span class="badge bg-danger-50 text-danger-700 ring-danger-100" x-text="a"></span></template><span x-show="!(su.allergies||[]).length" class="text-sm text-ink-500">None recorded</span></div></div>
              <div class="card p-4"><p class="section-title text-warning-700 mb-1.5 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Active risks</p><div class="flex flex-wrap gap-1.5"><template x-for="r in (su.risks||[])" :key="r"><span class="badge bg-warning-50 text-warning-700 ring-warning-100" x-text="r"></span></template><span x-show="!(su.risks||[]).length" class="text-sm text-ink-500">None recorded</span></div></div>
              ${aboutCareMarkup}
              <div class="card p-4"><p class="section-title mb-1">About me</p><p class="text-sm text-ink-700" x-text="su.aboutMe || '—'"></p></div>
              <div class="card p-4"><p class="section-title mb-1.5 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Key-safe / access</p>${keySafeMarkup}<p class="text-sm text-ink-700 mt-1.5" x-text="su.access || '—'"></p></div>
              <div class="card p-4 flex items-center gap-3"><span class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 grid place-items-center">${icon('bell', 'w-4.5 h-4.5')}</span><div class="flex-1 min-w-0"><p class="section-title">Emergency contact</p><p class="text-sm text-ink-700 truncate" x-text="su.emergencyContact || '—'"></p></div><button @click="window.__notify('Calling…','info')" class="btn btn-primary btn-sm">Call</button></div>
            </div>
          </div>
        </div>

        <!-- message sheet -->
        <div x-show="sheet==='message'" x-cloak class="absolute inset-0 z-20 bg-black/40 flex items-end" @click.self="sheet=null; errors=[]">
          <div class="bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden">
            ${recordSheetHeader("'Office & on-call'", 'su.name')}
            <div class="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5 sheet-body">
              <div class="card p-3.5"><label class="label">Message the office</label><textarea x-model="msgText" rows="3" class="field px-3 py-2" placeholder="Type a message…"></textarea></div>
              <button @click="window.__notify('Calling on-call manager…','info')" class="btn btn-secondary btn-md w-full">${icon('bell', 'w-4 h-4')}Call on-call manager</button>
              <div class="rounded-xl bg-danger-50 ring-1 ring-danger-100 p-3.5"><p class="section-title text-danger-700 mb-1 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Lone worker</p><button @click="window.__notify('Safety check-in sent to office','success')" class="btn btn-danger btn-md w-full mt-1">Send safety check-in</button></div>
            </div>
            <div class="p-4 border-t border-ink-200 bg-surface shrink-0"><button @click="sendMessage()" :disabled="!msgText" class="btn btn-lg w-full" :class="msgText ? 'btn-primary' : 'btn-secondary opacity-60'">Send to office</button></div>
          </div>
        </div>

      </div>

    </div>`

  return mobileFlow(inner)
}
