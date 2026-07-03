/** Versioning, audit trail, approval queue and role permissions. */

export const TEMPLATE_VERSIONS = {
  'hyd-offer-drink': [
    { version: 'v3.0', date: '2026-03-15', status: 'published', by: 'R. Okafor (Registered Manager)', reason: 'Added "no fluid in 6 hours" critical alert and running daily total.', change: 'major' },
    { version: 'v2.0', date: '2026-01-08', status: 'deprecated', by: 'R. Okafor', reason: 'Evidence schema changed — added refusal reason field.', change: 'major' },
    { version: 'v1.1', date: '2025-11-20', status: 'deprecated', by: 'J. Mensah (Clinical Lead)', reason: 'Wording change to carer instruction.', change: 'minor' },
    { version: 'v1.0', date: '2025-10-30', status: 'deprecated', by: 'R. Okafor', reason: 'Initial approved template.', change: 'initial' },
  ],
  'med-morning-prompt': [
    { version: 'v1.0', date: '2026-02-12', status: 'published', by: 'R. Okafor (Registered Manager)', reason: 'Initial approved template.', change: 'initial' },
  ],
}

export const AUDIT_LOG = [
  { id: 'a1', entity: 'Template', name: 'Offer drink & record fluid amount', action: 'Published v3.0', by: 'R. Okafor', role: 'Registered Manager', at: '2026-03-15 09:42', reason: 'Added critical no-fluid alert' },
  { id: 'a2', entity: 'Template', name: 'Record oxygen saturation (SpO₂)', action: 'Created draft', by: 'L. Adeyemi', role: 'Care Coordinator', at: '2026-06-28 14:10', reason: 'New observation requested by GP' },
  { id: 'a3', entity: 'Service-user task', name: 'Mary Adams · Check pressure areas', action: 'Personalised & published', by: 'L. Adeyemi', role: 'Care Coordinator', at: '2026-06-20 11:05', reason: 'Heel redness — added daily check' },
  { id: 'a4', entity: 'Pack', name: 'Hospital Discharge Pack', action: 'Applied to George Bell', by: 'L. Adeyemi', role: 'Care Coordinator', at: '2026-06-18 16:30', reason: 'Discharged 18 June' },
  { id: 'a5', entity: 'Template', name: 'Bedtime fluid top-up to daily target', action: 'Submitted for approval', by: 'L. Adeyemi', role: 'Care Coordinator', at: '2026-06-27 10:15', reason: 'Awaiting governance review' },
  { id: 'a6', entity: 'Template', name: 'Vacuum living areas (legacy)', action: 'Retired v2.1', by: 'R. Okafor', role: 'Registered Manager', at: '2026-05-02 13:20', reason: 'Merged into Light cleaning' },
  { id: 'a7', entity: 'Visit task', name: 'Doris Finch · Prompt lunch medication', action: 'Outcome: no record — alert raised', by: 'System', role: 'Automated', at: '2026-06-30 12:45', reason: 'Required-before-completion breach' },
  { id: 'a8', entity: 'Template', name: 'Hoist transfer from bed to chair', action: 'Approved v1.0', by: 'J. Mensah', role: 'Clinical Lead', at: '2026-02-11 09:00', reason: 'Linked to M&H risk assessment' },
]

export const APPROVAL_QUEUE = [
  { id: 'q1', templateId: 'hyd-bedtime-target', name: 'Bedtime fluid top-up to daily target', category: 'Hydration', type: 'Measurement task', submittedBy: 'L. Adeyemi', submittedAt: '2026-06-27', stage: 'Clinical review', version: 'v0.3' },
  { id: 'q2', templateId: 'obs-spo2', name: 'Record oxygen saturation (SpO₂)', category: 'Health Observations', type: 'Measurement task', submittedBy: 'L. Adeyemi', submittedAt: '2026-06-28', stage: 'Draft — not submitted', version: 'v0.1' },
]

export const ROLES = [
  { role: 'System Admin', desc: 'Full configuration of templates, categories and permissions.', perms: { manageTemplates: 'full', approve: true, apply: true, complete: true, governance: 'full', reports: 'full' } },
  { role: 'Registered Manager', desc: 'Approve templates, publish packs, override critical rules.', perms: { manageTemplates: 'edit', approve: true, apply: true, complete: true, governance: 'full', reports: 'full' } },
  { role: 'Care Coordinator', desc: 'Create/edit drafts and apply templates to service users.', perms: { manageTemplates: 'draft', approve: false, apply: true, complete: false, governance: 'view', reports: 'view' } },
  { role: 'Senior Carer', desc: 'Suggest templates and review task outcomes.', perms: { manageTemplates: 'suggest', approve: false, apply: false, complete: true, governance: 'view', reports: 'view' } },
  { role: 'Carer', desc: 'Complete visit task instances only.', perms: { manageTemplates: 'none', approve: false, apply: false, complete: true, governance: 'none', reports: 'none' } },
  { role: 'Auditor / Compliance', desc: 'View templates, history, evidence and reports.', perms: { manageTemplates: 'view', approve: false, apply: false, complete: false, governance: 'view', reports: 'full' } },
  { role: 'Family Portal User', desc: 'View selected completed tasks only.', perms: { manageTemplates: 'none', approve: false, apply: false, complete: false, governance: 'none', reports: 'none' } },
]

export const PERMISSION_RULES = [
  'Only approved users can publish templates.',
  'Medication templates require medication permission.',
  'Moving & handling templates require risk-assessment permission.',
  'End-of-life templates require senior approval.',
  'Retired templates cannot be applied to new service users.',
  'Used templates cannot be deleted, only retired.',
]
