/**
 * Office bridge — derives office-visible records (exceptions + audit) from the
 * carer's point-of-care data (carerStore). This closes the loop: what a carer
 * records in the field surfaces in the office Exception Monitor and Audit Trail.
 */
import { carerStore } from './carerStore.js'
import { getRota } from '../data/carer.js'
import { getServiceUser } from '../data/index.js'

const CARER = 'A. Khan'

/** §48 — one alert lifecycle reused by every alert type. Critical never auto-expires. */
export const ALERT_LIFECYCLE = ['Raised', 'Delivered', 'Seen', 'Acknowledged', 'Action started', 'Resolved']
export const ALERT_EXTRA = ['Escalated', 'Transferred', 'Withdrawn', 'Reopened']

function ctx(visitId) {
  const r = getRota(visitId)
  const su = r ? getServiceUser(r.suId) : null
  return { visit: r ? r.visit : '—', suName: su ? su.name : 'Service user', suId: r ? r.suId : '' }
}

/** Attach the current lifecycle state (store override or default) to an alert. */
function withLifecycle(a) {
  const lc = carerStore.alertLc(a.id)
  const lifecycle = lc ? lc.state : 'Delivered'
  return { ...a, lifecycle, status: lifecycle === 'Resolved' || lifecycle === 'Withdrawn' ? 'closed' : a.status }
}

/** Alerts derived from carer-recorded data, shaped like data/alerts.js ALERTS. */
export function carerAlerts() {
  const out = []

  // Abnormal observations
  carerStore.allObservations().filter((o) => o.flag === 'abnormal').forEach((o) => {
    const c = ctx(o.visitId)
    out.push({ id: `c-obs-${o.id}`, severity: 'high', type: 'Abnormal observation', title: `${o.typeName} outside normal range`, serviceUser: c.suName, serviceUserId: c.suId, template: o.typeName, visit: c.visit, time: o.at, carer: CARER, routedTo: 'Care Coordinator', status: 'open', taskCategory: 'observations', source: 'carer' })
  })

  // Refused / flagged tasks
  carerStore.allTasks().filter((t) => ['refused', 'flagged', 'unable'].includes(t.status)).forEach((t) => {
    const c = ctx(t.visitId)
    out.push({ id: `c-task-${t.visitId}-${t.taskId}`, severity: t.status === 'flagged' ? 'high' : 'medium', type: t.status === 'flagged' ? 'Concern flagged' : 'Task refused', title: `${t.outcomeLabel}`, serviceUser: c.suName, serviceUserId: c.suId, template: t.taskId, visit: c.visit, time: t.at, carer: CARER, routedTo: 'Care Coordinator', status: 'open', taskCategory: 'personal-care', source: 'carer' })
  })

  // Medication not given
  carerStore.allMeds().filter((m) => ['refused', 'unable'].includes(m.status)).forEach((m) => {
    const c = ctx(m.visitId)
    out.push({ id: `c-med-${m.id}`, severity: 'high', type: 'Medication not given', title: `${m.name} — ${m.outcome}`, serviceUser: c.suName, serviceUserId: c.suId, template: m.name, visit: c.visit, time: m.at, carer: CARER, routedTo: 'Registered Manager', status: 'open', taskCategory: 'medication', source: 'carer' })
  })

  // Emergency protocol executions (§51)
  carerStore.allProtocols().forEach((p) => {
    out.push({ id: `c-proto-${p.id}`, severity: 'critical', type: 'Emergency protocol', title: `${p.ref} · ${p.name} — ${p.outcome}`, serviceUser: p.suName, serviceUserId: p.suId, template: p.name, visit: ctx(p.visitId).visit, time: p.at, carer: CARER, routedTo: 'On-call clinical', status: 'open', taskCategory: 'observations', source: 'carer' })
  })

  // Incidents
  carerStore.allIncidents().forEach((i) => {
    const sev = ['Death', 'Severe'].includes(i.severity) ? 'critical' : i.severity === 'Moderate' ? 'high' : i.riddor ? 'high' : 'medium'
    out.push({ id: `c-inc-${i.id}`, severity: sev, type: 'Incident', title: `${i.ref} · ${i.typeName}${i.riddor ? ' (RIDDOR)' : ''}`, serviceUser: i.suName, serviceUserId: i.suId, template: i.typeName, visit: ctx(i.visitId).visit, time: i.at, carer: CARER, routedTo: 'Registered Manager', status: 'open', taskCategory: 'safeguarding', source: 'carer' })
  })

  // Change requests (§24 / E10)
  carerStore.allChangeRequests().filter((c) => c.state !== 'Actioned' && c.state !== 'Declined').forEach((c) => {
    out.push({ id: `c-cr-${c.id}`, severity: c.urgent ? 'high' : 'medium', type: 'Change request', title: `${c.ref} · ${c.target} — ${c.what}`, serviceUser: 'Service user', serviceUserId: '', template: c.target, visit: '—', time: c.at, carer: CARER, routedTo: 'Care Coordinator', status: 'open', taskCategory: 'personal-care', source: 'carer' })
  })

  return out.map(withLifecycle)
}

/** Audit entries derived from carer actions, shaped like data/governance.js AUDIT_LOG. */
export function carerAuditEntries() {
  const out = []
  const today = '2026-06-30'

  carerStore.allClocks().forEach((c) => {
    const x = ctx(c.visitId)
    if (c.in) out.push({ id: `ca-in-${c.visitId}`, entity: 'Visit task', name: `${x.suName} · ${x.visit} visit`, action: `Clocked in (${c.verified ? 'GPS verified' : 'exception: ' + (c.method || 'manual')})`, by: CARER, role: 'Carer', at: `${today} ${c.in}`, reason: c.reason || (c.welfare ? `Welfare: ${c.welfare}` : 'GPS confirmed') })
    if (c.out) out.push({ id: `ca-out-${c.visitId}`, entity: 'Visit task', name: `${x.suName} · ${x.visit} visit`, action: `Clocked out — ${c.dimensions ? c.dimensions.display : 'complete'}`, by: CARER, role: 'Carer', at: `${today} ${c.out}`, reason: c.reasonCode ? `Reason: ${c.reasonCode}` : 'Visit complete' })
  })
  carerStore.allTasks().forEach((t) => {
    const x = ctx(t.visitId)
    out.push({ id: `ca-task-${t.visitId}-${t.taskId}`, entity: 'Visit task', name: `${x.suName} · ${t.taskId}`, action: `Task ${t.outcomeLabel}`, by: CARER, role: 'Carer', at: `${today} ${t.at}`, reason: 'Point-of-care record' })
  })
  carerStore.allMeds().forEach((m) => {
    const x = ctx(m.visitId)
    out.push({ id: `ca-med-${m.id}`, entity: 'Visit task', name: `${x.suName} · ${m.name}`, action: `eMAR: ${m.outcome}`, by: CARER, role: 'Carer', at: `${today} ${m.time || m.at}`, reason: m.witnessedBy ? `Witness: ${m.witnessedBy}` : 'Medication record' })
  })
  carerStore.allObservations().forEach((o) => {
    const x = ctx(o.visitId)
    out.push({ id: `ca-obs-${o.id}`, entity: 'Visit task', name: `${x.suName} · ${o.typeName}`, action: `Observation recorded (${o.flag})`, by: CARER, role: 'Carer', at: `${today} ${o.at}`, reason: 'Point-of-care record' })
  })
  carerStore.allIncidents().forEach((i) => {
    out.push({ id: `ca-inc-${i.id}`, entity: 'Visit task', name: `${i.suName} · ${i.typeName}`, action: `${i.ref} reported & escalated`, by: CARER, role: 'Carer', at: `${today} ${i.at}`, reason: i.riddor ? 'RIDDOR flagged' : 'Incident report' })
  })
  carerStore.allProtocols().forEach((p) => {
    out.push({ id: `ca-proto-${p.id}`, entity: 'Visit task', name: `${p.suName} · ${p.name}`, action: `${p.ref} protocol closed — ${p.outcome}`, by: CARER, role: 'Carer', at: `${today} ${p.at}`, reason: p.contact || 'Deterioration protocol' })
  })
  carerStore.allChangeRequests().forEach((c) => {
    out.push({ id: `ca-cr-${c.id}`, entity: 'Change request', name: `${c.target}`, action: `${c.ref} raised — ${c.state}`, by: CARER, role: 'Carer', at: `${today} ${c.at}`, reason: c.promote ? `Promote to: ${c.promote}` : (c.urgent ? 'Urgent' : 'Field change request') })
  })
  carerStore.allReconActions().forEach((r) => {
    out.push({ id: `ca-recon-${r.suId}-${r.medId}`, entity: 'Medication', name: `${r.medId}`, action: `Reconciliation — ${r.action}`, by: CARER, role: 'Carer', at: `${today} ${r.at}`, reason: r.note || 'Order reconciliation' })
  })

  // newest first
  return out.sort((a, b) => b.at.localeCompare(a.at))
}
