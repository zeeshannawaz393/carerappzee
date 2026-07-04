# Client monitoring charts — research & design

**Status:** proposal (pre-implementation)
**Home:** the client record (`src/carer/clientDetail.js`) — a *Monitoring* section that
aggregates across **all** of a client's visits. **Not** the single-visit Log (that view
structurally can't see other visits, which is why the old visit-level "1500 ml target"
was misleading).

---

## Why this exists

The visit Log was showing "charts" that (a) duplicated the timeline and (b) judged a
whole-day target against one visit's data. The *genuine* value of charting in home care is
**trend over time across visits** — spotting a decline before it becomes an incident. That
is a day-/week-level, cross-visit concern. This doc defines what to chart, how it looks,
what each one lets a carer or manager *understand*, and the edge cases.

Everything below is driven by the observations the app **already captures**
(`OBSERVATION_TYPES`): fluid, food, bowel, output, weight, temperature, pulse, respirations,
bp, spo2, glucose, news2, pain, mood, sleep, behaviour, seizure, skin/reposition. So no new
data capture is needed — this is a *reading* layer over `carerStore.observationsForUser(suId)`.

---

## Design principles (apply to every chart)

1. **Targets & intervals come from the care plan, per person — never a global constant.**
   Mary's fluid target, repositioning interval, weight baseline, glucose range are
   individual. This is the fix for the old flaw.
2. **RAG status on every chart.** Each surfaces a red / amber / green state and can
   auto-escalate to the office, matching the app's existing observation-escalation pattern.
   Colour is *never the only* signal — always paired with a label/shape (a11y + the app's
   `a11y-large`/contrast modes).
3. **Time-window toggle:** *Today · 7 days · 30 days* (some charts are day-level, some are
   longer-trend — noted per chart).
4. **Condition-gated.** Vitals/NEWS2, glucose, seizure, behaviour only appear if the person
   has those readings or a matching care-plan flag — don't show an empty ECG chart for
   someone who isn't monitored.
5. **Honest empty / low-data states.** A trend needs ≥ N points; below that show
   "Not enough data yet — N of M readings" rather than a misleading line.
6. **Glanceable first, detail on tap.** Each chart is a small summary card (status + mini
   viz); tapping opens the full history. Mobile-first: nothing wider than the phone frame.

---

## Chart catalogue

Grouped by how central they are to UK domiciliary care and how often CQC/inspections look
for them. **Tier 1 = the daily bread of home care.**

### Tier 1 — build first

#### 1. Hydration (fluid balance)
- **Understand:** Is the person hydrated *today*, and are they trending down across days?
  Low fluids in the elderly drive UTIs, constipation, delirium, falls, AKI.
- **Visual:** a horizontal **progress bar / ring** toward the personal daily target
  (e.g. 1200–2000 ml; NHS care-home guidance ≈ 6–8 glasses), coloured red < 60 % / amber
  60–99 % / green ≥ 100 %; a **stacked breakdown by visit** (morning · lunch · tea ·
  bedtime) so you see *when* they drink; and a **7-day sparkline** of daily totals.
- **Alert:** below target by end of day; **2+ consecutive low days** (the real
  dehydration signal).

#### 2. Nutrition (food intake)
- **Understand:** appetite and missed meals → malnutrition risk (feeds into weight/MUST).
- **Visual:** one **row per meal** with a 5-step "amount eaten" bar
  (All · Most · Half · Little · None), red on Little/None; plus a **7-day heat strip**
  (green = ate well … red = poor) to reveal a declining-appetite pattern.
- **Alert:** 2+ consecutive Little/None; ≥ 2 missed meals/day.

#### 3. Weight & malnutrition (MUST-style)
- **Understand:** **unintentional weight loss is the single strongest malnutrition
  signal.** MUST scores loss over 3–6 months: **< 5 % = 0, 5–10 % = 1 point (amber),
  > 10 % = 2 points (red).**
- **Visual:** a **line chart of weight (kg) over ~90 days**, baseline marked, with shaded
  amber (> 5 % loss) and red (> 10 % loss) zones; a current **risk chip** (Low/Med/High).
- **Window:** 30/90 days (this is a slow trend, not daily).
- **Alert:** crosses the 5 % / 10 % loss thresholds.

#### 4. Repositioning & skin (pressure-area care)
- **Understand:** Is pressure care being delivered *to this person's schedule*, are they
  **overdue right now**, and are positions actually being rotated? Evidence (NICE QS89,
  Wounds UK) says the interval is **individualised — 4–6 h for at-risk, not a blanket 2 h**.
- **Visual:** a **24-h horizontal timeline** with a marker per reposition, coloured
  on-time / overdue; a bold **"last turned Xh ago · next due HH:MM"** status; the
  **rotation** (back / left / right / chair) shown so variety is visible; skin-check
  outcome dots (intact / red / broken) linking to the body map.
- **Alert:** overdue vs the personal interval; any "red/broken" skin finding.

#### 5. Bowels (Bristol) & continence
- **Understand:** constipation (→ impaction, delirium, UTI, agitation) and diarrhoea. Daily
  bowel monitoring is a care-home standard and is *the* commonly-missed one.
- **Visual:** a **7-day strip**, one cell/day, showing Bristol type by colour
  (types 1–2 amber = constipation · 3–4 green = normal · 6–7 red = loose · empty = none),
  and a prominent **"X days since last movement"** counter that turns amber at 3 days,
  red at 4+.
- **Alert:** no BM in 3 days (amber) / 4+ (red); 3+ loose in a row (diarrhoea).
- **Sibling:** urine/catheter **output** — daily total + colour trend (dark/cloudy/
  blood-stained → UTI/kidney flag), same strip treatment.

### Tier 2 — clinical, condition-gated

#### 6. Vital signs & NEWS2 trend
- **Understand:** **early deterioration** — a rising NEWS2 trend shows *hours* before a
  serious event. Also response to treatment.
- **Visual:** a **NEWS2 score line** with the escalation threshold (≥ 5) marked; tap to
  expand **individual vital sparklines** (temp, pulse, RR, BP, SpO₂) each with its
  normal-range band shaded.
- **Alert:** NEWS2 ≥ 5, single param = 3, or a rising trend.

#### 7. Blood glucose (diabetics)
- **Understand:** glycaemic control, hypo risk, meal-related spikes.
- **Visual:** a **logbook grid** (rows = days, columns = pre-/post- breakfast/lunch/tea/
  bed) coloured in-range / low / high, or a day scatter with the target band; hypo (< 4)
  and hyper markers.
- **Alert:** hypo / hyper thresholds; recurrent out-of-range at a specific time of day.

### Tier 3 — wellbeing & behaviour

#### 8. Mood & wellbeing trend
- **Visual:** a **7-day strip of mood faces** (the green→red face scale already built) with
  anxiety-flag markers; reveals patterns (e.g. "low every afternoon" → sundowning).
#### 9. Sleep (nightly-hours bars), Pain (0–10 trend line), Behaviour/BPSD
  (**ABC**-style frequency + trigger tally), Seizure (frequency + duration log).

---

## Other cases & considerations

- **The multi-visit "today" view** is the anchor: it sums *all* of today's visits — the
  thing a single-visit Log can't do.
- **Manager / office dashboard (out of scope for the carer app, note for platform):** the
  same aggregations at **group level** — "clients trending down on fluids / overdue turns /
  no BM 3+ days" as a daily triage list. This is where charting pays back most.
- **Care-plan integration:** each target/interval/range is read from the person's plan, so
  a plan change re-bands the charts. Also lets the plan define *which* Tier-2/3 charts show.
- **Task↔obs linkage already done:** fluid/food/skin tasks now write observations, so the
  charts get that data for free (no double source).
- **Alerts must be actionable, not decorative:** an amber/red chart offers the next action
  (call office, add a note, escalate) — reuse the existing escalation path.
- **Accessibility:** shape + label + colour on every state; respect `a11y-large` /
  `a11y-contrast`; sparklines get text equivalents ("3 of last 7 days below target").
- **Prototype caveat:** the demo clock is deterministic (readings cluster at ~07:3x), so
  time-of-day axes will look bunched in the demo — real timestamps fix this. Don't design
  around the artifact.
- **Don't over-chart.** More cards ≠ better. Ship Tier 1, gate Tier 2/3 on condition, and
  resist turning every observation into a graph.

---

## Data & placement

- **Source:** `carerStore.observationsForUser(suId)` (already exists) + protocol/incident
  history; grouped by `typeId`, bucketed by day.
- **Home:** a **Monitoring** tab/section on `clientDetail.js`; a compact "today at a glance"
  strip can also surface on the visit **Overview** (read-only, links through).
- **New store helper:** a small day-bucketing selector (e.g. `obsByDay(suId, typeId, days)`)
  so charts stay dumb/presentational.

---

## Recommended MVP

Build **Tier 1** only (Hydration, Nutrition, Weight/MUST, Repositioning, Bowels) as a
Monitoring section on the client record, each as a status card with a mini-viz + tap-through.
Gate Tier 2 (NEWS2/vitals, glucose) behind condition flags and add after. Defer Tier 3.

---

## Sources
- NHS North East London — [Hydration guidance for care homes](https://northeastlondon.icb.nhs.uk/wp-content/uploads/2022/04/MM-ELHCP_Hydration_guidance_care_home.pdf)
- NICE QS89 — [Pressure ulcers: advice on repositioning](https://www.nice.org.uk/guidance/qs89/chapter/quality-statement-5-advice-on-repositioning)
- Wounds UK — [Repositioning for pressure ulcer prevention](https://wounds-uk.com/made-easy/made-easy-repositioning-for-pressure-ulcer-prevention/)
- Birdie — [MUST score for domiciliary care](https://www.birdie.care/blog/must-score) · thresholds 5 % / 10 % over 3–6 months
- [Bristol stool chart & bowel monitoring audit (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6752410/) — daily monitoring prevents constipation/delirium
- [NEWS2 temporal-trend validation (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12550795/) — rising trend precedes deterioration
- [Nourish Care](https://nourishcare.com/product/features/) & [Birdie body maps](https://www.birdie.care/product-features/body-maps) — competitor trend/visualisation patterns
