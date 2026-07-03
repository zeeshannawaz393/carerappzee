/**
 * E8 (expanded) — assurance capstone data (§40/§42.1/Appendix A). Three
 * enterprise artefacts: the DCB0129 hazard map (H1–H38), the §42.1 state &
 * concurrency register (24 scenarios), and the Appendix-A visit-transition
 * completeness set. Each row resolves to a delivered control/phase or a B4
 * (backend / assurance-owned) flag. `phase` values map to the build roadmap.
 */

/** DCB0129 clinical-safety hazards → required control → phase → verifying test. */
export const HAZARDS = [
  { id: 'H1', hazard: 'Wrong person — care recorded against the wrong client', control: 'Two-identifier gate, person banner, switch-clears unsaved fields', phase: 'E1', test: 'Person-switch with unsaved med fields' },
  { id: 'H2', hazard: 'Medication given against a superseded/stopped order', control: 'Order lifecycle + reconciliation block; stop wins', phase: 'E9', test: 'Order stopped while offline' },
  { id: 'H3', hazard: 'Allergic reaction from administering a contraindicated drug', control: 'Five allergy states + hard allergy warning + override reason', phase: 'E1', test: 'Confirmed-allergy administration' },
  { id: 'H4', hazard: 'Overdose — dose too soon / above 24h ceiling', control: 'Min-interval + rolling-24h + window rules with exact block reason', phase: 'E1', test: 'PRN within interval' },
  { id: 'H5', hazard: 'Controlled drug diverted / mis-counted', control: 'CD witness eligibility rule + logged fallback + count', phase: 'E9', test: 'No eligible witness on a CD round' },
  { id: 'H6', hazard: 'Covert medication without lawful authority', control: 'Covert gated on recorded MCA best-interests decision', phase: 'E9', test: 'Covert dose without MCA record' },
  { id: 'H7', hazard: 'Deterioration missed / not escalated', control: 'Auto-flag + NEWS2 → closed-loop protocol runner', phase: 'E1', test: 'NEWS2 ≥ 5 auto-escalation' },
  { id: 'H8', hazard: 'Impossible observation value drives false escalation', control: 'Physiologically-impossible validation + repeat-reading', phase: 'E9', test: 'Decimal-slip temperature' },
  { id: 'H9', hazard: 'Pressure damage from missed repositioning', control: 'Cross-carer repositioning chart + overdue flag', phase: 'E9', test: 'Turn overdue across carers' },
  { id: 'H10', hazard: 'Hypoglycaemia unmanaged', control: 'Glucose < 4 → hypo protocol', phase: 'E1', test: 'Glucose 3.2 mmol/L' },
  { id: 'H11', hazard: 'Choking not managed', control: 'Choking protocol + incident', phase: 'E1', test: 'Choking protocol run' },
  { id: 'H12', hazard: 'Anaphylaxis not managed', control: 'Anaphylaxis protocol + auto-injector step', phase: 'E1', test: 'Anaphylaxis protocol run' },
  { id: 'H13', hazard: 'CPR started against a valid DNACPR', control: 'ReSPECT/DNACPR surfaced in unresponsive protocol', phase: 'E1', test: 'Unresponsive with DNACPR' },
  { id: 'H14', hazard: 'Unsafe two-person transfer done solo', control: 'Double-up block — solo administration prevented', phase: 'E2', test: 'Solo hoist attempt' },
  { id: 'H15', hazard: 'Person left unsafe at end of visit', control: 'Leaving-safe gating + exception outcomes', phase: 'E2', test: 'Leave with cooker on' },
  { id: 'H16', hazard: 'Care claimed but not delivered (visit integrity)', control: 'Geofence check-in + method fallbacks + welfare outcome', phase: 'E2', test: 'Backfilled manual check-in' },
  { id: 'H17', hazard: 'Faulty equipment used (LOLER/PUWER)', control: 'Equipment register status; faulty → flag & block', phase: 'E6', test: 'Faulty sensor mat' },
  { id: 'H18', hazard: 'Wound mis-described → poor continuity', control: 'Structured wound vocabulary (no free-text clinical fields)', phase: 'E9', test: 'Body-map with structured fields' },
  { id: 'H19', hazard: 'Safeguarding disclosure lost / distorted', control: 'Verbatim capture + fact/interpretation separation + draft', phase: 'E3', test: 'Disclosure verbatim record' },
  { id: 'H20', hazard: 'Key-safe code exposed', control: 'Masked reveal + auto-remask + no clipboard + audit', phase: 'E3', test: 'Key-safe reveal audited' },
  { id: 'H21', hazard: 'Unauthorised record access', control: 'Break-glass minimal profile + secure search + audit', phase: 'E5', test: 'Break-glass minimal profile' },
  { id: 'H22', hazard: 'Unlawful information sharing', control: 'Purpose → Art6/Art9 lawful-basis mapping; emergency not blocked', phase: 'E5', test: 'Share with lawful basis' },
  { id: 'H23', hazard: 'Stale data drives an unsafe decision', control: 'Stale-MAR warn/block + freshness gate + override', phase: 'E5', test: 'Administer on 26h-old MAR' },
  { id: 'H24', hazard: 'Records lost on device / offline', control: 'Offline queue + append-only audit + sync manager', phase: 'E5', test: 'Force update with unsynced records' },
  { id: 'H25', hazard: 'Session hijack / shoulder-surf', control: 'PIN/biometric + auto-lock idle timer + single session', phase: 'E5', test: 'Idle auto-lock' },
  { id: 'H26', hazard: 'Missed safety-critical notification', control: 'Delivery-state tracking + denial hard-policy block', phase: 'E10', test: 'Notifications denied at shift start' },
  { id: 'H27', hazard: 'Lone-worker harm undetected', control: 'SOS + safety timer + missed-check-in + no-service resilience', phase: 'E10', test: 'SOS with no signal' },
  { id: 'H28', hazard: 'Carer-directed harm not reported', control: 'Distinct carer-harm incident flow', phase: 'E10', test: 'Carer-harm report' },
  { id: 'H29', hazard: 'Handover gap between shifts', control: 'Open-safety-items handover + ownership acknowledgement', phase: 'E10', test: 'Cross-shift unresolved item' },
  { id: 'H30', hazard: 'Shadow care plan via handover notes', control: 'Lasting change must promote to order/plan/risk/authorised instruction', phase: 'E10', test: 'Lasting change without promotion' },
  { id: 'H31', hazard: 'Client money loss / abuse', control: 'Opening/closing count + offline limit + stale-balance block', phase: 'E9', test: 'Offline overspend attempt' },
  { id: 'H32', hazard: 'Unqualified carer does an elevated action', control: 'Three-tier role gates + role-stamped audit', phase: 'E10', test: 'Care-worker attempts spot-check' },
  { id: 'H33', hazard: 'Mandatory non-visit job missed', control: 'Jobs surface + evidence gating + overdue escalation', phase: 'E10', test: 'Overdue mandatory job' },
  { id: 'H34', hazard: 'Death / unresponsive mishandled', control: 'DNACPR-first death workflow (expected/unexpected)', phase: 'E4', test: 'Found-unresponsive workflow' },
  { id: 'H35', hazard: 'Unfit carer works a shift', control: 'Absence & fitness-to-work self-report + relinquish shift', phase: 'E4', test: 'Report unfit before shift' },
  { id: 'H36', hazard: 'Communication barrier → unsafe care', control: 'AIS comms needs + point-of-care phrasebook + interpreter request', phase: 'E3/E7', test: 'Non-English point-of-care exchange' },
  { id: 'H37', hazard: 'Reablement de-skilling (over-support)', control: 'Prompt-not-do goals with baseline→target levels', phase: 'E7', test: 'Reablement prompt level recorded' },
  { id: 'H38', hazard: 'Data residency / retention breach', control: 'Retention & residency policy', phase: 'B4', test: 'Backend-owned — flagged' },
]

/** §42.1 — state & concurrency register (24 named scenarios). */
export const CONCURRENCY = [
  { id: 'C1', scenario: 'Two offline carers give the same PRN', gov: 'AC-18.x / H4', outcome: 'Second sync flags a duplicate; 24h count reconciles; office review' },
  { id: 'C2', scenario: 'Two offline carers spend the same client cash', gov: 'AC-26.7 / H31', outcome: 'Closing counts diverge → discrepancy flagged; stale-balance block' },
  { id: 'C3', scenario: 'Order stopped while carer is offline', gov: 'AC-49.10 / H2', outcome: 'Stop wins; prior dose flagged for review as reconciliation event' },
  { id: 'C4', scenario: 'Office cancels visit after check-in', gov: 'App A / H16', outcome: 'Carer completes safe care then closes; visit marked cancelled-after-care' },
  { id: 'C5', scenario: 'ECM lease expires mid-visit', gov: 'AC-14.x', outcome: 'Local record continues; re-verify on reconnect; no data loss' },
  { id: 'C6', scenario: 'Protocol withdrawn mid-emergency', gov: '§51', outcome: 'Version-pinned run continues to closure; new version next time' },
  { id: 'C7', scenario: 'Person-switch with unsaved med fields', gov: 'AC-14.2 / H1', outcome: 'Switch clears unsaved fields; re-confirm identity' },
  { id: 'C8', scenario: 'Two similarly-named clients', gov: 'H1', outcome: 'DOB + NHS second identifier disambiguates' },
  { id: 'C9', scenario: 'Paper + electronic MAR overlap', gov: '§18/§49', outcome: 'External-admin capture reconciles the paper dose' },
  { id: 'C10', scenario: 'Submitted note corrected offline', gov: '§55.6 / §36', outcome: 'Append-only correction; original preserved; both audited' },
  { id: 'C11', scenario: 'Forced app update with unsynced records', gov: 'H24', outcome: 'Sync-before-update guard; records queued, never dropped' },
  { id: 'C12', scenario: 'Backfilled check-in', gov: 'App A / H16', outcome: 'Marked Manual-exception — never clean-verified' },
  { id: 'C13', scenario: 'Reopen a closed visit for record completion', gov: 'App A', outcome: 'Reopen-for-record-completion, audited, per-carer time' },
  { id: 'C14', scenario: 'Mid-visit carer handover', gov: 'AC-55.3', outcome: 'Handover ack gate; per-carer time apportioned' },
  { id: 'C15', scenario: 'Escort ends off-site', gov: 'AC-14.11', outcome: 'Location move expected; close off-site allowed' },
  { id: 'C16', scenario: 'Emergency departure / client to hospital', gov: 'App A', outcome: 'Leaving-safe = transferred to hospital; suspend future visits' },
  { id: 'C17', scenario: 'CD given, no eligible witness present', gov: 'AC-18.19 / H5', outcome: 'Logged fallback (pending-witness/on-call/defer); round never stuck' },
  { id: 'C18', scenario: 'Notifications denied at shift start', gov: 'AC-33.5 / H26', outcome: 'Safety-critical work blocked until enabled / SMS fallback / office auth' },
  { id: 'C19', scenario: 'SOS with no mobile signal', gov: 'AC-22.5 / H27', outcome: 'Not-transmitted state; retries; last-known location; call 999' },
  { id: 'C20', scenario: 'Repositioning turn overdue across visits', gov: 'AC-19.15 / H9', outcome: 'Shared chart shows overdue; next carer prompted' },
  { id: 'C21', scenario: 'Impossible obs value entered', gov: 'AC-19.17 / H8', outcome: 'Blocked from escalation until corrected & re-read' },
  { id: 'C22', scenario: 'Stale care-plan version at visit', gov: '§16', outcome: 'Changed-since-last-visit banner; acknowledge current version' },
  { id: 'C23', scenario: 'Elevated action by under-ranked carer', gov: 'AC-5.1 / H32', outcome: 'Gated & hidden; requires seniority; role-stamped audit' },
  { id: 'C24', scenario: 'Two carers edit the same assessment', gov: 'AC-23.9', outcome: 'Carer updates/flags only; clinician owns determination; last-write audited' },
]

/** Appendix-A — visit-transition completeness (edge transitions earlier phases skipped). */
export const TRANSITIONS = [
  { from: 'Scheduled', to: 'Manual-exception verified', note: 'Backfilled check-in — never counts as clean-verified (H16)' },
  { from: 'Checked-in', to: 'Cancelled-after-care', note: 'Office cancels after check-in; carer completes safe care then closes' },
  { from: 'Closed', to: 'Reopened-for-record-completion', note: 'Reopen to finish records; audited, per-carer time' },
  { from: 'In-visit', to: 'Carer-handover', note: 'Mid-visit handover — §55.3 ack, per-carer time apportioned' },
  { from: 'Escort', to: 'Ended-off-site', note: 'Escort ends away from home (AC-14.11)' },
  { from: 'In-visit', to: 'Emergency-departure', note: 'Client to hospital mid-visit; leaving-safe = transferred; suspend future visits' },
]

export const COVERAGE_NOTE = 'Every §1–§58, appendix A–H and hazard H1–H38 resolves to a delivered control/phase or a B4 (backend/assurance-owned) flag. No section is mapped by title alone.'
