/**
 * Service-User Task Plan — personalised tasks for Mary Adams, derived from
 * master templates. Each carries personalised instruction text plus the
 * weekly schedule and today's status used by the planner views.
 */
const ALL = [true, true, true, true, true, true, true]
const WEEKDAYS = [true, true, true, true, true, false, false]

export const SERVICE_USER_TASKS = {
  'su-mary': [
    {
      id: 'sut-1', sourceTemplateId: 'pc-morning-wash', version: 'v1.0', title: 'Support with morning wash & dressing',
      categoryId: 'personal-care', type: 'instruction', priority: 'essential', visit: 'Morning', frequency: 'Daily', week: ALL,
      instructions: 'Mary likes to wash at the sink and prefers to choose her own cardigan. Encourage independence with buttons.',
      todayStatus: 'completed', lastOutcome: 'Completed', startDate: '2025-11-03', reviewDate: '2026-08-01',
    },
    {
      id: 'sut-2', sourceTemplateId: 'med-morning-prompt', version: 'v1.0', title: 'Prompt morning medication',
      categoryId: 'medication', type: 'medication', priority: 'critical', visit: 'Morning', frequency: 'Daily', week: ALL,
      medIds: ['m-metformin', 'm-amlodipine'],
      instructions: 'Metformin 500mg + Amlodipine 5mg. Mary takes these with breakfast. Record outcome on eMAR.',
      todayStatus: 'completed', lastOutcome: 'Given', startDate: '2025-11-03', reviewDate: '2026-07-15',
    },
    {
      id: 'sut-3', sourceTemplateId: 'hyd-offer-drink', version: 'v3.0', title: 'Offer drink & record fluid amount',
      categoryId: 'hydration', type: 'measurement', priority: 'essential', visit: 'Morning', frequency: 'Each visit', week: ALL,
      instructions: 'Mary prefers tea with milk in the morning, orange squash at lunch. Target: 1500ml/day, 250ml by lunch.',
      todayStatus: 'completed', lastOutcome: '180ml — tea', target: 1500, startDate: '2025-11-03', reviewDate: '2026-07-20',
    },
    {
      id: 'sut-4', sourceTemplateId: 'skn-pressure-areas', version: 'v1.0', title: 'Check pressure areas',
      categoryId: 'skin', type: 'bodymap', priority: 'essential', visit: 'Morning', frequency: 'Daily', week: ALL,
      instructions: 'Check sacrum and heels. Mary has had redness on left heel previously — note any changes.',
      todayStatus: 'flagged', lastOutcome: 'Redness — left heel', startDate: '2025-12-01', reviewDate: '2026-07-01',
    },
    {
      id: 'sut-5', sourceTemplateId: 'rea-dressing', version: 'v1.0', title: 'Encourage independent dressing',
      categoryId: 'reablement', type: 'goal', priority: 'recommended', visit: 'Morning', frequency: 'Daily', week: WEEKDAYS,
      instructions: 'Goal: dress upper body independently by August. Prompt only — do not assist unless asked.',
      todayStatus: 'completed', lastOutcome: 'Prompted', startDate: '2026-05-01', reviewDate: '2026-07-07',
    },
    {
      id: 'sut-6', sourceTemplateId: 'nut-lunch', version: 'v1.0', title: 'Prepare lunch & record food intake',
      categoryId: 'nutrition', type: 'food', priority: 'important', visit: 'Lunch', frequency: 'Daily', week: ALL,
      instructions: 'Soft diet. Mary enjoys cottage pie and fish. Record amount eaten; flag if less than half.',
      todayStatus: 'pending', lastOutcome: 'Most', startDate: '2025-11-03', reviewDate: '2026-08-01',
    },
    {
      id: 'sut-7', sourceTemplateId: 'hyd-offer-drink', version: 'v3.0', title: 'Offer drink & record fluid amount',
      categoryId: 'hydration', type: 'measurement', priority: 'essential', visit: 'Lunch', frequency: 'Each visit', week: ALL,
      instructions: 'Orange squash preferred at lunch. Check running total toward 1500ml target.',
      todayStatus: 'pending', lastOutcome: '—', target: 1500, startDate: '2025-11-03', reviewDate: '2026-07-20',
    },
    {
      id: 'sut-8', sourceTemplateId: 'obs-mood', version: 'v1.0', title: 'Mood & wellbeing check',
      categoryId: 'wellbeing', type: 'observation', priority: 'recommended', visit: 'Tea', frequency: 'Daily', week: ALL,
      instructions: 'Mary can become low in the afternoon. Note mood (1–5) and any anxiety.',
      todayStatus: 'pending', lastOutcome: '2/5 — low', startDate: '2026-02-10', reviewDate: '2026-07-10',
    },
    {
      id: 'sut-9', sourceTemplateId: 'dem-evening-reassure', version: 'v1.0', title: 'Evening reassurance routine',
      categoryId: 'dementia', type: 'instruction', priority: 'important', visit: 'Tea', frequency: 'Daily', week: ALL,
      instructions: 'Use a calm tone, remind Mary of the bedtime routine. Reduce TV noise; she likes Radio 2.',
      todayStatus: 'pending', lastOutcome: 'Settled', startDate: '2026-02-10', reviewDate: '2026-07-10',
    },
    {
      id: 'sut-10', sourceTemplateId: 'saf-bedtime-check', version: 'v1.0', title: 'Bedtime safety check',
      categoryId: 'falls-safety', type: 'checklist', priority: 'important', visit: 'Bedtime', frequency: 'Daily', week: ALL,
      instructions: 'Confirm pendant alarm on bedside, frame within reach, hall light on, doors locked.',
      todayStatus: 'pending', lastOutcome: 'All checked', startDate: '2025-11-03', reviewDate: '2026-08-01',
    },
    {
      id: 'sut-11', sourceTemplateId: 'hyd-within-reach', version: 'v1.0', title: 'Leave drink within reach',
      categoryId: 'hydration', type: 'simple', priority: 'recommended', visit: 'Bedtime', frequency: 'Daily', week: ALL,
      instructions: 'Leave covered beaker of squash on bedside table within reach.',
      todayStatus: 'pending', lastOutcome: 'Done', startDate: '2025-11-03', reviewDate: '2026-08-01',
    },
  ],
}

export const VISIT_BLOCKS = [
  { visit: 'Morning', time: '07:30 – 08:15', carer: 'Aisha Khan' },
  { visit: 'Lunch', time: '12:15 – 12:45', carer: 'Aisha Khan' },
  { visit: 'Tea', time: '17:00 – 17:30', carer: 'Daniel Roy' },
  { visit: 'Bedtime', time: '21:00 – 21:30', carer: 'Daniel Roy' },
]

export function tasksForUser(userId) {
  return SERVICE_USER_TASKS[userId] || []
}
