# Carer app — ECM/CQC build-out · continuation brief

Read this first in a new chat to pick up exactly where the last session left off.
Companion docs: [`cqc-ecm-gap-analysis.md`](cqc-ecm-gap-analysis.md) (roadmap) ·
[`client-monitoring-charts-design.md`](client-monitoring-charts-design.md).

## Project
UK domiciliary-care **carer** mobile app (the carer's phone view, not the office system).
Vite + Alpine.js + Tailwind v4, hash-router SPA rendered inside a phone frame.
Repo/remote: **github.com/zeeshannawaz393/carerappzee** (branch `main`). Working dir
`E:\taskplanner\taskplanner`. Prototype persistence is localStorage via `carerStore`.

## How to work (the loop)
1. Edit → `npm run build` (must stay clean).
2. Verify **live** in the preview MCP: server `caretask`, **serverId `8c1c73f7-f9d7-4a6f-856a-c2f897f1c50a`**, port 5188.
   Pattern: `preview_eval` → `location.reload(true)`; wait ~1100ms; `window.__carerLogin()`,
   `window.__carerOnboard()`; set `location.hash`; find the Alpine component by scanning
   `[x-data]` for one with `observations`+`saveObs`; drive it via `window.Alpine.$data(el)`.
   The first eval after a reload often throws "Inspected target navigated" — just retry.
   Do NOT rapid-synthetic-click (freezes the renderer); set Alpine state directly.
3. Screenshot to confirm; check `preview_console_logs` level error.
4. `git commit` + `git push origin main`. Commit trailer:
   `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Commit per feature.

## The proxy pattern (IMPORTANT — user's explicit instruction)
The user wanted to be **replaced by a proxy agent** for questions/authorizations so work
continues without stopping for them. Spawn a persistent **product-owner / registered-manager
proxy** (general-purpose agent, run_in_background) and consult it via `SendMessage` for
prioritization/decisions instead of asking the user. Its ranked priority order was:
RESTORE2/SBARD → SOS → post-fall set → (then) handover-receipt, photo-consent → specialist
charts. Keep using it. Research is done — don't re-run it (7 agents already covered
ECM dashboards, CQC single-assessment framework, DSCR/WGLL/DSPT/GP Connect, competitor
charts, clinical frameworks; findings are in the two companion docs).

## Design conventions (match these)
- Font Plus Jakarta Sans; tokens `--color-ink-*`, `-primary-*`, `-teal-*`, semantic
  `success/warning/danger/info`. Components in `style.css @layer components`:
  `.btn`(+sm/md/lg + primary/secondary/ghost/danger/teal), `.field`(+`-sm`/`-md`),
  `.label`, `.badge`, `.card`, `.section-title`.
- Selection lists use ONE grouped container: `rounded-2xl ring-1 ring-ink-100 divide-y
  divide-ink-100 overflow-hidden`, rows tint `bg-primary-50` when selected (welfare, task
  outcomes, MAR, checklist all follow this — keep new ones consistent).
- Observation icons are colour-tinted per type via `obsTint(id)` in `screens/carer.js`.
- Bottom sheets: scrim `absolute inset-0 z-N bg-black/40 flex items-end` + panel
  `bg-surface rounded-t-2xl w-full min-h-[40%] max-h-[92%] flex flex-col overflow-hidden`,
  body has `sheet-body overscroll-contain`; background scroll locks while a sheet is open.

## Key files & systems
- **`src/data/carer.js`** — `OBSERVATION_TYPES` (add a type here → it flows through the
  Obs picker, record form, flagging, tasks, and can be charted). `evaluateObsFlag` rules:
  number `normalMin/normalMax`, score `escalateAtGte`, **checklist `abnormalIfAny`**,
  `abnormalValues` (string match; booleans use `['true']`). `VISIT_TYPES`/`VISIT_TYPE_META`,
  `ROTA` (visit `time: "HH:MM – HH:MM"`), `GEOFENCE`, incident types.
- **`src/screens/carer.js`** — the visit workspace (huge). `fieldControls()` renders field
  types (boolean/select/checklist/number/score/moodscale/textarea[`f.placeholder`]/photo
  [consent-gated]/bodymap). `bodyMapControl()` (max-width 420px). Component holds clock,
  geofence, `timing` (adherence), `sos`/`safetyCheckin`/`runningLate`, obs/task/med save,
  `obsTint`, `moodFace`. Clock-out is a SINGLE path: tabs show "Review & clock out" →
  `sheet='summary'` (review + signatures + the one gated clock-out) → leaving-safe.
- **`src/carer/obsIntegrity.js`** — the **client-record Monitoring charts** (`renderMonitoring`,
  route `#/carer/clients/:id/monitoring`). This is where new charts go. Structure:
  `TREND_HISTORY[suId]` = demo history per metric; helpers `section()`, `trendCard()`,
  `chip()`, `trendNote()`, `dayLabels()`, `liveOf(live,typeId)`; builders `buildTrends`
  (Tier1: hydration/nutrition/weight-MUST/bowels), `buildSafety` (med-adherence + falls),
  `buildClinical` (NEWS2 + glucose, condition-gated), `buildWellbeing` (mood/sleep/pain),
  `buildSpecialist` (behaviour/BPSD + seizures). **To add a chart:** add demo data to
  `TREND_HISTORY`, write a card in the right builder (blend demo + `liveOf` for "today"),
  derive a RAG `chip`. Targets are per-person (fixes the old visit-level flaw).
- `src/lib/carerStore.js` — `observationsForUser(suId)`, `allMeds()`, `allIncidents()`,
  `addMessage`/`addInbound`, `clockIn/Out`/`updateClock`, `repositions`.

## Done this session (17 commits, all live-verified)
Visit adherence (late/short/running-late/expected-out) · med-adherence + falls/incident
charts · one-tap SOS · RESTORE2 soft-signs + SBARD deterioration loop (`restore2` obs) ·
auto post-fall observation set on a fall (`postfall` obs, NG249) · checklist unified to
grouped-list · body map enlarged · photo-with-consent gating · oral-care obs · single
clock-out path (review+sign) · behaviour + seizure Specialist charts. Plus the earlier
Monitoring charts, mood face-scale, task↔obs linking, geofence auto-clock-out, `.field-sm`.

## REMAINING backlog (start here)
1. **Continence / catheter chart** — we capture the `output` obs (urine/catheter ml +
   colour with `abnormalValues: Dark/Cloudy/Blood-stained`). Add a Monitoring card: 24h
   voids / pad changes / catheter output total + colour trend (dark/cloudy/blood-stained →
   UTI/blockage flag). Likely a small new `continence` obs type (pad change / catheter care)
   plus a `buildSafety`-or-`buildSpecialist` card. Proxy: per-client depth, not safety-critical.
2. **Wound-healing tracker** (biggest) — extend the static `skin` body-map into a
   size/photo-over-time timeline per wound: store measurements + (consented) photos keyed
   to a body-map location, and render a per-wound timeline on the client record showing
   improving/deteriorating. Needs a small data model for a "wound" (id, site, measurements[],
   photos[]) and a timeline view.

## Out of scope (office/platform, do NOT build in the carer app)
Real-time missed-visit exceptions **dashboard**, on-time KPI analytics, statutory
notification (Reg 16/17/18) + Duty-of-Candour (Reg 20) **workflows**, GP Connect / shared-
care interoperability, DSPT/tamper-evident **audit infrastructure** (prototype uses
localStorage). Noted in the gap-analysis doc as platform work.

## Known caveats
Deterministic demo clock (`now()` in carerStore starts ~07:32, +4min/action) so visit
times/late-flags won't align with real schedules in the demo. Charts blend demo history +
live "today" because the prototype has no cross-visit history. `git` warns LF→CRLF on
Windows — harmless.
