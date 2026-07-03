/**
 * Master Task Template catalog. Each entry is a governed, reusable template
 * shaped to the data model (task_templates + current version fields flattened
 * for the prototype). Built via mk() which fills sensible enterprise defaults.
 */
import { SCHEMAS } from './schemas.js'

let n = 1000
const code = (cat) => `${cat}-${String(++n).slice(1)}`

function mk(o) {
  return {
    id: o.id,
    code: o.code || code(o.cat?.toUpperCase() || 'TPL'),
    name: o.name,
    categoryId: o.categoryId,
    subcategory: o.subcategory || '',
    type: o.type || 'simple',
    description: o.description || '',
    purpose: o.purpose || '',
    priority: o.priority || 'recommended',
    defaultVisits: o.defaultVisits || ['Any Visit'],
    frequency: o.frequency || 'Daily',
    duration: o.duration || 10,
    carePlanDomain: o.carePlanDomain || '',
    riskLink: o.riskLink || null,
    cqcTags: o.cqcTags || ['Safe'],
    qualityStatement: o.qualityStatement || null,
    evidenceSchema: o.evidenceSchema || SCHEMAS.completion,
    completionRule: o.completionRule || 'recommended',
    alertRules: o.alertRules || [],
    dependencies: o.dependencies || [],
    instructions: {
      short: o.short || o.name,
      detailed: o.detailed || '',
      dosDonts: o.dosDonts || [],
      dignity: o.dignity || '',
      escalation: o.escalation || '',
    },
    visibility: o.visibility || { carer: true, office: true, family: false, reports: true, carePlanPrint: true, auditPack: true },
    governance: {
      status: o.status || 'published',
      version: o.version || 'v1.0',
      ownerTeam: o.ownerTeam || 'Care Governance',
      approvedBy: o.approvedBy || 'R. Okafor (Registered Manager)',
      approvedAt: o.approvedAt || '2026-02-12',
      changeReason: o.changeReason || 'Initial approved template',
    },
    usedByCount: o.usedByCount ?? Math.floor(20 + (o.id?.length || 5) * 3),
    isSystem: o.isSystem ?? true,
  }
}

const alert = (label, severity, condition) => ({ id: label.toLowerCase().replace(/\W+/g, '-'), label, severity, condition })

export const TEMPLATES = [
  /* ============================ Personal Care ============================ */
  mk({
    id: 'pc-morning-wash', categoryId: 'personal-care', subcategory: 'Washing & Dressing',
    name: 'Support with morning wash and dressing', type: 'instruction', priority: 'essential',
    code: 'PC-0101', defaultVisits: ['Morning'], duration: 25,
    description: 'Assist with personal washing and dressing at the morning visit, promoting independence and dignity.',
    purpose: 'Maintains hygiene, skin integrity, dignity and a positive start to the day.',
    carePlanDomain: 'Personal Hygiene', cqcTags: ['Safe', 'Caring', 'Responsive'],
    evidenceSchema: SCHEMAS.completionNote, completionRule: 'essential',
    short: 'Support Mary with morning wash and dressing at the sink.',
    detailed: 'Support with washing at the sink, oral care and dressing. Offer choice of clothing.',
    dosDonts: ['Knock before entering', 'Encourage independence', 'Offer choice of clothing', 'Do not rush'],
    dignity: 'Maintain privacy at all times; cover where possible.',
    escalation: 'Report any new skin marks or refusal pattern to the office.',
    alertRules: [alert('Refused twice in 7 days', 'medium', 'refusals(7d) >= 2')],
    usedByCount: 64,
  }),
  mk({ id: 'pc-oral-care', categoryId: 'personal-care', subcategory: 'Oral Care', name: 'Oral / denture care', type: 'simple', defaultVisits: ['Morning', 'Bedtime'], carePlanDomain: 'Personal Hygiene', cqcTags: ['Safe', 'Effective'], usedByCount: 41 }),
  mk({ id: 'pc-shower', categoryId: 'personal-care', subcategory: 'Washing & Dressing', name: 'Shower support', type: 'instruction', priority: 'important', defaultVisits: ['Morning'], duration: 30, carePlanDomain: 'Personal Hygiene', riskLink: 'Slips & falls (bathroom)', dignity: 'Ensure non-slip mat and warm room.', usedByCount: 33 }),
  mk({ id: 'pc-skin-observe', categoryId: 'personal-care', subcategory: 'Skin', name: 'Skin observation during personal care', type: 'bodymap', priority: 'essential', defaultVisits: ['Morning'], evidenceSchema: SCHEMAS.bodymap, completionRule: 'essential', carePlanDomain: 'Skin Integrity', riskLink: 'Pressure ulcer risk', cqcTags: ['Safe', 'Effective'], alertRules: [alert('Redness or broken skin', 'high', "condition in ['Redness','Broken skin']")], usedByCount: 38 }),
  mk({ id: 'pc-grooming', categoryId: 'personal-care', subcategory: 'Grooming', name: 'Support with personal grooming', type: 'simple', priority: 'recommended', carePlanDomain: 'Personal Hygiene', cqcTags: ['Caring'], usedByCount: 19 }),

  /* ============================ Medication ============================ */
  mk({
    id: 'med-morning-prompt', categoryId: 'medication', subcategory: 'Administration',
    name: 'Prompt morning medication', type: 'medication', priority: 'critical', code: 'MED-0201',
    defaultVisits: ['Morning'], duration: 10,
    description: 'eMAR-linked prompt to support the person to take their morning medication.',
    purpose: 'Ensures prescribed medicines are taken safely and outcomes are accurately recorded.',
    carePlanDomain: 'Medication', riskLink: 'Medication error risk', cqcTags: ['Safe', 'Effective'],
    evidenceSchema: SCHEMAS.medication, completionRule: 'required_before_visit',
    dependencies: ['Requires active medication profile', 'Requires eMAR link', 'Requires medication permission'],
    short: 'Prompt morning medication and record the outcome on the eMAR.',
    detailed: 'Confirm medication against the eMAR. Record outcome, time and reason if not given. Cannot end visit until outcome recorded.',
    escalation: 'Immediate office alert if refused, withheld or not available.',
    alertRules: [
      alert('Medication refused', 'high', "outcome == 'Refused'"),
      alert('Medication missed / no outcome', 'critical', 'outcome == null at visit end'),
      alert('Not available', 'high', "outcome == 'Not available'"),
    ],
    visibility: { carer: true, office: true, family: true, reports: true, carePlanPrint: true, auditPack: true },
    usedByCount: 58,
  }),
  mk({ id: 'med-prn', categoryId: 'medication', subcategory: 'PRN', name: 'PRN medication support', type: 'medication', priority: 'essential', defaultVisits: ['Any Visit'], frequency: 'As required', evidenceSchema: SCHEMAS.medication, completionRule: 'essential', dependencies: ['Requires PRN protocol', 'Requires eMAR link'], carePlanDomain: 'Medication', cqcTags: ['Safe'], alertRules: [alert('PRN given — review', 'medium', "outcome == 'Given'")], usedByCount: 27 }),
  mk({ id: 'med-cream', categoryId: 'medication', subcategory: 'Topical', name: 'Apply prescribed cream', type: 'medication', priority: 'important', defaultVisits: ['Morning', 'Bedtime'], evidenceSchema: SCHEMAS.medication, dependencies: ['Requires eMAR link', 'Requires body map'], carePlanDomain: 'Medication', usedByCount: 22 }),
  mk({ id: 'med-stock', categoryId: 'medication', subcategory: 'Stock', name: 'Medication stock check', type: 'checklist', priority: 'recommended', frequency: 'Weekly', evidenceSchema: SCHEMAS.checklist(['Sufficient stock for 7 days', 'No expired medicines', 'MAR chart present']), carePlanDomain: 'Medication', cqcTags: ['Safe', 'Well-led'], usedByCount: 14 }),
  mk({ id: 'med-refusal-followup', categoryId: 'medication', subcategory: 'Follow-up', name: 'Medication refusal follow-up', type: 'followup', priority: 'essential', frequency: 'Triggered', evidenceSchema: SCHEMAS.concern, completionRule: 'manager_review', carePlanDomain: 'Medication', cqcTags: ['Safe', 'Well-led'], short: 'Office follow-up after repeated medication refusal.', detailed: 'Triggered by 2 refusals in 7 days. Assigned to care coordinator. Contact family / GP and record outcome.', alertRules: [alert('Follow-up overdue', 'high', 'unactioned(24h)')], usedByCount: 9 }),

  /* ============================ Nutrition ============================ */
  mk({
    id: 'nut-lunch', categoryId: 'nutrition', subcategory: 'Meal Support', code: 'NUT-0301',
    name: 'Prepare lunch and record food intake', type: 'food', priority: 'important',
    defaultVisits: ['Lunch'], duration: 30,
    description: 'Prepare a suitable lunch and record how much was eaten.',
    purpose: 'Monitors nutrition and flags poor intake early.',
    carePlanDomain: 'Nutrition & Hydration', riskLink: 'Malnutrition risk', cqcTags: ['Effective', 'Responsive'],
    evidenceSchema: SCHEMAS.food, completionRule: 'important',
    short: 'Prepare lunch to preference and record amount eaten.',
    detailed: 'Offer preferred meal, support as needed, record amount eaten and any concerns.',
    alertRules: [alert('Poor intake 2 consecutive meals', 'medium', "amountEaten in ['Little','None'] x2")],
    usedByCount: 47,
  }),
  mk({ id: 'nut-breakfast', categoryId: 'nutrition', subcategory: 'Meal Support', name: 'Prepare breakfast', type: 'food', defaultVisits: ['Morning'], evidenceSchema: SCHEMAS.food, carePlanDomain: 'Nutrition & Hydration', usedByCount: 39 }),
  mk({ id: 'nut-assist-eat', categoryId: 'nutrition', subcategory: 'Eating Support', name: 'Assist with eating', type: 'food', priority: 'essential', defaultVisits: ['Lunch', 'Tea'], evidenceSchema: SCHEMAS.food, riskLink: 'Choking / swallowing risk', dependencies: ['Requires SALT plan if swallowing risk'], carePlanDomain: 'Nutrition & Hydration', cqcTags: ['Safe', 'Effective'], usedByCount: 21 }),
  mk({ id: 'nut-swallow', categoryId: 'nutrition', subcategory: 'Swallowing', name: 'Swallowing concern observation', type: 'observation', priority: 'essential', evidenceSchema: SCHEMAS.observationScore('Swallowing concern level', 0, 3, 0), riskLink: 'Choking / swallowing risk', carePlanDomain: 'Nutrition & Hydration', cqcTags: ['Safe'], alertRules: [alert('Swallowing difficulty observed', 'high', 'score >= 2')], usedByCount: 12 }),

  /* ============================ Hydration ============================ */
  mk({
    id: 'hyd-offer-drink', categoryId: 'hydration', subcategory: 'Hydration Monitoring', code: 'HYD-0401',
    name: 'Offer drink and record fluid amount', type: 'measurement', priority: 'essential',
    defaultVisits: ['Morning', 'Lunch', 'Tea', 'Bedtime'], frequency: 'Each visit', duration: 10,
    description: 'Offer a preferred drink at each visit and record the amount taken in ml.',
    purpose: 'Maintains hydration and provides a running daily fluid total for dehydration monitoring.',
    carePlanDomain: 'Nutrition & Hydration', riskLink: 'Dehydration risk', cqcTags: ['Safe', 'Effective', 'Responsive'],
    qualityStatement: 'Effective need assessment & care',
    evidenceSchema: SCHEMAS.fluid, completionRule: 'essential',
    dependencies: ['Requires hydration target configured for low-intake alerts'],
    short: 'Offer Mary preferred drink and record amount in ml. Target 250ml by lunch.',
    detailed: 'Offer preferred drink, encourage gently, record drink type and amount in ml. Leave a drink within reach.',
    dosDonts: ['Encourage sips throughout', 'Offer choice', 'Do not leave out of reach'],
    escalation: 'Escalate if total below target by tea visit.',
    alertRules: [
      alert('Below target by tea visit', 'medium', 'dailyTotalMl < target by Tea'),
      alert('Refused twice in 24 hours', 'high', 'refusals(24h) >= 2'),
      alert('No fluid recorded in 6 hours', 'critical', 'gap >= 6h'),
    ],
    visibility: { carer: true, office: true, family: true, reports: true, carePlanPrint: true, auditPack: true },
    usedByCount: 42,
  }),
  mk({ id: 'hyd-encourage', categoryId: 'hydration', subcategory: 'Hydration Monitoring', name: 'Encourage fluids', type: 'instruction', priority: 'recommended', defaultVisits: ['Any Visit'], evidenceSchema: SCHEMAS.instruction, carePlanDomain: 'Nutrition & Hydration', riskLink: 'Dehydration risk', usedByCount: 30 }),
  mk({ id: 'hyd-within-reach', categoryId: 'hydration', subcategory: 'Hydration Monitoring', name: 'Leave drink within reach', type: 'simple', defaultVisits: ['Bedtime'], carePlanDomain: 'Nutrition & Hydration', usedByCount: 36 }),
  mk({ id: 'hyd-thickened', categoryId: 'hydration', subcategory: 'Thickened Fluids', name: 'Thickened fluid support', type: 'measurement', priority: 'essential', evidenceSchema: SCHEMAS.fluid, riskLink: 'Choking / swallowing risk', dependencies: ['Requires SALT plan'], carePlanDomain: 'Nutrition & Hydration', cqcTags: ['Safe'], usedByCount: 11 }),

  /* ============================ Continence ============================ */
  mk({
    id: 'con-pad-change', categoryId: 'continence', subcategory: 'Continence Products', code: 'CON-0501',
    name: 'Pad change and continence support', type: 'simple', priority: 'essential',
    defaultVisits: ['Morning', 'Bedtime'], duration: 15,
    description: 'Provide continence support and change pad, checking skin.',
    purpose: 'Maintains dignity, comfort and skin integrity.',
    carePlanDomain: 'Continence', riskLink: 'Moisture-associated skin damage', cqcTags: ['Safe', 'Caring'],
    evidenceSchema: SCHEMAS.continence, completionRule: 'essential',
    dignity: 'Maintain privacy; explain each step.',
    alertRules: [alert('Skin redness or repeated refusal', 'high', "skin in ['Red','Sore','Broken']")],
    usedByCount: 28,
  }),
  mk({ id: 'con-toilet-prompt', categoryId: 'continence', subcategory: 'Toileting', name: 'Prompt toilet visit', type: 'simple', defaultVisits: ['Any Visit'], evidenceSchema: SCHEMAS.continence, carePlanDomain: 'Continence', usedByCount: 24 }),
  mk({ id: 'con-catheter', categoryId: 'continence', subcategory: 'Catheter', name: 'Catheter bag check & empty', type: 'measurement', priority: 'important', evidenceSchema: SCHEMAS.measurement('Output volume', 'ml', 0, 2000), riskLink: 'UTI risk', carePlanDomain: 'Continence', cqcTags: ['Safe', 'Effective'], usedByCount: 8 }),
  mk({ id: 'con-uti-watch', categoryId: 'continence', subcategory: 'Observation', name: 'Report signs of UTI', type: 'observation', priority: 'essential', evidenceSchema: SCHEMAS.observationScore('UTI sign severity', 0, 3, 0), riskLink: 'UTI risk', carePlanDomain: 'Continence', alertRules: [alert('Possible UTI signs', 'high', 'score >= 2')], usedByCount: 15 }),

  /* ============================ Mobility ============================ */
  mk({
    id: 'mob-hoist', categoryId: 'mobility', subcategory: 'Transfers', code: 'MOB-0601',
    name: 'Hoist transfer from bed to chair', type: 'instruction', priority: 'critical',
    defaultVisits: ['Morning'], duration: 20,
    description: 'Safe hoist transfer requiring two carers and the correct sling.',
    purpose: 'Enables safe transfer, preventing injury to the person and carers.',
    carePlanDomain: 'Mobility', riskLink: 'Moving & handling — high risk', cqcTags: ['Safe', 'Effective'],
    evidenceSchema: SCHEMAS.completionNote, completionRule: 'critical',
    dependencies: ['Requires moving & handling risk assessment', 'Requires two carers', 'Requires equipment: Hoist + sling'],
    short: 'Two-carer hoist transfer from bed to chair using prescribed sling.',
    detailed: 'Only proceed with two carers and the prescribed sling. Check sling condition before use.',
    dosDonts: ['Do NOT attempt alone', 'Check sling for wear', 'Confirm correct sling size'],
    escalation: 'Alert office immediately if attempted with one carer or equipment unavailable.',
    alertRules: [
      alert('Attempted with one carer', 'critical', 'carersAssigned < 2'),
      alert('Equipment unavailable', 'high', 'equipmentAvailable == false'),
    ],
    usedByCount: 17,
  }),
  mk({ id: 'mob-reposition', categoryId: 'mobility', subcategory: 'Repositioning', name: 'Pressure relief repositioning', type: 'simple', priority: 'essential', defaultVisits: ['Morning', 'Lunch', 'Tea', 'Bedtime'], frequency: 'Each visit', evidenceSchema: SCHEMAS.completionNote, completionRule: 'essential', riskLink: 'Pressure ulcer risk', carePlanDomain: 'Skin Integrity', cqcTags: ['Safe', 'Effective'], usedByCount: 26 }),
  mk({ id: 'mob-walk', categoryId: 'mobility', subcategory: 'Walking', name: 'Encourage safe walking with frame', type: 'instruction', defaultVisits: ['Any Visit'], dependencies: ['Requires equipment: walking frame'], riskLink: 'Falls risk', carePlanDomain: 'Mobility', usedByCount: 18 }),
  mk({ id: 'mob-aid-check', categoryId: 'mobility', subcategory: 'Safety', name: 'Check mobility aid is within reach', type: 'simple', priority: 'important', defaultVisits: ['Bedtime'], riskLink: 'Falls risk', carePlanDomain: 'Mobility', usedByCount: 31 }),

  /* ============================ Falls & Safety ============================ */
  mk({
    id: 'saf-bedtime-check', categoryId: 'falls-safety', subcategory: 'Environment', code: 'SAF-0701',
    name: 'Bedtime safety check', type: 'checklist', priority: 'important',
    defaultVisits: ['Bedtime'], duration: 10,
    description: 'End-of-day environment and safety checklist.',
    purpose: 'Reduces overnight risk of falls, cold and avoidable harm.',
    carePlanDomain: 'Home Safety', riskLink: 'Falls risk', cqcTags: ['Safe'],
    evidenceSchema: SCHEMAS.checklist(['Doors locked', 'Pendant alarm within reach', 'Water within reach', 'Pathway clear', 'Heating set', 'Lighting adequate']),
    completionRule: 'important',
    alertRules: [alert('Safety item not completed', 'medium', 'anyUnchecked')],
    usedByCount: 35,
  }),
  mk({ id: 'saf-trip-hazards', categoryId: 'falls-safety', subcategory: 'Environment', name: 'Remove trip hazards', type: 'simple', defaultVisits: ['Any Visit'], riskLink: 'Falls risk', carePlanDomain: 'Home Safety', usedByCount: 22 }),
  mk({ id: 'saf-pendant', categoryId: 'falls-safety', subcategory: 'Equipment', name: 'Check pendant alarm', type: 'simple', defaultVisits: ['Morning', 'Bedtime'], carePlanDomain: 'Home Safety', usedByCount: 29 }),
  mk({ id: 'saf-post-fall', categoryId: 'falls-safety', subcategory: 'Incidents', name: 'Post-fall observation', type: 'incident', priority: 'critical', frequency: 'Triggered', evidenceSchema: SCHEMAS.observationScore('Post-fall concern level', 0, 4, 0), completionRule: 'critical', dependencies: ['Links to incident record'], riskLink: 'Falls risk', carePlanDomain: 'Home Safety', cqcTags: ['Safe', 'Responsive'], alertRules: [alert('Post-fall concern', 'critical', 'score >= 1')], usedByCount: 6 }),

  /* ============================ Skin ============================ */
  mk({
    id: 'skn-pressure-areas', categoryId: 'skin', subcategory: 'Pressure Care', code: 'SKN-0801',
    name: 'Check pressure areas', type: 'bodymap', priority: 'essential',
    defaultVisits: ['Morning', 'Bedtime'], duration: 10,
    description: 'Inspect pressure areas and record condition on body map.',
    purpose: 'Early detection of pressure damage and timely escalation.',
    carePlanDomain: 'Skin Integrity', riskLink: 'Pressure ulcer risk', cqcTags: ['Safe', 'Effective'],
    evidenceSchema: SCHEMAS.bodymap, completionRule: 'essential',
    escalation: 'Escalate redness, broken skin or repeated soreness same day.',
    alertRules: [alert('Redness / broken skin / repeated soreness', 'high', "condition in ['Redness','Broken skin']")],
    usedByCount: 25,
  }),
  mk({ id: 'skn-barrier-cream', categoryId: 'skin', subcategory: 'Treatment', name: 'Apply barrier cream', type: 'simple', defaultVisits: ['Morning', 'Bedtime'], dependencies: ['Requires eMAR link if prescribed'], carePlanDomain: 'Skin Integrity', usedByCount: 20 }),
  mk({ id: 'skn-escalate', categoryId: 'skin', subcategory: 'Escalation', name: 'Escalate skin concern', type: 'followup', priority: 'essential', frequency: 'Triggered', evidenceSchema: SCHEMAS.concern, completionRule: 'manager_review', carePlanDomain: 'Skin Integrity', cqcTags: ['Safe', 'Responsive'], usedByCount: 7 }),

  /* ============================ Observations ============================ */
  mk({
    id: 'obs-blood-sugar', categoryId: 'observations', subcategory: 'Measurements', code: 'OBS-0901',
    name: 'Record blood sugar', type: 'measurement', priority: 'essential',
    defaultVisits: ['Morning', 'Tea'], duration: 5,
    description: 'Record blood glucose reading with meal relation.',
    purpose: 'Monitors diabetes control and triggers escalation if outside safe range.',
    carePlanDomain: 'Health & Wellbeing', riskLink: 'Diabetes — hypo/hyper risk', cqcTags: ['Safe', 'Effective'],
    evidenceSchema: SCHEMAS.measurement('Blood glucose reading', 'mmol/L', 1, 33), completionRule: 'essential',
    dependencies: ['Requires configured safe range'],
    alertRules: [alert('Outside safe range', 'high', 'value < low || value > high')],
    usedByCount: 13,
  }),
  mk({ id: 'obs-bp', categoryId: 'observations', subcategory: 'Measurements', name: 'Record blood pressure', type: 'measurement', priority: 'important', evidenceSchema: SCHEMAS.measurement('Systolic / Diastolic', 'mmHg', 40, 250), carePlanDomain: 'Health & Wellbeing', cqcTags: ['Effective'], usedByCount: 16 }),
  mk({ id: 'obs-weight', categoryId: 'observations', subcategory: 'Measurements', name: 'Record weight', type: 'measurement', frequency: 'Weekly', evidenceSchema: SCHEMAS.measurement('Weight', 'kg', 20, 200), riskLink: 'Malnutrition risk', carePlanDomain: 'Nutrition & Hydration', usedByCount: 19 }),
  mk({ id: 'obs-pain', categoryId: 'observations', subcategory: 'Scores', name: 'Pain score', type: 'observation', priority: 'important', evidenceSchema: SCHEMAS.observationScore('Pain score (0–10)', 0, 10, 0), carePlanDomain: 'Health & Wellbeing', cqcTags: ['Caring', 'Responsive'], alertRules: [alert('High pain score', 'high', 'score >= 7')], usedByCount: 23 }),
  mk({ id: 'obs-mood', categoryId: 'observations', subcategory: 'Scores', name: 'Mood / wellbeing check', type: 'observation', defaultVisits: ['Tea'], evidenceSchema: SCHEMAS.observationScore('Mood (1–5)', 1, 5, 3), carePlanDomain: 'Health & Wellbeing', cqcTags: ['Caring'], alertRules: [alert('Low mood twice in 7 days', 'medium', 'lowMood(7d) >= 2')], usedByCount: 34 }),

  /* ============================ Domestic ============================ */
  mk({ id: 'dom-bedding', categoryId: 'domestic', subcategory: 'Laundry', name: 'Change bedding', type: 'simple', frequency: 'Weekly', defaultVisits: ['Any Visit'], carePlanDomain: 'Home Environment', cqcTags: ['Caring'], priority: 'recommended', usedByCount: 27 }),
  mk({ id: 'dom-kitchen', categoryId: 'domestic', subcategory: 'Cleaning', name: 'Clean kitchen', type: 'simple', defaultVisits: ['Any Visit'], carePlanDomain: 'Home Environment', usedByCount: 21 }),
  mk({ id: 'dom-fridge', categoryId: 'domestic', subcategory: 'Safety', name: 'Check fridge & food expiry', type: 'checklist', frequency: 'Weekly', evidenceSchema: SCHEMAS.checklist(['No expired food', 'Fridge clean', 'Sufficient food in']), carePlanDomain: 'Home Environment', cqcTags: ['Safe'], usedByCount: 18 }),
  mk({ id: 'dom-bins', categoryId: 'domestic', subcategory: 'Household', name: 'Take bins out', type: 'simple', frequency: 'Weekly', priority: 'optional', carePlanDomain: 'Home Environment', usedByCount: 24 }),

  /* ============================ Wellbeing ============================ */
  mk({ id: 'wel-mood-check', categoryId: 'wellbeing', subcategory: 'Emotional', name: 'Mood and wellbeing check', type: 'observation', defaultVisits: ['Tea'], evidenceSchema: SCHEMAS.observationScore('Mood (1–5)', 1, 5, 3), carePlanDomain: 'Emotional Wellbeing', cqcTags: ['Caring', 'Responsive'], alertRules: [alert('Low mood 2x in 7 days', 'medium', 'lowMood(7d) >= 2')], usedByCount: 32 }),
  mk({ id: 'wel-companionship', categoryId: 'wellbeing', subcategory: 'Social', name: 'Companionship conversation', type: 'instruction', priority: 'recommended', evidenceSchema: SCHEMAS.instruction, carePlanDomain: 'Emotional Wellbeing', cqcTags: ['Caring'], usedByCount: 28 }),
  mk({ id: 'wel-loneliness', categoryId: 'wellbeing', subcategory: 'Social', name: 'Loneliness / isolation check', type: 'observation', evidenceSchema: SCHEMAS.observationScore('Isolation concern (0–3)', 0, 3, 0), carePlanDomain: 'Emotional Wellbeing', cqcTags: ['Caring', 'Responsive'], usedByCount: 15 }),

  /* ============================ Dementia ============================ */
  mk({
    id: 'dem-evening-reassure', categoryId: 'dementia', subcategory: 'Reassurance', code: 'DEM-1201',
    name: 'Evening reassurance routine', type: 'instruction', priority: 'important',
    defaultVisits: ['Tea', 'Bedtime'], duration: 15,
    description: 'Calm, consistent evening routine to reduce sundowning distress.',
    purpose: 'Reduces anxiety, distress and wandering risk in the evening.',
    carePlanDomain: 'Mental Health & Cognition', riskLink: 'Wandering / distress risk', cqcTags: ['Caring', 'Responsive'],
    evidenceSchema: SCHEMAS.instruction, completionRule: 'recommended',
    short: 'Use a calm tone; remind Mary of the bedtime routine.',
    detailed: 'Use calm tone, reduce noise, reassure and follow familiar routine. Note any triggers.',
    dosDonts: ['Use calm tone', 'Reduce noise & glare', 'Do not argue with confusion'],
    escalation: 'Alert office if distress or wandering concern.',
    alertRules: [alert('Distress or wandering observed', 'high', 'concern == true')],
    usedByCount: 14,
  }),
  mk({ id: 'dem-orientation', categoryId: 'dementia', subcategory: 'Orientation', name: 'Orientation prompt', type: 'instruction', defaultVisits: ['Morning'], evidenceSchema: SCHEMAS.instruction, carePlanDomain: 'Mental Health & Cognition', usedByCount: 17 }),
  mk({ id: 'dem-wandering', categoryId: 'dementia', subcategory: 'Risk', name: 'Wandering risk check', type: 'observation', priority: 'important', evidenceSchema: SCHEMAS.observationScore('Wandering risk (0–3)', 0, 3, 0), riskLink: 'Wandering / distress risk', carePlanDomain: 'Mental Health & Cognition', cqcTags: ['Safe'], usedByCount: 10 }),

  /* ============================ Appointments ============================ */
  mk({ id: 'app-gp-reminder', categoryId: 'appointments', subcategory: 'Appointments', name: 'GP appointment reminder', type: 'temporary', frequency: 'One-off', defaultVisits: ['Morning'], evidenceSchema: SCHEMAS.completionNote, carePlanDomain: 'Health & Wellbeing', cqcTags: ['Responsive'], usedByCount: 9 }),
  mk({ id: 'app-prescription', categoryId: 'appointments', subcategory: 'Community', name: 'Prescription collection reminder', type: 'temporary', frequency: 'One-off', carePlanDomain: 'Medication', usedByCount: 11 }),

  /* ============================ Reablement ============================ */
  mk({
    id: 'rea-dressing', categoryId: 'reablement', subcategory: 'Independence', code: 'REA-1401',
    name: 'Encourage independent dressing', type: 'goal', priority: 'recommended',
    defaultVisits: ['Morning'], frequency: 'Daily',
    description: 'Outcome-focused support to build dressing independence.',
    purpose: 'Increases independence and confidence; reduces reliance on care.',
    carePlanDomain: 'Reablement', cqcTags: ['Effective', 'Caring'],
    evidenceSchema: SCHEMAS.goal, completionRule: 'recommended',
    short: 'Encourage Mary to dress independently; prompt only where needed.',
    detailed: 'Offer the least help that works. Record independence level and barriers. Review weekly.',
    alertRules: [alert('No progress 2 weeks', 'low', 'noProgress(14d)')],
    usedByCount: 12,
  }),
  mk({ id: 'rea-walk', categoryId: 'reablement', subcategory: 'Mobility', name: 'Practice walking short distance', type: 'goal', evidenceSchema: SCHEMAS.goal, riskLink: 'Falls risk', carePlanDomain: 'Reablement', usedByCount: 8 }),

  /* ============================ End of Life ============================ */
  mk({
    id: 'eol-comfort', categoryId: 'end-of-life', subcategory: 'Comfort', code: 'EOL-1501',
    name: 'Comfort and dignity check', type: 'observation', priority: 'critical',
    defaultVisits: ['Morning', 'Lunch', 'Tea', 'Bedtime'], frequency: 'Each visit',
    description: 'Frequent comfort, pain and dignity check during palliative care.',
    purpose: 'Ensures comfort, dignity and timely symptom escalation.',
    carePlanDomain: 'End of Life', cqcTags: ['Caring', 'Responsive'],
    evidenceSchema: SCHEMAS.observationScore('Comfort level (0–4)', 0, 4, 0), completionRule: 'critical',
    dependencies: ['Requires senior approval', 'End-of-life permission'],
    short: 'Check comfort and dignity; record any pain or distress.',
    escalation: 'Escalate any pain or distress immediately to senior / on-call.',
    alertRules: [alert('Pain / distress observed', 'critical', 'score >= 2')],
    visibility: { carer: true, office: true, family: true, reports: true, carePlanPrint: true, auditPack: true },
    status: 'published', usedByCount: 4,
  }),
  mk({ id: 'eol-mouth-care', categoryId: 'end-of-life', subcategory: 'Comfort', name: 'Mouth care (comfort)', type: 'simple', priority: 'essential', defaultVisits: ['Any Visit'], dependencies: ['End-of-life permission'], carePlanDomain: 'End of Life', cqcTags: ['Caring'], usedByCount: 4 }),

  /* ============================ Safeguarding ============================ */
  mk({
    id: 'sg-med-refusal', categoryId: 'safeguarding', subcategory: 'Follow-up', code: 'SG-1601',
    name: 'Repeated medication refusal follow-up', type: 'followup', priority: 'essential',
    frequency: 'Triggered', defaultVisits: ['Any Visit'],
    description: 'Office follow-up triggered by repeated medication refusal.',
    purpose: 'Ensures safe response and family/GP involvement after refusals.',
    carePlanDomain: 'Medication', cqcTags: ['Safe', 'Well-led'],
    evidenceSchema: SCHEMAS.concern, completionRule: 'manager_review',
    short: 'Care coordinator follow-up after 2 refusals in 7 days.',
    detailed: 'Trigger: 2 refusals in 7 days. Assigned to care coordinator. Contact family / GP and record outcome.',
    alertRules: [alert('Follow-up overdue', 'high', 'unactioned(24h)')],
    usedByCount: 6,
  }),
  mk({ id: 'sg-safeguarding', categoryId: 'safeguarding', subcategory: 'Concern', name: 'Raise safeguarding concern', type: 'followup', priority: 'critical', frequency: 'Triggered', evidenceSchema: SCHEMAS.concern, completionRule: 'manager_review', cqcTags: ['Safe', 'Well-led'], usedByCount: 3 }),
  mk({ id: 'sg-missed-visit', categoryId: 'safeguarding', subcategory: 'Follow-up', name: 'Missed visit follow-up', type: 'followup', priority: 'essential', frequency: 'Triggered', evidenceSchema: SCHEMAS.concern, cqcTags: ['Safe', 'Responsive'], usedByCount: 5 }),

  /* ---- A couple in non-published states for governance demo ---- */
  mk({ id: 'hyd-bedtime-target', categoryId: 'hydration', subcategory: 'Hydration Monitoring', name: 'Bedtime fluid top-up to daily target', type: 'measurement', priority: 'recommended', evidenceSchema: SCHEMAS.fluid, status: 'pending', version: 'v0.3', approvedBy: '—', approvedAt: '—', changeReason: 'New template awaiting governance approval', carePlanDomain: 'Nutrition & Hydration', usedByCount: 0 }),
  mk({ id: 'obs-spo2', categoryId: 'observations', subcategory: 'Measurements', name: 'Record oxygen saturation (SpO₂)', type: 'measurement', priority: 'important', evidenceSchema: SCHEMAS.measurement('SpO₂', '%', 50, 100), status: 'draft', version: 'v0.1', approvedBy: '—', approvedAt: '—', changeReason: 'Draft — evidence rules in progress', carePlanDomain: 'Health & Wellbeing', usedByCount: 0 }),
  mk({ id: 'dom-vacuum-old', categoryId: 'domestic', subcategory: 'Cleaning', name: 'Vacuum living areas (legacy)', type: 'simple', priority: 'optional', status: 'retired', version: 'v2.1', changeReason: 'Retired — merged into Light cleaning', carePlanDomain: 'Home Environment', usedByCount: 2 }),
]

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id)
}
export function templatesByCategory(categoryId) {
  return TEMPLATES.filter((t) => t.categoryId === categoryId)
}
