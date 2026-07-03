/** Task Packs — curated groups of templates applied together. */
export const PACKS = [
  {
    id: 'pack-morning-care', name: 'Morning Personal Care Pack', icon: 'bath', color: 'primary',
    description: 'Core morning support for a new domiciliary package.', useCase: 'New package · Older adult · Hospital discharge',
    defaultVisits: ['Morning'], status: 'published', version: 'v2.0', approvedBy: 'R. Okafor', approvedAt: '2026-02-20',
    items: [
      { templateId: 'pc-morning-wash', required: true, visit: 'Morning' },
      { templateId: 'pc-oral-care', required: true, visit: 'Morning' },
      { templateId: 'med-morning-prompt', required: true, visit: 'Morning' },
      { templateId: 'hyd-offer-drink', required: true, visit: 'Morning' },
      { templateId: 'skn-pressure-areas', required: false, visit: 'Morning' },
      { templateId: 'obs-mood', required: false, visit: 'Morning' },
    ],
  },
  {
    id: 'pack-hydration', name: 'Hydration Monitoring Pack', icon: 'droplet', color: 'info',
    description: 'Full-day fluid monitoring against a configurable target.', useCase: 'Dehydration risk · UTI risk · Hot weather plan',
    defaultVisits: ['Morning', 'Lunch', 'Tea', 'Bedtime'], status: 'published', version: 'v1.3', approvedBy: 'R. Okafor', approvedAt: '2026-03-01',
    items: [
      { templateId: 'hyd-offer-drink', required: true, visit: 'Morning' },
      { templateId: 'hyd-offer-drink', required: true, visit: 'Lunch' },
      { templateId: 'hyd-offer-drink', required: true, visit: 'Tea' },
      { templateId: 'hyd-within-reach', required: true, visit: 'Bedtime' },
      { templateId: 'hyd-encourage', required: false, visit: 'Any Visit' },
    ],
  },
  {
    id: 'pack-falls', name: 'Falls Prevention Pack', icon: 'shield', color: 'warning',
    description: 'Environment and mobility checks to reduce falls.', useCase: 'High falls risk · Recent fall · Post-discharge',
    defaultVisits: ['Morning', 'Bedtime'], status: 'published', version: 'v1.1', approvedBy: 'R. Okafor', approvedAt: '2026-02-18',
    items: [
      { templateId: 'mob-aid-check', required: true, visit: 'Bedtime' },
      { templateId: 'saf-trip-hazards', required: true, visit: 'Any Visit' },
      { templateId: 'saf-pendant', required: true, visit: 'Bedtime' },
      { templateId: 'saf-bedtime-check', required: true, visit: 'Bedtime' },
      { templateId: 'saf-post-fall', required: false, visit: 'Any Visit' },
    ],
  },
  {
    id: 'pack-medication', name: 'Medication Support Pack', icon: 'pill', color: 'danger',
    description: 'Structured medication prompts and follow-ups.', useCase: 'Medication support · New medication · Family monitoring',
    defaultVisits: ['Morning', 'Lunch', 'Tea', 'Bedtime'], status: 'published', version: 'v2.2', approvedBy: 'R. Okafor', approvedAt: '2026-03-10',
    items: [
      { templateId: 'med-morning-prompt', required: true, visit: 'Morning' },
      { templateId: 'med-prn', required: false, visit: 'Any Visit' },
      { templateId: 'med-stock', required: false, visit: 'Any Visit' },
      { templateId: 'med-refusal-followup', required: false, visit: 'Any Visit' },
    ],
  },
  {
    id: 'pack-discharge', name: 'Hospital Discharge Pack', icon: 'file-check', color: 'teal',
    description: '72-hour increased monitoring after discharge.', useCase: 'Recently discharged · Short-term reablement',
    defaultVisits: ['Morning', 'Lunch', 'Tea', 'Bedtime'], status: 'published', version: 'v1.0', approvedBy: 'R. Okafor', approvedAt: '2026-04-02',
    items: [
      { templateId: 'med-morning-prompt', required: true, visit: 'Morning' },
      { templateId: 'obs-pain', required: true, visit: 'Morning' },
      { templateId: 'mob-aid-check', required: true, visit: 'Bedtime' },
      { templateId: 'nut-lunch', required: true, visit: 'Lunch' },
      { templateId: 'hyd-offer-drink', required: true, visit: 'Tea' },
      { templateId: 'skn-pressure-areas', required: true, visit: 'Bedtime' },
    ],
  },
  {
    id: 'pack-dementia', name: 'Dementia Support Pack', icon: 'brain', color: 'primary',
    description: 'Orientation, reassurance and distress monitoring.', useCase: 'Dementia · Anxiety · Sundowning',
    defaultVisits: ['Morning', 'Tea', 'Bedtime'], status: 'published', version: 'v1.2', approvedBy: 'R. Okafor', approvedAt: '2026-03-22',
    items: [
      { templateId: 'dem-orientation', required: true, visit: 'Morning' },
      { templateId: 'hyd-encourage', required: false, visit: 'Lunch' },
      { templateId: 'dem-evening-reassure', required: true, visit: 'Tea' },
      { templateId: 'dem-wandering', required: false, visit: 'Bedtime' },
    ],
  },
  {
    id: 'pack-eol', name: 'End of Life Comfort Pack', icon: 'heart', color: 'danger',
    description: 'Comfort-focused palliative care (restricted).', useCase: 'Palliative · End-of-life · Comfort care',
    defaultVisits: ['Morning', 'Lunch', 'Tea', 'Bedtime'], status: 'published', version: 'v1.0', approvedBy: 'R. Okafor', approvedAt: '2026-04-15', restricted: true,
    items: [
      { templateId: 'eol-comfort', required: true, visit: 'Any Visit' },
      { templateId: 'obs-pain', required: true, visit: 'Any Visit' },
      { templateId: 'eol-mouth-care', required: true, visit: 'Any Visit' },
      { templateId: 'mob-reposition', required: true, visit: 'Any Visit' },
    ],
  },
]

export function getPack(id) {
  return PACKS.find((p) => p.id === id)
}
