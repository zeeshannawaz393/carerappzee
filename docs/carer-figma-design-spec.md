# Carer App — Figma Design System & Enterprise Build Plan

**Owner:** Zeeshan Nawaz · **Status:** Approved for build · **Scope:** Carer mobile app only (office/admin dashboard explicitly excluded) · **Source of truth for:** design tokens, components, screen construction, and the Figma delivery plan.

This document is the single source of truth. It has two halves:

1. **Part A — Design specification** (what to build, every value decided).
2. **Part B — Enterprise build plan** (how we deliver it, phased, with governance and a definition of done).

The system is code-first: it mirrors the existing tokens in [`src/style.css`](../src/style.css) and the carer screens under [`src/carer/`](../src/carer). Design and code stay in sync via Figma Variables + Code Connect.

---

# PART A — DESIGN SPECIFICATION

## 1. Product & platform context
- **Product:** field-carer mobile app for domiciliary/residential care (CQC-regulated, UK).
- **Users:** carers at the doorstep/bedside, often one-handed, low-signal homes, variable eyesight, time pressure.
- **Design north star:** clean/premium (Linear / Ramp / Shopify grade), **not** decorative. Clinical calm, high legibility, point-of-care hierarchy.
- **Platform:** iOS/Android phone. Author for iPhone 14/15 (390×844), validate across the phone band.
- **Out of scope:** the office/admin desktop dashboard, `.data-table`, sidebar `.nav-item`, all 13 office screens.

## 2. Canvas, frame & device
- **Author width 390px**, height 844.
- **Top safe inset 59px** (Dynamic Island; 47px on notch/SE check frame).
- **Bottom safe inset 34px** (home indicator).
- **App background:** carer-mode gradient (`#eef2f7 → #e4eaf1` + faint blue radial top). Content on `--canvas` (#f4f7fa); cards on `--surface` (#fff).
- **DeviceFrame component** = StatusBar + top safe spacer + content slot + BottomNav + HomeIndicator. Every screen authored inside it so insets are automatic.

## 3. Spacing — 4pt base, 8pt rhythm
Scale (no arbitrary values): `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40`.
- **Side margins (gutters): 16px** — every screen, non-negotiable.
- Section gap 12 · card padding 16 · intra-group 8 · label→field 6 · icon→text 8 · screen top pad 16 · bottom scroll pad 24.

## 4. Layout grid
- Content column = 390 − 32 = **358px**, single column.
- Vertical 8pt grid; heights/offsets land on multiples of 4 (ideally 8).
- Left-aligned to the 16px gutter; numbers/status right-aligned in rows. No centered body text.
- Saved as a Figma **layout grid style** (16px L/R margins, 8px baseline) applied to every screen.

## 5. Typography — Plus Jakarta Sans
7-step ramp; max 3 weights per screen (400/500/700); 3 contrast tiers (ink-900 → ink-500 → ink-400); tabular numerals on all times/doses/vitals.

| Token | Size / LH | Weight | Tracking | Use |
|---|---|---|---|---|
| Display | 28 / 34 | 700 | −0.02em | Screen hero, big numbers |
| Title (xl) | 22 / 28 | 700 | −0.02em | Screen/sheet title |
| Heading (lg) | 18 / 24 | 600 | −0.015em | Card title, client name |
| Body (base) | 16 / 24 | 400/500 | −0.011em | Primary content, row label |
| Subtext (sm) | 14 / 20 | 400/500 | −0.006em | Secondary line, meta |
| Caption (xs) | 12 / 17 | 500 | 0 | Chips, timestamps, hints |
| Overline | 12 / 16 | 600 | +0.06em UPPER | Section titles |

## 6. Color — roles, not decoration
- **Primary blue** (#1d72bd/500, fills 600): interactive only — buttons, active tab, links, selected. Never a decorative band.
- **Ink greys:** all text + structure.
- **Semantic (status only):** danger (allergy, overdue, DNACPR), amber (due/time-critical), green (done/in-range), info (neutral notice).
- **Severity scale** (info→critical) reserved for alert/incident chips.
- **Chip tints:** family-50 bg / family-700 text, no border.
- **Contrast floor:** 4.5:1 body, 3:1 large. Error never color-alone (icon + text).

## 7. Token architecture — 3 tiers + modes
- **Primitive:** raw (`blue-500`, `grey-100`, `space-16`).
- **Semantic/alias:** role (`bg/surface`, `text/primary`, `border/subtle`, `action/primary`, `status/danger`). **Components bind to these.**
- **Component (optional):** `button/primary/bg`.
- **Figma Variable Modes:** `Light` (default) + `A11y-contrast` (ink-400→600, 500→700 promotion). **No dark mode** (code ships none).

## 8. Elevation & shape
- **Radius:** cards/sheets 12px; buttons/fields 10px; chips/avatars full.
- **Two shadows only:** `--shadow-card` (resting) and `--shadow-pop` (sheets/menus/lift). Prefer 1px `ring-ink-100` hairline over heavy shadow.
- **Dividers:** 1px ink-100 via `divide-y` inside grouped cards — **de-boxed list is the default**, not stacked cards.

## 9. Iconography
- One outline set (Lucide-style), 1.5–2px stroke, **20px default** (24 header, 16 inline-with-sm).
- Monochrome, inherits text color; color only when the icon *is* the status.

## 10. Touch, density & sizing
- **Min hit area 44×44** (pad tap zone even if visual is smaller).
- Button heights sm 32 / md 38 / lg 44 (CTAs use lg).
- List rows 56 (1-line) / 64–72 (2-line). Fields 38 (md).

## 11. Component library (carer-only inventory)
- **Primitives:** Button, IconButton, Field (text/textarea/select), Chip/Badge, Avatar, Icon, Divider, Toggle, Checkbox, Radio, Stepper.
- **Composite:** Card, ListRow, SectionHeader, StatCard, Toast, EmptyState, Skeleton, ProgressBar, SegmentedTabs, OfflineBanner, SyncChip, NotificationBanner, TabBadge.
- **Navigation:** StatusBar, AppHeader, VisitHeader, BottomNav, SheetHeader, HomeIndicator.
- **Overlays:** BottomSheet, Dialog, Backdrop.
- **Domain:** VisitCard, MedRow (MAR), TaskRow, ObsRow, ChipStack, SafetyChip, HandoverNote.

Naming: `Category/Name/Variant`. Each component carries **usage do/don't notes** on the Components page.

## 12. Variants & component properties
- **Button:** variant {Primary, Secondary, Ghost, Danger, Teal} × size {sm, md, lg} × state {Default, Pressed, Disabled, Loading} × bool icon.
- **Chip:** tone {Neutral, Danger, Amber, Green, Info} × bool icon.
- **Field:** type {Text, Textarea, Select} × state {Default, Focus, Error, Disabled} × bool label, hint.
- **ListRow:** lines {1,2} × trailing {Chevron, Chip, Toggle, None} × bool leadingIcon.
- **SegmentedTabs:** count {2–5} × active index.
- **BottomNav:** active {Today, Clients, Inbox, Me}.
- **VisitCard:** status {Upcoming, Due, InProgress, Done} × chips {0–3}.
- **Extras beyond variants:** text props, boolean show/hide (icon/hint/badge), instance-swap (icon/avatar), exposed nested instances.

## 13. Auto layout rules
- **Everything auto layout**; only 2 absolute escapes (StatusBar overlay, Sheet backdrop).
- Gap/padding bound to spacing variables.
- Resizing: chips **Hug**; cards/rows/fields/CTA **Fill**; screen frame **Fixed** 390.
- ChipStack: horizontal, gap 8, **wrap on**, max 3 then truncate.
- ListRow: leading(hug) · content(fill) · trailing(hug), v-centered.
- Nesting mirrors DOM: chip → row → card → screen. Sheets vertical, Fill, footer pinned.

## 14. Status bar, notch & safe areas
- **StatusBar** component 390×59, theme {Light-glyphs, Dark-glyphs} (app = dark glyphs on light). Pinned top, outside scroll.
- **Top band 0–59** holds only status glyphs; sticky headers begin at 59.
- **Bottom 34px** = surface fill + **HomeIndicator** pill (134×5, ink-900 ~30%).
- Check frames: 375 uses 47px inset, 430 uses 59px Island; DeviceFrame variant swaps.

## 15. Motion
- Durations 150 (color/state) · 180 (pop-in) · 220 (sheet/route). Easing `cubic-bezier(.16,1,.3,1)` for enter.
- Sheets slide-up + backdrop fade; routes slide-in-right; cards pop-in. No bounce/spring.
- **Reduced-motion** variant → instant transitions.

## 16. States (every screen defines all)
- **Empty:** centered 40px muted icon + one calm action-oriented line (screen-specific copy, never "No data").
- **Loading:** skeleton rows (ink-100 shimmer), not spinners.
- **Error:** inline danger-50 card + retry, not a modal.
- **Success:** toast, 12px radius, shadow-pop, auto-dismiss 2.5s.
- **Offline:** amber sticky banner "Offline — changes saved on device."
- **Sync:** record micro-chip Saved · Syncing · Synced · Failed(retry).

## 17. Content & data formatting
- **Time 24-hour** (`14:30`); **dates** `Wed 4 Jul`; tabular numerals.
- **Names** `First Last`; avatar = photo or 2-letter initials on deterministic tint.
- **Truncation:** single-line ellipsis; never wrap a name to 3 lines.
- **Units** always shown (mg, mmHg, °C, bpm); vitals colored only when out of range.

## 18. Input, gestures & haptics
- **Keyboard-aware sheets:** "keyboard open" variant (sheet shrinks, CTA rides above keyboard).
- **Input types:** numeric keypad for vitals/doses; QWERTY for notes.
- **Gestures (annotated for build):** swipe-back, pull-to-refresh, long-press.
- **Haptics:** success/warn on key confirmations (native build note).

## 19. Notifications
- NotificationBanner (info/amber/danger) + TabBadge count (Inbox, overdue meds).

## 20. Accessibility
- 4.5:1 contrast; 44px targets; visible 2px primary focus ring on every interactive element.
- **Dynamic type:** ramp maps to large-text mode (root 18.5px) — verified no clipping (everything hug/fill).
- **Screen-reader labels** annotated on icon-only controls; **focus/reading order** set in prototype.
- A11y-contrast mode as a variable mode; reduced-motion variant.

## 21. Localization
- Components tolerate **+30% text expansion** (hug/fill, no fixed-width labels); strings from [`src/carer/translate.js`](../src/carer/translate.js) are translatable.
- Author a longest-language check frame.
- **RTL: in scope** — mirror layout via auto-layout direction flip; icons/chevrons mirror; validate one RTL check frame.

## 22. Prototype
- Sheets/dialogs as **overlays** (backdrop + swipe-down close), not new frames.
- **Smart Animate** for tabs/sheets (180–220ms).
- Vertical scroll on content; header + bottom nav pinned.
- Device iPhone 14/15; separate flows for 375/430 check frames.

---

# PART B — ENTERPRISE BUILD PLAN

## Delivery model
Six phases, each with deliverables, a definition of done (DoD), and an acceptance gate. Foundations before components before screens — no screen work starts until the library is published. Work happens in a Figma **branch** per phase, reviewed, then merged and published.

## Phase 0 — Setup & governance (0.5 day)
- Create Figma file, page skeleton (Cover · Foundations · Components · Patterns · Screens · Prototype · Archive), team/library access.
- Establish naming conventions, version scheme (semver on the library), and change log on the Cover.
- Import Plus Jakarta Sans; confirm icon set.
- **DoD:** empty file scaffolded, conventions documented on Cover, library publishing enabled.

## Phase 1 — Foundations / tokens (1 day)
- Build primitive → semantic → component **Variables**; Light + A11y-contrast **modes**.
- Text styles (7-step ramp), effect styles (2 shadows), layout grid style, radius/spacing variables.
- Foundations page documents color, type, spacing, elevation, icons with swatches.
- **DoD:** every value in Part A §3–§10 exists as a variable/style; a test frame proves both modes switch cleanly.
- **Gate:** token review sign-off.

## Phase 2 — Component library (2–3 days)
- Build all components in §11 with variants + properties (§12), all on auto layout (§13) bound to tokens.
- DeviceFrame + StatusBar + BottomNav + HomeIndicator (§14).
- Each component: all states, usage do/don't note, Code Connect stub to its code class.
- **DoD:** components published as a library; a scratch frame assembles 5 arbitrary rows/cards using only instances (no detached layers); a11y-contrast mode verified on every component.
- **Gate:** component API review.

## Phase 3 — Core-flow screens (2 days)
- Assemble from the library, authored at 390 inside DeviceFrame: **Today → Visit (Overview · Tasks · MAR · Obs · Log) → a record bottom-sheet**.
- All screens: empty/loading/error/offline/sync states.
- **DoD:** screens use only library instances + variables; 375 & 430 check frames pass; scroll + safe areas correct.
- **Gate:** core-flow design review — validates the system end to end before scaling.

## Phase 4 — Full screen coverage (3–4 days)
- Remaining carer screens: Clients + client detail, Inbox (+ badges), Me + sub-screens (profile/HR, pay & earnings, learning, schedule, notifications, settings/a11y).
- Longest-language + one RTL check frame.
- **DoD:** every carer route from `src/carer/` has a screen frame with all states; nothing office-side included.

## Phase 5 — Prototype & interaction (1–2 days)
- Wire flows (§22): navigation, tab switches (smart animate), sheet overlays, scroll, badges, offline banner.
- Reduced-motion variant flow; device presets set.
- **DoD:** a clickable end-to-end prototype from Today through a completed visit; recorded walkthrough on the Cover.
- **Gate:** stakeholder walkthrough sign-off.

## Phase 6 — Handoff, governance & Code Connect (ongoing)
- Complete Code Connect mappings (component → code class); export tokens if a pipeline is wanted.
- Contribution rules: who edits, branch/review/publish flow, semver bumps, deprecation policy (move to Archive, never delete live).
- Quarterly reconciliation pass: diff Figma vs `src/style.css` and carer screens; log drift.
- **DoD:** every published component has a Code Connect entry; governance doc on Cover.

## Timeline (single designer, focused)
| Phase | Effort |
|---|---|
| 0 Setup | 0.5d |
| 1 Foundations | 1d |
| 2 Components | 2–3d |
| 3 Core flow | 2d |
| 4 Full screens | 3–4d |
| 5 Prototype | 1–2d |
| 6 Handoff | ongoing |
| **Total to full prototype** | **~10–13 working days** |

## Definition of done (whole project)
1. Library published; Light + A11y-contrast modes.
2. Every carer screen assembled from instances + variables — zero detached layers, zero hardcoded hex/px.
3. 375/390/430 + longest-language + RTL check frames pass.
4. All states present (empty/loading/error/success/offline/sync).
5. Clickable prototype covers the primary journey.
6. Code Connect maps components to code; governance + change log live on the Cover.

## RACI (roles)
- **Responsible:** design-systems build (this workstream).
- **Accountable:** product owner (Zeeshan).
- **Consulted:** carer end-users (usability), clinical/CQC compliance.
- **Informed:** engineering (Code Connect consumers).

## Risks & mitigations
- **Drift between code and Figma** → Code Connect + quarterly reconciliation.
- **Scope creep into office dashboard** → hard exclusion stated; separate future file if needed.
- **Over-design vs clinical calm** → design principles gate every review.
- **Accessibility regressions** → a11y-contrast mode + dynamic-type check frames are DoD, not optional.
