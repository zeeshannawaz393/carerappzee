/**
 * Reusable evidence-schema fragments. Templates reference these by spreading
 * or composing. Each field: { key, label, type, required, requiredIf, options, unit, min, max }
 * Field types: boolean | select | multiselect | number | text | textarea |
 *              datetime | signature | bodymap | photo | score | checklist
 */

export const F = {
  completed: { key: 'completed', label: 'Completed?', type: 'boolean', required: true },
  note: { key: 'note', label: 'Care note', type: 'textarea', required: true },
  noteOptional: { key: 'note', label: 'Care note', type: 'textarea', required: false },
  concern: { key: 'concern', label: 'Raise a concern?', type: 'boolean', required: false },
  refusalReason: {
    key: 'reason', label: 'Reason if not completed', type: 'select', requiredIf: 'completed == false',
    options: ['Refused', 'Not required', 'Unable', 'Not enough time', 'Item unavailable', 'Asleep', 'Out / not home'],
  },
  signature: { key: 'signature', label: 'Carer signature', type: 'signature', required: true },
  time: { key: 'administeredAt', label: 'Time recorded', type: 'datetime', required: true },
}

export const SCHEMAS = {
  /* ---- Simple completion ---- */
  completion: { fields: [F.completed, F.refusalReason, F.noteOptional, F.concern] },
  completionNote: { fields: [F.completed, F.note, F.refusalReason, F.concern] },

  /* ---- Checklist ---- */
  checklist: (items) => ({
    fields: [
      { key: 'items', label: 'Checklist', type: 'checklist', required: true, options: items },
      { key: 'action', label: 'Action taken (if any item not met)', type: 'textarea', required: false },
      F.concern,
    ],
  }),

  /* ---- Instruction (read + note) ---- */
  instruction: { fields: [{ key: 'acknowledged', label: 'Read & followed', type: 'boolean', required: true }, F.noteOptional, F.concern] },

  /* ---- Fluid / hydration ---- */
  fluid: {
    fields: [
      { key: 'drinkType', label: 'Drink type', type: 'select', required: true, options: ['Water', 'Tea', 'Coffee', 'Juice', 'Squash', 'Milk', 'Thickened fluid', 'Other'] },
      { key: 'amountMl', label: 'Amount taken', type: 'number', unit: 'ml', required: true, min: 0, max: 1000 },
      { key: 'refused', label: 'Refused?', type: 'boolean', required: true },
      { key: 'reason', label: 'Reason if refused', type: 'text', requiredIf: "refused == true" },
      F.concern,
    ],
  },

  /* ---- Food intake ---- */
  food: {
    fields: [
      { key: 'mealOffered', label: 'Meal offered', type: 'text', required: true },
      { key: 'amountEaten', label: 'Amount eaten', type: 'select', required: true, options: ['All', 'Most', 'Half', 'Little', 'None'] },
      { key: 'poorReason', label: 'Reason for poor intake', type: 'text', requiredIf: "amountEaten in ['Little','None']" },
      { key: 'photo', label: 'Photo (optional)', type: 'photo', required: false },
      F.concern,
    ],
  },

  /* ---- Medication / eMAR ---- */
  medication: {
    fields: [
      { key: 'outcome', label: 'Medication outcome', type: 'select', required: true, options: ['Given', 'Refused', 'Not available', 'Withheld', 'Partially taken'] },
      { key: 'reason', label: 'Reason', type: 'textarea', requiredIf: "outcome != 'Given'" },
      F.time,
      F.signature,
    ],
  },

  /* ---- Measurement / observation ---- */
  observationScore: (label, min, max, normal) => ({
    fields: [
      { key: 'score', label, type: 'score', required: true, min, max, normal },
      { key: 'note', label: 'Comment', type: 'textarea', required: false },
      { key: 'escalate', label: 'Escalation required?', type: 'boolean', required: false },
    ],
  }),
  measurement: (label, unit, min, max) => ({
    fields: [
      { key: 'value', label, type: 'number', unit, required: true, min, max },
      { key: 'flag', label: 'Within safe range?', type: 'boolean', required: true },
      { key: 'note', label: 'Comment', type: 'textarea', required: false },
      { key: 'escalate', label: 'Escalation required?', type: 'boolean', required: false },
    ],
  }),

  /* ---- Skin / body map ---- */
  bodymap: {
    fields: [
      { key: 'condition', label: 'Skin condition', type: 'select', required: true, options: ['Intact / healthy', 'Redness', 'Broken skin', 'Bruising', 'Swelling', 'Other concern'] },
      { key: 'bodymap', label: 'Mark area on body map', type: 'bodymap', requiredIf: "condition != 'Intact / healthy'" },
      { key: 'note', label: 'Description', type: 'textarea', requiredIf: "condition != 'Intact / healthy'" },
      { key: 'photo', label: 'Photo (if consented)', type: 'photo', required: false },
      { key: 'escalate', label: 'Escalate concern?', type: 'boolean', required: false },
    ],
  },

  /* ---- Continence ---- */
  continence: {
    fields: [
      { key: 'completed', label: 'Support completed', type: 'boolean', required: true },
      { key: 'padChanged', label: 'Pad changed?', type: 'boolean', required: false },
      { key: 'bowel', label: 'Bowel movement', type: 'select', required: false, options: ['None', 'Normal', 'Loose', 'Constipated', 'Type 1-2', 'Type 3-4', 'Type 5-7'] },
      { key: 'skin', label: 'Skin condition', type: 'select', required: false, options: ['Intact', 'Red', 'Sore', 'Broken'] },
      F.concern,
    ],
  },

  /* ---- Goal / reablement ---- */
  goal: {
    fields: [
      { key: 'independence', label: 'Level of independence', type: 'select', required: true, options: ['Fully independent', 'Prompted', 'Assisted', 'Unable'] },
      { key: 'progress', label: 'Progress note', type: 'textarea', required: true },
      { key: 'barrier', label: 'Barrier (if any)', type: 'text', required: false },
      { key: 'nextStep', label: 'Next step', type: 'text', required: false },
    ],
  },

  /* ---- Safeguarding / follow-up ---- */
  concern: {
    fields: [
      { key: 'concernType', label: 'Concern type', type: 'select', required: true, options: ['Safeguarding', 'Medication', 'Environmental', 'Family', 'Neglect', 'Financial', 'Other'] },
      { key: 'details', label: 'Details', type: 'textarea', required: true },
      { key: 'action', label: 'Immediate action taken', type: 'textarea', required: true },
      { key: 'informed', label: 'Who was informed', type: 'text', required: true },
      { key: 'escalation', label: 'Escalation status', type: 'select', required: true, options: ['Open', 'Escalated to manager', 'Reported to LA', 'Closed'] },
    ],
  },
}
