# Carer Mobile App — Complete Information Architecture & Screen Catalog

## Context

The Carer App v2 (`src/screens/carer.js`) is a working point-of-care prototype — clock in/out,
tasks, eMAR, observations, incidents, notes — but it is **one flat visit screen behind a rota list**.
It lacks the hierarchy, navigation model, foundational screens and end-to-end journeys of a real
enterprise carer app (Birdie / Nourish / PASS Mobile / CarePlanner). There is no auth, no app-level
navigation, no client profiles, no care-plan viewer, no inbox, no schedule/history, no profile/settings,
no consistent loading/empty/error/offline states, and the carer's data never reaches the office.

This document is the **first step the user asked for**: an exhaustive catalog of *every* screen, its
connections, the user journeys, what each screen contains, what's missing, the ideal baseline, and
variants — so we can then rebuild the carer app IA screen by screen. **Scope:** the Carer mobile app as
a complete product (whole-product depth, single surface = Carer). Office screens are out of scope except
where the carer app must hand data off to them (§9).

Build-first decision (confirmed): **rebuild the carer app IA & journeys** before other work.

---

## 1. Current state & the core problems

What exists (from inventory of `carer.js`, `data/carer.js`, `carerStore.js`):
- `renderCarer()` → rota list of 8 visits across 3 clients; offline banner; reset.
- `renderCarerVisit()` → one visit; Alpine `carerApp`; 5 in-visit tabs (Tasks · MAR · Obs · Incident · Notes) + 7 sheets (task, med, obsForm, incident, summary, context, message); clock in/out with gating; persisted to `localStorage` (`caretask.carer.v3`).
- Rich catalogs: 20 observation types w/ auto-flagging, full MAR (CD witness, covert, allergy, PRN), 12 incident types, body map.

Core problems to fix:
1. **No app-level shell / hierarchy.** Everything lives at visit level. No hub, no persistent nav, no "where am I in the app" model. Rendered inside the *office* sidebar in a phone frame.
2. **Missing whole categories of screens:** auth/onboarding, schedule/calendar, client directory & profiles, care-plan & risk viewers, medication history, observation trends, photo gallery, daily timeline, inbox/messaging, notifications, profile/settings, timesheet, training/compliance, lone-worker/safety, help.
3. **No universal states.** No loading skeletons, empty states, error/retry, offline-first UX beyond a queued counter, permission/role variants, or accessibility baseline.
4. **Journeys are truncated.** No pre-visit brief, travel/arrival, running-late/missed-visit, decline offered visit, edit-after-save, visit-completed review, first-run consent.
5. **Isolated from office.** Observations, incidents, refusals, eMAR outcomes, messages and handover notes never surface in `exceptions.js` / `planner.js` / `audit.js` (`ALERTS` is static mock). The feedback loop is broken.

---

## 2. Design principles & the universal baseline (every screen inherits this)

Every screen in the catalog must meet this **baseline** unless noted:

- **States:** explicit `loading` (skeleton), `empty` (guidance + primary action), `error` (message + retry), and `offline` (queued/works-offline affordance). Reuse `emptyState()` from `components/ui.js`.
- **Header contract:** title, back/close, contextual actions; breadcrumb-free (mobile) but a clear back stack.
- **Thumb-reachable:** primary actions bottom-anchored; destructive actions require confirm.
- **Offline-first:** all writes queue locally (extend `carerStore`) and show sync status; never block on network.
- **Provenance:** every record stamped with author + time + (where relevant) GPS; visible in detail.
- **Accessibility:** labelled controls, ≥44px targets, WCAG-AA contrast, dynamic text scaling, no colour-only meaning.
- **Permission-aware:** respects the acting role (Carer vs Senior Carer); gated actions hidden/disabled with reason.
- **Consistency:** one field engine (extend `fieldControls`), one badge/status vocabulary (`OUTCOME_CODES`, `SEVERITY`), one sheet pattern.
- **Safety-critical emphasis:** allergies, DNACPR, controlled drugs, two-carer, time-critical meds always visually prominent.

Definition of "ideal baseline" per screen (used below) = the minimum this screen must show/do to be
enterprise-grade, beyond just rendering data.

---

## 3. Navigation & IA model (the missing hierarchy)

**Recommendation:** the carer app becomes a **self-contained mobile sub-app with its own shell** (no
office sidebar), rendered full-screen in the phone frame, reachable from the office "Carer App" link for
the demo. Three navigation layers:

```
LAYER 1 — App shell (persistent bottom tab bar, 4 tabs)
  ● Today      ● Clients      ● Inbox      ● Me
  + "Active visit" pill (persistent) when a visit is in progress → jumps back into the Visit workspace
  + global: notifications bell, search, offline/sync chip

LAYER 2 — Visit workspace (its own top/bottom sub-nav, entered from Today/Clients)
  Overview · Tasks · MAR · Obs · Charts · Incident · Notes   (+ clock in/out rail)

LAYER 3 — Sheets / detail overlays (task, med, obs form, incident, photo, signature, confirm…)
```

### Sitemap (routes under `#/carer`)

```
#/carer/login                     Auth (PIN / biometric)
#/carer/welcome                   First-run onboarding & permissions
#/carer                           TODAY (home)  ── tab
#/carer/schedule                  Multi-day schedule / calendar
#/carer/map                       Round map view
#/carer/clients                   CLIENTS directory ── tab
#/carer/clients/:suId             Client profile
#/carer/clients/:suId/careplan    Care plan viewer
#/carer/clients/:suId/meds        Medication profile / MAR history
#/carer/clients/:suId/history     Visit & observation history / trends
#/carer/clients/:suId/documents   Documents
#/carer/inbox                     INBOX / messages ── tab
#/carer/inbox/:threadId           Message thread
#/carer/notifications             Notifications centre
#/carer/me                        ME / profile hub ── tab
#/carer/me/timesheet              Timesheet / clock history / mileage
#/carer/me/availability           Availability & shifts
#/carer/me/training               Training & compliance
#/carer/me/settings               Settings (notifications, biometrics, a11y, language)
#/carer/me/safety                 Lone-worker / SOS
#/carer/me/help                   Help & policies
#/carer/visit/:visitId            VISIT WORKSPACE (Overview + sub-tabs + sheets)
#/carer/search                    Global search
```

---

## 4. SCREEN CATALOG

Format per screen — **Purpose · Contains · Connects→ · Variants/States · Missing today / Questions · Baseline**.
"Missing today" = not in v2. Screens marked ★ are net-new.

### A. Authentication & onboarding ★ (all new)

**A1. Splash / launch ★**
- Purpose: brand + boot + session/offline check.
- Contains: logo, version, "restoring session…", offline indicator.
- Connects→ Login or Today (if session valid).
- Variants: online / offline / update-required / maintenance.
- Missing/Q: no session concept at all today. Q: session length, auto-lock timeout?
- Baseline: never hangs; offline path works.

**A2. Login ★** `#/carer/login`
- Purpose: authenticate the carer.
- Contains: org/branch, carer identity, **PIN pad + biometric (Face/Touch)**, "remember device", forgot-PIN link.
- Connects→ Today; 2FA; forgot-PIN.
- Variants: PIN / biometric / password fallback; locked-out; wrong-PIN; new-device; offline login (cached credentials).
- Missing/Q: no auth today (hardcoded "Aisha Khan"). Q: PIN vs SSO vs magic link? Biometric required?
- Baseline: prohibited actions honoured (we never store raw passwords; use device biometrics; sign-in stays on-device).

**A3. Device registration / 2FA ★** — first sign-in on a device; code/approval. Variants: SMS/authenticator/approved-device.

**A4. Forgot / reset PIN ★** — request → verify → set new. (Reset handled by user/office, not us.)

**A5. First-run onboarding & permissions ★** `#/carer/welcome`
- Purpose: consent + OS permissions + quick tour.
- Contains: 3–4 slides (record at point of care, works offline, safety), permission prompts (**location, notifications, camera, biometrics**), data-consent acknowledgement.
- Variants: permission granted/denied per item; skip; returning user (skipped).
- Missing/Q: none exists. Q: which permissions are mandatory vs optional?
- Baseline: app still usable if a permission denied (graceful degradation).

**A6. App-lock / re-auth ★** — idle/biometric re-lock overlay. Variant: after N minutes, after backgrounding.

### B. App shell & cross-cutting ★

**B1. App shell / bottom tab bar ★**
- Purpose: the persistent hierarchy that's missing today.
- Contains: 4 tabs (Today, Clients, Inbox, Me), notifications bell w/ count, offline/sync chip, **persistent "Active visit" pill**.
- Connects→ every top-level area; pill → current `#/carer/visit/:id`.
- Variants: online/offline; with/without active visit; unread badges.
- Baseline: state survives navigation; deep links restore correct tab.

**B2. Notifications centre ★** `#/carer/notifications`
- Purpose: inbound office messages, task assignments, schedule changes, alert acknowledgements, med reminders.
- Contains: grouped list (Today/Earlier), type icons, read/unread, tap→ source (visit/thread/client).
- Variants: empty; unread; muted; per-type filter.
- Missing/Q: messages are send-only today; **no inbound, no read receipts**. Q: which events push?
- Baseline: mark read/all-read; deep-link to source.

**B3. Global search ★** `#/carer/search`
- Purpose: find a client, visit, observation, incident, med, message.
- Contains: query field, recent, scoped results w/ type chips.
- Variants: empty / no-results / offline (local-only).
- Missing/Q: no search anywhere today.

**B4. Offline & sync manager ★**
- Purpose: transparency + control over queued records.
- Contains: queued count by type, last sync time, **manual sync w/ progress + conflict handling**, retry, "works offline" explainer.
- Variants: all-synced / N-queued / syncing / sync-error / conflict.
- Missing/Q: today only a counter + reset. Q: conflict-resolution policy (last-write-wins vs office-wins)?

**B5. System states (pattern, not a route)** — loading skeletons, empty states, error+retry, permission-denied, session-expired, forced-update. Applied everywhere per §2.

### C. Today / Schedule (home hub)

**C1. Today ★ (replaces flat rota)** `#/carer`
- Purpose: the carer's day at a glance + next action.
- Contains: greeting + date; **"Next visit" hero card** (client, time, travel ETA, primary CTA: Navigate / Clock in); timeline/list of visits with rich status; day progress ring; unallocated/offered visits; sync chip; shortcuts (Report incident, Message office, SOS).
- Connects→ Visit overview; Map; Schedule; Client profile; Inbox.
- Variants: **no visits / day off**; all complete; running late (amber next card); a visit in progress (resume); offered visit to accept; cancelled visit; end-of-day summary.
- Missing/Q: v2 has a bare list — no next-visit focus, travel, offered visits, running-late, or day summary. Q: does office push same-day changes?
- Baseline: always answers "what do I do next?"; reflects live clock/queue state.

**C2. Schedule / calendar ★** `#/carer/schedule`
- Purpose: multi-day view (today's app is single-day only).
- Contains: week strip + day agenda; upcoming/past toggle; visit chips; totals (hours, visits, mileage).
- Variants: week/day; past (read-only) vs future; empty week; unconfirmed shifts.
- Missing/Q: no multi-day anywhere. Q: how far forward is visible?

**C3. Round map ★** `#/carer/map`
- Purpose: spatial view + route of the day.
- Contains: pins per visit, ordered route, ET~s, tap pin→ visit.
- Variants: no location permission; offline (cached); reordered route.
- Missing/Q: no map/travel today.

**C4. Offered / unallocated visit ★** — accept/decline a visit offered by office; reason on decline. Variant: expiring offer.

**C5. Running late / can't attend ★** — from a visit or Today; pick reason, notify office/client, ETA. Variant: escalates to missed-visit.

### D. Visit workspace (the core — rebuild of v2)

**D0. Visit workspace container ★** `#/carer/visit/:visitId`
- Purpose: everything for one visit with proper sub-nav (v2 mixed rota+visit).
- Contains: client header (photo, name, **allergies/DNACPR/2-carer/time-critical banners**), clock rail, sub-tabs (Overview · Tasks · MAR · Obs · Charts · Incident · Notes), Active-visit pill target.
- Connects→ all sheets below; Client profile; Care plan.
- Variants: pre-visit (not clocked in) / in-progress / completed (read-only + edit window) / missed.
- Baseline: safety banners always visible; sub-tab state persists; resumable.

**D1. Pre-visit brief / Overview ★**
- Purpose: prepare before starting (missing today).
- Contains: visit time & type, **travel/arrival + Clock-in CTA**, client snapshot (about-me, access/key-safe, preferences), what's due (tasks/meds/obs counts), open alerts & last handover, risks summary.
- Connects→ Care plan; Client profile; Clock-in.
- Variants: first-visit-to-client (extended brief); returning; two-carer (shows co-carer).
- Missing/Q: v2 jumps straight to task list; no brief, travel, last-handover, or co-carer.
- Baseline: shows access info + allergies + last handover before clock-in.

**D2. Clock-in (arrive)** — enhance v2
- Contains: **geofence confirm / manual override + reason**, late reason, co-carer present check.
- Variants: on-time / late / wrong-location / no-GPS / offline.
- Missing/Q: v2 auto-stamps time, GPS is a stub, no late reason/override.

**D3. Client context / "This is me"** — exists (context sheet) but shallow.
- Add: communication needs, cultural/religious, capacity/consent, DNACPR, pets/access hazards.
- Baseline: promote from sheet to a first-class Overview section + full Client profile (E2).

**D4. Care plan viewer ★** `…/clients/:id/careplan`
- Purpose: read the actual plan behind the tasks (missing today).
- Contains: plan sections by domain, goals/outcomes, "how I like my care", linked risks, review dates, version.
- Variants: full vs summary; out-of-date banner; no plan.
- Missing/Q: tasks exist with no plan context. Q: is plan editable by carer? (likely read-only + "flag issue").

**D5. Risk assessments viewer ★** — moving-&-handling, falls, environment, etc.; controls; review dates.

**D6. Tasks list** — exists; keep required/optional, add: filter/sort, add ad-hoc task, per-task status history.
- Variants: all-done; blocked; overdue; not-clocked-in (read-only).

**D7. Task evidence sheet** — exists (schema-driven). Add: **edit-after-save within window**, decline/skip with reason, attach photo, previous outcomes for this task.
- Variants per type (checklist/score/measurement/bodymap/food/fluid/instruction…) — already supported by `fieldControls`; extend for edit/attachments.

**D8. MAR / medication list** — exists. Add: **not-yet-due vs due vs given** grouping, time-critical countdown, "administered" summary, link to full med profile (E4).
- Variants: nothing due; PRN-only; missing stock; refused.

**D9. Medication admin sheet** — exists (CD witness, covert, allergy, PRN). Add: **allergy hard-stop acknowledgement**, dose confirmation, barcode/scan stub, PRN effectiveness follow-up reminder.
- Variants: scheduled / PRN / controlled / covert / allergy-conflict / not-available.

**D10. Observations hub** — exists (catalog). Add: **recent values inline (last reading + trend arrow)**, search obs type, favourites/most-used first.
- Variants: none recorded / some recorded / abnormal present (surfaced).

**D11. Observation form sheet** — exists. Add: **normal-range hint inline**, previous value prefill reference, auto-NEWS2 calc from vitals, escalation prompt on abnormal.
- Variants: normal / abnormal (escalation CTA) / requires-photo (skin).

**D12. Charts / running totals ★** (new tab)
- Purpose: fluid balance, food intake, repositioning clock, bowel chart, weight/obs trends *for this visit + recent days*.
- Contains: fluid target ring + timeline, food chart, reposition timer, obs sparklines.
- Missing/Q: v2 records fluids but shows no running total/target progress at point of care.

**D13. Incident tab + report sheet** — exists. Add: **draft/save-resume**, witness signature, link incident to a task/med/obs, photo evidence gallery, severity guidance, RIDDOR helper text.
- Variants: fall / med-error / safeguarding / near-miss / death (each with tailored fields).

**D14. Body map (shared) ★ standalone** — reusable across skin obs, incident injuries, wound care; front/back, zoom, mark + note + photo per mark. (v2 has a single 12-point SVG only.)

**D15. Notes / daily log ★**
- Purpose: proper handover + chronological visit log (v2 has one textarea).
- Contains: visit note; **read previous handover**; **timeline of everything recorded this visit** (tasks/meds/obs/incidents/messages, time-stamped); tags (concern/positive).
- Variants: empty; with prior handover; concern-flagged.

**D16. Photos & documents ★** — capture w/ consent, gallery, annotate, attach to record; view client documents. (v2 photo is a stub with no gallery.)

**D17. Visit summary / review** — exists (summary sheet). Add: outstanding-items checklist, abnormal-obs recap, **client + carer signature capture**, visit duration, "what will be sent to office".
- Variants: complete / has-outstanding / has-abnormal / refused-items.

**D18. Clock-out (leave)** — exists (gated). Add: signature, **short handover prompt if none**, travel-to-next hint, confirmation screen.
- Variants: clean / blocked / early-leave-with-reason / offline.

**D19. Visit completed / post-visit ★** — read-only recap + **edit window countdown** + "next visit" CTA. Variant: within edit window vs locked.

**D20. Quick actions (from any visit tab)** — Report concern (exists), SOS, Message office, Add task, Call client/office. Persistent FAB or header.

### E. Clients / People ★ (all new)

**E1. Client directory ★** `#/carer/clients` — people the carer supports; search; today-vs-all; risk/allergy chips.

**E2. Client profile ★** `…/clients/:id` — hub: overview, next visit, care plan, meds, contacts, documents, history, preferences, DNACPR/allergies. Connects→ all client sub-screens + start visit.

**E3. Care plan (client-level)** — same viewer as D4 outside a visit (read anytime).

**E4. Medication profile / MAR history ★** `…/clients/:id/meds` — current meds, schedule, **historical administrations & compliance %, PRN history, refusal trend**. Missing today (no med history at all).

**E5. History & trends ★** `…/clients/:id/history` — past visits, **observation trends (BP/weight/fluid/mood)**, incident history, notes archive. Missing today.

**E6. Client documents ★** — care plan PDF, consent forms, hospital letters. Read-only.

### F. Inbox / communication ★

**F1. Inbox ★** `#/carer/inbox` — threads with office/seniors, broadcasts, **alerts assigned to me**, task assignments. Unread badges.

**F2. Message thread ★** `…/inbox/:id` — two-way, **read receipts**, attachments, quick replies, escalate-to-call. (v2 is send-only.)

**F3. Broadcasts / announcements ★** — org-wide notices (policy, weather, rota change).

**F4. On-call / emergency contacts ★** — call office, on-call manager, 999; from Safety too.

### G. Me / profile & work ★

**G1. Me hub ★** `#/carer/me` — profile summary, quick links to below, sign-out.

**G2. Profile ★** — details, photo, roles/skills, DBS/qualifications (read-only).

**G3. Timesheet / clock history / mileage ★** `…/me/timesheet` — visits worked, clocked hours, mileage, discrepancies, submit/confirm.

**G4. Availability & shifts ★** — set availability, view/accept shifts, leave requests.

**G5. Training & compliance ★** — certificates, e-learning, **expiry warnings**, mandatory-training status.

**G6. Settings ★** `…/me/settings` — notifications, biometrics/PIN, **text size & accessibility**, language, theme, offline/data usage, about.

**G7. Help & policies ★** — how-to, contact support, report a bug, policies & procedures.

### H. Safety & wellbeing ★

**H1. Lone-worker / safety hub ★** `…/me/safety` — start/stop safety timer, **SOS/panic**, share live location, safe-arrival check-in.

**H2. SOS / panic overlay ★** — one-tap alert to office/on-call with location; countdown/cancel; escalation.

**H3. Incident (also in visit)** — accessible standalone (not tied to a clocked-in visit).

---

## 5. Key end-to-end user journeys

Each journey is a connected path across the screens above (these drive the rebuild & test scripts):

1. **First run:** Splash → Login (PIN/biometric) → Onboarding/permissions/consent → Today.
2. **Standard visit:** Today (next-visit hero) → Navigate/Map → Visit Overview/brief → Clock-in (geofence) → Tasks → MAR → Obs → Notes/handover → Visit summary (signatures) → Clock-out → Visit completed → Today (next).
3. **Controlled drug:** MAR → med sheet → allergy check → outcome Given → **witness signature** → CD count → saved → office alert.
4. **Abnormal observation → escalation:** Obs hub → BP form → out-of-range auto-flag → escalation prompt → notify office → appears in office Exception Monitor (§9).
5. **Incident (fall):** Quick action / Incident tab → type=Fall → severity → body-map injury → actions → informed → RIDDOR → submit → **INC ref + escalation** → office incident queue (§9).
6. **Refusal / decline:** task/med → outcome Refused + reason → office alert → shows on planner (§9).
7. **Running late / missed visit:** Today or Visit → Running-late → reason + ETA → office notified; if not attended → missed-visit flow.
8. **Offered visit:** Notification/Today → accept/decline → schedule updates.
9. **Offline visit then sync:** clock-in offline → record everything → queued banner → back online → Sync manager resolves → office receives.
10. **Handover continuity:** Visit Overview reads previous handover; end-of-visit writes handover consumed by next carer.
11. **Lone-worker safety:** start safety timer on arrival → check-in → SOS if needed.
12. **Look up a client between visits:** Clients → profile → care plan / med history / trends.

---

## 6. Cross-cutting requirements (apply to all)

- **Offline-first & sync:** extend `carerStore` with an event/queue log + sync-status per record; Sync manager (B4); conflict policy (open question).
- **Notifications:** inbound events model (office → carer) driving Notifications centre + Inbox + Active-visit changes.
- **Permissions/roles:** Carer vs Senior Carer gating (e.g., second-carer sign-off, edit windows).
- **A11y & i18n:** dynamic text, contrast, labels; language setting in G6.
- **Consent & privacy:** photo/data consent captured (A5) and enforced (D16).
- **Provenance/audit:** every write logged with author+time+GPS → feeds office audit (§9).

---

## 7. Variants & states checklist (per-screen sweep)

For each screen we will explicitly design: **loading · empty · error/retry · offline · permission-denied ·
role-variant · not-clocked-in (read-only) · in-progress · completed/locked · abnormal/alert · first-time vs
returning**. The catalog above lists the *material* variants per screen; this checklist is the completeness
gate applied during build.

---

## 8. Gap analysis (v2 → target), summarised

| Area | v2 today | Target (this catalog) |
|---|---|---|
| App hierarchy | flat rota + 1 visit screen | 4-tab shell + visit workspace + sheets (§3) |
| Auth/onboarding | none | A1–A6 |
| Home | bare list | Today hub w/ next-visit, travel, offered, states (C1) |
| Schedule/history | single day only | Schedule, Map, Client history/trends (C2–C3, E5) |
| Clients | none | Directory + profile + care plan + med history (E1–E6) |
| Care plan / risks | none | Viewers (D4–D5) |
| Comms | send-only | Inbox, threads, read receipts, notifications (F, B2) |
| Profile/work | none | Me hub, timesheet, availability, training, settings (G) |
| Safety | stub buttons | Lone-worker hub + SOS (H) |
| States | minimal | universal baseline (§2, §7) |
| Office loop | broken | touchpoints wired (§9) |

---

## 9. Carer ↔ office loop (touchpoints; office UI out of scope but data must surface)

Even though office screens aren't being redesigned, the rebuild will define the **hand-off contract** so
carer-generated data can appear office-side (closing the broken loop found in the inventory):
- Abnormal observations, refusals, missed/flagged tasks, incidents, low-intake → **office Exception Monitor** (`exceptions.js` / `ALERTS`).
- eMAR outcomes → medication alerts + audit.
- Clock in/out, task completion, incidents → **office Audit Trail** (`audit.js`).
- Handover notes → next-visit context / planner.
- Two-way messages → office inbox.
Implementation later; the plan just fixes the data model so it *can* connect (single source, not two silos).

---

## 10. Architecture & implementation roadmap (after approval)

New/changed modules:
- **Carer app shell** — own layout (no office sidebar) + bottom-tab nav; route namespace `#/carer/*` (§3).
- **State** — evolve `carerStore` into per-entity stores (visits, clients, meds, obs, incidents, messages, notifications, timesheet, session) with a sync/queue log; add an inbound-events feed (mock).
- **Data catalogs** — extend `data/carer.js`: multi-day schedule, client profiles/care plans/risks, med history, message threads, notifications, training/compliance, timesheet.
- **Screen modules** — one per area (today, schedule, clients, visit/*, inbox, me/*, safety, auth).
- **Shared** — extend `fieldControls`; promote body map to a standalone component; add signature capture, photo gallery, skeletons, states.

Phased build (each phase independently testable in the browser):
- **P0 — Shell & foundations:** app shell + bottom nav + Today hub + universal states + auth stub + offline/sync chip. (Backbone the whole app hangs off.)
- **P1 — Visit workspace rebuild:** Overview/brief → clock-in(travel) → Tasks → MAR → Obs → Charts → Notes/timeline → summary(signature) → clock-out → completed. (Core journey 2–6.)
- **P2 — Clients & care context:** directory, profile, care plan, risks, med history, trends.
- **P3 — Comms & notifications:** inbox, threads, notifications centre, broadcasts, on-call.
- **P4 — Me & safety:** profile, timesheet, availability, training, settings, lone-worker/SOS.
- **P5 — Office loop + polish:** wire hand-off data (§9), edit windows, conflict-resolution, a11y pass.

---

## 11. Open questions to resolve before/while building

1. **Auth model:** PIN + biometric (recommended) vs SSO vs magic-link? Auto-lock timeout?
2. **Offline conflict policy:** last-write-wins vs office-authoritative on sync?
3. **Care plan editability:** carer read-only + "flag issue" (recommended) vs limited edits?
4. **Notifications source:** should we mock an office→carer event feed now, or stub it until P3/P5?
5. **Signatures:** capture client + carer signature at clock-out and CD administration — confirm required.
6. **Fidelity:** keep everything mock/localStorage (recommended, consistent with prototype) — confirm.
7. **Standalone shell:** confirm the carer app should drop the office sidebar and run as its own full-screen shell.

---

## 12. Verification approach (per phase)

- Build clean (`npm run build`, 0 warnings) + no console errors after each phase.
- Drive each **journey (§5)** end-to-end via the Claude Preview MCP (navigate, click, fill), asserting Alpine state and `carerStore` persistence (reload survives).
- **States sweep (§7):** force loading/empty/error/offline for representative screens; screenshot key screens (Today, Visit Overview, MAR, Obs abnormal, Incident, Client profile, Inbox).
- Confirm safety-critical rules (allergy hard-stop, CD witness gating, two-carer, clock-out gating) still hold.
```

---
---

# PART B — Spec v3.4 clinical-safety enhancement roadmap

> **STATUS (2026-07-01): E1–E5 all delivered & browser-verified** (clinical-safety core, visit integrity,
> records & field safety, workforce & ops, foundation/governance). Part A (above, P0–P5) rebuilt the carer
> app's information architecture and is **delivered**. Part B
> aligns that app to the **Carer Mobile App Functional Specification v3.4** (`~/Downloads/carer-app-functional-spec-v3.4.md`,
> 58 sections, MoSCoW + acceptance-criteria + DCB0129/DTAC/CQC). This is the plan the user asked for:
> review the full spec and enhance the app against it.

## B0. Context

The prototype now has most *screens*, but the spec demands **clinical-safety depth** the prototype lacks.
The gap is behavioural, not cosmetic. Confirmed decisions: **prototype fidelity** (simulate ECM/geofence/
MFA/sync/protocols with mock + `localStorage`; no real backend), **clinical-safety core first**, and a
**comprehensive roadmap covering all 58 sections** (build the prototype-demonstrable behaviour; flag
backend/assurance-owned items). We reuse the existing engine rather than rebuild: the schema-driven field
renderer `fieldControls`, the `carerApp` Alpine component, `carerStore` (localStorage), `officeBridge`,
`evaluateObsFlag`, the sheet pattern and `mobileFlow/flowHeader/mobileApp` in `src/carer/frame.js`, and
the data catalogs in `src/data/carer.js`.

## B1. Gap analysis (spec → current), highest-risk first

| Spec area | Spec requires | Current | Gap |
|---|---|---|---|
| Wrong-person §14.2 | persistent person banner (name+photo+2nd id), 2-identifier confirm before eMAR/high-risk, explicit switch clears unsaved + audit | none | **critical, missing** |
| eMAR §18/§49 | **two fields**: supportAction × doseOutcome (per-medicine) | single `outcome` | **model wrong** |
| Med safety §49 | 3 independent rules (early/late window, min interval, rolling-24h max) w/ exact block reason; time-critical; **5 allergy states**; covert-under-MCA; stale-MAR override; special types; external-admin; PRN follow-up; exception outcomes | witness+covert+allergy(binary)+time-critical(flag only) | **major** |
| Deterioration §51/§19a | closed-loop protocol (action→contact→advice→repeat obs→ack→closure), version-pinned library | abnormal→toast+office alert | **major** |
| Consent/MCA §16 | decision- & time-specific capacity, LPA scope, record consent/refusal, no generic flag | none | **missing** |
| Alerts §48 | one state machine Raised→Delivered→Seen→Ack→Action→Resolved (+escalate/withdraw/reopen); critical never auto-expires; live status to carer | fire-and-forget toast | **missing** |
| Visit/ECM §14 | geofenced check-in + fallbacks, welfare confirmation, leaving-safe checklist, **5-dimension** outcome + reason-code taxonomy, completion controls, end-of-shift summary | clock in/out + 4-state task outcome; no geofence/welfare/checklist/dimensions | **major** |
| Access/key-safe §50 | masked key-safe + audited tap-to-reveal + auto-remask; break-glass; offline lease | key-safe shown in plain text | **major** |
| Incidents §23 | concern→incident promotion, harm level, **disclosure verbatim + fact/interpretation split**, restraint, specialised fields, append-only | flat incident form | **partial** |
| Notes/media §21 | real photo + **voice**, consent-gated, append-only versioned | text notes; photo/sig stubs | **partial** |
| Drafts §55.6 | auto-save/resume, submit-vs-save, validation, dup-prevention | none | **missing** |
| Schedule §12, Travel §13, Pay §26/§27, Training §28 | multi-day, clock-on/off, leave, open shifts; directions + business mileage; expenses + earnings; competency + micro-lessons + spot-checks | mostly stubs / single-day | **partial** |
| Auth §10/§47, Sync §32, Audit §36, i18n §34, AIS §54, Notifications §33 | MFA, device reg, auto-lock, permission fallbacks; stale-data leases; immutable audit; WCAG; person comms needs | PIN stub, settings toggles, mock sync | **partial** |

## B2. Approach & prototype-fidelity principles

- **Simulate mechanisms, implement behaviour.** Geofence → `navigator.geolocation` or a mock "inside/
  outside" toggle; trusted time → the store's existing deterministic clock; MFA/biometric → simulated
  step; sync/stale → timers + `[P-…]` thresholds; telephony → `tel:`/toast; prescribing/pharmacy/NatPSA →
  mock catalogs. Every simulated mechanism is labelled in-UI so it never reads as production.
- **One source of truth for thresholds:** add a `PARAMS` object (spec §7 `[P-…]`) in `src/data/carer.js`
  and reference it everywhere (geofence radius, med windows, auto-lock, stale-MAR, key-safe remask, LW
  check-in, PRN follow-up). Configurable = editable constant.
- **Extend, don't fork.** Grow `carerStore` schema and `fieldControls`; add catalogs; add sheets to the
  existing visit workspace; keep offline persistence and the office loop.
- **Every safety rule is demonstrable & testable** (maps to a spec AC): a gate fires, a block-reason
  shows, a protocol reaches closure, a reveal re-masks.

## B3. Phased roadmap (all 58 sections mapped)

Phases are ordered by patient-safety value. Each lists the spec sections it delivers, the key
prototype behaviour, primary files, and the ACs it targets.

### E1 — Clinical-safety core  *(build first)*
- **Wrong-person protection (§14.2, AC-14.35–40).** Persistent person banner (name + photo + DOB) on every
  recording sheet; **two-identifier confirmation** gate before opening eMAR / high-risk sheets; person
  switch is explicit, clears `form`, audited; similar-name warning; reconfirm on resume. Files: `carer.js`
  (visit header + sheet guards), `carerStore` (audit person-switch), `serviceUsers` (photo/DOB/2nd id).
- **Two-field eMAR (§18/§49, AC-14.32/49.x).** Replace `MED_OUTCOMES` with `SUPPORT_ACTIONS`
  (self-managed/prompted/supervised/assisted/administered/no-action) **×** `DOSE_OUTCOMES`
  (taken/refused/withheld/unavailable/not-required/partly-taken/administered-by-other/omitted/unknown);
  derive per-medicine status; planned-care "Met" even when self-admin/withheld-by-instruction. Files:
  `data/carer.js`, `carer.js` `openMed/saveMed`, `officeBridge`.
- **Medication safety rules (§49).** Three independent checks with **exact block reasons** ("Too early",
  "Minimum interval not met", "24-hour maximum reached", "Order not effective", "Cross-carer history
  stale"); time-critical highlight + window; **5 allergy states** (No-known / Confirmed / Unknown /
  Assessment-incomplete / Unable-to-verify) — Unknown visually distinct, requires ack, can block high-risk;
  covert-under-MCA badge; **stale-MAR override** (reason + paper-check confirm + office alert +
  reconciliation task); special types (patch apply/remove+site, topical site, blister id, thickener IDDSI —
  S); external-admin verification; **PRN follow-up** `[P-PRNFOLLOWUP]` with ownership chain; medication
  exception outcomes (dropped/spilled/vomited/uncertain…). Files: `data/carer.js` (`PARAMS`, orders, rules),
  `carer.js` (med sheet).
- **Deterioration & emergency protocols (§51, §19a, AC-51.x).** Protocol **runner** sheet: immediate action
  → one-tap contacts (§48 fallback) → capture advice → repeat-obs prompt → acknowledgement → **closure**;
  version-pinned at launch; library (sepsis/NEWS2, hypo, choking, FAST, chest-pain, seizure, unresponsive→
  §55.4, bleeding, anaphylaxis); replaces "abnormal → toast". Files: new `src/carer/protocols.js` + catalog.
- **Consent & MCA (§16, AC-16.x).** Decision-/time-specific capacity panel (assessment date, assessor,
  review, scope, fluctuates) — never a generic flag; LPA scope; record consent given/refused/unable;
  refusal → `declined-by-person`, not incapacity; care-plan change acknowledgement gate. Files: `clientDetail`
  (care plan), `carer.js` (task consent).
- **Alert state machine (§48, AC-48.x).** Unified alert entity (severity, owner, ack deadline `[P-ALERTACK]`,
  retries `[P-ALERTRETRY]`, fallback, resolution); lifecycle Raised→Delivered→Seen→Ack→Action→Resolved
  (+Escalated/Transferred/Withdrawn/Reopened); **critical never auto-expires**; carer sees live status.
  Files: extend `officeBridge` + `carerStore`; a carer "my raised alerts" status view.

### E2 — Visit integrity & ECM (§14 incl. 14.1–14.5, §11, §55.7, §20)
- Geofenced **check-in** (simulate inside/outside) + fallbacks (NFC/QR/telephony/manual+reason), outside-
  geofence flag, trusted-time attestation, mock-location/tamper flag, early-check-in window `[P-CHECKIN-EARLY]`.
- **On-entry welfare confirmation** (8 structured outcomes) → concern/emergency routes to protocol/death.
- **Leaving-safe checklist** (configurable per-person, defined exception outcomes) before checkout.
- **Five-dimension outcome** (lifecycle/attendance/planned-care/care-summary/record-completion/verification)
  + **structured reason-code taxonomy** under a plain-language picker; derived display labels.
- **Visit-completion controls (§55.7)** gating checkout; **end-of-shift summary (§11)**.
- Visit types (§14.1): escort (moving location OK), telephone/remote, first-visit baseline, reablement
  (§16a goals/step-down), complex/EOL. **Double-ups (§14.5):** mutual presence, event-merge, two-person
  block, joint sign-off. **Night shifts (§14.4):** shift-level ECM, interval rounds, wake events, quiet UI,
  cross-midnight totals. **Supported-living (§14.2):** single check-in, per-person attribution.
- Operational disruptions (§14.3): access-failure flow, overrun knock-on, not-home/hospital, hazard +
  **equipment register (§20)**, consumables in/low/out.

### E3 — Records & field safety (§21, §23, §50 key-safe, §22, §54, §16a, §19a)
- **Key-safe masking (§50):** masked default, audited tap-to-reveal, auto-remask `[P-KEYSAFEREVEAL]`,
  no-clipboard, changed-code notice, wrong-code→access-failure.
- **Incidents/safeguarding depth (§23):** concern→incident promotion, harm level, **safeguarding disclosure**
  (verbatim words + fact/interpretation split), **restraint record**, specialised fields (falls/missing/
  exposure), append-only after submit, whistleblowing (§23.6).
- **Notes/media/voice (§21):** real photo (camera/file input), **voice note** (MediaRecorder), consent-gated
  media, append-only versioned notes.
- **Pre-visit safety briefing + lone-worker (§22):** risk/hazard briefing before check-in; SOS as a §48
  alert; periodic lone-worker check-ins `[P-LWCHECKIN]` with escalation.
- **Drafts & forms (§55.6):** auto-save, resume-after-close, submit-vs-save, validation, dup-prevention.
- **AIS (§54):** person communication-needs panel + "met during visit". **Reablement (§16a)** goals/progress/
  step-down. **Condition-specific obs (§19a)** + fluid-balance cross-midnight; inline last-`[P-OBSWINDOW]`.

### E4 — Workforce & operations (§12, §13, §26, §27, §28, §55.1–55.5, §25, §30, §31)
- **Schedule/availability/shift-clocking (§12):** day/week/month, clock-on/off + WTD breaks + fatigue nudge
  `[P-FATIGUE]`, availability, leave, swaps/open shifts with eligibility (competency/training/WTD).
- **Travel & navigation (§13):** one-tap directions handoff, **business/non-visit mileage** categories,
  offline-map note. **Money/expenses (§26)** + **pay/timesheet/mileage (§27)**: receipt-photo expenses +
  balance, earnings estimate, timesheet confirm.
- **Training/competency (§28):** certificates + expiry `[P-TRAINDUE]`, **just-in-time micro-lessons** keyed
  to next client's conditions, **spot-checks (§55.1)**.
- **Handover acknowledgement (§55.3)**, **lead-carer responsibilities (§55.2)**, **death workflow (§55.4)**,
  **carer absence/fitness (§55.5)**, feedback (§25), search (§30), help (§31).

### E5 — Foundation, platform & governance (§10, §47, §32, §50 access, §53, §33, §34, §36, §55.8, §7, §52, §57, §56, §58)
- **Auth hardening (§10/§47):** simulated MFA on first device, device registration, **enforced auto-lock**
  `[P-AUTOLOCK]` (idle timer + re-auth), single-active-session policy, forced-update gate, permission flows
  with denied/revoked **fallbacks** (never silently disable safety).
- **Sync/offline leases (§32/§50):** stale-data **warn→block** gates (`[P-STALECARE]`/`[P-STALEMAR]`/
  `[P-OFFLINEAUTH]`), sync-failure warning/escalation `[P-SYNCWARN]`, attributed-event merge, draft
  ownership; **break-glass** (reason + time-box `[P-BREAKGLASS]` + minimal emergency profile + secure search),
  offline-lease-expiry mid-visit grace.
- **Lawful-basis sharing (§53):** plain-language purpose → policy-mapped Article 6 + Article 9 fields;
  emergency share not blocked. **Notifications (§33)**, **WCAG 2.2 AA pass (§34)**, **immutable audit (§36)**.
- **Governance as config + docs:** `PARAMS` table (§7); config-versioning note (§55.8); and a **spec-traceability
  doc** capturing which ACs are demonstrated vs backend/assurance-owned (§52 platforms/NFR, §56 v1 baseline,
  §57 standards register, §58 RACI ownership) — these are assurance artefacts, referenced not built.

## B4. Out of prototype scope (backend / assurance-owned — flagged, not built)

Real ECM/geofence & `[SYNC]`/`[ECM]` engines; real identity/MFA/SCIM/MDM; prescribing/pharmacy/dm+d & GP
Connect integration; real telephony fallback; DCB0129 hazard log, DCB0160 handover, DPIA, DTAC 2.0, NFR/SLO
targets, pen-testing, standards register & RACI (§52/§57/§58). The plan **simulates the carer-facing
behaviour** these govern and records the dependency.

## B5. Verification (per phase)

- `npm run build` clean + 0 console errors after each phase.
- Drive the new **safety journeys** via Claude Preview MCP and assert `carerStore` state + persistence:
  (1) open eMAR blocked until 2-identifier confirm; (2) med blocked with exact reason (too-early / interval /
  24h-max) and two-field record; (3) Unknown-allergy warning + high-risk block; (4) abnormal NEWS2 → protocol
  runner reaches **closure**; (5) refusal → declined-by-person (not incapacity); (6) key-safe reveal →
  auto-remask; (7) draft auto-saves and resumes after reload; (8) stale-MAR override records reason + office
  alert; (9) alert lifecycle shows live status and critical never auto-expires; (10) carer data still surfaces
  office-side (loop intact).
- Screenshot flagship flows (person banner, two-field eMAR, med block, protocol runner, consent panel,
  key-safe mask, alert status).
- Re-run the Part-A safety checks (allergy, CD witness, clock-out gating) to confirm no regression.

## B6. Open decisions to confirm during build

1. eMAR: full 9-value `doseOutcome` set now, or the common subset first?
2. Protocols: how many in the v1 library (recommend 6: sepsis/NEWS2, hypo, choking, FAST, unresponsive,
   anaphylaxis)?
3. Geofence: real `navigator.geolocation` (asks device permission) vs a mock inside/outside toggle
   (recommend mock for reliable demo).
4. Person photos: use initials-avatars (current) or add placeholder images for the wrong-person banner?

---
---

# PART C — E6–E8: exhaustive breadth, specialist records & enterprise hardening

> **STATUS (2026-07-01): E1–E8 are all delivered & browser-verified.** Part B mapped all 58 sections into
> E1–E5 (all built); this Part C's E6–E8 (visit-type/setting breadth, specialist care records, enterprise
> QA capstone) are likewise built — see [`spec-traceability.md`](spec-traceability.md) for the live
> §-by-§ status. **UPDATE (2026-07-02): E9, E10 and the E8-expansion are now substantially built too** —
> `medOrders.js` (§49 order lifecycle/reconciliation), `obsIntegrity.js` (§19 integrity), `changeRequest.js`
> (§24), `jobs.js` (§17), `reports.js` (§29a/b), `assurance.js` (E8 hazard/concurrency/transition register)
> + roles & cash-safety. See **Part E** and [`spec-gaps-v3.4.md`](spec-gaps-v3.4.md) for the residual
> (still-unbuilt) items. This Part C makes the roadmap *exhaustive*: it
> absorbs (a) the **deferred-breadth items**
> parked inside the delivered phases, (b) the **three sections the v3.4 coverage review found unassigned**
> (§17.1 personal-care taxonomy, §19b end-of-life records, §24 translation aid), and (c) an
> **enterprise-quality capstone** — accessibility audit, performance, design-system consistency,
> state-sweep and full spec traceability — so nothing in the spec is left unplanned and the prototype
> reads as production-grade. Same prototype-fidelity principles as B2 (simulate mechanisms, implement
> behaviour, one `PARAMS` source of truth, extend-don't-fork). Every item below maps to a spec AC and is
> demonstrable in the browser.

## C0. Sequencing (recommended)

Numeric order is not strict build order. Two safe sequences:
- **By value (recommended):** E4 → **E6** → E5 → **E7** → **E8**. E6/E7 carry genuine patient-safety
  content (night-round monitoring, EOL care, condition-specific deterioration) and should not sit behind
  the workforce/pay work in E4 or the platform hardening in E5.
- **By dependency (simplest):** E4 → E5 → E6 → E7 → E8 (each phase only depends on engines already built
  in E1–E3, so straight numeric order also works).
Whichever is chosen, **E8 is always last** — it is the cross-phase quality gate over everything.

## C1. Remaining-work gap table (what Part C closes)

| Spec area | Spec requires | Current | Lands in |
|---|---|---|---|
| Visit types §14.1 | escort/location-moving, telephone/remote, first-visit baseline, complex/EOL behaviours | single generic visit | **E6** |
| Supported-living §14.2 | single shift-level check-in, per-person attribution, no repeated geofence | 1:1 check-in only | **E6** |
| Operational disruptions §14.3 | access-failure flow, overrun knock-on, not-home/hospital, hazard reporting | none | **E6** |
| Night shifts §14.4 | shift-level ECM, interval/wake rounds, quiet UI, cross-midnight totals | day visits only | **E6** |
| Equipment/LOLER §20 | equipment register, LOLER dates, consumables in/low/out, infection-control | none | **E6** |
| Personal-care taxonomy §17.1 | structured personal-care task types + dignity/consent prompts | generic tasks | **E7** |
| Condition-specific obs §19a | diabetes/epilepsy/catheter/stoma/pain/mood records, cross-midnight fluid balance | generic obs only | **E7** |
| End-of-life §19b | palliative comfort record, anticipatory meds, ReSPECT/DNACPR surface, verification-of-death link | none | **E7** |
| Reablement §16a | goals, progress rating, step-down, "do-with not do-for" prompts | none | **E7** |
| Voice/media §21 | voice note capture (MediaRecorder), consent-gated, append-only | photo only | **E7** |
| Pre-visit briefing + LW §22 | risk/hazard briefing before check-in; periodic lone-worker check-ins + escalation | SOS button only | **E7** |
| Translation aid §24 | phrase translation, read-back, language-of-record capture | send-only inbox | **E8** |
| Accessibility §34 / Appendix D | WCAG 2.2 AA audit (targets, focus, contrast, dynamic type, screen-reader labels) | baseline only | **E8** |
| Performance §35 / Error states §38 | perf budgets + full loading/empty/error/offline sweep across *new* screens | partial | **E8** |
| Traceability §42/§52/§56/§57/§58 | AC-level demonstrated-vs-backend matrix + standards/RACI reference doc | none | **E8** |

## C2. E6 — Visit-type & setting breadth (§14.1–14.4, §20, §55.7 completion re-use)

Make the visit workspace handle *every* real-world visit shape, not just the standard 1:1 daytime call.
Reuses the E2 ECM engine (`openCheckin`/`performCheckin`, `visitDimensions`, `VISIT_REASON_CODES`,
`LEAVING_SAFE_*`) rather than adding a parallel path.

- **Visit-type behaviours (§14.1).** Add `visitType` to rota entries (standard / escort / telephone /
  remote / first-visit / complex-EOL). Type drives check-in rules: **escort** allows moving location
  (geofence follows or is suspended with reason); **telephone/remote** replaces geofence with a
  call-attestation step; **first-visit** injects an extended baseline brief + environment/risk capture;
  **complex-EOL** surfaces the §19b comfort record and anticipatory-meds shortcut. Files:
  `src/data/carer.js` (`ROTA` + `VISIT_TYPES` catalog + per-type check-in policy), `src/screens/carer.js`
  (check-in branch + Overview banners), `src/carer/today.js` (type chips on cards).
- **Supported-living / multi-client (§14.2).** A single **shift-level check-in** for a shared setting with
  **per-person attribution** on every record (no repeated geofence per person); person-switcher reuses the
  E1 wrong-person banner + 2-identifier gate. Cross-midnight and multi-person totals attribute correctly.
  Files: `src/data/carer.js` (setting model), `src/screens/carer.js` (shift session + attribution), 
  `carerStore` (records carry `personId`).
- **Operational disruptions (§14.3).** Access-failure flow (no-answer → attempts log → office alert via
  §48 state machine → leave-safe/abandon outcome with reason code); **overrun** knock-on warning to next
  visit; **not-home / admitted-to-hospital** outcomes; **hazard report** (environmental) raising an alert.
  Reuses `VISIT_REASON_CODES` + `officeBridge` alerts. Files: `src/screens/carer.js`, `officeBridge`.
- **Night shifts (§14.4).** Shift-level ECM (clock the *shift*, not each call); **interval rounds** and
  **wake events** logged against a rounds schedule `[P-NIGHTROUND]` (new PARAM); **quiet UI** mode
  (dark, no sounds, minimal prompts) during quiet hours; **cross-midnight** fluid/food/reposition totals
  roll correctly. Files: `src/data/carer.js` (`PARAMS.NIGHTROUND_MIN`, rounds schedule), 
  `src/screens/carer.js` (rounds sheet + quiet mode class), `src/carer/frame.js` (quiet theme).
- **Equipment, consumables & LOLER (§20).** Equipment register per service user (hoist/bed/wheelchair)
  with **LOLER inspection dates** + expiry warning `[P-LOLERDUE]`; **consumables** in/low/out with a
  low-stock alert to office; **infection-control** PPE-used + status capture. Files: `src/data/carer.js`
  (`EQUIPMENT`, `CONSUMABLES` catalogs), `src/carer/clientDetail.js` (register view), 
  `src/screens/carer.js` (in-visit consumable + PPE capture), `officeBridge` (low-stock alert).
- **ACs targeted:** AC-14.1–14.x (type behaviours), AC-14.2x (attribution), AC-14.3x (disruptions),
  AC-14.4x (night), AC-20.x (equipment/consumables). Completion controls (§55.7) already gate checkout —
  extend the gate to include per-type required items.

## C3. E7 — Specialist care records & field capture (§17.1, §19a, §19b, §16a, §21 voice, §22 briefing/LW)

Depth in *what the carer records*, for the higher-acuity domains the generic task/obs engine can't
express. Reuses the schema-driven `fieldControls` renderer and the E1 protocol runner.

- **Personal-care taxonomy (§17.1).** Structured personal-care task types (washing/dressing/toileting/
  continence/oral-care/eating-drinking/mobility/skin) as first-class templates with **dignity + consent
  prompts**, continence/Bristol capture where relevant, and skin-integrity → body-map hand-off. Files:
  `src/data/carer.js` (`PERSONAL_CARE_TAXONOMY` + evidence schemas), `src/screens/carer.js` (task sheet).
- **Condition-specific records (§19a).** Diabetes (BG + hypo protocol link to E1), epilepsy (seizure
  record → §51 runner), catheter/stoma (output + site), pain (scale + PRN link), mood/behaviour (ABC).
  **Cross-midnight fluid balance** with a target ring and running total; inline **last value within
  `[P-OBSWINDOW]`** on every obs. Files: `src/data/carer.js` (`CONDITION_RECORDS`, fluid-balance getter),
  `src/screens/carer.js` (obs sheets + charts tab).
- **End-of-life & palliative (§19b).** Comfort-care record (pain/agitation/secretions/mouth-care),
  **anticipatory (JIC) meds** surfaced in eMAR with the E1 safety rules, **ReSPECT / DNACPR** prominent on
  the person banner, verification-of-death hand-off to the §55.4 workflow. Files: `src/data/carer.js`
  (EOL record + anticipatory med flags), `src/screens/carer.js`, `src/carer/clientDetail.js`.
- **Reablement & outcomes (§16a).** Per-goal progress rating, **"do-with, not do-for"** prompts on tasks,
  step-down tracking, outcome trend surfaced to office. Files: `src/data/carer.js` (`REABLEMENT_GOALS`),
  `src/carer/clientDetail.js`, `src/screens/carer.js` (task prompt).
- **Voice notes (§21).** `MediaRecorder` capture on notes/incidents, **consent-gated**, append-only,
  playback + delete-with-reason; graceful fallback to text if unsupported/denied. Files:
  `src/screens/carer.js` (notes/incident sheets), `carerStore` (`saveVoiceNote`, blob→dataURL persist).
- **Pre-visit briefing + lone-worker (§22).** Risk/hazard briefing surfaced **before check-in** on the
  Overview brief; **periodic lone-worker check-ins** `[P-LWCHECKIN]` with escalation via §48 if missed;
  SOS raised as a §48 alert (unify with E1). Files: `src/screens/carer.js` (Overview + LW timer), 
  `officeBridge` (LW/SOS alerts), `src/data/carer.js` (`PARAMS.LWCHECKIN_MIN`).
- **ACs targeted:** AC-17.1x, AC-19a.x, AC-19b.x, AC-16a.x, AC-21.x (voice), AC-22.x (LW/briefing).

## C4. E8 — Enterprise QA, accessibility, i18n & spec traceability (§24, §34, §35, §38, §42, §52/§56/§57/§58)

The capstone that makes the prototype read as production-grade. This is the "top-notch / enterprise
quality" gate — it does not add features so much as **prove** the ones built meet an enterprise bar, and
finishes the two remaining doc-owned deliverables.

- **Translation aid (§24).** Common-phrase translation with read-back, per-person **language-of-record**
  capture, and a visible "machine-assisted, not certified" label. Files: `src/carer/inbox.js` +
  `src/screens/carer.js` (phrase panel), `src/data/carer.js` (phrase catalog + `person.language`).
- **Accessibility audit (§34 / Appendix D).** Full WCAG 2.2 AA pass over *all* carer screens: ≥44px
  targets, visible focus order, AA contrast on every token, **dynamic text scaling** end-to-end, no
  colour-only meaning, ARIA labels/roles on custom controls (sheets, tabs, body-map, signature). Produce a
  short a11y-audit checklist with pass/fail per screen. Files: `src/carer/frame.js`, `src/style.css`
  (token contrast), sweep across `src/carer/*` + `src/screens/carer.js`.
- **Performance & state sweep (§35/§38).** Explicit **loading / empty / error / offline** states on every
  *new* E4–E7 screen (reuse `emptyState()` and the §2 baseline); basic perf budget (no layout jank on the
  visit workspace, list virtualisation note where lists are long). Force each state in the demo script.
- **Records-integrity polish (§36 re-use).** Confirm append-only + amendment-with-reason holds across the
  new record types added in E6/E7 (voice, comfort record, night rounds, equipment) and that each surfaces
  in `officeBridge` audit.
- **Spec-traceability matrix (§42, §52, §56, §57, §58).** A single `docs/spec-traceability-v3.4.md`:
  every §/AC → **Demonstrated in prototype** / **Partial** / **Backend-or-assurance-owned (B4)**, with the
  file/route that shows it. Reference (not build) the standards register (§57) and RACI ownership (§58);
  restate the §56 v1 baseline and §52 platform/NFR commitments as pointers. This is the artefact an
  enterprise buyer/CQC reviewer would ask for.
- **ACs targeted:** AC-24.x, AC-34.x + Appendix D, AC-38.x; plus the traceability doc satisfying the
  "demonstrated vs owned" expectation across §42/§52/§56/§57/§58.

## C5. Verification (Part C)

- `npm run build` clean + 0 console errors after **each** of E6/E7/E8.
- Drive the new journeys via Claude Preview MCP and assert `carerStore` persistence (reload survives):
  (1) telephone visit → call-attestation replaces geofence; (2) supported-living shift → two people
  recorded with correct attribution; (3) access-failure → alert + leave-safe outcome; (4) night round
  logged + cross-midnight fluid total correct; (5) equipment LOLER-due warning + low-consumable alert;
  (6) condition record (BG hypo) auto-launches the E1 protocol runner to closure; (7) EOL anticipatory
  med respects E1 safety rules + DNACPR banner shows; (8) voice note captured, consent-gated, append-only;
  (9) missed lone-worker check-in escalates via the §48 state machine; (10) translation phrase read-back;
  (11) a11y: keyboard-only traversal of the visit workspace + dynamic-type at 200%.
- Screenshot flagship additions (night quiet-mode, supported-living attribution, EOL comfort record,
  voice note, equipment register, a11y focus states).
- **Regression gate:** re-run the E1–E3 safety journeys (wrong-person, two-field eMAR, med block, protocol
  closure, key-safe re-mask, draft resume) + Part-A checks — no regressions before E8 sign-off.
- E8 exit criterion: **spec-traceability matrix complete** and every §1–§58 row has a status.

## C6. Open decisions to confirm during Part C

1. Night shifts: model as one long shift-level session, or a sequence of round "mini-visits"? (recommend
   shift session + rounds sub-log for cleaner cross-midnight totals.)
2. Voice notes: persist as base64 dataURL in `localStorage` (simple, size-capped) vs IndexedDB blob
   (larger, more code)? (recommend dataURL with a length cap for the prototype.)
3. Translation: static curated phrase catalog (reliable, offline) vs a mock "live translate" field?
   (recommend curated catalog — deterministic for demo, no external call.)
4. Traceability doc location: `docs/` in-repo (recommend) vs alongside the plan in `~/.claude/plans/`.
5. Personal-care taxonomy depth: full §17.1 set now, or the high-frequency subset (wash/dress/toilet/
   continence/eat-drink) first?

---
---

# PART D — Comprehensiveness audit (AC-level) & the gaps it closes

> Parts A–C mapped the spec at **section granularity** ("all 58 sections mapped"). A second, **AC-level**
> re-read of v3.4 (every acceptance criterion, plus Appendices A–H, the §7 parameter table, the §40
> DCB0129 hazard register H1–H38, and the §42.1 concurrency-test register) found that several sections
> were mapped by *title* but their **material behaviour was never scoped into a phase** — and a repo probe
> confirmed the corresponding features are **absent from the codebase** (0 files) as well as the plan. These
> are the true comprehensiveness gaps. Part D scopes them (**E9, E10**), hardens the E8 assurance capstone,
> and adds the **full §1–§58 + appendix + hazard coverage matrix** that proves nothing is unaccounted for.

## D1. Gaps found (mapped-by-title, unscoped-in-fact) — all confirmed absent in repo

| # | Spec area | Missing behaviour (ACs) | Severity | Now in |
|---|---|---|---|---|
| G1 | **Medication order lifecycle & reconciliation §49** | versioned orders `Draft→Active→Superseded…` (AC-49.1/1a), reconciliation states + "changed since last visit" (AC-49.1b/49.2), external/other-administered verification (AC-49.3), covert-under-MCA (AC-49.4), stopped-order-while-offline conflict, stop wins (AC-49.10) | **Critical** (Core v1 safety) | **E9** |
| G2 | **Observation depth §19** | value validation / impossible-value / repeat-reading (AC-19.17), repositioning chart across carers (AC-19.15/16), structured body-map vocabulary (AC-19.20), personal-baseline-≠-NEWS2 (AC-19.19), device pairing + measure-vs-record time (AC-19.4/19.18), trend view (AC-19.13), monitoring schedule (AC-19.14) | **Major** | **E9** |
| G3 | **CD witness governance §18.1** | witness eligibility rule (AC-18.18), no-eligible-witness fallback (AC-18.19) | Major | **E9** |
| G4 | **Roles & permissions §5** | three-tier Carer/Senior/Team-lead model, elevated-action gating, per-action audit (AC-5.1–5.3) | **Major** (cross-cutting) | **E10** |
| G5 | **Non-visit Jobs §17** | Jobs view Today/Week/Month/Overdue (stock/policy-read/vehicle-PPE/timesheet), recurrence, evidence-required, escalation (AC-17.1–17.4); task method/rationale + support level (AC-17.5/17.6) | Major | **E10** |
| G6 | **Change-request loop & handover governance §24** | field→office tracked change request against plan/task/med (AC-24.3, "key differentiator"); handover-note-not-a-shadow-care-plan (AC-24.5); cross-shift unresolved-safety handover w/ ownership ack (AC-24.6) | **Major** | **E10** |
| G7 | **Documents & reports §29a/§29b** | open care docs offline + daily log (AC-29a.1/2); print/export hardening — recipient-verify, watermark, share-reason, export-expiry, no-Downloads-file, approved-targets (AC-29a.6); carer reports set (AC-29b.1–3) | Major | **E10** |
| G8 | **SOS resilience & carer-harm §22** | carer-directed-harm flow (AC-22.4); SOS-no-service "not transmitted" + retries + duress-safe cancel + server-side missed-check-in (AC-22.5/22.6) | Moderate | **E10** |
| G9 | **Notification-denial policy §33** | delivery-state tracking provider/delivered/seen/ack (AC-33.4); denial hard-policy blocks safety-critical work until fallback (AC-33.5, hazard H26) | Moderate | **E10** |
| G10 | **Assessments & continuity §23.3/§15** | carer completes/updates/flags-for-review assessments (AC-23.9); regular-clients continuity + lead-carer client relationship (AC-15.4/15.5) | Minor | **E10** |
| G11 | **Client-money offline overspend §26** | physical opening/closing count, offline limit, stale-balance block (AC-26.7) — E4 built expenses but not the client-money cash-safety gate | Moderate | **E9** (money-safety) |
| G12 | **Assurance traceability §40/§42.1/App A** | H1–H38 hazard→control→test map; §42.1 24-scenario concurrency register; Appendix-A edge transitions (backfill Manual-exception, cancel-after-check-in, reopen-for-record-completion, mid-visit carer handover, escort-ends-off-site) | **Major** (enterprise) | **E8 (expanded)** |

## D2. E9 — Medication order lifecycle, observation integrity & cross-carer safety *(patient-safety; build with/after E1)*

Closes the highest-risk gaps. Reuses the E1 eMAR engine, `MED_RULES`, `PARAMS`, `officeBridge`.

- **Medication order lifecycle & reconciliation (§49, AC-49.1–49.4/49.10).** Add `MedicationOrder` +
  `OrderVersion` to `data/carer.js` with states `Draft→Pending→Active→Suspended→Superseded/Discontinued/
  Completed/Expired`, `effectiveFrom`, prescriber/source, review date; carer administers **only against the
  currently-effective version**. Reconciliation entity + **"medication changed since last visit"** banner
  (§15/§19 flag) with states `Pending→Under review→Clarification→Confirmed/Rejected/Resolved`; **unresolved
  reconciliation blocks the affected medicine** (withhold/contact) except via the E1 stale override.
  **External/other-administered** capture with verification fields (who/role/time/how-verified/affects-
  interval). **Covert-under-MCA** gated on a recorded best-interests authorisation (§16 CAPACITY). **Stopped-
  order-offline conflict:** an admin against a since-stopped order surfaces on the office loop as a
  reconciliation event; **stop/most-recent wins**, prior dose flagged for review. Files: `data/carer.js`,
  `src/screens/carer.js` (med sheet), `officeBridge`.
- **Observation integrity (§19, AC-19.13–19.20).** **Value validation** (physiologically-impossible / unit-
  mismatch / decimal-slip → correction prompt + repeat-reading offer) before a reading can drive escalation;
  **personal-baseline alert kept distinct from the standard NEWS2 score** (baseline changes *alerting* only);
  **structured body-map vocabulary** (site, L/R, front/back, wound type, category, L×W×D, exudate, odour,
  infection signs, review-due, photo-quality) replacing free-form marks; **repositioning chart** with last-
  turned/next-due/overdue **across visits & carers** + missed-turn flag (shares the E6 night-round model);
  **trend view** (already in Charts — extend to full time-series) + **monitoring schedule** ("BP ×2/day for
  7d", who requested, end date); **device-pairing** stub storing device id/model + measure-time-vs-record-
  time. Files: `data/carer.js` (obs config + validation ranges), `src/screens/carer.js` (obs sheets + body
  map), `src/carer/clientDetail.js` (trends).
- **CD witness eligibility & fallback (§18.1, AC-18.18/18.19).** Enforce the configured witness-eligibility
  rule (on-duty · present · medication + CD competency valid · different authenticated account · independent
  confirm; remote prohibited by default); when no eligible witness, offer the **defined logged fallback**
  (`pending-witness` / on-call CD lead / policy deferral) so the carer is **never trapped in an open round**.
  Files: `src/screens/carer.js` (CD sheet), `data/carer.js` (witness rule).
- **Client-money cash-safety gate (§26/§32, AC-26.7/32.4).** Add to the E4 money screen: mandatory physical
  **opening cash count**, last-confirmed balance + timestamp, **offline-spend limit**, high-value approval,
  **change-returned + closing count**, **stale-balance block/office-contact**, "balance could be incomplete"
  warning. Files: `src/carer/money.js`, `carerStore` (balance freshness).
- **ACs:** AC-49.1–49.4, 49.10; AC-19.13–19.20; AC-18.18/18.19; AC-26.7/32.4.

## D3. E10 — Roles, jobs, change-requests, documents & comms completeness *(operational completeness)*

- **Role & permission model (§5, AC-5.1–5.3).** Extend the session with a `role` (Carer / Senior carer /
  Team lead); gate spot-checks (§55.1), CD witness (§18), competency sign-off (§28), ad-hoc-visit create,
  triage-another's-flag; **every elevated action records the acting role** to the office audit. Add a role
  switcher to the carer-app demo shell. Files: `src/carer/session.js`, `officeBridge` (role-stamped audit),
  gated call-sites.
- **Non-visit Jobs (§17, AC-17.1–17.6).** A **Jobs** surface (Today/Week/Month/Overdue) for stock checks,
  policy read-and-sign (§29), vehicle/PPE checks, timesheet submission (§27), errands, spot-checks; recurring
  jobs regenerate; evidence-required jobs can't close without it; overdue mandatory escalates. Add **method/
  rationale + care-plan-link** and **support level (prompt/supervise/assist/fully-support)** to care tasks.
  Files: `data/carer.js` (`JOBS` catalog), new `src/carer/jobs.js`, `src/screens/carer.js` (task meta).
- **Change-request loop & handover governance (§24, AC-24.3/24.5/24.6).** From a visit, raise a **tracked
  change request** against a care-plan/task/medication (`Raised→Acknowledged→Actioned/Declined`) that does
  **not** mutate the plan (routes via `officeBridge`); enforce **handover-note-not-a-shadow-care-plan** (a
  lasting change must promote to an order/care-plan/risk/temporary-authorised-instruction-with-expiry); the
  **end-of-shift flow lists every open safety item** (open alerts, active protocol, PRN follow-up,
  reconciliation, stock/CD discrepancy, missed obs/reposition, unsynced critical record, open safeguarding,
  incomplete incident) and the **receiver acknowledges ownership**. Files: `src/carer/inbox.js`,
  `src/screens/carer.js` (change-request sheet + shift-summary), `officeBridge`.
- **Documents & reports (§29a/§29b, AC-29a.1/2/6, AC-29b.1–3).** A per-person **document set** (care plan,
  MAR, risk assessments, body maps, hospital passport, ReSPECT/DNACPR, daily log/care diary) openable
  offline; **field print/export hardening** — recipient verification, preview, minimum-necessary selection,
  watermark, share reason, export expiry, **no permanent Downloads file**, approved share-targets only,
  audited success+failure; carer **reports** (visit history, hours/earnings, CPD, compliance, person
  summary) within access scope. Files: `src/carer/clientDetail.js` (docs), new `src/carer/reports.js`,
  `officeBridge` (share audit).
- **SOS resilience & carer-harm (§22, AC-22.4/22.5/22.6).** Distinct **carer-directed-harm** report flow;
  **SOS-no-service** state ("not transmitted", retries, last-known-location store, duress-safe cancel, call-
  999 instruction, office-assumes-ownership confirmation), leaning on server-side missed-check-in. Files:
  `src/carer/meScreens.js` (safety/SOS), `officeBridge`.
- **Notification-denial policy (§33, AC-33.4/33.5).** Track distinct delivery states; **block safety-critical
  work when notifications denied** until enabled / verified SMS fallback / office authorisation. Files:
  `src/carer/notifications.js`, `src/carer/session.js` (shift-start gate).
- **Assessments & continuity (§23.3/§15, AC-23.9/15.4/15.5).** Carer can complete/update/**flag-for-review**
  assessments (not author determinations); **regular-clients continuity view** + **lead-carer client
  relationship** surfaced on visits and as default concern/change-request routing. Files: `clientDetail.js`,
  `clients.js`, `data/carer.js`.
- **ACs:** AC-5.1–5.3; AC-17.1–17.6; AC-24.3/24.5/24.6; AC-29a.1/2/6, AC-29b.1–3; AC-22.4/22.5/22.6;
  AC-33.4/33.5; AC-23.9; AC-15.4/15.5.

## D4. E8 (expanded) — assurance capstone now also carries hazard, concurrency & transition traceability

E8 gains three enterprise artefacts beyond the §/AC matrix already planned:
1. **DCB0129 hazard map (H1–H38).** A table Hazard → required control → phase that delivers it → the test
   that exercises it. Every one of H1–H38 must resolve to a demonstrated control or a B4 backend-owned flag.
2. **§42.1 state & concurrency register.** The 24 named scenarios (two offline carers on one PRN / on one
   client's cash; order stopped while offline; cancel-after-check-in; lease-expiry mid-visit; protocol
   withdrawn mid-emergency; person-switch with unsaved med fields; similar-name clients; paper+electronic
   overlap; submitted-note corrected offline; forced update with unsynced records; etc.) become explicit
   verification cases; each maps to its governing AC/hazard.
3. **Appendix-A visit-transition completeness.** Add the edge transitions the earlier phases skipped:
   **backfilled check-in = Manual-exception verification** (never clean-verified), **office cancels after
   check-in** (carer completes safe care then closes), **reopen-for-record-completion**, **mid-visit carer
   handover** (§55.3 ack, per-carer time), **escort ends off-site** (AC-14.11), **emergency departure /
   client-to-hospital mid-visit**.
4. **Full coverage matrix** (D5) embedded in `docs/spec-traceability-v3.4.md`.

## D5. Full v3.4 coverage matrix (every §, appendix, hazard-set → phase / status)

`Done` = built (per repo). `E#` = scoped in a plan phase (pending). `B4` = backend/assurance-owned (flagged).

| Spec | Coverage | Spec | Coverage |
|---|---|---|---|
| §1–§4 purpose/glossary/personas | n/a (doc) | §29 account/docs/compliance | Part A (P4) + **E10** (§29a/b) |
| §5 roles & permissions | **E10** (was unscoped) | §30 search / §31 help | **E4 (Done)** |
| §6 domain model | across E-phases | §32 offline & sync + freshness gate | **E5 (Done)** |
| §7 parameter table | **E1 (Done)** | §33 notifications + denial policy | E5 core + **E10** (AC-33.4/5) |
| §8 mental model / §9 day-in-life | Part A | §34 accessibility | E5 + **E8** audit |
| §10 auth/device security | **E5 (Done)** | §35 performance | **E8** (+ B4 NFR) |
| §11 Today | Part A + **E2 (Done)** | §36 records integrity/audit | **E5 (Done)** + E8 |
| §12 schedule/clocking | **E4 (Done)** | §37 retention/residency | B4 |
| §13 travel & navigation | **E4 (Done)** | §38 error/empty/failure states | Part A + **E8** sweep |
| §14 visit lifecycle & ECM | **E2 (Done)** | §39 analytics/telemetry | B4 |
| §14.1–14.4 types/SL/disrupt/night | **E6** | §40 clinical-safety hazards H1–H38 | **E8** hazard map |
| §14.5 double-up | **E2 (Done)** | §41 integration register | B4 (+ AC-41.1 degraded-mode noted) |
| §15 people + lead carer | Part A (P2) + **E10** | §42 metrics / §42.1 test register | **E8** |
| §16 care plan/consent/MCA | **E1 (Done)** | §43–§46 scope/decisions/edge/pointers | doc + **E8** ref |
| §16a reablement | **E7** | §47 onboarding/permissions/recovery | **E5 (Done)** |
| §17 tasks + Jobs view | Part A + **E10** (jobs/AC-17.5/6) | §48 alert state machine | **E1 (Done)** |
| §17.1 personal-care taxonomy | **E7** | §49 order lifecycle & reconciliation | **E9** (was unscoped) |
| §18 eMAR | **E1 (Done)** | §50 break-glass / key-safe | **E3 (Done)** + **E5 (Done)** |
| §18.1 CD governance + witness rule | E1 + **E9** (AC-18.18/19) | §51 emergency protocols | **E1 (Done)** |
| §19 obs/deterioration/body maps | E1 core + **E9** depth | §52 platform/release/assurance | B4 + **E8** pointers |
| §19a condition-specific | **E7** | §53 lawful-basis sharing | **E5 (Done)** |
| §19b end-of-life | **E7** | §54 AIS | **E3 (Done)** |
| §20 equipment/LOLER/IPC | **E6** | §55.1–.5 spot-check/lead/handover/death/absence | **E4 (Done)** |
| §21 notes/media/voice | **E3 (Done)** + **E7** voice | §55.6 drafts | **E3 (Done)** |
| §22 lone-worker/SOS | Part A + **E7** + **E10** resilience | §55.7 completion controls | **E2 (Done)** |
| §23 incidents/safeguard/restraint/WB | **E3 (Done)** + **E10** (§23.3) | §55.8 config governance | **E5 (Done)** |
| §24 comms/handover/change-request | Part A + **E10** (AC-24.3/5/6) | §56 v1 baseline / §57 standards / §58 RACI | **E8** doc |
| §25 feedback | **E4 (Done)** | Appendix A transitions | **E8** completeness |
| §26 client money & expenses | E4 expenses + **E9** cash-safety | Appendices B–H | E5/E8 (matrices) |
| §27 earnings & pay | **E4 (Done)** | | |

**Result:** every §1–§58, every appendix, and hazard-set H1–H38 now resolves to a phase or a B4 flag. No
section is mapped by title alone.

## D6. Updated sequencing & verification

- **Sequence (by patient-safety value):** E9 (with/right after E1 — medication-order safety is Core v1) →
  E6 → E7 → E10 → E8. E8 remains the final gate.
- **Verification adds:** the §42.1 24-scenario concurrency register, the H1–H38 hazard-control check, and the
  Appendix-A edge transitions become explicit Preview-MCP test cases; E8 cannot sign off until the coverage
  matrix (D5) is complete and every hazard resolves.

## D7. Honest status note

**Update (2026-07-02): the plan is complete.** E1–E10 and the E8 assurance expansion are now **built** at
prototype fidelity and verified in the running app. The Core-v1 risk this note originally surfaced —
**G1 (§49 medication order lifecycle & reconciliation)** — is delivered: versioned orders, effective-version-
only administration, a "changed since last visit" reconciliation block, external/other-administered
verification, covert-under-MCA gating, and the stopped-order-offline conflict (stop wins). Alongside it E9
delivers CD witness eligibility + logged fallback, observation integrity (impossible-value guard, cross-carer
repositioning, monitoring schedules, structured wound vocabulary) and the client-money cash-safety gate; E10
delivers three-tier roles + gated elevated actions, non-visit Jobs, the tracked change-request loop +
open-safety-items handover, offline documents + hardened export + carer reports, SOS-no-service resilience,
the notification-denial policy and assessments/continuity; and the E8 capstone ships an **in-app assurance
register** (`carer/assurance.js`, `data/assurance.js`) carrying the DCB0129 hazard map H1–H38, the §42.1
24-scenario concurrency register and the Appendix-A visit-transition set. Live coverage is tracked in
[`spec-traceability.md`](spec-traceability.md). Everything remains front-end/simulated — the B4
backend/assurance dependencies (§52/§57/§58, real ECM/geofence/prescribing engines) are still named, not built.

---
---

# PART E — Residual AC-level gaps (verified against `src/` on 2026-07-02) & e-learning scope

> D7 marks the phases **complete** and the structural modules are indeed built (E9 `medOrders.js` /
> `obsIntegrity.js`, E10 `changeRequest.js` / `jobs.js` / `reports.js`, E8 `assurance.js`, roles,
> cash-safety). But a **reverse AC-level audit against the code** found a set of fine-grained behaviours
> that are required by v3.4 yet still **absent in `src/`** (grep-verified 0 hits). "Phase complete" ≠
> "every AC built". Full checklist: [`spec-gaps-v3.4.md`](spec-gaps-v3.4.md); market context for the
> training/docs items: [`competitor-practice-notes.md`](competitor-practice-notes.md).

## E.1 Residual gaps still absent in code

**Important distinction:** `assurance.js` **renders the Appendix-A transition set and H1–H38 hazard map as
an in-app register** (the traceability artefact). That is *documentation in-product* — it is **not** the
same as building each transition as a working flow or each hazard's control. Several rows below are
"registered but not built as behaviour".

**Tier 1 — safety-critical, still unbuilt:**
- §49 **urgent verbal orders** (time-limited, expire if unconfirmed) — order spine exists, verbal capture doesn't.
- §49 (AC-49.1a) **two-person verification of high-risk order changes** (`twoPerson` today = two-carer tasks + CD witness only).
- §51 / H29 (AC-51.6–51.8) **stale-protocol urgent recall + safe generic 999/111 fallback** — runner has 999/111 contacts but no stale-library recall/refuse.
- §51 / H30 **emergency-contact-failure → alternative route.**
- §14.30 **welfare-check-before-submit gate when a time-critical visit is called off** — welfare is captured at check-in only.
- §18.13 **repeated-refusal pattern across visits → concern/alert.**
- App A **wrong-visit/wrong-person *void* flow** (banner + confirm exist; the "void, no clinical record carried over" flow is only in the register).

**Tier 2 — medium, still unbuilt:**
- §49 special meds & stock: warfarin/INR chart, homely remedies/OTC, cold-chain/expiry flags, tapered/antibiotic courses, away-from-home meds, NatPSA surfacing, CD stock-lifecycle events (`MedicationStockEvent`).
- Appendix-A transition **flows** (register → behaviour): cancel-mid-travel, visit reassigned/removed, forgot-checkout (declared-vs-estimated end), office-force-close-abandoned, temporary-departure-&-return, whole-visit-refusal (AC-14.33).
- AC-33.1 **quiet-hours withhold/digest** (distinct from `night.js` quiet-UI); AC-36.4 **audit-on-view**; AC-38.4 **device-health nudges** (low storage/battery); AC-34.4 **multi-modal/haptic confirmation**; AC-47.3 **lost-device report + remote-wipe**.
- AC-29.4/29.5 **carer compliance-doc upload + verification** (`reports.js` is export/share, not doc intake).
- AC-28.7 **task-level training hard-gate** (training tracked; hard-gate not evidenced — see E.2).
- §17.1 **personal-care competency gating** (`minRole` gates jobs, not care tasks).

## E.2 E-learning, training & compliance-docs — scope note (from competitor research)

Market research ([`competitor-practice-notes.md`](competitor-practice-notes.md), ~13 vendors) sharpens
how these should be modelled at prototype fidelity:

- **Learning centre:** don't rebuild an LMS. Model **in-app compliance status + certificate viewer +
  SSO/link-out to a partner LMS**. Content spine = **Care Certificate 16 standards** (2025 revision;
  Standard 16 = Learning Disability & Autism), treated as versioned. **Differentiator (unowned by the
  market):** client-condition-triggered **just-in-time micro-lesson** surfaced on the visit + an
  **offline-cached lesson** (offline-first advantage). Keep **e-learning completion and observed
  competency sign-off as two separate objects** (Access eCompetency is the exemplar).
- **Training gate (AC-28.7):** the market enforces **soft** (warn + override-with-logged-reason);
  nobody hard-gates a clinical task. Adopt a **configurable hard-gate on high-risk tasks only**
  (medication, moving-&-handling, PEG, catheter, insulin), paired with the market-normal **override-
  with-reason + office alert** so it degrades gracefully. Capture the override reason as CQC evidence
  (Single Assessment Framework "processes"). This is a conscious beyond-market safety choice.
- **Documents — who updates them:** care plans are **office-authored, carer read-only**; corrections
  flow via the **tracked change-request** already built (`changeRequest.js`) — confirmed a genuine
  differentiator (no competitor ships a structured plan-linked change-request). Daily logs are
  **carer-authored, append-only/amend-with-reason** (spec §21/§36 sits at the strong end of the market
  spectrum). Staff compliance docs are **office/HR-managed**, so AC-29.4/29.5 should be
  **office-managed with optional carer-submit-for-verification** — the *verified* state stays office-owned
  (CQC Reg 19); self-upload is not the market norm.

## E.3 Recommended next build
Fold the §49 special-med/stock + verbal-order + two-person-order-change items into **E9**; add an
**E11 — "protocol resilience & lifecycle-transition completeness"** for §51 H29/H30, §14.30, §18.13 and the
Appendix-A transition *flows* (register → working behaviour); run the cross-cutting AC items
(33.1/36.4/38.4/34.4/47.3/29.4-5) plus the e-learning/compliance model as the **E8 capstone's final sweep**.

---

## E.4 Workforce self-service gap — current state (code-verified 2026-07-02)

The §12/§28 workforce/self-service surfaces are **display-only stubs**, not functional:
- **`renderTraining()`** ([`carer/meScreens.js`](../src/carer/meScreens.js)) — a hardcoded list of 5 certs
  with static "Expires …" strings; the only action is a toast. No course catalogue, learning player,
  skills matrix, document upload, or real expiry engine.
- **`renderAvailability()`** — a hardcoded 7-day array + one static open shift. No rolling working pattern,
  no n-week cycle, no start-date anchor.

So **e-learning centre, training/CPD records, skills matrix, staff-document upload+expiry, and CM2000-style
working patterns are all unbuilt.** Market research ([`competitor-practice-notes.md`](competitor-practice-notes.md)
§5–§6) shows several of these are also *market gaps*, so they double as differentiators.

## E.5 — E12: Learning, skills, staff documents & working patterns *(workforce self-service)*

> **✅ BUILT & browser-verified 2026-07-02.** The **learning centre has a real, persisted completion loop**
> — open course → lesson → knowledge check (wrong answer blocked, correct passes) → completion is saved to
> `carerStore` (survives reload), issues a certificate, bumps the CPD total, and **renews the matching
> training-matrix record** (e.g. complete BLS → BLS flips Expiring→Valid); Care Certificate 16-standard
> drill-down + JIT micro-lesson included. Other E12 screens (skills, staff-docs) are display + toast at
> prototype fidelity; the working pattern is projected/read-only in-app (pattern *editing* stays
> office-owned as designed).
> Shipped: `data/carer.js` (`WORKING_PATTERN` + anchor resolver `cycleWeekFor`/`patternWeek`,
> `LEARNING_COURSES`/`JIT_LESSON`, `SKILLS`, `TRAINING_RECORDS`+`expiryStatus`, `STAFF_DOCS`);
> `carer/meScreens.js` (`renderAvailability` rolling-pattern view + "Week N of M" preview; `renderTraining`
> real expiry engine + matrix); new `carer/learning.js`, `carer/skills.js`, `carer/staffDocs.js`; routes
> `#/carer/me/learning|skills|documents` + Me-hub "Learning & development" group. Verified: cycle-week
> resolves correctly (Week 1→2 of 4), CPD/attention counts + expiry states compute from the demo clock,
> clean build (71 modules), no console errors.

A new phase closing the E.4 gap. Same prototype-fidelity principles (simulate mechanisms, one `PARAMS`
source, extend-don't-fork). Ties to E10 roles (`minRole`), E4 (§12/§28), and the AC gaps 28.7 / 29.4-5 / §17.1.

### E12.1 Working patterns / rolling rota (§12, CM2000 model)
- **Data model:** a `WORKING_PATTERN` = `{ cycleWeeks: 1|2|4, anchor: '<week-commencing Monday>', weeks: [ [7 day-slots] × cycleWeeks ] }`. Each slot = off / available / shift(times) / visit-run.
- **Resolution (the anchor arithmetic):** `cycleWeekIndex = floor(weeksBetween(anchorMonday, targetMonday)) mod cycleWeeks`; look up the day slot inside that cycle-week. Mirrors Access People Planner's `order` + `Apply From W/S Date`.
- **Projection:** generate this-week / next-week / week-ahead from the pattern (not hand-built weeks). Replaces the static `renderAvailability` week.
- **Overrides vs pattern edits:** one-off changes, sickness cover and leave are **overrides on generated occurrences** — they do **not** mutate the pattern. A genuine pattern change is **effective-dated** (new `anchor` / apply-from). Rule to replicate: editing the *current* generated week propagates forward; editing a *past* week is a one-off.
- **Carer-facing differentiator:** show an explicit **"you're in week 2 of 4 — rolling preview"** + contracted-hours-vs-rostered view. No UK domiciliary carer app surfaces the cycle object to the carer — this is a genuine value-add, not a copied convention.
- **PARAMS:** `PATTERN_CYCLE_MAX` (e.g. 4), pattern anchor stored per carer.

### E12.2 Learning centre (§28, differentiator)
- In-app **course catalogue** — Care Certificate **16 standards** (2025; Std 16 = Learning Disability & Autism) + mandatory + condition modules + refreshers; each course = simulated **video + quiz** → completion → **certificate + CPD record**. (In-app course-taking is rare: even Nourish only *links* a partner LMS — myAko — into Empower, with completion/offline unconfirmed and assignment/matrix office-side; a native, offline-capable in-app centre is unowned.)
- **Just-in-time client-condition micro-lesson** surfaced on the visit Overview (ties to E4/E7) + **offline-cached "next lesson"** — both unowned by the market.
- Model as **in-app centre that simulates SSO/link-out** (labelled machine-assisted, prototype-fidelity), not a real LMS rebuild.

### E12.3 Skills & competency (§17.1, §28, AC-28.7)
- Per-carer **skills/competency register + carer-visible matrix** (status: valid / expiring / expired / not-held). Carer-facing skills view is essentially unseen in the market → differentiator.
- **Two tracks kept separate:** e-learning completion vs **observed competency sign-off** (role-gated via E10 `minRole` — a senior signs off; Access eCompetency is the exemplar).
- **AC-28.7 gate:** on high-risk gated tasks (medication, moving-&-handling, PEG, catheter, insulin) an expired competency triggers a **configurable hard-gate** with the market-normal **override-with-logged-reason + office alert** (soft path). Beyond-market safety choice, kept configurable.

### E12.4 Training records & expiry engine (§28)
- Replace the hardcoded cert list with **real records** (name, issued, validity period → computed valid/expiring/expired), a **matrix**, and book-/complete-refresher that updates the record.
- **Expiry alerting to the carer** (e.g. 60/30-day) — most vendors only alert the manager; notifying the carer of their own expiries is a differentiator. `PARAMS.TRAINDUE` already exists — reuse.

### E12.5 Staff documents & upload (§29, AC-29.4/29.5, market gap)
- **Carer self-uploads own compliance docs** (DBS, right-to-work, certificates) from the app → **carer-submit → office-verify** state machine (`Submitted → Verified / Rejected`). **No vendor is documented doing carer self-upload from the app** → clear differentiator.
- Carer sees **own document expiry warnings**; the **verified** state stays office-owned (CQC Reg 19) — the carer can submit but never self-approve.

### E12 ACs / verification
- Pattern math: anchor + `mod cycleWeeks` resolves the correct cycle-week for any date; reload survives; overrides don't mutate the pattern; effective-dated re-anchor changes future only.
- Learning: course → quiz → completion → CPD record + certificate persists; JIT lesson surfaces for the right client condition.
- Skills/training: expired competency hard-gates a high-risk task (with override-reason logged); carer expiry alert fires.
- Docs: carer submit → office verify → verified badge; expiry warning on own doc.

### Sequencing
E12 slots after E11 (or in parallel — it shares no engine with the protocol/transition work). It is
**breadth/self-service**, lower patient-safety risk than E9/E11, so it should not sit ahead of the §49 and
§51 residual-safety items.

## E.6 Competitor feature-parity sweep (Nourish 9-product suite + Birdie) — gap map & decisions

Full-suite sweep (2026-07-02; catalogue + parity table in [`competitor-practice-notes.md`](competitor-practice-notes.md)
§7). Finding: **carer-facing clinical/visit parity is strong and in places ahead** (order lifecycle,
protocol runner, lone-worker/SOS — Birdie has no discrete lone-worker module). Net-new carer-app candidates
are few; most competitor breadth is office-facing or backend (correctly out of a carer prototype's scope).

### E13 — Care-record breadth from competitor parity *(new, carer-app-relevant)*
- **E13.1 Validated assessment library (§15/§16/§23.3).** A catalogue of validated assessments — **Waterlow** (pressure ulcer), **MUST**/nutrition, **MCA**, **moving-&-handling**, **COSHH**/environmental, falls — as first-class templates with a **recommendation engine** (e.g. mobility flag → suggests moving-&-handling), **review-due reminders**, and carer complete/flag-for-review (ties to the E10 change-request, not carer-authored determinations). Birdie ships 25+; we have only consent/MCA + reablement. Files: `data/carer.js` (`ASSESSMENTS` catalogue + schemas), `carer/clientDetail.js`, `screens/carer.js` (assessment sheet reuses `fieldControls`).
- **E13.2 Emergency admissions / hospital pack (§29a, Appendix-A hospital transition).** A one-tap **"hospital pack / red-bag"** surfacing the person's vital info (allergies, DNACPR/ReSPECT, meds, conditions, key contacts, hospital passport) for a high-pressure admission, wired to the mid-visit **client-to-hospital** transition (which is also an E11 Appendix-A residual). Reuses break-glass minimal-profile + protocol contacts. Files: `carer/clients.js`/`clientDetail.js`, `screens/carer.js`.
- **E13.3 (optional) AI-assisted recording — simulated.** A prototype-fidelity simulation of Birdie **SmartPlans** / Nourish Confidence AI: "record a note → suggested structured entry with a visible source snippet ('receipt'), high-risk clinical fields left to the human." Clearly labelled machine-assisted, deterministic mock (no real model). Differentiator; **optional** — only if a demo-visible AI story is wanted. Files: `screens/carer.js` (notes/assessment), `data/carer.js` (mock suggestion map).
- **Verification:** assessment recommended by a client flag → completed → review-reminder fires; hospital pack surfaces correct vitals and links from the hospital-admission transition; (if built) AI suggestion shows a source snippet and leaves high-risk fields blank.

### Explicitly OUT of carer-app scope (noted, not built)
- **Family portal** (Birdie Family App / Nourish Circles of Care) — a separate family-facing surface, like the office UI; out of the single-surface carer prototype. Record as a named adjacent product, not a carer-app feature.
- **Office analytics & governance** — Birdie **Q-Score**/Pulse/Explore, Nourish **Insights** dashboards, **Confidence** audit-suite + Action Tracker + AI care-plan assurance, **Transparency** needs/staffing/funding alignment. These are office/manager surfaces; our equivalent is the `officeBridge` hand-off + the E8 assurance register. B4/office-owned.
- **MDM** (Nourish **Protect**: encryption, remote-wipe, lockdown, geofenced policy, auto-update) — this is §10/§52 device security, already flagged **B4**.
- **Backend catalogs/integrations** — dm+d medicines dictionary, GP Connect, Radar Healthcare, Xero payroll, NMW top-up/holiday-accrual finance — **B4** (we simulate an order `source: 'GP Connect'` label only).

---
---

# PART F — Consolidated build index (route map + ordered feature/screen/journey master)

> Parts A–E accreted over time; the screen catalogue (Part A §4), sitemap (§3) and journeys (§5) covered
> only the *original* IA. Part F is the **single consolidated view**: every route reconciled with the code,
> every feature in build order with its screens + journeys + status, so nothing is "listed by title alone".
> Reconciled with `src/main.js` route table + module audit on **2026-07-02**.
> Status key: **✅ built · 🟡 stub/partial · 🧭 planned (not yet built) · ⛔ out-of-carer-scope/B4.**

## F.1 Route map / sitemap (authoritative, from `main.js`)

**Auth & shell**
`#/carer/login` ✅ · `#/carer/welcome` ✅ · `#/carer` Today ✅ · `#/carer/search` ✅ · `#/carer/notifications` ✅ · `#/carer/map` 🟡 coming-soon stub

**Day / schedule**
`#/carer/schedule` ✅ (static week — 🟡 no rolling pattern) · `#/carer/shift-summary` ✅ · `#/carer/night/:visit` ✅

**Visit workspace**
`#/carer/visit/:visit` ✅ (Overview · Tasks · MAR · Obs · Charts · Incident · Notes + sheets)

**Clients & care records**
`#/carer/clients` ✅ · `#/carer/clients/:id` ✅ · `…/careplan` ✅ · `…/meds` ✅ · `…/history` ✅ · `…/documents` ✅ · `…/mca` ✅ · `…/equipment` ✅ · `…/reablement` ✅ · `…/orders` ✅ (E9) · `…/reconcile` ✅ (E9) · `…/monitoring` ✅ (E9) · `…/assessments` ✅ (§23.3/§15 — 🟡 no validated-tool library yet)

**Comms**
`#/carer/inbox` ✅ · `#/carer/inbox/:threadId` ✅ · `#/carer/translate` ✅

**Me / workforce & safety**
`#/carer/me` ✅ · `…/timesheet` ✅ · `…/availability` ✅ (rolling working pattern, E12.1) · `…/training` ✅ (real expiry engine + matrix, E12.4) · `…/learning` ✅ (learning centre, E12.2) · `…/skills` ✅ (competency matrix, E12.3) · `…/documents` ✅ (staff-doc submit→verify, E12.5) · `…/settings` ✅ · `…/safety` ✅ · `…/help` ✅ · `…/sync` ✅ · `…/expenses` ✅ · `…/pay` ✅ · `…/absence` ✅ · `…/feedback` ✅

**Jobs / change / reports / assurance**
`#/carer/jobs` ✅ (E10) · `#/carer/changes` ✅ (E10) · `#/carer/reports` ✅ (E10) · `#/carer/export` ✅ (E10) · `#/carer/assurance` ✅ (E8)

**Safety / access**
`#/carer/alerts` ✅ · `#/carer/oncall` ✅ · `#/carer/breakglass` ✅ · `#/carer/share` ✅ (§53) · `#/carer/death` ✅ (§55.4)

**New routes — status**
`…/availability` working-pattern ✅ · `#/carer/me/learning` learning centre ✅ · `#/carer/me/skills` skills matrix ✅ · `#/carer/me/documents` staff-doc submit→verify ✅ · `…/assessments` → add **validated-tool library** 🧭 · **hospital/admissions pack** (surfaced from visit + `#/carer/clients/:id`) 🧭

## F.2 Master feature list — in build order (screens · journeys · status)

### Delivered (build order as shipped)
| Phase | Features | Screens / routes | Key journey | Status |
|---|---|---|---|---|
| **P0–P5** (Part A) | Shell + bottom-nav, Today hub, visit workspace, clients, inbox, me/safety, office loop, universal states | login/welcome, Today, visit/:id, clients/*, inbox/*, me/* | Standard visit end-to-end | ✅ |
| **E1** | Wrong-person banner+2-ID, two-field eMAR, 3 med-safety rules, protocol runner, consent/MCA, alert state machine | visit MAR/Obs sheets, `…/mca`, protocol sheet, `/alerts` | CD admin; abnormal-obs→protocol→closure | ✅ |
| **E2** | Geofenced check-in + fallbacks, welfare, leaving-safe, 5-dim outcome, double-ups, completion controls | visit check-in/out, `shift-summary` | Offline visit → sync | ✅ |
| **E3** | Key-safe mask/reveal, incidents/safeguarding/restraint, notes/photo/voice, drafts, AIS/phrasebook, pre-visit LW | visit Incident/Notes, `breakglass`, `translate` | Incident (fall) → INC ref → office | ✅ |
| **E4** | Schedule, travel, money/expenses, pay/timesheet, spot-checks, handover-ack, death, absence, feedback, search, help | `schedule`, `me/*`, `death`, `search` | Running-late / missed-visit | ✅ (training 🟡) |
| **E5** | Auth hardening, sync/stale leases, break-glass, lawful-basis share, notifications, WCAG, immutable audit | `me/sync`, `share`, `me/settings` | Stale-data warn→block | ✅ |
| **E6** | Visit-type breadth, supported-living, disruptions, night rounds/quiet-mode, equipment/LOLER | `night/:visit`, `…/equipment` | Night round → cross-midnight totals | ✅ |
| **E7** | Personal-care taxonomy, condition-specific records, EOL/anticipatory, reablement, voice, LW check-ins | visit sheets, `…/reablement` | EOL anticipatory med + DNACPR banner | ✅ |
| **E9** | Med **order lifecycle + reconciliation**, obs integrity (validation/monitoring/reposition), CD witness eligibility, cash-safety | `…/orders`, `…/reconcile`, `…/monitoring`, `me/expenses` | Changed order → reconciliation blocks admin | ✅ |
| **E10** | Roles+gating, non-visit **Jobs**, **change-request** loop, reports+**export hardening**, SOS resilience, notif-denial, assessments/continuity | `jobs`, `changes`, `reports`, `export`, `…/assessments` | Raise change-request → office ack | ✅ |
| **E8** | In-app **assurance register** (H1–H38 hazard map, §42.1 concurrency, Appendix-A transitions), traceability | `assurance` | Open assurance register | ✅ (final a11y/state sweep 🧭) |

### Remaining — recommended build order
| # | Phase | Features | Screens / routes | Key journey | Status |
|---|---|---|---|---|---|
| 1 | **E9-residual** | §49 verbal orders, special meds (warfarin/INR, homely remedies, cold-chain/expiry, taper/antibiotic course, away-from-home), two-person high-risk order-change, CD **stock-lifecycle events** | extend `…/orders`, MAR sheet | Verbal order → expires if unconfirmed | 🧭 |
| 2 | **E11** | Protocol resilience (H29 stale-recall + safe 999/111 fallback, H30 contact-failure route), §14.30 welfare-before-submit gate, §18.13 refusal-pattern detector, **Appendix-A transition flows** (mid-travel cancel, reassign/remove, forgot-checkout, office-abandon-close, temp-departure, whole-visit refusal) | protocol sheet, visit lifecycle, `assurance` links | Contact fails mid-emergency → alt route | 🧭 |
| 3 | **E13.1–13.2** | **Validated assessment library** (Waterlow/MUST/Braden scoring + recommendation engine, review reminders) extending the existing assessments screen; **Emergency/hospital admissions pack** (red-bag) | `…/assessments` (extend), hospital-pack sheet | Client flag → recommend Waterlow → complete → review-due | 🧭 |
| 4 | **E12** | **Working patterns** (rolling n-week rota, start-date anchor, projection, "week N of M" preview); **Learning centre** (Care Cert 16 std, JIT lesson, offline-tagged, CPD); **Skills matrix** (two-track); **Training records + expiry engine**; **Staff-doc submit → office-verify** | `me/availability`, `me/learning`, `me/skills`, `me/documents`, `me/training` | Set pattern → projected rota; take course → CPD; submit DBS → verify | ✅ built & verified 2026-07-02 (prototype fidelity) |
| 5 | **E13.3** (optional) | Simulated AI-assisted recording (SmartPlans-style, source "receipts") | notes/assessment sheets | Record → suggested entry, high-risk left blank | 🧭 opt |
| 6 | **E8-final** | Cross-cutting AC sweep: 33.1 quiet-hours digest, 36.4 audit-on-view, 38.4 device-health nudges, 34.4 multi-modal confirm, 47.3 lost-device/remote-wipe + full a11y/state sweep | `me/settings`, notifications, across screens | Quiet-hours suppresses; low-storage nudge | 🧭 |

## F.3 New end-to-end journeys (extend Part A §5)
13. **Rolling working pattern:** Me → Availability → pattern (week 2 of 4) → projected this-week/next-week rota → contracted-vs-rostered.
14. **Learning:** Me → Learning centre → assigned course → video+quiz → completion → CPD record + certificate; JIT client-condition lesson surfaced on visit Overview.
15. **Staff compliance doc:** Me → Documents → upload DBS/RTW/cert → *Submitted* → office verifies → *Verified*; own-expiry warning.
16. **Validated assessment:** Client → Assessments → recommended tool (mobility flag → Moving-&-handling / Waterlow) → score → outcome → review-due reminder.
17. **Hospital admission pack:** Visit → deterioration/decision → **hospital pack** (allergies/DNACPR/meds/contacts/passport) → mid-visit client-to-hospital transition (E11) → office notified.
18. **Protocol resilience:** abnormal → protocol → contact fails → **alternative route**; or cached protocol stale → **safe generic 999/111**, never blank.

## F.4 Variants & states
Every new screen inherits the Part A §2 baseline and the §7 variants sweep (loading · empty · error/retry ·
offline · permission-denied · role-variant · not-clocked-in · in-progress · completed/locked · abnormal/alert
· first-time vs returning). This is the completeness gate at build time — no new screen ships without it.
