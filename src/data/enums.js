/** Shared enums / taxonomy used across templates, tasks and UI. */

export const CATEGORIES = [
  { id: 'personal-care', code: 'PC', name: 'Personal Care & Hygiene', icon: 'bath', color: 'primary', desc: 'Daily dignity, cleanliness and personal appearance.' },
  { id: 'medication', code: 'MED', name: 'Medication / eMAR', icon: 'pill', color: 'danger', desc: 'eMAR-linked administration, prompts and PRN protocols.' },
  { id: 'nutrition', code: 'NUT', name: 'Nutrition', icon: 'utensils', color: 'warning', desc: 'Meal support, food intake and diet monitoring.' },
  { id: 'hydration', code: 'HYD', name: 'Hydration', icon: 'droplet', color: 'info', desc: 'Fluid intake monitoring across the day.' },
  { id: 'continence', code: 'CON', name: 'Continence & Toileting', icon: 'refuse', color: 'teal', desc: 'Toileting support, continence products and output.' },
  { id: 'mobility', code: 'MOB', name: 'Mobility & Transfers', icon: 'footprints', color: 'primary', desc: 'Transfers, repositioning and safe moving & handling.' },
  { id: 'falls-safety', code: 'SAF', name: 'Falls & Home Safety', icon: 'shield', color: 'warning', desc: 'Environment checks and falls prevention.' },
  { id: 'skin', code: 'SKN', name: 'Skin, Wounds & Pressure Care', icon: 'activity', color: 'danger', desc: 'Skin integrity, pressure areas and wound observation.' },
  { id: 'observations', code: 'OBS', name: 'Health Observations', icon: 'thermometer', color: 'info', desc: 'Measurements, scores and clinical escalation.' },
  { id: 'domestic', code: 'DOM', name: 'Domestic Support', icon: 'home', color: 'ink', desc: 'Household tasks supporting a safe home.' },
  { id: 'wellbeing', code: 'WEL', name: 'Wellbeing & Companionship', icon: 'smile', color: 'teal', desc: 'Social, emotional and companionship support.' },
  { id: 'dementia', code: 'DEM', name: 'Dementia / Cognition', icon: 'brain', color: 'primary', desc: 'Orientation, reassurance and distress support.' },
  { id: 'appointments', code: 'APP', name: 'Appointments & Community', icon: 'calendar', color: 'info', desc: 'Appointment, transport and community support.' },
  { id: 'reablement', code: 'REA', name: 'Reablement & Independence', icon: 'target', color: 'success', desc: 'Outcome-focused independence goals.' },
  { id: 'end-of-life', code: 'EOL', name: 'End of Life / Comfort Care', icon: 'heart', color: 'danger', desc: 'Sensitive comfort and dignity care.' },
  { id: 'safeguarding', code: 'SG', name: 'Safeguarding & Concerns', icon: 'flag', color: 'danger', desc: 'Concern follow-ups and escalations.' },
]

export const TEMPLATE_TYPES = {
  checklist: { label: 'Checklist task', ui: 'Multiple tick boxes', icon: 'list' },
  simple: { label: 'Simple task', ui: 'Done / not done', icon: 'check-circle' },
  instruction: { label: 'Instruction task', ui: 'Read + optional note', icon: 'info' },
  observation: { label: 'Observation task', ui: 'Score + note', icon: 'eye' },
  measurement: { label: 'Measurement task', ui: 'Number input + unit', icon: 'scale' },
  medication: { label: 'Medication task', ui: 'eMAR outcome', icon: 'pill' },
  bodymap: { label: 'Body map task', ui: 'Body map + note', icon: 'activity' },
  food: { label: 'Food intake task', ui: 'Meal + amount eaten', icon: 'utensils' },
  incident: { label: 'Incident-linked task', ui: 'Observation + incident link', icon: 'warning' },
  goal: { label: 'Goal task', ui: 'Progress level', icon: 'target' },
  temporary: { label: 'Temporary task', ui: 'End date + review', icon: 'clock' },
  followup: { label: 'Follow-up task', ui: 'Assigned office action', icon: 'flag' },
}

export const PRIORITIES = {
  optional: { label: 'Optional', rank: 0, badge: 'bg-ink-100 text-ink-600 ring-ink-200' },
  recommended: { label: 'Recommended', rank: 1, badge: 'bg-info-50 text-info-600 ring-info-100' },
  important: { label: 'Important', rank: 2, badge: 'bg-warning-50 text-warning-700 ring-warning-100' },
  essential: { label: 'Essential', rank: 3, badge: 'bg-primary-50 text-primary-700 ring-primary-200' },
  critical: { label: 'Critical', rank: 4, badge: 'bg-danger-50 text-danger-700 ring-danger-200' },
}

export const STATUSES = {
  draft: { label: 'Draft', badge: 'bg-ink-100 text-ink-600 ring-ink-200' },
  pending: { label: 'Pending approval', badge: 'bg-warning-50 text-warning-700 ring-warning-100' },
  approved: { label: 'Approved', badge: 'bg-success-50 text-success-700 ring-success-100' },
  published: { label: 'Published', badge: 'bg-success-50 text-success-700 ring-success-100' },
  deprecated: { label: 'Deprecated', badge: 'bg-ink-100 text-ink-500 ring-ink-200' },
  retired: { label: 'Retired', badge: 'bg-ink-100 text-ink-400 ring-ink-200' },
}

export const SEVERITY = {
  info: { label: 'Info', rank: 0, dot: 'bg-sev-info', badge: 'bg-ink-100 text-ink-600 ring-ink-200', text: 'text-sev-info' },
  low: { label: 'Low', rank: 1, dot: 'bg-sev-low', badge: 'bg-success-50 text-success-700 ring-success-100', text: 'text-sev-low' },
  medium: { label: 'Medium', rank: 2, dot: 'bg-sev-medium', badge: 'bg-warning-50 text-warning-700 ring-warning-100', text: 'text-sev-medium' },
  high: { label: 'High', rank: 3, dot: 'bg-sev-high', badge: 'bg-danger-50 text-danger-700 ring-danger-100', text: 'text-sev-high' },
  critical: { label: 'Critical', rank: 4, dot: 'bg-sev-critical', badge: 'bg-danger-100 text-danger-800 ring-danger-200', text: 'text-sev-critical' },
}

export const VISIT_TIMES = ['Morning', 'Lunch', 'Tea', 'Bedtime', 'Night', 'Any Visit']

export const CQC_KEY_QUESTIONS = ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led']

export const OUTCOME_CODES = {
  completed: { label: 'Completed', tone: 'success', icon: 'check-circle' },
  partial: { label: 'Partial', tone: 'warning', icon: 'info' },
  refused: { label: 'Refused', tone: 'danger', icon: 'refuse' },
  missed: { label: 'Missed', tone: 'danger', icon: 'x-circle' },
  unable: { label: 'Unable', tone: 'warning', icon: 'warning' },
  pending: { label: 'Pending', tone: 'ink', icon: 'clock' },
  flagged: { label: 'Flagged', tone: 'danger', icon: 'flag' },
}

export function category(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]
}
