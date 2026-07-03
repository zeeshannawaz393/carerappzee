# Carer App — Learning Centre (§28): design, research & plan

> **Research note:** Market research for §3–§4 was conducted **2026-07-02** via multi-source web research
> across authority bodies (Skills for Care, Skills for Health, NHS e-LfH, NHS England) and commercial
> e-learning providers. **CITED figures are provider- or authority-sourced.** Some catalogue sizes and
> refresh-cycle values are **approximate / directional** and should be treated as illustrative rather
> than contractual. See §6 for the full reference list.

## 1. Purpose & scope

The Learning Centre is an **in-app learning and development surface for care workers** inside the Carer App: a browsable course catalogue, a real course-completion loop, a CPD/certificate record, and a training-matrix view — all wired so that finishing a course visibly moves the worker's compliance state forward. Its differentiating feature is a **just-in-time (JIT) micro-lesson** tied to the *next client's condition*, surfacing a short, relevant refresher at the point of need rather than as an abstract catalogue entry. This is a **prototype-fidelity** build: the goal is to *simulate* a credible learning experience end-to-end (open → learn → assess → complete → certificate → matrix update), **not** to rebuild a full Learning Management System (LMS). Depth of content, accreditation, and long-tail catalogue are deliberately simulated or linked out, consistent with the real market pattern (SSO/link-out to a partner LMS).

## 2. What we've built (current state, as of 2026-07-02)

The Learning Centre is reachable at route **`#/carer/me/learning`** and grouped under the **Me-hub "Learning & development"** section. It implements a real **complete-a-course loop**:

> open course → lesson → knowledge check → pass → completion

with all progress **persisted to `carerStore`** so it **survives a page reload**. On completion the loop does three linked things:

1. **Issues a certificate** for the completed course.
2. **Adds a CPD entry** to the worker's record.
3. **Renews the matching training-matrix record** via `COURSE_TO_RECORD` — e.g. a BLS record flips **Expiring → Valid**.

The screen also renders the **just-in-time micro-lesson banner**, a **Care Certificate 16-standard drill-down**, and a **certificate view**.

### Files

| File | Responsibility |
|---|---|
| `src/carer/learning.js` | Learning Centre screen, course flow, knowledge check, JIT banner, certificate view |
| `src/data/carer.js` | Content data: `LEARNING_COURSES`, `LEARNING_CONTENT`, `CARE_CERT_STANDARDS`, `COURSE_TO_RECORD` |
| `src/lib/carerStore.js` | Persistence: `learning` slice (completions/CPD/certs) + `trainRenew` slice (matrix renewals) |
| `src/main.js` | `__completeCourse` — the completion handler that issues cert + CPD + matrix renewal |
| `src/carer/meScreens.js` | Training-matrix rendering (consumes renewed records) |

### Honest limitations

- **Content is prototype-depth** — courses are a small sample, each roughly 2 bullets plus 1 quiz; not real accredited curriculum.
- **The JIT lesson is currently hardcoded to one client** — it is not yet derived dynamically from the next visit's client condition.

## 3. Market research — how UK care training actually works

### 3.1 The Care Certificate

The **Care Certificate** comprises **16 standards** (2025 revision). **Standard 16 = Awareness of learning disability and autism**. It was developed jointly by **Skills for Care + Skills for Health + NHS England**. Crucially, it is assessed by a **combination of knowledge + practical skills + workplace observation + assessor sign-off** — it is **NOT** achieved by completing an online module alone. An e-learning course can only deliver the *knowledge* portion.

The Care Certificate is being **replaced by the accredited Level 2 Adult Social Care Certificate** qualification (introduced **June 2024**), which carries formal accreditation the original Care Certificate lacked.

| # | Standard | Coverage (one line) |
|---|---|---|
| 1 | Understand your role | Duties, responsibilities, employment rights, agreed ways of working |
| 2 | Your personal development | Reflective practice, feedback, learning and development plans |
| 3 | Duty of care | Acting in people's best interests; managing conflicts, comments, complaints |
| 4 | Equality and diversity | Treating people fairly; recognising and challenging discrimination |
| 5 | Work in a person-centred way | Care around the individual's needs, wishes, preferences and history |
| 6 | Communication | Verbal/non-verbal communication; meeting communication needs |
| 7 | Privacy and dignity | Respecting privacy; supporting dignity, choice and active participation |
| 8 | Fluids and nutrition | Hydration and nutrition; recognising signs of poor intake |
| 9 | Awareness of mental health, dementia and learning disability | Conditions awareness; positive, adjusted, capable-focused support |
| 10 | Safeguarding adults | Recognising, reporting and responding to abuse and neglect of adults |
| 11 | Safeguarding children | Recognising and reporting concerns about children |
| 12 | Basic life support | Emergency first aid and resuscitation basics |
| 13 | Health and safety | Risk, hazards, incidents, safe working practices |
| 14 | Handling information | Recording, storing and sharing information correctly and securely |
| 15 | Infection prevention and control | Preventing the spread of infection; hygiene and PPE |
| 16 | Awareness of learning disability and autism | Understanding learning disability and autism; reasonable adjustments |

### 3.2 Mandatory / statutory training (CSTF)

The **Skills for Health Core Skills Training Framework (CSTF)** defines **11 core mandatory subjects** that underpin statutory/mandatory training across health and social care:

1. Conflict resolution
2. Equality, diversity & human rights
3. Fire safety
4. Health, safety & welfare
5. Infection prevention & control
6. Information governance & data security
7. Moving & handling
8. Prevent / radicalisation awareness
9. Resuscitation / Basic Life Support (BLS)
10. Safeguarding adults
11. Safeguarding children

**Domiciliary (home-care) extras** layered on top of the CSTF core: food safety; Mental Capacity Act (MCA) & Deprivation of Liberty Safeguards (DoLS); first aid; medication; lone working; oral care; nutrition & hydration.

Typical **refresh cycles** (indicative — providers and commissioners vary):

| Subject | Typical refresh cycle |
|---|---|
| Basic Life Support / resuscitation | Annual |
| Moving & handling | Annual |
| Infection prevention & control | Annual |
| Fire safety | Annual |
| Conflict resolution | Annual |
| Medication | Annual |
| Food safety | Annual |
| Safeguarding adults | 2–3-yearly (annual updates common) |
| Safeguarding children | 2–3-yearly |
| Health, safety & welfare | 2–3-yearly |
| Equality, diversity & human rights | 3-yearly |
| Information governance & data security | Annual (IG refresh commonly annual) |
| Prevent / radicalisation | 3-yearly |
| MCA & DoLS | 3-yearly |
| First aid | 3-yearly (certificate validity) |

### 3.3 Specialist / clinical upskilling

Beyond the mandatory core, providers offer roughly **20 specialist/clinical domains** for role-assigned upskilling:

1. **Dementia** — Tier 1 / Tier 2 / Tier 3 (Dementia Core Skills Education & Training Framework)
2. **End-of-life / palliative** — NHS e-LfH **e-ELCA** (180+ sessions)
3. **Diabetes / insulin** administration
4. **Catheter / stoma / continence** care
5. **PEG / enteral feeding**
6. **Epilepsy** + buccal midazolam administration
7. **Stroke** care
8. **Parkinson's / Motor Neurone Disease (MND)**
9. **Learning disability & autism** — the statutory **Oliver McGowan Mandatory Training** (Tier 1 / Tier 2)
10. **Mental health & mental capacity**
11. **Tissue viability / pressure care / wound care**
12. **Dysphagia** (swallowing)
13. **Oral health**
14. **Nutrition & hydration** (specialist depth)
15. **Medication depth** — Lite → Advanced → Level 2
16. **Positive Behaviour Support (PBS)**
17. **Sepsis** awareness
18. **Falls** prevention & management
19. **Learning disability & autism awareness** (broader Tier 1 population coverage)
20. **Mental capacity / DoLS** applied practice

> The **Oliver McGowan Mandatory Training in Learning Disability and Autism** is now **statutory** for the health and social care workforce (Tier 1 for those needing general awareness, Tier 2 for those providing direct care). It is a genuine legal-driver course, not merely a specialist option.

### 3.4 Course content structure & accreditation

The market-standard course shape is:

- **Modular video** content
- **In-course knowledge checks** between modules
- A **final multiple-choice assessment with a pass mark**
  - NHS **e-LfH = 80% pass mark, 3 attempts**
  - **iHASCO = 20-question test**
- A **downloadable certificate** with **completion date and expiry date**
- **Accreditation badges** on the course/certificate:
  - **CPD Certified** — near-universal baseline
  - **Skills for Care endorsed** — the market differentiator badge
  - **RoSPA** — for safety-related content
  - **CSTF-aligned** — signals mandatory-training mapping

Indicative **catalogue sizes** (approximate):

| Provider | Approx. catalogue size |
|---|---|
| The Access Group (Access Learning) | 70+ courses |
| Social Care TV | 75+ courses |
| MyLearningCloud | 150+ courses |
| iHASCO | 250+ courses |
| Flourish / Grey Matter (adult-care) | 184 courses |

### 3.5 Qualification ladder (beyond CPD)

Learning progresses from short CPD up a formal, portfolio-assessed ladder:

```
CPD short courses
   → Care Certificate / Level 2 Adult Social Care Certificate
      → Level 2 / Level 3 Diploma in Adult Care
         → Apprenticeships:
            Adult Care Worker (L2)
             → Lead Adult Care Worker (L3)
                → Lead Practitioner in Adult Care (L4)
                   → Leader in Adult Care (L5)
```

Apprenticeship standards are assessed by **portfolio + workplace observation + End-Point Assessment (EPA)** — i.e. evidenced competency, not module completion.

## 4. Gap analysis — ours vs the market

| Dimension | Ours | Market | Gap |
|---|---|---|---|
| Course count | 10-course sample | 70–250+ per provider | Large — need full mandatory set + link-out for the long tail |
| Mandatory coverage | Partial sample | Full CSTF 11 + domiciliary extras | Missing most CSTF subjects |
| Statutory Oliver McGowan | Not present | Statutory (Tier 1/2) across the sector | Missing a legally-driven course |
| Specialist depth | Prototype-depth | ~20 clinical domains, some tiered | Shallow; no tiering |
| Content per course | ~2 bullets + 1 quiz | Modular video + in-course checks + final assessment | Much thinner |
| Assessment / pass-mark | Single knowledge check, no pass mark | Final MCQ with pass mark (e-LfH 80%, iHASCO 20-Q) | No real pass threshold |
| Refresh / expiry | None modelled | Annual / 2–3-yearly / 3-yearly cycles | No validity or expiry dates |
| Accreditation badges | None shown | CPD Certified, Skills for Care endorsed, RoSPA, CSTF-aligned | Not surfaced |
| Tiers / framework mapping | None | Care Cert standard / CSTF subject / Dementia Tier / OM Tier | No framework mapping |
| Qualification ladder | Not surfaced | CPD → Care Cert/L2 → L2/L3 Diploma → L2–L5 apprenticeships | Not represented |
| Care Cert integrity | **Completable by quiz alone** | Requires knowledge **+** practical **+** observation **+** assessor sign-off | Overstates achievement — needs observation caveat |

**Honest summary:** ours is a 10-course sample, roughly 2 bullets plus 1 quiz each, with **no pass mark, no refresh/expiry, no accreditation shown**, and a Care Certificate that is currently **completable by quiz alone** (whereas the real award needs workplace observation and assessor sign-off).

## 5. Plan

### 5.1 Cheap-realism set — ✅ BUILT & browser-verified 2026-07-02

These low-cost, high-credibility improvements are now delivered and verified in the running app:
**catalogue expanded to 25 courses** (`cc` + 16 mandatory incl. the 11 CSTF core subjects + `omt` Oliver McGowan
statutory + 7 specialists); per-course **`validityMonths` + `accreditation` badges**; **refresh chips**
("Refresher due" / "Expired — retake") driven by `courseRefreshStatus`; a **multi-question assessment with an
80% pass mark** (fail → score + Retry; pass → completion); the **Care Certificate observation caveat**
("Record knowledge element", not full certificate); and a **certificate with completion date, expiry and a
reference number**. Files: `src/data/carer.js` (`LEARNING_COURSES`/`LEARNING_CONTENT` + `courseExpiry`/
`courseRefreshStatus`), `src/carer/learning.js`. Verified: 6/25 seeded complete, ipc→"Refresher due",
bls→"Expired — retake"; Fire-safety assessment drove 0/4 fail → 4/4 pass → complete; no console errors.

Original scope (all done):

1. **Expand the catalogue** to the full **CSTF mandatory set** plus the **Oliver McGowan** statutory course.
2. Add **refresh cycles / validity per course** and **accreditation badges** (CPD Certified, Skills for Care endorsed, etc.).
3. Add a **real multi-question assessment with an 80% pass mark** (matching the e-LfH pattern).
4. Add the **Care Certificate observation caveat** — e-learning delivers the *knowledge portion only*; the award needs **workplace sign-off** — wired to the Skills "observed" competency track (the two-track model).
5. Issue a **certificate with a completion date + expiry date**.

### 5.2 Structural

**✅ Done 2026-07-02:**
- 9. **Dynamic JIT** — the micro-lesson is now derived from the client's condition via `jitCourseForSU(su)` (`data/carer.js`): the Learning Centre banner uses the **next rota visit** (e.g. Mary → Diabetes), and the visit **Overview** shows a per-client card at the point of care (e.g. Doris → Catheter & stoma care). Files: `data/carer.js` (`jitCourseForSU` + `JIT_RULES`), `carer/learning.js`, `screens/carer.js` (Overview card). Verified per-client + no console errors.
- **Cross-wiring (learning ↔ skills ↔ CPD)** — completing a course now flips the mapped **skill's e-learning track** to Complete (`SKILL_TO_COURSE`, `carer/skills.js`) while the **observed sign-off** stays required ("awaiting senior observation" — the two-track model is now functional), and the course appears in the **CPD record** transcript (`carer/learning.js`). This makes item 5.1(4)'s "wired to the Skills observed track" genuinely functional. Verified: PEG skill e-learning "Refresher due" → "Complete" on course completion; CPD record updated.

**Still later:**
- 6. **Long tail via SSO / link-out to a partner LMS** — the real market pattern (Access Evo, myAko, iHASCO, etc.).
- 7. **Badge courses** with their **Care Certificate standard / CSTF subject / Dementia Tier** mapping.
- 8. **Surface the qualification pathway** (CPD → Care Cert/L2 → Diploma → apprenticeship ladder) so workers see progression.

## 6. Content model & future admin authoring

> **Planning only — not built now.** This describes the full content a course *can* hold and an
> **authoring-ready schema** so that, later, course data can be added/edited from an **admin panel**
> (block editor) rather than hardcoded. It also records honestly what the current prototype supports.

### 6.1 Course metadata (what an admin sets per course)
Title · category · short description · **learning outcomes** · duration · **CPD hours** · **validity/refresh
period** · **accreditation** badges (CPD Certified / Skills for Care / CSTF / RoSPA) · **framework mapping**
(Care Certificate standard(s), CSTF subject, Dementia Tier) · **assignment rules** (mandatory-for-role,
region, or **client-condition** — drives JIT) · prerequisites · version / effective date / author ·
`observationRequired` (blended: needs workplace sign-off).

### 6.2 Lesson content blocks (a lesson = an ordered list of blocks)
| Block type | Payload |
|---|---|
| `text` | rich text — headings, paragraphs, bullet/numbered lists |
| `image` | src + alt + optional annotation |
| `video` | src + captions + transcript (dominant format in care e-learning) |
| `audio` | src + transcript |
| `callout` | key-point / safety-warning (tone) |
| `scenario` | a realistic situation → prompt/decision |
| `reflect` | reflective prompt (not marked) |
| `example` | dos & don'ts / good-vs-poor practice |
| `interactive` | flip cards, hotspots, accordion, click-to-reveal, drag-drop |
| `definition` | glossary term + meaning |
| `resource` | downloadable PDF / workbook / job aid / checklist |
| `standardRef` | "covers Care Certificate Standard N" / CSTF subject |

### 6.3 Assessment / question types
`single` (single-choice MCQ) · `multi` (select-all) · `truefalse` · `scenario` (situational judgement) ·
`match` / `order` / `dragdrop` · `hotspot` (tap on a body-map/image) · `freetext` (reflection, not
auto-marked). Assessment config: **pass mark**, attempt limit, **randomised pool**, shuffle options.

### 6.4 Blended / practical (regulated courses)
For the Care Certificate, moving & handling, medication, etc.: an offline **workbook** + **workplace
observation and assessor sign-off** (the observed-competency track already modelled on the Skills screen).

### 6.5 Authoring-ready schema (what the admin panel would emit as JSON)
```
{
  // metadata (§6.1) lives on LEARNING_COURSES today
  content: {
    sections: [ { title, blocks: [
        { type: 'text', md },
        { type: 'video', src, transcript },
        { type: 'scenario', prompt, options, feedback },
        { type: 'callout', tone, body },
        { type: 'resource', label, href }
    ] } ],
    assessment: { passRatio: 0.8, attempts: 3, shuffle: true,
      questions: [ { type: 'single'|'multi'|'truefalse'|'scenario'|'hotspot', q, options, answer } ] },
    workbook?: { ... },
    observationRequired?: true
  }
}
```
**Backward-compatible:** today's `points: string[]` is just one `text`-block section, and today's
`quiz: [{q,options,answer}]` is questions of `type:'single'`. So migration is additive, not a rewrite.

### 6.6 What the current prototype supports (honest) — updated 2026-07-02
**Block renderer + rich content now BUILT.** Each of the 25 courses now has authored `blocks[]` rendered
by a type-switched `renderBlock()` in `carer/learning.js`, plus multi-select questions.
| | Supported | Notes |
|---|---|---|
| Metadata (title/cat/mins/CPD/validity/accreditation) | ✅ | on `LEARNING_COURSES` |
| Description / learning outcomes | 🟡 | via a `text` block, no dedicated field |
| Framework mapping | 🟡 | `careCertStd`/`cstf`/`standards:16` + `standard` blocks; CC 16-standard drill-down renders |
| Assignment rules | 🟡 | condition-based JIT ✅; role/region ❌ |
| Observation-required (blended) | 🟡 | flag + CC caveat + Skills observed track |
| Lesson: rich text | ✅ | `text` block (**bold** + bullets) |
| Lesson: **video** (simulated player + transcript) | ✅ | `video` block — styled player + toast (no real media file) |
| Lesson: callout / key-points / **scenario** (interactive) / dos-donts / definition / resource / standard-ref | ✅ | `renderBlock()` block types |
| Lesson: image / audio | 🟡 | `image` = diagram placeholder; audio ❌ |
| Assessment: single-choice + **multi-select** + true/false + 80% pass + retry | ✅ | `single` + `multi` (true/false as 2-option single) |
| Assessment: matching / hotspot / free-text, shuffle/pool | ❌ | not yet |
| Certificate + CPD record + refresh/expiry | ✅ | built |

Everything is still **hardcoded static data** — completion *state* persists (`carerStore`), but the
*content* is authored in `data/carer.js`, not from an admin panel.

### 6.7 Migration path to admin authoring
1. ✅ **Type-switched block renderer built** (`renderBlock(block)` in `carer/learning.js`) — `points[]`
   still works as a fallback, and `blocks[]` of every type render.
2. Evolve `LEARNING_CONTENT[id]` to the §6.5 `content` schema (additive) — partially done (`blocks[]` +
   mixed-type `quiz[]`); `sections`, `shuffle`, `attempts`, `workbook` still to add.
3. Build the **admin block editor** (a form/page-builder that emits the schema JSON).
4. Move storage from static `data/carer.js` → backend/API (the prototype's `localStorage`/mock stands in
   until then).

## 7. References

### Care Certificate & qualifications

- [Skills for Care — Care Certificate standards](https://www.skillsforcare.org.uk/Developing-your-workforce/Care-Certificate/Care-Certificate-standards.aspx)
- [Skills for Care — Level 2 Adult Social Care Certificate qualification](https://www.skillsforcare.org.uk/Developing-your-workforce/Care-Certificate/Level-2/Level-2-Adult-Social-Care-Certificate-qualification.aspx)
- [Skills for Health — Care Certificate standards assessor & employer guide 2025 (PDF)](https://www.skillsforhealth.org.uk/app/uploads/2025/04/Care-Certificate-standards-assessor-and-employer-guide-2025-FINAL.pdf)
- [NCFE — New Level 2 Adult Care Certificate](https://www.ncfe.org.uk/new-level-2-adult-care-certificate/)
- [Skills England — Apprenticeship standard ST0005 (Adult Care Worker)](https://skillsengland.education.gov.uk/apprenticeship-standards/st0005-v1-2)

### CSTF / mandatory

- [Skills for Health — Core Skills Training Framework](https://www.skillsforhealth.org.uk/integrated-solutions/core-skills-training-framework/)
- [NHS e-LfH — Statutory and Mandatory Training programme](https://www.e-lfh.org.uk/programmes/statutory-and-mandatory-training/)
- [Skills for Care — Oliver McGowan Mandatory Training](https://www.skillsforcare.org.uk/Funding/Oliver-McGowan-Mandatory-Training.aspx)
- [HEE / NHS — Oliver McGowan Mandatory Training (about the training)](https://www.hee.nhs.uk/our-work/learning-disability/current-projects/oliver-mcgowan-mandatory-training-learning-disability-autism/about-training)

### Specialist & providers

- [NHS e-LfH — End of Life Care (e-ELCA)](https://www.e-lfh.org.uk/programmes/end-of-life-care/)
- [NHS e-LfH — Mental Capacity Act](https://www.e-lfh.org.uk/programmes/mental-capacity-act/)
- [Skills for Health — Dementia Core Skills Education and Training Framework (PDF)](https://www.skillsforhealth.org.uk/wp-content/uploads/2021/01/Dementia-Core-Skills-Education-and-Training-Framework.pdf)
- [iHASCO — Care Certificate training](https://www.ihasco.co.uk/courses/detail/care-certificate-training)
- [Care Skills Academy](https://careskillsacademy.co.uk/)
- [Social Care TV](https://www.social-care.tv/)
- [Flourish — Click Learning](https://flourish.co.uk/click-learning/)
- [The Access Group — Health & Social Care e-learning courses](https://www.theaccessgroup.com/en-gb/digital-learning/elearning-courses/health-social-care-courses/)
- [MyLearningCloud — e-learning courses](https://mylearningcloud.org.uk/elearning-courses/)

### Internal docs

- `docs/competitor-practice-notes.md` — competitor & sector practice notes (e-learning, training/competency, documents)
- `docs/carer-app-roadmap.md` — carer-app roadmap (Part E.5 / E.2)
