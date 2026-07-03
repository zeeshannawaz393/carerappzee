# Carer App — Spec v3.4 traceability

Maps the **Carer Mobile App Functional Specification v3.4** to this prototype. Status legend:
**✅ Demonstrated** (built, clickable, verified) · **🟡 Simulated** (behaviour built, mechanism mocked at
prototype fidelity) · **🔵 Deferred** (lower-risk breadth, not yet built) · **🏢 Backend/assurance-owned**
(out of a front-end prototype's scope — named as a dependency).

> Fidelity decision (agreed): **prototype — simulate & demonstrate**. No real backend; state persists in
> `localStorage` (`caretask.carer.v3`). Thresholds live in one `PARAMS` table (`src/data/carer.js`, §7).

## Roadmap phases
| Phase | Scope | Status |
|---|---|---|
| P0–P5 | Carer app information architecture (shell, auth stub, Today, visit workspace, clients, comms, me/safety, office loop) | ✅ |
| E1 | Clinical-safety core | ✅ |
| E2 | Visit integrity & ECM | ✅ (core + key breadth) |
| E3 | Records & field safety | ✅ (high-value) |
| E4 | Workforce & operations | ✅ |
| E5 | Foundation, platform & governance | ✅ (prototype scope) |
| E6 | Visit-type & setting breadth | ✅ |
| E7 | Specialist care records | ✅ |
| E9 | Medication order lifecycle, obs integrity & cross-carer safety | ✅ |
| E10 | Roles, jobs, change-requests, documents & comms completeness | ✅ |
| E8 | Enterprise QA capstone (hazard/concurrency/transition traceability) | ✅ (prototype scope) |

## Section-by-section

| § | Capability | Status | Where |
|---|---|---|---|
| 5 | Roles & permissions | 🟡 role switcher (office); carer/senior gating conceptual | `store.js`, `shell.js` |
| 7 | Parameter table | ✅ `PARAMS` single source | `data/carer.js` |
| 10 | Auth, device, auto-lock | 🟡 PIN+biometric stub, **auto-lock overlay + idle timer**, single session | `carer/auth.js`, `carer/session.js`, `main.js` |
| 11 | Today + end-of-shift summary | ✅ | `carer/today.js` (`renderToday`, `renderShiftSummary`) |
| 12 | Schedule / availability / shift clocking | ✅ week schedule; availability/shifts | `carer/schedule.js`, `carer/meScreens.js` |
| 13 | Travel & navigation | 🟡 directions handoff + mileage in pay | `today.js`, `money.js` |
| 14 | Visit lifecycle & ECM | ✅ geofence + method fallbacks + welfare + **five-dimension outcome** + reason codes + leaving-safe | `screens/carer.js`, `data/carer.js` |
| 14.2 | Wrong-person protection | ✅ 2-identifier gate, person banner, switch-clears | `screens/carer.js` |
| 14.5 | Double-up two-person block | ✅ blocked solo, co-carer presence | `screens/carer.js` |
| 14.1 | Visit-type breadth (complex / first / escort / telephone) | ✅ type banner + pre-visit safety briefing + escort location note | `screens/carer.js`, `data/carer.js` (`VISIT_TYPES`, `visitTypeFor`) |
| 14.4 | Night shifts / interval rounds | ✅ quiet-mode round runner, date-boundary, missed-round flag, end-of-night handover | `carer/night.js` |
| 15 | People I support | ✅ directory + profile | `carer/clients.js` |
| 16 | Care planning, consent & MCA | ✅ decision-specific capacity, LPA scope, plan-change ack | `carer/clientDetail.js` (`renderCapacity`) |
| 16a | Reablement / progress-to-independence | ✅ goal levels, baseline→target, prompt-not-do | `carer/reablement.js`, `data/carer.js` (`REABLEMENT_GOALS`) |
| 19a | Condition-specific observation prompts | ✅ "Recommended for this client" row maps su flags→obs | `screens/carer.js` (`recommendedObs`) |
| 19b | End-of-life / anticipatory (JIC) meds | ✅ su-harold anticipatory kit (Morphine/Midazolam/Levomepromazine/Hyoscine), controlled+anticipatory flags | `data/carer.js` (`MED_SCHEDULE`) |
| 17 | Tasks | ✅ outcomes, required gating, decline/partial | `screens/carer.js` |
| 18 / 49 | eMAR two-field + medication safety | ✅ supportAction×doseOutcome, interval/24h/window block reasons, 5 allergy states, covert, CD witness, override, PRN follow-up | `screens/carer.js`, `data/carer.js` |
| 49 | **Medication order lifecycle & reconciliation** | ✅ versioned orders `Draft→…→Superseded/Discontinued`, effective-version-only admin, "changed since last visit" recon block, external/other-administered verification, covert-under-MCA gate, stopped-order-offline conflict (stop wins) | `carer/medOrders.js`, `screens/carer.js` (med sheet), `data/carer.js` (`MEDICATION_ORDERS`) |
| 18.1 | **CD witness eligibility & fallback** | ✅ configured eligibility rule (on-duty·present·CD-competent·separate account·independent), logged fallback (pending-witness/on-call/defer) so a round never stays open | `screens/carer.js` (med sheet), `data/carer.js` (`ELIGIBLE_WITNESSES`, `WITNESS_FALLBACKS`) |
| 19 | Observations, NEWS2, body map | ✅ 20+ types, auto-flag, fluid/food totals | `screens/carer.js`, `data/carer.js` |
| 19 | **Observation integrity** | ✅ physiologically-impossible value → correct & re-read before escalation; monitoring schedules; cross-carer repositioning chart + overdue flag; structured wound vocabulary | `screens/carer.js` (`validateObs`), `carer/obsIntegrity.js`, `data/carer.js` (`OBS_PLAUSIBLE`, `REPOSITION_PLAN`, `MONITORING_SCHEDULES`, `WOUND_VOCAB`) |
| 26 / 32 | **Client-money cash-safety gate** | ✅ opening/closing physical count, offline-spend limit, high-value receipt, stale-balance block, discrepancy → office | `carer/money.js` |
| 20 | Consumables / equipment register | ✅ LOLER/PUWER status, faulty→flag, stock levels, per-client kit | `carer/equipment.js`, `data/carer.js` (`EQUIPMENT`, `CONSUMABLES`) |
| 21 | Notes / media / voice | ✅ notes + **real photo capture** + **real voice note (MediaRecorder + fallback)** | `screens/carer.js` |
| 22 | Safety / SOS / lone-worker | ✅ SOS, timer, check-in, on-call | `carer/meScreens.js`, `carer/notifications.js` |
| 23 | Incidents / safeguarding | ✅ 12 types, RIDDOR/safeguarding, body-map, **disclosure verbatim + fact/interpretation**, drafts | `screens/carer.js` |
| 24 / 55.3 | Handover + acknowledgement | ✅ visit note/timeline + **handover ack gate** | `screens/carer.js` |
| 25 | Feedback / whistleblowing | ✅ | `carer/workflows.js` (`renderFeedback`) |
| 26 / 27 | Money / expenses / pay / timesheet | ✅ | `carer/money.js`, `carer/meScreens.js` |
| 28 / 55.1 | Training / competency / spot-checks | 🟡 certificates + expiry; spot-check conceptual | `carer/meScreens.js` |
| 30 / 31 | Search / help | ✅ | `carer/help.js` |
| 32 | Sync / offline / stale-data | 🟡 offline queue + sync + **stale-data warn/block explainer** | `carer/schedule.js` (`renderSyncManager`), `lib/carerStore.js` |
| 33 | Notifications | ✅ centre + inbound feed | `carer/notifications.js` |
| 34 | Accessibility (WCAG) | ✅ **larger-text + high-contrast applied**; labels ongoing | `main.js`, `style.css`, `meScreens.js` |
| 36 | Audit | ✅ append-only store → office audit | `lib/carerStore.js`, `lib/officeBridge.js` |
| 48 | Alert state machine | ✅ lifecycle Raised→…→Resolved, My-alerts view, office advances state | `lib/officeBridge.js`, `carer/notifications.js` |
| 50 | Access grants / break-glass / key-safe | ✅ **key-safe mask+reveal+remask**, **break-glass minimal profile + secure search** | `carer/frame.js` (`keySafe`), `carer/access.js` |
| 51 | Emergency / deterioration protocols | ✅ closed-loop runner, 6-protocol library, version-pinned | `screens/carer.js`, `data/carer.js` |
| 53 | Lawful-basis information sharing | ✅ purpose→Art6/Art9 mapping, emergency not blocked | `carer/access.js` (`renderShare`) |
| 54 | Accessible Information Standard + communication aid | ✅ comms needs on profile + **point-of-care phrasebook (multi-language) & interpreter request** | `carer/clients.js`, `carer/translate.js`, `data/carer.js` (`CARE_PHRASES`) |
| 55.4 | Death / found-unresponsive workflow | ✅ DNACPR-first, expected/unexpected, contacts, suspend | `carer/workflows.js` (`renderDeathWorkflow`) |
| 55.5 | Carer absence / fitness | ✅ | `carer/workflows.js` (`renderAbsence`) |
| 55.6 | Forms & drafts | ✅ incident auto-save/resume, submit-vs-save, validation | `screens/carer.js`, `lib/carerStore.js` |
| 55.7 | Visit-completion controls | ✅ leaving-safe gating | `screens/carer.js` |
| 5 | **Roles & permissions (three-tier)** | ✅ Care Worker / Senior Carer / Team Lead, elevated-action gates (spot-check, CD witness, competency sign-off, flag triage), role-stamped audit, demo switcher | `carer/session.js`, `carer/me.js`, `data/carer.js` (`ROLE_GATES`) |
| 17 | **Non-visit Jobs** | ✅ Today/Week/Month/Overdue buckets, recurring jobs, evidence-required gating, overdue-mandatory escalation, role-locked jobs; task support level | `carer/jobs.js`, `data/carer.js` (`JOBS`) |
| 24 | **Change-request loop & handover governance** | ✅ tracked field→office request (Raised→Acknowledged→Actioned/Declined) that never mutates the plan; handover-not-a-shadow-care-plan promotion; end-of-shift open-safety-items ownership ack | `carer/changeRequest.js`, `carer/today.js` (shift summary), `lib/officeBridge.js` |
| 29a / 29b | **Documents & carer reports** | ✅ per-person offline document set (ReSPECT/DNACPR flagged), hardened export (recipient-verify, reason, watermark, expiry, approved target, no Downloads file), carer reports set | `carer/clientDetail.js`, `carer/reports.js`, `data/carer.js` (`DOCUMENT_SET`) |
| 22 | **SOS resilience & carer-harm** | ✅ carer-directed-harm flow; SOS-no-service "not transmitted" + retries + last-known-location + duress-safe cancel + office-ownership | `carer/meScreens.js` (`renderSafety`) |
| 33 | **Notification-denial policy** | ✅ delivery-state track (provider/delivered/seen/ack); denial hard-policy blocks safety-critical work until enabled / SMS fallback / office auth (hazard H26) | `carer/notifications.js` |
| 23.3 / 15 | **Assessments & continuity** | ✅ carer completes/updates/flags assessments (clinician owns determinations); regular-client continuity + lead-carer relationship | `carer/clientDetail.js` (`renderAssessments`), `carer/clients.js`, `data/carer.js` |
| 40 / 42.1 / App A | **Assurance capstone** | ✅ in-app register: DCB0129 hazard map H1–H38 (control→phase→test), §42.1 24-scenario concurrency register, Appendix-A edge-transition set, coverage note | `carer/assurance.js`, `data/assurance.js` |
| 52 / 55.8 / 56 / 57 / 58 | Platforms, config governance, v1 baseline, standards register, RACI | 🏢 assurance-owned — this doc is the traceability artefact | this file |

## Backend / assurance-owned (named dependencies, not built)
Real ECM/geofence + `[SYNC]`/`[ECM]` engines; identity/MFA/SCIM/MDM; prescribing/pharmacy/dm+d + GP
Connect; telephony fallback; DCB0129 hazard log, DCB0160 handover, DPIA, DTAC 2.0, NFR/SLO targets,
pen-testing, standards register & RACI (§52/§57/§58). The prototype **simulates the carer-facing
behaviour** these govern.
