# Scoring Methodology

This document explains how "It's a Gouty World" estimates gout-risk scores
for each Magic Kingdom dining venue, and the clinical literature behind those
estimates. It is intended for patients, caregivers, and clinicians who want
to understand (and critique) the model before relying on it.

**This tool does not replace clinical dietary counseling.** It is a
screening aid to help narrow down dining choices before a park visit.

---

## Overview

Each venue is assigned three independent risk scores, each on a 0-10 scale:

| Score | What it measures |
|---|---|
| `purine_score` | Purine load of the venue's dominant menu items |
| `alcohol_score` | Availability and prominence of alcoholic beverages |
| `fructose_score` | Availability of sugar-sweetened beverages (SSBs) and high-sugar desserts |

A fourth field, `dehydration_score`, is collected as a sodium-content proxy
but is **not** currently part of the composite risk score shown to users —
dehydration is a contributing factor to gout flares but was judged too
dependent on individual fluid intake to combine meaningfully with the other
three factors in v1. It is retained in the dataset for future use.

Users can toggle each of the three factors on or off. The composite score is
the weighted average of the **active** factors only:

```
composite = (Σ active_score × weight) / (Σ weight)
```

Composite scores map to a tier:

| Score range | Tier | Meaning |
|---|---|---|
| 0 - 3 | 🟢 Green / Lower Risk | Generally safer choices available |
| 4 - 6 | 🟡 Yellow / Moderate Risk | Some risk factors present — review menu before ordering |
| 7 - 10 | 🔴 Red / Higher Risk | Multiple significant gout triggers — plan ahead or choose alternatives |

### Strictness modes

| Mode | Purines | Alcohol | Fructose |
|---|---|---|---|
| Strict | 1.0 | 1.0 | 1.0 |
| Moderate | 1.0 | 0.7 | 0.5 |
| Flexible | 1.0 | 0.5 | 0.3 |

Purines are weighted at 1.0 in every mode because dietary purine intake has
the most direct and well-established mechanistic link to serum urate.
Alcohol and fructose are down-weighted in "Moderate" and "Flexible" modes for
patients whose gout is well-controlled and who want more dining flexibility.

---

## Purine Scoring Rationale

**Primary source:** Kaneko K, et al. *Determination of Total Purine and
Purine Bases Content in Foodstuffs* / "Handbook of Purine Content in Food"
(2014) — the most comprehensive peer-reviewed purine database, and one
widely referenced in gout dietary guidance. The digitized category table
used by this app lives at `data_sources/kaneko_purines.csv`.

**Secondary references:**
- Choi HK, Atkinson K, Karlson EW, Willett W, Curhan G. *Purine-rich foods,
  dairy and protein intake, and the risk of gout in men.* N Engl J Med.
  2004;350(11):1093-1103. (The Health Professionals Follow-up Study, HPFS.)
- Neogi T, et al. *2020 American College of Rheumatology Guideline for the
  Management of Gout.* Arthritis Care Res. 2020.
- Nishioka K, et al. (1981) purine content tables, used as a cross-check for
  food categories not covered by Kaneko.

**Categories and approximate purine content (mg/100g):**

| Category | Examples | Range (mg/100g) | Tier |
|---|---|---|---|
| Organ meats | liver, kidney, heart, brain | 150-400 | High |
| High-purine seafood | anchovies, sardines, herring, mackerel | 150-350 | High |
| Moderate shellfish | shrimp, lobster, crab, scallops | 90-150 | Moderate |
| Red meat | beef, pork, lamb | 70-120 | Moderate |
| Poultry | chicken, turkey, duck | 50-110 | Moderate |
| Moderate fish | tuna, salmon, trout, cod | 50-110 | Moderate |
| Low-purine fish | tilapia, catfish, flounder | 30-60 | Low |
| Legumes | beans, lentils, peas | 40-80 | Low-moderate |
| High-purine vegetables | asparagus, spinach, mushrooms, cauliflower | 50-100 | Low |
| Dairy | milk, cheese, yogurt, ice cream | 0-15 | Low |
| Eggs | eggs | 0-10 | Low |
| Grains | bread, rice, pasta, corn | 10-40 | Low |
| Nuts/seeds | peanuts, almonds, sunflower seeds | 40-80 | Low |
| Fats/oils | butter, oils, mayo | 0-5 | Low |
| Plain sweets | sugar, candy without HFCS | 0-10 | Low (fructose risk instead) |

### Why plant purines are scored lower

Despite vegetables like asparagus, spinach, and mushrooms having a similar
purine content per 100g to moderate-purine meats, the HPFS cohort (Choi et
al., 2004) found **no significant association** between plant-purine intake
and gout risk, while animal-purine intake (meat and seafood) was strongly
associated with increased risk. The leading explanation is differences in
purine bioavailability and the accompanying nutrient matrix (e.g., dairy's
protective effect, fiber's effect on uric acid clearance). This app follows
that evidence: vegetable- and legume-derived purine sources are scored at
the "low" end even when their raw purine content overlaps with moderate-tier
animal sources.

### How a venue's purine_score is derived

Each venue's `purine_score` is a holistic 0-10 estimate based on the
**dominant protein sources across its menu**, weighted toward items a
typical guest is likely to order (entrées over garnishes). A venue whose
menu is centered on red meat or organ-meat-adjacent items (e.g., turkey
legs, which fall at the high end of the poultry range) scores higher than a
venue centered on dairy, fruit, or low-purine fish. Per-item
`purine_score_item` values in `menu_items.json` use the same 0-10 scale and
are mapped from the Kaneko category of that specific item.

---

## Alcohol Scoring Rationale

**Primary source:** Choi HK, Curhan G. *Beer, liquor, and wine consumption
and serum uric acid level: the Third National Health and Nutrition
Examination Survey.* Arthritis Rheum. 2004; and Choi HK, Atkinson K, Karlson
EW, Willett W, Curhan G. *Alcohol intake and risk of incident gout in men: a
prospective study.* Lancet. 2004;363(9417):1277-1281.

**Mechanism:** Ethanol metabolism increases ATP turnover and purine
(adenine nucleotide) degradation, raising uric acid production. Ethanol
also produces lactic acid, which competes with urate for renal tubular
excretion, reducing uric acid clearance. Beer additionally contains
guanosine, a purine-rich compound, on top of its alcohol content.

**Risk hierarchy:** Beer > liquor/spirits > wine. The Lancet 2004 cohort
found beer conferred the highest risk per serving, liquor an intermediate
risk, and moderate wine consumption was not significantly associated with
increased gout risk.

**Scoring scale used in this app:**

| Score | Criteria |
|---|---|
| 0 | No alcohol served |
| ~3 | Wine only, not a focus of the menu |
| ~4-5 | Beer and/or wine offered alongside food, not prominently featured |
| ~6 | Beer/cocktails featured as a notable menu component |
| 8+ | Specialty cocktails are a signature, prominently-marketed part of the venue's identity |

---

## Fructose / SSB Scoring Rationale

**Primary source:** Choi JW, Ford ES, Gao X, Choi HK. *Sugar-sweetened soft
drinks, diet soft drinks, and serum uric acid level: the Third National
Health and Nutrition Examination Survey.* Arthritis Rheum.
2008;59(1):109-116. Also: Choi HK, Curhan G. *Soft drinks, fructose
consumption, and the risk of gout in men: prospective cohort study.* BMJ.
2008;336(7639):309-312.

**Mechanism:** Unlike glucose, fructose metabolism in the liver rapidly
depletes intracellular ATP and phosphate, activating AMP deaminase and
accelerating purine nucleotide degradation to uric acid. This pathway is
independent of dietary purine intake — a completely vegetarian, low-purine
meal can still raise serum urate if it is paired with a large sugar-
sweetened soda.

**Diet soda:** Choi & Curhan (BMJ 2008) found no association between
artificially-sweetened ("diet") soft drinks and gout risk, because they
lack fructose. Diet sodas are therefore treated as fructose-score-neutral
in this model (`is_ssb: false`).

**Scoring approach:** A venue's `fructose_score` reflects (1) whether
sugar-sweetened beverages (regular soda, lemonade, frozen slushies, shakes,
floats) are prominent on the menu, and (2) the sugar load of the venue's
signature desserts. Venues built around frozen treats and SSBs (e.g., Dole
Whip stands, funnel cake counters) score at the high end even though they
carry essentially zero purine risk — illustrating why the three factors are
scored independently rather than combined into a single "junk food" score.

---

## Limitations

- **Purine content of specific Disney recipes is not publicly disclosed.**
  Scores are estimated from ingredient categories and known menu
  descriptions, not laboratory analysis of actual dishes. Every venue in
  `venues.json` is currently marked `"estimated": true`.
- **Menu items change seasonally** and Disney periodically refreshes its
  dining lineup. The `last_verified` field on each venue should be checked
  before a visit, and this dataset should be re-verified against
  `disney_url` quarterly (see `scripts/scrape_disney_menus.py`).
- **Individual patient factors are not captured.** Kidney function,
  medications (e.g., allopurinol, febuxostat dosing), hydration status,
  recent flare history, and total daily diet (including meals outside the
  park) all materially affect gout risk and are outside the scope of this
  tool.
- **Portion size and frequency are not modeled.** A "moderate purine" item
  eaten in a large portion, or multiple moderate-risk items ordered
  together, may carry more risk than the per-venue score suggests.
- **This tool does not replace clinical dietary counseling.** Patients
  should discuss any recurring dietary triggers with their physician or a
  registered dietitian.
