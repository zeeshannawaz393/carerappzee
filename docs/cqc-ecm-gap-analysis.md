# CQC + ECM gap analysis & build roadmap

Synthesised from multi-agent research (ECM dashboards, CQC single assessment
framework, competitor charts, clinical monitoring frameworks) + a registered-manager
product review. Scope rule: **carer app = capture + real-time safety triggers +
point-of-care compliance**; office-only analytics (exception dashboards, KPI/rota
adherence, invoicing) are noted but out of scope.

## Where we already lead
Geofenced check-in/out + auto clock-out + lone-worker; eMAR (15 codes, CD witness,
covert/MCA, reconciliation); observations (vitals/NEWS2, fluid, food, bowel/Bristol,
weight/MUST, skin/body-map, repositioning, mood, sleep, pain, seizure, behaviour) with
abnormal-flagging + auto-escalation; tasks↔obs; incidents (RIDDOR/safeguarding); care
plans; MCA/capacity; handover; **client-record Monitoring charts** (hydration, nutrition,
weight/MUST, bowels, NEWS2, glucose, mood, sleep, pain + repositioning). This already
matches or beats Birdie/Nourish/Access/PASS on core clinical charting.

## Convergent gaps → prioritised backlog

### P1 — Visit adherence (carer signals)  ⬅ proxy non-negotiable #1, ECM + competitor #1
The one thing a CQC "Safe" inspection probes first. Carer-app scope:
- Late-start flag (checked in after scheduled start + grace) → office notified.
- Expected-out time shown; **short-visit** flag (left well under planned minutes) → office notified + reason.
- Proactive **"running late — tell the office"** action before check-in.
- (Office-only: missed-visit board, on-time %, exceptions queue.)
**Status: building now.**

### P2 — Quick-win trend charts (data already captured)
- **Falls & incident trend** — we have a list, not a graph. By type / time-of-day. (CQC "learning from events"; NG249.)
- **Medication-adherence trend** — % given / refused / missed over time from the eMAR. (Birdie "Medication Tasks Completed".)

### P3 — Specialist logs / charts
- **Continence / catheter** — voids, pad checks, catheter output/bag change; UTI/blockage detection.
- **Oral / mouth care** — daily completion (explicit CQC oral-health focus).
- **Seizure log** — frequency/duration/type/trigger trend (we capture seizure obs; needs the trend view).
- **ABC behaviour chart** — antecedent–behaviour–consequence for dementia/LD/PBS.
- **Wound-healing tracker** — extend the static body map into a size/photo-over-time timeline.

### P4 — Clinical-framework depth (grounding from NICE/NHS)
- **Abbey Pain Scale** for people who can't self-report (dementia) — alongside the 0–10 self-report. (0–2/3–7/8–13/14+.)
- **RESTORE2 soft signs + SBARD** structured escalation wrapper around NEWS2 (social-care standard; NEWS2 3-in-one / 5–6 urgent / 7+ 999).
- **Post-fall observation set** auto-triggered after a fall (NG249).
- **SSKIN / React-to-Red** framing on skin; **MUST** full 3-step; diabetes **hypo protocol "4 is the floor"**.
- Handover **read-receipt** (next carer acknowledges); explicit **SOS/panic** (distinct from lone-worker check-in); **due-meds reminder**; **offline/QR check-in fallback**; **rural geofence tolerance**.

## Method note
Most vendors document these as "features" not named charts, so competitor lists reflect
public pages. Clinical thresholds sourced from nice.org.uk, RCP (NEWS2), BAPEN (MUST),
Bladder & Bowel Community (Bristol), NHS RESTORE2, Abbey Pain Scale. Full source URLs in
the research transcripts.
