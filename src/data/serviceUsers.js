/** Service users with personalised task plans and active risks. */
export const SERVICE_USERS = [
  {
    id: 'su-mary', name: 'Mary Adams', initials: 'MA', dob: '1939-04-12', age: 87,
    nhs: '485 777 3456', address: '14 Elm Court, Riverside', package: 'Domiciliary — 4 visits/day',
    keyContact: 'Daughter — Susan Adams', gp: 'Riverside Medical Practice', color: 'primary',
    risks: ['Dehydration risk', 'Falls risk', 'Pressure ulcer risk'],
    flags: ['Diabetes', 'Early dementia'], activeTaskCount: 11, openExceptions: 3,
    startedCare: '2025-11-03',
    allergies: ['Penicillin', 'Elastoplast'],
    access: 'Key safe by front door — code on carer profile',
    aboutMe: 'Former primary-school teacher. Hard of hearing on the left — approach from the right. Likes Radio 2, tea with milk (no sugar) and orange squash. Prefers female carers for personal care.',
    emergencyContact: 'Susan Adams (daughter) · 07700 900112',
    dnacpr: false, resus: 'For CPR', allergyStatus: 'confirmed', keySafeCode: '4729',
    commsNeeds: { format: 'Spoken English', bsl: false, hearing: 'Hard of hearing (left ear)', vision: 'Reading glasses', easyRead: false, largePrint: false, aid: 'Approach from the right; speak clearly', review: '2026-08-12' },
    careNeeds: [
      { icon: 'pill', label: 'Diabetes (Type 2)', lines: ['Metformin AM & PM · check blood glucose before breakfast', 'Report readings <4 or >15 mmol/L. Hypo kit (glucose gel) in the kitchen drawer.'] },
      { icon: 'brain', label: 'Memory & orientation', lines: ['Early dementia — reorientate gently and keep to her routine', 'Prompt fluids every visit (1500ml/day target). Prefers female carers for personal care.'] },
      { icon: 'footprints', label: 'Falls & mobility', lines: ['Independent with a frame indoors — keep it within reach; clear walkways.'] },
    ],
  },
  { id: 'su-george', name: 'George Bell', initials: 'GB', dob: '1945-08-30', age: 80, nhs: '485 222 1190', address: '3 Oak Lane', package: 'Domiciliary — 2 visits/day', keyContact: 'Son — Peter Bell', gp: 'Parkside Surgery', color: 'teal', risks: ['Falls risk'], flags: ['COPD'], activeTaskCount: 6, openExceptions: 1, startedCare: '2026-01-19', allergies: [], allergyStatus: 'unknown', dob2: '1945-08-30', keySafeCode: '2043', resus: 'For CPR', aboutMe: 'Retired electrician. Widower, lives alone with his cat Tess. Enjoys the football and a good chat. Independent-minded — offer help, don\'t take over.', emergencyContact: 'Peter Bell (son) · 07700 900233',
    careNeeds: [
      { icon: 'wind', label: 'Respiratory (COPD)', lines: ['Salbutamol & Seretide inhalers — check technique; spacer in use', 'Watch for increased breathlessness, wheeze, colour change or new confusion — escalate. Home O2 2L via nasal cannula PRN.'] },
      { icon: 'footprints', label: 'Falls', lines: ['History of falls — encourage walking stick; check footwear and clear the floor.'] },
    ] },
  { id: 'su-doris', name: 'Doris Finch', initials: 'DF', dob: '1937-02-04', age: 89, nhs: '485 909 7781', address: '22 Willow Way', package: 'Domiciliary — 3 visits/day', keyContact: 'Niece — Karen Finch', gp: 'Riverside Medical Practice', color: 'warning', risks: ['Moving & handling — high risk', 'Pressure ulcer risk'], flags: ['Hoist transfer', 'Catheter'], activeTaskCount: 9, openExceptions: 2, startedCare: '2025-09-12', allergies: ['Latex'], allergyStatus: 'confirmed', keySafeCode: '1180', resus: 'DNACPR — ReSPECT in place', aboutMe: 'Retired seamstress and lifelong Willow Way resident. Registered partially sighted — announce yourself on entry and keep her room layout unchanged. Enjoys the radio and a milky coffee. Prefers to be called Doris. Can feel anxious during hoist transfers — explain each step first.', emergencyContact: 'Karen Finch (niece) · 07700 900456', careNeeds: [
      { icon: 'droplet', label: 'Catheter', lines: ['Indwelling urethral (Foley) · 14Ch · balloon 10ml', 'Last changed 20/06/2026 · next due 15/08/2026', 'Leg bag by day, 2L night bag overnight. Keep below bladder level; monitor output and for bypassing / blockage.'] },
      { icon: 'users', label: 'Moving & handling', lines: ['Full hoist transfer — two carers required', 'Molift Smart hoist · Universal sling size M (green loops)', 'Explain each step first — she can feel anxious. Check skin & heels at every transfer.'] },
      { icon: 'utensils', label: 'Eating & drinking', lines: ['Dysphagia — SALT plan: food IDDSI Level 5 (minced & moist), fluids Level 2 (mildly thick)', 'Sit fully upright; encourage slow sips. SALT reviewed 05/2026.'] },
    ], commsNeeds: { format: 'Spoken English', bsl: false, hearing: 'Good', vision: 'Registered partially sighted', easyRead: true, largePrint: true, aid: 'Large-print materials; announce yourself on entry', review: '2026-07-18' } },
  { id: 'su-harold', name: 'Harold Price', initials: 'HP', dob: '1942-11-21', age: 83, nhs: '485 444 6655', address: '8 Maple Drive', package: 'Palliative — 4 visits/day', keyContact: 'Wife — Edith Price', gp: 'Parkside Surgery', color: 'danger', risks: ['End of life', 'Pressure ulcer risk'], flags: ['Palliative', 'Syringe driver'], activeTaskCount: 8, openExceptions: 0, startedCare: '2026-05-28', allergies: [], allergyStatus: 'incomplete', keySafeCode: '7788', resus: 'DNACPR — ReSPECT in place', aboutMe: 'Retired teacher, married to Edith for 54 years. A gentle man who loves classical music — keep it playing softly. May be drowsy; still speak to him and explain each step.', emergencyContact: 'Edith Price (wife) · 07700 900377', commsNeeds: { format: 'Spoken English', bsl: false, hearing: 'Good', vision: 'Good', easyRead: false, largePrint: false, aid: 'May drift in and out of sleep — announce yourself, speak gently and explain care even if he seems asleep.', review: '2026-06-30' },
    careNeeds: [
      { icon: 'pill', label: 'Syringe driver', lines: ['CD syringe driver (McKinley T34) — sited left upper arm', 'Check site each visit for redness/swelling; confirm it is running, battery ok and rate unchanged. Do not flush. Anticipatory meds in the green box.'] },
      { icon: 'heart', label: 'End of life care', lines: ['Palliative, comfort-focused. ReSPECT: DNACPR in place.', 'Mouth care every visit; reposition 2-hourly for comfort. Involve his wife Edith in all decisions.'] },
      { icon: 'person-standing', label: 'Skin & pressure', lines: ['High pressure-ulcer risk — pressure-relieving mattress in use', 'Inspect heels & sacrum each visit; log and report any change.'] },
    ] },
]

export function getServiceUser(id) {
  return SERVICE_USERS.find((s) => s.id === id)
}
