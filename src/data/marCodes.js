/** eMAR administration (MAR) status codes.
 *  Pulled from the careflow-platform backend seed
 *  (careadmin-backend/prisma/seed-data/medication-status-codes.defaults.ts,
 *  "Default MAR status codes per canvases/medication.md §6").
 *
 *  Each code: single/short letter shown on the MAR chart, a label, chart colours,
 *  a category (drives chart tone), the resulting administration status, and whether
 *  a reason and/or a manager review are required when the carer selects it.
 *
 *  requirement values: 'required' | 'optional' | 'none'
 *  category values: SUCCESS · EXCEPTION · WARNING · INFORMATION · NEUTRAL · CRITICAL · PENDING
 */
export const MAR_STATUS_CODES = [
  { code: 'G', label: 'Given', color: '#2E7D32', textColor: '#FFFFFF', category: 'SUCCESS', status: 'GIVEN', reason: 'none', managerReview: 'none', sortOrder: 10 },
  { code: 'R', label: 'Refused', color: '#E53935', textColor: '#FFFFFF', category: 'EXCEPTION', status: 'REFUSED', reason: 'required', managerReview: 'required', sortOrder: 20 },
  { code: 'N', label: 'Not Given / Missed', color: '#FB8C00', textColor: '#FFFFFF', category: 'WARNING', status: 'MISSED', reason: 'required', managerReview: 'required', sortOrder: 30 },
  { code: 'U', label: 'Unavailable', color: '#9E9E9E', textColor: '#FFFFFF', category: 'WARNING', status: 'NOT_GIVEN', reason: 'required', managerReview: 'required', sortOrder: 40 },
  { code: 'H', label: 'Hospitalised', color: '#7B1FA2', textColor: '#FFFFFF', category: 'INFORMATION', status: 'NOT_GIVEN', reason: 'required', managerReview: 'optional', sortOrder: 50 },
  { code: 'A', label: 'Absent', color: '#607D8B', textColor: '#FFFFFF', category: 'INFORMATION', status: 'NOT_GIVEN', reason: 'required', managerReview: 'optional', sortOrder: 60 },
  { code: 'C', label: 'Cancelled', color: '#424242', textColor: '#FFFFFF', category: 'NEUTRAL', status: 'CANCELLED', reason: 'optional', managerReview: 'none', sortOrder: 70 },
  { code: 'F', label: 'Family Administered', color: '#1976D2', textColor: '#FFFFFF', category: 'INFORMATION', status: 'GIVEN', reason: 'optional', managerReview: 'optional', sortOrder: 80 },
  { code: 'I', label: 'Independent', color: '#00897B', textColor: '#FFFFFF', category: 'INFORMATION', status: 'GIVEN', reason: 'optional', managerReview: 'optional', sortOrder: 90 },
  { code: 'S', label: 'Self Medicated', color: '#00ACC1', textColor: '#FFFFFF', category: 'INFORMATION', status: 'GIVEN', reason: 'optional', managerReview: 'optional', sortOrder: 100 },
  { code: 'T', label: 'Already Done', color: '#3949AB', textColor: '#FFFFFF', category: 'INFORMATION', status: 'GIVEN', reason: 'optional', managerReview: 'optional', sortOrder: 110 },
  { code: 'O', label: 'Other', color: '#795548', textColor: '#FFFFFF', category: 'EXCEPTION', status: 'NOT_GIVEN', reason: 'required', managerReview: 'required', sortOrder: 120 },
  { code: 'P', label: 'Nausea / Vomiting', color: '#EC407A', textColor: '#FFFFFF', category: 'EXCEPTION', status: 'NOT_GIVEN', reason: 'required', managerReview: 'required', sortOrder: 130 },
  { code: 'PCI', label: 'Please Contact Carer', color: '#B71C1C', textColor: '#FFFFFF', category: 'CRITICAL', status: 'NOT_GIVEN', reason: 'required', managerReview: 'required', sortOrder: 140 },
  { code: 'Pending', label: 'Pending', color: '#E0E0E0', textColor: '#424242', category: 'PENDING', status: 'PENDING', reason: 'none', managerReview: 'none', sortOrder: 150 },
]

/** Lookup by code (case-sensitive, as stored on the chart). */
export function marCode(code) {
  return MAR_STATUS_CODES.find((c) => c.code === code)
}

/** Codes that count as the medicine having been taken. */
export const MAR_GIVEN_CODES = MAR_STATUS_CODES.filter((c) => c.status === 'GIVEN').map((c) => c.code)
/** Codes that require the carer to record a reason. */
export const MAR_REASON_REQUIRED_CODES = MAR_STATUS_CODES.filter((c) => c.reason === 'required').map((c) => c.code)
