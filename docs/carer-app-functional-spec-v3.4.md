# Carer Mobile App — Functional Specification v3.4

**Product:** Enterprise domiciliary care platform — carer-facing mobile app
**Audience:** Product and engineering (primary); clinical safety, QA, commercial (secondary)
**Status:** v3.4 — consolidated controlled draft (filename to be renamed to match version). Replaces v0.1–v0.3 (`carer-app-functional-spec.md`) and the earlier `carer-mobile-app-spec.md`; all prior content is reorganised, deduplicated and extended here. No content was dropped except true duplication. **Version history is maintained in a single Change history at the end.**

---

## 1. Purpose & scope

This is the functional specification for the carer-facing mobile app: *what it does, in what states, under what rules, how we'll know it's correct, and how important each part is.* It is organised around the carer's lived day and the entities they act on.

It covers the **carer app only**. Back-office authoring, the family app, the hard engineering designs (sync, ECM), and the assurance artefacts (DCB0129 hazard log, DPIA) are owned by the documents named in §41 and §43.

## 2. How to read this document

Each capability section uses a consistent template:

- **Purpose** — why it exists, from the carer's point of view.
- **Behaviour & states** — what it does and the states it moves through.
- **Rules & edge cases** — the conditions that separate a spec from a wish.
- **Acceptance criteria (AC)** — testable statements; the basis of the test plan and §42 traceability.
- **Priority** — MoSCoW (**M**ust / **S**hould / **C**ould) and release (**v1** / **Later**).
- **Depends on** — design docs (`[SYNC]`, `[ECM]`) or integrations (see §41).

Numeric thresholds are **not** inlined as prose; they reference the **Parameter table (§7)** so they have one source of truth. `[SYNC]` and `[ECM]` mark behaviour whose *mechanism* is owned by the Offline & Sync Engine Design and the ECM / Visit Verification Design respectively; this spec owns the *required behaviour*.

## 3. Glossary

CSO (Clinical Safety Officer) · DCB0129/DCB0160 (NHS clinical risk-management standards: manufacturer / deploying org) · dm+d (Dictionary of medicines and devices) · DNACPR (Do Not Attempt CPR) · DoLS (Deprivation of Liberty Safeguards) · DSPT (Data Security and Protection Toolkit) · ECM (Electronic Call Monitoring) · eMAR (electronic Medication Administration Record) · GP Connect (NHS access to GP record) · LOLER (Lifting Operations and Lifting Equipment Regulations) · LPA (Lasting Power of Attorney) · MCA (Mental Capacity Act) · MODS (Minimum Operational Data Standard) · MUST (Malnutrition Universal Screening Tool) · NEWS2 (National Early Warning Score 2) · PBS (Positive Behaviour Support) · PRN (*pro re nata*, as-needed) · ReSPECT (emergency care & treatment plan) · RIDDOR (injury/incident reporting regs) · SAF (CQC Single Assessment Framework: 34 quality statements, 5 key questions) · WCAG (Web Content Accessibility Guidelines) · WTD (Working Time Directive).

## 4. Personas

| Persona | Design implications |
|---|---|
| **New / low-confidence carer** | Onboarding (§10), minimal typing, contextual help (§31) |
| **Experienced carer** | Speed: voice entry, fast check-in, few taps |
| **Bank / zero-hours carer** | Open shifts (§12), pay transparency (§27), unfamiliar clients (§30) |
| **Live-in / extended carer** | Long sessions, periodic check-ins (§14), break logging |
| **Senior carer / field team lead** | Elevated permissions (§5): spot checks, sign-off, co-sign |
| **Multilingual carer** | Multi-language UI (§34), point-of-care communication aid (§24) |

## 5. Roles & permissions

| Capability | Carer | Senior carer | Team lead (field) |
|---|---|---|---|
| Deliver visits; record care/eMAR/observations/notes | Yes | Yes | Yes |
| Raise concerns / incidents / change requests | Yes | Yes | Yes |
| Controlled-drug witness/co-sign (§18) | As witness | Yes | Yes |
| Spot checks / observe other carers (§17, §28) | No | Yes | Yes |
| Competency sign-off of another carer (§28) | No | Assessor only | Yes |
| Create ad-hoc/unscheduled visit (§14) | Configurable | Yes | Yes |
| Acknowledge/triage another carer's flag | No | Yes | Yes |

**Rules:** roles are assigned centrally and may be scoped per branch/client (the access hierarchy, §10 access-control); the app reflects, never self-elevates; every elevated action is audited (§36).
**AC-5.1** A carer without senior privileges cannot access spot-check or sign-off functions. **AC-5.2** A branch-scoped role cannot be exercised outside that scope. **AC-5.3** Every elevated action records the acting role in the audit trail.
**Priority:** M / v1. **Depends on:** identity & access-control design, workforce service.

## 6. Domain model (summary)

The entities the app acts on, with primary states. This is a summary for context; the canonical model is owned by the Data Model document.

| Entity | Key states / notes |
|---|---|
| **User (Carer)** | active, suspended, leaver; holds Role(s), Competencies |
| **Shift** | scheduled → clocked-on → on-break → clocked-off (§12); night-shift mode waking / sleep-in with wake events (§14.4) |
| **Visit** | lifecycle `Scheduled → En route → In progress → Closed` (Late = flag); results held in five dimensions + reason code via VisitOutcome (§14); display labels (Missed/Cancelled/etc.) are derived, not states |
| **Client (Service User)** | active, on-hold, discharged; has CarePlan, RiskAssessments, ConsentRecords; may have a named **leadCarer** (§15) |
| **CarePlan** | versioned; change → acknowledged (§16) |
| **Task** | pending → done / partial / not-done(reason) / declined-by-person / unable; carries category (personal-care taxonomy §17.1), supportLevel, competency/scope flag (§17) |
| **Medication / MARentry** | scheduled/PRN/time-critical/controlled; **supportAction** (self-managed/prompted/supervised/assisted/administered/no-action) **×** **doseOutcome** (taken/refused/withheld/unavailable/not-required/partly-taken/administered-by-other/omitted/unknown) — two separate fields; Destroyed/Returned = MedicationStockEvent, not a dose code (§18) |
| **MedicationOrder / OrderVersion** | order `Draft → Pending verification → Active → Suspended → Superseded/Discontinued/Completed/Expired`; versioned with clinical authorisation + effective-from (§49) |
| **MedicationReconciliation / StockEvent** | reconciliation `Pending → Under review → Clarification → Confirmed/Rejected/Resolved`; stock receipt/count/return/destruction (§49/§18.1) |
| **Observation / BodyMapEntry** | recorded; validated before escalation; may breach threshold → deterioration pathway (§19); condition-specific records §19a |
| **VisitOutcome / WelfareConfirmation / SafetyChecklist / TaskActionEvent** | the five-dimension visit result, on-entry welfare outcome, leaving-safe checklist, and attributed task events (§14) |
| **Concern / Incident / SafeguardingConcern / SafeguardingDisclosure / RestraintRecord** | append-only after submit (§23); Concern (§23.1) promotes to Incident; Incident carries type (§23.2) + harmLevel + specialisedFields (falls/restraint/missing-person/exposure §23.5) + RIDDOR/CQC flags; SafeguardingDisclosure holds verbatim words + fact/interpretation split (§23.4) |
| **Alert / AlertAcknowledgement / AlertAssignment** | `Raised → Delivery attempted → Delivered → Seen → Acknowledged → Action started → Resolved` + Escalated/Transferred/Withdrawn/Reopened; severity/owner/claimed-by; critical never auto-expires (§48) |
| **AccessGrant / OfflineAccessLease / BreakGlassEvent** | grant types assignment/temporary/delegated/break-glass; lease with wipe `pending → confirmed`; break-glass online/cached/minimal-profile (§50) |
| **EmergencyProtocol / ProtocolExecution** | approved+effective; version pinned at execution start; deviation recorded (§51) |
| **InformationShareEvent** | distinct article6Basis + article9Condition + purpose + confidentiality + decisionAuthority + recipient + minimumNecessaryData (§53) |
| **HandoverNote / HandoverAcknowledgement** | author/recipient/priority/expiry/acknowledgement/clarification/promoted-to-care-plan/closure; not a sole authoritative source for lasting change (§24) |
| **ConfigurationVersion** | versioned config (threshold/protocol/competency/codeset) with owner/approver/effective-date; not applied mid-visit (§55.8) |
| **Assessment** | risk/MCA/condition/outcome; carer completes/updates/flags-for-review, not formal determination (§23.3) |
| **Note / MediaItem** | bound to a record; **submitted notes append-only/versioned** (§32/§36); MediaItem requires ConsentRecord where personal/clinical (§21) |
| **ConsumableSupply** | per-person care consumables in-stock/low/out + stored-correctly (§20) |
| **MoneyTransaction / Expense** | append-only; balance maintained (§26) |
| **TimesheetEntry / EarningsRecord** | estimated → pending → confirmed/paid (§27) |
| **TrainingRecord / Competency** | valid / due-soon / expired (§28) |
| **Message / ChangeRequest / Feedback** | raised → acknowledged → actioned/declined (§24, §16, §25) |
| **Document / DailyLog** | care plan, MAR, risk assessment, hospital passport, ReSPECT/DNACPR, policy, professional notes; read-only where authored elsewhere; offline-cached; share is policy-governed (access, purpose, lawful basis, confidentiality, MCA/representative authority, minimum-necessary; §53) + audited (§29a) |
| **AuditEvent** | immutable; one per create/edit/view of a care record (§36) |

## 7. Parameter table (resolves all thresholds)

Single source of truth for every numeric/threshold value referenced as a `[P-…]` token. All are configurable per tenant/branch unless noted; defaults are starting points for the NFR/SLO doc to ratify.

| Token | Meaning | Default |
|---|---|---|
| `[P-GEOFENCE]` | Check-in geofence radius | 100 m |
| `[P-MISSED]` | Time after planned start with no check-in → missed-visit escalation | 15 min |
| `[P-LEAVEBY]` | Lead time for the "leave by" prompt | travel time + 5 min |
| `[P-SHORTVISIT]` | Minimum duration before a visit is *not* flagged as clipping | 2 min (per visit type) |
| `[P-SYNCSLA]` | Target time for a queued action to sync once online | 60 s |
| `[P-COLDSTART]` | App cold-start target on reference device (p95) | 2.5 s |
| `[P-RENDER]` | Today/visit screen render from cache (p95) | 2 s |
| `[P-AUTOLOCK]` | Inactivity before app auto-locks | 5 min |
| `[P-PREFETCH]` | Forward window of visits/plans cached for offline | 48 h |
| `[P-SYNCWARN]` | Sync unsuccessful for this long → carer warning + escalation | 4 h |
| `[P-LOCKOUT]` | Failed logins before lockout | 5 |
| `[P-OBSWINDOW]` | Number of recent readings shown inline | last 5 |
| `[P-REFDEVICE]` | Reference low-end device for performance | (to be named with NFR doc; e.g. a sub-£120 Android) |
| `[P-APPSIZE]` | Target installed app size | ≤ 60 MB |
| `[P-PAYLOAD]` | Target sync payload per completed visit | ≤ 1 MB excl. media |
| `[P-STALECARE]` | Max age of cached care plan/protocol before warning, then blocking gated actions | warn 24h / block 72h |
| `[P-STALEMAR]` | Max age of cached MAR/medication data before warning/blocking | warn 12h / block 24h |
| `[P-OFFLINEMAX]` | Max prolonged-offline duration before mandatory escalation | 12h |
| `[P-MEDWINDOW-EARLY]` / `[P-MEDWINDOW-LATE]` | Acceptable early / late administration window before flagging | 60 min / 60 min (per med) |
| `[P-MEDTOOSOON]` | Block if administered sooner than this after last dose | per-drug min interval |
| `[P-ALERTACK]` | Critical-alert acknowledgement time before re-fire/escalate | 5 min |
| `[P-ALERTRETRY]` | Escalation retry interval if unacknowledged | 2 min, 3 retries |
| `[P-TRAINDUE]` | "Due soon" lead time for training/competency/document expiry | 30 days |
| `[P-CACHERETAIN]` | Local cache-retention window for completed/synced records | 72h |
| `[P-MEDIAMAX]` | Max media (photo/video) size per item | 10 MB (compressed) |
| `[P-QUIETHOURS]` | Default off-shift quiet-hours window | 22:00–07:00 (configurable) |
| `[P-LWCHECKIN]` | Periodic lone-worker check-in interval (long shifts) | 2h |
| `[P-FATIGUE]` | Worked-hours threshold for a fatigue/break nudge | per WTD / provider policy |
| `[P-PRNFOLLOWUP]` | Time after a PRN dose to prompt for effectiveness if unrecorded | 60 min |
| `[P-OFFLINEAUTH]` | Max period cached care data stays accessible offline without server re-validation, then login/access expires | 24h (security sign-off) |
| `[P-ACCESSGRANTCACHE]` | Max life of a cached access grant (assignment/temporary/delegated) offline before re-validation | 12h |
| `[P-BREAKGLASS]` | Duration of a break-glass emergency access grant | 2h |
| `[P-KEYSAFEREVEAL]` | Auto-remask timeout after a key-safe code is revealed | 30s |
| `[P-PROTOCOLSTALE]` | Max age of a cached emergency/clinical protocol before warn/refuse | warn 24h / refuse 72h |
| `[P-CHECKIN-EARLY]` | Permitted early check-in window before planned start | 15 min (configurable) |

---

## 8. The carer's mental model & information architecture

The carer thinks in questions; the app answers each directly. **Today** (do now, §11) · **Schedule** (what's coming, §12) · **The Visit** (deliver well, §14–§23) · **My Learning** (grow, §28) · **My Earnings/Money** (money, §26–§27). Always present on every screen: messages & alerts (§24), **SOS** (§22), sync/offline status (§32). Supporting: People I support (§15), Search (§30), My Account & compliance (§29), Help (§31).

## 9. A day in the life

> 07:30 — Amir opens **Today**: six visits, first at 08:00, "leave by 07:42", a banner that one mandatory training item is due in 5 days (§28) and £0 of an expected £128 earned (§27). 08:01 — inside the geofence, he checks in (§14/[ECM]); a red **falls risk** flag and a **no-signal** indicator show. Offline, he works the task list, records two medications with a photo check (§18), logs fluids and a repositioning, a NEWS2 set that's mildly raised prompts a deterioration check (§19), and dictates a note by voice (§21). 08:28 — checks out; actual time captured locally and queued (§14/[SYNC]). Between visits the app offers a 3-minute catheter-care micro-lesson because his next client has one (§28). 12:00 — buys shopping for a client, photographs the receipt, balance updates (§26). 13:00 — reports a near-miss with a photo (§23). 17:00 — last check-out done; **My Earnings** shows £131.40 incl. mileage, pending approval (§27); he books Tuesday off (§12) and acknowledges an updated care plan (§16).

---

## 10. Authentication, account lifecycle & device security

### Purpose
Secure the app and the carer's account across its whole lifecycle — and protect care data on real, often personal, devices. (Consolidates former §16.4 + §27 and restores device/security detail.)

### Behaviour & states
- **Daily access:** biometric or PIN unlock; offline-capable, time-boxed; auto-lock after `[P-AUTOLOCK]`.
- **Activation:** invitation (email/SMS) → first sign-in → MFA on first device registration → set biometric/PIN.
- **Recovery:** forgotten-PIN/password reset and locked-account recovery via a supported path that is *not* an auth bypass; `[P-LOCKOUT]` controls lockout.
- **Device change ("new phone"):** re-register; the old device's local data is invalidated/wiped server-side.
- **Sessions — concurrency policy (decided):** the **default is multiple registered devices but ONE active session per carer** (e.g., a managed tablet *or* a personal phone, not both live at once). Starting a session on a second device **ends the first** (or, where a provider configures a managed-tablet + personal-phone exception, both register but only one holds the active visit). This resolves the previously-open choice. Operationally: **draft ownership** stays with the device that created the draft (drafts are not visible/editable on the other device until synced); **offline edits on two devices** reconcile via the attributed-event model (§32), never silent overwrite; **session revocation** ends the active session immediately online and at lease-lapse offline (§50); **alerts route to the currently active session's device** (and to verified fallback, §33); **local-data purge** runs on the deactivated device (`pending → confirmed`, §37); **device replacement** re-registers and wipes the old (AC-10.3); an **active visit can be transferred** to the new device, carrying its in-progress record.
- **App version / forced update:** below a minimum supported version, the app blocks use with a clear "update to continue" message rather than running with an incompatible API; an in-field grace path avoids stranding a carer mid-round where feasible.
- **Offboarding:** leaver deactivation triggers remote wipe (§37).

### Rules & edge cases (device hardening)
- Encrypted local storage; **certificate pinning**; **root/jailbreak detection** with policy response; **screenshot prevention on sensitive screens**; no care data to OS backups, clipboard, or third-party keyboards on sensitive fields; **no PII in logs/crash reports**; BYOD sandboxing; MDM/EMM support for managed fleets.
- A locked-out carer mid-round has a fast, safe recovery route so care isn't blocked.

### Acceptance criteria
- **AC-10.1** Activation requires MFA on first device registration before any care data is accessible.
- **AC-10.2** A forgotten PIN can be recovered without an admin exposing credentials.
- **AC-10.3** After a device change/revocation, the old device is denied online and, offline, loses access when the lease lapses (`[P-OFFLINEAUTH]`, §50); local keys expire with the lease and wipe applies on next contact (`pending → confirmed`).
- **AC-10.4** After `[P-AUTOLOCK]`, a stolen unlocked device requires re-auth before any care data is visible.
- **AC-10.5** On a rooted/jailbroken device, the configured policy response fires; sensitive screens block screenshots.
- **AC-10.6** Default policy is multiple registered devices with one active session; starting a session on a second device ends the first (or the configured managed-tablet/personal-phone exception applies), with draft ownership, alert routing, purge, device replacement and active-visit transfer behaving as specified — never corrupting data.
- **AC-10.7** Below the minimum supported version, the app blocks use with a clear update prompt and does not run against an incompatible API.

**Priority:** M / v1. **Depends on:** identity provider (SSO/SCIM), MDM, `[SYNC]`.

---

## 11. Today (home)

### Purpose
The default screen: what to do now, what's next, anything urgent — fully offline.

### Behaviour & states
- Chronological list of today's **visits** (§14) and **jobs** (§17), each with a **derived status chip** (`Upcoming/Due now/In progress/Completed/Partially completed/Missed/No access/Cancelled/Exception`) mapped from the underlying lifecycle + dimensions (§14), not a stored visit state.
- **Next action** at top with travel time and a `[P-LEAVEBY]` "leave by".
- Summary strip: visits remaining, today's estimated earnings (§27), learning/compliance due (§28/§29).
- **End-of-shift summary:** a structured wrap-up (visits completed, outstanding items, hours, estimated pay) the carer can review and confirm.
- Banners: urgent messages, changed visits, missed-check-in warnings.

### Rules & edge cases
- Renders fully from cache with zero network within `[P-RENDER]`. `[SYNC]`
- A centrally-changed visit shows an "updated" marker after sync; an in-progress visit is never silently mutated. `[SYNC]`
- Displayed times use a trusted time source, not raw device time. `[ECM]`
- Empty state (no visits) is clear and non-alarming (§38).

### Acceptance criteria
- **AC-11.1** Offline, Today renders all of today's visits and jobs from cache within `[P-RENDER]` on `[P-REFDEVICE]`.
- **AC-11.2** A visit starting within `[P-LEAVEBY]` shows as the next action with travel time and leave-by.
- **AC-11.3** A centrally-edited visit shows an "updated" indicator post-sync and the change is in its history.
- **AC-11.4** A visit past planned start with no check-in beyond `[P-MISSED]` is flagged and escalates (§22).
- **AC-11.5** At end of shift, the carer can view a structured summary (visits completed, outstanding items, hours and estimated pay) and confirm completion.

**Priority:** M / v1. **Depends on:** `[SYNC]`, scheduling, notifications.

---

## 12. Schedule, availability & shift clocking

### Purpose
The carer's control over time, plus shift-based clocking for contracted/supported-living staff (distinct from per-visit check-in).

### Behaviour & states
- **Views:** Day / Week / Month; recurring rounds shown as patterns.
- **Shift clocking:** `scheduled → clocked-on → on-break → clocked-off`, with WTD break logging — separate from visit check-in (§14) and used in setting-based work (§14.2). Worked hours past `[P-FATIGUE]` raise a fatigue/break nudge.
- **Excessive-hours / fatigue awareness:** a duty-of-care nudge where worked/scheduled hours approach WTD or provider-set limits, and a visible prompt to take due breaks.
- **Availability:** submit available/unavailable windows (incl. recurring).
- **Leave:** request holiday/leave; see balance and status (`Requested/Approved/Declined`).
- **Swaps & open shifts:** offer a visit to the pool; request open/unfilled visits; approval state shown.
- Push on any change, with a diff ("14:00 → 14:30").

### Rules & edge cases
- Swap/pickup respects competency, training-expiry, gender/preference and WTD; ineligible pickups are blocked with a reason.
- Conflicting edits resolve by office authority, carer notified. `[SYNC]`
- DST/clock-change is handled for shifts crossing the change (§45 edge-case register).

### Acceptance criteria
- **AC-12.1** A centrally-published change pushes a notification and appears within `[P-SYNCSLA]`.
- **AC-12.2** Picking up a shift the carer lacks competency for is blocked, stating the missing competency.
- **AC-12.3** A leave request made offline is queued and submitted once, no duplication. `[SYNC]`
- **AC-12.4** Clock-on/off and breaks are recorded distinctly from visit check-in and feed pay (§27).
- **AC-12.5** As worked/scheduled hours approach a WTD or provider limit, the carer sees a duty-of-care nudge and a due-break prompt.

**Priority:** M / v1 (shift clocking: S / v1). **Depends on:** scheduling, competency (§28), HR/leave.

---

## 13. Travel & navigation

### Purpose
Travel is a large slice of the day — a first-class feature. (Consolidates mileage source from former §14/§29.)

### Behaviour
- Per-visit travel time and `[P-LEAVEBY]` prompt; whole-round inter-visit travel view.
- One-tap hand-off to the device's maps app for turn-by-turn directions (provider-agnostic).
- Access & parking notes per client shown with the route.
- Route-derived mileage feeds Earnings (§27).
- **Non-visit / business mileage:** capture travel not between visits (to the office, pharmacy, a collection) against the correct mileage category, so pay is accurate.
- **Managed offline maps:** for known low-signal rounds, map tiles for the day's route can be pre-downloaded so directions work offline.

### Rules & edge cases
- Offline: cached/last-known travel estimates; the app states when navigation needs connectivity rather than failing silently (§38).

### Acceptance criteria
- **AC-13.1** The carer can launch directions to the next visit in one tap.
- **AC-13.2** Parking/access notes are shown alongside the route.
- **AC-13.3** Total and inter-visit travel are visible and feed mileage (§27).
- **AC-13.4** Non-visit/business travel can be recorded against the correct mileage category and feeds pay distinctly from visit travel.
- **AC-13.5** For a round flagged low-signal, the day's map tiles can be pre-downloaded so directions function offline.

**Priority:** S / v1. **Depends on:** mapping integration, scheduling, finance (§27).

---

## 14. Visit lifecycle & Electronic Call Monitoring (ECM)

### Purpose
Start, deliver and close every visit with verified attendance evidence — the record that drives **billing** and **CQC inspection**.

### States
**Lifecycle state (the only visit state machine):** `Scheduled → En route → In progress → Closed`. **Late is a flag, not a state.** All other results — attendance, care delivery, record completion, verification, reason — are stored in the separate dimensions (below). The previous combined vocabulary (Missed/Aborted/Cancelled as states) is **retired**: these are now *derived display labels*, not lifecycle states.

**Display-status mapping (UI labels are derived, not stored states):**

| Display label | Underlying result |
|---|---|
| Upcoming | Scheduled |
| Due now | Scheduled, inside the due window (`[P-CHECKIN-EARLY]`) |
| In progress | Lifecycle = In progress |
| Completed | Closed + Attended + Fully delivered |
| Partially completed | Closed + Attended + Partially delivered |
| Missed | Closed + Carer did not attend |
| No access | Closed + No access |
| Cancelled | Closed/pre-closed + office Cancellation |
| Exception | Verification = manual exception, or Record-completion = missing/exception |

### Visit outcome model — five orthogonal dimensions (replaces the single "outcome")
A visit's result is **not one field**. It is recorded as five independent dimensions so reporting, billing, welfare and care quality don't collide:

| Dimension | Values |
|---|---|
| **Lifecycle state** | `Scheduled · En route · In progress · Closed` (Late is a flag, not a state) |
| **Attendance outcome** | `Attended · No access · Person absent · Person refused entry · Carer did not attend · Cancelled (office)` |
| **Planned-care outcome** | `Met · Partially met · Not met` — whether the **authorised plan was followed** (self-admin/prompt/withheld-by-instruction/verified-other can all be *Met* even where nothing was physically given) |
| **Care summary** (physical) | `Full planned care · Partial planned care · No planned care` — what **physically happened** for the person (a withheld dose = plan Met but not physically delivered) |
| **Record-completion status** | `Complete record · Missing required information · Exception authorised` |
| **Verification status** | `Verified · Manual exception · Outside geofence · Tamper suspected` |

A result reads, e.g., **Closed + Attended + Partially delivered + Complete record + Verified** — clearer and more reportable than calling the whole visit "Partial." **Billing disposition is back-office** (pending/billable/non-billable/disputed), derived from these, not chosen by the carer.

### Behaviour
- **Visit detail:** client, address, access/key-safe, time window, planned duration, tasks, co-visiting carers, required competencies, risk flags.
- **Check-in:** GPS geofence (`[P-GEOFENCE]`); fallbacks NFC tap, QR scan, telephony; last resort manual with mandatory reason (flagged).
- **On-entry welfare confirmation (structured, not a blanket "safe" tick):** the carer records one of `Person seen — presentation as expected · Person seen — concern identified · Person not seen — no access · Person not present · Person declined contact · Remote contact completed · Emergency/unresponsive · Not applicable (visit type)`. A concern/emergency routes to the deterioration protocol (§51) and, where applicable, the death workflow (§55.4). Accounts for telephone-only visits, sleep-in checks (§14.4), supported-living shift check-in (§14.2), escort visits, and family-answers-but-person-not-seen.
- **In progress:** live timer; access to care plan (§16), tasks (§17), eMAR (§18), observations (§19), notes (§21).
- **Check-out:** confirm/triage tasks, GPS verify, capture actual end/duration, optional summary, and complete the **leaving-safe checklist** (below).
- **Leaving-safe checklist (end-of-visit):** a **configurable, per-person** safety checklist completed before checkout — call bell/essentials in reach, doors locked, appliances/cooker off, person left comfortable — **with `Not applicable / Person declined / Person has capacity and chose otherwise / Left with family or professional / Transferred to hospital / Visit ended outside home / Carer left due to danger / Another carer remains / Live-in continues` outcomes** so the carer records what they observed and did, not certification of every household condition. Integrates with §55.7.
- **Outcome picker → structured reason codes:** the carer sees plain-language options; the system stores a **stable internal reason code** (see taxonomy below). The picker maps the situation to the five dimensions — e.g., *Care completed fully* → Attended + Fully delivered; *Some care completed* → Attended + Partially delivered; *Client not home* → No access/Person absent; *Client refused whole visit* → **Attended + Person refused entry + No care delivered** (a stable "attended-but-refused" result, **distinct from office Cancellation**); *Visit did not happen* → Carer did not attend (Missed).
- **Care-delivery derivation by planned support outcome (corrected):** the care-delivery dimension is `Partially delivered` only where the **planned support outcome was not met** — *not* merely where a medicine code ≠ Administered. The following are **valid full delivery**: a medicine **Self-administered** where that is the assessed support level; **Prompted/Assisted** where that was the planned support; **Not required (PRN)** with no indication; **Withheld** under valid clinical instruction; **Administered by district nurse/other** where correctly verified. Only an *unmet planned outcome* (a genuine omission, refusal against plan, task not-done/unable) makes the visit `Partially delivered` / `No care delivered`. Individual medicine status is always per-medicine on the MAR (§18), never inferred from the visit result.
- **Welfare-before-submit:** aborting/cancelling a **time-critical** visit requires a welfare check before submit (§14, scoped below in rules).
- **Evidence:** check-in/out records time, location, method, trusted-time attestation, immutably. `[ECM]`

#### Structured visit-reason taxonomy (stable codes under the friendly picker)
| Category | Reasons (internal codes) |
|---|---|
| Access | no-answer · keysafe-code-wrong · access-instructions-incorrect · unsafe-access |
| Person availability | not-home · hospitalised · planned-absence · social-leave |
| Consent | refused-entry · refused-whole-visit · refused-specific-care |
| Provider/carer | carer-unavailable · rota-error · wrong-address · duplicate-booking |
| Safety | aggression · environmental-hazard · medical-emergency · safeguarding-concern |
| Office cancellation | family-cancelled · commissioner-cancelled · package-suspended |
| Technical | app-unavailable · ecm-fallback-used |
| Other | other (mandatory explanation) |

### Rules & edge cases — enforced or flagged, never silently dropped
- Outside-geofence check-in requires a reason and is flagged; radius `[P-GEOFENCE]` per tenant/branch.
- **Anti-fraud:** mock-location/GPS-spoof detection; resistance to device-clock manipulation; clipping detection below `[P-SHORTVISIT]`; cramming detection (overlapping check-ins). `[ECM]`
- **Double-ups:** not fully delivered until all required attendees check in; partial flagged.
- **Aborted / no access:** structured flow (no answer / refused / unsafe) → records attempt, alerts office, triggers welfare protocol.
- **Mid-visit device death:** in-progress visit, timer baseline and unsynced entries restored on relaunch. `[SYNC]`
- Entire lifecycle works offline; verified times captured locally, synced later without losing evidentiary integrity. `[ECM][SYNC]`

### Acceptance criteria
- **AC-14.1** Inside `[P-GEOFENCE]`, check-in records start time, coordinates, method and trusted-time attestation and sets `In progress` within 2 s, online or offline.
- **AC-14.2** Outside the geofence, check-in requires a reason and is marked `Exception`.
- **AC-14.3** A mocked/spoofed location is recorded with a tamper flag and cannot present as a clean verified visit. `[ECM]`
- **AC-14.4** No check-in within `[P-MISSED]` raises a missed-visit escalation (§22).
- **AC-14.5** Force-close mid-visit restores the visit, timer and unsynced entries exactly. `[SYNC]`
- **AC-14.6** A double-up is not "fully delivered" until all required carers check in.
- **AC-14.7** "Unable to access" records the attempt with reason/timestamp and triggers the welfare protocol.
- **AC-14.27** On entry, the carer records a structured welfare outcome (seen-as-expected / concern / not-seen / not-present / declined / remote / emergency / N-A); a concern or emergency routes to the deterioration protocol (§51) / death workflow (§55.4).
- **AC-14.28** Before checkout, a configurable per-person leaving-safe checklist must be completed, each item resolvable as done or a defined exception (N/A, declined, left-with-family, transferred, ended-outside-home, danger, another-carer-present); an unresolved item blocks checkout or records an exception (§55.7).
- **AC-14.30** Aborting/cancelling a time-critical visit blocks submission until a welfare check is confirmed (by the defined owner and method), within a time limit, with escalation — and the carer may always leave an unsafe property first, the office assuming ownership thereafter.
- **AC-14.31** The outcome picker shows plain-language options and stores a stable internal reason code from the §14 taxonomy.
- **AC-14.32** The **planned-care outcome** is derived by whether the authorised support outcome was met (self-admin/prompt/assist/withheld-by-instruction/verified-other = Met); a separate **care summary** records what physically happened (a withheld dose = plan Met, care-summary Partial). Only an unmet planned outcome yields Partially/Not met.
- **AC-14.33** A whole-visit refusal records a stable **Attended + Person refused entry + No planned care** result, distinct from an office Cancellation.
- **AC-14.34** The visit result is stored as orthogonal dimensions (lifecycle / attendance / planned-care / care-summary / record-completion / verification); no single field conflates them; display labels are derived; billing disposition is derived back-office, not set by the carer.

**Priority:** M / v1. **Depends on:** `[ECM]`, `[SYNC]`, scheduling, billing feed, LA electronic-monitoring integration.

### 14.1 All visit types
Standard timed · double-up/multi-carer · short/welfare check (tuned `[P-SHORTVISIT]`) · telephone/virtual (non-geofenced, marked remote) · live-in/extended/waking-night (long sessions, break logging, periodic check-ins) · first visit (surfaces full assessment + baseline obs) · reablement (goal-led) · complex/clinical (competency-gated, surfaces protocols + just-in-time learning §28) · end-of-life (anticipatory meds, ReSPECT/DNACPR, sensitive-mode notes) · **escort/accompaniment** (carer takes the person out — GP appointment, outing — so location moves during the visit; ECM verifies start/end and treats movement as expected, not as a discrepancy) · ad-hoc/unscheduled.

- **AC-14.11** For an escort/accompaniment visit, location change during the visit is expected and does not raise a location-discrepancy flag, while start/end are still verified.

### 14.2 Supported living / multi-client (non-1:1) settings
**Shift-based mode:** single check-in to the *setting* (not each home, via §12 clock-on), care/eMAR/observations attributed to the correct individual, fast switching between people supported.
- **AC-14.8** In a setting, the carer checks in once and records care against multiple named individuals.
- **AC-14.9** Each entry is attributed unambiguously to one person; records never cross-contaminate.
- **AC-14.10** ECM evidence reflects setting-level attendance plus per-entry timestamps.

**Wrong-person protection (normative clinical-safety, not UX preference):**
- **AC-14.35** A **persistent person banner** (name, photograph and a secondary identifier, e.g. DOB) is shown whenever care/eMAR/observations are being recorded.
- **AC-14.36** A **two-identifier confirmation** is required before eMAR or any high-risk action.
- **AC-14.37** Switching the person is an **explicit action** (no implicit switch); on switch, **unsaved form values are cleared** and **no defaults carry over** from the previous person.
- **AC-14.38** A **similar-name warning** is shown when two people in scope have easily-confused names.
- **AC-14.39** After app resume/backgrounding, the person context is **reconfirmed** before further recording; on a shared device, a user handoff requires **reauthentication** (§50).
- **AC-14.40** Every **person-switch event is audited**.

**Priority:** S / v1 (decision-gated, §45). **Depends on:** scheduling model, `[ECM]`, data model.

### 14.3 Operational visit handling (real-world disruptions)

#### Purpose
The messy realities that disrupt a round and must be handled, not assumed away.

#### Behaviour
- **Access failure:** key-safe/entry fails → structured outcome (links to "unable to access" §14), with photo/note and office alert.
- **Visit running over:** flag an overrun, see the knock-on to the rest of the round, and notify the office so later visits can be adjusted.
- **Client not home / hospital admission:** record the person is absent/admitted, suspending the visit appropriately and alerting the office (and pausing scheduled care).
- **Pet / environment hazard:** record and surface hazards in the home (aggressive pet, hoarding, unsafe access) — feeds the §22 pre-visit safety briefing.
- **Equipment-in-the-home register:** see what equipment is in the person's home (hoist, bed, sensors) and flag missing/faulty (links §20).

#### Acceptance criteria
- **AC-14.12** An access failure is recorded with a structured reason, optional photo, and an office alert.
- **AC-14.13** A visit overrun can be flagged and its knock-on to the round is surfaced to the office.
- **AC-14.14** A client-not-home/hospital-admission outcome suspends the visit and alerts the office.
- **AC-14.15** A home/pet hazard recorded on a visit is surfaced in the pre-visit safety briefing (§22) for the next carer.

**Priority:** M / v1 (overrun knock-on & equipment register: S / v1). **Depends on:** scheduling, notifications, safety (§22), equipment (§20).

### 14.4 Night shifts (waking & sleep-in)

#### Purpose
An 8–12+ hour night in one person's home is a different operating model from the short-visit loop the rest of §14 assumes: **one continuous presence**, care delivered **at intervals**, crossing midnight, on a device that must last all night. Two modes — **waking night** (awake/active throughout) and **sleep-in / sleeping night** (the carer rests but is on-call) — differ in recording, safety and pay.

#### Behaviour & states
- **Shift-level ECM:** a single check-in/out for the whole shift at the setting (not per-task), using §12 clock-on/off; the geofence/verification (§14) applies once at start and end, not repeatedly.
- **Interval night rounds:** scheduled repositioning (pressure care), continence checks, medication and comfort/safety rounds at set intervals; the app shows **what's due**, prompts gently, and **flags missed rounds**. Each round is its own timestamped record within the shift.
- **Waking vs sleep-in:** the shift's mode is explicit. For **sleep-ins**, the carer logs **wake events** — when woken, why, and what care was given — so the disturbed periods are evidenced.
- **Periodic lone-worker check-ins (§22):** expected at intervals of `[P-LWCHECKIN]` across the shift, not only at the start; a missed periodic check-in escalates.
- **Quiet/night UI:** low-disturbance mode — dark, dimmed, gentle prompts — so recording in a dark bedroom doesn't disturb the person.
- **End-of-shift handover:** a structured night summary (rounds done, wake events, concerns, sleep observed) hands over to the morning carer/office (§24, §11).

#### Rules & edge cases
- **Cross-midnight correctness:** the shift, daily log, "today" view, **24h PRN ceilings (§18)**, fluid-balance and intake totals (§19) all span the date boundary correctly; a round at 02:00 belongs to the right care day per policy.
- **DST clock change** mid-shift is handled (trusted time, §45) so duration and pay are correct on the two nights a year it occurs.
- **Battery & offline over a long shift:** the offline prefetch window (`[P-PREFETCH]`) must cover the whole shift, and battery-efficient operation is required so the device survives 12+ hours (low-battery nudge §38).
- **Sleep-in pay nuance:** the app **records hours present and wake events accurately**; it does **not** decide whether sleep-in hours are payable — that legal/payroll determination is applied by the pay-rules engine (§27) and is an open decision (§44), not hard-coded here.

#### Acceptance criteria
- **AC-14.16** A night shift uses one shift-level check-in/out covering the whole period, with care recorded at intervals throughout.
- **AC-14.17** Scheduled night rounds (e.g., repositioning) show as due, prompt gently, and a missed round is flagged.
- **AC-14.18** A sleep-in shift records wake events (time, reason, care given) distinct from waking-night recording.
- **AC-14.19** Periodic lone-worker check-ins are expected across the shift; a missed one escalates (§22).
- **AC-14.20** Records, 24h ceilings and totals spanning midnight (and a DST change) are attributed to the correct care day and duration.
- **AC-14.21** Night/low-disturbance UI is available; the device's offline window and battery handling support a full 12-hour shift.
- **AC-14.22** Hours present and wake events are recorded accurately for payroll; the app does not itself apply the sleep-in pay rule.

**Priority:** M / v1 (sleep-in wake-logging & night UI: S / v1). **Depends on:** §12 (clocking), `[ECM]`, §18/§19 (24h totals), §22 (safety), §27 (pay), `[SYNC]`. **Standards:** CQC Safe (night-time care/pressure care); WTD; sleep-in pay determined by payroll policy/case law (open decision §45).

### 14.5 Double-up / multi-carer working

#### Purpose
Some visits require two (or more) carers — typically for safe moving-and-handling (hoist transfers) or complex care. The visit-type list (§14.1) and AC-14.6 name double-ups; this specifies how two carers actually **work the same visit together**.

#### Behaviour
- **Mutual presence:** each carer sees who else is attending and **whether the other has checked in**.
- **Co-recording without collision (event-based merge):** both carers record against the **same visit** concurrently; each action is **attributed to the individual carer as an event and merged, never overwritten** (so one carer's `Complete` cannot silently replace another's `Unable`). **Contradictory outcomes on the same task trigger a review** rather than a silent winner; **joint tasks require all required identities**; corrections create a new version, preserving prior evidence. (Distinct from low-risk free text, which may last-write-win, §32.)
- **Shared task split:** double-up tasks can be assigned/claimed between the attending carers so work isn't duplicated or missed.
- **Joint sign-off where required:** tasks needing two people (e.g., hoist transfer, controlled-drug witness §18) record **both carers**.

#### Rules & edge cases
- **Single-carer-attended safety block:** if only one of two required carers is present, tasks that require two people (hoist transfer, etc.) are **blocked/flagged as unsafe to perform alone**, not silently marked done — the carer records the situation and the office is alerted.
- **Second carer running late:** the visit shows partial attendance; the present carer can record what's safely possible and the shortfall is flagged.
- Each carer's check-in/out and time are recorded individually (pay/verification per carer, §27).

#### Acceptance criteria
- **AC-14.23** On a double-up, each carer sees the other's attendance status and both can record against the same visit without overwrite.
- **AC-14.24** A two-person task is blocked/flagged when only one required carer is present and cannot be marked complete as if done safely.
- **AC-14.25** A two-person task records both attending carers; each carer's time is captured individually for pay/verification.
- **AC-14.26** Partial attendance (second carer late/absent) is flagged and the safely-completable work can still be recorded.
- **AC-14.29** On a shared/double-up visit, concurrent task actions are attributed and event-merged with no overwrite; contradictory outcomes on one task trigger a review rather than a silent winner, and joint tasks require all required identities.

**Priority:** M / v1. **Depends on:** scheduling, `[ECM]`, `[SYNC]` conflict policy (§32), §27.

---

## 15. People I support (service-user information)

### Purpose
Everything the carer needs about the person, at the visit and offline.

### Behaviour
- "About me", preferences, communication needs, life history.
- Current care plan and goals; risk assessments and flags.
- Access details (key-safe/entry), emergency contacts, GP, professional contacts.
- Recent notes, observations and medication history relevant to delivery.
- **My regular clients:** a continuity view of the people the carer most often supports, for faster access on a familiar round (respects access scope §10).
- **Named lead carer (client ownership):** a carer can be the **named lead** for a person — the continuity point who knows them best, contributes to/owns their reviews, and helps coordinate the others on that package. The lead sees an ownership view of their clients, is surfaced to colleagues on the visit, and is the default routing for that person's concerns/change-requests (§23/§24). This is a **client relationship**, distinct from the senior/team-lead **permission role** (§5).

### Rules & edge cases
- Access is consent- and role-governed (§5, §10); the carer sees only assigned/covered clients.
- Sensitive information follows the person's sharing preferences.

### Acceptance criteria
- **AC-15.1** An assigned client's plan, risks and access info are viewable offline.
- **AC-15.2** A non-assigned client's record is not accessible (and not returned by search §30).
- **AC-15.3** A care-plan change since the last visit is clearly flagged (acknowledgement §16).
- **AC-15.4** The carer can reach their regularly-supported clients via a continuity view, within access scope.
- **AC-15.5** A named lead carer sees an ownership view of their clients, is surfaced to colleagues on those visits, and is the default routing for those clients' concerns/change-requests (§23/§24).

**Priority:** M / v1. **Depends on:** `[SYNC]`, access-control model, care-planning service.

---

## 16. Care planning, consent & MCA at point of care

### Purpose
Deliver against the current plan, and record/respect consent and capacity — a first-class legal requirement (MCA), not a footnote. (Consolidates former §11 plan view + §19 consent + §34 acknowledgement.)

### Behaviour & states
- View structured, person-centred care plan and goals; condition context per task.
- **Care-plan change acknowledgement:** a materially changed plan prompts the carer to acknowledge the current version before recording against it; acknowledgement stored with version + timestamp.
- **Consent & capacity — decision-specific and time-specific (never a person-level yes/no):** capacity is **always shown in relation to a specific decision at a relevant time** — with assessment date, assessor, review date, supporting evidence/authority, and whether capacity **fluctuates**. The app **never displays a generic "has/lacks capacity" person flag.** **LPA authority is shown with its scope** — a health-and-welfare attorney does not automatically control every decision, and a property-and-affairs LPA is different again. The carer **records** consent given / refusal / unable-to-communicate / observations relevant to capacity / a request for formal review — the carer is **not** presented as making a formal capacity determination (that stays with the qualified assessor, §23.3). A refusal of care is not in itself evidence of lack of capacity.

### Rules & edge cases
- A recorded refusal of consent blocks "done" and routes to `declined-by-person`, never silently complete; a refusal is not treated as incapacity.
- Fluctuating capacity: show the most recent assessment, its decision scope and date; never treat a stale assessment as current; flag overdue reviews.

### Acceptance criteria
- **AC-16.1** A materially changed plan prompts acknowledgement (version + timestamp, audited §36) before care is recorded against it.
- **AC-16.2** A task requiring consent can be recorded given/refused/unable-to-communicate; a refusal prevents "completed" and is not recorded as incapacity.
- **AC-16.3** Capacity is shown per-decision and per-time (assessment date, assessor, review date, authority, fluctuation), never as a generic person-level status; for a person lacking capacity for a decision, the relevant authority (LPA with its scope / deputy / best-interests) is shown before the related task.
- **AC-16.4** A capacity assessment shows its decision scope and date and flags overdue review; the carer can request a formal review but is never presented as making the determination.

**Priority:** M / v1. **Depends on:** care-planning service, access-control, clinical-safety hazard log (§40).

### 16a. Reablement & outcomes-based care

#### Purpose
Reablement is a distinct, **time-limited** service aimed at restoring independence — measured by **outcomes/progress**, not just tasks done. The spec tracks goals (§16) but not the reablement model.

#### Behaviour
- **Outcome goals** with a baseline, target and **time-limited package** (e.g., 6 weeks).
- **Progress recording** against each goal per visit (improved / same / declined; what the person did themselves vs needed help).
- **Step-down of support:** the expected reduction in support over the package, visible to the carer so they encourage independence rather than do-for.
- **Outcome review** at package end (goal met / partially / not).

#### Acceptance criteria
- **AC-16a.1** A reablement client shows time-limited outcome goals with baseline and target.
- **AC-16a.2** The carer can record progress against each goal per visit, including what the person did independently.
- **AC-16a.3** The expected step-down of support is visible, prompting an enablement (not task-completion) approach.

**Priority:** S / v1 (decision-gated §44). **Depends on:** care-planning/goals, tasks (§17). **Standards:** CQC Effective/Responsive; reablement best practice.

---

## 17. Tasks & jobs (today / weekly / monthly)

### Purpose
The carer's complete to-do list: visit tasks plus non-visit duties that otherwise live on paper.

### Behaviour & states
- **Visit tasks:** tick complete, mark not-done (reason), partial, declined-by-person (§16), add ad-hoc.
- **Task instruction & rationale:** each task can carry the **method/how** (e.g., a specific moving-and-handling technique, a personal-care preference) and is **linked to the care-plan need/outcome** it serves, so the carer understands not just *what* but *how* and *why*.
- **Support level on care tasks:** like medicines (§18), a care task carries the level of support the person needs — **prompt / supervise / assist / fully support** — so expected action and recording match the person's independence and care plan.
- **Jobs view** across **Today / Week / Month / Overdue**: stock checks, supply restock, spot checks (senior), supervisions/sign-offs, policy reads (§29), training due (§28), client errands, vehicle/PPE checks, timesheet submission (§27).
- Each job: due horizon, priority, optional location, completion evidence (tick/note/photo/form); recurring jobs regenerate.

### Rules & edge cases
- Central and self-added jobs both appear; source visible. Evidence-required jobs can't complete without it. Overdue mandatory jobs escalate (§28/§29).

### Acceptance criteria
- **AC-17.1** Jobs filter by Today/Week/Month/Overdue. **AC-17.2** A recurring job schedules its next occurrence on completion. **AC-17.3** An evidence-required job can't be marked complete without it. **AC-17.4** An overdue mandatory job escalates per its rule.
- **AC-17.5** A task can display its method/instructions and the care-plan need/outcome it links to.
- **AC-17.6** A care task displays its support level (prompt/supervise/assist/fully support), consistent with the person's care plan.

**Priority:** M / v1 (non-visit jobs: S / v1). **Depends on:** task service, recurrence engine, §28, §29.

### 17.1 Personal-care taxonomy

#### Purpose
Personal care is the core of most visits and the main evidence for dignity, continence, skin integrity and nutrition. It must be **structured and codifiable** — surfaced from the person's care plan, not a free-text box — so it can be recorded consistently and evidenced at inspection.

#### Behaviour & states
Each personal-care item is a task (§17) that carries: its **support level** (prompt / supervise / assist / fully support), an **outcome** (`Done / Partial / Declined-by-person / Unable (reason)`), **consent** capture (§16), an optional person-centred note, and a **competency/scope flag** where relevant. Items are drawn from the person's care plan; the catalogue below is the configurable master list.

| Category | Sub-tasks (examples) | Links / flags |
|---|---|---|
| **Washing & bathing** | Bed bath, assisted wash, strip wash, shower, bath | Dignity; skin check (§19) |
| **Oral / mouth care** | Teeth/denture cleaning, mouth care | — |
| **Grooming** | Hair wash/styling, shaving, **nail care** | Diabetic/high-risk **nail care = podiatry, out of scope** flag |
| **Toileting & continence** | Toilet/commode assist, **pad/continence-product change**, **catheter care**, **stoma care**, **bowel care** | Continence outcome → §19; catheter/stoma/bowel **competency-gated** (§28, §14.1) |
| **Dressing & appearance** | Dress/undress, choose clothing, glasses/hearing aids/dentures | Dignity; choice/independence |
| **Skin & pressure care** | Apply emollient/barrier cream, **repositioning/turning**, check pressure areas | Body maps + repositioning (§19); equipment (§20) |
| **Mobility & transfers** | Assist to move, **transfers (bed↔chair)**, **hoist use**, walking/steadying, falls assistance | Moving-and-handling / LOLER (§20); competency |
| **Eating & drinking** | Meal prep, assist to eat, **feeding**, encourage fluids, specialist/texture-modified diet (IDDSI), allergies | Food/fluid intake & targets (§19) |
| **Comfort & wellbeing** | Companionship, reassurance, orientation, emotional support | *Caring* evidence |
| **Domestic linked to care** | Bed-making, light tidying of the care environment, laundry (where in package) | Kept distinct from clinical care |

#### Rules & edge cases
- **Support level governs the record:** "prompted to wash" and "fully supported to wash" are different entries; the recorded action must match the level (ties to AC-18.9 logic).
- **Dignity & consent:** personal care is intimate — capture consent/refusal (§16 MCA), use person-centred language, and a refusal routes to `Declined-by-person`, never silently "done".
- **Competency & scope boundaries:** clinical personal care (catheter, stoma, bowel care, PEG-related) is competency-gated (§28) and tends to the complex visit type (§14.1); items flagged out of scope (e.g., diabetic/high-risk **toenail cutting → podiatry**) are surfaced as not-for-carer. The exact in/out-of-scope list is **configurable per provider** and confirmed with their clinical lead.
- **Cross-links:** continence and food/fluid outcomes feed §19; skin/pressure and repositioning feed §19/§20.

#### Acceptance criteria
- **AC-17.7** Personal-care items are selected from a structured, care-plan-driven catalogue (not free text) and each records support level, outcome, consent and optional note.
- **AC-17.8** A personal-care item refused by the person is recorded as `Declined-by-person`, never as completed (§16).
- **AC-17.9** A competency-gated personal-care item (e.g., catheter/stoma) is unavailable to a carer lacking that competency and is surfaced as competency-required (§28).
- **AC-17.10** An out-of-scope item (e.g., diabetic nail care) is shown as not-for-carer per the provider's configuration.
- **AC-17.11** Continence, food/fluid and skin/repositioning personal-care entries feed the corresponding observation records (§19/§20).

**Priority:** M / v1. **Depends on:** care-planning catalogue, competency service (§28), consent (§16), observations (§19/§20). **Standards:** CQC dignity/person-centred care; NICE NG67 (medicines support levels mirror care support levels).

---

## 18. Medication administration (eMAR)

### Purpose
Record medication safely at point of care, with verification, stock awareness and a complete audit trail. (Consolidates former §6 + §22 stock.)

### Behaviour & states
- Schedule: `Scheduled / PRN / Time-critical / Controlled`.
- **Support level (per medicine):** each medicine carries the person's assessed level of medicines support — **Self-administered** (person manages it), **Prompt/remind**, **Assist** (help access, e.g. open packaging), or **Administer** (carer gives it and is accountable) — surfaced to the carer so they know what they are and aren't expected to do. Per NICE NG67/CQC, **every level of support, including prompting and assisting, is recorded on the MAR**, not just full administration. Self-administration follows the person's risk assessment.
- **Support action and dose outcome are recorded as TWO separate fields (a single code can't carry both).** Example: the carer *Prompted* and the person then *Refused* — that needs **SupportAction = Prompted** and **DoseOutcome = Refused**, not one conflated code.
  - **`supportAction`**: `self-managed · prompted · supervised · assisted · administered · no-action`
  - **`doseOutcome`**: `taken · refused · withheld · unavailable · not-required · partly-taken · administered-by-other · omitted · unknown`
  - An **omission/reason code** is captured where the outcome is not a clean "taken/administered".
  - **Destroyed / returned are NOT dose outcomes** — they are **MedicationStockEvents** (§18.1/Appendix E), not MAR administration codes.
- The configurable set is still aligned to the dispensing pharmacy's MAR conventions (no single national standard); the support-action × dose-outcome pair maps onto the provider's printed-MAR letters for evidence.
- Verification: barcode or photo match against the prescribed item.
- **PRN ("when required") protocol:** each PRN medicine surfaces its plan/MAR-linked protocol — the **indication** (the specific symptom/sign to give for, person-centred), **dose** and **dose range**, **maximum in 24 hours**, and **minimum interval between doses**. At administration the carer records the reason and, afterwards, the **effectiveness/response**. The app maintains a **running 24-hour total across all visits and carers** and **warns/blocks before the 24h maximum or minimum interval would be breached**, so a later carer can't unknowingly exceed it. PRN is given **when the symptom occurs, not forced onto a fixed round**. **Seizure rescue / emergency PRN** follow their plan-linked protocol (§19).
- Controlled drugs: **witness/co-signature by a second authenticated user** (not a typed name), running balance, and **stock-discrepancy flagging** — a balance mismatch is raised to the office/CD lead, not silently accepted.
- Topical/transdermal: body-map site (§19).
- **Stock:** view quantity remaining where tracked; record a count; flag low-stock/reorder → office task (§17) / pharmacy.

### Rules & edge cases (safety-critical — DCB0129)
- Make **wrong-client** and **wrong-time** administration hard: client identity confirmed in-context; time-critical meds prompt prominently; **drug selection guards against the wrong-item hazard** (§40).
- Allergy/contraindication surfaced **before** recording. Missed/overdue/late raise alerts (alert-fatigue mitigations §40).
- Offline administrations carry the **actual** administration time, never sync time. `[SYNC]`
- An eMAR record is **never silently overwritten** by conflict resolution; conflicts are surfaced for review. `[SYNC]`
- **Partial round (per-item outcome):** a medication round is **one record per medicine**, each closed with an administration code; the visit/round **cannot be completed until every scheduled medicine has an outcome** — no blanks. (E.g., 10 due, 3 taken → 3 `Administered`, 7 each coded with a reason such as `Refused`/`Withheld`.)
- **Repeated refusal / omission escalation:** a configurable run of refusals/omissions for a medicine (e.g., across a day or consecutive visits) raises a **concern/alert** to the office (§23), because a pattern of non-administration is a safety signal, not routine.

### Acceptance criteria
- **AC-18.1** Recording administration captures item, dose, actual time, method and carer identity, immutably.
- **AC-18.2** A refusal/withholding requires a reason before the item closes.
- **AC-18.3** A controlled drug can't complete without the configured witness/co-signature by a second authenticated user.
- **AC-18.3a** A controlled-drug running-balance discrepancy is flagged to the office/CD lead and cannot be silently accepted.
- **AC-18.4** A known allergy/contraindication is surfaced before administration can be recorded.
- **AC-18.5** Two offline edits to one MAR entry surface a conflict on sync; neither version is discarded. `[SYNC]`
- **AC-18.6** Low stock at administration is surfaced and can raise a reorder task.
- **AC-18.7** A seizure rescue medication presents its plan-linked protocol before administration.
- **AC-18.8** Administration is recorded against a configurable code set; a non-administration code requires a reason, and the code is preserved on the MAR record and audit trail.
- **AC-18.9** Each medicine displays its support level (self-administer/prompt/assist/administer); prompting and assisting are recordable on the MAR, not only full administration.
- **AC-18.10** A PRN medicine displays its indication, dose range, 24h maximum and minimum interval; the app maintains a 24h running total across visits/carers and warns or blocks before the maximum or minimum interval is breached.
- **AC-18.11** PRN effectiveness/response can be recorded after administration and is stored against the PRN event; if unrecorded within `[P-PRNFOLLOWUP]`, ownership passes down the chain (administering carer → next carer → lead → office/on-call → clinical for high-risk) and the pending item appears in end-of-visit, end-of-shift, handover, lead dashboard and office queue. "Cannot assess — person no longer observed" is a recordable outcome.
- **AC-18.12** A scheduled medicine left blank does not trap the carer: the **medication round** cannot reach `Complete record` while any scheduled item is unrecorded, **but the visit may still move to lifecycle `Closed`** if the carer must leave — in which case its **RecordCompletionStatus = Missing required information** (or Exception authorised), and an alert + follow-up task are generated (§48). No silent gap, no trapped carer.
- **AC-18.13** A configurable run of refusals/omissions for a medicine raises a concern/alert to the office (§23).
- **AC-18.15** Support action and dose outcome are recorded as two separate fields; e.g. Prompted + Refused is recordable as such, and Destroyed/Returned are stock events, not dose outcomes.
- **AC-18.16** Medication exception outcomes are explicitly handled — dose dropped/spilled, medicine damaged/packaging-compromised/unidentifiable/loose, partly-taken, vomited shortly after, uncertain-whether-swallowed, suspected duplicate, wrong-medicine-taken-independently, crush/open-where-authorisation-required, packaging-mismatch, dispensing-error-unavailable, and error-discovered-after-leaving — each defining immediate action, whether stock changes, whether another dose may be given, clinical-contact requirement, incident requirement, MAR outcome and reconciliation requirement.
- **AC-18.17** The three administration-window rules (scheduled window, minimum interval, rolling 24h maximum) are evaluated independently and the app shows the exact block reason (too-early / interval-not-met / 24h-max-reached / order-not-effective / dose-history-stale).

**Priority:** M / v1. **Depends on:** `[SYNC]`, dm+d/SNOMED, pharmacy integration, cross-visit PRN aggregation, clinical-safety hazard log (§40). **Standards:** NICE NG67 (community), NICE SC1 (homes), NICE NG46 (controlled drugs), CQC medicines guidance.

### 18.1 Controlled-drugs (CD) governance support

#### Purpose & boundary
CQC and NICE NG46 require the **registered provider** to operate a controlled-drugs policy — secure storage, a CD register, witnessed destruction/return, regular reconciliation, and a named accountable person. **These are provider/back-office governance duties; the carer app *supports* them but is not, and cannot be, the policy.** This section specifies the **carer-app surface** that maps to those expectations.

#### Carer-app CD functions (supporting the provider policy)
- **Authenticated witnessing:** CD administration requires a second authenticated user as witness (AC-18.3), recorded against both identities.
- **Witness eligibility (default rule — configurable, clinically ratifiable):** an eligible witness **is on duty, physically present through the administration, holds current medication competency and the specific CD competency with valid (non-expired) training, uses a different authenticated account, and independently confirms the medicine, quantity and resulting balance.** **Remote witnessing is prohibited by default** (a provider may enable it only as a separate, explicitly-configured controlled workflow). Client-assignment is preferred but not mandatory if the other criteria are met.
- **No eligible witness available:** the carer is **not trapped in an open MAR round** — the app offers a defined fallback (record the dose as `pending-witness` / contact the on-call CD lead per policy / defer per the person's clinical risk), logs the reason, and routes to the CD lead. The decision is provider-configured, never a dead end.
- **Running balance & reconciliation aid:** the carer records the CD balance; a discrepancy is flagged to the office/CD lead and **cannot be silently accepted** (AC-18.3a).
- **CD administration record:** immutable, audited (§36), with quantity given and balance remaining.
- **Discrepancy / concern routing:** a CD discrepancy or concern routes to the office and the named CD lead (§23).

#### Out of scope here (back-office / provider policy — not the carer app)
Secure storage standards, the formal CD register, witnessed destruction and returns, scheduled reconciliation audits, and the named accountable-person governance — owned by the provider's CD policy and back-office system. The carer app feeds these but does not discharge them.

- **AC-18.14** A CD administration records quantity given, witness identity and resulting balance, immutably; a discrepancy routes to the CD lead and blocks silent completion.
- **AC-18.18** A CD witness must meet the configured eligibility rule (on-duty, present, medication + CD competency with valid training, different authenticated account, independent confirmation); remote witnessing is prohibited unless explicitly enabled as a separate controlled workflow.
- **AC-18.19** When no eligible witness is available, the app offers a defined, logged fallback (pending-witness / on-call CD lead / policy-defined deferral) and never traps the carer in an open MAR round.

**Standards:** NICE NG46; CQC controlled-drugs expectations. **Note:** confirm the carer-app/back-office split and the named CD lead with the provider's clinical governance.

---

## 19. Observations, vitals, deterioration & body maps

### Purpose
Capture wellbeing data, **detect deterioration early**, and document skin/wounds. (Adds the deterioration pathway and device pairing that were missing.)

### Behaviour
- Observations: weight, temp, BP, pulse, SpO2 (manual or paired device), fluids, food/nutrition + MUST, bowel/continence, repositioning, sleep, mood, pain scales, **PBS-linked behaviour logs**, seizure log.
- **Food & fluid targets and running totals:** where a daily fluid target (and/or nutritional intake goal) is set for a person, the app maintains a **running total across all of the day's visits** and shows progress toward the target; a configurable **low-intake alert** fires when intake is tracking short (e.g., by late afternoon) so dehydration/poor nutrition is caught early and can escalate to the deterioration pathway.
- **Early-warning scoring (e.g., NEWS2):** where configured, a vitals set computes a score; a raised score triggers a **deterioration pathway** prompt (escalate / contact / record action) rather than only the generic incident route.
- Body maps: skin integrity, wounds, pressure areas, bruising — with photo (§21) and measurement.
- **Vital-sign device pairing:** Bluetooth pairing flow for supported devices.
- Recent readings inline (`[P-OBSWINDOW]`); charts configurable per client.
- **Per-person baseline & normal range:** each observation can carry that individual's normal/target range (e.g., "normal SpO2 92%, alert below 90"), so a reading is judged against *their* baseline, not a generic one, and abnormal values flag accordingly.
- **Trend view:** a visual trend/graph of an observation over time (not just the last few values), which is what actually reveals gradual decline.
- **Monitoring schedule:** time-bound monitoring (e.g., "BP twice daily for 7 days") is shown to the carer with what's **due**, by whom requested, and the end date.
- **Repositioning chart (pressure care):** for a person at pressure-damage risk, repositioning is a **scheduled chart** (per care-plan interval, e.g., every 2–4 hours) — not only an ad-hoc observation. The app shows **last-turned time, position, next due and overdue** status across visits/carers, prompts when due, and flags a missed turn (consistent with the night-round model §14.4). Each turn records time, position and skin check, feeding body maps (§19) and skin integrity.

### Acceptance criteria
- **AC-19.1** A reading can be recorded offline with timestamp and shows the last `[P-OBSWINDOW]`.
- **AC-19.2** A body-map entry supports a site, photo and measurement/notes.
- **AC-19.3** A configured early-warning score that crosses its threshold launches the deterioration pathway, not just an incident.
- **AC-19.4** A supported vitals device can be paired and its reading attributed to the correct client and time.
- **AC-19.5** Where a daily fluid/nutrition target is set, intake recorded across visits accrues into a running total visible to the carer with progress to target.
- **AC-19.6** Intake tracking short of target by the configured point triggers a low-intake alert, which can escalate to the deterioration pathway (AC-19.3).
- **AC-19.15** For a person on a repositioning regime, the app shows last-turned time, position and next-due/overdue across visits and carers, prompts when due, and flags a missed turn.
- **AC-19.16** Each repositioning entry records time, position and skin check, feeding the body map and skin-integrity record.
- **AC-19.12** Where a person has a per-observation baseline/normal range, a reading is judged against that range and flags if abnormal for them.
- **AC-19.13** An observation can be viewed as a trend over time, not only as recent values.
- **AC-19.14** A time-bound monitoring instruction shows the carer what is due, who requested it, and its end date.
- **AC-19.17** Observation values are validated before they can drive escalation: physiologically impossible values, unit mismatch, decimal-place/wrong-unit errors are caught and prompt correction; a repeat-reading prompt is offered; device disconnection and sensor/calibration warnings are surfaced; a manual correction preserves the original (§36); a wrong-person device result and an edited imported result are flagged.
- **AC-19.18** A Bluetooth reading stores device ID/model, measurement time, transfer time, unit, calibration/status, whether manually edited, and the original device value; the **measurement time is distinguished from the record time**.
- **AC-19.19** A **person-specific baseline alert is distinct from the standard NEWS2 calculation** — a personal baseline may change *alerting*, but it does not silently alter the underlying NEWS2 score, which is always computed and shown on the standard scale.
- **AC-19.20** A body-map/wound entry uses structured vocabulary, not free text alone: anatomical site, left/right, front/back, wound type, pressure-ulcer category, length/width/depth, exudate, odour, surrounding skin, dressing applied, pain, infection signs, comparison-with-previous, review/escalation due date, and a photo-quality confirmation.

**Priority:** M / v1 (NEWS2, device pairing & food/fluid targets: S / v1). **Depends on:** observation config, body-map library, deterioration protocol, Bluetooth device integration, cross-visit intake aggregation (`[SYNC]`).

### 19a. Condition-specific care records

#### Purpose
Generic observations (§19) aren't enough for clients with specific conditions. These need **structured, condition-specific records** with their own fields, thresholds and protocols. The catalogue is **configurable per care plan**; standard items are first-class, **clinical/complex items are competency-gated** (§28) and tend to the complex visit type (§14.1).

| Record | Key structured fields | Thresholds / protocol | Gating |
|---|---|---|---|
| **Diabetes / blood glucose** | Reading (mmol/L), pre/post-meal, time | **Hypo / hyper thresholds → alert + hypo protocol**; CGM/Libre-aware | Standard; insulin = gated |
| **Insulin administration** | Type, **units**, **injection site (rotation)**, time | Links to eMAR (§18); double-check high-risk | Competency-gated |
| **Catheter care** | Output volume, colour, bag type (leg/night), bag change | Blockage/no-output → escalate (§19/§22) | Gated |
| **Stoma care** | Output, appliance/bag change, peristomal skin | Skin breakdown → body map (§19) | Gated |
| **PEG / enteral feeding** | Feed type/rate, flush, site care, residual/position check | Site infection / dislodgement → escalate | Competency-gated (complex) |
| **Respiratory** | Oxygen flow rate + **SpO2 target range**, nebuliser, CPAP/ventilation, **suction**, tracheostomy care | Sats out of range → deterioration pathway (§19) | Oxygen = gated; trach/vent = complex-gated |
| **Epilepsy / seizure** | Type, duration, recovery, triggers, post-ictal state | **Rescue-med trigger → PRN protocol (§18)**; prolonged → emergency | Rescue med = gated |
| **Bowel care** | **Bristol Stool Chart** type, regime, last-opened | Constipation/no-output flag (links nutrition/fluids §19) | Standard / gated for interventions |
| **Fluid balance chart** | Formal **input/output** totals | Negative balance → alert (extends §19 running total) | Standard |
| **Pain (structured)** | Scale incl. **non-verbal tools (e.g., Abbey)** | Threshold → review / PRN (§18) | Standard |
| **Wound care** | Type, measurement, dressing, exudate, photo (§21) | Deterioration → escalate; competency for dressings | Gated for dressings |

#### Rules & edge cases
- Each record is **plan-driven** (only the conditions the person has appear), competency-gated where flagged, and feeds the **deterioration pathway** (§19) and **PRN/rescue** (§18) where thresholds/triggers are crossed.
- Device pairing (§19) applies where a connected meter/sensor exists (e.g., glucose meter).
- Clinical scope (which records a carer may perform vs a nurse) is **configurable per provider** and confirmed with the clinical lead — the app surfaces gating, it does not authorise practice.

#### Acceptance criteria
- **AC-19.7** Only the condition-specific records in the person's care plan are presented; each captures its structured fields with trusted-time stamp.
- **AC-19.8** A reading crossing a condition threshold (e.g., hypo glucose, low SpO2) raises the appropriate alert/protocol and can escalate to the deterioration pathway.
- **AC-19.9** A competency-gated record (e.g., catheter, PEG, insulin) is unavailable to a carer without that competency and is surfaced as competency-required (§28).
- **AC-19.10** A seizure rescue trigger links to the PRN protocol and its 24h ceiling (§18, AC-18.10).
- **AC-19.11** Insulin administration records units and injection site, with site-rotation prompting.

**Priority:** M / v1 (complex/nurse-led records: S / Later, decision-gated §44). **Depends on:** care-planning catalogue, competency (§28), eMAR (§18), deterioration protocol (§19), device pairing. **Standards:** NICE condition guidance; CQC Safe/Effective; provider clinical governance.

### 19b. End-of-life & palliative care

#### Purpose
§14.1 names EOL; this gives it the depth the regulator expects in someone's last weeks/days.

#### Behaviour
- **Anticipatory ("just-in-case") medication** record, linked to PRN protocols (§18).
- **Symptom tracking** — pain, agitation, nausea, respiratory secretions, breathlessness — with trend.
- **ReSPECT / DNACPR / advance care plan** surfaced prominently and early (before tasks).
- **Last-days-of-life mode:** dignity-focused, comfort-led recording; sensitive language; reduced-burden capture.
- Preferred place of care/death and key contacts visible.

#### Acceptance criteria
- **AC-19b.1** A person on an EOL pathway surfaces ReSPECT/DNACPR/advance-care-plan status prominently before care tasks.
- **AC-19b.2** Anticipatory medications are visible with their PRN protocols (§18) and 24h ceilings.
- **AC-19b.3** EOL symptoms can be tracked over time and feed the office/clinical team.

**Priority:** S / v1 (decision-gated §44). **Depends on:** care-planning, eMAR (§18), §15/§16. **Standards:** NICE NG142 (end-of-life care for adults); CQC.

---

## 20. Equipment, consumable supplies, moving-and-handling (LOLER) & infection control

### Purpose
Capture equipment, consumable supplies and PPE realities — relevant to Safe care, LOLER and infection control.

### Behaviour
- Record moving-and-handling equipment in use (hoist, sling, etc.); surface **LOLER inspection due/expired** as a flag.
- **Consumable supplies:** track care **consumables in the home** (stoma bags, catheter kits, continence pads, gloves, dressings, thickener, feed) — whether **in stock / running low / out**, and whether **stored correctly** — so a carer can flag a shortfall before it interrupts care (links to ordering/office, distinct from durable equipment).
- Record PPE use; surface **infection-control status/precautions** *before* entry.
- **Infection prevention & control (IPC) as a recordable element:** PPE used (gloves/apron/mask), hand hygiene, **safe waste disposal** (esp. continence/clinical waste), and any **isolation/infection precautions** in place for the person (e.g., known infection) — surfaced before entry and recordable during the visit, feeding the IPC evidence the regulator expects.
- Flag faulty/unsafe equipment → office task/incident (§17/§23).

### Acceptance criteria
- **AC-20.1** Equipment with an overdue LOLER inspection warns before use.
- **AC-20.2** Infection-control precautions are surfaced before the visit starts.
- **AC-20.3** Faulty equipment can be flagged, creating an office task/incident.
- **AC-20.4** PPE use, hand hygiene and safe waste disposal are recordable, and any active infection precautions for the person are surfaced before entry.
- **AC-20.5** Consumable supplies can be recorded as in-stock/low/out and flagged to the office when running short, distinct from durable equipment.

**Priority:** S / v1. **Depends on:** equipment service, incident (§23), tasks (§17).

---

## 21. Notes, media & documentation

### Purpose
Record what happened, fast, and handle privacy-sensitive media properly. (Consolidates former notes + §37 media.)

### Behaviour & rules
- Notes: free text + structured templates + icon/tag quick-entry; **voice-to-text** (multi-language). Mandatory fields where configured. Person-centred-language prompts.
- Carer-to-carer handover notes.
- **Media:** consent-to-photograph checked before clinical/personal imagery (§16); stored **in-sandbox**, never device gallery/backups (§37); **Wi-Fi-preferred, data-aware** upload with compression; large media queues until suitable connection (§32); media bound to its record with the same audit/version rules (§36).

### Acceptance criteria
- **AC-21.1** A note can be created by voice or structured entry, offline, bound to the visit.
- **AC-21.2** Clinical/personal imagery checks consent before capture where required.
- **AC-21.3** A captured photo is stored in-sandbox and excluded from device gallery/backups.
- **AC-21.4** On poor connectivity, media queues and uploads without blocking the visit, respecting data-saver settings.

**Priority:** M / v1. **Depends on:** media service, consent (§16), `[SYNC]`, data hygiene (§37). **Clinical-safety note:** voice-to-text mis-transcription and photo-to-wrong-record are named hazards (§40).

---

## 22. Lone-worker safety, SOS & carer-directed harm

### Purpose
Protect the carer working alone — including when the *carer* is harmed.

### Behaviour
- Discreet SOS/panic with location and escalation chain; offline SMS/telephony fallback.
- Visit/journey monitoring with expected check-in times; auto-escalation on missed check-in (`[P-MISSED]`, links to §14).
- Pre-visit safety briefing (environment, pets, behaviours); amber/red client flags.
- **Carer-directed harm:** a distinct flow to report assault/abuse/threat *to the carer* (separate from SOS-in-progress and from client incidents §23), routed to the office with appropriate confidentiality and support.
- Optional alarm-receiving-centre integration.
- **SOS with no mobile service (push, SMS and call can all fail):** the app shows a clear **"SOS not transmitted"** state rather than implying success; **retries repeatedly**; **stores last-known location** for transmission when service returns; relies on a **server-side missed-check-in escalation** (the office is alerted by the *absence* of an expected check-in even if the device can't reach out); shows a **visible instruction to call emergency services directly when possible**; offers an **optional loud local alarm**; provides an **accidental-activation cancel** workflow and a **duress-safe cancellation** policy (a cancel under coercion does not silently stand down the escalation); and **confirms when the monitoring centre/office assumes ownership** so the carer knows help is coming.

### Acceptance criteria
- **AC-22.1** SOS transmits identity and best-available location to the escalation chain and confirms receipt; offline uses SMS/telephony.
- **AC-22.2** A missed check-in within `[P-MISSED]` alerts the office automatically.
- **AC-22.3** A red client safety flag is shown before the visit starts.
- **AC-22.4** Harm to the carer can be reported via its own flow and is routed with appropriate handling.
- **AC-22.5** With no service, SOS shows a "not transmitted" state, retries, stores last-known location, and relies on server-side missed-check-in escalation; it never implies a failed SOS succeeded.
- **AC-22.6** SOS offers an accidental-activation cancel and a duress-safe cancellation (a coerced cancel does not silently stand down escalation), an optional local alarm, a call-999 instruction, and a confirmation when the monitoring centre/office assumes ownership.

**Priority:** M / v1 (carer-harm flow: S / v1). **Depends on:** notifications, telephony fallback, monitoring integration.

---

## 23. Incidents, accidents, safeguarding, restraint & whistleblowing

### Purpose
Capture concerns immediately and route each to the correct, sometimes confidential, channel. (Adds restraint and whistleblowing.)

### Behaviour
- Report incident / accident / near-miss / **safeguarding concern (about a client)**; structured forms with photos, body map, immediate actions, severity; instant office notification; routing to duty-of-candour / RIDDOR / safeguarding workflows.
- **Critical incidents do not wait for normal sync:** for serious harm, death, missing person, safeguarding, medical emergency, medication error, carer assault or severe equipment failure, the **initial safety notification immediately attempts the alert fallback chain** (data → push/API → SMS → call/manual, §48) even though the full structured report syncs later. The alert must not depend solely on record synchronisation.
- **Restraint / restrictive practice recording:** a distinct, structured record (type, justification, duration, least-restrictive consideration, authorisation) — a regulated area, especially in §14.2 settings.
- **Whistleblowing:** a distinct channel for concerns *about the provider or a colleague*, with confidentiality handling — not the same as client safeguarding.

### 23.1 Concerns taxonomy (something doesn't seem right)
A **concern** is a "this doesn't seem right" signal, distinct from an **incident** ("something happened"). Structured, configurable picker:

- **Condition change** — physical decline, weight loss, reduced mobility, confusion/disorientation, withdrawal
- **Skin / pressure** — redness, new pressure area, deterioration
- **Pain** — new or worsening
- **Mental health / mood** — low mood, anxiety, distress, behaviour change
- **Medication** — refusals pattern (§18), side-effects, stock/availability
- **Nutrition / hydration** — poor intake (links §19 targets), swallowing difficulty
- **Continence** — change in pattern, possible infection signs
- **Safeguarding worry** — possible abuse/neglect (routes to safeguarding)
- **Self-neglect** — declining personal care, unsafe living conditions
- **Financial** — possible financial abuse, money concerns (links §26)
- **Environment / home safety** — heating, trip hazards, hygiene
- **Equipment** — faulty/missing equipment (links §20)
- **Family / visitor** — concerning behaviour or dynamics
- **Missed/inadequate care** — gaps in the package
- **Other (with detail)**

### 23.2 Incident taxonomy & harm level (something happened)
Structured, configurable, each with **harm level** and routing:

- **Fall** — with/without injury, witnessed/unwitnessed
- **Medication error / near-miss** — wrong dose/med/time/person, omission
- **Injury of unknown origin** — bruise, skin tear, mark
- **Skin/pressure ulcer development**
- **Choking / aspiration**
- **Burn / scald**
- **Absconding / wandering / missing person**
- **Behaviour that challenges / aggression** (to self, others or carer — links §22)
- **Property damage / loss**
- **Allegation** (against a worker or other)
- **Medical emergency** (collapse, seizure, suspected stroke/MI)
- **Death**
- **Near-miss** (no harm but had potential)
- **Other (with detail)**

**Harm level** (configurable scale): `No harm / Near-miss → Low → Moderate → Severe → Death`. **RIDDOR-reportable** and **notifiable-to-CQC** events are flagged for back-office routing; serious harm/death and allegations escalate immediately.

### 23.3 Assessments the carer records or contributes to
Most assessments are authored back-office, but the carer **completes, updates or flags-for-review** in the field:

- **Risk assessments:** falls, moving-and-handling, environmental/home, skin integrity (e.g., Waterlow), choking/swallowing (SALT), nutrition (MUST §19), behavioural/PBS
- **Mental capacity (MCA)** — record observations relevant to a capacity decision (§16); the carer does not author a formal determination
- **Condition-specific** (§19a) and **wellbeing/outcome** (reablement §16a)
- **Flag-for-review:** the carer can flag any assessment as needing review when the person's situation has changed

### 23.4 Safeguarding disclosure handling (point-of-care)
*How* the carer records and behaves during a disclosure is itself safety-critical and evidential — a poorly handled disclosure can collapse a safeguarding case.

- **Verbatim capture:** the person's **exact words** are recorded verbatim (not paraphrased), in a distinct field.
- **Fact vs interpretation:** factual observations are recorded **separately from** the carer's interpretation/opinion, so evidence isn't contaminated.
- **Practice prompts at point of care:** the app surfaces reminders to **listen without leading**, **not promise secrecy/confidentiality**, **not confront or alert the alleged person**, and **preserve any evidence**.
- **Immediate routing & safety:** routes immediately to the safeguarding lead (append-only, §36); where there is immediate danger, the emergency route (§51/§48) is offered.

- **AC-23.10** A safeguarding disclosure captures the person's exact words verbatim in a distinct field, with factual observation recorded separately from interpretation.
- **AC-23.11** During a disclosure the app surfaces practice prompts (don't lead, don't promise secrecy, don't confront the alleged person, preserve evidence) and offers the emergency route where immediate danger is indicated.

### 23.5 Specialised incident fields (higher-risk types)
Higher-risk incident types carry type-specific structured fields, not just free text:

- **Fall:** witnessed/unwitnessed · injury suspected · **head impact** · **anticoagulant status** · person moved/not moved · emergency assistance · **post-fall observations** · equipment involved · body-map link.
- **Restrictive practice / restraint:** antecedent · alternatives attempted · immediate risk · type of restriction · duration · authority · injury · monitoring · debrief · review required.
- **Missing person / absconding:** last seen (time/place) · clothing · known risks · search already performed · police reference · family notified · return & welfare outcome.
- **Medication error:** wrong dose/med/time/person/omission · person affected · clinical advice obtained · harm outcome (links §18/§49).
- **Exposure / needlestick / bodily-fluid:** exposure type · immediate first aid given · source information (where known) · clinical/occupational-health contact · follow-up arrangements.

- **AC-23.12** A fall incident captures witnessed status, suspected injury, head impact, anticoagulant status, moved/not-moved, post-fall observations and a body-map link.
- **AC-23.13** A restrictive-practice incident captures antecedent, alternatives attempted, type, duration, authority, injury, monitoring and review.
- **AC-23.14** A missing-person incident captures last-seen, risks, search performed, police reference, family-notified and return/welfare outcome.
- **AC-23.15** An exposure/needlestick incident captures exposure type, immediate first aid, source information, clinical/occupational-health contact and follow-up arrangements.

### 23.6 Whistleblowing confidentiality (full access model)
Whistleblowing is **not** the same as a client-safeguarding concern and needs its own confidentiality model:
- **Submission modes:** both **anonymous** and **confidential-but-named** submission are supported.
- **Access control:** the report is visible only to a defined confidential recipient set; **the subject's line manager is excluded** where they are implicated; **tenant administrators do not have default view** of whistleblowing content.
- **Escalation for senior subjects:** a concern about **senior management or the provider owner** routes to an **independent/external channel** (e.g., designated non-conflicted recipient or external body), not back to the implicated person.
- **Safe progress visibility:** the carer can follow progress **without exposing their identity** to the subject.
- **Device hygiene:** local-device copies are protected (no plain-text cache, covered by §10/§37); **retaliation concerns** have their own reporting route.

- **AC-23.16** Whistleblowing supports anonymous and confidential-named submission; access is restricted to a confidential recipient set, excludes an implicated line manager, and is not visible to tenant admins by default.
- **AC-23.17** A whistleblowing concern about senior management/provider owner routes to an independent/external channel; the carer can follow progress without identity exposure, and retaliation has its own reporting route.


- A **concern** can be escalated to an **incident** if it turns out something happened; the link is preserved.
- Carers **contribute to** assessments (observations, flag-for-review) but do not author formal clinical determinations — those stay with the qualified assessor (scope, §5/§28).
- The exact categories, harm scale and routing are **configurable per provider** and aligned to their incident policy and local safeguarding board.

### Acceptance criteria
- **AC-23.1** An incident captures type, severity, narrative, optional media and immediate actions; a critical incident triggers the immediate alert fallback chain (§48) rather than waiting for record sync, with the full report syncing later.
- **AC-23.2** A safeguarding concern routes to the safeguarding workflow and is append-only after submission.
- **AC-23.3** A restraint/restrictive-practice event is recorded with justification, duration and authorisation.
- **AC-23.4** A whistleblowing concern routes to its confidential channel, distinct from client safeguarding.
- **AC-23.5** Offline capture queues and submits without loss or duplication. `[SYNC]`
- **AC-23.6** A concern is recorded from the structured taxonomy; a safeguarding/financial concern routes to the safeguarding channel.
- **AC-23.7** An incident records a harm level; RIDDOR/CQC-notifiable and serious-harm/death/allegation events are flagged and escalate immediately.
- **AC-23.8** A concern can be promoted to an incident with the link preserved.
- **AC-23.9** The carer can complete/update permitted assessments and flag any assessment for review; formal determinations remain with the qualified assessor.

**Priority:** M / v1 (restraint & whistleblowing: S / v1). **Depends on:** `[SYNC]`, incident/safeguarding/whistleblowing workflows, assessment service. **Standards:** CQC notifications, RIDDOR, local safeguarding board definitions.

---

## 24. Communication, handover & translation aid

### Purpose
Keep the carer connected — and help them communicate with the person.

### Behaviour
- Two-way secure messaging with coordinators (replaces personal WhatsApp); broadcasts with read receipts and urgent flags; client-specific threads; handover notes.
- **Real-time field→office change requests:** from a visit, raise a tracked request against a care plan/task/medication (`Raised/Acknowledged/Actioned/Declined`); a change request does **not** mutate the plan (governance, §36); urgent changes escalate.
- **Translation aid:** surface the person's communication needs/language (§15); provide a point-of-care communication aid where configured.
- **A handover note is not a shadow care plan (normative rule):** a message or handover note may carry **temporary context**, but **must not be the sole authoritative source** for a lasting medication, task, risk or care-plan change. A lasting instruction must create/update a **care-plan version, medication order, risk assessment, or a temporary clinically-authorised instruction with an expiry** (via the change-request loop / §49). Handover notes carry: **author, intended recipient, priority, expiry, acknowledgement requirement, clarification status, promoted-to-care-plan status, and closure.**
- **Cross-shift unresolved-safety handover:** the end-of-shift flow explicitly surfaces every open safety item — **open alerts, an active emergency protocol, PRN effectiveness follow-up, medication reconciliation, medication stock or CD discrepancy, a missed observation or missed repositioning, a critical unsynced record, an open safeguarding concern, and an incomplete incident report** — and the **receiving carer or office acknowledges ownership** of each.

### Acceptance criteria
- **AC-24.1** Message delivery/read state shows; urgent messages surface prominently; offline queues and sends. `[SYNC]`
- **AC-24.2** A handover note is seen by the next attending carer and carries author, recipient, priority, expiry, acknowledgement, clarification status, promoted-to-care-plan status and closure.
- **AC-24.3** A care-plan/medication change request is tracked with a visible status; urgent ones alert the office.
- **AC-24.4** A configured communication aid is accessible during the visit.
- **AC-24.5** A handover note cannot be the sole record of a lasting medication/task/risk/care-plan change; such a change must promote to an order/care-plan/risk update or a temporary authorised instruction with expiry.
- **AC-24.6** The end-of-shift flow lists all unresolved safety items (open alerts, active protocol, PRN follow-up, reconciliation, stock/CD discrepancy, missed obs/repositioning, critical unsynced record, open safeguarding, incomplete incident) and requires the receiving carer/office to acknowledge ownership.

**Priority:** M / v1 (change-request loop is a key differentiator). **Depends on:** messaging, workflow/notification, care-planning, consent (§16).

---

## 25. Service-user & family feedback / visit confirmation

### Purpose
Capture the person's voice — evidence for Caring and Responsive.

### Behaviour
- Optional **visit confirmation** by the person/representative (tap/signature that the visit occurred satisfactorily).
- Capture quick sentiment + free text/voice feedback; visible to the office.

### Rules & edge cases
- Confirmation is optional and never blocks the carer completing their record; if the person can't/won't confirm, the reason is recorded. Respects capacity/consent (§16).

### Acceptance criteria
- **AC-25.1** A willing person/representative can give a visit confirmation/signature.
- **AC-25.2** If they cannot confirm, the visit still completes and the reason is recorded.
- **AC-25.3** Feedback is stored against the visit and visible to the office.

**Priority:** C / Later. **Depends on:** care record, consent (§16).

---

## 26. Client money & expenses

### Purpose
Handle service users' money (regulated, audit-sensitive) and carer reimbursement. (Consolidates §30 + §31.)

### Behaviour & states
- **Client money:** record a transaction on the person's behalf (amount, purpose, time) with **running balance**; receipt photo; flag discrepancies (missing receipt/mismatch) to the office; per-person money record viewable by authorised roles and family where policy-governed (access, purpose, lawful basis, confidentiality, MCA/representative authority, minimum-necessary; §53).
- **Shopping support:** an agreed **shopping list** and **budget / money given**; the carer records **amount spent**, captures the **receipt**, and the app **reconciles** money-given − spend = **change returned**, flagging any mismatch (a financial-safeguarding signal → §23.1). **Food safety:** prompts to store items safely and record **expiry/use-by checks** where the task requires it.
- **Offline overspend protection (physical cash can't be append-only):** because two offline devices can each record valid transactions against the same physical cash, the app requires a **mandatory physical opening cash count** before spending; shows the **last confirmed digital balance + timestamp** and any **local pending transactions**; enforces an **offline-spending limit** and **high-value approval/witness** where configured; captures **change returned** and a **physical closing count**; shows a **"balance could be incomplete"** warning when another unsynced device may exist; and **blocks or requires office contact when the balance is stale**. Balance-recompute-on-sync is necessary but not sufficient — it can't recover physically missing cash.
- **Carer expenses:** capture category, amount, receipt photo, optional client/visit link; submit; track `Submitted/Approved/Queried/Paid` alongside earnings (§27).

### Rules & edge cases
- Client-money entries are **append-only and audited** (§36); corrections create a new version with reason. A transaction missing a required receipt is flagged, not silently accepted. Money handling follows consent and LPA/deputy authority (§16).
- A shopping reconciliation where **change returned doesn't match** money-given minus receipted spend is flagged for office review and can route to a financial concern (§23.1) — handling a person's cash is a known abuse risk, so the trail must close.

### Acceptance criteria
- **AC-26.1** A purchase on a person's behalf records amount, purpose and receipt; the running balance updates.
- **AC-26.2** A required receipt absent → the transaction is flagged for office review.
- **AC-26.3** Every client-money entry is append-only and fully audited.
- **AC-26.4** A carer expense can be submitted with a receipt and tracked to `Paid`; approved amounts reconcile into pay (§27).
- **AC-26.5** A shopping task records list, money given, receipted spend and change returned; a reconciliation mismatch is flagged and can route to a financial concern (§23.1).
- **AC-26.6** Where required, food-safety steps (safe storage, expiry/use-by check) are recordable on a shopping/domestic visit.
- **AC-26.7** Before offline spending, a physical opening cash count is required; the last-confirmed balance/timestamp and pending local transactions are shown; an offline-spending limit and high-value approval apply; a stale or possibly-incomplete balance warns and blocks/requires office contact (distinct from the PRN/CD gate, AC-32.3).

**Priority:** S / v1 (client money is decision-gated, §45). **Depends on:** finance/client-money service, `[SYNC]`, audit (§36), consent (§16), media (§21).

---

## 27. Earnings & pay

### Purpose
Transparency over money earned and to be paid — a trust/retention differentiator competitors treat thinly.

### Behaviour & states
- **Today/week/month earnings** from **verified** visit times (§14/[ECM]), rates, enhancements (nights/weekends/bank holiday), mileage (§13) and approved expenses (§26).
- Rate visibility per visit/shift (within policy); timesheets (`Submitted/Approved/Queried/Paid`); payslips where payroll integrated; holiday-pay accrual (with §12 balance); contracted-vs-actual hours; optional earned-wage access/advances.

### Rules & edge cases
- Earnings are clearly `Estimated / Pending approval / Confirmed/Paid` — never imply guaranteed. A disputed/exception visit (§14) shows provisional pay, excluded from confirmed totals. Rate rules are tenant-configurable; the app **displays**, doesn't invent. Discrepancies route to a query workflow, not a silent gap.

### Acceptance criteria
- **AC-27.1** Completed verified visits show an earnings total labelled `Estimated` until approved.
- **AC-27.2** An exception/disputed visit's pay is provisional and excluded from confirmed totals.
- **AC-27.3** Route-derived mileage can be reviewed, adjusted and submitted.
- **AC-27.4** Integrated payroll shows current and historical payslips.
- **AC-27.5** Accrued holiday pay matches the back-office calculation.
- **AC-27.6** An earnings discrepancy can be raised as a tracked office query.

**Priority:** S / v1 (earned-wage access: C / Later). **Depends on:** `[ECM]`, pay-rules engine, payroll/finance, expenses (§26).

---

## 28. Learning, training & competency

### Purpose
The carer's growth and compliance hub, with **just-in-time learning** — a quality and retention lever.

### Behaviour & states
- Mandatory training & compliance status (`Valid/Due soon/Expired`) with renewals; Care Certificate progress.
- Competency framework: held / in-progress / needed per client/visit-type; ties to scheduling eligibility (§12, §14.1).
- E-learning/LMS in-app; completions and certificates recorded.
- **Just-in-time micro-learning** surfaced *because of the work* (e.g., catheter-care before such a visit).
- Assessments & observed-competency sign-off (carer side); supervisions/appraisals (see, prep, acknowledge CPD actions); exportable CPD log.
- Due learning rolls into Jobs (§17) and the Today banner (§11); 'due soon' is computed from `[P-TRAINDUE]` (also governing document/competency expiry warnings, §29).
- **Expiry consequences (enforcement):** an expired mandatory training or competency doesn't just show red — it **affects what the carer can do**: a lapsed competency blocks the gated task/record (§17.1/§18/§19a) and removes eligibility to be rostered to visits requiring it (§12), and the carer is flagged non-compliant until renewed. Surfaced carer-side; enforced office-side.
- **Carer-initiated development:** the carer can **request training** or **express interest in upskilling** (e.g., to take on a new competency or client type); this routes to the office/L&D as a tracked request.

### Rules & edge cases
- Expired mandatory training that gates a competency **also reflects in scheduling** — not rostered to visits needing a lapsed competency (enforced office-side, surfaced carer-side). Just-in-time learning is suggestive, except where a competency hard-gates a clinical task. Completions are auditable.

### Acceptance criteria
- **AC-28.1** A course nearing expiry shows `Due soon` with a countdown and raises a Job (§17).
- **AC-28.2** Completing a course records completion/certificate and sets `Valid`.
- **AC-28.3** A next visit's clinical task offers the relevant micro-lesson beforehand.
- **AC-28.4** An expired hard-gate competency prevents recording that task as competently performed and flags the office.
- **AC-28.5** A scheduled supervision is visible with prep notes and CPD-action acknowledgement.
- **AC-28.6** A CPD record can be exported.
- **AC-28.7** An expired mandatory training/competency blocks the gated task and removes eligibility to be rostered to visits requiring it, and flags the carer non-compliant until renewed.
- **AC-28.8** The carer can submit a training request / interest in upskilling, tracked as an office/L&D request.

**Priority:** S / v1 (just-in-time learning is a differentiator). **Depends on:** LMS integration, competency service, scheduling (§12), workforce compliance.

---

## 29. My account, documents & compliance

### Purpose
The carer's own record and compliance controls. (Auth/device security is §10.)

### Behaviour
- Profile & preferences (contact, languages, notification prefs §33).
- My documents & compliance: contract, right-to-work, DBS, qualifications — with expiry; **read-and-sign** for policies/procedures (distinct from care-plan acknowledgement §16).
- **Upload / refresh own documents:** the carer can submit a renewed document (new DBS certificate, updated qualification, right-to-work) for the office to verify; status shown (`Submitted/Verified/Rejected`).
- **Document-expiry consequence:** an expired compliance document with a compliance impact (e.g., **DBS, right-to-work**) flags the carer **non-compliant** and, where it gates work, removes eligibility to be rostered until resolved — mirroring competency expiry (§28). Warned ahead, enforced office-side.
- Settings: language, accessibility (§34), data-saver.

### Acceptance criteria
- **AC-29.1** A policy requiring acknowledgement must be read-and-signed; recorded and dated.
- **AC-29.2** An expiring compliance document warns ahead of expiry and raises a Job (§17).
- **AC-29.3** Accessibility settings apply across the app and persist.
- **AC-29.4** The carer can upload/refresh their own compliance document for office verification, with status shown.
- **AC-29.5** An expired compliance document with a compliance impact (e.g., DBS, right-to-work) flags the carer non-compliant and, where it gates work, removes rostering eligibility until resolved.

**Priority:** M / v1. **Depends on:** HR/document service, access-control.

### 29a. Documents the carer can access

#### Purpose
Pull the scattered document fragments (care plan §16, policies §29, care documents §15) into one coherent capability: the carer needs to **open the right documents about a person, in the field and offline**, with the correct access and edit boundaries.

#### Behaviour
- **Care documents (per person):** care plan and risk assessments (§16/§23.3), **MAR chart** (printable/PDF, §18), body maps and wound photos (§19/§19a), **hospital passport / "this is me"**, **ReSPECT / DNACPR / advance care plan** (§19b), grab sheet / emergency info, moving-and-handling plan (§20), consent records (§16).
- **Daily log / care diary:** the chronological record of everything recorded for the person across visits and carers — core CQC evidence and what families expect to see.
- **Professional input:** read access to district-nurse notes, GP instructions and other professionals' entries shared to the carer (policy-governed (access, purpose, lawful basis, confidentiality, MCA/representative authority, minimum-necessary; §53)).
- **Provider documents:** policies/procedures with read-and-sign (§29), guidance/how-to.
- **Print / share in the field:** generate or share a record (e.g., hand a MAR or grab sheet to a paramedic) — **policy- and access-governed** (lawful basis §53), not an open export; the share event is audited (§36).
- **Print/export device hygiene:** any field print/export (MAR, grab sheet, hospital passport, report) requires **recipient verification**, a **preview before sharing**, **minimum-necessary data selection**, a **watermark** and a **share reason**, an **export expiry**, and leaves **no permanent file in Downloads** (temporary files are removed after sharing). The OS share sheet is **restricted to supported/approved targets** (no arbitrary third-party app); **redaction** is available where needed; and **both successful and failed** shares/prints are audited, with defined behaviour if printing fails.

#### Rules & edge cases
- All document access respects the role/scope model (§10) and is **available offline** for cached documents (§32).
- Documents are **read-only where the carer shouldn't edit** (e.g., the authored care plan — changes go via the §24 change-request loop, not direct edits).
- Sharing to a third party (emergency services, family) follows the §53 lawful-basis model and is logged; it is not a general data export.

#### Acceptance criteria
- **AC-29a.1** For an assigned person, the carer can open their care plan, risk assessments, MAR, body maps, hospital passport and ReSPECT/DNACPR — offline for cached documents.
- **AC-29a.2** The carer can view the person's daily log/care diary across visits, within access scope.
- **AC-29a.3** Authored documents (e.g., care plan) open read-only; edits route via the change-request loop (§24), not direct edits.
- **AC-29a.4** Sharing/printing a record to a third party is policy- and access-governed (§53) and the share event is audited (§36).
- **AC-29a.5** Documents outside the carer's access scope are not accessible.
- **AC-29a.6** A field print/export requires recipient verification, preview, minimum-data selection, watermark, share reason and export expiry; leaves no permanent Downloads file (temp files removed); restricts the OS share sheet to approved targets; supports redaction; and audits successful and failed shares, with defined print-failure behaviour.

**Priority:** M / v1 (print/share to third parties: S / v1). **Depends on:** document service, `[SYNC]`, access-control (§10), consent (§16), audit (§36).

### 29b. Reports available to the carer

#### Purpose
Consolidate what a carer can **view and (where permitted) export** about their own work and the people they support — previously scattered across §11/§27/§28/§29a.

| Report | Contents | Export |
|---|---|---|
| **Daily log / care diary** (§29a) | Chronological care record for a person across visits | View; share policy-governed (access, purpose, lawful basis, confidentiality, MCA/representative authority, minimum-necessary; §53) |
| **My visit history** | The carer's own past visits, times, tasks completed | View |
| **My hours & earnings** (§27) | Timesheet breakdown, hours, travel/mileage, estimated→confirmed pay | View; payslip export where integrated |
| **My CPD / training record** (§28) | Completed training, certificates, competencies | Exportable (AC-28.6) |
| **My compliance status** (§29) | Document/training/competency status with expiries | View |
| **Person summary** | Care plan, risks, recent observations/MAR for an assigned person | View (within scope §10) |

#### Rules
- All reports respect access scope (§10); person-level reports cover only assigned/covered clients.
- Carer-facing reports are read views; any third-party share is policy-governed (access, purpose, lawful basis, confidentiality, MCA/representative authority, minimum-necessary; §53) and audited (§29a/§36).
- Analytical/management reporting (trends across clients, KPIs) is **back-office**, not the carer app.

#### Acceptance criteria
- **AC-29b.1** The carer can view their visit history, hours/earnings, CPD and compliance status, plus the daily log and person summary for assigned clients.
- **AC-29b.2** Exports are limited to permitted reports (e.g., CPD, payslip) and respect access scope.
- **AC-29b.3** Cross-client analytical reporting is not exposed in the carer app.

**Priority:** M / v1. **Depends on:** reporting/read views, access-control (§10), §27/§28/§29a.

---

## 30. Search

### Purpose
Find a client, past visit or note quickly — vital on an unfamiliar round.

### Behaviour
- Search assigned clients, recent visits and own notes; offline for cached data; results respect access scope (§10).

### Acceptance criteria
- **AC-30.1** A search returns matching assigned clients and recent visits, offline for cached data.
- **AC-30.2** Search never returns records outside the carer's access scope.

**Priority:** S / v1. **Depends on:** local index, access-control.

---

## 31. In-app help & support

### Purpose
Get unstuck in the field and report app problems.

### Behaviour
- Contextual help/quick-reference for key flows (check-in, eMAR, notes); **report an app issue** with diagnostics and no PII (§10); link to the provider's support channel.

### Acceptance criteria
- **AC-31.1** Contextual help is reachable within the relevant flow.
- **AC-31.2** An app issue can be reported with diagnostics attached and no PII leakage.

**Priority:** S / v1. **Depends on:** support tooling, observability (§39).

---

# Cross-cutting behaviours

## 32. Offline & sync `[SYNC]`

Full core functionality offline (Today, schedule, visit lifecycle, care plan, eMAR, observations, notes, incidents, jobs, downloaded learning). Queued actions sync automatically and idempotently; clear pending-upload visibility. **Per-entity conflict policy:** safety-critical records (eMAR, incidents, money, **submitted care notes**) are append-only / surfaced-on-conflict, never silently overwritten — consistent with records integrity (§36). **Last-write-wins is permitted only for the author's own unsubmitted draft;** once submitted, a note is versioned and a correction is an explicit addendum with the original preserved. Even single-carer **task outcomes use the attributed event model** (a later correction or office update supersedes as a new event, never silently overwriting an earlier one). No data loss on crash/force-close/battery death. Prefetch window `[P-PREFETCH]`.

**Cross-carer safety totals (freshness gate — a real offline hazard).** Append-only conflict handling protects the *records* but does not prevent an *unsafe action* taken on a stale total. For any total that aggregates **across visits and carers** — PRN 24h totals & minimum intervals (§18), fluid/nutrition totals (§19), controlled-drug balance (§18.1), client-money balance (§26), medication stock, repositioning/monitoring schedules — the app surfaces: **last confirmed server value, pending local values, last-sync time, and whether another unsynced device may exist.** Behaviour by freshness: fresh → proceed; stale → **warn**; stale **and** high-risk (e.g., PRN approaching its 24h max or min interval, CD administration) → **block until the carer confirms against an authoritative source** or contacts the office. **The authoritative-source override is not a checkbox** — it captures: source type; source last-updated time; who checked it; values observed; whether another carer was contacted; office/clinical advice; reason for continuing; whether a second check was required; and a reconciliation-task reference. A stale cross-carer total must never present as a definitive full-day figure.
**AC-32.1** 24 h fully offline across multiple visits → on reconnect, all entries sync with correct original timestamps, no loss/duplication. **AC-32.2** Offline beyond `[P-PREFETCH]` is handled gracefully (clear state, §38), not a crash. **AC-32.3** A cross-carer safety total shows last-confirmed value, pending local values, last-sync time and possible-other-device state; when stale and high-risk (PRN ceiling/interval, CD), the action is blocked pending an authoritative-source confirmation that captures structured fields (source type/time, who checked, values observed, contacts, advice, reason, reconciliation ref) — not a checkbox — or office contact; a stale total is never shown as definitive. **AC-32.4** Client-money spending offline is gated by its own controls (physical opening count, offline limit, stale-balance block/office-contact, possibly-incomplete warning; §26 AC-26.7), distinct from the clinical-total gate. **AC-32.5** Prolonged offline beyond `[P-OFFLINEMAX]` forces a mandatory escalation/revalidation prompt. **AC-32.6** Completed, synced records are purged from the local cache after `[P-CACHERETAIN]`; stale cached clinical content beyond `[P-STALECARE]` warns/gates (§38). **AC-32.7** Captured media exceeding `[P-MEDIAMAX]` is compressed or rejected with a clear message, never silently dropped.
**Priority:** M / v1. **Depends on:** Offline & Sync Engine Design.

## 33. Notifications & off-shift quiet hours

Per-category preferences; **off-shift quiet hours** defaulting to `[P-QUIETHOURS]` (routine notifications respect the working pattern; only safety-critical paths override); grouping/digest; delivery confirmation for safety-critical. A same-shift schedule change is never suppressed.

**Push delivery ≠ acknowledgment.** Provider "delivery confirmation" does not prove the carer saw or acted on an alert, so the system tracks **distinct states**: `provider-accepted · device-delivered (where reported) · displayed (where detectable) · opened · acknowledged · action-started`. For missed-visit, medication-omission, deterioration and SOS alerts, escalation logic keys off **acknowledged/action-started**, not provider-accepted.

**Notification-denial — hard policy (an in-app banner can't reach a closed app).** If OS notifications are denied, the carer cannot start safety-critical work until **one** of: notifications are enabled; a **verified SMS/telephone fallback** is registered; or the **office explicitly authorises** an alternative arrangement. The app also detects and handles: permission **revoked mid-shift**, **push token invalid**, **battery-optimisation/background-restricted** (guides the carer to exempt the app), **Do Not Disturb**, **phone off**, **no data but cellular calling available** (route via SMS/call), and **no signal at all** (queue + visible "not yet delivered" state + server-side missed-acknowledgement escalation).

**AC-33.1** Off-shift, routine notifications are withheld/digested per quiet hours. **AC-33.2** Safety-critical alerts deliver regardless, with confirmation. **AC-33.3** Preference changes apply immediately and persist. **AC-33.4** Alert delivery is tracked through distinct states (provider-accepted/delivered/displayed/opened/acknowledged/action-started); escalation keys off acknowledged/action-started, not provider acceptance. **AC-33.5** With notifications denied, safety-critical work is blocked until notifications are enabled, a verified SMS/telephone fallback is registered, or the office authorises an alternative; mid-shift revocation, token-invalid, battery-optimisation, DND, phone-off and no-signal each have defined handling and a server-side missed-acknowledgement escalation.
**Priority:** S / v1 (denial policy: M / v1). **Depends on:** notification service, scheduling, telephony fallback, §48.

## 34. Accessibility & localisation

WCAG 2.2 AA; large text, high contrast, screen-reader, glove-usable tap targets; multi-language UI, voice input and content.
**AC-34.1** All primary flows (check-in, eMAR, notes, SOS) are fully screen-reader operable.
**Priority:** M / v1. **Depends on:** design system.

## 35. Performance

Cold start within `[P-COLDSTART]` and screen render within `[P-RENDER]` on `[P-REFDEVICE]`; battery/data-efficient location handling; install size ≤ `[P-APPSIZE]`; per-visit sync payload ≤ `[P-PAYLOAD]`. (Hard numbers ratified in the NFR/SLO doc.)
**AC-35.1** On `[P-REFDEVICE]`, cold start ≤ `[P-COLDSTART]` (p95) and navigation is smooth.
**Priority:** M / v1. **Depends on:** NFR/SLO doc.

## 36. Records integrity — audit, amendment & data rights

Immutable audit trail (who/what/when via trusted time/which device) on every create/edit/**view** of a care record. **Correct, don't delete:** no carer hard-delete; corrections create a new version with reason, original preserved ("recorded in error"). Attribution bound to the authenticated carer; shared-device handoff requires re-auth. Supports the back-office process for a person's access/rectification requests.
**AC-36.1** Every entry's audit log captures author, action, trusted timestamp, device — queryable back-office. **AC-36.2** A correction creates a new version with reason; the prior version is preserved. **AC-36.3** A new carer on a shared device must re-authenticate before any entry is attributed to them. **AC-36.4** Access to a sensitive record is itself audited.
**Priority:** M / v1. **Depends on:** audit/logging design, identity & access-control.

## 37. Data retention, residency & device hygiene

Local care data is the minimum for upcoming visits and is purged on schedule and on sign-out/leaver/remote-wipe (§10). Records/audit retained per policy; never silently deleted ahead of policy. UK data residency. No care data to device backups, screenshots-in-logs or third-party keyboards.
**AC-37.1** A synced visit older than the local-cache window is purged on-device while the server record persists. **AC-37.2** A leaver/remote-wipe removes all local care data and is audited. **AC-37.3** Sensitive fields are excluded from OS backups and diagnostic logs.
**Priority:** M / v1. **Depends on:** `[SYNC]`, retention policy, MDM, security architecture.

## 38. Error, empty & failure states

**Sync permanently failing:** persistent indicator; carer keeps recording offline; escalation if unsuccessful beyond `[P-SYNCWARN]`. **Server-rejected action:** told plainly, data preserved for retry, never silently lost. **Empty states:** no visits / new carer / no messages each show a clear, non-alarming state. **Partial data:** a care plan that failed to download is shown as incomplete, not a misleading blank; a cached care plan/protocol older than `[P-STALECARE]` warns, and beyond it gates actions that depend on current clinical content. **Device-health nudges:** low storage (risking sync/media capture) or critically low battery (risking mid-visit data loss) surface an early, non-alarming warning so the carer can act.
**AC-38.1** Sync unsuccessful beyond `[P-SYNCWARN]` → clear warning + escalation, while still able to record offline. **AC-38.2** A server-rejected action informs the carer and preserves the data. **AC-38.3** Missing prefetched data is shown as incomplete, not a misleading blank. **AC-38.4** Critically low storage or battery surfaces an early warning before it threatens capture or sync.
**Priority:** M / v1. **Depends on:** `[SYNC]`, error-handling design.

## 39. In-app analytics & telemetry

Privacy-safe usage and reliability signals (feature adoption, crash-free sessions, sync health) with **no care-data PII**; documented in the DPIA.
**AC-39.1** No care-data PII appears in any telemetry event. **AC-39.2** Crashes/sync failures are captured for diagnosis without exposing client data.
**Priority:** S / v1. **Depends on:** analytics tooling, DPIA.

---

# Safety, integration & governance

## 40. Clinical safety hazards (DCB0129 — carer-app surface)

Owned jointly with the CSO; each hazard maps to a control and ≥1 test (§42). Severity × likelihood and residual-risk acceptance are recorded in the Clinical Safety Case; this is the carer-app hazard set.

| # | Hazard | Required control (acceptance) |
|---|---|---|
| H1 | Wrong client (care/med to wrong person) | Persistent person banner + two-identifier confirm before eMAR/high-risk; explicit person-switch clears unsaved input/defaults; similar-name warning; resume reconfirmation; switch audit (AC-14.35–14.40, §14.2) |
| H2 | Wrong / missed / late medication | dm+d-backed eMAR; allergy/contraindication pre-record; missed-dose alerting (§18) |
| H3 | Missed visit / no access undetected | `[P-MISSED]` escalation (§14, §22) |
| H4 | Stale offline data drives an unsafe decision | Care-plan/eMAR version + "last synced" shown; hard gate on known-stale guidance `[SYNC]` |
| H5 | Failed alert (not delivered) | Offline SMS/telephony fallback + delivery confirmation (§33) |
| H6 | Misattributed entry on shared device | Re-authentication on handoff (§36) |
| H7 | Spoofed verification falsifies a visit | Mock-location/tamper detection, flagged not trusted (AC-14.3) |
| H8 | **Voice-to-text mis-transcription** in a clinical note | Carer review/confirm of transcribed clinical content before save |
| H9 | **Autocomplete/selection picks wrong client or drug** | Disambiguation safeguards; confirm-selection step for high-risk pickers |
| H10 | **Photo attached to the wrong person's record** | Capture bound to the in-context client; confirmation on attach |
| H11 | **Barcode mis-scan** of medication | Scanned item displayed for human confirmation before recording |
| H12 | **Alert fatigue** degrades response to real alerts | Alert prioritisation/grouping; safety-critical alerts visually distinct (§33) |
| H13 | **PRN 24h maximum or minimum interval breached** across visits/carers | 24h running PRN total; warn/block before max or interval breach (AC-18.10) |
| H14 | **Wrong support level** (carer administers what the person self-manages, or vice versa) | Support level shown per medicine/task; recording matches level (AC-18.9, §17) |
| H15 | **Missed hypoglycaemia / hyperglycaemia** or insulin error | Glucose thresholds → hypo protocol; insulin units + site recorded; high-risk double-check (§19a) |
| H16 | **Missed clinical deterioration** in a condition-specific record (low SpO2, no catheter output, PEG dislodgement) | Condition thresholds → deterioration pathway/escalation (§19/§19a) |
| H17 | **Carer performs a clinical task beyond competency/scope** | Competency-gating on clinical records and personal-care items (§17.1, §19a, §28) |
| H18 | **Stale offline access / failed revocation** lets a leaver/suspended carer use cached data | Offline access lease `[P-OFFLINEAUTH]`; key expiry; wipe pending→confirmed (§50) |
| H19 | **Stale MAR hard-block prevents essential medication** | Controlled stale-data override with reason/paper-source/office-alert; high-risk excluded (§49) |
| H20 | **Administration against a stopped/changed order while offline** | Effective-authorised-version rule; stop wins; sync reconciliation + clinical review (§49) |
| H21 | **Double-up task conflict loses a carer's outcome** (Complete overwrites Unable) | Attributed event-merge; contradictions trigger review; no overwrite (§14.5/§32) |
| H22 | **Missed repositioning → pressure ulcer** for an at-risk person | Scheduled repositioning chart: last-turned/next-due/overdue + missed-turn flag across carers (§19 AC-19.15) |
| H23 | **Mishandled client cash / financial abuse** on shopping calls | Shopping reconciliation (money given − spend = change) + mismatch flag → financial concern (§26/§23.1) |
| H24 | **Two offline carers exceed a PRN limit / min interval** (or overspend client money) using stale cross-carer totals | Freshness gate: clinical totals block pending structured authoritative-source confirmation (§32 AC-32.3); client money gated by physical count + offline limit + stale-block (§26 AC-26.7, §32 AC-32.4) |
| H25 | **Critical alert has no owner** and is never actioned | Alert claim/assignment/transfer + escalation; critical never auto-expires (§48 AC-48.1/48.5) |
| H26 | **Push disabled/suppressed** (denied, battery-optimised, DND, token-invalid) so a safety alert never reaches the carer | Shift-start gate or verified SMS/telephone fallback; distinct delivery states; server-side missed-ack escalation (§33 AC-33.4/33.5) |
| H27 | **Active-visit access lease expires mid-visit**, blocking essential care recording | Short fixed grace, current-visit-only, reauth, no new visit, revalidation + office alert (§50 AC-50.2c) |
| H28 | **Offline break-glass record unavailable** in an emergency | Minimal emergency profile if provisioned; explicit "no record" + emergency/contact guidance, never blank (§50 AC-50.1a) |
| H29 | **Stale or withdrawn emergency protocol** launched in an emergency | Version pinned at start; urgent recall; stale → safe generic 999/111 route, never blank (§51 AC-51.4/51.6/51.7) |
| H30 | **Emergency contact number fails** mid-event | Alternative contact/escalation route on contact failure (§51 AC-51.8) |
| H31 | **Submitted care note overwritten**, losing clinical/safeguarding content | Submitted notes append-only/versioned; correction = addendum, original preserved (§32/§36) |
| H32 | **Prompted medicine later refused but only one code retained** | Separate supportAction × doseOutcome fields (§18 AC-18.15) |
| H33 | **Unknown allergy mistaken for "no known allergy"** | Distinct allergy states; Unknown ≠ None-known; warn/ack/follow-up/block-high-risk (§49 AC-49.7) |
| H34 | **Paper and electronic dose duplicated** at downtime reconciliation | Duplicate detection (client/med/dose/time/administrator/source) requires confirmation, not auto-second-event (§49 AC-49.6) |
| H35 | **Handover message becomes an unofficial clinical instruction** | Handover note not a sole authoritative source; lasting change must promote to order/care-plan/risk/temporary-authorised-instruction with expiry (§24) |
| H36 | **Invalid vital value launches the wrong protocol** | Unit/range/impossible-value validation + repeat-reading prompt before escalation (§19 AC-19.17) |
| H37 | **Protocol updated mid-emergency** changes the running pathway | Execution pinned to the version at start; recall affects new launches only (§51 AC-51.4/51.6) |
| H38 | **Wrong retrospective check-in accepted as a clean verified visit** | Backfill = Manual-exception verification, declared/entry times, reason, evidence, approval, original preserved (Appendix A, §14) |

**AC-40.1** Each hazard has a control covered by ≥1 test in §42. **AC-40.2** A release changing a safety-related flow triggers a hazard-log review pre-deploy. **AC-40.3** Known-stale guidance for a clinical task warns the carer and records that the warning was shown.
**Priority:** M / v1. **Depends on:** Clinical Safety Case (DCB0129), CSO sign-off, Test Strategy.

## 41. Integration register

| System | Direction | Purpose | Notes |
|---|---|---|---|
| GP Connect | in | GP record visibility | NHS-assured requirement |
| PDS / NHS Number | in | Identity validation | |
| dm+d / SNOMED CT | in | Medication & coding | eMAR (§18) |
| Pharmacy / prescribing | bi | **Orders, changes, reconciliation & dispensing data — not only stock** | §18, §49 |
| NatPSA source | in | Medication-safety alert ingestion | §49 |
| Care-record interoperability | bi | **MODS-aligned (DAPB4102) import/export/exchange** | §57; interoperability |
| LA electronic monitoring | out | Verified visit feed | §14 billing/commissioning |
| Payroll / finance / ERP | bi | Pay, expenses, client money | §26, §27 |
| LMS / e-learning | bi | Training & competency | §28 |
| Mapping provider | out | Navigation | §13 (provider-agnostic) |
| SMS provider | out | **Critical-notification & missed-visit fallback** | §33, §48 |
| Telephony | bi | ECM fallback + SOS | §14, §22 |
| Emergency / alarm-receiving centre | bi | **SOS acknowledgement & ownership/escalation** | §22 (optional) |
| Secure document / e-sign service | bi | **Export/share, policy acknowledgement, temporary files** | §29a |
| Malware scanning | in | **Scan uploaded carer documents & media** | §21 |
| Observability / crash service | out | **Privacy-safe diagnostics (no PII)** | §39 |
| Identity (SSO/OIDC, SCIM) | bi | Auth & provisioning | §10 |
| MDM / EMM | bi | Managed devices | §10, §37 |
| Bluetooth vital devices | in | Observations | §19 |
| Push (FCM/APNs) | **out (send) + in (token register)** | Server sends notifications outward; devices register tokens inward | §33 (corrected direction) |
| Translation service | in | **Approved vs machine-translated clinical content (source language + clinical safeguards)** | §24, §34 |

**Degraded mode is mandatory per connector.** For every integration the functional spec requires a defined user-facing degraded mode — even where retry/circuit-breaker mechanics live in the technical design. Each connector's design-doc entry specifies: timeout, retry, user-facing message, manual fallback, queued data, duplicate prevention, reconciliation, **whether care may continue**, office notification, and the **source of truth** on conflict.

**AC-41.1** Each connector defines a user-facing degraded mode (message, manual fallback, whether care continues, source of truth); a connector outage never silently blocks safety-critical recording without a stated fallback.

**Priority:** M / v1 (subset per §45 decisions). **Depends on:** Integration Architecture.

## 42. Success metrics & traceability

**Success metrics (how we know it works in the field):** carer adoption/active-use rate; median time-per-visit admin; % visits with a clean verified check-in; missed-visit rate; crash-free-session %; sync-success %; medication-error catch rate; training-compliance %; carer-retention proxy.

**Traceability chain (maintained in the Requirements-to-Test matrix):** Section → AC → Test case → Hazard (§40, where safety-relevant) → CQC SAF quality statement. Example: §18 → AC-18.4 → TC-med-allergy → H2 → SAF "Safe — Medicines optimisation."

**Priority:** M / v1. **Depends on:** Test Strategy, Compliance Coverage Matrix (owns the full SAF mapping).

### 42.1 State & concurrency test register (owned by Test Strategy — listed here so nothing is missed)
These scenarios **must** be covered before baseline freeze; the executable tests live in the Test Strategy, but the functional spec names them so coverage is auditable. Each maps to the AC/hazard shown.

| Scenario | Governing AC / hazard |
|---|---|
| Two offline carers administer the same PRN | AC-32.3 / H24 |
| Two offline carers spend the same client cash | AC-26.7 / H24 |
| Medication order stopped while one device offline | AC-49.10 / H20 |
| Office cancels while carer en route | Appendix A / §14 |
| Office cancels after check-in | Appendix A / §14 |
| Access lease expires mid-visit | AC-50.2c / H27 |
| Temporary access expires mid-visit | AC-50.2 / H18 |
| Protocol withdrawn during an emergency | AC-51.6 / H37 |
| Push accepted by FCM but never displayed | AC-33.4 / H26 |
| Notification permission revoked mid-shift | AC-33.5 / H26 |
| Two carers record conflicting task outcomes | AC-14.29 / H21 |
| One carer edits the same draft on two devices | AC-10.6 / AC-55.6g |
| Submitted note corrected offline | §32 / H31 |
| Person switch with unsaved medication fields | AC-14.37 / H1 |
| Similar-name clients in supported living | AC-14.38 / H1 |
| Paper & electronic administrations overlap | AC-49.6 / H34 |
| PRN follow-up due after administering carer leaves | AC-18.11 |
| CD count mismatch, no supervisor available | AC-18.19 |
| Person refuses a time-critical visit, property unsafe | AC-14.30 |
| Key-safe code changes while carer offline | AC-50.4 |
| Competency expires during a clinical task | §44.10 (competency-expiry, pending policy) |
| Forced app update with unsynced records | AC-10.7 / §32 |
| Device storage fills during media capture | AC-32.7 |
| Device dies during an active emergency protocol | AC-51.2 / AC-14.5 |
| Hospital admission recorded incorrectly then reversed | Appendix A (correction-after-closure) |

**AC-42.1** Every scenario above has at least one executing test in the Test Strategy before baseline freeze; a gap blocks freeze.

### 42.2 NFR / SLO values (to be ratified — values are owned by the NFR/SLO doc, not invented here)
The functional spec **requires** these to be set with measurable targets; the **numbers must be ratified by the platform/infra and commercial leads** (the spec deliberately does not invent them). "Navigation is smooth" is replaced by measurable interaction/render targets (§35, `[P-RENDER]`/`[P-COLDSTART]`). Items to ratify: supported Android/iOS versions; named reference devices + min RAM/storage; max clients cached; max visits/tasks/medicines per visit; max offline queue; max media queue; concurrent carers; API p95/p99 latency; eMAR/observation save latency; reconnect-to-sync completion; crash-free-session target; sync-success target; battery per 8h/12h shift; data usage; RTO/RPO; critical-notification SLO; support-response SLA; penetration-testing cadence. Each maps to an AC-52.2 sub-criterion.

**AC-42.2** No NFR/SLO target remains as prose; each has a ratified numeric value in the NFR/SLO doc before estimation/baseline freeze.

## 43. Out of scope / non-goals (v1)

Office/back-office authoring (rostering, invoicing, payroll runs, care-plan authoring); the family app; full LMS authoring; care-plan *editing* by carers (they raise change requests, §24). **Clinical boundary (corrected):** the app **does not diagnose, prescribe or independently determine treatment.** It **presents clinically approved, configured decision-support** (early-warning scoring, threshold checks, condition-specific protocols, recommended contact routes, repeat-observation prompts) and **records the actions taken** — it does not originate clinical judgement. (This wording matters for the clinical-safety case and the MHRA SaMD assessment, §44/§52; "the app does not advise clinically" was imprecise given the scoring/protocol features and is superseded by this statement.)

## 44. Open decisions & nation parameterisation

1. **Target nation(s).** Content defaults to **England** (CQC, SAF, RIDDOR, ReSPECT). For Scotland/Wales/NI, the regulator, framework and statutory-notification terms are parameterised, not hard-coded — set the `nation` parameter and substitute equivalents (Care Inspectorate / CIW / RQIA).
2. **Client money (§26)** in v1 or later?
3. **Supported-living shift mode (§14.2)** in v1 or later? (touches the data model)
4. **LMS:** build natively or integrate (§28)?
5. **Device strategy:** BYOD / managed / both (§10).
6. **Earned-wage access (§27):** v1 or later?
7. Telephony-fallback provider for ECM and SOS (§14, §22).
8. **Sleep-in pay rule (§14.4):** whether/how sleep-in hours are payable (UK case-law-dependent) — the app records hours and wake events; payroll applies the rule. Confirm with payroll/legal.
9. **CD witness eligibility (§18.1):** ✅ **Resolved in v3.1** — default rule set (on-duty, present, medication + CD competency with valid training, different authenticated account, independent confirmation; remote witnessing prohibited unless separately enabled) with a no-witness-available fallback; remains provider-configurable and clinical-governance-ratifiable.
10. **Deferred to design docs / planned v2.7 (tracked, not yet specified):** legitimate items from review that are build/design-doc detail or a substantial second pass, owned by the documents in §46 and the next spec pass. From earlier review: alert sub-state/ownership/transfer model, per-connector integration-degradation behaviour, persistent person-identity banner & multi-client re-confirmation (to be made **normative** clinical-safety, not UI preference), emergency-protocol authoring/versioning/deviation governance + contact-failure handling, notification-delivery edge cases & mandatory-notification-at-shift-start policy, cross-shift handover of unresolved safety work, fatigue "not safe to continue" escalation, shared-device session handoff. **From third review:** ✅ **Done in v2.7:** ~20 domain entities added to Appendix E; bundled ACs split into atomic criteria (AC-55.6a–h, AC-55.1a–e, AC-55.4a–e, AC-49.5a–d, AC-52.1a–e, AC-52.2a–f). **Still planned (v2.8+):** ✅ **Done in v2.8:** offline-capability matrix completed for §§47–55 (Appendix C Part 2). **Remaining:** build the state-transition/concurrency test matrix; ✅ **PRN-follow-up cross-shift owner — done v3.1 (§49/AC-18.11)**; ✅ **admin-window vs min-interval semantics separation — done v3.0 (§49 three independent rules)**; ✅ **offline break-glass profile + secure search — done v3.2 (§50 AC-50.1a/1b)**; ✅ **notification-denial hard policy — done v3.3 (§33 AC-33.5)**; ✅ **active-visit lease-expiry behaviour — done v3.2 (§50 AC-50.2c)**; ✅ **client-money offline overspend controls — done v3.1 (§26 AC-26.7, §32 AC-32.4)**; ✅ **body-map vocabulary — done v3.3 (§19 AC-19.20)**; ✅ **consent/MCA decision-specific wording — done v3.3 (§16 AC-16.3)**; ✅ **incident specialised fields (falls/restraint/missing-person) — done v2.9 (§23.5); safeguarding disclosure handling — done v2.9 (§23.4); consumable supplies — done v2.9 (§20)**; ✅ **whistleblowing confidentiality routing — done v3.4 (§23.6 AC-23.16/23.17)**; ✅ **handover-note-not-a-shadow-care-plan rule — done v3.4 (§24 AC-24.5/24.6)**; ✅ **Article 6/9 share-record separation — done v3.3 (§53 AC-53.1/53.2)**; ✅ **print/export hardening — done v3.3 (§29a AC-29a.6)**; ✅ **observation value validation — done v3.3 (§19 AC-19.17–19.19)**; ✅ **wrong-person identity normative — done v3.3 (§14.2 AC-14.35–14.40)**; ✅ **multi-device concurrency decided — done v3.3 (§10 AC-10.6)**; ✅ **push≠ack + SOS no-service — done v3.3 (§33 AC-33.4, §22 AC-22.5/22.6)**; ✅ **protocol governance enforceable — done v3.3 (§51 AC-51.4–51.10)**; localisation clinical-translation safeguards (translation entry now in register §41, AC pending); ✅ **integration-register expansion — done v3.4 (§41 + degraded-mode AC-41.1)**; ✅ **core domain model refreshed — done v3.4 (§6)**; ✅ **hazard register extended H25–H38 — done v3.4 (§40)**; ✅ **exposure/needlestick incident fields — done v3.4 (§23.5 AC-23.15)**; ✅ **state/concurrency test register + NFR-pending scaffolds — done v3.4 (§42.1/42.2, owned by Test Strategy / NFR doc)**; **full NFR value set remains for the NFR/SLO doc to ratify (numbers, not spec authoring).** **Each is real; none is silently dropped.**

## 45. Edge-case register

DST/clock-change for waking-night shifts crossing the change (trusted time, §14); offline beyond `[P-PREFETCH]` (§32/§38); concurrent sessions on two devices (§10); very large media on poor connectivity (§21); offline navigation needing connectivity (§13); time-zone consistency for any cross-border working.

## 46. Cross-document pointers

| Concern | Owning document |
|---|---|
| Hard performance numbers / SLOs | Non-Functional Requirements / SLO |
| Sync conflict mechanics | Offline & Sync Engine Design |
| ECM anti-fraud mechanics | ECM / Visit Verification Design |
| Full clinical hazard log + residual risk | Clinical Safety Case (DCB0129) |
| DPIA, Records of Processing | Privacy / IG artefacts |
| Canonical data model | Data Model document |
| CQC quality-statement → feature mapping | Compliance Coverage Matrix |

---

## Change history (v1.0 baseline — full log at end of document)
- **v1.0** — Consolidated rebuild. Reorganised by logic (front-loaded glossary/roles/personas/domain model/parameters); deduplicated auth, notifications, mileage, expenses, media; resolved thresholds into §7; added MoSCoW + release priorities; restored device/security detail; added shift clocking (§12), supported-living mode (§14.2), deterioration/NEWS2 & device pairing (§19), equipment/LOLER (§20), carer-directed harm (§22), restraint & whistleblowing (§23), feedback (§25), client money & expenses (§26), search (§30), help (§31); deepened clinical-safety hazards (§40, H8–H12); added integration register (§41), success metrics & traceability (§42), nation parameterisation (§44). Supersedes v0.1–v0.3.
- *Full v1.0 → v1.11 history is consolidated in the single Change history at the end of this document.*

---

# Appendices — precision reference (v1.1)

These appendices are the **authoritative detail** for the aspects they elaborate; where an appendix and a body section overlap, the appendix governs the detail and the body section governs the intent. Added in v1.1 to raise rigour without changing scope.

## Appendix A — Visit state-transition table (elaborates §14)

`Late` is a flag on a visit, not a terminal state. All transitions are audited (§36) and work offline (§32).

| From | Event | Guard | To | Side-effects |
|---|---|---|---|---|
`Late` is a flag, not a state. The **only lifecycle states are `Scheduled / En route / In progress / Closed`**; attendance/care-delivery/verification/reason are recorded as dimensions on close (§14), and display labels (Missed/No access/Cancelled/Exception) are derived from them.

| From | Event | Guard | To (lifecycle) | Dimensions set / side-effects |
|---|---|---|---|---|
| Scheduled | Carer starts travel | — | En route | Travel timer (§13) |
| Scheduled / En route | Check-in | Inside `[P-GEOFENCE]`, trusted time | In progress | Verification=Verified; Late flag if after window |
| Scheduled / En route | Check-in | Outside `[P-GEOFENCE]` + reason | In progress | Verification=Outside geofence; reason stored |
| Scheduled / En route | Check-in | Mock-location detected | In progress | Verification=Tamper suspected (AC-14.3) |
| Scheduled | `[P-MISSED]` elapses, no check-in | — | Closed | Attendance=Carer did not attend (→ "Missed"); escalation (§22) |
| Scheduled / En route | "Unable to access" submitted | Reason captured | Closed | Attendance=No access; Care-delivery=No care; office alert; welfare protocol |
| Scheduled / En route | Office cancels (online) | — | Closed | Attendance=Cancelled; reason code; carer notified with diff (§12) |
| **En route** | **Office cancels mid-travel** | — | Closed | Attendance=Cancelled; **stop-travel prompt**; travel mileage still recorded |
| **In progress** | **Office cancels after check-in** | — | In progress (continues) | Cancellation queued; carer completes safe care then closes; flagged |
| **Scheduled / En route** | **Visit reassigned** | Office reassigns | (removed from carer) | Carer notified; new carer scheduled |
| **In progress** | **Wrong visit / wrong person detected** | Identity/geofence mismatch | In progress (corrected) or voided | No clinical record carried over (§44.10 identity); office corrects |
| **Closed** | **Forgot check-in (backfill)** | Manual-exception flow | In progress→Closed | **Backfilled start = Verification: Manual exception** (see below), never clean-verified |
| **In progress** | **Forgot checkout** | Declared/estimated end | Closed | End time typed = declared; system-estimated flagged; office may correct |
| **In progress** | **Office closes abandoned visit** | No checkout beyond threshold | Closed | Record-completion=Missing info; office-closed flag |
| **Closed** | **Correction after closure** | Authorised correction | Closed (new version) | Append-only; original preserved (§36) |
| **Closed** | **Reopened for record completion** | Authorised | In progress (record-only) | Write-only record completion; lifecycle audit |
| **In progress** | **Temporary departure & return** (extended visit) | — | In progress | Departure/return logged; continuity preserved |
| **In progress** | **Handover to another carer** (long visit) | — | In progress (carer changes) | Handover ack (§55.3); each carer's time attributed |
| **In progress** | **Double-up partner replaced** | — | In progress | New attendee recorded; both-identities rule (§14.5) |
| (none) | Carer creates ad-hoc | Role permits (§5) | In progress | Unscheduled flag; reason; **later matchable to a scheduled visit** |
| **In progress** | **Emergency departure (no normal checkout)** | Danger/emergency | Closed | Care-delivery per actual; reason=safety; office alerted (§22/§51) |
| **In progress** | **Client transported to hospital mid-visit** | — | Closed | Attendance=Attended; reason=hospitalised; remaining visits flagged (§14.3) |
| **In progress** | **Escort visit ends away from home** | Escort type (§14.1) | Closed | Location-move expected; end captured off-site (AC-14.11) |
| **(offline) Scheduled** | **Cancelled centrally before device reconnects** | — | Closed on sync | On reconnect, central cancellation reconciled; if carer already attended, conflict surfaced |
| In progress | Check-out | Tasks triaged; trusted time | Closed | Five-dimension result derived (§14); billing feed + earnings (§27) |
| In progress | App killed / battery death | — | In progress (restored) | Visit + timer + unsynced entries restored (AC-14.5) |

**Backfilled check-in (strengthened — ECM evidence):** a retrospective check-in is **not** a clean verified event. It captures: declared actual start time; time the correction was entered; **mandatory reason**; supporting evidence where available; **Verification = Manual exception**; office review/approval; and the **original unmodified event history is preserved**. It must never present as a real-time verified check-in.

**Double-up rule:** a visit is *fully delivered* only when all required attendees have reached `In progress`/`Closed` with care recorded; otherwise Care-delivery = `Partially delivered` (AC-14.6).

## Appendix H — Edge-case & scenario register (field situations → spec behaviour)

Maps real-world field situations to the **section that already governs them**, using this spec's **lifecycle states** (`Scheduled / En route / In progress / Closed`) plus the **outcome dimensions** (attendance / care-delivery / record-completion / verification) and the **§14 reason-code taxonomy**; display labels (Missed/No access/Cancelled) are derived (§14). It does not introduce a *separate* API or M-phasing; release timing follows the §56 v1/Later baseline. "Charge/billing consequence" is a **back-office** outcome (the carer app records the visit outcome; billing logic is not carer-app scope).

### A. Arrival & access
| # | Situation | Carer action → outcome (this spec) | Section | Office/back-office |
|---|---|---|---|---|
| A1 | Service user not at home | "Unable to access" → **Closed + No access**; attempt + welfare protocol | §14, §14.3 | Review billing; contact client/emergency contact |
| A2 | Door locked / key-safe fails | Wrong-code/access-failure workflow → **Closed + No access**; optional photo/note | §50, §14.3 | Arrange access fix; notify family |
| A3 | Client refuses care/entry | Task `Declined-by-person`; whole-visit refusal → **Closed + Attended + Person refused entry + No care delivered** (stable, distinct from office Cancellation; AC-14.33) | §16, §17, §14 | Review care plan; welfare if time-critical |
| A4 | Wrong address / wrong client | Do **not** check in; contact office; (geofence/identity guards) | §14, §50, §44.10 (identity UX) | Correct rota; reallocate |
| A5 | Unsafe to enter (aggression/hazard/safeguarding) | Leave safely → incident/safeguarding flow; **Aborted** + escalation | §22, §23 | Safeguarding process; may suspend plan |
| A6 | Access instructions unclear | Contact office from visit screen; delay check-in | §14.3, §29a (access on card) | Update access record |

### B. Timing & attendance
| # | Situation | Carer action → outcome | Section | Office |
|---|---|---|---|---|
| B1 | Carer running late | `Late` flag; missed-visit escalation if no check-in beyond `[P-MISSED]` | §14, §11 | Notify client if time-critical |
| B2 | Carer arrives early | Check-in window governed by config; else wait | §14 | — |
| B3 | Visit overruns | Complete with true end time; overrun knock-on flagged | §14.3, §13 | Reallocate/delay next |
| B4 | Forgot to check in | Backfill actual start at completion; audit note | §14, App A (restored) | Review if recurring |
| B5 | Forgot to check out | Complete later with actual end, or office closes | §14 | Correct in admin |
| B6 | Visit never happened | Report → **Missed** with explanation | §14, §22 | Disciplinary/welfare; client welfare check |
| B7 | Carer cannot attend (sick/emergency) | Report sickness/can't-attend; relinquish shift | §55.5 | Find cover |

### C. Care delivery
| # | Situation | Carer action → outcome | Section |
|---|---|---|---|
| C1 | Full care completed | Check out → **Complete** | §14 |
| C2 | Partial care (e.g. 2 meds given, 1 refused, shower assisted) | Each medicine per-item on MAR (§18); shower marked on care tasks with note (§17.1); care-delivery derived **Partially delivered** by unmet planned outcome (AC-14.32); summary in notes (§21) | §14, §17, §18, §21 |
| C3 | Medication given | eMAR administered against effective order | §18, §49 |
| C4 | Medication refused | eMAR `Refused` with reason; lifecycle still **Closed** + Attended, but care-delivery = **Partially delivered** unless the refusal was itself the planned/expected outcome (§14 AC-14.32) | §18, §14 |
| C5 | PRN given | PRN protocol record with indication + 24h ceiling | §18, §49 |
| C6 | No meds this visit | eMAR not presented | §18 |
| C7 | New/changed skin/wound | Body map + photo; condition-specific record | §19, §19a |
| C8 | Equipment fault | Equipment register flag + photo/note | §20, §14.3 |

### D. Office-driven changes (carer must see)
| # | Situation | Carer sees → outcome | Section |
|---|---|---|---|
| D1 | Planned absence/holiday | Visit shows **Cancelled** before travel (banner) | §14.3, §12 |
| D2 | Hospital admission (office knows) | **Cancelled**; do not travel | §14.3 |
| D3 | Visit plan suspended | Visit removed/**Cancelled** | §14.3 |
| D4 | Family cancelled (office knows) | **Cancelled** | §14.3 |
| D5 | Stale visit after office cancel | Pull-to-refresh; if still shown, contact office before travel | §32 |

### E. Multi-carer (double-up)
| # | Situation | Carer action → outcome | Section |
|---|---|---|---|
| E1 | Two required, one arrived | Don't complete two-person tasks alone; flagged | §14.5 |
| E2 | Partner late | Partial attendance flagged; record safe work | §14.5 |
| E3 | Partner no-show | Office decision; partial/abort/cover | §14.5 |

### F. Safety, compliance & alerts
| # | Situation | Carer action → outcome | Section |
|---|---|---|---|
| F1 | Time-critical visit cancelled/aborted | **Welfare check mandatory before submit** (blocks) | §14, §51 (new AC-14.30) |
| F2 | Allergy/critical flash flag | Must acknowledge before check-in | §15, §18 |
| F3 | Medication outside time window | Warn/block per windows; override controlled | §18, §49 |
| F4 | Controlled-drug count mismatch | Can't complete MAR until resolved; supervisor alert | §18.1 |

### G. Technology & connectivity
| # | Situation | Carer action → outcome | Section |
|---|---|---|---|
| G1 | No signal at property | Continue; actions queue; sync on reconnect | §32 |
| G2 | GPS inaccurate | Check-in with reason → exception flag | §14, App A |
| G3 | App killed mid-visit | Relaunch restores visit/timer/unsynced entries | §14, §32 |
| G4 | Session expires mid-visit | Re-auth; offline actions sync after login | §10, §50 |

**Genuine additions surfaced by this register** (now in the spec): the carer-facing **outcome picker** (§14, AC-14.31), **welfare-before-submit on a time-critical call-off** (§14, AC-14.30), and the **charge-status-as-back-office** clarification (above). All other rows were already governed by existing sections.

## Appendix B — Notifications matrix (elaborates §33)

| Event | Channel(s) | Priority | Overrides quiet hours? | Offline fallback |
|---|---|---|---|---|
| SOS escalation / acknowledgement | Push + SMS/telephony | Critical | Yes | Telephony |
| Missed-visit escalation (`[P-MISSED]`) | Push + in-app | Critical | Yes | SMS |
| Same-shift schedule change | Push + in-app | High | Yes (on-shift only) | Queued, surfaced on reconnect |
| Care-plan / medication change request actioned | Push + in-app | High | No | Queued |
| Urgent message | Push + in-app | High | No | Queued |
| Medication-due reminder | Push + in-app | Normal | No | Local reminder if scheduled |
| Routine message / broadcast | In-app (digestible) | Low | No | Queued |
| Training / compliance due (§28/§29) | In-app + banner | Low | No | Local |
| Leave-request decision | Push + in-app | Normal | No | Queued |
| Sync-failure warning (`[P-SYNCWARN]`) | In-app (persistent) | High | n/a (device-local) | n/a |

**Rule:** only `Critical` overrides off-shift quiet hours; all critical notifications require delivery confirmation (§33, H5 §40).

## Appendix C — Offline capability matrix (elaborates §32)

R = readable offline · W = writable offline (queues to sync) · Conflict = per-entity policy.

| Feature | Read | Write | Conflict policy |
|---|---|---|---|
| Today / schedule view | R | — | n/a |
| Availability / leave / swap requests | R | W | Office authority wins; carer notified |
| Visit lifecycle (check-in/out) | R | W | Append-only verified events |
| Care plan | R | (acknowledge) W | n/a |
| Tasks | R | W | Attributed event-merge (shared/double-up AND single-carer); a correction/office update supersedes as a new event, never silent overwrite; reasons preserved |
| eMAR | R | W | **Append-only; conflict surfaced, never overwritten** |
| Observations / body maps / NEWS2 | R | W | Append-only readings |
| Notes (free text) | R | W | Last-write-wins only on the author's unsubmitted draft; **append-only/versioned after submission**, correction = explicit addendum, original preserved (§36); concurrent same-draft edits surfaced |
| Incidents / safeguarding / restraint / whistleblowing | R | W | **Append-only after submit** |
| Client money / expenses | R | W | **Append-only; balance recomputed on sync** |
| Messaging | R (cached) | W | Queue + send |
| Media | (capture) | W | Queued upload, bound to record |
| Search | R (cached scope) | — | n/a |
| Learning content / quizzes | R (downloaded) | W (results) | Append-only results |
| Earnings | R (cached estimate) | — | Recomputed server-side |
| Navigation | R (cached) | — | States when connectivity needed (§13/§38) |

### Part 2 — newer functionality (§§47–55)

Richer columns for the safety-critical newer features. **Read** = readable offline · **Write** = create/update offline · **Cached version** = which version must be cached to act · **Conflict** = on-sync handling · **Offline alert** = can it raise an immediate alert offline · **Stale-data** = behaviour when its safety data is stale.

| Feature (§) | Read | Write | Cached version | Conflict | Offline alert | Stale-data |
|---|---|---|---|---|---|---|
| Onboarding/permissions (§47) | Yes | Limited (local prefs) | — | n/a | — | n/a |
| Alert raise/acknowledge (§48) | Yes | Yes (local queue) | — | Merge by alert id; ack attributed | **Yes — SMS/telephony fallback** | Critical never auto-expires; escalates on reconnect |
| Medication order (§49) | Yes (cached effective version) | No (clinical authoring is back-office) | **Currently effective authorised version** | Reconcile; stopped/changed wins (AC-49.10) | — | Stale beyond `[P-STALEMAR]` → gate + controlled override (AC-49.9) |
| Medication reconciliation (§49) | Yes | Acknowledge only | Latest synced | Office/clinical resolves; carer instruction shown | — | Unresolved blocks affected administration |
| Stale-MAR override (§49) | Yes | Yes (with reason + paper-source confirm) | last-sync shown | Reconciled later; all admins flagged | Office alerted | Prohibited for configured high-risk meds |
| Alert/PRN cross-carer totals (§18/§32) | Yes | Yes | last-confirmed + pending | Append-only; freshness-gated | — | **Stale + high-risk → block pending authoritative source (AC-32.3)** |
| Emergency protocol (§51) | Yes (cached) | Execution recorded | **Version pinned at execution start** | Append-only execution | Yes (guides 999/111 + fallback) | Stale > `[P-PROTOCOLSTALE]` → safe generic emergency route, never blank |
| Break-glass access (§50) | Cached record only; else minimal emergency profile | Reason recorded | n/a | Audited on sync | Office notified on reconnect | Offline + not-cached → minimal profile only |
| Temporary/delegated access (§50) | Within lease | — | Access grant cache | Re-validate on lease expiry | — | Lease lapse → re-validate or lock (AC-50.2a) |
| Key-safe reveal (§50) | Yes (within window) | Reveal audited | — | n/a | — | Auto-remask `[P-KEYSAFEREVEAL]` |
| On-entry welfare confirmation (§14) | Yes | Yes | — | Append-only | Concern/emergency → §48 fallback | n/a |
| Leaving-safe checklist (§14) | Yes | Yes | — | Append-only | — | n/a |
| Visit-outcome derivation (§14) | Yes | Yes (derived locally) | — | Recomputed on sync from records | — | n/a |
| Information sharing (§53) | Yes | Yes (purpose recorded) | — | Audited on sync | Emergency share proceeds (vital interests) | n/a |
| Forms & drafts (§55.6) | Yes | Yes (auto-save) | — | Owner-scoped; server-rejection preserved | — | Draft expiry handled |
| Spot check (§55.1) | Yes | Yes | — | Append-only | — | n/a |
| Handover acknowledgement (§55.3) | Yes | Yes (ack) | — | Append-only | — | n/a |
| Communication needs (§54) | Yes | Update/flag | Latest synced | Office authority | — | n/a |
| PRN effectiveness follow-up (§18/§49) | Yes | Yes | — | Append-only; owner carried in handover | Prompt local; escalates if unresolved | Pending item appears in end-of-shift unresolved-safety list |
| Critical incident (§23) | Yes | Yes | — | Append-only | **Yes — immediate fallback chain (AC-23.1)** | n/a |

## Appendix D — Accessibility detailed criteria (elaborates §34)

Concrete, testable criteria mapped to WCAG 2.2 AA and the field context (gloves, low light, one-handed).

- Minimum interactive target size meets the platform accessibility minimum (and is comfortably glove-usable).
- Text contrast ≥ 4.5:1 (normal) / 3:1 (large text and UI components).
- Supports OS text scaling to at least 200% with no loss of content or function.
- **No colour-only signalling:** status chips (`Upcoming/Due now/Missed`, etc.) and risk flags carry text and/or icon, not colour alone.
- All interactive controls have screen-reader labels; focus order is logical; error messages are programmatically associated with their field.
- Safety-critical confirmations (check-in/out, eMAR record, SOS) give **multi-modal** confirmation (visual + haptic, optional audio).
- Time-limited interactions are adjustable or have no hard timeout where a carer may be mid-task.

**Acceptance criteria (extend §34):**
- **AC-34.2** No primary status or risk is conveyed by colour alone; each has a text/icon equivalent.
- **AC-34.3** With OS text at 200%, all primary flows remain fully usable with no clipped or unreachable content.
- **AC-34.4** Check-in, eMAR record and SOS each provide a non-visual confirmation (haptic and/or audio).
- **AC-34.5** Contrast on all text and essential UI meets the stated ratios on the reference device.

## Appendix E — Data dictionary, key entities (elaborates §6)

Lightweight field summary for the highest-risk entities; the canonical model is the Data Model document. Types are indicative. `(trusted)` = trusted-time attestation (§36); `appendOnly=true` = corrections create a new version, never overwrite.

### Visit & outcome
**Visit** — id; clientId; scheduledStart/End; plannedDuration; lifecycleState (`Scheduled/En route/In progress/Closed`); actualStart/End (trusted); checkIn{method, coords, trustedTime, exceptionReason?, tamperFlag?}; checkOut{…}; assignedCarerIds[]; requiredCompetencies[]; riskFlags[]; taskIds[]; lateFlag; visitType (§14.1); settingId? (§14.2); outcomeId.

**VisitOutcome** (orthogonal dimensions, §14) — id; visitId; attendanceOutcome (`Attended/No access/Person absent/Person refused entry/Carer did not attend/Cancelled`); **plannedCareOutcome** (`Met/Partially met/Not met` — plan followed?); **careSummary** (`Full/Partial/No planned care` — physically happened?); recordCompletionStatus (`Complete/Missing required info/Exception authorised`); verificationStatus (`Verified/Manual exception/Outside geofence/Tamper suspected`); reasonCode (taxonomy §14); billingDisposition (back-office: pending/billable/non-billable/disputed); derivedAt.

**VisitWelfareConfirmation** — id; visitId; carerId; outcome (`seen-as-expected/concern/not-seen/not-present/declined/remote/emergency/N-A`); note?; routedTo? (§51/§55.4); timestamp (trusted).

**VisitSafetyChecklist** — id; visitId; items[{label, result: done|N-A|declined|left-with-family|transferred|ended-outside-home|danger|another-carer-present|capacity-chose-otherwise, note?}]; completedBy; timestamp (trusted).

**TaskActionEvent** (attributed, event-merged — §14.5/§32) — id; taskId; visitId; carerId; action (`done/partial/not-done/declined/unable`); reason?; supportLevel; timestamp (trusted); supersedesEventId?; appendOnly=true.

### Medication
**MedicationOrder** — id; clientId; medication{dm+d, name, form, route}; class (scheduled/PRN/time-critical/controlled); supportLevel; currentVersionId; status (`Draft/Pending verification/Active/Suspended/Superseded/Discontinued/Completed/Expired`); prescriberSource; reviewDate.

**MedicationOrderVersion** — id; orderId; versionNo; dose/doseRange; schedule/windows; prnProtocol?{indication, max24h, minInterval}; startDate; stopDate?; authorisedBy (clinical role); effectiveFrom (trusted); supersedesVersionId?; reason.

**MARentry** — id; clientId; visitId; orderVersionId; **supportAction** (self-managed/prompted/supervised/assisted/administered/no-action); **doseOutcome** (taken/refused/withheld/unavailable/not-required/partly-taken/administered-by-other/omitted/unknown); omissionReason?; exceptionOutcome? (§18 dropped/spilled/vomited/etc.); actualTime (trusted); carerId; witnessId? (CD, authenticated); verification{barcode|photo}; window{scheduledDueTime, earlyWindow, lateWindow, classification}; prn{lastConfirmedDoseTime, minInterval, max24h, rolling24hTotal}?; freshnessState? (§32); effectiveness? (PRN); recordedInError?{by, reason, at}; version; appendOnly=true; auditRef. *(Destroyed/returned → MedicationStockEvent, not here.)*

**MedicationReconciliation** — id; clientId; state (`Pending/Under review/Clarification requested/Confirmed/Rejected/Resolved`); previousOrderVersionId; proposedOrderVersionId; source (hospital/GP/pharmacy/prescriber/other); discrepancy; contactedPerson; advice; clinicalVerifier; effectiveTime; administrationsWhileUnresolved[]; carerInstruction (`continue-previous/follow-new/withhold/contact-oncall`).

**MedicationStockEvent** — id; clientId; medication; eventType (`receipt/count/administration-balance/return/destruction-evidence`); quantity; balanceAfter; witnessId?; evidenceMediaId?; appendOnly=true; feedsRegister(bool, back-office §18.1).

### Alerts & access
**Alert** — id; type; severity (`Information/Warning/High/Critical`); clientId?; raisedBy; raisedAt (trusted); state (`raised/delivered/seen/acknowledged/action-started/escalated/resolved/withdrawn/reopened`); duplicateKey; suppressionWindow; resolutionReason?; resolutionEvidence?; resolverId?; maxEscalationPeriod (critical = never auto-expire).

**AlertAcknowledgement** — id; alertId; userId; ackType (`seen/acknowledged/action-started`); timestamp (trusted).

**AlertAssignment** — id; alertId; assignedTo; claimedBy?; transferredFrom?; transferredAt?.

**AccessGrant** — id; carerId; clientId; grantType (`assignment/temporary/delegated/break-glass`); validFrom; validTo; reason? (break-glass); revokedAt?; cachedLeaseId?.

**OfflineAccessLease** — id; deviceId; carerId; issuedAt; expiresAt (`[P-OFFLINEAUTH]`); grantCacheExpiry (`[P-ACCESSGRANTCACHE]`); keyExpiry; wipeState (`none/pending/confirmed`); clockTamperDetected?.

**BreakGlassEvent** — id; carerId; clientId; reason; cacheState (`online/cached/not-cached-minimal-profile`); grantedAt; expiresAt (`[P-BREAKGLASS]`); reviewedBy?; auditRef.

### Protocols, sharing, comms, config
**EmergencyProtocol** — id; scope (provider-wide/person-specific); clientId?; version; author; clinicalApprover; effectiveDate; reviewDate; cachedAt?; staleState (`fresh/warn/refuse` per `[P-PROTOCOLSTALE]`); withdrawn?.

**ProtocolExecution** — id; protocolId; protocolVersion (pinned at start); visitId; clientId; carerId; steps[{action, contactAttempted, contactOutcome, adviceRecorded, repeatObsId?, timestamp}]; deviation?{reason}; state (`open/closed`); closedAt?.

**InformationShareEvent** — id; clientId; carerId; sharingPurpose (plain-language); article6Basis (mapped); article9Condition (mapped, separate); confidentialityJustification; decisionAuthority; recipient; recipientVerified(bool); minimumDataShared; method; expiry?; outcome (success/failed); auditRef.

**CommunicationNeed** (AIS/DAPB1605, §54) — id; clientId; preferredFormat; bslInterpreter?; hearing/visualImpairment?; easyRead?; largePrint?; communicationAid?; preferredContact; metThisVisit?; reviewDate.

**HandoverAcknowledgement** — id; handoverNoteId; recipientCarerId; acknowledgedAt (trusted); reviewedBeforeCare(bool); clarificationRaised?; promotedToCarePlan?(→ change request §24); expiry.

**HandoverNote** — id; clientId?; authorCarerId; intendedRecipient; priority; body; expiry; acknowledgementRequired(bool); clarificationStatus; promotedToCarePlanStatus; closureState; createdAt (trusted). *(Not a sole authoritative source for lasting change — §24.)*

**WhistleblowingReport** — id; submitterMode (anonymous/confidential-named); subjectRole?; recipientSet[]; excludesImplicatedManager(bool); externalRouteUsed?(senior-subject); progressVisibleToSubmitterWithoutIdentityExposure(bool); retaliationLinkedReportId?; createdAt (trusted); appendOnly=true. *(Distinct from client SafeguardingConcern — §23.6.)*

**FormDraft** — id; formType; ownerCarerId; deviceId; autosaveAt; payload; submitState (`draft/submitted/rejected`); rejectionReason?; expiresAt; sharedDeviceScoped(bool).

**ConfigurationVersion** — id; configType (threshold/protocol/competency/codeset); version; owner; approver; effectiveDate; scope; auditHistory[]; rollbackOfVersionId?; appliesMidVisit=false.

### Existing (retained)
**Observation** — id; clientId; visitId; type; value(s); unit; deviceSourced(bool); deviceMeta?{id, model, measuredAt, transferredAt, manuallyEdited, calibrationStatus}; timestamp (trusted); earlyWarningScore?; thresholdBreached(bool); baselineRange?; carerId.

**Incident / SafeguardingConcern / RestraintRecord** — id; type (taxonomy §23.2); clientId?; carerId; harmLevel; narrative; media[]; immediateActions; criticalFallbackTriggered?(§23); specialisedFields?{fall:{witnessed,injurySuspected,headImpact,anticoagulant,moved,postFallObs,bodyMapLink}, restraint:{antecedent,alternatives,type,duration,authority,injury,monitoring,review}, missingPerson:{lastSeen,clothing,risks,searchPerformed,policeRef,familyNotified,outcome}, exposure:{type,immediateFirstAid,sourceInfo,clinicalOHContact,followUp}}; submittedAt (trusted); appendOnly=true; routing.

**SafeguardingDisclosure** — id; clientId; carerId; exactWordsVerbatim; factualObservation; interpretation?(separate); practicePromptsShown[]; immediateDangerRouted?(§51); routedToSafeguardingLead; submittedAt (trusted); appendOnly=true.

**ConsumableSupply** — id; clientId; type (stoma/catheter/pads/gloves/dressings/thickener/feed); status (in-stock/low/out); storedCorrectly?; flaggedToOfficeAt?.

**Concern** — id; category (taxonomy §23.1); clientId; carerId; detail; promotedToIncidentId?; timestamp (trusted).

**MoneyTransaction** — id; clientId; carerId; amount; direction; purpose; receiptMediaId?; runningBalance; lastConfirmedBalanceAt; pendingLocal(bool); changeReturned?; discrepancyFlag?; timestamp (trusted); appendOnly=true; version; auditRef.

**Assessment** — id; clientId; type (risk/MCA/condition/outcome); carerContribution (`completed/updated/flagged-for-review`); formalDeterminationBy? (not carer); reviewDate.

**Document / DailyLog** — id; clientId; type; authoredElsewhere(bool→read-only); cached(bool); shareGovernedBy (consent/lawful-basis §53); auditRef.



## Appendix F — Parameter rationale & sources (elaborates §7)

| Token | Why this default | Confirm with |
|---|---|---|
| `[P-GEOFENCE]` 100 m | Balances GPS accuracy (worse in dense urban / rural) against fraud tightness | ECM Design + LA monitoring requirements |
| `[P-MISSED]` 15 min | Common commissioning tolerance for a late/missed call | LA/ICB contracts |
| `[P-SHORTVISIT]` 2 min | Below this a "visit" is likely clipping, but welfare pop-ins are legitimately short | ECM Design + visit-type config |
| `[P-SYNCSLA]` 60 s | Office "real-time" expectation without hammering battery/data | NFR/SLO + Sync Design |
| `[P-COLDSTART]` 2.5 s / `[P-RENDER]` 2 s | Field usability on low-end hardware; slower drives non-use | NFR/SLO + device matrix |
| `[P-AUTOLOCK]` 5 min | Protects data on a set-down phone without constant re-auth mid-visit | Security architecture + DPIA |
| `[P-PREFETCH]` 48 h | Covers a weekend/round offline without bloating local storage | Sync Design |
| `[P-SYNCWARN]` 4 h | Long enough to avoid noise, short enough to catch a stuck device same-shift | Ops/SRE |
| `[P-REFDEVICE]` | The honest performance floor; everything tested here | NFR/SLO (name the device) |

## Appendix G — Assumptions & dependencies

The spec assumes the following; if any is false, re-scope the affected sections.

1. Carers have a smartphone meeting the device matrix (§10/§35); where not, telephony ECM (§14) and a managed-device option (§10) apply.
2. Connectivity is **intermittent, not permanently absent** — offline-first covers gaps, but sync happens regularly enough for safety alerts and billing.
3. The **platform API and back office exist** and own authoring (rostering, care planning, payroll runs); the app reads/records, it does not author (§43).
4. A **Clinical Safety Officer is appointed** and owns the hazard log/safety case (§40).
5. The integrations in §41 are **contracted and available** in the target environment (GP Connect, dm+d, payroll, mapping, telephony, etc.).
6. Clients, visits, rates, competencies and consent records are **provisioned and maintained centrally**; the app reflects them.
7. The provider operates under a known **nation/regulator** (§44) before content is finalised.
8. Devices are enrolled/managed per the chosen **device strategy** (§10) before go-live.

---

---

# Part B — System-wide controls, lifecycle & assurance (v2.0)

*Added to close the P0 gaps from external review: closed-loop alerts, medication order lifecycle, break-glass access, concrete emergency pathways, onboarding/permissions, platform/release assurance, lawful-basis sharing, Accessible Information Standard, operational workflows, and the v1 scope baseline. Where an item is a governance artefact (DTAC, MHRA SaMD, DCB0160), this spec carries a pointer and an open decision, not the determination.*

## 47. Onboarding, device permissions & recovery

### Purpose
First-run setup, OS permission handling and in-field recovery — currently assumed, now specified with explicit denied/revoked states and safe fallbacks.

### Behaviour
- **First-use guidance:** brief role-aware walkthrough of core flows (check-in, eMAR, recording, SOS); skippable, re-openable from help (§31).
- **Device registration:** device bound to the carer; lost/changed device re-registration; remote-wipe on leaver (§10/§37).
- **OS permission flows** — requested in-context with rationale, each with denied / revoked / "don't ask again" handling and a safe fallback:

| Permission | Used for | If denied/revoked — fallback |
|---|---|---|
| Location + **background location** | ECM check-in, travel | Manual check-in marked unverified (§14); prompt to enable; office flagged |
| Camera | Med verification, wounds, evidence | Manual/photo-skip path; verification falls back to confirm-without-photo where policy allows |
| Microphone | Voice notes (§21) | Text entry only |
| Bluetooth | Vitals/glucose device pairing (§19/§19a) | Manual reading entry |
| Notifications | Alerts, reminders (§33/§48) | Safety-critical work blocked until notifications enabled, a verified SMS/telephone fallback is registered, or the office authorises an alternative (§33 AC-33.5) — never in-app banner alone |
| Biometrics | Login (§10) | PIN/passcode fallback |
| NFC | Tag-based check-in/med verification | Barcode/manual fallback |
| SMS/telephone | SOS, fallback ECM, contacting office (§22) | In-app + show number to dial manually |

### Rules & edge cases
- Denying a permission **never silently disables a safety feature** — the consequence (e.g., unverified visits, no push alerts) is surfaced and reported to the office.
- Lost-device reporting from another device/web; suspends sessions and triggers wipe.

### Acceptance criteria
- **AC-47.1** Each OS permission is requested in-context with rationale and has a defined denied/revoked/"don't ask again" fallback that doesn't silently disable a safety feature.
- **AC-47.2** A revoked critical permission (e.g., notifications, location) warns the carer and notifies the office.
- **AC-47.3** A lost device can be reported and remotely wiped; sessions suspend.

**Priority:** M / v1. **Depends on:** MDM/EMM (§10), notifications (§33), ECM (§14), alerts (§48).

## 48. Alerts, acknowledgment & escalation (common state machine)

### Purpose
A **single alert state machine** reused by missed-visit, eMAR, deterioration, safeguarding, SOS and sync-failure alerts — replacing scattered "alert the office".

### Behaviour & states
**Full state machine (normative — matches the Alert entity, Appendix E):**
`Raised → Delivery attempted → Delivered → Seen → Acknowledged → Action started → Resolved`, with alternative transitions **Escalated**, **Transferred** (owner changes), **Withdrawn / false alarm**, and **Reopened**. ("Delivered" ≠ "Seen" ≠ "Acknowledged" ≠ "Action started" — they are distinct, separately recorded.)

Every alert carries: **severity** (`Information / Warning / High / Critical`), **current owner**, **claimed-by user**, **escalation level**, **resolution code**, **resolution evidence**, **resolver identity**, **reopen history**, and a **maximum escalation period**. Each type configures: recipient(s), acknowledgement deadline `[P-ALERTACK]`, retries/interval `[P-ALERTRETRY]`, escalation levels (assigned carer → on-call → manager → emergency), fallback channel (push → SMS → call), duplicate-suppression key/window, and what the carer sees while waiting.

**Critical alerts never auto-expire unresolved** — `expired` is available only to non-critical alerts; a critical missed-visit/SOS/deterioration/medication alert remains open or escalated until an outcome is recorded.

| Alert | Primary recipient | Escalation path | Fallback |
|---|---|---|---|
| Missed visit (§14) | On-call coordinator | → manager | SMS/call |
| eMAR omission/ceiling (§18) | Office med lead | → clinical lead | SMS |
| Deterioration (§19/§51) | On-call clinical | → 999/111 prompt to carer | call |
| Safeguarding (§23) | Safeguarding lead | → DSL/manager | secure channel |
| SOS / carer harm (§22) | Monitoring/on-call | → emergency services | call/SMS |
| Sync failure (§32) | Carer + office | → IT/support | in-app |

### Rules & edge cases
- An unacknowledged critical alert **re-fires and escalates** per its config; it is **never dropped** because the first recipient was unavailable, and **never auto-expires**.
- The carer who raised an alert sees its **live status** through every sub-state (delivered/seen/acknowledged/action-started/escalated), not a dead end.
- **Ownership & transfer:** an alert has a current owner; it can be claimed and transferred, with the chain audited.
- **Withdrawn/reopened:** a false alarm is explicitly withdrawn (not silently closed); a resolved alert can be reopened, preserving history.
- **Duplicate suppression:** repeated identical alerts are grouped, not spammed, without hiding a genuine new event.

### Acceptance criteria
- **AC-48.1** Every alert type defines severity, recipient/owner, ack deadline, retries, escalation levels, fallback channel, resolution code and max escalation period.
- **AC-48.2** An unacknowledged critical alert re-fires and escalates within `[P-ALERTACK]`/`[P-ALERTRETRY]`; it is never silently dropped and **never auto-expires** while unresolved.
- **AC-48.3** The raising carer sees live alert status across the full sub-state set (delivered/seen/acknowledged/action-started/escalated) until resolved.
- **AC-48.4** Duplicate alerts are suppressed/grouped without hiding a new distinct event.
- **AC-48.5** An alert can be claimed, transferred (audited), withdrawn as a false alarm, and reopened after resolution with history preserved.
- **AC-48.6** Resolution records a resolution code, evidence and resolver identity.

**Priority:** M / v1. **Depends on:** notifications (§33), `[SYNC]`, telephony fallback, §14/§18/§19/§22/§23.

## 49. Medication orders, reconciliation & stock lifecycle

### Purpose
§18 records administration; this adds the **order lifecycle and reconciliation** that safely manage *changes* to medication — a P0 gap. CQC specifically calls out discharge/mid-cycle changes, homely remedies, downtime, CD records, insulin/patch/warfarin charts, covert administration and external administration.

### Order lifecycle
- **Order states & versioning:** `Draft → Pending verification → Active → Suspended → Superseded / Discontinued / Completed / Expired`, with **start/stop dates**, **prescriber/source**, **review date** and **effective time**. A change **creates a new version** that supersedes the prior one (orders are not left in a generic "Changed" state). The carer always administers against the **currently effective, authorised** version only.
- **Authorisation & ownership:** orders are created/verified/authorised, suspended or discontinued by **authorised clinical roles, not the carer** — the carer **views, acknowledges and administers against** the effective version (scope §5). **Unresolved reconciliation blocks administration of the affected medicine** (carer is told to withhold/contact), except via the controlled override (AC-49.9). **High-risk changes** may require two-person verification. **Urgent verbal instructions** are recorded with who gave them and time, are time-limited until formalised, and expire if not confirmed.
- **Variable/tapered doses** and **time-limited courses** (antibiotics) supported.

### Reconciliation & exceptions
- **Hospital discharge changes**, **mid-cycle changes**, **pharmacy corrections** create a reconciliation task; the carer sees "medication changed since last visit" prominently (§19/§15 flag).
- **External/family/nurse administration** recordable as administered-by-other, with **verification fields**: who administered it; role/relationship; who reported it; actual or estimated time; **how it was verified**; whether packaging/stock was checked; **confirmed vs unverified** status; duplication risk flag; evidence/note; and **whether it affects the next-dose interval** (feeds the window/PRN logic, §49 windows).
- **Downtime / paper records:** offline or paper administration is captured and **reconciled when connectivity returns**, preserving actual times (§32).

### Special medication types
- **Covert administration:** only under a recorded **MCA best-interests** authorisation (§16) with pharmacist input and a review date; flagged distinctly; **never the default**, never without authorisation.
- **Warfarin / separate charts:** variable dose by INR; supports a separate chart.
- **Homely remedies / OTC:** provider-authorised list with limits.
- **Blister/MDS packs:** individual medicine identification within the pack.
- **Patches/transdermal:** application + **removal** recording and **site rotation** (§19a).
- **Topical:** exact body site and application thickness/amount.
- **Thickening agents:** recorded as prescribed (IDDSI), with choking-risk link (§19a).
- **Medicines taken away from home** (day services/leave): recordable.
- **Controlled drugs:** the carer app records **administration balance and stock counts**, and **captures** receipt/return/destruction *events as evidence with witness*; the **formal CD register, authorised destruction and returns governance remain back-office** (§18.1). The app feeds the register; it does not own it. (Consistent product boundary — see §18.1.)
- **Expiry & cold-chain:** expiry awareness; cold-chain exception flagging (e.g., insulin storage).
- **National Patient Safety Alerts (NatPSA):** a mechanism to surface a relevant safety alert against affected medicines.
- **Allergy status — five distinct states with behaviour (not just storage):** `No known allergies · Confirmed allergy · Allergy status unknown · Allergy assessment incomplete · Unable to verify`. **Unknown must never appear visually equivalent to "No known allergies."** For Unknown/Incomplete the app: displays a **prominent warning**, **requires acknowledgement**, **raises a follow-up task**, can **block configured high-risk medicines**, may **require office confirmation**, and **allows emergency administration only under a protocol** (§51). A confirmed allergy stores the allergen and reaction.
- **Exception outcomes (mishaps & uncertainty):** explicit handling for dose dropped/spilled, medicine damaged/packaging-compromised/unidentifiable/found-loose, partly-taken, vomited shortly after taking, uncertain-whether-swallowed, suspected-duplicate-dose, wrong-medicine-taken-independently, crush/open-where-authorisation-required, packaging-doesn't-match-order, dispensing-error-unavailable, and **error-discovered-after-the-carer-has-left**. Each resolves: immediate action; whether stock changes (§18.1); whether another dose may be given; clinical-contact requirement; incident requirement (§23); the MAR outcome; and reconciliation requirement (AC-18.16).

### Administration windows & PRN follow-up
- **Administration windows — three independent safety rules, evaluated separately** (a dose can pass one and fail another). Store and check each: `scheduledDueTime`, `earlyWindow`, `lateWindow`, `lastConfirmedDoseTime`, `minimumInterval`, `rolling24HourMaximum`, `rolling24HourTotal`. Classification is `early / on-time / late` against the scheduled window; **independently**, the dose may still violate the **minimum interval** from the last dose or the **rolling 24h maximum**. The app displays the **exact block reason**: `Too early for scheduled dose` · `Minimum interval not met` · `24-hour maximum reached` · `Order not currently effective` · `Cross-carer dose history too stale` (§32). DST/cross-midnight handled via trusted time (§14.4/§45).
- **PRN follow-up:** if effectiveness isn't recorded within `[P-PRNFOLLOWUP]`, prompt — but with a **defined ownership chain** (the administering carer may have left): **administering carer while still on the visit/shift → next attending carer → named lead carer → office/on-call → clinical team for configured high-risk medicines.** A pending follow-up surfaces in **end-of-visit unresolved items, end-of-shift summary, next-carer handover (§55.3), the lead-carer dashboard (§55.2), and the office alert queue (§48).** Where effectiveness **cannot** be assessed because the person was no longer being observed, that is itself a recordable outcome (not left blank).

### Acceptance criteria
- **AC-49.1** A medicine has a versioned order (Draft→Pending verification→Active→Suspended→Superseded/Discontinued/Completed/Expired) with start/stop, prescriber/source, review date and version history; a change creates a new version and the carer administers only against the currently effective authorised version.
- **AC-49.1a** Orders are created/verified/authorised/suspended/discontinued by authorised clinical roles, not the carer; the carer views, acknowledges and administers. Unresolved reconciliation blocks administration of the affected medicine (except controlled override AC-49.9); high-risk changes may require two-person verification.
- **AC-49.1b** A reconciliation has states (Pending → Under review → Clarification requested → Confirmed/Rejected → Resolved) and records previous order, proposed order, source, discrepancy, who was contacted, advice, clinical verifier, effective time and whether administrations occurred while unresolved; the carer is clearly told whether to continue the previous order, follow the new one, withhold pending clarification, or contact on-call.
- **AC-49.2** A medication change since the last visit is surfaced prominently and creates a reconciliation task.
- **AC-49.3** External administration (nurse/relative/other) records who administered, role, who reported, time, how verified, packaging/stock checked, confirmed-vs-unverified, duplication risk, and whether it affects the next-dose interval.
- **AC-49.4** Covert administration is available only under a recorded MCA best-interests authorisation with a review date and is flagged distinctly.
- **AC-49.5** Special medication types are each recordable (atomic sub-criteria):
  - **AC-49.5a** Patch application and **removal** with **site rotation** are recorded.
  - **AC-49.5b** Topical medication records **exact body site** and amount/thickness.
  - **AC-49.5c** A blister/MDS pack records **individual medicine identification** within the pack.
  - **AC-49.5d** A thickening agent is recorded as prescribed (IDDSI), linked to choking risk (§19a).
- **AC-49.6** Administration is classified early/on-time/late and blocked if too-soon per parameters; a NatPSA can be surfaced against affected medicines.
- **AC-49.7** Allergy status is one of five distinct states; Unknown/Incomplete is visually distinct from "No known allergies", warns, requires acknowledgement, raises a follow-up, and can block configured high-risk medicines (emergency administration only under protocol).
- **AC-49.8** Paper/downtime administrations reconcile on reconnect with actual times preserved.
- **AC-49.9** When cached MAR data is stale beyond `[P-STALEMAR]`, a controlled stale-data override governs administration (atomic sub-criteria):
  - **AC-49.9a** The stale state and last-sync time are shown prominently.
  - **AC-49.9b** Routine administration is gated (not silently allowed) while stale.
  - **AC-49.9c** Override is available only for configured circumstances/eligibility.
  - **AC-49.9d** Override requires a recorded reason.
  - **AC-49.9e** Override requires confirmation the carer checked the authoritative paper/source.
  - **AC-49.9f** Using the override alerts the office.
  - **AC-49.9g** All administrations under override are recorded for later reconciliation (creating a reconciliation task).
  - **AC-49.9h** The override is blocked for high-risk categories where policy prohibits it.
  - **AC-49.9i** Where configured, the override requires senior authorisation.
- **AC-49.10** If an offline carer administers against an order later found stopped/changed, the conflict is surfaced on sync as a reconciliation event (never silently accepted); the **stop/most-recent authorised version wins** for future doses, and the already-given dose is flagged for clinical review.

**Priority:** M / v1 (special types & NatPSA: S / v1; covert & warfarin: S / v1 decision-gated §44). **Depends on:** prescribing/pharmacy integration, dm+d, MCA (§16), `[SYNC]`, §18/§19a. **Standards:** NICE NG67/SC1/NG46/NG5; CQC medicines; NatPSA.

## 50. Access grants, break-glass & sensitive-data reveal

### Purpose
Access today is mostly "assigned to the client". Real operations need **emergency and temporary access** and **masked sensitive data** — a P0 gap.

### Behaviour
- **Break-glass (emergency) access — three cases:**
  - **Online:** full time-boxed break-glass after reason + audit, person's record retrieved (`[P-BREAKGLASS]`).
  - **Offline, person cached:** time-boxed access to the cached data within the emergency grant and lease.
  - **Offline, person not cached:** only a **minimal emergency profile** if previously provisioned — name & photo, critical allergies, critical risks, ReSPECT/DNACPR status, emergency contacts, essential communication needs. If **no emergency profile exists, the app says so clearly and presents emergency/contact guidance — never an empty record.**
  - **Secure search:** break-glass search must **not let a carer enumerate the provider's full client list** (offline or online) — it returns only minimal matching identifiers until a reason is entered and access granted.
- **Temporary cover / delegated access:** time-boxed access for shift cover, with expiry and revocation.
- **Offline access lease (resolves the offline-vs-revocation conflict):** revocation is immediate *online*, but a device offline cannot be reached in real time. So cached access is governed by a **lease**: cached care data is usable offline only for `[P-OFFLINEAUTH]` and a cached access grant only for `[P-ACCESSGRANTCACHE]`, after which the app **re-validates with the server before continuing** (degrading to read-only / locked if it can't). Local encryption keys expire with the lease; a **device-clock change doesn't extend it** (trusted time, §36). On reconnect after a revocation/leaver/suspension, the app **honours the revocation immediately and wipes** — wipe is therefore **`pending` (issued) → `confirmed` (applied on next contact)**, not instantaneous while offline. A **suspended/leaver account cannot start new work from cached data** once the lease lapses; **break-glass may extend the lease only for its emergency window**, audited.
- **Active-visit lease expiry (essential-care safety):** if the lease lapses **during an active visit**, the app does **not** lock immediately (that could block essential care recording). Instead: a **short, fixed grace period** permits completion of **that visit and that person only**; access is **restricted to the current visit** (unrelated historical records hidden); **write capture is allowed**; **local PIN/biometric reauthentication** is required; **starting another visit is prevented**; lease expiry is shown **prominently**; the app **attempts immediate revalidation** and **alerts the office** if the device stays offline. Unlimited continuation is not permitted (it would weaken revocation).
- **Access expiry/revocation:** all grants have an end; online revocation is immediate; offline, the lease above bounds exposure.
- **Key-safe / access codes:** **masked by default**, **tap-to-reveal** with each reveal audited, **limited visibility before the visit window**, **clipboard prevention**, **auto-remask** after `[P-KEYSAFEREVEAL]`, **changed-code notification**, and a **wrong-code/access-failure workflow** (→ §14.3 access failure).

### Acceptance criteria
- **AC-50.1** Break-glass access requires a recorded reason, is time-boxed (`[P-BREAKGLASS]`), audited and notified, and auto-expires.
- **AC-50.1a** Offline break-glass with the person cached grants time-boxed access to cached data; without cache, only a provisioned minimal emergency profile is shown, and if none exists the app shows clear emergency/contact guidance, never an empty record.
- **AC-50.1b** Break-glass search does not let a carer enumerate the full client list; it returns minimal identifiers only until a reason is entered and access granted.
- **AC-50.2** Online, temporary/delegated access revocation is immediate; offline, access is bounded by the lease (`[P-OFFLINEAUTH]`/`[P-ACCESSGRANTCACHE]`) and re-validates on expiry.
- **AC-50.2a** After the offline lease lapses, the app re-validates before continuing and degrades to read-only/locked if it cannot; a clock change does not extend the lease.
- **AC-50.2b** On reconnect after revocation/suspension/leaver, the app applies the revocation and wipe immediately (wipe state `pending → confirmed`); a lapsed-lease suspended account cannot start new work from cached data.
- **AC-50.2c** If the lease lapses mid-visit, a short fixed grace period allows completion of the current visit/person only (others hidden, no new visit, reauth required, expiry shown, revalidation attempted, office alerted) — neither immediate lock nor unlimited continuation.
- **AC-50.3** Key-safe codes are masked, revealed only on audited tap-to-reveal within the visit window, are not copyable, and auto-remask after `[P-KEYSAFEREVEAL]`.
- **AC-50.4** A changed key-safe code notifies assigned carers; a wrong-code failure routes to the access-failure workflow (§14.3).

**Priority:** M / v1. **Depends on:** access-control (§10), audit (§36), notifications (§48), §14.3.

## 51. Emergency & deterioration protocols (closed-loop)

### Purpose
Replace generic "escalate" with **concrete, configurable, closed-loop protocols** per condition/threshold — a P0 gap.

### Behaviour
A protocol triggered by a threshold (§19/§19a) or event walks the carer through, and **records each step to closure**:
1. **Immediate action** (e.g., call **999/111**, start first aid, position).
2. **Who to contact** — GP / district nurse / on-call manager / emergency services — with one-tap contact (§48 fallback).
3. **Record advice received** (e.g., 111 disposition).
4. **Repeat observations** at stated intervals.
5. **Acknowledgement** that actions were taken and by whom.
6. **Closure** — outcome recorded; alert resolved (§48).

Configurable protocol library covers common scenarios: suspected sepsis (NEWS2 trigger), hypoglycaemia, choking, fall with/without injury, suspected stroke (FAST), chest pain, seizure (status), unresponsive (→ §55 death workflow if applicable), severe bleeding, anaphylaxis.

### Acceptance criteria
- **AC-51.1** A threshold breach launches the configured protocol, not a generic escalate, and guides through immediate action, contacts, advice capture, repeat obs, acknowledgement and closure.
- **AC-51.2** Each protocol step is recorded; the protocol cannot be silently abandoned — an incomplete protocol stays open and escalates (§48).
- **AC-51.3** Protocols are configurable per provider and per person where the care plan specifies.
- **AC-51.4** Only an **approved, currently-effective** protocol version may launch; its **version is shown to the carer** and **pinned at event start** so a mid-event change does not alter the running execution.
- **AC-51.5** A **person-specific protocol overrides the provider default** where the care plan specifies one.
- **AC-51.6** An **urgent withdrawal/recall** of a protocol takes effect for new launches; an in-flight execution continues on its pinned version with a notice to review.
- **AC-51.7** **Expired/too-stale protocol behaviour** (`[P-PROTOCOLSTALE]`): the app still presents a **safe generic emergency route** (e.g., call 999/111) — never a blank or blocked emergency screen.
- **AC-51.8** **Deviation** from a protocol step is recordable with a reason; a **contact failure** (listed number unavailable) routes to the defined alternative/escalation (§48).
- **AC-51.9** An **incomplete protocol execution** is flagged for clinical review.
- **AC-51.10** The decision-support **intended-purpose / MHRA SaMD boundary** remains an explicit governed configuration decision (§43/§52), recorded and version-controlled — not an implicit behaviour.

**Priority:** M / v1. **Depends on:** observations (§19/§19a), alerts (§48), care plan (§16), incidents (§23). **Standards:** NICE condition guidance; CQC Safe; resuscitation / first-aid guidance via provider policy.

## 52. Supported platforms, release operations & assurance

### Purpose
Name the platform/release/operational-readiness commitments — a P0 gap; resolves `[P-REFDEVICE]`.

### Behaviour & commitments
- **Supported OS:** Android and iOS — last N major versions (to be fixed in the platform-support policy; resolve `[P-REFDEVICE]` to named reference devices, min RAM/storage, camera/GPS capability).
- **Rooted/jailbroken devices:** detected; policy response (block or restricted mode) per §10.
- **Forced update / minimum version:** below minimum, the app blocks with an update prompt (§10 AC-10.7); **feature flags** and **staged rollout**; **rollback** process for a bad release.
- **End-of-support process** for retired OS/devices, with notice.
- **NFR/SLO targets** (hard numbers ratified in the NFR/SLO doc): availability, API latency, **crash-free sessions**, **sync-success rate**, battery use per shift, data consumption, recovery/restore, **backup & disaster recovery**, monitoring/alerting, **security testing** (pen-test cadence), support-response SLAs.

### Governance pointers (not determinations — see §44 open decisions)
- **DTAC:** DTAC Form 2.0 (NHS England, Feb 2026) readiness workstream — evidence owner, assessment version, required artefacts, open non-conformities, sign-off status. *Pointer; owned by the DTAC workstream.*
- **DCB0160 handover:** define the evidence handed to each deploying provider for **their** DCB0160 (clinical risk management of deployment), distinct from the manufacturer's **DCB0129**. *Pointer.*
- **MHRA Software as a Medical Device:** **open decision** — formally determine and document whether the scoring/thresholding/decision-support functionality qualifies as SaMD, rather than assuming it doesn't. *Decision, not assumed.*

### Acceptance criteria
- **AC-52.1** Supported platforms are defined (atomic sub-criteria):
  - **AC-52.1a** Supported Android/iOS versions and `[P-REFDEVICE]` reference devices (incl. min RAM/storage) are named.
  - **AC-52.1b** Rooted/jailbroken-device behaviour is defined.
  - **AC-52.1c** Forced-update/minimum-version blocking is defined (with §10 AC-10.7).
  - **AC-52.1d** Feature-flag, staged-rollout and rollback processes are defined.
  - **AC-52.1e** An end-of-support process for retired OS/devices is defined.
- **AC-52.2** NFR/SLO targets exist (atomic sub-criteria), each with a ratified value:
  - **AC-52.2a** Availability and API p95/p99 latency.
  - **AC-52.2b** Crash-free-session and sync-success rates.
  - **AC-52.2c** Battery consumption per 8h and 12h shift; mobile-data consumption.
  - **AC-52.2d** RTO/RPO (backup & disaster recovery).
  - **AC-52.2e** Monitoring/alerting and security-testing (pen-test) cadence.
  - **AC-52.2f** Critical-alert acknowledgement SLO and support-response SLAs.
- **AC-52.3** DTAC, DCB0160-handover and MHRA-SaMD items are tracked with an owner and status (the SaMD qualification as an open decision §44).

**Priority:** M / v1. **Depends on:** platform/release engineering, clinical-safety (DCB0129/0160), DTAC, security.

## 53. Lawful-basis information sharing & emergency share

### Purpose
"Consent-governed" is not the universal gate. Per ICO/UK GDPR, sharing may rest on other lawful bases, and **data protection must not block proportionate emergency sharing to protect life**.

### Behaviour
- **The carer selects a practical purpose, not a legal basis.** The carer picks a plain-language **sharing purpose** — e.g., medical emergency, safeguarding concern, planned professional handover, family/representative request, hospital transfer, legal/regulatory request. The **system maps that purpose, via approved policy, to a separate Article 6 lawful basis AND (for health/special-category data) a distinct Article 9 condition, plus a confidentiality justification, decision authority, permitted recipient and minimum-necessary information.** Frontline carers are never asked to make a legal determination under pressure.
- **The share record stores these as distinct fields (correcting an earlier conflation):** `sharingPurpose · article6Basis · article9Condition · confidentialityJustification · decisionAuthority · recipient · minimumNecessaryData`. Crucially, **safeguarding, best interests and authorised-representative are NOT Article 6 lawful bases** — they are a *purpose*, a *decision context*, and a *decision authority* respectively. Per ICO, processing special-category (health) data requires **both** an Article 6 basis (e.g., vital interests, legal obligation, public task, consent) **and** a separate Article 9 condition (e.g., Art 9(2)(c) vital interests, 9(2)(h) health/social care, 9(2)(b) safeguarding under the relevant condition). Each is stored independently; the carer types none of it.
- **Audited emergency-share flow** capturing all the fields above plus carer identity, time, and follow-up required.
- In a genuine emergency the app **must not prevent** a proportionate share merely because explicit consent can't be obtained (it records the vital-interests Article 6 basis and the matching Article 9 condition instead).

### Acceptance criteria
- **AC-53.1** The carer selects a plain-language sharing purpose; the system maps it via policy to a **separate Article 6 basis and Article 9 condition** (plus confidentiality justification and decision authority) and records each as a distinct field on the share. Emergency sharing can proceed (Art 6 vital interests + matching Art 9 condition) with full audit; the carer is not asked to choose a legal basis.
- **AC-53.2** The share record stores sharingPurpose, article6Basis, article9Condition, confidentialityJustification, decisionAuthority, recipient and minimumNecessaryData as distinct fields; safeguarding/best-interests/authorised-representative are never stored as an Article 6 basis.

**Priority:** M / v1. **Depends on:** consent/MCA (§16), documents/share (§29a), audit (§36). **Standards:** UK GDPR; ICO guidance on vital interests/emergency sharing.

## 54. Accessible Information Standard (the person's communication needs)

### Purpose
WCAG (§34) covers the **carer's** interface; AIS covers the **person's** communication and information needs, which the service must identify, record, flag, share, meet and review.

### Behaviour
Per person, structured fields: preferred communication format, **BSL/interpreter** requirement, hearing/visual impairment, **Easy Read**, large print, communication aid, preferred contact method, **review date**, and **whether the need was met during the visit**.

### Acceptance criteria
- **AC-54.1** A person's communication/information needs are recorded as structured fields and flagged to the carer before/at the visit.
- **AC-54.2** The carer can record whether the communication need was met during the visit; the need has a review date.

**Priority:** M / v1. **Depends on:** care plan (§16), person profile (§15). **Standards:** Accessible Information Standard (DAPB1605).

## 55. Operational workflows

### 55.1 Spot-check & competency assessment
Full workflow: **who initiates**, scheduled vs **unannounced**, observation checklist, evidence/comments, **carer acknowledgement**, remedial action, **appeal/disagreement**, assessor eligibility, final sign-off and expiry, **offline completion**.
- **AC-55.1** A spot check/competency assessment runs end-to-end (atomic sub-criteria):
  - **AC-55.1a** A check can be initiated (scheduled or unannounced) by an eligible assessor.
  - **AC-55.1b** The observation checklist and evidence/comments are captured.
  - **AC-55.1c** The carer can acknowledge the outcome and raise a disagreement/appeal.
  - **AC-55.1d** A final sign-off records the result with an expiry; remedial action can be set.
  - **AC-55.1e** The whole flow is completable offline and syncs without loss.

### 55.2 Lead-carer actionable responsibilities (extends §15)
The named lead's ownership view surfaces: upcoming **client reviews**, outstanding **concerns**, **care-plan change requests**, **repeated medication omissions**, unresolved **family feedback**, monitoring **trends**, **handover to a replacement lead**, and **leave-cover** arrangements.
- **AC-55.2** The lead carer sees actionable items for their clients (reviews due, open concerns, change requests, repeated med omissions, feedback, trends) and can hand over/arrange cover.

### 55.3 Handover acknowledgement
The next carer must **acknowledge critical handover info**, **confirm reviewed before care**, can **raise a clarification**, **escalate an unresolved instruction**, and the UI **distinguishes permanent care-plan info from temporary handover notes**.
- **AC-55.3** Critical handover information requires acknowledgement before care; temporary notes are visually distinct from permanent care-plan content.

### 55.4 Unexpected / expected death (field workflow)
Distinct, sensitive workflow: person found unresponsive, **expected vs unexpected**, **DNACPR/ReSPECT display**, emergency-call instructions, **do-not-move guidance** where applicable, contacts log (who/when), **police/coroner** considerations, **sensitive suspension of remaining visits**, privacy-preserving notifications.
- **AC-55.4** A death/found-unresponsive workflow (atomic sub-criteria):
  - **AC-55.4a** DNACPR/ReSPECT status is surfaced prominently at the point of the event.
  - **AC-55.4b** The workflow guides emergency-call and do-not-move steps as configured (expected vs unexpected).
  - **AC-55.4c** Contacts (who/when) are logged, including police/coroner where applicable.
  - **AC-55.4d** The person's remaining visits are sensitively suspended.
  - **AC-55.4e** Notifications about the death are privacy-preserving.

### 55.5 Carer absence & fitness to work
Report sickness, report **inability to attend a shift**, emergency **shift relinquishment**, **fit-to-work declaration** where configured, **exposure/infection** reporting, **occupational-injury** follow-up, **replacement-cover status**.
- **AC-55.5** A carer can report sickness/absence and relinquish a shift; the office sees replacement-cover status; configurable fit-to-work and exposure/injury reporting are supported.

### 55.6 Forms & drafts (standard behaviour)
**Auto-save**, **resume after closure**, explicit **submit vs save**, **discard confirmation**, **duplicate-submission prevention**, field-level **validation**, **server-rejection** correction, **draft ownership on shared devices**, **draft expiry**.
- **AC-55.6** Long forms behave safely as drafts (atomic sub-criteria):
  - **AC-55.6a** A form auto-saves as a draft without explicit action.
  - **AC-55.6b** A draft resumes after app closure/relaunch with no lost input.
  - **AC-55.6c** Save and Submit are distinct actions with distinct outcomes.
  - **AC-55.6d** Duplicate submission of the same form is prevented.
  - **AC-55.6e** Field-level validation blocks submission of invalid data with clear errors.
  - **AC-55.6f** A server rejection preserves the entry for correction; no data loss.
  - **AC-55.6g** On a shared device, a draft is scoped to its owning carer and not visible to the next user.
  - **AC-55.6h** A draft expires per policy and is handled cleanly (not left indefinitely).

### 55.7 Visit-completion controls
Configurable **completion checklist**: mandatory tasks, MAR outcomes, required observations, notes, incidents, **incomplete-care reasons**, and the **leaving-safe checklist** (call bell/essentials in reach, doors locked, appliances safe — §14); define when **checkout is blocked vs allowed with an exception**. The final **visit outcome is derived** from these records (any incomplete planned item → Partial, not Complete; §14 AC-14.32), never set freely by the carer over the top of contradicting records.
- **AC-55.7** Checkout enforces the configured completion checklist; an incomplete item either blocks checkout or requires a recorded exception reason — never a silent gap.

### 55.8 Configuration governance
Thresholds, protocols, competencies and code sets have an **owner, approver, effective date, version, scope, audit history and rollback**; **clinical configuration must not change silently mid-visit**.
- **AC-55.8** A change to clinical configuration is versioned, owned/approved with an effective date, audited and rollback-able, and does not take effect silently during an in-progress visit.

**Priority:** M / v1 (death workflow & spot-check: M; others M/S as marked). **Depends on:** §15/§16/§18/§19/§23/§24/§28; config service; `[SYNC]`.

## 56. v1 scope baseline (recommended — to be ratified)

A definitive inclusion table is required for design/costing. **This is my recommended split for you to overrule** — the final decision is yours and your clinical/commercial leads'. "v1" = first release; "Later" = subsequent.

| Capability | Rec. | Note |
|---|---|---|
| Auth/device security (§10), Today (§11), schedule/clocking (§12), travel (§13) | **v1** | Core |
| Visit lifecycle + ECM (§14), visit types (§14.1) | **v1** | Core; anti-fraud ECM is a differentiator |
| Operational disruptions (§14.3), double-up (§14.5) | **v1** | Core ops |
| Night shifts (§14.4) | **v1** | If you offer nights |
| Supported-living (§14.2) | Later | If/when that service line |
| People (§15), lead carer (§15) | **v1** | Lead-carer actions (§55.2) v1 |
| Care planning/consent/MCA (§16) | **v1** | Core |
| Reablement (§16a) | Later | Decision-gated |
| Tasks + personal-care taxonomy (§17/§17.1) | **v1** | Core |
| eMAR (§18) + CD support (§18.1) | **v1** | Core |
| Medication order lifecycle & reconciliation (§49) | **v1** | Core safety — orders + discharge/mid-cycle |
| Special med types (§49: covert, warfarin, patches, blister, thickeners) | **v1 core / Later edge** | Covert & warfarin decision-gated |
| Observations + deterioration (§19) | **v1** | Core |
| Condition-specific records (§19a) | **v1 standard / Later complex** | Glucose/catheter/stoma/bowel/fluid v1; PEG/trach/vent Later, competency-gated |
| End-of-life (§19b) | **v1** if you offer EOL, else Later | |
| Equipment/LOLER (§20), notes/media (§21) | **v1** | |
| Lone-worker/SOS (§22) | **v1** | Core safety |
| Incidents/safeguarding + taxonomies (§23/§23.1–3) | **v1** | Core |
| Comms/handover + acknowledgement (§24/§55.3) | **v1** | |
| Feedback (§25), client money (§26) | **v1 / S** | Money S |
| Earnings/pay (§27) | **v1** | |
| Learning/competency + expiry consequences (§28) | **v1** | |
| Account/docs/compliance (§29), documents access (§29a), reports (§29b) | **v1** | |
| Search (§30), help (§31) | **v1 / S** | |
| Offline/sync (§32), notifications (§33), accessibility (§34) | **v1** | Core |
| Onboarding/permissions (§47), alert state machine (§48) | **v1** | Core |
| Break-glass/key-safe (§50) | **v1** | Core |
| Emergency protocols (§51) | **v1** | Core safety |
| Platform/release/assurance (§52) | **v1** | Core readiness |
| Lawful-basis sharing (§53), AIS (§54) | **v1** | Compliance |
| Operational workflows (§55) | **v1** | Death, drafts, completion controls, config governance all v1 |

**AC-56.1** A single ratified v1 inclusion table exists and governs design/costing; every capability is marked in or out of v1 with no ambiguous "decision-gated" left unresolved at baseline.

## 57. Standards register (version-controlled)

Standards must be version-controlled, not referenced loosely. Maintained as a living register: **document name · version/date · applicability · owner · last reviewed.** Initial entries:

| Standard | Version/date | Applies to | Owner |
|---|---|---|---|
| CQC Single Assessment Framework | current | Whole product (evidence) | Clinical/Quality |
| DTAC | Form 2.0, Feb 2026 | Assurance (§52) | Regulatory |
| DCB0129 / DCB0160 | current | Clinical risk (mfr/deploy) | Clinical Safety Officer |
| DSPT | current annual | IG/security | IG |
| NICE NG67 / SC1 / NG46 / NG5 | current | Medication (§18/§49) | Clinical |
| NICE NG142 | current | EOL (§19b) | Clinical |
| MCA 2005 + Code | current | Consent (§16) | Clinical/IG |
| UK GDPR / DPA 2018 / ICO | current | Data/sharing (§53) | IG/DPO |
| Accessible Information Standard (DAPB1605) | identify/record/flag/share/meet/review | §54 | Clinical/Quality |
| WCAG | 2.2 AA | UI accessibility (§34) | Product/Eng |
| RIDDOR | current | Incidents (§23) | H&S |
| MODS (DAPB4102 Amd 66/2023, v1.0.0) | conformance 31 Aug 2025; supplier-compliance 1 Jul 2026 | Interop | Product/Integration |

**AC-57.1** A version-controlled standards register exists with version/date, applicability, owner and last-reviewed for every standard the product claims.

## 58. Requirement ownership

Each section/capability carries named owners across **Product, Clinical, Information Governance, Security, Engineering, QA** (RACI). Maintained alongside the spec (e.g., a traceability sheet), so every requirement has an accountable owner for build, sign-off and assurance.

**AC-58.1** Every section/capability has assigned Product/Clinical/IG/Security/Engineering/QA ownership recorded in the traceability artefact.

---

## Change history (updated)
- **v3.4** — Eleven-item review batch (#31–#41): completeness + the QA/NFR boundary made explicit. **Core domain model (§6) refreshed** so engineers reading only §6 don't build the old concepts — added VisitOutcome, Welfare/SafetyChecklist, TaskActionEvent, MedicationOrder/Version, Reconciliation/StockEvent, Alert/Ack/Assignment, AccessGrant/Lease/BreakGlass, EmergencyProtocol/Execution, InformationShareEvent, Handover, ConfigurationVersion, ConsumableSupply; fixed MARentry to the supportAction×doseOutcome split (#35). **Hazard register extended H25–H38** (critical-alert-no-owner, push-suppressed, lease-expiry, break-glass-unavailable, stale/withdrawn protocol, contact-fails, note-overwritten, support/dose-single-code, unknown-allergy, paper/electronic-duplicate, handover-as-instruction, invalid-vital, protocol-mid-emergency, wrong-backfill) (#37). **Integration register expanded** (pharmacy/prescribing orders+reconciliation, NatPSA, SMS, secure-doc, malware-scan, observability, MODS interop, emergency-monitoring, translation) with **FCM/APNs direction corrected** (server-out + token-in) and a **mandatory per-connector degraded-mode** requirement (AC-41.1) (#36). **Handover-not-a-shadow-care-plan rule** + handover-note fields + **cross-shift unresolved-safety handover** with ownership acknowledgement (§24 AC-24.5/24.6) (#31/#32). **Whistleblowing confidentiality model** (anonymous/named, manager-excluded, senior-subject external route, identity-safe progress; §23.6 AC-23.16/23.17) (#33). **Exposure/needlestick incident fields** (§23.5 AC-23.15) (#34). **Split AC-49.9** into atomic AC-49.9a–i (#39). **State/concurrency test register (§42.1)** and **NFR-values-pending scaffold (§42.2)** added — explicitly owned by Test Strategy / NFR doc, not invented here (#40/#41); #38 (no duplicate AC IDs) confirmed. New entities (HandoverNote, WhistleblowingReport) + Incident.exposure.
- **v3.3** — Twelve-item batch (#19–#30): lawful-basis correction, protocol governance, wrong-person normative, concurrency decided, notification/SOS, observation validation, MCA, print/export.
- **v3.2** — Consistency pass (notes append-only, full alert state machine into §48, lease-expiry, break-glass profile, 9 params bound).
- **v3.1** — Targeted medication/offline corrections (MAR-vs-closure separation, PRN owner, allergy states, external-admin fields, CD witness, client-money AC).
- **v3.0** — Model-consistency pass (five-dimension propagation + medication-model split).
- **v2.9** — Six more visit scenarios; safeguarding disclosure handling, specialised incident fields, consumable supplies.
- **v2.8** — Offline-capability matrix for §§47–55.
- **v2.7** — Domain model (Appendix E → ~30 entities) + atomic ACs.
- **v2.6** — Third-review safety corrections (five-dimension outcome model, support-outcome derivation, offline cross-carer freshness gate, critical-incident sync bypass, clinical boundary, standards fixes).
- **v2.5** — Six more visit scenarios; shopping/repositioning/IPC gaps closed.
- **v2.4** — Partial-delivery outcome derivation (visit resolves Partial when any planned item incomplete).
- **v2.3** — Appendix H edge-case & scenario register; outcome picker; welfare-before-submit.
- **v2.2** — **Safety-critical corrections** from second external review. Resolved four contradictions: (1) **offline-vs-immediate-revocation** → offline access lease `[P-OFFLINEAUTH]`/`[P-ACCESSGRANTCACHE]`, key expiry, wipe pending→confirmed (§50, §10 AC-10.3); (2) **stale-MAR hard-block vs essential medication** → controlled stale-data override + stopped/changed-order conflict rule (§49 AC-49.9/49.10); (3) **last-write-wins vs concurrent double-up** → attributed event-based task merge, contradictions reviewed not overwritten (§14.5 AC-14.29, §32 matrix); (4) **vague order "Changed" state** → versioned orders `Draft→Pending verification→Active→Suspended→Superseded/Discontinued/Completed/Expired` + clinical authorisation/reconciliation-state ownership, unresolved reconciliation blocks affected administration (§49 AC-49.1/49.1a/49.1b). Fixed the **CD scope contradiction** between §18.1 and §49 to one boundary. Reworked **§53** so carers pick a plain-language purpose and the system maps to lawful basis. Added hazards H18–H21; params `[P-OFFLINEAUTH]`, `[P-ACCESSGRANTCACHE]`, `[P-BREAKGLASS]`, `[P-KEYSAFEREVEAL]`, `[P-PROTOCOLSTALE]`; CD-witness-eligibility open decision (§44.9).
- **v2.1** — Validated against three real visit scenarios (morning personal care, lunch/welfare-dementia, evening/bedtime). Added **on-entry welfare confirmation** (person seen and safe; not-as-expected routes to emergency §51 / death workflow §55.4; AC-14.27) and a configurable per-person **end-of-visit leaving-safe checklist** (call bell/essentials in reach, doors locked, appliances/cooker off; blocks checkout or records exception; AC-14.28), cross-linked to visit-completion controls (§55.7). All other tasks across the three visits already mapped to existing sections.
- **v2.0** — **Part B added** to close external-review P0 gaps. New sections: §47 onboarding/device-permissions/recovery, §48 common alert/acknowledgement/escalation state machine, §49 medication order lifecycle + reconciliation + special types (covert/warfarin/homely remedies/patches/blister/thickeners/downtime/NatPSA) + admin windows + PRN follow-up, §50 break-glass/temporary access + key-safe masking, §51 closed-loop emergency/deterioration protocols, §52 supported platforms/release ops/assurance (resolves [P-REFDEVICE]; DTAC/DCB0160 pointers; MHRA SaMD as open decision), §53 lawful-basis sharing + audited emergency share, §54 Accessible Information Standard, §55 operational workflows (spot-check, lead-carer actions, handover acknowledgement, death workflow, carer absence/fitness, form drafts, visit-completion controls, configuration governance), §56 recommended v1 scope baseline, §57 version-controlled standards register, §58 requirement ownership. **Doc-quality:** status/version aligned; single authoritative change history; corrected cross-refs (decision-gated→§44, DST→§45, access-hierarchy→§10); removed corrupted characters. **Parameters:** added 14 tokens (staleness, offline-max, med windows, alert ack/retry, training-due, cache, media, quiet-hours, lone-worker, fatigue, PRN follow-up).
- **v1.11** — Added **§18.1 controlled-drugs governance support** (authenticated witnessing, balance/reconciliation aid, discrepancy routing) with an explicit **back-office boundary** (storage/register/destruction/named accountable person are the provider's CD policy, not the app); **§29b reports available to the carer** (daily log, visit history, hours/earnings, CPD, compliance status, person summary — view/export within scope; management analytics excluded); **training/competency & document expiry consequences** (lapsed item blocks gated work and rostering + non-compliant flag; §28 AC-28.7, §29 AC-29.5); **carer-initiated upskilling** (request training/express interest; AC-28.8) and **self-document upload/refresh** (AC-29.4).
- **v1.10** — §14.5 double-up working; named lead carer (§15); CD tightening.
- **v1.9** — §14.4 Night shifts (waking & sleep-in).
- **v1.8** — §29a Documents access; §19 observation baselines/trends/monitoring schedule.
- **v1.7** — Enumerated taxonomies (§23.1 concerns, §23.2 incidents + harm level, §23.3 assessments) and eMAR partial-round/repeated-refusal rules.
- **v1.6** — Specialised-care depth (§19a/§19b/§16a/§14.3).
- **v1.5** — Structured personal-care taxonomy (§17.1).
- **v1.4** — Point-of-care medication & task depth (NICE NG67/SC1/NG46 + CQC).
- **v1.3** — Food/fluid targets + running totals + low-intake alert (§19); configurable administration code set (§18).
- **v1.2** — Comprehensiveness pass.
- **v1.1** — Precision pass. Added authoritative appendices: A visit state-transition table, B notifications matrix, C offline-capability matrix, D detailed accessibility criteria (+AC-34.2–34.5), E key-entity data dictionary, F parameter rationale, G assumptions & dependencies. No scope change.
- **v1.0** — Consolidated rebuild (see prior entry).
