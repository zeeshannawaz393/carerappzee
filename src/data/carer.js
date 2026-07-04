/**
 * Carer app v2 catalogs — rota, medication (MAR) schedules, observation
 * catalogue and incident taxonomy. Kept separate from the office-side data so
 * the point-of-care app is self-consistent.
 */

/* ------------------------------------------------------------------ Rota */
export const ROTA = [
  { id: 'v-mary-am', suId: 'su-mary', visit: 'Morning', time: '07:30 – 08:15', order: 1 },
  { id: 'v-doris-am', suId: 'su-doris', visit: 'Morning', time: '08:00 – 08:45', order: 2, twoCarer: true },
  { id: 'v-george-am', suId: 'su-george', visit: 'Morning', time: '08:30 – 09:00', order: 3 },
  { id: 'v-mary-lunch', suId: 'su-mary', visit: 'Lunch', time: '12:15 – 12:45', order: 4 },
  { id: 'v-doris-lunch', suId: 'su-doris', visit: 'Lunch', time: '12:45 – 13:15', order: 5 },
  { id: 'v-mary-tea', suId: 'su-mary', visit: 'Tea', time: '17:00 – 17:30', order: 6 },
  { id: 'v-george-tea', suId: 'su-george', visit: 'Tea', time: '17:45 – 18:15', order: 7 },
  { id: 'v-mary-bed', suId: 'su-mary', visit: 'Bedtime', time: '21:00 – 21:30', order: 8 },
]

export function getRota(id) {
  return ROTA.find((r) => r.id === id)
}

/* ------------------------------------------- §12 Working patterns (rolling rota) */

/** The demo clock is pinned to Tue 30 Jun 2026 (matches the schedule & timesheet views). */
export const DEMO_TODAY = '2026-06-30'

/**
 * §12 — a rolling WORKING PATTERN (the "CM2000" model): an n-week cycle anchored to a
 * week-commencing Monday. The rota for the week containing any date is
 * `pattern.weeks[(whole weeks since anchor) mod cycleWeeks]`. Day slots are:
 *   { kind:'shift', run, times, hours } · { kind:'available' } · { kind:'off' }
 * Overrides (leave/sickness/one-off) act on the generated week, never on the pattern;
 * genuine pattern changes are effective-dated (a new `anchor`) — office-owned.
 */
export const WORKING_PATTERN = {
  cycleWeeks: 4,
  anchor: '2026-06-01', // Monday — week-commencing date of cycle-week 1
  weeks: [
    [ // Week 1 — early shifts, weekend off
      { kind: 'shift', run: 'Mary Adams round', times: '07:30 – 14:00', hours: 6.5 },
      { kind: 'shift', run: 'Mary & George round', times: '07:30 – 14:00', hours: 6.5 },
      { kind: 'off' },
      { kind: 'shift', run: 'Doris & George round', times: '08:00 – 13:30', hours: 5.5 },
      { kind: 'shift', run: 'Mary round', times: '07:30 – 14:00', hours: 6.5 },
      { kind: 'off' },
      { kind: 'off' },
    ],
    [ // Week 2 — includes a weekend, a twilight
      { kind: 'available' },
      { kind: 'shift', run: 'Mary round', times: '07:30 – 14:00', hours: 6.5 },
      { kind: 'shift', run: 'Twilight round', times: '16:30 – 21:30', hours: 5 },
      { kind: 'off' },
      { kind: 'shift', run: 'Doris & Mary round', times: '08:00 – 13:30', hours: 5.5 },
      { kind: 'shift', run: 'Weekend cover', times: '08:00 – 14:00', hours: 6 },
      { kind: 'shift', run: 'Weekend cover', times: '08:00 – 14:00', hours: 6 },
    ],
    [ // Week 3
      { kind: 'shift', run: 'Mary & George round', times: '07:30 – 14:00', hours: 6.5 },
      { kind: 'off' },
      { kind: 'shift', run: 'Doris round', times: '08:00 – 13:30', hours: 5.5 },
      { kind: 'shift', run: 'Mary round', times: '07:30 – 14:00', hours: 6.5 },
      { kind: 'available' },
      { kind: 'off' },
      { kind: 'off' },
    ],
    [ // Week 4
      { kind: 'shift', run: 'Mary round', times: '07:30 – 14:00', hours: 6.5 },
      { kind: 'shift', run: 'Doris & George round', times: '08:00 – 13:30', hours: 5.5 },
      { kind: 'off' },
      { kind: 'shift', run: 'Twilight round', times: '16:30 – 21:30', hours: 5 },
      { kind: 'shift', run: 'Mary & George round', times: '07:30 – 14:00', hours: 6.5 },
      { kind: 'available' },
      { kind: 'off' },
    ],
  ],
}

const PATTERN_DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PATTERN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

/** Monday (UTC) of the ISO week containing `iso` (YYYY-MM-DD). */
function mondayOf(iso) {
  const d = new Date(iso + 'T00:00:00Z')
  const dowMon0 = (d.getUTCDay() + 6) % 7 // 0 = Mon … 6 = Sun
  d.setUTCDate(d.getUTCDate() - dowMon0)
  return d
}

/** §12 — cycle-week index (0-based) for a date: (whole weeks since anchor) mod cycleWeeks. */
export function cycleWeekFor(pattern, iso) {
  const weeks = Math.round((mondayOf(iso) - mondayOf(pattern.anchor)) / MS_PER_WEEK)
  return ((weeks % pattern.cycleWeeks) + pattern.cycleWeeks) % pattern.cycleWeeks
}

/** §12 — resolve the week containing `iso` into a carer-facing view: cycle-week number,
 *  week-commencing label, 7 dated day slots, and total rostered hours. */
export function patternWeek(pattern, iso) {
  const mon = mondayOf(iso)
  const ci = cycleWeekFor(pattern, iso)
  const days = pattern.weeks[ci].map((slot, i) => {
    const dt = new Date(mon)
    dt.setUTCDate(mon.getUTCDate() + i)
    const dayIso = dt.toISOString().slice(0, 10)
    return { dow: PATTERN_DOW[i], dom: dt.getUTCDate(), month: PATTERN_MONTHS[dt.getUTCMonth()], iso: dayIso, slot, isToday: dayIso === DEMO_TODAY }
  })
  const shiftHours = days.reduce((s, d) => s + (d.slot.kind === 'shift' ? d.slot.hours : 0), 0)
  return { cycleWeek: ci + 1, cycleWeeks: pattern.cycleWeeks, wcLabel: `${days[0].dom} ${days[0].month}`, days, shiftHours }
}

/** ISO Monday of the week after the one containing `iso` (for the next-week preview). */
export function nextWeekIso(iso) {
  const mon = mondayOf(iso)
  mon.setUTCDate(mon.getUTCDate() + 7)
  return mon.toISOString().slice(0, 10)
}

/** §12 — average contracted hours/week across the whole cycle. */
export function contractedWeeklyHours(pattern) {
  const total = pattern.weeks.reduce((s, wk) => s + wk.reduce((t, slot) => t + (slot.kind === 'shift' ? slot.hours : 0), 0), 0)
  return Math.round((total / pattern.cycleWeeks) * 10) / 10
}

/* ------------------------------------ §28 Learning centre, skills & training */

/** §28 — course catalogue for the in-app learning centre. Care Certificate 16
 *  standards (2025) + mandatory + condition-specific + refreshers. */
export const LEARNING_COURSES = [
  // Care Certificate
  { id: 'cc', title: 'Care Certificate', cat: 'Care Certificate', mins: 180, cpd: 6, validityMonths: 36, accreditation: ['CPD Certified', 'Skills for Care aligned'], status: 'in-progress', progress: 75, standards: 16, observationRequired: true, offline: true },
  // Mandatory
  { id: 'mh', title: 'Moving & handling', cat: 'Mandatory', mins: 45, cpd: 1.5, validityMonths: 12, accreditation: ['CPD Certified', 'CSTF', 'RoSPA'], status: 'complete', completed: '2026-03-03', cstf: true, offline: true },
  { id: 'sg', title: 'Safeguarding adults', cat: 'Mandatory', mins: 60, cpd: 2, validityMonths: 24, accreditation: ['CPD Certified', 'CSTF', 'Skills for Care aligned'], status: 'complete', completed: '2026-02-12', cstf: true },
  { id: 'sgc', title: 'Safeguarding children', cat: 'Mandatory', mins: 45, cpd: 1.5, validityMonths: 24, accreditation: ['CPD Certified', 'CSTF'], status: 'not-started', cstf: true },
  { id: 'med', title: 'Medication administration', cat: 'Mandatory', mins: 75, cpd: 2.5, validityMonths: 12, accreditation: ['CPD Certified', 'Skills for Care aligned'], status: 'not-started', modules: 8 },
  { id: 'ipc', title: 'Infection prevention & control', cat: 'Mandatory', mins: 40, cpd: 1, validityMonths: 12, accreditation: ['CPD Certified', 'CSTF'], status: 'complete', completed: '2025-07-15', cstf: true },
  { id: 'bls', title: 'Basic life support', cat: 'Mandatory', mins: 50, cpd: 1.5, validityMonths: 12, accreditation: ['CPD Certified', 'CSTF'], status: 'complete', completed: '2025-06-01', cstf: true },
  { id: 'fire', title: 'Fire safety', cat: 'Mandatory', mins: 30, cpd: 1, validityMonths: 12, accreditation: ['CPD Certified', 'CSTF'], status: 'not-started', cstf: true },
  { id: 'hs', title: 'Health, safety & welfare', cat: 'Mandatory', mins: 40, cpd: 1.5, validityMonths: 24, accreditation: ['CPD Certified', 'CSTF'], status: 'not-started', cstf: true },
  { id: 'ig', title: 'Information governance & data security', cat: 'Mandatory', mins: 30, cpd: 1, validityMonths: 12, accreditation: ['CPD Certified', 'CSTF'], status: 'not-started', cstf: true },
  { id: 'conflict', title: 'Conflict resolution', cat: 'Mandatory', mins: 35, cpd: 1, validityMonths: 36, accreditation: ['CPD Certified', 'CSTF'], status: 'not-started', cstf: true },
  { id: 'edi', title: 'Equality, diversity & human rights', cat: 'Mandatory', mins: 40, cpd: 1.5, validityMonths: 36, accreditation: ['CPD Certified', 'CSTF'], status: 'complete', completed: '2026-01-20', cstf: true, careCertStd: 4 },
  { id: 'prevent', title: 'Preventing radicalisation (Prevent)', cat: 'Mandatory', mins: 30, cpd: 1, validityMonths: 24, accreditation: ['CPD Certified', 'CSTF'], status: 'not-started', cstf: true },
  { id: 'food', title: 'Food safety & hygiene', cat: 'Mandatory', mins: 45, cpd: 1.5, validityMonths: 36, accreditation: ['CPD Certified'], status: 'not-started' },
  { id: 'mca', title: 'Mental Capacity Act & DoLS', cat: 'Mandatory', mins: 50, cpd: 2, validityMonths: 36, accreditation: ['CPD Certified', 'Skills for Care aligned'], status: 'not-started' },
  { id: 'firstaid', title: 'Emergency first aid at work', cat: 'Mandatory', mins: 180, cpd: 3, validityMonths: 36, accreditation: ['CPD Certified', 'RoSPA'], status: 'not-started' },
  { id: 'lone', title: 'Lone-worker safety', cat: 'Mandatory', mins: 25, cpd: 1, validityMonths: 12, accreditation: ['CPD Certified'], status: 'not-started' },
  // Statutory
  { id: 'omt', title: 'Oliver McGowan — Learning Disability & Autism (Tier 1)', cat: 'Statutory', mins: 90, cpd: 3, validityMonths: 36, accreditation: ['CPD Certified', 'Skills for Care aligned'], status: 'not-started', careCertStd: 16 },
  // Specialist
  { id: 'dem', title: 'Dementia awareness (Tier 1)', cat: 'Specialist', mins: 55, cpd: 2, validityMonths: 36, accreditation: ['CPD Certified'], status: 'not-started', offline: true },
  { id: 'dia', title: 'Diabetes & insulin awareness', cat: 'Specialist', mins: 35, cpd: 1, validityMonths: 36, accreditation: ['CPD Certified'], status: 'not-started' },
  { id: 'cath', title: 'Catheter & stoma care', cat: 'Specialist', mins: 40, cpd: 1.5, validityMonths: 36, accreditation: ['CPD Certified'], status: 'not-started' },
  { id: 'eol', title: 'End-of-life & palliative care', cat: 'Specialist', mins: 60, cpd: 2, validityMonths: 36, accreditation: ['CPD Certified'], status: 'not-started' },
  { id: 'epi', title: 'Epilepsy & buccal midazolam', cat: 'Specialist', mins: 45, cpd: 1.5, validityMonths: 24, accreditation: ['CPD Certified'], status: 'not-started' },
  { id: 'peg', title: 'PEG / enteral feeding', cat: 'Specialist', mins: 40, cpd: 1.5, validityMonths: 24, accreditation: ['CPD Certified'], status: 'not-started' },
  { id: 'mha', title: 'Mental health awareness', cat: 'Specialist', mins: 60, cpd: 2, validityMonths: 36, accreditation: ['CPD Certified'], status: 'not-started' },
  { id: 'showcase', title: 'Sample: content types', cat: 'Sample', mins: 5, cpd: 0, validityMonths: 12, accreditation: ['Demo'], status: 'not-started' },
]

/** §28 — the just-in-time micro-lesson surfaced for the next client's condition. */
export const JIT_LESSON = { forClient: 'Harold Price', condition: 'End-of-life care', title: 'Comfort at end of life — 5-min refresher', mins: 5, courseId: 'eol' }

/** §28 — skills / competency register: two independent tracks (e-learning completion
 *  + observed sign-off by a senior). A gated skill needs BOTH to be met. */
export const SKILLS = [
  { id: 'sk-med', name: 'Medication administration', gated: 'medication', elearning: 'complete', observed: 'signed-off', signedBy: 'P. Shah (Senior)', signedDate: '12 Feb 2026', expiry: '12 Feb 2027', status: 'valid' },
  { id: 'sk-mh', name: 'Moving & handling', gated: 'moving-handling', elearning: 'complete', observed: 'signed-off', signedBy: 'P. Shah (Senior)', signedDate: '03 Mar 2026', expiry: '03 Mar 2027', status: 'valid' },
  { id: 'sk-cath', name: 'Catheter care', gated: 'catheter', elearning: 'complete', observed: 'pending', signedBy: null, signedDate: null, expiry: null, status: 'pending-signoff' },
  { id: 'sk-peg', name: 'PEG / enteral feeding', gated: 'peg', elearning: 'due', observed: '—', signedBy: null, signedDate: null, expiry: null, status: 'not-held' },
  { id: 'sk-ins', name: 'Insulin administration', gated: 'insulin', elearning: 'complete', observed: 'signed-off', signedBy: 'Registered nurse', signedDate: '20 Jan 2026', expiry: '20 Jul 2026', status: 'expiring' },
]

/** §28 — training records: issued + expiry → status computed by expiryStatus(). */
export const TRAINING_RECORDS = [
  { id: 't-mh', name: 'Moving & handling', issued: '12 Mar 2025', expiry: '2027-03-12' },
  { id: 't-med', name: 'Medication administration', issued: '04 Jan 2025', expiry: '2027-01-04' },
  { id: 't-sg', name: 'Safeguarding adults', issued: '20 Jul 2024', expiry: '2026-07-20' },
  { id: 't-bls', name: 'Basic life support', issued: '02 Aug 2024', expiry: '2026-08-02' },
  { id: 't-ipc', name: 'Infection prevention & control', issued: '30 Nov 2024', expiry: '2026-11-30' },
]

/** §28 — compute valid / expiring / expired from an ISO expiry vs the demo clock. */
export function expiryStatus(expiryIso, warnDays = 60) {
  if (!expiryIso) return 'none'
  const today = new Date(DEMO_TODAY + 'T00:00:00Z')
  const exp = new Date(expiryIso + 'T00:00:00Z')
  const days = Math.round((exp - today) / (24 * 60 * 60 * 1000))
  if (days < 0) return 'expired'
  if (days <= warnDays) return 'expiring'
  return 'valid'
}

/* --------------------------------------------- §29 Staff compliance documents */

/** §29 (AC-29.4/5) — the carer's own compliance documents. The carer can SUBMIT;
 *  the OFFICE verifies — the 'verified' state is office-owned (CQC Reg 19). */
export const STAFF_DOCS = [
  { id: 'd-dbs', name: 'DBS certificate', kind: 'Enhanced DBS', status: 'verified', expiry: '2027-05-01', verifiedBy: 'Office', updated: '01 May 2024' },
  { id: 'd-rtw', name: 'Right to work', kind: 'Passport / share code', status: 'verified', expiry: null, verifiedBy: 'Office', updated: '12 Nov 2023' },
  { id: 'd-mh', name: 'Moving & handling certificate', kind: 'Training certificate', status: 'submitted', expiry: '2027-03-12', verifiedBy: null, updated: 'Today' },
  { id: 'd-ins', name: 'Car insurance (business use)', kind: 'Insurance', status: 'expiring', expiry: '2026-08-15', verifiedBy: 'Office', updated: '15 Aug 2025' },
  { id: 'd-ref', name: 'Professional reference', kind: 'Reference', status: 'missing', expiry: null, verifiedBy: null, updated: null },
]

/** The carer's own HR record — personal, employment, branches, next of kin,
 *  employment history and the periodic checks required by CQC (Reg 19 / Schedule 3)
 *  and the Home Office (right-to-work follow-up checks). Front-end mock. */
export const CARER_PROFILE = {
  employeeId: 'RCL-0473',
  name: 'Aisha Khan',
  dob: '18/03/1992',
  ni: 'QQ 12 34 56 C',
  phone: '07700 900431',
  email: 'aisha.khan@riverside-care.co.uk',
  address: '48 Bridge Road, Riverside, RV3 5PL',
  startDate: '03/11/2023',
  role: 'Care Worker',
  contract: 'Permanent · 36 hrs/week',
  probation: 'Passed · 02/2024',
  notice: '4 weeks',
  lineManager: 'Daniel Roy (Senior Carer)',
  homeBranch: 'Riverside — North',
  branches: ['Riverside — North', 'Riverside — South'], // works across
  allBranches: false,
  nextOfKin: { name: 'Sana Khan', relationship: 'Sister', phone: '07700 900876' },
  // Schedule 3 — full employment history incl. gaps explained.
  employmentHistory: [
    { employer: 'Sunnyfield Care Home', role: 'Care Assistant', period: '06/2019 – 10/2023', note: 'Reference verified' },
    { employer: 'Bright Futures Domiciliary', role: 'Support Worker', period: '09/2017 – 05/2019', note: 'Reference verified' },
    { employer: 'Career break — full-time study (NVQ Health & Social Care)', role: '', period: '01/2017 – 08/2017', note: 'Gap explained' },
  ],
  // Periodic clearances — CQC Reg 19 + Home Office. status: valid | due | overdue.
  checks: [
    { name: 'Enhanced DBS', detail: 'Adults & children · DBS Update Service — auto-checked weekly', status: 'valid', due: 'Renew by 01/05/2027' },
    { name: 'Right to work', detail: 'British citizen · passport verified online', status: 'valid', due: 'No re-check needed' },
    { name: 'References', detail: '2 satisfactory (Schedule 3, prior care roles)', status: 'valid', due: null },
    { name: 'Health & fitness to work', detail: 'Annual self-declaration', status: 'due', due: 'Due 30/09/2026' },
    { name: 'Supervision (1:1)', detail: 'With line manager', status: 'valid', due: 'Next 12/08/2026' },
    { name: 'Annual appraisal', detail: 'Performance & development review', status: 'valid', due: 'Next 03/11/2026' },
  ],
}

/** §28 — the Care Certificate's 16 standards (2025), for the in-course drill-down. */
export const CARE_CERT_STANDARDS = [
  'Understand your role', 'Your personal development', 'Duty of care', 'Equality and diversity',
  'Work in a person-centred way', 'Communication', 'Privacy and dignity', 'Fluids and nutrition',
  'Mental health, dementia & learning disability', 'Safeguarding adults', 'Safeguarding children',
  'Basic life support', 'Health and safety', 'Handling information', 'Infection prevention and control',
  'Learning disability and autism',
]

/** §28 — lesson points + a knowledge-check quiz per course (keyed by course id). */
export const LEARNING_CONTENT = {
  cc: {
    points: ['16 agreed standards for staff new to care (2025 revision).', 'You evidence knowledge, practical skills and a workplace assessment.', 'A senior observes you in practice before sign-off.'],
    blocks: [
      { t: 'text', md: 'The **Care Certificate** is the agreed set of standards that new health and social care workers complete during induction. It sets out the knowledge, skills and behaviours expected before you work unsupervised.' },
      { t: 'keypoints', items: ['16 standards in the 2025 revision', 'You are assessed on knowledge and on practice', 'A workplace assessor observes you before sign-off'] },
      { t: 'definition', term: 'Workplace assessment', meaning: 'A trained assessor watches you carry out real care tasks and confirms you are competent, not just knowledgeable.' },
      { t: 'callout', tone: 'info', title: 'Not a one-off quiz', body: 'The Care Certificate cannot be passed by an online test alone. It combines learning with observed practice over your induction period.' },
      { t: 'resource', label: 'Care Certificate workbook and assessor sign-off record (PDF)' },
      { t: 'standard', text: 'Aligned to all 16 Care Certificate Standards (2025 revision, Skills for Care)' },
    ],
    quiz: [
      { t: 'single', q: 'How many standards are in the 2025 Care Certificate?', options: ['12', '15', '16'], answer: 2 },
      { t: 'single', q: 'The Care Certificate is completed by:', options: ['An online quiz only', 'Knowledge plus a workplace assessment', 'A one-day classroom session'], answer: 1 },
      { t: 'multi', q: 'The Care Certificate assesses (select all that apply):', options: ['Your knowledge', 'Your practical skills', 'An observed workplace assessment', 'Your typing speed'], answers: [0, 1, 2] },
      { t: 'single', q: 'The Care Certificate is aimed at:', options: ['Staff new to health and social care', 'Registered nurses only', 'Office administrators'], answer: 0 },
    ],
  },
  mh: {
    points: ['Assess the person, environment and equipment before every transfer.', 'Never manually lift where a hoist and sling are prescribed.', 'Keep loads close, bend your knees and avoid twisting your spine.'],
    blocks: [
      { t: 'text', md: 'Moving and handling injuries are among the most common in care work. **Assess before you act**: the person, the environment, the equipment, and yourself.' },
      { t: 'video', title: 'Safe transfer technique', duration: '4:12', transcript: 'Demonstrates a hoist transfer from bed to chair with two carers using the prescribed sling.' },
      { t: 'keypoints', items: ['Check the sling and hoist for damage before use', 'Keep a stable base, bend your knees, avoid twisting', 'Ask for a second carer where the plan requires it'] },
      { t: 'callout', tone: 'danger', title: 'Never', body: 'Never manually lift a person where a hoist and sling are prescribed, even if they ask you to.' },
      { t: 'scenario', situation: 'A person who normally uses a hoist asks you to just help them up quickly.', prompt: 'What do you do?', options: [ { label: 'Help them up manually to save time', correct: false, feedback: 'Manual lifting against the plan risks injury to you both.' }, { label: 'Use the prescribed hoist and sling', correct: true, feedback: 'Correct — follow the moving and handling plan every time.' }, { label: 'Ask them to manage alone', correct: false, feedback: 'This is unsafe and neglectful.' } ] },
      { t: 'standard', text: 'Covers Care Certificate Standard 13 (Health and safety)' },
    ],
    quiz: [
      { t: 'single', q: 'A hoist and sling are prescribed. You should:', options: ['Lift manually to save time', 'Use the prescribed hoist and sling', 'Ask them to self-transfer'], answer: 1 },
      { t: 'multi', q: 'Before any transfer you should check (select all that apply):', options: ['The person', 'The environment', 'The equipment', 'The colour of the sling'], answers: [0, 1, 2] },
      { t: 'single', q: 'You may manually lift if the person asks you to.', options: ['True', 'False'], answer: 1 },
      { t: 'single', q: 'Good technique includes:', options: ['Twisting to reach the person', 'A stable base and bent knees', 'Holding the load at arm length'], answer: 1 },
    ],
  },
  sg: {
    points: ['Safeguarding protects adults at risk from abuse and neglect.', 'Raise any concern promptly — you report it, you do not investigate.', 'Record what you saw or were told using the person own words.'],
    blocks: [
      { t: 'text', md: 'Safeguarding means protecting an adult at risk from abuse, neglect and exploitation. **Everyone** has a duty to act on concerns.' },
      { t: 'keypoints', items: ['Types include physical, financial, emotional, sexual, neglect and discriminatory abuse', 'You report a concern — you do not investigate it', 'Record facts in the person own words, not opinion'] },
      { t: 'scenario', situation: 'A person tells you money keeps going missing since a relative moved in, and asks you not to tell anyone.', prompt: 'What do you do?', options: [ { label: 'Agree to keep it secret', correct: false, feedback: 'You cannot promise secrecy where there is a safeguarding risk.' }, { label: 'Reassure the person and raise a safeguarding concern promptly', correct: true, feedback: 'Correct — explain you must pass it on to keep them safe, then report it.' }, { label: 'Confront the relative yourself', correct: false, feedback: 'Investigating or confronting is not your role and can increase risk.' } ] },
      { t: 'callout', tone: 'warning', title: 'Do not delay', body: 'Raise a concern promptly even if you are unsure. Waiting for proof can leave someone at risk.' },
      { t: 'standard', text: 'Covers Care Certificate Standard 10 (Safeguarding adults)' },
    ],
    quiz: [
      { t: 'single', q: 'You suspect financial abuse. You should:', options: ['Investigate it yourself first', 'Raise a safeguarding concern promptly', 'Wait until next week'], answer: 1 },
      { t: 'single', q: 'Your role when you have a concern is to:', options: ['Report it, not investigate it', 'Confront the alleged abuser', 'Keep it to yourself'], answer: 0 },
      { t: 'multi', q: 'Types of abuse include (select all that apply):', options: ['Physical', 'Financial', 'Neglect', 'Discriminatory'], answers: [0, 1, 2, 3] },
      { t: 'single', q: 'A safeguarding concern should be raised:', options: ['Only if you are certain', 'Promptly, even if unsure', 'After collecting proof yourself'], answer: 1 },
    ],
  },
  sgc: {
    points: ['Children may be present in the home even when the client is your service user.', 'Report any concern about a child welfare through the safeguarding lead.', 'Do not promise to keep a child disclosure secret.'],
    blocks: [
      { t: 'text', md: 'You may work with an adult, but **children can be present** in the home. Safeguarding children is everyone responsibility, not only staff who work with children.' },
      { t: 'keypoints', items: ['Watch for signs of harm, neglect or a child at risk', 'Report concerns to the safeguarding lead promptly', 'Never promise to keep a disclosure secret'] },
      { t: 'scenario', situation: 'A child in the home starts to tell you something is wrong at home and asks you to promise not to tell.', prompt: 'What do you do?', options: [ { label: 'Promise to keep it secret so they keep talking', correct: false, feedback: 'You cannot promise secrecy where a child may be at risk.' }, { label: 'Listen calmly, do not promise secrecy, and report it', correct: true, feedback: 'Correct — listen, reassure, avoid leading questions, then report.' }, { label: 'Question them in detail to get the full story', correct: false, feedback: 'Detailed questioning is not your role and can compromise any inquiry.' } ] },
      { t: 'callout', tone: 'info', title: 'Everyone role', body: 'Child safeguarding applies even when your named client is an adult.' },
    ],
    quiz: [
      { t: 'single', q: 'You have a concern about a child in the home. You should:', options: ['Report it to the safeguarding lead', 'Decide it is not your business', 'Wait to see if it happens again'], answer: 0 },
      { t: 'single', q: 'If a child begins to disclose something, you should:', options: ['Promise to keep it secret', 'Listen and not promise secrecy', 'Question them in detail'], answer: 1 },
      { t: 'multi', q: 'Good practice in a child disclosure includes (select all that apply):', options: ['Listen calmly', 'Avoid promising secrecy', 'Record it factually', 'Investigate it yourself'], answers: [0, 1, 2] },
      { t: 'single', q: 'A child welfare concern should be recorded:', options: ['Factually and promptly', 'Only if serious harm is proven', 'Verbally, with no record'], answer: 0 },
    ],
  },
  med: {
    points: ['Follow the six rights before you give any medicine.', 'Sign the MAR immediately after the person takes the dose.', 'Report any error, refusal or reaction straight away.'],
    // Flagship enterprise course — 8 modules + a 12-question summative assessment.
    // See docs/med-course-design.md. Grounded in NICE SC1/NG67, CQC, RPS and Skills for Care.
    outcomes: [
      'Describe the legal framework and your accountability for supporting medicines',
      'Identify the types, forms and routes of medicines and the safe-practice points for each',
      'Apply the six rights and the safe administration procedure',
      'Complete a MAR chart accurately and use the correct codes',
      'Follow PRN, covert and self-administration rules lawfully',
      'Store, order and dispose of medicines safely',
      'Recognise, record and report errors, refusals and adverse reactions',
    ],
    competency: {
      observedBy: 'a senior carer, nurse or registered manager',
      frequency: 'at least annually (NICE NG67/SC1), and after any error, absence or new medicine or route',
      skillId: 'sk-med',
    },
    modules: [
      {
        id: 'm1', title: 'Your role, the law & accountability', mins: 10,
        blocks: [
          { t: 'text', md: 'Care workers support medicines in three ways — **prompting**, **assisting** and **administering**. You may only administer when it is part of your role **and** you have been **trained and assessed as competent**. Training on its own is not enough.' },
          { t: 'definition', term: 'Trained and assessed as competent', meaning: 'You complete the theory (this course) and are then observed administering by a competent assessor who signs you off. Until then you must not administer unsupervised.' },
          { t: 'keypoints', items: ['Human Medicines Regulations 2012', 'Misuse of Drugs Act 1971 (controlled drugs)', 'Mental Capacity Act 2005 (consent and covert administration)', 'Health & Social Care Act 2008 (Regulated Activities) Regulation 12 — safe care', 'Care Act 2014'] },
          { t: 'callout', tone: 'info', title: 'Always gain consent', body: 'An adult with capacity can accept or refuse any medicine. Gain the person’s consent before you support their medicines.' },
        ],
        check: { t: 'single', q: 'You have finished this e-learning but have not yet been observed. Can you administer medicines unsupervised?', options: ['Yes — passing the course is enough', 'No — not until you are assessed as competent and signed off', 'Only if no one else is available'], answer: 1 },
      },
      {
        id: 'm2', title: 'Types & forms of medicines', mins: 8,
        blocks: [
          { t: 'text', md: 'Medicines are legally classified as **POM** (prescription-only), **P** (pharmacy) and **GSL** (general sales list). Some are **controlled drugs (CDs)** and carry extra storage and recording rules.' },
          { t: 'keypoints', items: ['Tablets and capsules', 'Liquids and suspensions', 'Creams and ointments', 'Transdermal patches', 'Eye, ear and nose drops', 'Inhalers', 'Injections', 'Suppositories and enemas'] },
          { t: 'definition', term: 'PRN', meaning: '“pro re nata” — medicine given “as required” (for example pain relief) to an agreed protocol, rather than at fixed times.' },
          { t: 'callout', tone: 'warning', title: 'Time-critical medicines', body: 'Parkinson’s medicines, insulin and some epilepsy medicines must be given within a narrow time window. A late or missed dose can cause serious harm.' },
        ],
        check: { t: 'multi', q: 'Which of these are legal classifications of medicines? (select all that apply)', options: ['POM (prescription-only)', 'P (pharmacy)', 'GSL (general sales list)', 'PRN (as required)'], answers: [0, 1, 2] },
      },
      {
        id: 'm3', title: 'Routes of administration', mins: 8,
        blocks: [
          { t: 'text', md: 'The **route** is how a medicine enters the body. Always give by the **prescribed route only** — never change it.' },
          { t: 'dosdonts', dos: ['Read the label for the correct route', 'Position the person safely and comfortably', 'Watch that oral medicines are actually swallowed'], donts: ['Crush tablets unless a pharmacist or prescriber has agreed', 'Touch the adhesive side of a patch', 'Put drops in the wrong eye or ear'] },
          { t: 'keypoints', items: ['Oral: upright, offer a drink, observe it is taken', 'Patch: rotate the site, remove the old patch, record on a body map', 'Inhaler: check the dose counter, correct technique, rinse the mouth after a steroid inhaler', 'Drops: correct side, do not touch the nozzle', 'PEG / enteral: flush the tube, only if trained', 'Buccal / sublingual: held in the cheek or under the tongue, not swallowed'] },
        ],
        check: { t: 'single', q: 'Can you crush a tablet to make it easier for someone to swallow?', options: ['Yes, whenever it helps', 'Only if a pharmacist or prescriber has agreed it', 'Never, under any circumstances'], answer: 1 },
      },
      {
        id: 'm4', title: 'The six rights & safe administration', mins: 10,
        blocks: [
          { t: 'callout', tone: 'info', title: 'The 6 Rights', body: 'Right person, right medicine, right dose, right route, right time — and the right documentation. Some add the right to refuse.' },
          { t: 'keypoints', items: ['Wash your hands', 'Check the person has not already had the dose', 'Confirm the person’s identity', 'Cross-check the MAR against the label — medicine, dose, route, time', 'Check for allergies', 'Check the expiry date', 'Check any cautionary warnings'] },
          { t: 'scenario', situation: 'The MAR says one tablet at 8am, but the pharmacy label on the box says two.', prompt: 'What do you do?', options: [ { label: 'Give one to match the MAR', correct: false, feedback: 'Do not guess — the two records disagree and must be resolved first.' }, { label: 'Do not give it; stop and check with the pharmacy or your senior', correct: true, feedback: 'Correct — the MAR and the label must match before you give anything.' }, { label: 'Give two to match the label', correct: false, feedback: 'Do not guess — giving the wrong dose can seriously harm.' } ] },
          { t: 'callout', tone: 'warning', title: 'One at a time', body: 'Support one person at a time and keep medicines secure — never leave them unattended.' },
        ],
        check: { t: 'multi', q: 'Which checks must you make before administering? (select all that apply)', options: ['Confirm the person’s identity', 'Cross-check the MAR against the label', 'Check for allergies', 'Check the expiry date'], answers: [0, 1, 2, 3] },
      },
      {
        id: 'm5', title: 'The MAR chart & record-keeping', mins: 8,
        blocks: [
          { t: 'text', md: 'The **MAR** (Medication Administration Record) is the legal record of what was prescribed and what you gave. Sign it **immediately after** the person takes the medicine — never in advance.' },
          { t: 'keypoints', items: ['If a dose is not given, do not leave a gap — enter the correct code (refused, not available, in hospital, asleep, social leave) and explain it', 'Handwritten entries are made by two staff and checked', 'At the end of a round, confirm the MAR is fully completed'] },
          { t: 'definition', term: 'eMAR', meaning: 'An electronic MAR that flags missed or late doses in real time and reduces gaps and transcription errors.' },
          { t: 'callout', tone: 'danger', title: 'A gap is a failure', body: 'A gap on a MAR means no one knows whether the dose was given. Always sign or code every single dose.' },
        ],
        check: { t: 'single', q: 'When should you sign the MAR chart?', options: ['At the start of the round for all doses', 'Immediately after the person has taken the medicine', 'At the end of your shift'], answer: 1 },
      },
      {
        id: 'm6', title: 'PRN, covert & self-administration', mins: 10,
        blocks: [
          { t: 'text', md: '**PRN** (“as required”) medicines are given only when needed. Each one must have a **PRN protocol** stating the reason, the dose, the **maximum in 24 hours** and the **minimum gap** between doses.' },
          { t: 'callout', tone: 'danger', title: 'Check the last dose', body: 'Before a PRN dose, check the MAR for when the last dose was given. Never breach the maximum dose or the minimum interval.' },
          { t: 'definition', term: 'Covert administration', meaning: 'Hiding medicine in food or drink. It is lawful only for a person who lacks capacity for the decision, after a best-interests process involving the pharmacist, prescriber and family, with a documented plan. Never do this to a person with capacity.' },
          { t: 'keypoints', items: ['Self-administration: support independence where a risk assessment shows it is safe; store the person’s medicines securely and record the arrangement', 'Controlled drugs: keep in a locked CD cabinet, record in the CD register, and witness administration in a care home'] },
        ],
        check: { t: 'single', q: 'A person who has capacity refuses a tablet. Can you hide it in their food?', options: ['Yes, to make sure they get it', 'No — covert administration of a person with capacity is unlawful; record the refusal and report it', 'Only if a relative agrees'], answer: 1 },
      },
      {
        id: 'm7', title: 'Storage, ordering & disposal', mins: 6,
        blocks: [
          { t: 'keypoints', items: ['Store medicines securely at the right temperature', 'Fridge items: 2–8 °C, with a daily temperature check', 'Controlled drugs: in a locked CD cabinet'] },
          { t: 'dosdonts', dos: ['Order on a regular monthly cycle', 'Check deliveries against the MAR', 'Record opening dates on drops and liquids'], donts: ['Stockpile medicines', 'Use a medicine past its expiry or “use-by after opening” date', 'Put medicines in general household waste'] },
          { t: 'callout', tone: 'info', title: 'Safe disposal', body: 'Return unwanted or expired medicines to the pharmacy. Controlled drugs are denatured and disposed of through a controlled process. Record what was returned.' },
        ],
        check: { t: 'single', q: 'Medicines that need refrigerating should be kept at:', options: ['Below 0 °C', '2–8 °C, with a daily temperature check', 'Room temperature'], answer: 1 },
      },
      {
        id: 'm8', title: 'Errors, refusals & reporting', mins: 8,
        blocks: [
          { t: 'text', md: 'Everyone makes the occasional mistake. What matters is that you **report it immediately** and honestly so the person can be kept safe. This is the **duty of candour**.' },
          { t: 'keypoints', items: ['Report straight away: a wrong dose, medicine, person or time, or a missed dose', 'Report any suspected reaction or side-effect', 'Seek medical advice (GP / 111 / 999) if the person is unwell', 'Record the facts on the MAR and the incident system'] },
          { t: 'scenario', situation: 'You realise you have given Mr Cole’s tablets to Mrs Ford.', prompt: 'What do you do?', options: [ { label: 'Wait to see if she becomes unwell', correct: false, feedback: 'Never wait — harm can develop and the delay makes it worse.' }, { label: 'Report it immediately to your senior, seek medical advice and record it', correct: true, feedback: 'Correct — report at once, get medical advice, and document it honestly.' }, { label: 'Say nothing as no harm has been done', correct: false, feedback: 'Concealing an error breaches the duty of candour and risks the person’s safety.' } ] },
          { t: 'callout', tone: 'warning', title: 'The right to refuse', body: 'A person with capacity has the right to refuse. Never force or trick them — record the refusal with the reason and report it if refusals continue or the medicine is critical.' },
        ],
        check: { t: 'single', q: 'You have given a medicine to the wrong person. You should:', options: ['Report it immediately and seek medical advice', 'Keep it quiet if there is no obvious harm', 'Fix it at the next visit'], answer: 0 },
      },
    ],
    quiz: [
      { t: 'single', q: 'Before administering, you confirm the person by:', options: ['Room number only', 'Confirming their identity (e.g. name + date of birth)', 'Their word alone'], answer: 1 },
      { t: 'multi', q: 'The six rights of medication include (select all that apply):', options: ['Right person', 'Right dose', 'Right route', 'Right colour'], answers: [0, 1, 2] },
      { t: 'single', q: 'You may administer medicines unsupervised when:', options: ['You have completed the e-learning', 'You are trained AND assessed as competent and signed off', 'A colleague is nearby'], answer: 1 },
      { t: 'multi', q: 'Which are legal classifications of medicines? (select all that apply)', options: ['POM (prescription-only)', 'P (pharmacy)', 'GSL (general sales list)', 'PRN (as required)'], answers: [0, 1, 2] },
      { t: 'single', q: 'You may crush a tablet:', options: ['Whenever it is easier for the person', 'Only if a pharmacist or prescriber has agreed', 'Never'], answer: 1 },
      { t: 'single', q: 'The MAR chart should be signed:', options: ['Before the round starts', 'Immediately after the person takes the dose', 'At the end of the shift'], answer: 1 },
      { t: 'single', q: 'A dose that is not given should be:', options: ['Left as a blank gap', 'Recorded with the correct MAR code and explained', 'Given later to catch up'], answer: 1 },
      { t: 'single', q: 'Covert administration (hiding medicine in food) is:', options: ['Fine if it helps the person', 'Lawful only for a person who lacks capacity, after a best-interests process', 'Decided by the care worker alone'], answer: 1 },
      { t: 'single', q: 'Before giving a PRN dose you must check:', options: ['Nothing — give it when asked', 'The protocol and when the last dose was given', 'Only the expiry date'], answer: 1 },
      { t: 'single', q: 'Fridge medicines should be stored at:', options: ['2–8 °C with a daily temperature check', 'Below freezing', 'Any cool place'], answer: 0 },
      { t: 'single', q: 'A person with capacity refuses their medicine. You should:', options: ['Hide it in their food', 'Record the refusal and report it', 'Insist until they take it'], answer: 1 },
      { t: 'single', q: 'A medication error should be:', options: ['Reported immediately', 'Kept quiet if no harm is seen', 'Corrected at the next visit'], answer: 0 },
    ],
  },
  ipc: {
    points: ['Hand hygiene is the single most effective infection-control measure.', 'Use PPE appropriate to the task and dispose of waste safely.', 'Follow bare-below-the-elbows and clean-as-you-go principles.'],
    blocks: [
      { t: 'text', md: 'Infection prevention and control breaks the **chain of infection**. Good hand hygiene, correct PPE and safe waste disposal protect the people you support and you.' },
      { t: 'video', title: 'Effective hand hygiene', duration: '3:05', transcript: 'Shows the WHO hand-washing technique and the five moments for hand hygiene.' },
      { t: 'dosdonts', dos: ['Wash hands before and after care', 'Choose PPE for the task and risk', 'Dispose of clinical waste correctly'], donts: ['Wear the same gloves between people', 'Rely on gloves instead of hand washing', 'Work with long sleeves or hand jewellery'] },
      { t: 'callout', tone: 'success', title: 'Most effective step', body: 'Hand hygiene is the single most effective way to reduce the spread of infection.' },
      { t: 'standard', text: 'Covers Care Certificate Standard 15 (Infection prevention and control)' },
    ],
    quiz: [
      { t: 'single', q: 'The most effective infection-control step is:', options: ['Wearing gloves all day', 'Hand hygiene', 'Opening windows'], answer: 1 },
      { t: 'single', q: 'You should perform hand hygiene:', options: ['Before and after care', 'Only at the end of a shift', 'Only when hands look dirty'], answer: 0 },
      { t: 'multi', q: 'Good IPC practice includes (select all that apply):', options: ['Bare below the elbows', 'Correct PPE for the task', 'Safe waste disposal', 'Reusing gloves between people'], answers: [0, 1, 2] },
      { t: 'single', q: 'Used gloves should be:', options: ['Washed and reused', 'Removed and disposed of after the task', 'Kept on between clients'], answer: 1 },
    ],
  },
  bls: {
    points: ['Check danger, response, airway and breathing.', 'Call 999 and start CPR at 30 compressions to 2 breaths.', 'Push hard and fast in the centre of the chest, minimising pauses.'],
    blocks: [
      { t: 'text', md: 'Basic life support keeps blood and oxygen moving until help arrives. Early recognition, **calling 999** and effective CPR give the best chance of survival.' },
      { t: 'keypoints', items: ['Check for Danger, then Response, Airway, Breathing', 'Call 999 and send for a defibrillator', 'Give 30 compressions to 2 rescue breaths'] },
      { t: 'video', title: 'Adult CPR sequence', duration: '5:20', transcript: 'Walks through the adult chain of survival, chest-compression depth and rate, and safe AED use.' },
      { t: 'callout', tone: 'warning', title: 'Compression quality', body: 'Push hard and fast in the centre of the chest and minimise pauses — good compressions matter most.' },
      { t: 'standard', text: 'Covers Care Certificate Standard 12 (Basic life support)' },
    ],
    quiz: [
      { t: 'single', q: 'The adult CPR compression-to-breath ratio is:', options: ['15:2', '30:2', '5:1'], answer: 1 },
      { t: 'single', q: 'On finding a collapsed person you first:', options: ['Check for danger and response', 'Start compressions immediately', 'Give a drink'], answer: 0 },
      { t: 'multi', q: 'Effective CPR includes (select all that apply):', options: ['Calling 999 early', 'Pushing hard and fast', 'Minimising pauses', 'Giving a drink'], answers: [0, 1, 2] },
      { t: 'single', q: 'You should call for emergency help:', options: ['Before starting CPR / as soon as possible', 'Only after 10 minutes of CPR', 'Only if a relative agrees'], answer: 0 },
    ],
  },
  fire: {
    points: ['Know your escape routes and assembly points before you need them.', 'On discovering fire, raise the alarm and evacuate — do not tackle large fires.', 'Never prop open or obstruct fire doors.'],
    blocks: [
      { t: 'text', md: 'Fire safety is about prevention and a fast, calm response. Know the **escape routes** and assembly point before you ever need them.' },
      { t: 'dosdonts', dos: ['Raise the alarm on discovering fire', 'Evacuate by the nearest safe route', 'Keep fire doors closed and clear'], donts: ['Tackle a large or spreading fire', 'Prop open or block fire doors', 'Go back in for belongings'] },
      { t: 'callout', tone: 'danger', title: 'Get out, stay out', body: 'Raise the alarm, evacuate, and call 999 — never re-enter a burning building.' },
      { t: 'keypoints', items: ['Tackle a fire only if small and you are trained', 'Go to the assembly point and be accounted for', 'Report obstructed exits and faulty alarms'] },
      { t: 'standard', text: 'Covers Care Certificate Standard 13 (Health and safety)' },
    ],
    quiz: [
      { t: 'single', q: 'On discovering a fire you should first:', options: ['Raise the alarm', 'Collect your belongings', 'Finish the task'], answer: 0 },
      { t: 'single', q: 'Fire doors should be:', options: ['Kept closed and unobstructed', 'Propped open for airflow', 'Locked at all times'], answer: 0 },
      { t: 'multi', q: 'On hearing the alarm you should (select all that apply):', options: ['Leave by the nearest safe route', 'Go to the assembly point', 'Be accounted for', 'Return for belongings'], answers: [0, 1, 2] },
      { t: 'single', q: 'You should tackle a fire only if:', options: ['It is small and you are trained', 'It is spreading fast', 'You feel confident regardless'], answer: 0 },
    ],
  },
  hs: {
    points: ['Report hazards promptly and know how to raise a concern.', 'Follow risk assessments and use equipment as intended.', 'Health and safety is a shared duty between employer and worker.'],
    blocks: [
      { t: 'text', md: 'Under the **Health and Safety at Work Act 1974**, keeping people safe is a shared duty between the employer and every worker.' },
      { t: 'definition', term: 'Risk assessment', meaning: 'Identifying what could cause harm and taking sensible steps to reduce the chance of it happening.' },
      { t: 'keypoints', items: ['Report hazards promptly', 'Follow the risk assessment and safe systems of work', 'Use and check equipment before use'] },
      { t: 'callout', tone: 'info', title: 'Shared duty', body: 'Employers must provide safe systems and equipment; workers must follow them and report risks.' },
      { t: 'standard', text: 'Covers Care Certificate Standard 13 (Health and safety)' },
    ],
    quiz: [
      { t: 'single', q: 'If you spot a hazard you should:', options: ['Report it promptly', 'Ignore it if busy', 'Wait for an inspection'], answer: 0 },
      { t: 'single', q: 'Risk assessments exist to:', options: ['Reduce the chance of harm', 'Slow down the work', 'Satisfy paperwork only'], answer: 0 },
      { t: 'multi', q: 'Health and safety duties include (select all that apply):', options: ['Reporting hazards', 'Following risk assessments', 'Checking equipment', 'Removing guards to work faster'], answers: [0, 1, 2] },
      { t: 'single', q: 'Health and safety is the duty of:', options: ['The employer only', 'Both employer and worker', 'The worker only'], answer: 1 },
    ],
  },
  ig: {
    points: ['Only access records you need for your role and keep them confidential.', 'Report any data breach or lost device immediately.', 'Follow UK GDPR and the Data Protection Act when handling personal data.'],
    blocks: [
      { t: 'text', md: 'Information governance keeps personal and health data safe and lawful. Handle it under **UK GDPR** and the Data Protection Act 2018.' },
      { t: 'keypoints', items: ['Access records only on a need-to-know basis', 'Keep information confidential and secure', 'Report a breach or lost device straight away'] },
      { t: 'scenario', situation: 'You realise you can see the record of a neighbour you know, who is not one of your clients.', prompt: 'What do you do?', options: [ { label: 'Take a quick look out of curiosity', correct: false, feedback: 'Accessing records you do not need for your role is a data breach.' }, { label: 'Do not open it and report the access issue', correct: true, feedback: 'Correct — only access what your role requires and flag the concern.' }, { label: 'Share what you find with the neighbour', correct: false, feedback: 'This breaches confidentiality and data protection law.' } ] },
      { t: 'callout', tone: 'warning', title: 'Report breaches fast', body: 'A lost phone, misdirected email or unauthorised access must be reported immediately.' },
    ],
    quiz: [
      { t: 'single', q: 'You should access a person records:', options: ['Only when needed for your role', 'Whenever you are curious', 'To share with friends'], answer: 0 },
      { t: 'single', q: 'If you lose a work device you should:', options: ['Report it immediately', 'Wait to see if it turns up', 'Say nothing'], answer: 0 },
      { t: 'multi', q: 'Handling personal data lawfully means (select all that apply):', options: ['Need-to-know access', 'Keeping it secure', 'Reporting breaches', 'Posting updates on social media'], answers: [0, 1, 2] },
      { t: 'single', q: 'Personal data must be handled in line with:', options: ['UK GDPR and Data Protection Act', 'No particular rules', 'Only company preference'], answer: 0 },
    ],
  },
  conflict: {
    points: ['Recognise early warning signs and stay calm and non-confrontational.', 'Use active listening and keep a safe distance and clear exit.', 'Report and record incidents so patterns can be managed.'],
    blocks: [
      { t: 'text', md: 'Conflict resolution helps you keep yourself and others safe when tension rises. The aim is to **de-escalate**, not to win.' },
      { t: 'keypoints', items: ['Notice early warning signs of rising tension', 'Stay calm, listen and keep a non-threatening posture', 'Keep a safe distance and a clear exit'] },
      { t: 'scenario', situation: 'A relative becomes loud and angry about a missed visit and steps close to you.', prompt: 'What do you do?', options: [ { label: 'Raise your voice to match theirs', correct: false, feedback: 'Matching aggression escalates the situation.' }, { label: 'Stay calm, listen, keep a safe distance and a clear exit', correct: true, feedback: 'Correct — a calm tone and space help de-escalate safely.' }, { label: 'Block the doorway so they cannot leave', correct: false, feedback: 'Blocking exits increases risk to you both.' } ] },
      { t: 'dosdonts', dos: ['Use active listening', 'Keep a calm tone', 'Report and record the incident'], donts: ['Argue or interrupt', 'Corner the person', 'Ignore the warning signs'] },
    ],
    quiz: [
      { t: 'single', q: 'Facing rising tension you should:', options: ['Stay calm and listen', 'Raise your voice', 'Turn your back'], answer: 0 },
      { t: 'single', q: 'A good de-escalation approach is:', options: ['Active listening and calm tone', 'Arguing your point', 'Ignoring the person'], answer: 0 },
      { t: 'multi', q: 'To stay safe in conflict you should (select all that apply):', options: ['Keep a safe distance', 'Keep a clear exit', 'Stay calm', 'Corner the person'], answers: [0, 1, 2] },
      { t: 'single', q: 'After an incident you should:', options: ['Report and record it', 'Forget about it', 'Handle it privately'], answer: 0 },
    ],
  },
  edi: {
    points: ['Treat every person fairly and challenge discrimination.', 'The Equality Act 2010 lists nine protected characteristics.', 'Person-centred care respects each individual rights and preferences.'],
    blocks: [
      { t: 'text', md: 'Equality, diversity and human rights are the foundation of person-centred care. The **Equality Act 2010** protects people from discrimination.' },
      { t: 'definition', term: 'Protected characteristics', meaning: 'The nine characteristics the Equality Act protects, such as age, disability, race, religion, sex and sexual orientation.' },
      { t: 'keypoints', items: ['Treat every person fairly and as an individual', 'Challenge and report discrimination', 'Respect rights, choices and cultural preferences'] },
      { t: 'callout', tone: 'info', title: 'Equity, not sameness', body: 'Treating people fairly means meeting individual needs — not treating everyone identically.' },
      { t: 'standard', text: 'Covers Care Certificate Standard 4 (Equality and diversity)' },
    ],
    quiz: [
      { t: 'single', q: 'The Equality Act 2010 protects:', options: ['Nine protected characteristics', 'Only age and sex', 'Nobody in care'], answer: 0 },
      { t: 'single', q: 'If you witness discrimination you should:', options: ['Challenge and report it', 'Join in', 'Ignore it'], answer: 0 },
      { t: 'multi', q: 'Protected characteristics include (select all that apply):', options: ['Age', 'Disability', 'Religion or belief', 'Favourite football team'], answers: [0, 1, 2] },
      { t: 'single', q: 'Person-centred care means:', options: ['Respecting individual rights and choices', 'Treating everyone identically', 'Deciding for the person'], answer: 0 },
    ],
  },
  prevent: {
    points: ['Prevent aims to stop people being drawn into terrorism.', 'Report concerns through your safeguarding lead — a Prevent referral is supportive, not punitive.', 'Look for changes in behaviour, not stereotypes.'],
    blocks: [
      { t: 'text', md: 'The **Prevent duty** is part of safeguarding. It aims to stop people being drawn into terrorism and to support those who are vulnerable to radicalisation.' },
      { t: 'callout', tone: 'info', title: 'Supportive, not punitive', body: 'A Prevent referral is a safeguarding measure to offer support — it is not a criminal charge.' },
      { t: 'keypoints', items: ['Base concerns on observed changes in behaviour, not stereotypes', 'Raise concerns through your safeguarding lead', 'Prevent sits alongside, not instead of, safeguarding'] },
      { t: 'scenario', situation: 'A person you support has withdrawn and repeats extreme views encouraging violence, which is a change for them.', prompt: 'What do you do?', options: [ { label: 'Ignore it as none of your business', correct: false, feedback: 'A significant change linked to extremism should be acted on.' }, { label: 'Raise a Prevent concern through your safeguarding lead', correct: true, feedback: 'Correct — report the observed change so support can be offered.' }, { label: 'Confront and argue with them', correct: false, feedback: 'Confrontation is not your role and can increase risk.' } ] },
    ],
    quiz: [
      { t: 'single', q: 'The Prevent duty aims to:', options: ['Stop people being drawn into terrorism', 'Monitor everyday opinions', 'Replace safeguarding'], answer: 0 },
      { t: 'single', q: 'A Prevent concern should be raised via:', options: ['Your safeguarding lead', 'Social media', 'No one'], answer: 0 },
      { t: 'multi', q: 'Good Prevent practice means (select all that apply):', options: ['Basing concerns on observed behaviour change', 'Avoiding stereotypes', 'Treating it as supportive safeguarding', 'Acting on rumour alone'], answers: [0, 1, 2] },
      { t: 'single', q: 'A Prevent referral is:', options: ['Supportive and safeguarding-based', 'A criminal charge', 'Always confidential from managers'], answer: 0 },
    ],
  },
  food: {
    points: ['Wash hands and keep raw and cooked foods separate.', 'Store, chill and reheat food at safe temperatures.', 'Check use-by dates and record fridge temperatures where required.'],
    blocks: [
      { t: 'text', md: 'Good food safety prevents food-borne illness, which can be serious for older or unwell people. Follow the **4 Cs**: cleaning, cooking, chilling and avoiding cross-contamination.' },
      { t: 'keypoints', items: ['Wash hands before handling food', 'Keep raw and cooked foods separate', 'Chill high-risk food and reheat thoroughly'] },
      { t: 'dosdonts', dos: ['Check use-by dates', 'Use separate boards for raw and cooked', 'Record fridge temperatures where required'], donts: ['Store raw and cooked food together', 'Leave high-risk food at room temperature', 'Ignore a use-by date'] },
      { t: 'callout', tone: 'warning', title: 'Use-by dates', body: 'A use-by date is about safety, not quality — do not use food after it.' },
    ],
    quiz: [
      { t: 'single', q: 'To prevent cross-contamination you should:', options: ['Keep raw and cooked foods separate', 'Store them together', 'Use the same board for both'], answer: 0 },
      { t: 'single', q: 'High-risk food should be stored:', options: ['Chilled at a safe temperature', 'At room temperature', 'Anywhere convenient'], answer: 0 },
      { t: 'multi', q: 'The 4 Cs of food safety include (select all that apply):', options: ['Cleaning', 'Cooking', 'Chilling', 'Colouring'], answers: [0, 1, 2] },
      { t: 'single', q: 'A use-by date means:', options: ['Do not eat after this date', 'Best flavour only', 'It can be ignored'], answer: 0 },
    ],
  },
  mca: {
    points: ['Assume capacity unless assessed otherwise, and support decision-making.', 'A person can make an unwise decision and still have capacity.', 'DoLS safeguards those deprived of liberty in their best interests.'],
    blocks: [
      { t: 'text', md: 'The **Mental Capacity Act 2005** protects and empowers people who may lack capacity to make a particular decision. It is built on five statutory principles.' },
      { t: 'keypoints', items: ['Assume capacity unless proven otherwise', 'Support the person to make their own decision', 'An unwise decision does not mean a lack of capacity'] },
      { t: 'definition', term: 'DoLS', meaning: 'Deprivation of Liberty Safeguards — a lawful process to protect a person who must be deprived of their liberty in their best interests.' },
      { t: 'scenario', situation: 'A person with capacity chooses to eat a diet you think is unhealthy.', prompt: 'What do you do?', options: [ { label: 'Overrule them for their own good', correct: false, feedback: 'A person with capacity can make an unwise decision.' }, { label: 'Respect the choice, give information and record it', correct: true, feedback: 'Correct — support the decision and offer information, do not override it.' }, { label: 'Ask the family to decide instead', correct: false, feedback: 'Family cannot override a capacitated person choice.' } ] },
    ],
    quiz: [
      { t: 'single', q: 'The Mental Capacity Act starts by assuming:', options: ['A person has capacity', 'A person lacks capacity', 'Family decides'], answer: 0 },
      { t: 'single', q: 'An unwise decision means:', options: ['The person can still have capacity', 'The person lacks capacity', 'You must overrule them'], answer: 0 },
      { t: 'multi', q: 'Principles of the MCA include (select all that apply):', options: ['Assume capacity', 'Support decision-making', 'Least restrictive option', 'Staff decide what is easiest'], answers: [0, 1, 2] },
      { t: 'single', q: 'DoLS is used when:', options: ['A person is deprived of liberty for their safety', 'Staff are short of time', 'A person refuses a drink'], answer: 0 },
    ],
  },
  firstaid: {
    points: ['Assess the scene for danger before helping.', 'Use the primary survey: danger, response, airway, breathing, circulation.', 'Place an unresponsive breathing casualty in the recovery position.'],
    blocks: [
      { t: 'text', md: 'Emergency first aid buys time until professional help arrives. Always check for **danger** first — you cannot help if you become a casualty too.' },
      { t: 'keypoints', items: ['Primary survey: Danger, Response, Airway, Breathing, Circulation', 'Recovery position for an unresponsive person who is breathing', 'Firm direct pressure for severe bleeding'] },
      { t: 'video', title: 'The primary survey', duration: '4:40', transcript: 'Demonstrates DRABC and placing a breathing casualty into the recovery position.' },
      { t: 'callout', tone: 'warning', title: 'Scene safety first', body: 'Check the scene is safe before you approach — never put yourself at risk.' },
    ],
    quiz: [
      { t: 'single', q: 'Your first action at any incident is to:', options: ['Check for danger', 'Move the casualty', 'Give fluids'], answer: 0 },
      { t: 'single', q: 'An unresponsive person who is breathing should be:', options: ['Placed in the recovery position', 'Left on their back', 'Sat upright'], answer: 0 },
      { t: 'multi', q: 'The primary survey (DRABC) checks (select all that apply):', options: ['Danger and response', 'Airway', 'Breathing and circulation', 'Blood type'], answers: [0, 1, 2] },
      { t: 'single', q: 'For severe external bleeding you should:', options: ['Apply firm direct pressure', 'Wait for the ambulance', 'Give a drink'], answer: 0 },
    ],
  },
  lone: {
    points: ['Share your schedule and check-in arrangements before visits.', 'Trust your instincts — leave if a situation feels unsafe.', 'Keep a charged phone and know your escalation contacts.'],
    blocks: [
      { t: 'text', md: 'Lone working is common in community care. Plan ahead so someone always knows **where you are** and can raise the alarm if you do not check in.' },
      { t: 'keypoints', items: ['Share your schedule and check-in plan', 'Carry a charged phone and know your escalation contacts', 'Trust your instincts and leave if it feels unsafe'] },
      { t: 'scenario', situation: 'You arrive at a visit and the atmosphere feels threatening.', prompt: 'What do you do?', options: [ { label: 'Stay and hope it settles', correct: false, feedback: 'Ignoring your instincts can put you at risk.' }, { label: 'Leave, get to a safe place and report it', correct: true, feedback: 'Correct — your safety comes first; withdraw and report.' }, { label: 'Confront the person to sort it out', correct: false, feedback: 'Confrontation increases the risk to you.' } ] },
      { t: 'callout', tone: 'info', title: 'Check-in matters', body: 'A missed check-in should trigger an agreed escalation, so raise it if the system fails.' },
    ],
    quiz: [
      { t: 'single', q: 'Before a lone visit you should:', options: ['Share your schedule and check-in plan', 'Tell no one', 'Turn off your phone'], answer: 0 },
      { t: 'single', q: 'If a situation feels unsafe you should:', options: ['Leave and report it', 'Stay and hope it improves', 'Confront the person'], answer: 0 },
      { t: 'multi', q: 'Lone-worker safety includes (select all that apply):', options: ['A charged phone', 'A shared schedule', 'An agreed check-in plan', 'Turning off your phone'], answers: [0, 1, 2] },
      { t: 'single', q: 'If you fail to check in, the plan should:', options: ['Trigger an escalation', 'Be ignored', 'Wait until the next day'], answer: 0 },
    ],
  },
  omt: {
    points: ['Reasonable adjustments help people with a learning disability or autism access care.', 'Communicate clearly, allow processing time and avoid assumptions.', 'This training is a statutory expectation under the Health and Care Act 2022.'],
    blocks: [
      { t: 'text', md: 'The **Oliver McGowan Mandatory Training** is the standardised training on learning disability and autism. It is a statutory expectation under the Health and Care Act 2022.' },
      { t: 'definition', term: 'Reasonable adjustments', meaning: 'Changes to the way care is delivered so a person with a learning disability or autism can access it fairly.' },
      { t: 'video', title: 'Communication and processing time', duration: '3:50', transcript: 'Explains why clear language, extra processing time and avoiding assumptions improve care.' },
      { t: 'scenario', situation: 'An autistic person seems overwhelmed by a busy, noisy room and is not responding to your questions.', prompt: 'What do you do?', options: [ { label: 'Repeat questions quickly and louder', correct: false, feedback: 'Adding pressure and noise makes overload worse.' }, { label: 'Reduce noise, use clear language and allow processing time', correct: true, feedback: 'Correct — adjust the environment and communication to the person.' }, { label: 'Assume they understand and carry on', correct: false, feedback: 'Assumptions can lead to missed needs and distress.' } ] },
      { t: 'standard', text: 'Covers Care Certificate Standard 16 (Learning disability and autism)' },
    ],
    quiz: [
      { t: 'single', q: 'Reasonable adjustments are:', options: ['Changes so care is accessible', 'Optional extras', 'Only for physical disability'], answer: 0 },
      { t: 'single', q: 'When communicating you should:', options: ['Allow extra processing time', 'Rush the person', 'Assume they understand'], answer: 0 },
      { t: 'multi', q: 'Supporting an autistic person can include (select all that apply):', options: ['Reducing noise', 'Using clear language', 'Allowing processing time', 'Assuming their needs'], answers: [0, 1, 2] },
      { t: 'single', q: 'The Oliver McGowan training is:', options: ['A statutory expectation for care staff', 'For managers only', 'Entirely optional'], answer: 0 },
    ],
  },
  dem: {
    points: ['Dementia affects memory, communication and orientation.', 'Use short, clear sentences and a calm, familiar environment.', 'Look for the unmet need behind distressed behaviour.'],
    blocks: [
      { t: 'text', md: 'Dementia is a set of symptoms affecting memory, thinking and communication. Person-centred care focuses on the **person**, not the diagnosis.' },
      { t: 'definition', term: 'Unmet need', meaning: 'Distressed behaviour is often a form of communication — pain, fear, hunger or discomfort the person cannot express in words.' },
      { t: 'video', title: 'Communicating in dementia', duration: '4:05', transcript: 'Shows using short sentences, a calm tone and a familiar environment to reduce distress.' },
      { t: 'scenario', situation: 'A person with dementia becomes distressed and insists they must go to collect their children from school.', prompt: 'What do you do?', options: [ { label: 'Correct them firmly that the children are grown up', correct: false, feedback: 'Confronting reality often increases distress.' }, { label: 'Reassure calmly, reduce noise and look for the underlying need', correct: true, feedback: 'Correct — validate the feeling and gently redirect.' }, { label: 'Ignore them until they stop', correct: false, feedback: 'Ignoring distress is neglectful.' } ] },
      { t: 'keypoints', items: ['Use short, clear sentences', 'Keep the environment calm and familiar', 'Look for the unmet need behind the behaviour'] },
    ],
    quiz: [
      { t: 'single', q: 'A person with dementia is distressed. You:', options: ['Correct them firmly', 'Reassure calmly and reduce noise', 'Ignore it'], answer: 1 },
      { t: 'single', q: 'Good communication in dementia uses:', options: ['Short, clear sentences', 'Long, complex instructions', 'A raised voice'], answer: 0 },
      { t: 'multi', q: 'Helpful dementia care includes (select all that apply):', options: ['A calm environment', 'Short, clear sentences', 'Looking for the unmet need', 'A loud, busy room'], answers: [0, 1, 2] },
      { t: 'single', q: 'A helpful environment is:', options: ['Calm and familiar', 'Loud and busy', 'Constantly changing'], answer: 0 },
    ],
  },
  dia: {
    points: ['Recognise hypoglycaemia: shaky, sweaty, confused, hungry.', 'Treat a hypo with fast-acting glucose, then re-check.', 'Only administer insulin if trained, competent and signed off.'],
    blocks: [
      { t: 'text', md: 'Diabetes means blood glucose is not well controlled. The most urgent risk you may see is a **hypo** (low blood glucose), which needs fast treatment.' },
      { t: 'keypoints', items: ['Hypo signs: shaky, sweaty, pale, confused, hungry', 'Treat with fast-acting glucose then re-check', 'Give insulin only if trained, competent and signed off'] },
      { t: 'callout', tone: 'danger', title: 'Treat a hypo fast', body: 'Give fast-acting glucose straight away, then a longer-acting carbohydrate, and re-check the blood glucose.' },
      { t: 'scenario', situation: 'A person becomes shaky, sweaty and confused before lunch.', prompt: 'What do you do?', options: [ { label: 'Wait to see if it passes', correct: false, feedback: 'A hypo can worsen quickly and become dangerous.' }, { label: 'Give fast-acting glucose and re-check the blood glucose', correct: true, feedback: 'Correct — treat the hypo promptly then re-check.' }, { label: 'Give extra insulin', correct: false, feedback: 'Insulin would lower glucose further and is dangerous.' } ] },
    ],
    quiz: [
      { t: 'single', q: 'Signs of a hypo include:', options: ['Sweating and confusion', 'A slow steady pulse', 'Dry skin only'], answer: 0 },
      { t: 'single', q: 'A hypo is treated with:', options: ['Fast-acting glucose', 'A long walk', 'Nothing'], answer: 0 },
      { t: 'multi', q: 'Signs of hypoglycaemia can include (select all that apply):', options: ['Shakiness', 'Sweating', 'Confusion', 'Dry skin only'], answers: [0, 1, 2] },
      { t: 'single', q: 'You should give insulin only if:', options: ['Trained, competent and signed off', 'You feel confident', 'A relative asks'], answer: 0 },
    ],
  },
  cath: {
    points: ['Keep the drainage bag below bladder level to prevent backflow.', 'Report cloudy, offensive or blood-stained urine.', 'Maintain hand hygiene and keep the stoma or catheter site clean.'],
    blocks: [
      { t: 'text', md: 'Good catheter and stoma care prevents infection and keeps the person comfortable and dignified. **Infection control** is central to every step.' },
      { t: 'keypoints', items: ['Keep the drainage bag below bladder level', 'Perform hand hygiene and keep the site clean', 'Report cloudy, offensive or blood-stained urine'] },
      { t: 'dosdonts', dos: ['Wash hands before and after care', 'Keep the bag below the bladder', 'Report signs of infection or a blockage'], donts: ['Raise the bag above the bladder', 'Reuse gloves between tasks', 'Ignore a blocked catheter'] },
      { t: 'callout', tone: 'warning', title: 'Report changes', body: 'Cloudy, smelly or blood-stained urine, or a blocked catheter, must be reported promptly.' },
    ],
    quiz: [
      { t: 'single', q: 'The catheter drainage bag should be kept:', options: ['Above the bladder', 'Below bladder level', 'At chest height'], answer: 1 },
      { t: 'single', q: 'You should report urine that is:', options: ['Cloudy or blood-stained', 'Pale and clear', 'Any amount at all'], answer: 0 },
      { t: 'multi', q: 'Safe catheter care includes (select all that apply):', options: ['Hand hygiene', 'Bag below bladder level', 'Reporting infection signs', 'Reusing gloves'], answers: [0, 1, 2] },
      { t: 'single', q: 'A blocked catheter should be:', options: ['Reported promptly', 'Ignored overnight', 'Flushed by anyone'], answer: 0 },
    ],
  },
  eol: {
    points: ['Prioritise comfort: pain, agitation, secretions and mouth care.', 'Anticipatory (JIC) medicines follow the same safety checks.', 'Respect the person wishes and any advance care plan.'],
    blocks: [
      { t: 'text', md: 'End-of-life and palliative care focus on **comfort and dignity**. Small acts of care — mouth care, positioning, presence — matter enormously.' },
      { t: 'keypoints', items: ['Manage pain, agitation, secretions and provide mouth care', 'Follow the advance care plan and the person wishes', 'Support the family with sensitivity'] },
      { t: 'callout', tone: 'info', title: 'Comfort first', body: 'The goal is comfort and dignity, not aggressive treatment, in line with the person wishes.' },
      { t: 'scenario', situation: 'A dying person has dry lips and appears uncomfortable.', prompt: 'What do you do?', options: [ { label: 'Do nothing as they are not eating', correct: false, feedback: 'Mouth care is an important comfort measure at end of life.' }, { label: 'Provide gentle mouth care and reposition for comfort', correct: true, feedback: 'Correct — comfort measures like mouth care ease distress.' }, { label: 'Insist they drink a full glass of water', correct: false, feedback: 'Forcing fluids can cause distress or choking.' } ] },
    ],
    quiz: [
      { t: 'single', q: 'End-of-life care prioritises:', options: ['Aggressive treatment', 'Comfort and dignity', 'Nothing recorded'], answer: 1 },
      { t: 'single', q: 'Anticipatory (just-in-case) medicines:', options: ['Follow the same safety checks', 'Need no records', 'Can be given by anyone'], answer: 0 },
      { t: 'multi', q: 'End-of-life comfort care includes (select all that apply):', options: ['Mouth care', 'Managing pain', 'Following the advance care plan', 'Ignoring the person wishes'], answers: [0, 1, 2] },
      { t: 'single', q: 'Care at the end of life should follow:', options: ['The person wishes and advance plan', 'Only the family wishes', 'Staff convenience'], answer: 0 },
    ],
  },
  epi: {
    points: ['Recognise seizure types and time the seizure.', 'Protect the person from injury and do not restrain them.', 'Give buccal midazolam only if trained and per the individual protocol.'],
    blocks: [
      { t: 'text', md: 'Epilepsy causes seizures that vary from person to person. **Time the seizure**, protect the person, and follow their individual protocol.' },
      { t: 'keypoints', items: ['Time the seizure and note what happens', 'Protect from injury and cushion the head', 'Do not restrain or put anything in the mouth'] },
      { t: 'callout', tone: 'danger', title: 'Emergency medicine', body: 'Buccal midazolam is given only if you are trained and it follows the person individual protocol.' },
      { t: 'scenario', situation: 'A person has a seizure and falls near a hard table edge.', prompt: 'What do you do?', options: [ { label: 'Hold their arms still to stop the shaking', correct: false, feedback: 'Restraining can cause injury and is not recommended.' }, { label: 'Move hazards away, cushion the head and time the seizure', correct: true, feedback: 'Correct — protect from injury and time it, following the protocol.' }, { label: 'Put something in their mouth', correct: false, feedback: 'Never put anything in the mouth during a seizure.' } ] },
    ],
    quiz: [
      { t: 'single', q: 'During a seizure you should:', options: ['Protect the person from injury', 'Restrain their limbs', 'Put something in their mouth'], answer: 0 },
      { t: 'single', q: 'You should call for emergency help if:', options: ['A seizure lasts longer than the protocol states', 'Any seizure occurs briefly', 'Never'], answer: 0 },
      { t: 'multi', q: 'Safe seizure support includes (select all that apply):', options: ['Timing the seizure', 'Cushioning the head', 'Following the protocol', 'Restraining the person'], answers: [0, 1, 2] },
      { t: 'single', q: 'Buccal midazolam should be given:', options: ['Only if trained and per protocol', 'By anyone present', 'For every seizure'], answer: 0 },
    ],
  },
  peg: {
    points: ['Check tube position and site for redness or leakage before use.', 'Flush the tube as prescribed and keep the person upright during feeding.', 'Only give PEG feeds and medicines if trained and competent.'],
    blocks: [
      { t: 'text', md: 'A PEG delivers feed, fluids and medicines directly into the stomach. Safe practice protects against **aspiration** and infection.' },
      { t: 'keypoints', items: ['Check tube position and the site before use', 'Keep the person sat upright during and after feeding', 'Flush the tube as prescribed'] },
      { t: 'callout', tone: 'warning', title: 'Upright position', body: 'Keeping the person upright during and after a feed reduces the risk of aspiration.' },
      { t: 'dosdonts', dos: ['Check the site for redness or leakage', 'Flush as prescribed', 'Give feeds only if trained and competent'], donts: ['Feed while the person is lying flat', 'Use a tube that looks displaced', 'Improvise without training'] },
    ],
    quiz: [
      { t: 'single', q: 'During a PEG feed the person should be:', options: ['Sat upright', 'Lying flat', 'Turned onto their side'], answer: 0 },
      { t: 'single', q: 'Before a feed you should check:', options: ['Tube position and the site', 'Nothing', 'Only the clock'], answer: 0 },
      { t: 'multi', q: 'Safe PEG feeding includes (select all that apply):', options: ['Checking tube position', 'Sitting the person upright', 'Flushing as prescribed', 'Feeding while lying flat'], answers: [0, 1, 2] },
      { t: 'single', q: 'You should give PEG feeds only if:', options: ['Trained and competent', 'You have watched once', 'Asked by family'], answer: 0 },
    ],
  },
  mha: {
    points: ['Mental ill health is common and recovery is possible.', 'Listen without judgement and know when to escalate risk.', 'Challenge stigma and support the person own coping strategies.'],
    blocks: [
      { t: 'text', md: 'Mental ill health is common and recovery is possible. A calm, **non-judgemental** presence and knowing when to escalate risk make a real difference.' },
      { t: 'keypoints', items: ['Listen without judgement', 'Know when and how to escalate risk of harm', 'Challenge stigma and support coping strategies'] },
      { t: 'scenario', situation: 'A person shares that they feel hopeless and have thought about ending their life.', prompt: 'What do you do?', options: [ { label: 'Change the subject to cheer them up', correct: false, feedback: 'Avoiding the topic can leave the person unsupported and at risk.' }, { label: 'Listen without judgement, take it seriously and escalate appropriately', correct: true, feedback: 'Correct — stay calm, listen, and escalate the risk of harm.' }, { label: 'Tell them not to be silly', correct: false, feedback: 'Dismissing distress increases stigma and risk.' } ] },
      { t: 'callout', tone: 'info', title: 'Reduce stigma', body: 'Treat mental health like physical health — with the same respect and seriousness.' },
    ],
    quiz: [
      { t: 'single', q: 'When someone shares distress you should:', options: ['Listen without judgement', 'Tell them to cheer up', 'Change the subject'], answer: 0 },
      { t: 'single', q: 'If someone is at risk of harm you should:', options: ['Escalate appropriately', 'Keep it to yourself', 'Wait a week'], answer: 0 },
      { t: 'multi', q: 'Supporting mental health includes (select all that apply):', options: ['Listening without judgement', 'Escalating risk of harm', 'Challenging stigma', 'Avoiding the person'], answers: [0, 1, 2] },
      { t: 'single', q: 'Mental ill health is:', options: ['Common, and recovery is possible', 'Always permanent', 'A sign of weakness'], answer: 0 },
    ],
  },
  showcase: {
    points: ['This sample course demonstrates every content block and question type the learning centre supports.', 'Open it to preview the whole palette in one place.'],
    blocks: [
      { t: 'text', md: 'This is a **text** block. It supports **bold** emphasis and bullet lists:\n- First bullet point\n- Second bullet point\n- Third bullet point' },
      { t: 'video', title: 'Video block (simulated player)', duration: '2:30', transcript: 'A video block shows a play button, a duration and a transcript toggle like this one. No real media file is used in the prototype.' },
      { t: 'callout', tone: 'info', title: 'Callout — info', body: 'A callout highlights an important note. It comes in four tones: info, warning, danger and success.' },
      { t: 'callout', tone: 'danger', title: 'Callout — danger', body: 'Use the danger tone for a safety-critical warning the carer must not miss.' },
      { t: 'keypoints', items: ['Key points list the must-know takeaways', 'Each point has a tick', 'Keep them short and scannable'] },
      { t: 'scenario', situation: 'A scenario presents a realistic situation and asks the learner to choose.', prompt: 'Which response is correct?', options: [{ label: 'An incorrect choice', correct: false, feedback: 'Incorrect choices show red feedback explaining why.' }, { label: 'The correct choice', correct: true, feedback: 'Correct choices show green feedback confirming why.' }, { label: 'Another incorrect choice', correct: false, feedback: 'The learner can tap each option to see its feedback.' }] },
      { t: 'dosdonts', dos: ['Show good practice on the left', 'Keep each item to a phrase'], donts: ['Put poor practice on the right', 'Do not write long paragraphs'] },
      { t: 'definition', term: 'Definition block', meaning: 'a glossary term paired with a plain-language meaning.' },
      { t: 'resource', label: 'Downloadable resource — job aid (PDF)' },
      { t: 'standard', text: 'Covers Care Certificate Standard 2 (Your personal development)' },
      { t: 'image', caption: 'Image / diagram block — a placeholder for an illustration or chart.' },
    ],
    quiz: [
      { t: 'single', q: 'A single-choice question has:', options: ['Exactly one correct answer', 'No correct answer', 'A free-text box'], answer: 0 },
      { t: 'multi', q: 'A multi-select question lets you (select all that apply):', options: ['Choose several options', 'Score by matching the whole set', 'Choose only one option', 'Write an essay'], answers: [0, 1] },
      { t: 'single', q: 'A true/false question is a two-option single-choice question.', options: ['True', 'False'], answer: 0 },
    ],
  },
}

/** §28 — completing a mandatory course renews the matching training record. */
export const COURSE_TO_RECORD = { mh: 't-mh', sg: 't-sg', med: 't-med', ipc: 't-ipc', bls: 't-bls' }

/** §28 — a renewed certificate's expiry = demo clock + N months. */
export function renewalExpiry(months = 12) {
  const d = new Date(DEMO_TODAY + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

/** §28 — expiry ISO = a completion date + N months. */
export function courseExpiry(completedIso, months) {
  const d = new Date(completedIso + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

/** §28 — refresh status for a completed course: 'valid' | 'expiring' | 'expired' | null. */
export function courseRefreshStatus(c) {
  if (c.status !== 'complete' || !c.completed || !c.validityMonths) return null
  return expiryStatus(courseExpiry(c.completed, c.validityMonths))
}

/** §28 — two-track wiring: a completed course satisfies the e-learning track of a mapped skill. */
export const SKILL_TO_COURSE = { 'sk-med': 'med', 'sk-mh': 'mh', 'sk-cath': 'cath', 'sk-peg': 'peg', 'sk-ins': 'dia' }

/** §28 JIT — client-condition keyword → recommended course id + display label. */
const JIT_RULES = [
  { re: /end.?of.?life|palliat/i, course: 'eol', label: 'End-of-life care' },
  { re: /diabet/i, course: 'dia', label: 'Diabetes' },
  { re: /cathet|stoma/i, course: 'cath', label: 'Catheter & stoma care' },
  { re: /dementia/i, course: 'dem', label: 'Dementia' },
  { re: /epilep/i, course: 'epi', label: 'Epilepsy' },
  { re: /peg|enteral/i, course: 'peg', label: 'PEG feeding' },
]

/** §28 JIT — the just-in-time micro-lesson recommendation for a service user, or null.
 *  Scans the whole SU record (flags + condition sections) for a condition keyword. */
export function jitCourseForSU(su) {
  if (!su) return null
  const hay = JSON.stringify(su)
  for (const rule of JIT_RULES) {
    if (rule.re.test(hay)) {
      const course = LEARNING_COURSES.find((c) => c.id === rule.course)
      if (course) return { courseId: course.id, course, condition: rule.label, mins: course.mins }
    }
  }
  return null
}

/**
 * Inline task definitions for non-Mary visits (Mary's come from her real
 * service-user plan). Each entry references a master template for its schema.
 */
export const INLINE_TASKS = {
  'v-doris-am': [
    { tpl: 'med-morning-prompt', instr: 'Prompt morning medication. Record on eMAR.' },
    { tpl: 'mob-hoist', instr: 'Two-carer hoist transfer bed → chair with the prescribed sling.' },
    { tpl: 'con-catheter', instr: 'Check and empty catheter bag; record output.' },
    { tpl: 'skn-pressure-areas', instr: 'Check sacrum and heels; body map any concern.' },
  ],
  'v-doris-lunch': [
    { tpl: 'nut-lunch', instr: 'Soft diet. Record amount eaten.' },
    { tpl: 'hyd-offer-drink', instr: 'Offer drink; record ml.' },
  ],
  'v-george-am': [
    { tpl: 'med-morning-prompt', instr: 'Prompt inhalers + morning medication.' },
    { tpl: 'pc-morning-wash', instr: 'Support with wash and dressing; encourage independence.' },
    { tpl: 'obs-bp', instr: 'Record blood pressure and pulse.' },
  ],
  'v-george-tea': [
    { tpl: 'obs-spo2', instr: 'Record SpO₂ — COPD monitoring.' },
    { tpl: 'nut-lunch', instr: 'Prepare evening meal; record intake.' },
  ],
}

/* -------------------------------------------------------------- eMAR / MAR */
export const MED_OUTCOMES = ['Given', 'Self-administered', 'Refused', 'Not available', 'Withheld', 'Partially taken', 'Not observed']
export const MED_OUTCOME_STATUS = {
  Given: 'completed', 'Self-administered': 'completed', Refused: 'refused',
  'Not available': 'unable', Withheld: 'unable', 'Partially taken': 'partial', 'Not observed': 'partial',
}

/** MAR chart per service user. group = when it is due for the current visit. */
export const MED_SCHEDULE = {
  'su-mary': [
    { id: 'm-metformin', name: 'Metformin', dose: '500 mg', form: 'Tablet', route: 'Oral', due: 'Morning', group: 'Scheduled', instr: 'Take with breakfast.' },
    { id: 'm-amlodipine', name: 'Amlodipine', dose: '5 mg', form: 'Tablet', route: 'Oral', due: 'Morning', group: 'Scheduled' },
    { id: 'm-lantus', name: 'Insulin glargine (Lantus)', dose: '12 units', form: 'Injection', route: 'Subcut', due: 'Bedtime', group: 'Scheduled', timeCritical: true, instr: 'Rotate injection site.' },
    { id: 'm-donepezil', name: 'Donepezil', dose: '10 mg', form: 'Tablet', route: 'Oral', due: 'Bedtime', group: 'Scheduled', covert: true, instr: 'Covert — per authorised covert plan only.' },
    { id: 'm-paracetamol', name: 'Paracetamol', dose: '1 g', form: 'Tablet', route: 'Oral', due: 'PRN', group: 'PRN', prnReason: 'Pain', prnMax: 'Max 4 g in 24h', instr: 'For pain. Record effectiveness.' },
    { id: 'm-amoxicillin', name: 'Amoxicillin', dose: '500 mg', form: 'Capsule', route: 'Oral', due: 'PRN', group: 'PRN', prnReason: 'Infection', relatedAllergy: 'Penicillin', instr: 'PRN — check allergy status first.' },
    { id: 'm-oramorph', name: 'Oramorph', dose: '2.5 mg', form: 'Liquid', route: 'Oral', due: 'PRN', group: 'PRN', controlled: true, prnReason: 'Breakthrough pain', instr: 'Controlled drug — witness & count required.' },
  ],
  'su-doris': [
    { id: 'd-furosemide', name: 'Furosemide', dose: '40 mg', form: 'Tablet', route: 'Oral', due: 'Morning', group: 'Scheduled', instr: 'Diuretic — take in the morning.' },
    { id: 'd-lansoprazole', name: 'Lansoprazole', dose: '30 mg', form: 'Capsule', route: 'Oral', due: 'Morning', group: 'Scheduled' },
    { id: 'd-senna', name: 'Senna', dose: '15 mg', form: 'Tablet', route: 'Oral', due: 'PRN', group: 'PRN', prnReason: 'Constipation' },
  ],
  'su-george': [
    { id: 'g-salbutamol', name: 'Salbutamol inhaler', dose: '2 puffs', form: 'Inhaler', route: 'Inhaled', due: 'Morning', group: 'Scheduled', instr: 'Use spacer.' },
    { id: 'g-seretide', name: 'Seretide inhaler', dose: '2 puffs', form: 'Inhaler', route: 'Inhaled', due: 'Morning', group: 'Scheduled' },
    { id: 'g-prednisolone', name: 'Prednisolone', dose: '30 mg', form: 'Tablet', route: 'Oral', due: 'PRN', group: 'PRN', prnReason: 'COPD flare', timeCritical: true },
  ],
  // §19b — palliative / anticipatory (just-in-case) medicines
  'su-harold': [
    { id: 'h-morphine', name: 'Morphine sulfate (anticipatory)', dose: '2.5 mg', form: 'Injection', route: 'Subcut', due: 'PRN', group: 'PRN', controlled: true, anticipatory: true, prnReason: 'Pain / breathlessness', instr: 'Anticipatory — CD, witness & count.' },
    { id: 'h-midazolam', name: 'Midazolam (anticipatory)', dose: '2.5 mg', form: 'Injection', route: 'Subcut', due: 'PRN', group: 'PRN', controlled: true, anticipatory: true, prnReason: 'Agitation / restlessness', instr: 'Anticipatory — CD.' },
    { id: 'h-levomepromazine', name: 'Levomepromazine (anticipatory)', dose: '2.5 mg', form: 'Injection', route: 'Subcut', due: 'PRN', group: 'PRN', anticipatory: true, prnReason: 'Nausea' },
    { id: 'h-hyoscine', name: 'Hyoscine butylbromide (anticipatory)', dose: '20 mg', form: 'Injection', route: 'Subcut', due: 'PRN', group: 'PRN', anticipatory: true, prnReason: 'Respiratory secretions' },
  ],
}

export function medsForVisit(suId, visit) {
  const all = MED_SCHEDULE[suId] || []
  return {
    scheduled: all.filter((m) => m.group === 'Scheduled' && (m.due === visit || m.due === 'Any')),
    prn: all.filter((m) => m.group === 'PRN'),
  }
}

/* ---------------------------------------------------------- Observations */
/**
 * Observation catalogue. Fields drive a schema-rendered form; normalMin/Max,
 * escalateAtGte and abnormalValues drive automatic normal/abnormal flagging.
 */
export const OBSERVATION_GROUPS = ['Vital signs', 'Intake & output', 'Wellbeing', 'Skin & mobility', 'Other']

/** Wound-bed tissue types (shared by the skin observation + wound tracker). */
export const WOUND_TISSUE = ['Granulation', 'Slough', 'Necrotic', 'Epithelialising', 'Non-blanching redness']

export const OBSERVATION_TYPES = [
  { id: 'temperature', name: 'Temperature', icon: 'thermometer', group: 'Vital signs',
    fields: [{ key: 'value', label: 'Temperature', type: 'number', unit: '°C', required: true, min: 30, max: 44, step: 0.1, normalMin: 36.1, normalMax: 37.8 }, { key: 'note', label: 'Comment', type: 'textarea' }] },
  { id: 'pulse', name: 'Pulse', icon: 'heart-pulse', group: 'Vital signs',
    fields: [{ key: 'value', label: 'Pulse', type: 'number', unit: 'bpm', required: true, min: 20, max: 220, normalMin: 50, normalMax: 100 }, { key: 'regular', label: 'Regular rhythm?', type: 'boolean' }] },
  { id: 'respirations', name: 'Respiratory rate', icon: 'wind', group: 'Vital signs',
    fields: [{ key: 'value', label: 'Breaths per minute', type: 'number', unit: '/min', required: true, min: 4, max: 60, normalMin: 12, normalMax: 20 }] },
  { id: 'bp', name: 'Blood pressure', icon: 'gauge', group: 'Vital signs',
    fields: [{ key: 'systolic', label: 'Systolic', type: 'number', unit: 'mmHg', required: true, min: 50, max: 260, normalMin: 90, normalMax: 140 }, { key: 'diastolic', label: 'Diastolic', type: 'number', unit: 'mmHg', required: true, min: 30, max: 150, normalMin: 50, normalMax: 90 }] },
  { id: 'spo2', name: 'Oxygen saturation', icon: 'activity', group: 'Vital signs',
    fields: [{ key: 'value', label: 'SpO₂', type: 'number', unit: '%', required: true, min: 50, max: 100, normalMin: 94, normalMax: 100 }, { key: 'onOxygen', label: 'On oxygen?', type: 'boolean' }] },
  { id: 'glucose', name: 'Blood glucose', icon: 'droplet', group: 'Vital signs',
    fields: [{ key: 'value', label: 'Blood glucose', type: 'number', unit: 'mmol/L', required: true, min: 1, max: 40, step: 0.1, normalMin: 4, normalMax: 9 }, { key: 'relation', label: 'Meal relation', type: 'select', options: ['Before meal', 'After meal', 'Fasting', 'Random'] }] },
  { id: 'news2', name: 'NEWS2 score', icon: 'clipboard-list', group: 'Vital signs',
    fields: [{ key: 'value', label: 'NEWS2 total', type: 'score', min: 0, max: 12, required: true, escalateAtGte: 5 }, { key: 'note', label: 'Action taken', type: 'textarea' }] },
  { id: 'restore2', name: 'Deterioration · soft signs', icon: 'alert', group: 'Vital signs',
    fields: [
      { key: 'signs', label: 'New soft signs (RESTORE2)', type: 'checklist', abnormalIfAny: true,
        options: ['More breathless', 'New / worse confusion', 'More drowsy / less responsive', 'Eating / drinking less', 'New or worse pain', 'More agitated or withdrawn', 'Pale / mottled / clammy', 'Passing less urine', 'Just “not right”'] },
      { key: 'escalated', label: 'Escalated to', type: 'select', options: ['Not yet — recording only', 'Office / manager', 'GP', 'NHS 111', '999 / ambulance'] },
      { key: 'sbard', label: 'SBARD handover — read this to them', type: 'textarea', placeholder: 'Situation: who you are, the person, the concern. Background: conditions, DNACPR/ReSPECT. Assessment: soft signs / NEWS2 / obs. Recommendation: what you think is needed. Decision: what was agreed.' },
      { key: 'outcome', label: 'Advice / outcome recorded', type: 'textarea' }] },
  { id: 'postfall', name: 'Post-fall checks', icon: 'shield', group: 'Other',
    fields: [
      { key: 'hitHead', label: 'Hit head / head injury?', type: 'boolean', abnormalValues: ['true'] },
      { key: 'loc', label: 'Any loss of consciousness?', type: 'boolean', abnormalValues: ['true'] },
      { key: 'anticoag', label: 'On blood thinners (anticoagulant)?', type: 'boolean' },
      { key: 'weightBear', label: 'Able to weight-bear?', type: 'select', required: true, options: ['Yes', 'No', 'Not attempted'], abnormalValues: ['No'] },
      { key: 'injury', label: 'Visible injury', type: 'select', required: true, options: ['None', 'Bruise / graze', 'Bleeding', 'Deformity / suspected fracture', 'Head / facial'], abnormalValues: ['Bleeding', 'Deformity / suspected fracture', 'Head / facial'] },
      { key: 'bodymap', label: 'Mark injury on the body map', type: 'bodymap' },
      { key: 'checks', label: 'Observations completed', type: 'checklist', options: ['NEWS2 / vital signs', 'Neuro / pupils', 'Pain assessment', 'Skin check'] },
      { key: 'escalated', label: 'Escalated to', type: 'select', required: true, options: ['Not yet', 'Office / manager', 'GP', 'NHS 111', '999 / ambulance'] },
      { key: 'note', label: 'How the fall happened & action taken', type: 'textarea' }] },
  { id: 'oral', name: 'Oral / mouth care', icon: 'smile', group: 'Other',
    fields: [
      { key: 'care', label: 'Care given', type: 'checklist', options: ['Teeth brushed', 'Dentures cleaned', 'Mouth rinse', 'Lips moisturised', 'Mouth checked'] },
      { key: 'condition', label: 'Mouth condition', type: 'select', required: true, options: ['Healthy', 'Dry', 'Coated / debris', 'Sore / red', 'Ulcer', 'Signs of thrush', 'Bleeding gums'], abnormalValues: ['Sore / red', 'Ulcer', 'Signs of thrush', 'Bleeding gums'] },
      { key: 'note', label: 'Note', type: 'textarea' }] },
  { id: 'pain', name: 'Pain score', icon: 'frown', group: 'Wellbeing',
    fields: [{ key: 'value', label: 'Pain (0–10)', type: 'score', min: 0, max: 10, required: true, escalateAtGte: 7 }, { key: 'site', label: 'Site', type: 'text' }, { key: 'note', label: 'Comment', type: 'textarea' }] },
  { id: 'mood', name: 'Mood & wellbeing', icon: 'smile', group: 'Wellbeing',
    fields: [{ key: 'mood', label: 'Overall mood', type: 'moodscale', required: true, options: ['Bright / happy', 'Content', 'Settled', 'Low / tearful', 'Very low / distressed'], abnormalValues: ['Low / tearful', 'Very low / distressed'] }, { key: 'anxiety', label: 'Signs of anxiety or distress?', type: 'boolean', abnormalValues: ['true'] }, { key: 'note', label: 'What was noticed / any triggers', type: 'textarea' }] },
  { id: 'sleep', name: 'Sleep', icon: 'moon', group: 'Wellbeing',
    fields: [{ key: 'quality', label: 'Sleep quality', type: 'select', required: true, options: ['Good', 'Fair', 'Poor', 'Awake most of night'], abnormalValues: ['Poor', 'Awake most of night'] }, { key: 'hours', label: 'Approx hours', type: 'number', unit: 'h', min: 0, max: 24 }] },
  { id: 'behaviour', name: 'Behaviour (BPSD)', icon: 'brain', group: 'Wellbeing',
    fields: [{ key: 'behaviour', label: 'Observed behaviour', type: 'select', required: true, options: ['Settled', 'Agitated', 'Aggressive', 'Withdrawn', 'Wandering', 'Sundowning'], abnormalValues: ['Aggressive', 'Wandering'] }, { key: 'trigger', label: 'Trigger', type: 'text' }, { key: 'action', label: 'De-escalation used', type: 'textarea' }] },
  { id: 'seizure', name: 'Seizure', icon: 'zap', group: 'Other',
    fields: [{ key: 'type', label: 'Type', type: 'select', required: true, options: ['Tonic-clonic', 'Absence', 'Focal', 'Other'], abnormalValues: ['Tonic-clonic', 'Absence', 'Focal', 'Other'] }, { key: 'duration', label: 'Duration', type: 'number', unit: 'sec', required: true }, { key: 'note', label: 'Description & recovery', type: 'textarea', required: true }] },
  { id: 'fluid', name: 'Fluid intake', icon: 'glass-water', group: 'Intake & output',
    fields: [{ key: 'drinkType', label: 'Drink', type: 'select', required: true, options: ['Water', 'Tea', 'Coffee', 'Juice', 'Squash', 'Milk', 'Thickened'] }, { key: 'amount', label: 'Amount', type: 'number', unit: 'ml', required: true, min: 0, max: 1000 }] },
  { id: 'food', name: 'Food / nutrition', icon: 'soup', group: 'Intake & output',
    fields: [{ key: 'meal', label: 'Meal', type: 'text', required: true }, { key: 'eaten', label: 'Amount eaten', type: 'select', required: true, options: ['All', 'Most', 'Half', 'Little', 'None'], abnormalValues: ['Little', 'None'] }] },
  { id: 'bowel', name: 'Bowels (Bristol)', icon: 'toilet', group: 'Intake & output',
    fields: [{ key: 'type', label: 'Bristol type (1–7)', type: 'score', min: 1, max: 7, required: true, abnormalValues: ['1', '2', '6', '7'] }, { key: 'note', label: 'Comment', type: 'textarea' }] },
  { id: 'output', name: 'Urine / catheter output', icon: 'droplet', group: 'Intake & output',
    fields: [{ key: 'amount', label: 'Output', type: 'number', unit: 'ml', required: true, min: 0, max: 3000 }, { key: 'colour', label: 'Colour', type: 'select', options: ['Pale', 'Normal', 'Dark', 'Cloudy', 'Blood-stained'], abnormalValues: ['Dark', 'Cloudy', 'Blood-stained'] }] },
  { id: 'continence', name: 'Continence care', icon: 'toilet', group: 'Intake & output',
    fields: [
      { key: 'care', label: 'Care given', type: 'checklist', options: ['Toileted', 'Pad checked', 'Pad changed', 'Catheter bag emptied', 'Catheter care given'] },
      { key: 'status', label: 'Continence status', type: 'select', required: true, options: ['Continent / dry', 'Damp', 'Wet', 'Soiled', 'Catheter bypassing / leaking'], abnormalValues: ['Catheter bypassing / leaking'] },
      { key: 'note', label: 'Comment', type: 'textarea' }] },
  { id: 'reposition', name: 'Repositioning', icon: 'rotate-cw', group: 'Skin & mobility',
    fields: [{ key: 'position', label: 'Repositioned to', type: 'select', required: true, options: ['Back', 'Left side', 'Right side', 'Sat up', 'Chair'] }, { key: 'skin', label: 'Skin on inspection', type: 'select', options: ['Intact', 'Red', 'Broken'], abnormalValues: ['Red', 'Broken'] }] },
  { id: 'skin', name: 'Skin / body map', icon: 'person-standing', group: 'Skin & mobility',
    fields: [{ key: 'condition', label: 'Skin condition', type: 'select', required: true, options: ['Intact / healthy', 'Redness', 'Broken skin', 'Bruising', 'Swelling'], abnormalValues: ['Redness', 'Broken skin', 'Bruising', 'Swelling'] }, { key: 'bodymap', label: 'Mark area', type: 'bodymap' }, { key: 'note', label: 'Description', type: 'textarea' }, { key: 'photo', label: 'Photo (if consented)', type: 'photo' },
      // Wound-healing capture: link to a tracked wound → feeds its Monitoring timeline.
      { key: 'woundId', label: 'Update a tracked wound', type: 'woundpick' },
      { key: 'length', label: 'Wound length', type: 'number', unit: 'mm', min: 0, max: 500, dependsOn: 'woundId' },
      { key: 'width', label: 'Wound width', type: 'number', unit: 'mm', min: 0, max: 500, dependsOn: 'woundId' },
      { key: 'tissue', label: 'Wound bed tissue', type: 'select', options: WOUND_TISSUE, dependsOn: 'woundId' }] },
  { id: 'weight', name: 'Weight', icon: 'weight', group: 'Other',
    fields: [{ key: 'value', label: 'Weight', type: 'number', unit: 'kg', required: true, min: 20, max: 200, step: 0.1 }] },
]

export function observationType(id) {
  return OBSERVATION_TYPES.find((o) => o.id === id)
}

/** Compute normal / abnormal from an observation type + captured values. */
export function evaluateObsFlag(type, values) {
  for (const f of type.fields) {
    const v = values[f.key]
    if (v === '' || v === null || v === undefined) continue
    if (f.type === 'number' && (f.normalMin != null || f.normalMax != null)) {
      const num = Number(v)
      if ((f.normalMin != null && num < f.normalMin) || (f.normalMax != null && num > f.normalMax)) return 'abnormal'
    }
    if (f.type === 'score' && f.escalateAtGte != null && Number(v) >= f.escalateAtGte) return 'abnormal'
    if (f.type === 'checklist' && f.abnormalIfAny && Array.isArray(v) && v.length) return 'abnormal'
    if (f.abnormalValues && f.abnormalValues.includes(String(v))) return 'abnormal'
  }
  return 'normal'
}

/* ------------------------------------------------------------ Incidents */
export const INCIDENT_TYPES = [
  { id: 'fall', name: 'Fall / slip', icon: 'footprints', riddor: true, safeguarding: false },
  { id: 'injury', name: 'Injury / skin tear', icon: 'activity', riddor: true, safeguarding: false },
  { id: 'med-error', name: 'Medication error', icon: 'pill', riddor: false, safeguarding: true },
  { id: 'near-miss', name: 'Near miss', icon: 'alert', riddor: false, safeguarding: false },
  { id: 'choking', name: 'Choking', icon: 'alert', riddor: true, safeguarding: false },
  { id: 'aggression', name: 'Aggression / behaviour', icon: 'brain', riddor: false, safeguarding: true },
  { id: 'safeguarding', name: 'Safeguarding concern', icon: 'shield', riddor: false, safeguarding: true },
  { id: 'pressure', name: 'Pressure damage', icon: 'activity', riddor: false, safeguarding: true },
  { id: 'missing', name: 'Missing person', icon: 'map-pin', riddor: false, safeguarding: true },
  { id: 'property', name: 'Property / equipment', icon: 'home', riddor: false, safeguarding: false },
  { id: 'death', name: 'Death', icon: 'heart', riddor: true, safeguarding: true },
  { id: 'other', name: 'Other', icon: 'flag', riddor: false, safeguarding: false },
]
export const INCIDENT_SEVERITY = ['No harm', 'Low', 'Moderate', 'Severe', 'Death']
export const INFORMED_OPTIONS = ['Care coordinator', 'On-call manager', 'Registered manager', 'Family / NOK', 'GP', 'Emergency services (999)', 'Paramedics', 'Local authority']

export function incidentType(id) {
  return INCIDENT_TYPES.find((i) => i.id === id)
}

export const BODY_REGIONS = [
  { r: 'Head', x: 60, y: 24 }, { r: 'Chest', x: 60, y: 62 }, { r: 'Abdomen', x: 60, y: 90 },
  { r: 'L arm', x: 32, y: 72 }, { r: 'R arm', x: 88, y: 72 }, { r: 'Sacrum', x: 60, y: 104 },
  { r: 'L hip', x: 47, y: 100 }, { r: 'R hip', x: 73, y: 100 }, { r: 'L leg', x: 52, y: 150 },
  { r: 'R leg', x: 68, y: 150 }, { r: 'L heel', x: 52, y: 190 }, { r: 'R heel', x: 68, y: 190 },
]

/* ---------------------------------------------------------- Care context (P2) */
export const CARE_PLANS = {
  'su-mary': {
    review: '2026-08-01', version: 'v4', changedSince: 'Hydration target increased to 1500ml/day and afternoon reassurance routine added (15/06/2026).',
    sections: [
      { domain: 'Personal Hygiene', icon: 'bath', goal: 'Maintain dignity and skin health with daily support.', how: 'Prefers to wash at the sink and choose her own clothes. Female carer for personal care.', actions: ['Support morning wash & dressing', 'Oral care morning & night', 'Encourage independence with buttons'], risks: ['Falls risk'] },
      { domain: 'Nutrition & Hydration', icon: 'droplet', goal: 'Maintain hydration ≥1500ml/day and adequate nutrition.', how: 'Tea with milk (no sugar) in the morning, orange squash at lunch. Soft diet.', actions: ['Offer drink every visit, record ml', 'Prepare lunch, record intake', 'Leave drink within reach at bedtime'], risks: ['Dehydration risk', 'Malnutrition risk'] },
      { domain: 'Medication', icon: 'pill', goal: 'Safe administration of prescribed medicines.', how: 'Takes tablets with breakfast. Donepezil is covert per authorised plan.', actions: ['Prompt & record on eMAR', 'Escalate refusals same day'], risks: ['Medication error risk'] },
      { domain: 'Skin Integrity', icon: 'activity', goal: 'Prevent pressure damage.', how: 'History of redness on left heel — check daily.', actions: ['Check pressure areas morning & bedtime', 'Reposition at each visit', 'Apply barrier cream'], risks: ['Pressure ulcer risk'] },
      { domain: 'Mental Health & Cognition', icon: 'brain', goal: 'Reduce anxiety and support orientation (early dementia).', how: 'Can be low in the afternoon. Likes Radio 2. Calm reassurance in the evening.', actions: ['Orientation prompt in the morning', 'Evening reassurance routine', 'Monitor mood'], risks: ['Wandering / distress risk'] },
    ],
  },
  'su-doris': { review: '2026-07-20', version: 'v2', sections: [
    { domain: 'Mobility & Transfers', icon: 'footprints', goal: 'Safe hoist transfers.', how: 'Two carers + prescribed sling for all transfers.', actions: ['Hoist bed↔chair with 2 carers', 'Check sling condition'], risks: ['Moving & handling — high risk'] },
    { domain: 'Continence', icon: 'refuse', goal: 'Maintain catheter care.', how: 'Indwelling catheter — monitor output & colour.', actions: ['Check & empty catheter bag', 'Record output'], risks: ['UTI risk'] },
  ] },
  'su-george': { review: '2026-08-10', version: 'v1', sections: [
    { domain: 'Respiratory', icon: 'activity', goal: 'Manage COPD.', how: 'Uses inhalers with spacer. Monitor SpO₂.', actions: ['Prompt inhalers', 'Record SpO₂'], risks: ['Respiratory deterioration'] },
  ] },
}

export const RISK_ASSESSMENTS = {
  'su-mary': [
    { name: 'Falls', level: 'Medium', controls: ['Frame within reach', 'Clear pathways', 'Pendant alarm on'], review: '2026-07-15' },
    { name: 'Dehydration', level: 'High', controls: ['1500ml daily target', 'Offer at every visit', 'Escalate low intake'], review: '2026-07-20' },
    { name: 'Pressure ulcer', level: 'Medium', controls: ['Daily skin checks', 'Repositioning', 'Barrier cream'], review: '2026-07-10' },
  ],
  'su-doris': [
    { name: 'Moving & handling', level: 'High', controls: ['Two carers', 'Hoist + sling', 'No solo transfers'], review: '2026-07-05' },
    { name: 'UTI', level: 'Medium', controls: ['Catheter care', 'Monitor output & colour'], review: '2026-07-18' },
  ],
  'su-george': [{ name: 'Falls', level: 'Medium', controls: ['Encourage walking aids'], review: '2026-08-01' }],
}

export const MED_HISTORY = {
  'su-mary': [
    { date: '29/06/2026', time: '08:05', name: 'Metformin 500mg', outcome: 'Given', by: 'A. Khan' },
    { date: '29/06/2026', time: '08:05', name: 'Amlodipine 5mg', outcome: 'Given', by: 'A. Khan' },
    { date: '29/06/2026', time: '14:20', name: 'Paracetamol 1g (PRN)', outcome: 'Given', by: 'A. Khan' },
    { date: '29/06/2026', time: '21:10', name: 'Insulin (Lantus)', outcome: 'Given', by: 'D. Roy' },
    { date: '28/06/2026', time: '08:00', name: 'Metformin 500mg', outcome: 'Refused', by: 'A. Khan' },
    { date: '28/06/2026', time: '21:05', name: 'Insulin (Lantus)', outcome: 'Given', by: 'D. Roy' },
    { date: '27/06/2026', time: '08:10', name: 'Metformin 500mg', outcome: 'Given', by: 'D. Roy' },
  ],
  'su-doris': [
    { date: '29/06/2026', time: '08:20', name: 'Furosemide 40mg', outcome: 'Given', by: 'P. Shah' },
    { date: '29/06/2026', time: '08:20', name: 'Lansoprazole 30mg', outcome: 'Given', by: 'P. Shah' },
  ],
  'su-george': [{ date: '29/06/2026', time: '08:40', name: 'Salbutamol inhaler', outcome: 'Given', by: 'A. Khan' }],
}

export const OBS_TRENDS = {
  'su-mary': {
    bp: [{ d: 'Mon', sys: 138, dia: 82 }, { d: 'Tue', sys: 142, dia: 85 }, { d: 'Wed', sys: 150, dia: 88 }, { d: 'Thu', sys: 135, dia: 80 }, { d: 'Fri', sys: 182, dia: 96 }],
    weight: [{ d: 'W1', kg: 62.4 }, { d: 'W2', kg: 62.0 }, { d: 'W3', kg: 61.5 }, { d: 'W4', kg: 61.1 }],
    fluid: [{ d: 'Mon', ml: 1420 }, { d: 'Tue', ml: 1180 }, { d: 'Wed', ml: 1610 }, { d: 'Thu', ml: 980 }, { d: 'Fri', ml: 1320 }, { d: 'Sat', ml: 760 }, { d: 'Sun', ml: 1090 }],
    mood: [{ d: 'Mon', s: 3 }, { d: 'Tue', s: 2 }, { d: 'Wed', s: 3 }, { d: 'Thu', s: 2 }, { d: 'Fri', s: 2 }],
  },
}

export const VISIT_HISTORY = {
  'su-mary': [
    { date: '29/06/2026', visit: 'Bedtime', carer: 'D. Roy', status: 'Completed' },
    { date: '29/06/2026', visit: 'Tea', carer: 'D. Roy', status: 'Completed' },
    { date: '29/06/2026', visit: 'Lunch', carer: 'A. Khan', status: 'Completed' },
    { date: '29/06/2026', visit: 'Morning', carer: 'A. Khan', status: 'Completed' },
    { date: '28/06/2026', visit: 'Morning', carer: 'A. Khan', status: 'Med refused' },
  ],
}

export const CLIENT_DOCS = {
  'su-mary': [
    { name: 'Care plan', type: 'PDF · Care plan', date: '12 Feb 2026', icon: 'file-check' },
    { name: 'Consent — photos & data', type: 'PDF · Consent', date: '03 Nov 2025', icon: 'shield' },
    { name: 'GP letter — medication review', type: 'PDF · Correspondence', date: '18 May 2026', icon: 'info' },
    { name: 'Moving & handling assessment', type: 'PDF · Risk assessment', date: '10 Jun 2026', icon: 'activity' },
  ],
}

export const carePlan = (id) => CARE_PLANS[id] || { review: '—', version: '—', sections: [] }
export const risksFor = (id) => RISK_ASSESSMENTS[id] || []
export const medHistory = (id) => MED_HISTORY[id] || []
export const obsTrends = (id) => OBS_TRENDS[id] || {}
export const visitHistory = (id) => VISIT_HISTORY[id] || []
export const clientDocs = (id) => CLIENT_DOCS[id] || []

/* ============================================================================
   Spec v3.4 — clinical-safety additions (E1)
   ========================================================================== */

/** §7 Parameter table — single source of truth for [P-…] thresholds. */
export const PARAMS = {
  GEOFENCE_M: 100, MISSED_MIN: 15, AUTOLOCK_MIN: 5,
  MEDWINDOW_EARLY_MIN: 60, MEDWINDOW_LATE_MIN: 60,
  ALERTACK_MIN: 5, ALERTRETRY_MIN: 2, PRNFOLLOWUP_MIN: 60,
  KEYSAFEREVEAL_S: 30, LWCHECKIN_MIN: 120, OBSWINDOW: 5, TRAINDUE_DAYS: 30,
  STALEMAR_WARN_H: 12, STALEMAR_BLOCK_H: 24, CHECKIN_EARLY_MIN: 15,
}

/** §18/§49 — eMAR is TWO separate fields, never one. */
export const SUPPORT_ACTIONS = [
  { id: 'self-managed', label: 'Self-managed' },
  { id: 'prompted', label: 'Prompted' },
  { id: 'supervised', label: 'Supervised' },
  { id: 'assisted', label: 'Assisted' },
  { id: 'administered', label: 'Administered' },
  { id: 'no-action', label: 'No action' },
]
export const DOSE_OUTCOMES = [
  { id: 'taken', label: 'Taken', tone: 'ok' },
  { id: 'not-required', label: 'Not required (PRN)', tone: 'ok' },
  { id: 'administered-by-other', label: 'Given by other', tone: 'ok' },
  { id: 'partly-taken', label: 'Partly taken', tone: 'warn' },
  { id: 'withheld', label: 'Withheld (instruction)', tone: 'warn' },
  { id: 'refused', label: 'Refused', tone: 'bad' },
  { id: 'unavailable', label: 'Not available', tone: 'bad' },
  { id: 'omitted', label: 'Omitted', tone: 'bad' },
  { id: 'unknown', label: 'Unknown', tone: 'warn' },
]
/** Derive per-medicine status + whether the AUTHORISED PLAN was met (§14.32). */
export function deriveDose(supportAction, doseOutcome) {
  const status = ['taken', 'administered-by-other'].includes(doseOutcome) ? 'completed'
    : doseOutcome === 'partly-taken' ? 'partial'
    : doseOutcome === 'refused' ? 'refused'
    : ['unavailable', 'omitted'].includes(doseOutcome) ? 'unable'
    : ['withheld', 'not-required'].includes(doseOutcome) ? 'completed'
    : 'partial'
  // Planned care Met even when nothing physically given, if that was the plan.
  const planMet = ['taken', 'not-required', 'administered-by-other', 'withheld'].includes(doseOutcome)
    || supportAction === 'self-managed'
  return { status, planMet }
}
export const doseOutcome = (id) => DOSE_OUTCOMES.find((d) => d.id === id)

/** §49 — allergy status is one of FIVE states with behaviour, not a binary. */
export const ALLERGY_STATES = {
  none: { label: 'No known allergies', tone: 'ok', warn: false },
  confirmed: { label: 'Confirmed allergy', tone: 'bad', warn: false },
  unknown: { label: 'Allergy status UNKNOWN', tone: 'warn', warn: true },
  incomplete: { label: 'Allergy assessment incomplete', tone: 'warn', warn: true },
  unverified: { label: 'Unable to verify allergies', tone: 'warn', warn: true },
}

/** §49 — per-medicine administration-window / interval / 24h-max rules. */
export const MED_RULES = {
  'm-paracetamol': { minIntervalMin: 240, max24hDoses: 4, ceilingLabel: 'Max 4 g / 24h' },
  'm-oramorph': { minIntervalMin: 120, max24hDoses: 6, ceilingLabel: 'Max 6 doses / 24h' },
  'm-metformin': { scheduledTime: '08:00' },
  'm-amlodipine': { scheduledTime: '08:00' },
  'g-prednisolone': { minIntervalMin: 720 },
}
export const medRule = (id) => MED_RULES[id] || {}

/** §51 — closed-loop emergency/deterioration protocols (version-pinned). */
export const PROTOCOLS = {
  deterioration: {
    id: 'deterioration', name: 'Deterioration / suspected sepsis', version: 'v2.1', trigger: 'NEWS2 ≥ 5 or abnormal vital signs',
    steps: [
      { type: 'action', title: 'Immediate actions', items: ['Stay with the person', 'Sit up / position for comfort', 'Keep warm', 'Reassure'] },
      { type: 'contact', title: 'Contact for advice', options: [{ label: 'Call 999', num: '999', tone: 'danger' }, { label: 'Call 111', num: '111', tone: 'warning' }, { label: 'On-call clinical', num: '07700 900500', tone: 'primary' }] },
      { type: 'advice', title: 'Record advice received', placeholder: 'e.g. 111 disposition, ambulance ETA' },
      { type: 'repeatObs', title: 'Repeat observations', detail: 'Repeat NEWS2 / vitals in 15 minutes and monitor.' },
      { type: 'acknowledge', title: 'Confirm actions taken', detail: 'I have completed the above actions.' },
      { type: 'closure', title: 'Outcome', options: ['Ambulance called', '111/GP advice followed', 'Improved — monitoring', 'Escalated to manager'] },
    ],
  },
  hypo: {
    id: 'hypo', name: 'Hypoglycaemia', version: 'v1.4', trigger: 'Blood glucose < 4 mmol/L',
    steps: [
      { type: 'action', title: 'Immediate actions', items: ['Give fast-acting glucose if able to swallow', 'Do NOT give if unsafe swallow', 'Stay with the person', 'Re-test in 15 min'] },
      { type: 'contact', title: 'Contact for advice', options: [{ label: 'Call 999 if unconscious', num: '999', tone: 'danger' }, { label: 'Call 111', num: '111', tone: 'warning' }, { label: 'On-call clinical', num: '07700 900500', tone: 'primary' }] },
      { type: 'advice', title: 'Record advice received', placeholder: 'Advice / disposition' },
      { type: 'repeatObs', title: 'Re-test blood glucose', detail: 'Repeat blood glucose after 15 minutes.' },
      { type: 'acknowledge', title: 'Confirm actions taken', detail: 'I have completed the above actions.' },
      { type: 'closure', title: 'Outcome', options: ['Recovered — glucose normal', 'Ambulance called', 'Escalated to manager'] },
    ],
  },
  choking: {
    id: 'choking', name: 'Choking', version: 'v1.2', trigger: 'Airway obstruction',
    steps: [
      { type: 'action', title: 'Immediate actions', items: ['Encourage coughing', 'Up to 5 back blows', 'Up to 5 abdominal thrusts', 'Repeat cycle'] },
      { type: 'contact', title: 'Contact', options: [{ label: 'Call 999', num: '999', tone: 'danger' }] },
      { type: 'advice', title: 'Record advice received', placeholder: 'Ambulance ETA / advice' },
      { type: 'acknowledge', title: 'Confirm actions taken', detail: 'I have completed the above actions.' },
      { type: 'closure', title: 'Outcome', options: ['Obstruction cleared', 'Ambulance called', 'Unresponsive — see collapse protocol'] },
    ],
  },
  stroke: {
    id: 'stroke', name: 'Suspected stroke (FAST)', version: 'v1.1', trigger: 'FAST positive',
    steps: [
      { type: 'action', title: 'FAST check', items: ['Face — drooping?', 'Arms — can they raise both?', 'Speech — slurred?', 'Time — note onset time'] },
      { type: 'contact', title: 'Contact', options: [{ label: 'Call 999', num: '999', tone: 'danger' }] },
      { type: 'advice', title: 'Record advice received', placeholder: 'Ambulance ETA / advice' },
      { type: 'acknowledge', title: 'Confirm actions taken', detail: 'I have completed the above actions.' },
      { type: 'closure', title: 'Outcome', options: ['Ambulance called', 'Escalated to manager'] },
    ],
  },
  unresponsive: {
    id: 'unresponsive', name: 'Unresponsive / collapse', version: 'v2.0', trigger: 'Person unresponsive',
    steps: [
      { type: 'action', title: 'Immediate actions', items: ['Check response & breathing', 'Check DNACPR / ReSPECT status', 'Open airway', 'Start CPR if no breathing & no DNACPR'] },
      { type: 'contact', title: 'Contact', options: [{ label: 'Call 999', num: '999', tone: 'danger' }] },
      { type: 'advice', title: 'Record advice received', placeholder: 'Ambulance ETA / advice' },
      { type: 'acknowledge', title: 'Confirm actions taken', detail: 'I have completed the above actions.' },
      { type: 'closure', title: 'Outcome', options: ['Ambulance called', 'Recovered', 'Deceased — start death workflow', 'Escalated to manager'] },
    ],
  },
  anaphylaxis: {
    id: 'anaphylaxis', name: 'Anaphylaxis', version: 'v1.3', trigger: 'Severe allergic reaction',
    steps: [
      { type: 'action', title: 'Immediate actions', items: ['Remove trigger if known', 'Use adrenaline auto-injector if prescribed', 'Lie flat, raise legs', 'Repeat after 5 min if no better'] },
      { type: 'contact', title: 'Contact', options: [{ label: 'Call 999', num: '999', tone: 'danger' }] },
      { type: 'advice', title: 'Record advice received', placeholder: 'Ambulance ETA / advice' },
      { type: 'acknowledge', title: 'Confirm actions taken', detail: 'I have completed the above actions.' },
      { type: 'closure', title: 'Outcome', options: ['Ambulance called', 'Improved — monitoring', 'Escalated to manager'] },
    ],
  },
}
export const protocol = (id) => PROTOCOLS[id]
export const PROTOCOL_LIST = Object.values(PROTOCOLS)

/** Map an abnormal observation to the protocol it should launch. */
export function protocolFor(obsId, values) {
  const n = (k) => Number(values[k])
  if (obsId === 'news2' && n('value') >= 5) return 'deterioration'
  if (obsId === 'glucose' && n('value') < 4) return 'hypo'
  if (obsId === 'spo2' && n('value') < 92) return 'deterioration'
  if (['temperature', 'pulse', 'respirations', 'bp'].includes(obsId)) return 'deterioration'
  return null
}

/** §16 — decision-specific, time-specific capacity + LPA scope (never a generic flag). */
export const CAPACITY = {
  'su-mary': {
    lpa: { type: 'Health & welfare LPA', holder: 'Susan Adams (daughter)', scope: 'Health & welfare decisions only — NOT property or finances', registered: '2024-09-01' },
    decisions: [
      { decision: 'Taking regular medication', capacity: 'Has capacity', fluctuates: true, assessed: '2026-05-10', assessor: 'J. Mensah (Clinical Lead)', review: '2026-08-10', note: 'Can fluctuate in the late afternoon — reassess if confused.' },
      { decision: 'Personal care & washing', capacity: 'Has capacity', fluctuates: false, assessed: '2026-02-12', assessor: 'L. Adeyemi (Care Coordinator)', review: '2026-08-12' },
      { decision: 'Managing finances', capacity: 'Lacks capacity', fluctuates: false, assessed: '2025-11-20', assessor: 'Social worker', review: '2026-11-20', authority: 'Property & affairs deputy (Court of Protection)' },
    ],
  },
  'su-doris': {
    lpa: null,
    decisions: [
      { decision: 'Consent to hoist transfers', capacity: 'Has capacity', fluctuates: false, assessed: '2026-01-15', assessor: 'OT assessment', review: '2026-07-15' },
    ],
  },
}
export const capacityFor = (id) => CAPACITY[id] || { lpa: null, decisions: [] }

/* ============================================================================
   Spec v3.4 — visit integrity & ECM (E2)
   ========================================================================== */

/** §14 — check-in methods (GPS geofence + fallbacks). */
export const CHECKIN_METHODS = [
  { id: 'gps', label: 'GPS — inside geofence', tone: 'ok' },
  { id: 'nfc', label: 'NFC tag at the door', tone: 'ok' },
  { id: 'qr', label: 'QR scan', tone: 'ok' },
  { id: 'manual', label: 'Manual (reason required)', tone: 'warn' },
]
/** Simulated geofence result per visit (most inside; one outside to demo the flag). */
const GEOFENCE = { 'v-doris-am': 'outside' }
export const geofenceFor = (visitId) => GEOFENCE[visitId] || 'inside'

/** §14 — on-entry welfare confirmation (structured, not a blanket "safe" tick). */
export const WELFARE_OUTCOMES = [
  { id: 'seen-ok', label: 'Person seen — as expected', tone: 'ok' },
  { id: 'seen-concern', label: 'Person seen — concern identified', tone: 'warn' },
  { id: 'no-access', label: 'Person not seen — no access', tone: 'bad' },
  { id: 'not-present', label: 'Person not present', tone: 'warn' },
  { id: 'declined', label: 'Person declined contact', tone: 'warn' },
  { id: 'remote', label: 'Remote contact completed', tone: 'ok' },
  { id: 'emergency', label: 'Emergency / unresponsive', tone: 'bad' },
  { id: 'na', label: 'Not applicable (visit type)', tone: 'ok' },
]

/** §14/§55.7 — leaving-safe checklist (configurable per person) + exception outcomes. */
export const LEAVING_SAFE_ITEMS = ['Call bell / essentials within reach', 'Doors locked / secure', 'Appliances / cooker off', 'Heating appropriate', 'Person left comfortable']
export const LEAVING_SAFE_EXCEPTIONS = ['Done', 'N/A', 'Person declined', 'Person has capacity & chose otherwise', 'Left with family / professional', 'Transferred to hospital', 'Ended outside home', 'Left due to danger', 'Another carer remains']

/** §14 — structured visit-reason taxonomy under the friendly picker. */
export const VISIT_REASON_CODES = {
  Access: ['no-answer', 'keysafe-code-wrong', 'access-instructions-incorrect', 'unsafe-access'],
  'Person availability': ['not-home', 'hospitalised', 'planned-absence', 'social-leave'],
  Consent: ['refused-entry', 'refused-whole-visit', 'refused-specific-care'],
  Safety: ['aggression', 'environmental-hazard', 'medical-emergency', 'safeguarding-concern'],
  Other: ['other'],
}

/* ============================================================================
   Spec v3.4 — E6/E7/E8 breadth data
   ========================================================================== */

/** §14.1 — visit types (badge + behaviour note). */
export const VISIT_TYPE_META = {
  standard: { label: 'Standard', note: '' },
  escort: { label: 'Escort / accompaniment', note: 'You take the person out — location will move during the visit; this is expected, not a discrepancy.' },
  telephone: { label: 'Telephone / virtual', note: 'Remote visit — not geofenced; recorded as remote contact.' },
  first: { label: 'First visit', note: 'Surfaces the full assessment and baseline observations.' },
  complex: { label: 'Complex / clinical', note: 'Competency-gated; protocols and just-in-time learning surfaced.' },
  eol: { label: 'End of life', note: 'Anticipatory meds, ReSPECT/DNACPR and comfort observations. Sensitive mode.' },
}
const VISIT_TYPES = { 'v-mary-am': 'standard', 'v-doris-am': 'complex', 'v-george-am': 'first', 'v-mary-lunch': 'escort', 'v-george-tea': 'telephone' }
export const visitTypeFor = (visitId) => VISIT_TYPES[visitId] || 'standard'

/** §20 — equipment (with LOLER) + consumables per client. */
export const EQUIPMENT = {
  'su-mary': [
    { name: 'Profiling bed', type: 'Bed', loler: false, lastInspection: '2026-03-01', status: 'ok' },
    { name: 'Pressure-relieving mattress', type: 'Pressure care', loler: false, lastInspection: '2026-05-10', status: 'ok' },
    { name: 'Pendant alarm', type: 'Telecare', loler: false, lastInspection: '2026-06-01', status: 'ok' },
  ],
  'su-doris': [
    { name: 'Mobile hoist', type: 'Hoist', loler: true, lastInspection: '2026-05-20', nextInspection: '2026-11-20', status: 'ok' },
    { name: 'Standard sling (medium)', type: 'Sling', loler: true, lastInspection: '2026-05-20', status: 'ok' },
    { name: 'Hospital bed', type: 'Bed', loler: false, lastInspection: '2026-04-02', status: 'ok' },
    { name: 'Sensor mat', type: 'Telecare', loler: false, lastInspection: '2026-06-10', status: 'faulty' },
  ],
  'su-george': [{ name: 'Home oxygen concentrator', type: 'Oxygen', loler: false, lastInspection: '2026-06-15', status: 'ok' }],
}
export const CONSUMABLES = {
  'su-mary': [{ name: 'Continence pads', status: 'in' }, { name: 'Barrier cream', status: 'low' }, { name: 'Gloves (M)', status: 'in' }],
  'su-doris': [{ name: 'Catheter bags', status: 'low' }, { name: 'Gloves (L)', status: 'in' }, { name: 'Wipes', status: 'out' }],
  'su-george': [{ name: 'Inhaler spacer', status: 'in' }],
}
export const equipmentFor = (id) => EQUIPMENT[id] || []
export const consumablesFor = (id) => CONSUMABLES[id] || []

/** §20 — orderable supplies catalogue (PPE + consumables). Prices are the unit
 *  cost the office adds to the client's invoice. `cat` groups them; `icon`/`tint`
 *  give each a semantic chip. */
export const SUPPLY_CATALOGUE = [
  { id: 'glv-s', name: 'Nitrile gloves — Small', cat: 'PPE', unit: 'box of 100', price: 4.5, icon: 'shield', tint: 'bg-violet-50 text-violet-600' },
  { id: 'glv-m', name: 'Nitrile gloves — Medium', cat: 'PPE', unit: 'box of 100', price: 4.5, icon: 'shield', tint: 'bg-violet-50 text-violet-600' },
  { id: 'glv-l', name: 'Nitrile gloves — Large', cat: 'PPE', unit: 'box of 100', price: 4.5, icon: 'shield', tint: 'bg-violet-50 text-violet-600' },
  { id: 'apron', name: 'Disposable aprons', cat: 'PPE', unit: 'roll of 200', price: 3.2, icon: 'shield', tint: 'bg-violet-50 text-violet-600' },
  { id: 'mask', name: 'Type IIR face masks', cat: 'PPE', unit: 'box of 50', price: 5.0, icon: 'shield', tint: 'bg-violet-50 text-violet-600' },
  { id: 'gel', name: 'Hand sanitiser 500ml', cat: 'PPE', unit: 'bottle', price: 2.8, icon: 'droplet', tint: 'bg-sky-50 text-sky-600' },
  { id: 'pad-day', name: 'Continence pads — day', cat: 'Continence', unit: 'pack of 28', price: 6.5, icon: 'droplet', tint: 'bg-blue-50 text-blue-600' },
  { id: 'pad-night', name: 'Continence pads — night', cat: 'Continence', unit: 'pack of 21', price: 7.8, icon: 'droplet', tint: 'bg-blue-50 text-blue-600' },
  { id: 'bed-pad', name: 'Disposable bed pads', cat: 'Continence', unit: 'pack of 30', price: 5.9, icon: 'droplet', tint: 'bg-blue-50 text-blue-600' },
  { id: 'cath-bag', name: 'Catheter leg bags', cat: 'Continence', unit: 'pack of 10', price: 8.4, icon: 'droplet', tint: 'bg-blue-50 text-blue-600' },
  { id: 'wipes', name: 'Wet wipes', cat: 'Hygiene', unit: 'pack of 80', price: 1.2, icon: 'bath', tint: 'bg-teal-50 text-teal-600' },
  { id: 'couch', name: 'Couch roll', cat: 'Hygiene', unit: 'roll', price: 2.5, icon: 'bath', tint: 'bg-teal-50 text-teal-600' },
  { id: 'waste', name: 'Clinical waste bags', cat: 'Hygiene', unit: 'roll of 25', price: 2.1, icon: 'trash', tint: 'bg-ink-100 text-ink-600' },
  { id: 'barrier', name: 'Barrier cream 100g', cat: 'Skin', unit: 'tube', price: 3.4, icon: 'person-standing', tint: 'bg-pink-50 text-pink-600' },
  { id: 'emollient', name: 'Emollient wash 500ml', cat: 'Skin', unit: 'bottle', price: 4.2, icon: 'person-standing', tint: 'bg-pink-50 text-pink-600' },
  { id: 'dressing', name: 'Adhesive dressings', cat: 'Clinical', unit: 'pack of 20', price: 4.0, icon: 'cross', tint: 'bg-rose-50 text-rose-600' },
  { id: 'gauze', name: 'Sterile gauze swabs', cat: 'Clinical', unit: 'pack of 25', price: 3.1, icon: 'cross', tint: 'bg-rose-50 text-rose-600' },
]
export const SUPPLY_CATEGORIES = ['PPE', 'Continence', 'Hygiene', 'Skin', 'Clinical']

/** §16a — reablement outcome goals (time-limited). */
export const REABLEMENT_GOALS = {
  'su-mary': {
    package: '6-week reablement', started: '2026-05-01', review: '2026-06-12',
    goals: [
      { goal: 'Dress upper body independently', baseline: 'Fully assisted', target: 'Independent with set-up', stepDown: 'Reduce prompting weekly', progress: 'Prompted' },
      { goal: 'Walk to the kitchen with a frame', baseline: 'Unable', target: '5 metres with frame', stepDown: 'Increase distance weekly', progress: 'Improved' },
      { goal: 'Make a hot drink safely', baseline: 'Assisted', target: 'Independent with supervision', stepDown: 'Supervise only', progress: 'Same' },
    ],
  },
}
export const reablementFor = (id) => REABLEMENT_GOALS[id] || null
export const REABLEMENT_LEVELS = ['Fully independent', 'Prompted', 'Assisted', 'Unable']

/** §14.4 — night-shift interval rounds. */
export const NIGHT_ROUNDS = [
  { time: '22:00', task: 'Settle & comfort check' },
  { time: '00:00', task: 'Repositioning (pressure care)' },
  { time: '02:00', task: 'Continence check & pad change' },
  { time: '04:00', task: 'Repositioning (pressure care)' },
  { time: '06:00', task: 'Continence check & morning prep' },
]

/** §24 — point-of-care communication / translation aid (mock translations). */
export const PHRASE_LANGS = ['Polski', 'Română', 'Español', 'Português']
export const CARE_PHRASES = [
  { en: 'Hello, I’m your carer.', t: ['Dzień dobry, jestem opiekunem.', 'Bună, sunt îngrijitorul dumneavoastră.', 'Hola, soy su cuidador.', 'Olá, sou o seu cuidador.'] },
  { en: 'Are you in any pain?', t: ['Czy odczuwa Pan/Pani ból?', 'Aveți dureri?', '¿Tiene algún dolor?', 'Está com dores?'] },
  { en: 'It’s time for your medication.', t: ['Czas na lekarstwa.', 'Este timpul pentru medicamente.', 'Es hora de su medicación.', 'Está na hora da sua medicação.'] },
  { en: 'Would you like a drink?', t: ['Czy napije się Pan/Pani czegoś?', 'Doriți ceva de băut?', '¿Le gustaría beber algo?', 'Gostaria de uma bebida?'] },
  { en: 'I’m going to help you wash now.', t: ['Teraz pomogę się umyć.', 'Vă voi ajuta să vă spălați acum.', 'Ahora le ayudaré a lavarse.', 'Vou ajudá-lo a lavar-se agora.'] },
  { en: 'Can you squeeze my hand?', t: ['Czy może Pan/Pani ścisnąć moją dłoń?', 'Puteți să-mi strângeți mâna?', '¿Puede apretarme la mano?', 'Consegue apertar a minha mão?'] },
]

/* ============================================================================
   Spec v3.4 — E9: medication order lifecycle, obs integrity & cross-carer safety
   ========================================================================== */

/** §49 — a prescribed medication ORDER has versioned lifecycle states. The carer
 * administers ONLY against the currently-effective version. */
export const ORDER_STATES = {
  Draft: { tone: 'ink', admin: false }, Pending: { tone: 'warn', admin: false },
  Active: { tone: 'ok', admin: true }, Suspended: { tone: 'warn', admin: false },
  Superseded: { tone: 'ink', admin: false }, Discontinued: { tone: 'bad', admin: false },
  Completed: { tone: 'ink', admin: false }, Expired: { tone: 'bad', admin: false },
}

/** §49 — reconciliation of a changed order: Pending → … → Confirmed/Rejected/Resolved.
 * An unresolved reconciliation BLOCKS the affected medicine (withhold / contact office). */
export const RECON_STATES = {
  Pending: { tone: 'warn', blocks: true }, 'Under review': { tone: 'warn', blocks: true },
  Clarification: { tone: 'warn', blocks: true }, Confirmed: { tone: 'ok', blocks: false },
  Rejected: { tone: 'bad', blocks: false }, Resolved: { tone: 'ok', blocks: false },
}

/**
 * Per-service-user medication orders. Each order carries its full version history;
 * `current` points at the effective version. `recon` (optional) is an open
 * reconciliation raised when the order changed since the last recorded visit.
 */
export const MEDICATION_ORDERS = {
  'su-mary': [
    { medId: 'm-metformin', name: 'Metformin', route: 'Oral', current: 2,
      versions: [
        { v: 1, dose: '500 mg', freq: 'OD (morning)', state: 'Superseded', effectiveFrom: '2026-01-10', prescriber: 'Dr Patel (GP)', source: 'GP Connect', review: '2026-04-10' },
        { v: 2, dose: '1 g', freq: 'BD (morning & evening)', state: 'Active', effectiveFrom: '2026-06-28', prescriber: 'Dr Patel (GP)', source: 'GP Connect', review: '2026-09-28', changeNote: 'Dose increased and split to twice-daily — HbA1c raised.' },
      ],
      recon: { state: 'Pending', reason: 'Dose & frequency changed since last visit', raised: '2026-06-28', changed: ['dose', 'frequency'] } },
    { medId: 'm-amlodipine', name: 'Amlodipine', route: 'Oral', current: 1,
      versions: [{ v: 1, dose: '5 mg', freq: 'OD (morning)', state: 'Active', effectiveFrom: '2026-02-01', prescriber: 'Dr Patel (GP)', source: 'GP Connect', review: '2026-08-01' }] },
    { medId: 'm-lantus', name: 'Insulin glargine (Lantus)', route: 'Subcut', current: 1,
      versions: [{ v: 1, dose: '12 units', freq: 'Nocte', state: 'Active', effectiveFrom: '2026-03-15', prescriber: 'Diabetes team', source: 'Hospital letter', review: '2026-09-15', timeCritical: true }] },
    { medId: 'm-donepezil', name: 'Donepezil (covert)', route: 'Oral', current: 1, covert: true,
      versions: [{ v: 1, dose: '10 mg', freq: 'Nocte', state: 'Active', effectiveFrom: '2026-04-02', prescriber: 'Memory clinic', source: 'Hospital letter', review: '2026-10-02', mcaAuthorised: true }] },
    { medId: 'm-simvastatin', name: 'Simvastatin', route: 'Oral', current: 2,
      versions: [
        { v: 1, dose: '40 mg', freq: 'Nocte', state: 'Discontinued', effectiveFrom: '2025-11-01', prescriber: 'Dr Patel (GP)', source: 'GP Connect', review: '—' },
        { v: 2, dose: '—', freq: 'STOPPED', state: 'Discontinued', effectiveFrom: '2026-06-29', prescriber: 'Dr Patel (GP)', source: 'GP Connect', review: '—', changeNote: 'Stopped — muscle pain reported. Do NOT administer.' },
      ],
      recon: { state: 'Under review', reason: 'Order STOPPED — a dose may have been given offline before the stop synced', raised: '2026-06-29', changed: ['stopped'], conflict: true } },
  ],
  'su-doris': [
    { medId: 'd-furosemide', name: 'Furosemide', route: 'Oral', current: 1,
      versions: [{ v: 1, dose: '40 mg', freq: 'OD (morning)', state: 'Active', effectiveFrom: '2026-01-20', prescriber: 'Dr Nwosu (GP)', source: 'GP Connect', review: '2026-07-20' }] },
    { medId: 'd-lansoprazole', name: 'Lansoprazole', route: 'Oral', current: 1,
      versions: [{ v: 1, dose: '30 mg', freq: 'OD (morning)', state: 'Active', effectiveFrom: '2026-01-20', prescriber: 'Dr Nwosu (GP)', source: 'GP Connect', review: '2026-07-20' }] },
  ],
}
export const medOrdersFor = (id) => MEDICATION_ORDERS[id] || []
export const orderFor = (id, medId) => medOrdersFor(id).find((o) => o.medId === medId) || null
export const currentVersion = (order) => order ? order.versions.find((v) => v.v === order.current) : null
/** True when this medicine has an open reconciliation that should block administration. */
export function orderBlocked(order) {
  if (!order || !order.recon) return false
  return !!(RECON_STATES[order.recon.state] && RECON_STATES[order.recon.state].blocks)
}
/** §49 AC-49.3 — verification fields when a medicine was administered by someone else. */
export const EXTERNAL_ADMIN_ROLES = ['District nurse', 'GP', 'Family member', 'Another carer', 'Pharmacist', 'Paramedic', 'Care home staff']
export const VERIFY_METHODS = ['Saw it given', 'Told by the person', 'Told by family/professional', 'Written record seen', 'Not verified']

/** §18.1 — CD witness eligibility rule (all must hold) + logged fallbacks when none available. */
export const WITNESS_RULE = ['On duty now', 'Physically present', 'Medication + CD competency valid', 'Different authenticated account', 'Independent confirmation (not the administering carer)']
export const ELIGIBLE_WITNESSES = [
  { name: 'D. Roy', role: 'Senior Carer', onDuty: true, present: true, cdCompetent: true, eligible: true },
  { name: 'P. Shah', role: 'Care Worker', onDuty: true, present: false, cdCompetent: true, eligible: false, why: 'Not physically present' },
  { name: 'J. Mensah', role: 'Clinical Lead', onDuty: false, present: false, cdCompetent: true, eligible: false, why: 'Not on duty' },
]
export const WITNESS_FALLBACKS = [
  { id: 'pending-witness', label: 'Record as pending-witness', note: 'Give safely now, witness confirms & counts within the shift. Flagged to office.' },
  { id: 'oncall-cd', label: 'Remote confirm — on-call CD lead', note: 'On-call CD lead confirms by video and co-signs. Audited.' },
  { id: 'defer', label: 'Withhold & contact office (policy deferral)', note: 'Dose withheld; office arranges a second carer. Never leaves the round open.' },
]

/** §19 AC-19.17 — physiologically-impossible bounds → correction + repeat-reading before it can escalate. */
export const OBS_PLAUSIBLE = {
  temperature: { min: 30, max: 44 }, pulse: { min: 20, max: 220 }, respirations: { min: 4, max: 60 },
  systolic: { min: 50, max: 260 }, diastolic: { min: 20, max: 160 }, spo2: { min: 50, max: 100 },
  glucose: { min: 1, max: 40 }, weight: { min: 20, max: 250 },
}
/** Return an implausibility message for a captured obs field, or null. Ranges are
 * keyed by field key (systolic/diastolic) or obs id (temperature/pulse/…) — most
 * single-value obs store under the field key `value`, so we fall back to obsId. */
export function implausible(obsId, key, value) {
  const r = OBS_PLAUSIBLE[key] || OBS_PLAUSIBLE[obsId]
  if (!r || value === '' || value == null) return null
  const n = Number(value); if (Number.isNaN(n)) return null
  if (n < r.min || n > r.max) return `${n} is outside the possible range (${r.min}–${r.max}). Check for a decimal slip or unit mismatch, then re-read.`
  return null
}

/** §19 AC-19.20 — structured wound / body-map vocabulary (replaces free-form marks). */
export const WOUND_VOCAB = {
  side: ['—', 'Left', 'Right', 'Midline'], aspect: ['—', 'Front', 'Back'],
  type: ['Pressure ulcer', 'Skin tear', 'Moisture lesion', 'Laceration', 'Bruise', 'Surgical wound', 'Leg ulcer', 'Other'],
  category: ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Unstageable', 'DTI (deep tissue injury)', 'N/A'],
  exudate: ['None', 'Low', 'Moderate', 'High'], odour: ['None', 'Slight', 'Offensive'],
  infection: ['None', 'Redness', 'Heat', 'Swelling', 'Pus', 'Spreading'],
}

/** §19 AC-19.14 — monitoring schedules (who requested, frequency, end date). */
export const MONITORING_SCHEDULES = {
  'su-mary': [
    { obs: 'Blood pressure', freq: '×2 / day', until: '2026-07-08', by: 'GP — Dr Patel', reason: 'New amlodipine review' },
    { obs: 'Fluid balance', freq: 'Every visit', until: 'Ongoing', by: 'Care coordinator', reason: 'Dehydration risk (High)' },
    { obs: 'Weight', freq: 'Weekly', until: 'Ongoing', by: 'Dietitian', reason: 'Unintentional weight loss' },
  ],
  'su-george': [{ obs: 'SpO₂', freq: 'Every tea visit', until: '2026-07-15', by: 'Respiratory nurse', reason: 'COPD monitoring' }],
}
export const monitoringFor = (id) => MONITORING_SCHEDULES[id] || []

/** §19 AC-19.15/16 — repositioning chart shared ACROSS carers & visits (pressure care). */
export const REPOSITION_PLAN = {
  'su-mary': { intervalH: 4, log: [
    { at: '2026-07-01 22:00', to: 'Left side', by: 'D. Roy', skin: 'Intact' },
    { at: '2026-07-02 02:00', to: 'Back', by: 'D. Roy', skin: 'Red — sacrum' },
    { at: '2026-07-02 06:00', to: 'Right side', by: 'A. Khan', skin: 'Intact' },
  ] },
  'su-doris': { intervalH: 3, log: [
    { at: '2026-07-02 04:30', to: 'Left side', by: 'Night team', skin: 'Intact' },
  ] },
}
export const repositionFor = (id) => REPOSITION_PLAN[id] || null

/**
 * §19 AC-19.21 — wound-healing tracker. A wound is tracked over time (not one
 * visit): serial measurements + consented photos keyed to a body-map site, so
 * the record shows whether it is improving or deteriorating. Area (length×width
 * mm²) is the standard proxy for healing trend in pressure-ulcer monitoring.
 */
export const WOUNDS = {
  'su-mary': [
    { id: 'w-sacrum', site: 'Sacrum', side: 'Midline', type: 'Pressure ulcer', category: 'Category 2', opened: '2026-06-18',
      measurements: [
        { date: '18 Jun', length: 32, width: 24, depth: 3, tissue: 'Slough', exudate: 'Moderate', note: 'Broken skin over sacrum after a period in bed.' },
        { date: '25 Jun', length: 30, width: 22, depth: 3, tissue: 'Slough / granulation', exudate: 'Moderate', note: 'Wound bed cleaner, edges softening.' },
        { date: '01 Jul', length: 26, width: 19, depth: 2, tissue: 'Granulation', exudate: 'Low', note: 'Granulating well, exudate reducing.' },
      ],
      photos: [{ date: '18 Jun', consented: true }, { date: '01 Jul', consented: true }] },
    { id: 'w-heel', site: 'Left heel', side: 'Left', type: 'Pressure ulcer', category: 'Category 1', opened: '2026-06-28',
      measurements: [
        { date: '28 Jun', length: 18, width: 15, depth: 0, tissue: 'Non-blanching redness', exudate: 'None', note: 'Non-blanching erythema, skin intact.' },
        { date: '02 Jul', length: 22, width: 18, depth: 0, tissue: 'Non-blanching redness', exudate: 'None', note: 'Redness spreading — offloading heel, review pressure relief.' },
      ],
      photos: [] },
  ],
}
export const woundsFor = (id) => WOUNDS[id] || []

/* ============================================================================
   Spec v3.4 — E10: roles, non-visit jobs, change-requests, continuity
   ========================================================================== */

/** §5 — three carer tiers. Higher tiers inherit lower-tier permissions. */
export const CARER_ROLES = [
  { id: 'care-worker', label: 'Care Worker', rank: 1 },
  { id: 'senior-carer', label: 'Senior Carer', rank: 2 },
  { id: 'team-lead', label: 'Team Lead', rank: 3 },
]
/** Minimum rank required for an elevated action (§5 AC-5.1–5.3). */
export const ROLE_GATES = {
  'spot-check': 2, 'cd-witness': 2, 'competency-signoff': 3, 'adhoc-visit': 2,
  'triage-flag': 2, 'assessment-review': 3, 'break-glass-approve': 3,
}
export const roleRank = (id) => (CARER_ROLES.find((r) => r.id === id) || CARER_ROLES[0]).rank
export const roleLabel = (id) => (CARER_ROLES.find((r) => r.id === id) || CARER_ROLES[0]).label
export const canDo = (roleId, action) => roleRank(roleId) >= (ROLE_GATES[action] || 1)

/** §17 — non-visit Jobs catalogue (Today / Week / Month / Overdue). */
export const JOB_CATEGORIES = { stock: 'Stock', policy: 'Policy', vehicle: 'Vehicle & PPE', admin: 'Admin', spotcheck: 'Spot-check', errand: 'Errand' }
export const JOBS = [
  { id: 'j-stock-mary', title: 'Stock check — Mary Adams (pads, gloves, barrier cream)', cat: 'stock', due: 'Today', bucket: 'today', recurring: 'Weekly', evidence: true, mandatory: true, icon: 'clipboard' },
  { id: 'j-policy-ipc', title: 'Read & sign — updated IPC policy v6', cat: 'policy', due: 'Today', bucket: 'today', recurring: null, evidence: true, mandatory: true, icon: 'file-check' },
  { id: 'j-vehicle', title: 'Vehicle & PPE check', cat: 'vehicle', due: 'Today', bucket: 'today', recurring: 'Daily', evidence: true, mandatory: true, icon: 'shield' },
  { id: 'j-timesheet', title: 'Submit weekly timesheet', cat: 'admin', due: 'Fri', bucket: 'week', recurring: 'Weekly', evidence: false, mandatory: true, icon: 'clock' },
  { id: 'j-spotcheck', title: 'Spot-check — new starter (P. Shah)', cat: 'spotcheck', due: 'This week', bucket: 'week', recurring: null, evidence: true, mandatory: false, minRole: 'senior-carer', icon: 'user-check' },
  { id: 'j-errand', title: 'Collect prescription — George Bell', cat: 'errand', due: 'Thu', bucket: 'week', recurring: null, evidence: false, mandatory: false, icon: 'map-pin' },
  { id: 'j-fire', title: 'Monthly fire-safety e-learning', cat: 'policy', due: '15 Jul', bucket: 'month', recurring: 'Monthly', evidence: true, mandatory: true, icon: 'flame' },
  { id: 'j-supervision', title: 'Overdue — 1:1 supervision booking', cat: 'admin', due: '2 days ago', bucket: 'overdue', recurring: null, evidence: false, mandatory: true, icon: 'warning' },
]

/** §17.6 — support level attached to a care task (prompt → fully support). */
export const SUPPORT_LEVELS = ['Prompt only', 'Supervise', 'Assist', 'Fully support']

/** §24 — a tracked change request never mutates the plan; it routes to the office. */
export const CHANGE_TARGETS = ['Care plan', 'Task / routine', 'Medication order', 'Risk assessment', 'Personal detail', 'Equipment']
export const CHANGE_STATES = ['Raised', 'Acknowledged', 'Actioned', 'Declined']

/** §15 AC-15.4/15.5 — lead-carer relationships + regular-client continuity. */
export const LEAD_CARER = { 'su-mary': 'Aisha Khan (you)', 'su-doris': 'Priya Shah', 'su-george': 'Aisha Khan (you)' }
export const CONTINUITY = {
  'su-mary': { visits30d: 22, differentCarers: 3, lastGap: 'None', regular: true },
  'su-doris': { visits30d: 18, differentCarers: 6, lastGap: '4 days (annual leave cover)', regular: false },
  'su-george': { visits30d: 14, differentCarers: 2, lastGap: 'None', regular: true },
}
export const continuityFor = (id) => CONTINUITY[id] || { visits30d: 0, differentCarers: 0, lastGap: '—', regular: false }
export const leadCarerFor = (id) => LEAD_CARER[id] || 'Not assigned'

/** §23.3 — carer-updatable assessments (complete / update / flag-for-review, never author determinations). */
export const ASSESSMENTS = {
  'su-mary': [
    { name: 'Waterlow (pressure risk)', score: '15 — High', updated: '2026-06-20', by: 'A. Khan', carerEditable: true },
    { name: 'Malnutrition (MUST)', score: '1 — Medium', updated: '2026-06-18', by: 'A. Khan', carerEditable: true },
    { name: 'Falls (multifactorial)', score: 'Medium', updated: '2026-05-30', by: 'OT', carerEditable: false },
  ],
  'su-doris': [
    { name: 'Moving & handling', score: 'High — 2 carers', updated: '2026-06-10', by: 'OT', carerEditable: false },
    { name: 'Waterlow (pressure risk)', score: '18 — Very high', updated: '2026-06-22', by: 'P. Shah', carerEditable: true },
  ],
}
export const assessmentsFor = (id) => ASSESSMENTS[id] || []

/** §29a — per-person document set, openable offline. */
export const DOCUMENT_SET = {
  'su-mary': [
    { name: 'Care plan (v4)', type: 'Care plan', date: '15 Jun 2026', icon: 'file-check', offline: true },
    { name: 'MAR chart', type: 'Medication', date: 'Live', icon: 'pill', offline: true },
    { name: 'Waterlow & MUST assessments', type: 'Risk assessment', date: '20 Jun 2026', icon: 'shield', offline: true },
    { name: 'Body map history', type: 'Skin', date: '02 Jul 2026', icon: 'activity', offline: true },
    { name: 'Hospital passport', type: 'Clinical', date: '10 Jan 2026', icon: 'info', offline: true },
    { name: 'ReSPECT / DNACPR', type: 'Emergency', date: '05 Mar 2026', icon: 'heart', offline: true, critical: true },
    { name: 'Daily log / care diary', type: 'Daily log', date: 'Live', icon: 'clipboard', offline: true },
  ],
}
export const documentSetFor = (id) => DOCUMENT_SET[id] || []
export const SHARE_TARGETS = ['District nurse (secure NHS email)', 'GP practice (secure NHS email)', 'Paramedic (on scene)', 'Hospital ward (secure)']
