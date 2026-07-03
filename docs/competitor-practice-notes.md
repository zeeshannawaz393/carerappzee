# Competitor & sector practice notes — e-learning, training/competency, documents

> Research pass (2026-07-02) into how UK domiciliary / home-care software handles **e-learning,
> training & competency compliance, and document updates**, to inform the Carer App against spec v3.4.
> Findings are competitor-marketing/help-centre level (not independent test data); patterns are
> well-attested, exact per-vendor feature *names* are directional. Sources inline.

## TL;DR — what to emulate

1. **Learning centre = SSO into a partner LMS surfaced in the carer app + a native training-status/matrix view.** Do not rebuild a full LMS. The tightest in-app surfacing in the market is Nourish Empower (partner content **myAko**); Access integrates at *suite* level (Access Evo), not as an embedded pane; Cera runs a native in-house academy + AI chatbot.
2. **Care Certificate = 16 standards (2025 revision; Standard 16 = Learning Disability & Autism awareness).** Model it versioned. Note "course complete" ≠ "competent": e-learning theory and observed/practical competency are **two separate tracks**.
3. **Training-expiry enforcement is advisory/soft across the market** — warn + override-with-logged-reason, decision left to the coordinator. Nobody hard-gates a clinical *task* on competency. Hard blocks are aged-care/NHS-rostering territory and usually scoped to role-mismatch.
4. **Client-condition-triggered just-in-time learning is genuine white-space** — confirmed unowned across ~8 sources. The building blocks exist separately (per-client care plans + condition course libraries + training matrix); nobody joins them. **This is the standout differentiator.**
5. **Care plans are office-authored, carer read-only; corrections flow via a carer flag/change-request that routes to the office without mutating the plan.** Daily logs are carer-authored, append-only/amend-with-reason.
6. **Staff compliance docs are predominantly office/HR-managed.** Carer self-upload exists but is *not* the clear norm — default to office-managed with optional carer-submit-for-verification.

---

## 1. E-learning / "learning centre"

There is no single "learning centre" — there are **three distinct layers**, and vendors mix them:

| Layer | What it is | Who provides it | On the carer app? |
|---|---|---|---|
| App-usage training | How to use the software itself | Vendor academy — **Birdie Academy** runs on a **separate Thinkific portal**, videos 25–90 min, *not* clinical CPD | No — separate web portal |
| Clinical / mandatory CPD | Care Certificate (16 standards), moving & handling, medication, safeguarding | Dedicated LMS: third-party (**Flourish/Click** ex-Grey Matter, **iHASCO/Atlas**, **Social Care TV**, **Me Learning**, **MyLearningCloud/Lumis**) or same-vendor (**Access Learning/LMS Evo**, **myAko** via Nourish) | Rarely native; SSO/SCORM link or status only |
| In-app compliance visibility | "Your training is up to date / expiring / expired," certificate viewer | The care-management platform itself | Yes — status + documents |

**Integration reality:** SCORM + SSO is the common mechanism (iHASCO strongest on generic API/SSO — Azure/Okta — but names *no* care-management partners). **Access** is the only true same-vendor care-management + LMS ecosystem, but the link is **suite-level (Access Evo), not an embedded learning pane** — Access Care Planning's own assurance page doesn't mention Access Learning. **Nourish/CarePlanner** surfaces training most tightly *inside* the carer app (Empower app, myAko content). **Cera** is native in-house (Cera Academy) + a 24/7 AI carer chatbot — the closest thing to real-time just-in-time *support*.

**Vendor disambiguation (getting this wrong is common):** Grey Matter Learning → acquired by **The Progress Group** (~2021), rebranded **Flourish** (Sept 2024), LMS = "Click". **NOT** owned by Access. Access built its LMS from **Unicorn Training (2019) + eLearning For You (2024)**. `iplanit` is by **Aspirico** (service-user-outcomes platform; staff training is a peripheral records module; no rostering, so no gating) — do **not** confuse with `accessplanit` (a separate TMS).

**Content types (across the LMS layer):** Care Certificate (16 std), mandatory + role-assigned refreshers, micro-learning (3–10 min), video + quiz/assessment, downloadable CPD-accredited certificates. Note Me Learning is **theory-only (no practical workbook)**.

**Offline learning:** rare — **Access Learning** ships an offline field app; others treat learning as a connected, between-visits activity. An offline-cached "next lesson" is a cheap differentiator for an offline-first app.

**Just-in-time / condition-specific learning:** aspirational everywhere. Real proof points exist at the edges — **Cuppacare** ships condition-specific micro-lessons ("Sips") to carers on the job; **Learn2Care (US)** markets "just-in-time caregiver training"; everyLIFE PASS does trainer-led scenario-based induction. Nobody auto-surfaces a lesson because of the specific service user being visited.

Sources: [Birdie Academy](https://help.birdie.care/en/articles/5338675-your-learning-training-journey-with-birdie-academy) · [Nourish + myAko](https://nourishcare.com/articles/myako-and-nourish-care-elearning-partners-for-professional-development-in-social-care/) · [Nourish eLearning](https://nourishcare.com/product/elearning/) · [Access eLearning](https://www.theaccessgroup.com/en-gb/digital-learning/elearning-courses/health-social-care-courses/) · [Access Evo/LMS](https://www.theaccessgroup.com/en-gb/digital-learning/about-us/) · [Flourish/Click (ex-Grey Matter)](https://flourish.co.uk/click-learning/) · [Progress Group acquires Grey Matter](https://theprogress-group.co.uk/the-progress-group-acquires-multiple-award-winning-learntech-provider-grey-matter-learning/) · [iHASCO Care Certificate](https://www.ihasco.co.uk) · [Social Care TV management software](https://www.social-care.tv/features/management-software) · [Me Learning Care Certificate suite](https://www.melearning.co.uk) · [MyLearningCloud SCORM](https://mylearningcloud.org.uk/scorm-files-for-health-and-social-care/) · [Cera academy/AI](https://www.cerahq.com/our-technology-and-ai) · [Cera career development](https://ceracare.co.uk/career-development) · [Cuppacare case study](https://www.myknowledgemap.com/case-studies/cuppacare/) · [Learn2Care (US)](https://www.learn2care.us/blog/a-complete-guide-to-just-in-time-caregiver-training/) · [Aspirico iplanit](https://aspirico.com/iplanit/core-optional-modules/) · [Care Certificate 16 standards](https://www.skillsforhealth.org.uk/resources/the-care-certificate/)

---

## 2. Training & competency compliance

- **Training matrix is universal** — per-carer grid (statuses e.g. Active / Expired / Recorded / Required / Not Required), computed from completion date + validity period, lives in the **office portal**.
- **Expiry alerts** with configurable lead times go **primarily to managers** (dashboard + emails); carer-facing reminders are not the norm.
- **Enforcement — the key question — is advisory/soft across UK domiciliary care:**

| Vendor | Rostering gate on training | Nature |
|---|---|---|
| **Birdie** | Skills-match warning modal + "non-matching / partially-matching" tags (incl. **expiry vs visit date**); **manager overrides** | Soft / advisory |
| **Nourish / CarePlanner** | Hard block on assigning a **new** carer until required **documents uploaded**; **expired training on a live carer is advisory only** | Hard at onboarding (doc-presence) / soft for expiry |
| **everyLIFE PASS** | No documented gate; reminders only | Advisory |
| **Log my Care** | Flags a "skills and needs gap" at scheduling but **"power stays with the rota manager"** | Soft / advisory |
| **iplanit (Aspirico)** | No rostering (integrates out); no gate | Advisory / n/a |
| **Care Control** | Matrix + reminders; rota enforces working-time only | Advisory (soft) |
| **StaffPlan (OneAdvanced)** | Skills-ranked suggestions + "warning alerts"; a possible "Carer cannot perform specified duty" duty-check (unconfirmed hard vs soft) | Advisory (mostly) |

- **No vendor documents hard *task-level* gating** (blocking the medication / moving-and-handling / catheter / PEG action because a competency expired). Hard "auto-block" language appears in **aged-care (Simplifi) / NHS (Core Schedule)** rostering, usually scoped to **role-mismatch** (RN vs EN), not blanket training-expiry.
- **Competency ≠ e-learning.** Practical competency is signed off separately via **supervisions and spot-checks** (observed, manager-signed, often per-service-user — Birdie tracks per-recipient sign-off). The clearest productised example is **Access eCompetency** — CSTF-mapped competency assessments where "employees perform tasks under observation… the assessor formally signs off the competency," stored distinctly from LMS completions and feeding gaps back to the LMS. **Cera** does a "medication competency observation" at induction + 12-week supervision checklist. **This confirms the two-track model (knowledge e-learning + observed competency) is real and worth modelling as two objects.** CQC's **Single Assessment Framework** (replaced KLOEs Jan 2024; 34 quality statements, 6 evidence categories) weights **evidenced competency, not completed workbooks** — training/competency sits under "Safe" → "processes" evidence. **The override *reason* + competency evidence matter more to an inspector than the block itself.** (SAF is a moving target — a consultation closed June 2026; sector-specific frameworks confirmed over summer 2026 — don't hard-code to the 34 statements.)
- **Gated tasks that require assessed competency (CQC/NICE):** medication (incl. CDs), moving & handling, catheter/stoma, PEG/enteral feeding, insulin/diabetes, epilepsy.

Sources: [Birdie skills-matching](https://help.birdie.care/en/articles/6615272-how-to-match-a-care-professional-s-skills-to-a-care-recipient-s-needs) · [Birdie training-expiry dashboard](https://help.birdie.care/en/articles/9357027-how-to-use-the-training-expiry-dashboard-on-birdie-analytics) · [Nourish record-keeping](https://nourishcare.com/product/features/record-keeping/) · [Log my Care rostering](https://www.logmycare.co.uk/features/rostering) · [CareLineLive rostering](https://carelinelive.com/our-solution/rostering-care-management/) · [Simplifi (aged-care hard-block)](https://simplifi.work/latest-news/aged-care-rostering-software-compliance-first-workforce-management) · [Core Schedule (NHS auto-block)](https://coreschedule.com/features/workforce-compliance/healthcare-compliance-software/) · [CQC managing medicines (competency)](https://www.cqc.org.uk/guidance-providers/adult-social-care/managing-medicines-home-care-providers) · [NICE NG67 (PEG delegation)](https://www.nice.org.uk/guidance/ng67/chapter/recommendations) · [CQC Single Assessment Framework](https://www.cqc.org.uk/guidance-regulation/providers/assessment/assessment-framework)

---

## 3. Documents — who updates them

### A) Client / care documents (care plan, risk assessment, MAR, DNACPR/ReSPECT)
- **OFFICE-authored, carer READ-ONLY is the dominant *default* — but not universal; editability is a role-permission spectrum:**
  - *Strict office-writes / carer-reads:* Log my Care (view + "mark as read"), Birdie (carers are "Viewers").
  - *Configurable per-role:* Nourish (role permission + template-lock), StoriiCare (four permission tiers; read-only is a config choice), Access (RBAC can grant view/edit/create).
  - *Carer-editable by default:* **Care Control** — carers can "update care plans" and complete care reviews on mobile (permissive opposite end).
- **Correction procedure: a carer flag / change-request that routes to the office** — the carer *signals*, the office *edits*. **Birdie implements this via its "Raise a Concern" flow** (instant office alert + audit trail; carer never edits the plan) — but it's a *general* concern channel, **not** a structured change-request tracked against a specific plan/task/med with Raised→Acknowledged→Actioned states. **Confirmed absent as a structured feature across all ~10 vendors researched** (Birdie, Nourish/CarePlanner, everyLIFE PASS, CareLineLive, Access, Cera, Log my Care, Care Control, StoriiCare, iplanit) — others lean on scheduled reviews + system warnings, or (Care Control) just let the carer edit. **→ The structured, plan-linked change-request that v3.4 §24/AC-24.3 calls a "key differentiator" is genuinely unowned by the market — the strongest single differentiator found.**
- **Daily logs / visit notes: CARER-authored, with an immutability *spectrum*:** hard app-side lock (**Log my Care** — "not possible to revise a log via the Carer app"; edits only in the office, kept as "Log Revisions") → editable-but-versioned with reason + attributed history (**Birdie**; **Access** "complete audit of any changes") → editable with edit-log but no lock (**StoriiCare** progress notes). Append-only is *evidenced but not universal* — the spec's append-only/amend-with-reason (§21/§36) sits at the stronger, defensible end.
- **Versioning is a weak spot to beat:** **StoriiCare has no care-plan version history — edits overwrite** (mitigated only by marking "Historical" / "Update Notes"). The spec's versioned records (§36) are a genuine differentiator against at least one major platform.
- **Versioning + sign-off stays office-side.** Birdie: each care-plan review creates a new dated assessment stamped with submitter; deleting is discouraged (destroys audit evidence). Nourish: a **Care Plan Agreement Signature** captured from the person/representative at conception and each review/change. everyLIFE PASS: explicit **version history + full audit trail**.

### B) Carer / staff compliance documents (DBS, right-to-work, certificates, supervisions)
- **Predominantly OFFICE / HR-managed** (regulated *employer* duty — CQC Reg 19 / Schedule 3). Birdie: Agency Hub → Team tab. Nourish: manager-facing staff record store. **Neither documents true carer self-service upload.**
- **Carer self-upload exists but is not the clear norm** — the strongest self-upload evidence was one CarePlanner/Nourish record-keeping page (staff upload references/DBS against an admin-defined required list). **Default design: office-managed with optional carer-submit-for-verification** (verified state stays office-owned).
- **Expiry** drives alerts (30-day dashboard warnings standard); a **hard rota-block on missing/expired staff docs** exists at *onboarding* (Nourish won't assign a new carer until required docs uploaded; Birdie can flag/prevent at point of scheduling), but **auto-removal of an expired-DBS carer from an already-published rota is not clearly documented** — verify per vendor.

Sources: [everyLIFE PASS care planning](https://www.everylifetechnologies.com/pass-features/pass-care-planning/) · [Birdie edit/review care plans](https://help.birdie.care/en/articles/5447058-how-to-edit-and-review-care-plans-on-birdie) · [Birdie Raise a Concern](https://help.birdie.care/en/articles/2683145-how-to-raise-a-concern-with-the-birdie-app) · [Birdie visit notes (versioned)](https://help.birdie.care/en/articles/3829292-how-to-add-and-edit-visit-notes) · [Birdie upload skills/onboarding docs](https://help.birdie.care/en/articles/5871648-how-to-upload-skills-onboarding-documents-for-a-carer) · [Nourish record-keeping](https://nourishcare.com/product/features/record-keeping/) · [CarePlanner mobile app](https://www.care-planner.co.uk/careplanner-mobile-app/) · [CareLineLive documents](https://carelinelive.com/our-solution/compliance/documents/) · [care-app.uk compliance features](https://care-app.uk/features)

---

## 4. Implications for the plan & the v3.4 gaps

- **E-learning centre (E4/E7):** model as **in-app compliance status + certificate viewer + SSO/link-out to a partner LMS**, plus the **client-condition-triggered just-in-time micro-lesson** as the differentiator, plus **offline-cached lessons** (offline-first advantage). Content spine = Care Certificate **16** standards, versioned.
- **AC-28.7 (expired-training gate):** you are **beyond-market** wanting a task-level hard-gate — nobody ships it. Keep it, but as a **conscious, configurable** safety choice on the high-risk task set only, paired with the market-normal **override-with-reason + office alert** (Birdie's warning-modal pattern) so it degrades gracefully. Capture the override reason as CQC evidence (SAF "processes").
- **AC-29.4/29.5 (carer doc upload):** default to **office-managed with optional carer-submit-for-verification** — self-upload is not the norm; the *verified* state must stay office-owned (Reg 19).
- **§24 / AC-24.3 change-request loop (E10):** confirmed a real differentiator — build the structured, plan-linked, state-tracked version (competitors only have coarse concern/flag channels).
- **Two tracks, always:** e-learning completion and observed competency sign-off are distinct — model both (Birdie tracks competency per service-user).

---

## 5. Working patterns / rolling rotas (CM2000-style anchored cycles)

How rostering software models a **repeating shift/visit pattern anchored to a start date** (the "CM2000 model").

- **The mechanism (best-documented in Access People Planner / Access Care Rostering — CM2000's own successor family):** a template carries an integer **cycle position** (`order` = 1, 2, …) and an **`Apply From W/S Date`** (week-commencing anchor) that "determines the next week that the template should apply." The rota is **generated week-by-week** off the template as new weeks roll forward. That is the `cycle_week = floor(weeks_since_anchor) mod cycle_length` model in production form. ([Access "Create templates"](https://help-accesspeopleplanner.theaccessgroup.com/en/articles/12570965-create-templates))
- **Confirmed across vendors:** Birdie — visit template "repeats every N weeks" (1–8), each schedule has a start-date/first-occurrence anchor, regular carer bound "if available", alternating per-day ([Birdie](https://help.birdie.care/en/articles/10752168-how-to-create-edit-a-visit-schedule-for-a-client-upgraded-rostering)). CareLineLive — "multiple week schedule cycle → select which week the entry applies to, or select all"; schedule *entries* are distinct from generated *bookings* ([CareLineLive](https://support.carelinelive.com/hc/en-gb/articles/360034223592-Schedule-Entries-and-Bookings)). Nourish Empower — schedules repeatable "up to four weeks."
- **Cycle lengths:** 1-week = same every week (degenerate). 2-week = classic week-A/week-B alternation (alternate weekends). 4-week = the common care-contract cycle. Only the modulus changes; anchor + day-slot lookup are identical.
- **Overrides vs pattern edits (the critical rule):** one-off changes, sickness cover and leave are **overrides on generated occurrences** and leave the repeating pattern intact. Genuine pattern changes are **effective-dated** — a new `Apply From W/S Date` (re-anchor), never a rewrite of history. Access runs: "changes to the **most recently generated week** apply to **all future** weeks; changes to **previous** weeks apply to **that week only**." So *editing the current week propagates forward; editing a past week is a one-off.*
- **Carer-facing view:** carers see the **projected concrete rota** ("today / this week / the week ahead / upcoming schedule") — **never the abstract cycle object**. No UK domiciliary carer app was found that shows the carer "you're in week 2 of 4, here's the rolling preview." **→ An explicit rolling-pattern preview + contracted-hours view for the carer is a genuine differentiator, not table stakes.**

Sources: [Access CM (ex-CM2000/CallConfirmLive!)](https://www.theaccessgroup.com/en-gb/products/cm/) · [Access People Planner "Create templates"](https://help-accesspeopleplanner.theaccessgroup.com/en/articles/12570965-create-templates) · [Access "Runs"](https://help-accesspeopleplanner.theaccessgroup.com/en/articles/12584790-runs-functionality) · [Birdie visit schedule](https://help.birdie.care/en/articles/10752168-how-to-create-edit-a-visit-schedule-for-a-client-upgraded-rostering) · [CareLineLive schedule entries](https://support.carelinelive.com/hc/en-gb/articles/360034223592-Schedule-Entries-and-Bookings) · [Nourish Empower](https://nourishcare.com/product/empower/)

## 6. Carer-app self-service (learning / training / skills / documents) — what the carer sees in-app

Research into what the **carer sees in their own mobile app** (vs the office portal) — three of these are market gaps worth owning:

| In the carer's own app | Market reality | Opportunity |
|---|---|---|
| **Take e-learning courses** | Rare & mostly indirect — **Nourish** links a **partner LMS (myAko, 60+ courses)** *directly into* the Empower app (SSO-style; native in-app completion/offline not confirmed, assignment+matrix office-side); Care Control & Access use a *separate* LMS app; Birdie/PASS/CareLineLive/Log my Care have none in-app | **A native, offline-capable, JIT in-app learning centre is a differentiator** (even Nourish only *links out* to a partner LMS) |
| **See own training/CPD record** | Rare (Care Control MyHub, Access Learning); elsewhere it's a manager/office artefact | Differentiator |
| **See own skills/competencies** | **Essentially never surfaced to the carer** — skills matrices are office-facing everywhere | Differentiator |
| **Self-upload own compliance docs (DBS/RTW/certs) + see own expiry** | **No vendor is documented as letting the carer self-upload from the app** — upload is office/HR-managed, carer views only | **Clear market gap** — model as carer-submit → office-verify (verified state office-owned, Reg 19) |
| **Expiry alert cadence** | Under-documented; typical pattern is **~30-day manager email digest**; whether the *carer* is notified of their own expiries is rarely stated | Notify the **carer** of their own expiries (most only tell the manager) |

Sources: [Birdie carer app](https://www.birdie.care/product-features/carer-app) · [Nourish Empower](https://nourishcare.com/product/empower/) · [Care Control MyHub](https://cclearninghub.co.uk/docs-category/myhub/) · [Access mobile learning](https://www.theaccessgroup.com/en-gb/digital-learning/elearning-courses/health-social-care-courses/) · [CareLineLive documents](https://carelinelive.com/our-solution/compliance/documents/) · [Log my Care carer app](https://www.logmycare.co.uk/how-it-works/app-for-carers)

---

## 7. Full-suite feature sweep (Nourish 9-product suite + Birdie) → our carer-app parity

Detailed sweep (2026-07-02) of the whole Nourish portfolio and Birdie's product-features, mapped to our
carer app. **✅ have · 🟡 partial/scoped · ❌ missing · ⛔ out-of-carer-app-scope.**

| Capability | Nourish | Birdie | **Our carer app** |
|---|---|---|---|
| eMAR (two-field/outcomes, PRN, CD, body map) | ✅ eMAR + expected-response + audit | ✅ eMAR + PRN + dm+d + body maps | ✅ two-field support×dose, PRN, CD+eligibility, orders/reconciliation (E9) |
| Observations / vitals / NEWS2 / fluid totals | ✅ observations + daily fluids totals | ✅ clinical observations | ✅ + NEWS2 + obs integrity (E9) |
| Body maps (medication + wounds) | ✅ integrated body maps | ✅ digital body maps | ✅ + structured wound vocab |
| Care-plan view + critical-info banners | ✅ contextual plans, critical-info-at-a-glance | ✅ person profiles | ✅ banners (allergy/DNACPR/2-carer/time-critical) |
| **Validated assessment library** | 🟡 assessments (ulcers/malnutrition) | ✅ **25+ validated** (Waterlow/MUST/MCA/M&H/COSHH) + recommend engine + review reminders | 🟡 consent/MCA + reablement only — **no validated library → ADD** |
| Timeline / daily notes + handover + ack | ✅ timeline + handover | ✅ visit notes + handover | ✅ + handover ack (§55.3) |
| Incidents / near-miss / safeguarding / wounds / falls | ✅ <30s point-of-care capture, near-miss, Radar integ. | ✅ concerns/auto-flag | ✅ 12 types, disclosure verbatim, restraint, drafts |
| Auto-flag concern → office alert | ✅ live event tracker | ✅ Inbox alerts | ✅ alert state machine + officeBridge |
| Check-in (GPS/geofence + QR/NFC/OTP/manual) | ✅ OTP/NFC/landline/app | ✅ GPS 200–500m + QR + OTP | ✅ geofence + NFC/QR/telephony/manual fallbacks |
| Offline-first | ✅ | ✅ ~0.6MB/visit | ✅ carerStore queue |
| Rota view + **multi-week working patterns** | 🟡 weekly/fortnightly rotas, runs | 🟡 multi-week templates | 🟡 static week — **E12 working patterns** |
| Skills matrix (carer-visible) | ❌ office matrix | ❌ office skills/training | ❌ **E12** |
| E-learning in carer app | 🟡 myAko linked into Empower | ❌ (Academy = how-to) | ❌ **E12** |
| Training records / expiry / matrix | 🟡 office matrix + dashboards | ✅ office training-expiry | 🟡 stub — **E12** |
| Staff-doc upload + expiry (carer) | ❌ office-managed | ❌ office-managed | ❌ **E12** (carer-submit → office-verify = differentiator) |
| Absence / time-off request (carer) | ✅ request in app | ✅ request in app | 🟡 stub — **E12** |
| Timesheet / mileage / travel | ✅ | ✅ in-app timesheets | ✅ |
| Lone-worker / SOS | 🟡 (via check-in) | ❌ **no discrete module** | ✅ SOS + no-service resilience (ahead) |
| Two-way messaging / inbox | ✅ 1:1 + groups | 🟡 one-way Message Centre | ✅ inbox threads |
| **Emergency admissions / hospital pack** | ✅ **Emergency Admissions Pack** | 🟡 (via profile) | 🟡 break-glass + protocols — **no hospital pack → ADD** |
| **AI-assisted recording** | ✅ Confidence AI care-plan assurance | ✅ **SmartPlans** (record→transcribe→suggest) | ❌ — **optional simulated differentiator** |
| Voice notes | ✅ dictation | ✅ voice-to-text | ✅ voice capture (transcription = minor add) |
| Family portal | ⛔ Circles of Care | ⛔ Family App (read-only) | ⛔ separate surface — out of carer-app scope |
| Office analytics/dashboards | ⛔ Insights + Confidence + Transparency | ⛔ Q-Score, Pulse, Explore | ⛔ office-facing — we have officeBridge + assurance register |
| MDM / device management | ⛔ Nourish Protect | — | ⛔ §10/§52 → B4 |
| Backend catalogs/integrations | ⛔ GP Connect, Radar | ⛔ dm+d, GP Connect, Xero, CM2000 | ⛔ simulated (order source "GP Connect") → B4 |

**Net:** carer-facing clinical/visit parity is strong (often ahead — lone-worker, order lifecycle, protocol runner). Real net-new carer-app candidates: **validated assessment library**, **emergency/hospital admissions pack**, and **optional AI-assisted recording**. The rest is either already scoped (E12) or legitimately office-facing / backend (out of a carer prototype's scope).

Sources: [Nourish product hub](https://nourishcare.com/product/) · [Nourish Better Care](https://nourishcare.com/product/better-care/) · [Better Care at Home](https://nourishcare.com/product/better-care-at-home/) · [Insights](https://nourishcare.com/product/insights/) · [Empower](https://nourishcare.com/product/empower/) · [Transparency](https://nourishcare.com/product/transparency/) · [Protect](https://nourishcare.com/product/protect/) · [Safety](https://nourishcare.com/product/safety/) · [Confidence](https://nourishcare.com/product/confidence/) · [Birdie care-management](https://www.birdie.care/care-management) · [Birdie digital assessments](https://www.birdie.care/product-features/digital-assessments) · [Birdie SmartPlans](https://www.birdie.care/smartplans) · [Birdie carer app](https://www.birdie.care/product-features/carer-app)
