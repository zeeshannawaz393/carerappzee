# Spec v3.4 → plan/code coverage gaps (residual, verified against code)

> Reverse audit of `carer-app-functional-spec-v3.4.md` vs the roadmap **and the actual `src/` code**
> (re-verified 2026-07-02 after further build work). Tests the D5 claim that every §/AC/hazard resolves
> to a phase or a B4 flag, then checks each against code to separate *genuinely pending* from *already built*.
>
> **Headline: the code has advanced well past the roadmap's status notes.** E8-expanded, E9 and E10 core
> modules now exist. Most of what the earlier draft of this doc listed as "pending" is **built**. What
> remains is a smaller set of fine-grained sub-behaviours. See
> [`competitor-practice-notes.md`](competitor-practice-notes.md) for market handling of the training/docs items.

## ✅ Now built (verified in code) — no longer gaps
| Spec | Behaviour | Where |
|---|---|---|
| §49 | Versioned order lifecycle (Draft/Active/Superseded/Discontinued), effectiveFrom, prescriber/source, review; **reconciliation Pending→Confirmed/Rejected/Resolved that BLOCKS admin**; external/other-administered; covert-under-MCA (`mcaAuthorised`); stale-MAR override | `carer/medOrders.js`, `data/carer.js`, `screens/carer.js` |
| §19 | **Value validation** (`implausible()` — physiologically-impossible → correct & re-read before escalate, AC-19.17); monitoring schedule (who/how-often/until); repositioning chart shared across carers/visits + overdue flag | `carer/obsIntegrity.js`, `screens/carer.js` |
| §18.1 | CD **witness eligibility rule + no-eligible-witness fallback** (AC-18.18/18.19) | `screens/carer.js`, `data/carer.js` |
| §26 | **Cash-safety gate** (opening/closing count, offline limit, high-value, stale-balance block) AC-26.7 | `carer/money.js` |
| §24 | **Tracked change-request** (Raised→Acknowledged→Actioned/Declined; does not mutate plan; handover-not-a-shadow-care-plan) AC-24.3/24.5/24.6 | `carer/changeRequest.js` |
| §17 | **Non-visit Jobs** (Today/Week/Month/Overdue, recurring, evidence-required, escalation) + role gating | `carer/jobs.js`, `data/carer.js` |
| §29a/b | **Carer reports + export hardening** (recipient verify, reason, watermark, expiry, approved target, no Downloads file) | `carer/reports.js` |
| §5 | **Roles** (Care Worker/Senior/Team Lead) + `minRole` elevated-action gating | `data/carer.js`, `carer/jobs.js` |
| §40/§42.1/App A | **In-app assurance register** — DCB0129 hazard map (H1–H38), §42.1 concurrency register, Appendix-A transition set, coverage note, all rendered in-product | `carer/assurance.js`, `data/assurance.js` |

> Note the last row is the **traceability artefact rendered in-app** — it *documents* the hazards,
> concurrency scenarios and visit-transitions. That is distinct from building each transition as a working
> **flow** (see Tier-1/2 below).

## Tier 1 — residual, safety-critical, still absent in code
- [ ] **§49 — urgent verbal orders** (who/when, time-limited, expire if unconfirmed). Absent — the order spine exists but verbal-order capture doesn't.
- [ ] **§49 (AC-49.1a) — two-person verification of high-risk order changes.** Absent (`twoPerson` is only two-carer tasks + CD witness, not order-change sign-off).
- [ ] **§51 / H29 (AC-51.6–51.8) — stale/withdrawn protocol urgent recall + safe generic 999/111 fallback ("never blank").** Absent — protocol runner has 999/111 contact steps, but no stale-library recall/refuse. (H29 is in the assurance *register* but the control isn't built.)
- [ ] **§51 / H30 — emergency contact number fails mid-event → alternative contact/escalation route.** Absent.
- [ ] **§14.30 — calling off a *time-critical* visit blocks submit until welfare check confirmed.** Absent — welfare is captured at *check-in* only, not as an abort/call-off gate.
- [ ] **§18.13 — repeated refusal/omission *pattern across visits* → concern/alert.** Absent (per-dose PRN follow-up exists; the cross-visit detector doesn't).
- [ ] **App A — wrong-visit/wrong-person → *void, no clinical record carried over*.** Partial — wrong-person banner + person-confirm built; the visit-level void flow is only in the assurance register, not built as a flow.

## Tier 2 — residual, medium, still absent
### Medication (§49) special types & stock — the spine is done, these sit outside it
- [ ] Warfarin / INR variable-dose + separate chart.
- [ ] Homely remedies / OTC authorised list + limits.
- [ ] Cold-chain & expiry flagging (e.g. insulin).
- [ ] Tapered doses & antibiotic time-limited courses.
- [ ] Medicines taken away from home (day services/leave).
- [ ] NatPSA surfacing against affected medicines (AC-49.6).
- [ ] CD **stock-lifecycle events** (receipt/return/destruction/balance) — needs a `MedicationStockEvent` entity.

### Appendix-A transition *flows* (documented in the assurance register; flows not built)
- [ ] Office cancels **mid-travel** (stop-travel prompt).
- [ ] Visit **reassigned/removed** from carer mid-lifecycle.
- [ ] **Forgot checkout** — declared-vs-estimated end + estimated flag.
- [ ] Office **force-closes an abandoned visit**.
- [ ] **Temporary departure & return** mid-visit.
- [ ] **Whole-visit refusal (AC-14.33)** as a stable distinct outcome.

### Cross-cutting
- [ ] **AC-33.1 quiet-hours withhold/digest engine** — absent (night quiet-UI in `night.js` is a different thing).
- [ ] **AC-36.4 audit-on-view** of sensitive records — absent (create/edit audit only).
- [ ] **AC-38.4 device-health nudges** (low storage/battery) — absent.
- [ ] **AC-34.4 multi-modal (haptic/audio) confirmation** on check-in/eMAR/SOS — absent.
- [ ] **AC-47.3 lost-device report + remote-wipe + session suspend** — absent.
- [ ] **AC-29.4/29.5 carer compliance-doc upload + verification** — absent (`reports.js` is export/share, not compliance-doc intake). Model as office-managed + carer-submit-for-verification.
- [ ] **AC-28.7 expired-training hard-gate on the task** — training is tracked (E4) but a task-level hard-gate is not evidenced; likely advisory. (Beyond-market — keep configurable, high-risk tasks only, with override-reason. See competitor notes.)
- [ ] **§17.1 personal-care competency gating** + out-of-scope-item surfacing — not evidenced (`minRole` gates jobs, not personal-care tasks).

## Tier 3 — low / housekeeping (unverified or minor)
- [ ] §7 parameter thresholds with no consuming behaviour — re-verify against the actual `PARAMS`/threshold constants (code uses object keys, not `[P-…]` tokens; earlier token-grep inconclusive): protocol-stale, access-grant lease, max-offline escalation, cache-retention, media cap, quiet-hours.
- [ ] AC-10.6 active-visit transfer to new device + cross-device draft ownership.
- [ ] AC-14.39 reauthentication on shared-device handoff.
- [ ] §26.5/26.6 shopping reconciliation + food-safety checks.
- [ ] §20.4 hand-hygiene + clinical-waste recording (E6 covers PPE only).
- [ ] AC-29.1 read-and-sign policy acknowledgement.
- [ ] App D a11y: error-message field-association; adjustable/no-hard-timeout vs auto-lock.
- [ ] §52.1b rooted/jailbroken-device behaviour.

## Recommended next build
Fold the §49 special-med/stock + verbal-order + two-person-order-change items into the existing **E9**;
add an **E11 "protocol resilience & lifecycle-transition completeness"** for §51 H29/H30, §14.30, §18.13
and the Appendix-A transition *flows* (turning the register entries into working transitions). The
cross-cutting AC items (33.1/36.4/38.4/34.4/47.3/29.4-5) can ride the **E8 capstone** as its final sweep.

Separately, the **workforce self-service cluster** — e-learning centre, training/CPD records, skills matrix,
staff-document upload+expiry (§28/§29), and **CM2000-style working patterns** (§12, rolling n-week rota
anchored to a start date) — is **display-only stubs today** (`renderTraining`/`renderAvailability`) and is
scoped as **E12** in the roadmap (Part E.4–E.5). Several items there (in-app learning centre, carer-visible
skills, carer self-upload of compliance docs, carer-facing rolling-pattern preview) are also market gaps —
see [`competitor-practice-notes.md`](competitor-practice-notes.md) §5–§6.
