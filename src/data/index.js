/** Aggregate data API + derived stats for dashboards and reports. */
export * from './enums.js'
export * from './schemas.js'
export * from './templates.js'
export * from './packs.js'
export * from './serviceUsers.js'
export * from './serviceUserTasks.js'
export * from './alerts.js'
export * from './governance.js'

import { TEMPLATES } from './templates.js'
import { PACKS } from './packs.js'
import { SERVICE_USERS } from './serviceUsers.js'
import { ALERTS } from './alerts.js'
import { CATEGORIES, SEVERITY } from './enums.js'

export const STATS = {
  templates: TEMPLATES.length,
  published: TEMPLATES.filter((t) => t.governance.status === 'published').length,
  pendingApproval: TEMPLATES.filter((t) => t.governance.status === 'pending').length,
  drafts: TEMPLATES.filter((t) => t.governance.status === 'draft').length,
  packs: PACKS.length,
  serviceUsers: SERVICE_USERS.length,
  openExceptions: ALERTS.filter((a) => a.status === 'open').length,
  criticalAlerts: ALERTS.filter((a) => a.severity === 'critical' && a.status === 'open').length,
}

export function categoryCounts() {
  return CATEGORIES.map((c) => ({
    ...c,
    count: TEMPLATES.filter((t) => t.categoryId === c.id).length,
  }))
}

export function alertsBySeverity() {
  const order = Object.keys(SEVERITY)
  const counts = {}
  order.forEach((s) => (counts[s] = ALERTS.filter((a) => a.severity === s && a.status !== 'closed').length))
  return counts
}

/** Most-used templates (for reports). */
export function topTemplates(limit = 6) {
  return [...TEMPLATES].sort((a, b) => b.usedByCount - a.usedByCount).slice(0, limit)
}

/** Templates flagged for compliance gaps (reporting). */
export function complianceGaps() {
  return {
    noCarePlanLink: TEMPLATES.filter((t) => !t.carePlanDomain).length,
    medWithoutEmar: TEMPLATES.filter((t) => t.categoryId === 'medication' && !t.dependencies.some((d) => d.includes('eMAR'))).length,
    noReviewTemporary: TEMPLATES.filter((t) => t.type === 'temporary' && !t.frequency).length,
    pendingApproval: STATS.pendingApproval,
  }
}

/** Mock 7-day hydration series for Mary (reports/trends). */
export const HYDRATION_TREND = [
  { day: 'Mon', ml: 1420 }, { day: 'Tue', ml: 1180 }, { day: 'Wed', ml: 1610 },
  { day: 'Thu', ml: 980 }, { day: 'Fri', ml: 1320 }, { day: 'Sat', ml: 760 }, { day: 'Sun', ml: 1090 },
]
export const HYDRATION_TARGET = 1500

/** Task completion mix for reports. */
export const COMPLETION_MIX = [
  { label: 'Completed', value: 78, tone: 'success' },
  { label: 'Refused', value: 7, tone: 'danger' },
  { label: 'Partial', value: 9, tone: 'warning' },
  { label: 'Missed', value: 6, tone: 'danger' },
]
