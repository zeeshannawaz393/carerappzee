/**
 * Carer app v2 store — persisted to localStorage. Holds everything the carer
 * captures at the point of care: task evidence, medication administrations,
 * observations, incidents, messages, clock in/out and handover notes.
 */
const KEY = 'caretask.carer.v3'

const empty = () => ({ seq: 1, clock: {}, tasks: {}, meds: [], observations: [], incidents: [], messages: [], notes: {}, inbound: [], protocols: [], acks: {}, alertLc: {}, drafts: {}, queued: 0, jobs: {}, changeRequests: [], recon: {}, reposition: [], cash: {}, learning: {}, trainRenew: {}, courseProg: {}, wounds: {} })

function load() {
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return empty()
  }
}
let s = load()
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* quota */
  }
}

/* deterministic progressing clock (Date.now unavailable in this env) */
let tick = 0
function now() {
  const base = 7 * 60 + 32 + tick++ * 4
  const h = Math.floor(base / 60) % 24
  const m = base % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
const id = (p) => `${p}-${s.seq++}`
const bump = () => {
  s.queued = (s.queued || 0) + 1
}

export const carerStore = {
  /* ---- clock ---- */
  clock(visitId) {
    return s.clock[visitId] || { in: null, out: null, late: false }
  },
  clockIn(visitId, meta = {}) {
    s.clock[visitId] = { ...this.clock(visitId), in: now(), ...meta }
    save()
    return s.clock[visitId]
  },
  clockOut(visitId, meta = {}) {
    s.clock[visitId] = { ...this.clock(visitId), out: now(), ...meta }
    save()
    return s.clock[visitId]
  },
  /** Merge metadata into a visit clock without moving the in/out times —
   *  used by geofence lock / office authorisation. */
  updateClock(visitId, meta = {}) {
    s.clock[visitId] = { ...this.clock(visitId), ...meta }
    save()
    return s.clock[visitId]
  },

  /* ---- tasks ---- */
  task(visitId, taskId) {
    return s.tasks[`${visitId}::${taskId}`] || null
  },
  saveTask(visitId, taskId, rec) {
    s.tasks[`${visitId}::${taskId}`] = { ...rec, at: now() }
    bump()
    save()
    return s.tasks[`${visitId}::${taskId}`]
  },

  /* ---- medications ---- */
  medRecord(visitId, medId) {
    return s.meds.find((m) => m.visitId === visitId && m.medId === medId) || null
  },
  saveMed(rec) {
    const existing = s.meds.findIndex((m) => m.visitId === rec.visitId && m.medId === rec.medId && rec.group !== 'PRN')
    const row = { id: id('med'), at: now(), ...rec }
    if (existing > -1) s.meds[existing] = row
    else s.meds.push(row)
    bump()
    save()
    return row
  },
  medsForVisit(visitId) {
    return s.meds.filter((m) => m.visitId === visitId)
  },

  /* ---- observations ---- */
  addObservation(obs) {
    const row = { id: id('obs'), at: now(), ...obs }
    s.observations.unshift(row)
    bump()
    save()
    return row
  },
  observations(visitId) {
    return s.observations.filter((o) => o.visitId === visitId)
  },
  observationsForUser(suId) {
    return s.observations.filter((o) => o.suId === suId)
  },

  /* ---- incidents ---- */
  addIncident(inc) {
    const row = { id: id('inc'), ref: `INC-${1000 + s.incidents.length + 1}`, at: now(), status: 'Reported', ...inc }
    s.incidents.unshift(row)
    bump()
    save()
    return row
  },
  incidents(visitId) {
    return s.incidents.filter((i) => i.visitId === visitId)
  },
  allIncidents() {
    return s.incidents
  },

  /* ---- messages ---- */
  addMessage(msg) {
    const row = { id: id('msg'), at: now(), ...msg }
    s.messages.unshift(row)
    bump()
    save()
    return row
  },
  messages(visitId) {
    return s.messages.filter((m) => m.visitId === visitId)
  },

  /* ---- notes ---- */
  note(visitId) {
    return s.notes[visitId] || ''
  },
  setNote(visitId, text) {
    s.notes[visitId] = text
    save()
  },

  /* ---- drafts / auto-save (§55.6) ---- */
  saveDraft(visitId, key, data) { s.drafts[`${visitId}:${key}`] = { data, at: now() }; save() },
  getDraft(visitId, key) { const d = s.drafts[`${visitId}:${key}`]; return d ? d.data : null },
  clearDraft(visitId, key) { delete s.drafts[`${visitId}:${key}`]; save() },

  /* ---- alert lifecycle (§48) ---- */
  setAlertLc(id, state) { s.alertLc[id] = { state, at: now() }; save() },
  alertLc(id) { return s.alertLc[id] || null },

  /* ---- care-plan acknowledgement (§16) ---- */
  ackPlan(suId, version) { s.acks[`${suId}:${version}`] = now(); save() },
  planAcked(suId, version) { return !!s.acks[`${suId}:${version}`] },
  ackHandover(visitId) { s.acks[`ho:${visitId}`] = now(); save() },
  handoverAcked(visitId) { return !!s.acks[`ho:${visitId}`] },

  /* ---- emergency protocol executions (§51) ---- */
  addProtocolRun(rec) { const row = { id: id('proto'), ref: `PROT-${2000 + s.protocols.length + 1}`, at: now(), ...rec }; s.protocols.unshift(row); bump(); save(); return row },
  protocolsFor(visitId) { return s.protocols.filter((p) => p.visitId === visitId) },
  allProtocols() { return s.protocols },

  /* ---- inbound (office → carer) ---- */
  addInbound(n) { const row = { id: id('nt'), at: now(), read: false, ...n }; s.inbound.unshift(row); save(); return row },
  inbound() { return s.inbound },
  unread() { return s.inbound.filter((n) => !n.read).length },
  markInboundRead() { s.inbound.forEach((n) => (n.read = true)); save() },

  /* ---- non-visit jobs (§17 / E10) ---- */
  job(jobId) { return s.jobs[jobId] || null },
  completeJob(jobId, rec = {}) { s.jobs[jobId] = { status: 'done', at: now(), ...rec }; bump(); save(); return s.jobs[jobId] },
  jobsDone() { return Object.entries(s.jobs).map(([jobId, v]) => ({ jobId, ...v })) },

  /* ---- change requests (§24 / E10) ---- */
  addChangeRequest(cr) { const row = { id: id('cr'), ref: `CR-${3000 + s.changeRequests.length + 1}`, at: now(), state: 'Raised', ...cr }; s.changeRequests.unshift(row); bump(); save(); return row },
  changeRequests() { return s.changeRequests },
  setChangeRequestState(crId, state) { const cr = s.changeRequests.find((c) => c.id === crId); if (cr) { cr.state = state; save() } },

  /* ---- medication reconciliation actions (§49 / E9) ---- */
  reconAction(suId, medId, action, note = '') { s.recon[`${suId}:${medId}`] = { action, note, at: now() }; bump(); save() },
  reconFor(suId, medId) { return s.recon[`${suId}:${medId}`] || null },

  /* ---- repositioning (§19 / E9) ---- */
  addReposition(rec) { const row = { id: id('rep'), at: now(), ...rec }; s.reposition.unshift(row); bump(); save(); return row },
  repositions(suId) { return s.reposition.filter((r) => r.suId === suId) },

  /* ---- wound-healing tracker (§19 / E9) — serial measurements per wound ---- */
  addWoundMeasurement(woundId, m) { (s.wounds[woundId] = s.wounds[woundId] || []).push({ ...m, at: now() }); bump(); save(); return s.wounds[woundId] },
  woundMeasurements(woundId) { return s.wounds[woundId] || [] },

  /* ---- client-money cash count (§26 / E9) ---- */
  setCash(suId, rec) { s.cash[suId] = { ...(s.cash[suId] || {}), ...rec, at: now() }; save(); return s.cash[suId] },
  cash(suId) { return s.cash[suId] || null },

  /* ---- learning centre (§28 / E12) ---- */
  courseState(courseId) { return s.learning[courseId] || null },
  completeCourse(courseId, rec = {}) { s.learning[courseId] = { status: 'complete', progress: 100, at: now(), ...rec }; bump(); save(); return s.learning[courseId] },
  learningDone() { return Object.entries(s.learning).map(([courseId, v]) => ({ courseId, ...v })) },
  renewTraining(recordId, rec = {}) { s.trainRenew[recordId] = { ...rec, at: now() }; save(); return s.trainRenew[recordId] },
  trainingRenewal(recordId) { return s.trainRenew[recordId] || null },
  /* course resume bookmark (§28 — the SCORM cmi.location analog: current screen) */
  courseProgress(courseId) { return s.courseProg[courseId] || null },
  setCourseProgress(courseId, screen, module = 0) { s.courseProg[courseId] = { screen, module, at: now() }; save() },
  clearCourseProgress(courseId) { delete s.courseProg[courseId]; save() },

  /* ---- cross-visit aggregation (office bridge) ---- */
  allChangeRequests() { return s.changeRequests },
  allReconActions() { return Object.entries(s.recon).map(([k, v]) => { const [suId, medId] = k.split(':'); return { suId, medId, ...v } }) },
  allObservations() { return s.observations },
  allMeds() { return s.meds },
  allMessages() { return s.messages },
  allTasks() { return Object.entries(s.tasks).map(([k, v]) => { const [visitId, taskId] = k.split('::'); return { visitId, taskId, ...v } }) },
  allClocks() { return Object.entries(s.clock).map(([visitId, v]) => ({ visitId, ...v })) },

  /* ---- sync / reset ---- */
  queued() {
    return s.queued || 0
  },
  sync() {
    s.queued = 0
    save()
  },
  reset() {
    s = empty()
    tick = 0
    save()
  },
}
