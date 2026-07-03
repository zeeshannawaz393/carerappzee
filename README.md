# Care Task Template Library

An enterprise, governed **Care Task Template Library** for domiciliary / residential care
providers. It models the full care-delivery chain as four distinct layers:

```
Master Task Template  →  Task Pack  →  Service-User Task Plan  →  Visit Task Instance
   (reusable, governed)   (grouped)     (personalised per person)   (recorded by carers)
```

A template is **not** a live task — it is an approved, versioned blueprint. Templates are
personalised into a service user's plan, then generated into per-visit instances that carers
complete, refuse, miss or flag at the point of care.

Built as a clickable prototype with **Vite + Tailwind CSS v4 + Alpine.js**, a unified
clean design system (see below), and a schema-driven evidence engine.

### Design system (2026 refresh)

The whole app — carer + office — runs on one restrained, enterprise-grade design language:

- **Typeface**: **Plus Jakarta Sans**, shipped explicitly (previously the CSS asked for a
  font that was never loaded, so it silently fell back to the system font).
- **Light chrome**: headers blend into the canvas (no saturated blue bands); colour is
  reserved for status (allergy red, warning amber, success green) and a single primary accent.
- **De-boxed**: lists are grouped into one hairline-ruled card (`divide-y`) instead of stacks
  of ringed/shadowed boxes; a disciplined 5-step type scale; secondary text at a consistent tier.
- **Native-feel mobile**: scrollbars hidden inside the carer app; tap targets over hover.

Tokens live in `src/style.css` (`@theme` + `.card`/`.btn`/`.badge`/`.section-title` utilities).

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to /dist
npm run preview  # preview the production build
```

## Architecture

| Layer | Location | Purpose |
|---|---|---|
| Design tokens | `src/style.css` | Clinical theme (`@theme`), component utility classes |
| Icons | `src/icons.js` | Inline Lucide-style icon set — `icon(name, classes)` |
| Core libs | `src/lib/` | `dom` (html/esc/map), `router` (hash router), `store`, `overlay` (toast/modal/drawer) |
| Mock data | `src/data/` | Shaped to the data model — templates, packs, service users, tasks, visit instances, alerts, governance |
| Schema engine | `src/data/schemas.js` + `domain.js` | JSON evidence schemas → rendered carer forms |
| UI primitives | `src/components/ui.js` | Buttons, badges, cards, tabs, tables, charts, stats |
| Domain components | `src/components/domain.js` | TemplateCard, EvidenceFormRenderer, AlertRow, WeeklyMatrix, Stepper, BodyMap… |
| App shell | `src/components/shell.js` | Sidebar + topbar + content slot, role switcher |
| Screens | `src/screens/` | One module per route, returns an HTML string |

**Everything is data-driven.** A template carries `evidenceSchema`, `alertRules`,
`completionRules` and `dependencies` as data; the same renderer turns any schema into the
correct carer recording UI (checkbox, number+unit, score, eMAR outcome, body map, signature…).

## Screens (routes)

| Route | Screen |
|---|---|
| `#/` | Dashboard — exceptions, trends, coverage, activity |
| `#/templates` | Template Library — category rail, search, filters, grid/list |
| `#/templates/:id` | Template Detail — purpose, instructions, evidence, versions, governance |
| `#/templates/new` · `/:id/edit` | Create/Edit Template wizard (9 steps) |
| `#/packs` · `/:id` · `/new` | Task Packs — browse, detail, builder |
| `#/apply` | Apply template/pack to a service user (5 steps) |
| `#/service-users` · `/:id/planner` | Service users + Task Planner (By Visit / Category / Weekly Matrix / Exceptions / Care-plan) |
| `#/carer` · `/carer/:visit` | Carer mobile experience + evidence recording sheet |
| `#/exceptions` | Exception Monitor + alert drawer |
| `#/reports` | Reports & Analytics (usage, trends, compliance, CQC evidence) |
| `#/audit` | Audit trail |
| `#/governance` | Approval queue, workflow, versioning rules |
| `#/permissions` | Role-based permissions matrix |

## Build phases (delivered)

- **Phase 0 — Foundation**: scaffold, clinical design system, component library, mock-data layer, app shell, router.
- **Phase 1 — Template Library**: library, detail, create/edit wizard, versioning.
- **Phase 2 — Packs & Apply**: pack builder, apply flow, service-user planner.
- **Phase 3 — Evidence & Monitoring**: schema-driven forms, carer mobile, exception monitor.
- **Phase 4 — Governance & Compliance**: approval workflow, audit trail, reports, CQC evidence, permissions.

### Carer mobile app

A self-contained full-screen mobile experience under `#/carer/*` (`src/screens/carer.js`, `src/carer/*`,
`src/lib/carerStore.js`, persisted to `localStorage`). Built in two tracks:

- **IA rebuild (P0–P5)** — auth/onboarding, 4-tab shell (Today · Clients · Inbox · Me), visit workspace
  (**Overview · Tasks · MAR · Obs · Log** — the Log tab merges the former Charts + timeline + incident
  reporting; Incident is a report action, not a tab), client profiles/care-plan/history, comms,
  me/safety, and the carer→office feedback loop (`officeBridge.js` surfaces carer records into exceptions,
  audit and the dashboard).
- **Spec v3.4 clinical-safety enhancement (E1–E10)** — two-field eMAR, medication-safety rules, five allergy
  states, wrong-person gate, deterioration protocols, consent/MCA, alert state machine (E1); check-in
  geofence + welfare + five-dimension outcome + leaving-safe + double-up block (E2); key-safe masking,
  safeguarding disclosure, AIS, drafts/auto-save, photo capture (E3); schedule/sync, money/pay, death &
  absence workflows, feedback, help/search, handover ack (E4); break-glass, lawful-basis sharing, auto-lock,
  WCAG prefs (E5); visit-type breadth, night shifts, equipment register (E6); reablement, condition-specific
  obs, EOL/anticipatory meds, voice notes (E7); **medication order lifecycle & reconciliation, CD witness
  eligibility + fallback, observation integrity (impossible-value guard, cross-carer repositioning,
  monitoring schedules), client-money cash-safety gate (E9); three-tier roles + gated elevated actions,
  non-visit Jobs, tracked change-request loop + open-safety-items handover, offline documents + hardened
  export + carer reports, SOS-no-service resilience, notification-denial policy, assessments & continuity
  (E10); in-app assurance register — DCB0129 hazard map (H1–H38), §42.1 concurrency scenarios and
  Appendix-A visit transitions (E8 capstone)**.

#### Recent enhancements (2026 refresh)

- **Care safety at a glance** — resuscitation status (**DNACPR / ReSPECT**, with a "not recorded →
  check ReSPECT" safety prompt), **clinical flags** (catheter, hoist, syringe driver…), **communication
  & sensory needs** (AIS), and **care-plan essentials** (catheter spec, moving-&-handling sling/hoist,
  dysphagia/SALT) are surfaced on both the visit header/Overview and the client profile
  (`src/data/serviceUsers.js` `resus` / `flags` / `commsNeeds` / `careNeeds`).
- **Pay & earnings** (`#/carer/me/pay`, `src/data/pay.js` + `src/carer/money.js`) — three tabs:
  **This month** (live estimate, weekly bars, an **effective-rate / National-Minimum-Wage check** that
  counts travel time, tax-year totals), **Payslips** (monthly → payslip detail with gross · PAYE tax ·
  NI · pension · net), and **Timesheet** (Day/Week/Month, auto-created from clock-in/out with an
  Older/Newer navigator — carers don't submit; salary is paid automatically monthly).
- **Consistent, discoverable IA** — grouped Me hub, a canonical client-detail profile, and the
  consolidated 5-tab visit workspace.

Roadmap & IA catalog: [`docs/carer-app-roadmap.md`](docs/carer-app-roadmap.md). Live spec-v3.4 coverage:
[`docs/spec-traceability.md`](docs/spec-traceability.md). Source spec:
[`docs/carer-app-functional-spec-v3.4.md`](docs/carer-app-functional-spec-v3.4.md).

> This is a front-end prototype: data is mocked in `src/data/`. No backend is wired up.
