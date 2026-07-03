# Flagship course design — Medication Administration in Adult Social Care

**Course id:** `med` · **Status:** design complete → building
**Goal:** rebuild the `med` course so a single course is genuinely at the level of a top UK online provider (iHASCO, The Access Group/Grey Matter/Flourish, High Speed Training, CPD Online College, Skills for Care–endorsed), instead of the current 5-block + 4-question micro-lesson.

This document is the build spec. It is grounded in three research briefs (course anatomy across 8 providers; authoritative NICE/CQC/RPS/Skills-for-Care content; the assessment & competency model). Sources are cited inline.

---

## 1. What "enterprise" means here (the bar to hit)

From the provider research, a market-standard medication course has **all** of:

1. **Learning outcomes** stated up front.
2. **Multiple modules** (consensus order below), not one flat lesson. 3–19 modules across providers; we use **8**.
3. **A per-module knowledge check** (formative — teaches, gives feedback), separate from…
4. **A summative final assessment** — ~20 questions is the modal count, **80% pass** (the mode; iHASCO 90%), **multiple/unlimited attempts**, instant result. We use **12 questions @ 80%**, unlimited retries, with correct answers revealed.
5. **A CPD certificate** (reference, CPD hours, completion + expiry dates).
6. **A renewal cycle** — **annual** (NICE NG67 §1.11 / SC1 §1.17); some certs carry a hard 2-year expiry. `med` uses 12-month validity.
7. **The two-gate compliance rule made explicit:** e-learning is the **knowledge gate only**. A **practical workplace competency observation + sign-off** by an occupationally-competent assessor is required before administering unsupervised (Skills for Care *Medicines competency assessment guide*; CQC; NICE NG67/SC1). Best-practice shape is a gated Part-1-knowledge → Part-2-administration course (Flourish/Grey Matter). We surface this as a persistent banner + a completion-screen gate + a contents-page competency card.

**Canonical module order** (merged across all providers): intro/role/law → types & forms → routes → the 6 Rights & safe administration → MAR & record-keeping → PRN/covert/self-admin/CDs → storage/ordering/disposal → errors/refusals/reporting → final assessment.

---

## 2. Course structure — 8 modules + final assessment

Each module = a short title, an estimated time, 2–4 content blocks (reusing our existing block renderer: text / definition / keypoints / callout / scenario / dosdonts / video / standard), and one **knowledge check** question. Total ≈ 75 min, 2.5 CPD hours, 12-month validity — matching the catalogue metadata.

### Learning outcomes (shown on the contents page)
- Describe the legal framework and your accountability for supporting medicines
- Identify the types, forms and routes of medicines and the safe-practice points for each
- Apply the six rights and the safe administration procedure
- Complete a MAR chart accurately and use the correct codes
- Follow PRN, covert and self-administration rules lawfully
- Store, order and dispose of medicines safely
- Recognise, record and report errors, refusals and adverse reactions

### Module 1 — Your role, the law & accountability (~10 min)
- **text:** Care workers support medicines three ways — *prompting*, *assisting*, *administering*. You may only administer when it is part of your role **and** you have been **trained and assessed as competent**. Training alone is not enough.
- **definition — "Trained and assessed as competent":** you complete the theory (this course) and are then **observed** administering by a competent assessor who signs you off. Until then you must not administer unsupervised.
- **keypoints — key law:** Human Medicines Regulations 2012; Misuse of Drugs Act 1971 (controlled drugs); Mental Capacity Act 2005 (consent/covert); Health & Social Care Act 2008 (Regulated Activities) **Regulation 12** (safe care & treatment); Care Act 2014.
- **callout (info) — consent:** an adult with capacity can accept or refuse any medicine; gain consent before you support medicines.
- **Knowledge check (single):** "You've finished this e-learning but haven't been observed yet. Can you administer medicines unsupervised?" → **No — not until assessed as competent and signed off.**

### Module 2 — Types & forms of medicines (~8 min)
- **text:** Medicines are legally classified **POM** (prescription-only), **P** (pharmacy), **GSL** (general sales list); some are **controlled drugs (CDs)** with extra rules.
- **keypoints — forms:** tablets/capsules, liquids, creams/ointments, transdermal patches, eye/ear/nose drops, inhalers, injections, suppositories/enemas.
- **definition — PRN:** *pro re nata* — given "as required" (e.g. pain relief) to a protocol, not at fixed times.
- **callout (warning) — time-critical meds:** Parkinson's, insulin and some epilepsy medicines must be given in a narrow window; a late/missed dose can seriously harm.
- **Knowledge check (multi):** "Which are legal classifications of medicines?" POM / P / GSL / PRN → **POM, P, GSL** (PRN is not a classification).

### Module 3 — Routes of administration (~8 min)
- **text:** The **route** is how a medicine enters the body. Give by the **prescribed route only** — never change it.
- **dosdonts:** *Do* — read the label for the route; position the person safely; watch oral meds are swallowed. *Don't* — crush tablets unless a pharmacist/prescriber agrees (alters the dose, often unlicensed); touch a patch's adhesive; put drops in the wrong eye.
- **keypoints — route specifics:** oral (upright, offer a drink, observe it's taken); patch (rotate site, remove the old one, record on a body map); inhaler (check dose counter, correct technique, rinse mouth after a steroid inhaler); drops (correct side, don't touch the nozzle); PEG/enteral (flush, only if trained); buccal/sublingual (held in cheek/under tongue — not swallowed).
- **Knowledge check (single):** "Can you crush a tablet to make it easier to swallow?" → **Only if a pharmacist/prescriber has agreed** — crushing can change the dose and may be unsafe.

### Module 4 — The six rights & safe administration (~10 min)
- **callout (info) — The 6 Rights:** right **person**, **medicine**, **dose**, **route**, **time**, and the right **documentation** (some add the right to **refuse**).
- **keypoints — before you give:** wash hands; check the person hasn't already had the dose; confirm identity; cross-check the **MAR against the label** (medicine, dose, route, time); check **allergies**; check the **expiry date**; check **cautionary warnings**.
- **scenario:** the MAR says one tablet at 8am but the pharmacy label says two — what do you do? → **Don't give; stop and check with the pharmacy/senior — MAR and label must match.**
- **callout (warning):** support **one person at a time**; keep medicines secure — never leave them unattended.
- **Knowledge check (multi):** "Which checks must you make before administering?" confirm identity / check MAR against label / check allergies / check expiry → **all**.

### Module 5 — The MAR chart & record-keeping (~8 min)
- **text:** The **MAR** (Medication Administration Record) is the legal record of what was prescribed and what you gave. Sign it **immediately after** the person takes it — never in advance.
- **keypoints:** if not given, don't leave a gap — enter the correct **code** (refused, not available, hospital, asleep, social leave) and explain it; handwritten entries by two staff, checked; at the end of a round confirm the MAR is fully completed.
- **definition — eMAR:** an electronic MAR that flags missed/late doses in real time and cuts gaps and transcription errors.
- **callout (danger):** a gap on a MAR means "no one knows if this dose was given" — a serious recording failure. Always sign or code every dose.
- **Knowledge check (single):** "When do you sign the MAR?" → **Immediately after the person has taken the medicine.**

### Module 6 — PRN, covert & self-administration (~10 min)
- **text:** **PRN** medicines are given only when needed. Each needs a **PRN protocol** with the reason, dose, **maximum in 24 hours** and **minimum gap** between doses.
- **callout (danger):** before a PRN dose, check the MAR for the last dose time — never breach the maximum dose or minimum interval.
- **definition — covert administration:** hiding medicine in food/drink. Lawful **only** for a person who **lacks capacity** for the decision, after a **best-interests** process involving the pharmacist, prescriber and family, with a documented plan. Never covertly medicate a person with capacity.
- **keypoints:** *self-administration* — support independence where a risk assessment shows it's safe; store the person's medicines securely and record the arrangement. *Controlled drugs* — locked CD cabinet, recorded in the **CD register**, witnessed in care homes.
- **Knowledge check (single, scenario):** "A person **with capacity** refuses a tablet. Can you hide it in their food?" → **No — covert administration of a person with capacity is unlawful; record the refusal and report it.**

### Module 7 — Storage, ordering & disposal (~6 min)
- **keypoints:** store securely at the right temperature; fridge items **2–8 °C** with a **daily temperature check**; controlled drugs in a locked CD cabinet.
- **dosdonts:** *Do* — order on a monthly cycle, check deliveries against the MAR, record opening dates on drops/liquids. *Don't* — stockpile, use past expiry or "use-by after opening", or put medicines in general waste.
- **callout (info):** return unwanted/expired medicines to the pharmacy (CDs are denatured/disposed via a controlled process); record what's returned.
- **Knowledge check (single):** "Fridge medicines should be kept at:" → **2–8 °C, with a daily temperature check.**

### Module 8 — Errors, refusals & reporting (~8 min)
- **text:** everyone makes the occasional mistake — what matters is that you **report it immediately** and honestly so the person can be kept safe. This is the **duty of candour**.
- **keypoints:** report right away — wrong dose/medicine/person/time, a missed dose, a suspected reaction/side-effect; seek medical advice (GP/111/999) if the person is unwell; record the facts on the MAR/incident system.
- **scenario:** you realise you gave Mr Cole's tablets to Mrs Ford — what do you do? → **Report immediately to your senior, seek medical advice, and record it — don't wait to see if harm occurs.**
- **callout (warning):** a person with capacity has the **right to refuse**; never force or trick them — record the refusal with the reason and report if refusals continue or the medicine is critical.
- **Knowledge check (single):** "You gave a medicine to the wrong person. You should:" → **Report it immediately and seek medical advice.**

### Final assessment — 12 questions, 80% pass, unlimited retries
Drawn across all 8 modules, mixing single-answer, multi-select and scenario questions. Wrong submissions reveal the correct answers (existing behaviour). Pass → certificate + CPD + the competency-gate reminder.

---

## 3. The two-gate model in the UI (the compliance differentiator)

- **Persistent banner** in the player: "This is the knowledge element only. You must also be observed and signed off as competent before administering unsupervised."
- **Contents page competency card:** shows the practical gate — *observed by a senior/nurse/registered manager*, *at least annually* (NICE NG67/SC1), *re-assessed after any error, absence or new medicine/route* — cross-linked to the app's **Skills** screen (`sk-med`, which already models e-learning + observed sign-off as two tracks).
- **Completion screen:** records the knowledge element + CPD, renews the `t-med` training record, but states competency sign-off is still required.

---

## 4. Data model (backward compatible)

Extend `LEARNING_CONTENT['med']` with an optional `modules` array. **Courses without `modules` are unchanged** (the other 24 keep the flat paged-blocks player).

```
med: {
  points: [...],              // retained (JIT / fallback)
  outcomes: [...],            // course learning outcomes (contents page)
  modules: [
    { id, title, mins, blocks: [ ...block objs... ],
      check: { t:'single'|'multi', q, options, answer|answers } },
    ... ×8
  ],
  quiz: [ ...12 final-assessment questions... ],
}
```

- `carerStore.setCourseProgress(courseId, screen, module)` → bookmark `{ module, screen, at }` (the SCORM `cmi.location` analog, now module-aware). Back-compatible: `module` defaults to 0.
- `window.__courseProgress(id, screen, module)` updated to pass module.
- `med` catalogue seed set to **`status: 'not-started'`** (drop `completed`) so the flagship course is fully explorable from a clean state; completing it in-app marks it complete, adds CPD, and renews `t-med`.

## 5. Player UX for a modular course (`courseModalModular`)

- **Contents view** (`view:'overview'`): outcomes list, 8 module rows with completion ticks and per-module time, the competency card, and a primary button: **Start** / **Resume · Module N** / **Take final assessment** (when all modules done).
- **Module view** (`view:'module'`): "Module N of 8 · title", a within-module progress bar, blocks paged one screen at a time, and the **knowledge check** as the final screen (answer → feedback + correct answer, then **Complete module**). Completing returns to the contents page with the module ticked and the bookmark saved.
- **Assessment view** (`view:'assessment'`): the 12-question summative test, 80% pass, retries.
- **Done view** (`view:'done'`): pass summary + competency-gate reminder + record button (`window.__completeCourse`).
- Per-module screen counts differ, so Alpine state carries a `modLens[]` literal; nav uses `modLens[mod]`.

---

## 6. Critical check (honest — done before building)

Where this design is genuinely at the provider bar, and where it is **not**:

**At the bar**
- Multi-module structure, canonical module order, per-module formative checks + a summative 80% final — matches the provider consensus.
- The two-gate "trained + assessed as competent" model is made explicit in three places — this is the sector's real compliance rule and most prototypes miss it entirely.
- Content is sourced from NICE/CQC/RPS/Skills for Care, not invented.

**Honest limitations (not claiming otherwise)**
- **Content depth is prototype-level.** Real courses run 30–120 min of narrated video and interactions per topic; ours is 2–4 static blocks per module. This is a faithful *structure* with representative *content*, not a full CPD syllabus.
- **Video is a placeholder** (a play button + transcript), not real footage.
- **The final assessment is fixed, not randomised from a bank** — providers usually shuffle. 12 fixed questions.
- **Per-module checks are formative, not gating** — you can proceed after seeing feedback (as most providers do); only the final assessment gates completion. There is no per-module lockout.
- **The practical competency observation is represented, not performed** — the app models it on the Skills screen but no real assessor signs off.
- **Free module navigation** — no enforced linear lock between modules; the bookmark tracks the furthest sensible resume point but a learner can revisit any module.

Net: this makes `med` a credible enterprise-grade *course experience and structure* with authoritative content, honestly short of a full commercial syllabus's media depth. That is the intended scope for the prototype.
