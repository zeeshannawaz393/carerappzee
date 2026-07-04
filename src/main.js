import './style.css'
import Alpine from 'alpinejs'

import { route, startRouter, onContentRender, navigate, setNotFound, handleRoute } from './lib/router.js'
import { renderShell, setActiveNav } from './components/shell.js'
import { store } from './lib/store.js'
import { toast, openModal, closeModal, openDrawer, closeDrawer } from './lib/overlay.js'

import { renderDashboard } from './screens/dashboard.js'
import { renderLibrary } from './screens/library.js'
import { renderTemplateDetail } from './screens/templateDetail.js'
import { renderTemplateWizard } from './screens/templateWizard.js'
import { renderPacks, renderPackDetail, renderPackBuilder } from './screens/packs.js'
import { renderApply } from './screens/apply.js'
import { renderServiceUsers } from './screens/serviceUsers.js'
import { renderPlanner, openTaskDrawer } from './screens/planner.js'
import { renderCarerVisit, registerCarerApp } from './screens/carer.js'
import { renderToday, renderShiftSummary } from './carer/today.js'
import { renderLogin, renderWelcome } from './carer/auth.js'
import { renderClients, renderClientProfile } from './carer/clients.js'
import { renderCarePlan, renderMedProfile, renderHistory, renderDocuments, renderCapacity, renderAssessments } from './carer/clientDetail.js'
import { renderMedOrders, renderReconcile } from './carer/medOrders.js'
import { renderMonitoring } from './carer/obsIntegrity.js'
import { renderJobs } from './carer/jobs.js'
import { renderChangeRequests } from './carer/changeRequest.js'
import { renderReports as renderCarerReports, renderExport } from './carer/reports.js'
import { renderAssurance } from './carer/assurance.js'
import { renderInbox, renderThread } from './carer/inbox.js'
import { renderNotifications, renderOnCall, renderMyAlerts } from './carer/notifications.js'
import { renderSchedule, renderSyncManager } from './carer/schedule.js'
import { renderExpenses, renderPay, renderPayslip } from './carer/money.js'
import { renderDeathWorkflow, renderAbsence, renderFeedback } from './carer/workflows.js'
import { renderHelp, renderSearch } from './carer/help.js'
import { renderBreakGlass, renderShare } from './carer/access.js'
import { renderEquipment } from './carer/equipment.js'
import { renderReablement } from './carer/reablement.js'
import { renderNightShift } from './carer/night.js'
import { renderTranslate } from './carer/translate.js'
import { PARAMS, COURSE_TO_RECORD, renewalExpiry } from './data/carer.js'
import { renderMe } from './carer/me.js'
import { renderTimesheet, renderAvailability, renderTraining, renderSettings, renderSafety } from './carer/meScreens.js'
import { renderLearning } from './carer/learning.js'
import { renderSkills } from './carer/skills.js'
import { renderStaffDocs } from './carer/staffDocs.js'
import { renderProfile } from './carer/profile.js'
import { snapBodyPart as bodySnap } from './data/bodyMapHotspots.js'
import { comingSoon } from './carer/frame.js'
import { session, authRedirect } from './carer/session.js'
import { icon } from './icons.js'
import { catIcon } from './components/domain.js'
import { carerStore } from './lib/carerStore.js'
import { renderExceptions, openAlertDrawer } from './screens/exceptions.js'
import { renderReports } from './screens/reports.js'
import { renderAudit } from './screens/audit.js'
import { renderGovernance } from './screens/governance.js'
import { renderPermissions } from './screens/permissions.js'
import { notFound } from './screens/notFound.js'

/* ----------------------------------------------------------- Global handlers */
window.__nav = navigate
window.__toast = toast
window.__closeModal = closeModal
window.__closeDrawer = closeDrawer
window.__openModal = openModal
window.__openDrawer = openDrawer
window.__openTask = openTaskDrawer
window.__openAlert = openAlertDrawer

/* carer-app reactive helpers (used inside Alpine x-html / onclick) */
const CARER_STATUS_ICON = { completed: 'check-circle', refused: 'refuse', unable: 'warning', partial: 'info', flagged: 'flag', pending: 'clock' }
window.__icon = (s) => icon(CARER_STATUS_ICON[s] || 'clock', 'w-3.5 h-3.5')
window.__catIcon = (cid) => catIcon(cid, 'w-4 h-4', 'w-8 h-8')
window.__obsIcon = (name, cls = 'w-5 h-5') => icon(name || 'activity', cls)
window.__bodySnap = (view, x, y) => bodySnap(view, x, y)
window.__carerSync = () => { carerStore.sync(); handleRoute() }
window.__carerReset = () => { carerStore.reset(); handleRoute(); toast('Carer demo data reset', 'info') }
window.__carerNotifRead = () => { carerStore.markInboundRead(); handleRoute() }

/* §34 — accessibility preferences */
const A11Y = { large: localStorage.getItem('caretask.a11y.large') === '1', contrast: localStorage.getItem('caretask.a11y.contrast') === '1' }
function applyA11y() { document.documentElement.classList.toggle('a11y-large', A11Y.large); document.body.classList.toggle('a11y-contrast', A11Y.contrast) }
window.__a11yGet = (k) => !!A11Y[k]
window.__a11y = (k, on) => { A11Y[k] = on; try { localStorage.setItem('caretask.a11y.' + k, on ? '1' : '0') } catch {} applyA11y() }

/* §10 — auto-lock: idle timer + re-auth overlay */
let __idleTimer = null
function __resetIdle() { clearTimeout(__idleTimer); __idleTimer = setTimeout(() => window.__lock(), (PARAMS.AUTOLOCK_MIN || 5) * 60000) }
window.__lock = () => {
  if (document.getElementById('carer-lock')) return
  const el = document.createElement('div'); el.id = 'carer-lock'
  el.className = 'fixed inset-0 z-[200] bg-primary-800 text-white grid place-items-center'
  el.innerHTML = '<div class="text-center px-8"><div class="w-16 h-16 rounded-2xl bg-white/10 grid place-items-center mx-auto mb-4 ring-1 ring-white/20">🔒</div><p class="text-lg font-bold">App locked</p><p class="text-sm text-primary-200 mt-1">Locked after inactivity. Re-authenticate to continue.</p><button onclick="window.__unlock()" class="mt-5 h-11 px-6 rounded-2xl bg-white text-primary-800 font-semibold">Unlock with Face ID / PIN</button></div>'
  document.body.appendChild(el)
}
window.__unlock = () => { document.getElementById('carer-lock')?.remove(); __resetIdle(); toast('Unlocked', 'success') }
;['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, __resetIdle, { passive: true }))
window.__ackPlan = (suId, version) => { carerStore.ackPlan(suId, version); handleRoute(); toast('Care plan version acknowledged', 'success') }
window.__officeRespond = (action, id) => {
  const state = action.includes('scalat') ? 'Escalated' : action.includes('resolv') ? 'Resolved' : action.includes('action') ? 'Action started' : 'Acknowledged'
  if (id) carerStore.setAlertLc(id, state)
  const tone = state === 'Resolved' ? 'success' : state === 'Escalated' ? 'warning' : 'info'
  carerStore.addInbound({ kind: 'ack', title: 'Office update', body: `An exception you raised was ${state.toLowerCase()}.`, tone, href: '#/carer/alerts' })
  closeDrawer()
  toast(`Alert ${state.toLowerCase()} — carer notified`, tone === 'warning' ? 'warning' : 'success')
  handleRoute()
}
/* E9/E10 — carer-recorded actions that surface to the office loop */
window.__recon = (suId, medId, action) => {
  carerStore.reconAction(suId, medId, action)
  carerStore.addInbound({ kind: 'ack', title: 'Medication reconciliation', body: `Reconciliation for a medicine is now "${action}".`, tone: action === 'Confirmed' ? 'success' : 'warning', href: `#/carer/clients/${suId}/orders` })
  handleRoute()
  toast(`Reconciliation ${action.toLowerCase()}`, action === 'Confirmed' ? 'success' : 'info')
}
window.__externalAdmin = (suId, medId, role, method, affectsInterval) => {
  carerStore.reconAction(suId, medId, 'Confirmed', `External dose by ${role} (${method})${affectsInterval ? ' · affects interval' : ''}`)
  toast(`External dose recorded & reconciled${affectsInterval ? ' — interval updated' : ''}`, 'success')
  handleRoute()
}
window.__reposition = (suId, pos, skin) => {
  carerStore.addReposition({ suId, to: pos, skin })
  toast(`Repositioning logged — ${pos}`, skin && skin !== 'Intact' ? 'warning' : 'success')
  handleRoute()
}
window.__doJob = (jobId, evidence) => {
  carerStore.completeJob(jobId, { evidence: !!evidence })
  toast(evidence ? 'Job completed with evidence' : 'Job marked done', 'success')
  handleRoute()
}
window.__raiseChange = (target, what, urgent, promote) => {
  const cr = carerStore.addChangeRequest({ target, what, urgent: !!urgent, promote })
  carerStore.addInbound({ kind: 'ack', title: 'Change request received', body: `${cr.ref} — ${target} routed to the office.`, tone: 'info', href: '#/carer/changes' })
  handleRoute()
  toast(`${cr.ref} sent to office`, urgent ? 'warning' : 'success')
}
window.__completeCourse = (courseId, title) => {
  carerStore.completeCourse(courseId)
  carerStore.clearCourseProgress(courseId)
  const recId = COURSE_TO_RECORD[courseId]
  if (recId) carerStore.renewTraining(recId, { expiry: renewalExpiry(12) })
  handleRoute()
  toast(`${title || 'Course'} completed — certificate issued & CPD updated`, 'success')
}
/* §28 — save the learner's current lesson screen (resume bookmark); no re-render. */
window.__courseProgress = (courseId, screen, module) => { carerStore.setCourseProgress(courseId, Number(screen) || 0, Number(module) || 0) }
window.__carerRole = (roleId) => { session.setRole(roleId); handleRoute(); toast('Acting role changed', 'info') }
window.__carerLogin = () => { session.login(); navigate('/carer') }
window.__carerOnboard = () => { session.completeOnboarding(); navigate('/carer') }
window.__carerLogout = () => { session.logout(); navigate('/carer/login') }

/* Auth guard for carer tab/flow routes — renders login/onboarding inline when needed. */
function guard(fn) {
  return (params, query) => {
    const r = authRedirect()
    if (r === '/carer/login') return renderLogin()
    if (r === '/carer/welcome') return renderWelcome()
    return fn(params, query)
  }
}
window.__setRole = (role) => {
  store.set('role', role)
  renderShell()
  setActiveNav(location.hash.slice(1) || '/')
  // re-init Alpine + re-render content
  Alpine.initTree(document.getElementById('app'))
  handleRoute()
  toast(`Now acting as ${role}`, 'info')
}
window.__notify = (msg, type = 'success') => toast(msg, type)

/* ------------------------------------------------------------------ Routes */
route('/', renderDashboard)
route('/templates', renderLibrary)
route('/templates/new', renderTemplateWizard)
route('/templates/:id/edit', renderTemplateWizard)
route('/templates/:id', renderTemplateDetail)
route('/packs', renderPacks)
route('/packs/new', renderPackBuilder)
route('/packs/:id', renderPackDetail)
route('/apply', renderApply)
route('/service-users', renderServiceUsers)
route('/service-users/:id/planner', renderPlanner)
route('/carer/login', renderLogin)
route('/carer/welcome', renderWelcome)
route('/carer', guard(renderToday))
route('/carer/schedule', guard(renderSchedule))
route('/carer/shift-summary', guard(renderShiftSummary))
route('/carer/map', guard(() => comingSoon('Round map', '#/carer')))
route('/carer/search', guard(renderSearch))
route('/carer/death', guard(renderDeathWorkflow))
route('/carer/breakglass', guard(renderBreakGlass))
route('/carer/share', guard(renderShare))
route('/carer/translate', guard(renderTranslate))
route('/carer/night/:visit', guard(renderNightShift))
route('/carer/notifications', guard(renderNotifications))
route('/carer/oncall', guard(renderOnCall))
route('/carer/alerts', guard(renderMyAlerts))
route('/carer/clients', guard(renderClients))
route('/carer/clients/:id/careplan', guard(renderCarePlan))
route('/carer/clients/:id/meds', guard(renderMedProfile))
route('/carer/clients/:id/history', guard(renderHistory))
route('/carer/clients/:id/documents', guard(renderDocuments))
route('/carer/clients/:id/mca', guard(renderCapacity))
route('/carer/clients/:id/equipment', guard(renderEquipment))
route('/carer/clients/:id/reablement', guard(renderReablement))
route('/carer/clients/:id/orders', guard(renderMedOrders))
route('/carer/clients/:id/reconcile', guard(renderReconcile))
route('/carer/clients/:id/monitoring', guard(renderMonitoring))
route('/carer/clients/:id/assessments', guard(renderAssessments))
route('/carer/clients/:id', guard(renderClientProfile))
route('/carer/inbox', guard(renderInbox))
route('/carer/inbox/:threadId', guard(renderThread))
route('/carer/me', guard(renderMe))
route('/carer/jobs', guard(renderJobs))
route('/carer/changes', guard(renderChangeRequests))
route('/carer/reports', guard(renderCarerReports))
route('/carer/export', guard(renderExport))
route('/carer/assurance', guard(renderAssurance))
route('/carer/me/timesheet', guard(renderTimesheet))
route('/carer/me/availability', guard(renderAvailability))
route('/carer/me/training', guard(renderTraining))
route('/carer/me/learning', guard(renderLearning))
route('/carer/me/skills', guard(renderSkills))
route('/carer/me/documents', guard(renderStaffDocs))
route('/carer/me/settings', guard(renderSettings))
route('/carer/me/safety', guard(renderSafety))
route('/carer/me/help', guard(renderHelp))
route('/carer/me/sync', guard(renderSyncManager))
route('/carer/me/expenses', guard(renderExpenses))
route('/carer/me/pay', guard(renderPay))
route('/carer/me/payslip/:id', guard(renderPayslip))
route('/carer/me/profile', guard(renderProfile))
route('/carer/me/absence', guard(renderAbsence))
route('/carer/me/feedback', guard(renderFeedback))
route('/carer/visit/:visit', guard(renderCarerVisit))
route('/exceptions', renderExceptions)
route('/reports', renderReports)
route('/audit', renderAudit)
route('/governance', renderGovernance)
route('/permissions', renderPermissions)
setNotFound(notFound)

/* ------------------------------------------------------------------ Boot */
renderShell()
onContentRender((view, _r, ctx) => {
  const slot = document.getElementById('route-content')
  const path = location.hash.slice(1) || '/'
  // Carer app runs as its own full-screen mobile shell (office chrome hidden).
  document.body.classList.toggle('carer-mode', path === '/carer' || path.startsWith('/carer/'))
  slot.innerHTML = view
  setActiveNav(path)
})

window.Alpine = Alpine
registerCarerApp(Alpine)
applyA11y()
__resetIdle()
Alpine.start()
startRouter()
