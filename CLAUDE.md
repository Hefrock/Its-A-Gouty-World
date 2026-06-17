# CLAUDE.md — Magic Kingdom Gout-Safe Dining Heatmap

## Project Overview

Build an interactive React web app that visualizes all Magic Kingdom eateries on a risk heatmap for patients with recurring gouty arthritis. Users can toggle three independent gout risk factors (purines, alcohol, fructose/SSBs) to see how each venue's risk rating changes in real time. The app targets patients, caregivers, and clinicians.

**Live URL target:** Deploy as a GitHub Pages site from this repo.

---

## Current Implementation Status (Read First)

The sections below this point are the **original handoff spec** and remain
useful for understanding intent, clinical rationale, and build order. The
app has since evolved beyond that spec in the following ways — where the
spec below conflicts with this section, **this section is authoritative**:

- **Stack versions:** React 19 (not 18) and Tailwind CSS v4 (via
  `@tailwindcss/vite`) are in use. Vitest is used for unit tests
  (`src/scoring/engine.test.js`, `src/scoring/thresholds.test.js`,
  `src/scoring/itemRisk.test.js`).
- **A second map view was added** — `src/components/GPSMapView.jsx`, built
  with `react-leaflet` + OpenStreetMap tiles (real lat/lng in
  `venue.gps_coords`). This is an intentional, deliberate addition to the
  "No external map library" constraint below: the original SVG `MapView`
  remains the primary/default view (no Disney artwork, original geometry),
  and the GPS Map is an opt-in secondary tab. All 32 venues' `gps_coords`
  have been cross-checked against OpenStreetMap node positions and/or
  Google Maps (see `data_sources/gps_verification_report.md`), though not
  yet against on-site GPS readings. Each venue has a `gps_source` field
  (`"osm"` or `"manual"`); `scripts/verify_gps_coords.py` (run periodically
  via `.github/workflows/data-refresh.yml`) only re-matches `"osm"` venues
  against OpenStreetMap and skips `"manual"` ones entirely, so a
  manually-confirmed Google Maps position can never be silently overwritten
  by a lower-confidence automated match. The same workflow also refreshes
  USDA enrichment data in `menu_items.json`.
- **`src/scoring/thresholds.js`** defines the full score→tier mapping
  (`scoreToTier`), including `color`, `bgClass`, `textClass`, `borderClass`,
  `icon`, and `label` per tier — not just the `tier`/`label` strings shown in
  the original `computeVenueScore` snippet below.
- **`src/scoring/engine.js`** also exports `getScoreBreakdown(venue)` (used
  by `VenueCard`'s bar chart) and `getExtremeFactors(venue, activeToggles,
  compositeTier)` — see "Extreme-axis indicator" below.
- **`dehydration_score`** is collected in `venues.json` but intentionally
  **excluded** from the composite score (documented in
  `docs/scoring_methodology.md`); it's retained for possible future use.
- **Venue data additions:** `venues.json` entries may include
  `operating_status` (`temporarily_closed` | `seasonal_pause` |
  `limited_service`) and `status_note`. Non-`open` venues get a ⚠️ icon on
  `MapView`, `GPSMapView`, and `ListView`, plus full detail in `VenueCard`
  (see `src/utils/operatingStatus.js`).
- **Menu item additions:** `menu_items.json` entries include a `flags` array
  (`high_purine`, `alcohol_sugar_combo`, `high_fructose`, `high_sodium`)
  based on fixed clinical thresholds, rendered as icons (via
  `src/utils/menuItemFlags.js`) in `VenueCard`'s Higher/Lower-Risk lists and
  in `MenuView`. These can disagree with the per-venue relative ranking
  (`itemRisk()`, in `src/scoring/itemRisk.js`); `VenueCard` shows explainer
  copy rather than reconciling the two.
- **`src/components/MenuView.jsx`** is a 4th tab (alongside Map/List/GPS
  Map) listing the 10 highest- and 10 lowest-risk individual menu items
  across all venues, ranked by the same toggle-agnostic `itemRisk()` used
  in `VenueCard`, not the toggle-aware venue composite score. Items sharing
  the same `item_name` across multiple venues (e.g. "Fountain Soda" or
  "Roasted Turkey Leg") are merged into a single row — their risk scores
  averaged, flags unioned — with one clickable venue link per venue that
  serves it, rather than appearing as separate, repetitive rows.
- **Extreme-axis indicator (⚡):** Because the composite is a weighted
  average, a single active factor whose own tier is Higher Risk (score ≥7)
  can be "averaged down" into a lower composite tier.
  `getExtremeFactors(venue, activeToggles, compositeTier)` flags any active
  factor in the red tier when the composite tier is not also red, surfacing
  it independently as a ⚡ badge in `VenueCard`, a dashed red ring on map
  markers, and a ⚡ icon in `ListView`'s Risk Tier column, with an
  explanatory entry in `Legend.jsx`.

---

## Repo Structure

```
mk-gout-heatmap/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx                  # Root component, toggle state
│   ├── components/
│   │   ├── MapView.jsx          # SVG park map with colored venue markers
│   │   ├── ListView.jsx         # Sortable/filterable table of venues
│   │   ├── VenueCard.jsx        # Popup/detail card per venue
│   │   ├── TogglePanel.jsx      # Three risk-factor toggles + strictness selector
│   │   └── Legend.jsx           # Green/yellow/red legend with clinical notes
│   ├── scoring/
│   │   ├── engine.js            # Core scoring logic (pure functions)
│   │   ├── weights.js           # Weight configs for each strictness mode
│   │   └── thresholds.js        # Score → color tier mapping
│   ├── data/
│   │   ├── venues.json          # All MK eateries with metadata
│   │   ├── menu_items.json      # Menu items per venue with raw scores
│   │   └── purine_lookup.csv    # Kaneko-derived purine categories by food type
│   └── utils/
│       └── mapCoords.js         # Venue lat/long → SVG pixel coordinate transforms
├── scripts/
│   ├── scrape_disney_menus.py   # One-time scraper for Disney dining pages
│   ├── enrich_usda.py           # USDA FoodData Central API enrichment
│   └── build_dataset.py         # Combines all sources → venues.json + menu_items.json
├── data_sources/
│   ├── kaneko_purines.csv       # Manually digitized Kaneko et al. 2014 purine table
│   ├── raw_disney_menus/        # HTML dumps from Disney scrape (gitignored)
│   └── usda_cache/              # USDA API response cache (gitignored)
├── docs/
│   └── scoring_methodology.md   # Clinical rationale, citations, limitations
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages deploy on push to main
├── package.json
├── vite.config.js
└── README.md
```

---

## Phase 1 — Data Collection & Dataset Build

### Step 1: Scrape Disney Menus (`scripts/scrape_disney_menus.py`)

Scrape all Magic Kingdom dining locations from Disney's official site. These pages are public HTML.

**Target base URL:** `https://disneyworld.disney.go.com/dining/?park=magic-kingdom`

**For each venue, collect:**
- Venue name
- Land/zone (Main Street U.S.A., Adventureland, Frontierland, Liberty Square, Fantasyland, Tomorrowland)
- Service type: `quick_service` | `table_service` | `snack_cart` | `kiosk`
- Official Disney URL for the venue's menu page
- All menu items with: name, category (entrée/side/dessert/beverage), listed ingredients/description

**Implementation notes:**
- Use `requests` + `BeautifulSoup4`
- Respect `robots.txt` — Disney permits public menu page crawling
- Add 2-second delay between requests
- Save raw HTML per venue to `data_sources/raw_disney_menus/{venue_slug}.html`
- Log `scraped_at` timestamp per venue for freshness tracking
- If scraping is blocked, fall back to manually building the dataset from the venue list below

**Known Magic Kingdom dining venues (complete list as of 2024–2025 — verify against live site):**

Main Street U.S.A.:
- Casey's Corner
- The Crystal Palace (table service)
- Main Street Bakery (Starbucks)
- Plaza Restaurant (table service)
- Tony's Town Square Restaurant (table service)
- The Friar's Nook (snack)
- Storybook Treats (snack)
- Auntie Gravity's Galactic Goodies

Adventureland:
- Jungle Navigation Co. Ltd. Skipper Canteen (table service)
- Tortuga Tavern
- Sunshine Tree Terrace
- Aloha Isle

Frontierland:
- Pecos Bill Tall Tale Inn and Café
- Golden Oak Outpost
- Westward Ho Refreshments

Liberty Square:
- Liberty Tree Tavern (table service)
- Columbia Harbour House
- Sleepy Hollow

Fantasyland:
- Be Our Guest Restaurant (table service)
- Pinocchio Village Haus (table service)
- Storybook Dining at Artist Point (table service — note: this is at Wilderness Lodge, exclude)
- The Friar's Nook
- Gaston's Tavern
- Prince Eric's Village Market
- Storybook Treats

Tomorrowland:
- Cosmic Ray's Starlight Café
- The Lunching Pad
- Tomorrowland Terrace Restaurant (seasonal)
- Cool Ship

**Output:** `data_sources/raw_disney_menus/` + a master `venues_raw.json`

---

### Step 2: Purine Lookup Table (`data_sources/kaneko_purines.csv`)

**Source:** Kaneko K, et al. "Handbook of Purine Content in Food" (2014). This is the most comprehensive peer-reviewed purine database, widely cited in ACR guidelines and gout literature.

**Manually digitize this table** (Claude Code: do not fabricate values — use only values from the published Kaneko table or equivalent peer-reviewed sources listed below).

**Purine category schema for `kaneko_purines.csv`:**

```csv
food_type,common_examples,purine_mg_per_100g_low,purine_mg_per_100g_high,risk_tier,notes
organ_meats,"liver, kidney, heart, brain",150,400,high,"Highest purine density of any food group"
shellfish_high,"anchovies, sardines, herring, mackerel",150,350,high,"Also high in purines per ACR guidelines"
shellfish_moderate,"shrimp, lobster, crab, scallops",90,150,moderate,"Moderate — portion size matters"
red_meat,"beef, pork, lamb",70,120,moderate,"Varies by cut; organ meats excluded"
poultry,"chicken, turkey, duck",50,110,moderate,"Turkey leg notably higher end"
fish_moderate,"tuna, salmon, trout, cod",50,110,moderate,"Lower than shellfish but still meaningful"
fish_low,"tilapia, catfish, flounder",30,60,low,""
legumes,"beans, lentils, peas",40,80,low_moderate,"Evidence suggests plant purines less bioavailable"
vegetables_high,"asparagus, spinach, mushrooms, cauliflower",50,100,low,"Plant purines not strongly associated with gout risk in epidemiological studies"
dairy,"milk, cheese, yogurt, ice cream",0,15,low,"Dairy is protective; inversely associated with gout"
eggs,eggs,0,10,low,"Very low purine content"
grains,"bread, rice, pasta, corn",10,40,low,""
nuts_seeds,"peanuts, almonds, sunflower seeds",40,80,low,""
fats_oils,"butter, oils, mayo",0,5,low,""
sweets_plain,"sugar, candy without HFCS",0,10,low,"Risk via fructose pathway, not purines"
```

**Secondary purine sources to cross-reference:**
- Nishioka K et al. (1981) purine tables
- US National Gout Foundation dietary guidelines
- BMJ 2004 Choi HK et al. — landmark HPFS study on diet and gout risk

---

### Step 3: USDA FoodData Central Enrichment (`scripts/enrich_usda.py`)

**API:** `https://api.nal.usda.gov/fdc/v1/` — no API key required for basic use (demo key); register for higher rate limits at `fdc.nal.usda.gov`.

**For each menu item, query USDA for:**
- Sodium content (mg per serving) → dehydration risk proxy
- Total sugars (g per serving) → fructose/SSB scoring support
- Protein (g per serving) → purine load proxy when Kaneko category unavailable

**Query strategy:**
```python
# Search by food name, take top result, extract nutrients
GET https://api.nal.usda.gov/fdc/v1/foods/search?query={item_name}&api_key=DEMO_KEY
```

Cache all responses to `data_sources/usda_cache/{item_slug}.json` to avoid repeat API calls.

**Output:** Enrichment fields merged into `menu_items.json`

---

### Step 4: Build Final Dataset (`scripts/build_dataset.py`)

Combines scrape output + Kaneko lookup + USDA enrichment into two clean JSON files:

**`src/data/venues.json`** — one object per venue:
```json
{
  "id": "caseys-corner",
  "name": "Casey's Corner",
  "land": "main_street",
  "service_type": "quick_service",
  "disney_url": "https://disneyworld.disney.go.com/dining/magic-kingdom/caseys-corner/",
  "map_coords": { "x": 512, "y": 380 },
  "last_verified": "2025-01-01",
  "alcohol_available": false,
  "scores": {
    "purine_score": 4,
    "alcohol_score": 0,
    "fructose_score": 5,
    "dehydration_score": 6
  },
  "score_notes": {
    "purine": "Hot dogs are moderate-purine (pork); corn dog nuggets similar",
    "alcohol": "No alcohol served",
    "fructose": "Fountain sodas available; lemonade on menu",
    "dehydration": "High sodium across most items"
  }
}
```

**`src/data/menu_items.json`** — one object per menu item:
```json
{
  "venue_id": "caseys-corner",
  "item_name": "All-Beef Hot Dog",
  "category": "entree",
  "purine_category": "red_meat",
  "purine_score_item": 5,
  "alcohol": false,
  "is_ssb": false,
  "sugar_g": 4,
  "sodium_mg": 720,
  "usda_fdc_id": "174894",
  "notes": "Beef hot dog; moderate purine content"
}
```

---

## Phase 2 — Scoring Engine

### File: `src/scoring/engine.js`

The scoring engine takes a venue object + active toggles + strictness mode and returns a composite risk score and color tier.

```javascript
/**
 * Scoring Engine — Magic Kingdom Gout Heatmap
 *
 * Three independent risk dimensions, each scored 0–10:
 *   - purine_score: Based on dominant protein types on menu (Kaneko categories)
 *   - alcohol_score: Availability and prominence of alcohol
 *   - fructose_score: SSB availability + dessert sugar load
 *
 * Three strictness modes affect score weights:
 *   - strict: All three factors weighted equally (1.0 each)
 *   - moderate: Purines 1.0, alcohol 0.7, fructose 0.5
 *   - flexible: Purines 1.0, alcohol 0.5, fructose 0.3
 *
 * Composite score = weighted average of ACTIVE toggles only.
 * Score 0–3 → green, 4–6 → yellow, 7–10 → red.
 */

export function computeVenueScore(venue, activeToggles, strictnessMode) {
  const weights = WEIGHTS[strictnessMode];
  let totalWeight = 0;
  let weightedScore = 0;

  if (activeToggles.purines) {
    weightedScore += venue.scores.purine_score * weights.purines;
    totalWeight += weights.purines;
  }
  if (activeToggles.alcohol) {
    weightedScore += venue.scores.alcohol_score * weights.alcohol;
    totalWeight += weights.alcohol;
  }
  if (activeToggles.fructose) {
    weightedScore += venue.scores.fructose_score * weights.fructose;
    totalWeight += weights.fructose;
  }

  if (totalWeight === 0) return { score: 0, tier: 'green', label: 'No factors selected' };

  const composite = weightedScore / totalWeight;
  return {
    score: Math.round(composite * 10) / 10,
    tier: composite <= 3 ? 'green' : composite <= 6 ? 'yellow' : 'red',
    label: composite <= 3 ? 'Lower Risk' : composite <= 6 ? 'Moderate Risk' : 'Higher Risk'
  };
}
```

### File: `src/scoring/weights.js`

```javascript
export const WEIGHTS = {
  strict:   { purines: 1.0, alcohol: 1.0, fructose: 1.0 },
  moderate: { purines: 1.0, alcohol: 0.7, fructose: 0.5 },
  flexible: { purines: 1.0, alcohol: 0.5, fructose: 0.3 },
};
```

---

## Phase 3 — React App

### Technology Stack
- **React 18** with Vite
- **Tailwind CSS** for styling
- **No external map library** — use a custom SVG map of Magic Kingdom (see below)
- **Recharts** for optional score breakdown bar chart in venue detail cards

### Component Specs

#### `TogglePanel.jsx`
Three large toggle buttons (pill style), one per risk factor:
- 🥩 **Purines** — default ON
- 🍺 **Alcohol** — default ON
- 🥤 **Fructose / SSBs** — default ON

Below toggles: a **strictness selector** with three radio options: Strict | Moderate | Flexible. Include a tooltip/info icon explaining the difference.

When a toggle is off, that factor is excluded from scoring entirely and the map/list updates immediately.

#### `MapView.jsx`
- Use a **simplified SVG representation** of Magic Kingdom's hub-and-spoke layout. Do not use a copyrighted Disney map image.
- Draw the park as an abstract SVG: circular hub in center (Cinderella Castle), six "land" wedges radiating outward (Main Street at bottom, then clockwise: Tomorrowland, Fantasyland, Liberty Square, Frontierland, Adventureland).
- Each venue renders as a **colored circle marker** (green/yellow/red) positioned within its land zone.
- On hover: show venue name + composite score in a tooltip.
- On click: open `VenueCard` detail panel.
- Include land labels on the SVG.

#### `ListView.jsx`
- Sortable table columns: Venue Name | Land | Service Type | Purine Score | Alcohol Score | Fructose Score | Composite Score | Risk Tier
- Default sort: Composite Score descending (highest risk first)
- Color-code the Risk Tier cell (green/yellow/red background)
- Search/filter input at top
- Toggle columns shown based on active toggles (hide Alcohol Score column when alcohol toggle is off)

#### `VenueCard.jsx`
Slide-in panel or modal showing:
- Venue name, land, service type
- Score breakdown: horizontal bar chart (Recharts) showing all three sub-scores
- Current composite score + tier badge
- Menu highlights: list top 3 highest-risk items and top 3 lowest-risk items
- Score notes explaining the ratings
- `last_verified` date with note: "Menu data verified [date]. Disney menus change — verify at [Disney URL] before your visit."
- Link to official Disney menu page

#### `Legend.jsx`
Fixed footer or sidebar:
- 🟢 Green (0–3): Generally safer choices available
- 🟡 Yellow (4–6): Some risk factors present — review menu before ordering
- 🔴 Red (7–10): Multiple significant gout triggers — plan ahead or choose alternatives
- Small disclaimer: "This tool is for informational purposes. Consult your physician or dietitian for personalized guidance."

---

## Phase 4 — Clinical Methodology Documentation

### File: `docs/scoring_methodology.md`

Write a detailed methodology document covering:

**Purine Scoring Rationale:**
- Source: Kaneko K et al. 2014 purine content tables
- Key references: Choi HK et al. BMJ 2004 (dietary risk factors for gout); Neogi T et al. ACR 2020 gout guidelines
- Why plant purines are scored lower: epidemiological evidence (Choi 2004, HPFS cohort) shows plant-based purines do not significantly raise gout risk compared to animal purines
- Scoring logic: venue score derived from the weighted average of top menu items by purine category

**Alcohol Scoring Rationale:**
- Mechanism: ethanol → increased purine synthesis + blocks renal urate excretion (Choi HK, Curhan G. Alcohol intake and risk of incident gout in men. Lancet 2004)
- Beer > liquor > wine in risk hierarchy
- Score: 0 if no alcohol, 3 if wine only available, 6 if beer/cocktails available, 8+ if prominently featured

**Fructose/SSB Scoring Rationale:**
- Mechanism: fructose metabolism → ATP degradation → uric acid synthesis (Choi JW, Ford ES, Gao X, Choi HK. Sugar-sweetened soft drinks, diet soft drinks, and serum uric acid level. Arthritis Rheum 2008)
- Score: presence and variety of SSBs on menu; dessert sugar load as secondary signal
- Diet sodas do not contribute (no fructose pathway)

**Limitations:**
- Purine content of specific Disney recipes is not publicly disclosed; scores are estimated from ingredient categories
- Menu items change seasonally — tool should be re-verified quarterly
- Individual patient factors (kidney function, medications, hydration status) are not captured
- This tool does not replace clinical dietary counseling

---

## Phase 5 — GitHub Pages Deployment

### File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Set `base` in `vite.config.js` to `'/mk-gout-heatmap/'` (repo name).

---

## Phase 6 — README.md

Write a thorough README including:
- What the app does and why
- Screenshot placeholder
- How to run locally (`npm install && npm run dev`)
- Data sources with citations
- How to contribute / report menu changes (GitHub Issues template)
- Medical disclaimer
- License (MIT)

---

## Build Order for Claude Code

Execute in this order:

1. `npm create vite@latest mk-gout-heatmap -- --template react` → set up project
2. Install deps: `npm install tailwindcss recharts`
3. Build `src/scoring/` (engine, weights, thresholds) — pure JS, no dependencies
4. Build `src/data/venues.json` manually from the venue list above with estimated scores (data pipeline scripts come later)
5. Build React components in order: `TogglePanel` → `Legend` → `VenueCard` → `ListView` → `MapView` → `App`
6. Wire state in `App.jsx`: toggle state + strictness flow down as props; scoring computed in App and passed to both MapView and ListView
7. Write `scripts/scrape_disney_menus.py` and run it (Python 3, requires `requests beautifulsoup4`)
8. Write `scripts/enrich_usda.py` and run it
9. Write `scripts/build_dataset.py` to regenerate `venues.json` and `menu_items.json` from real data
10. Replace manually estimated scores in `venues.json` with data-pipeline output
11. Write `docs/scoring_methodology.md`
12. Write `README.md`
13. Add `.github/workflows/deploy.yml`
14. Push to GitHub, enable GitHub Pages from Actions in repo settings

---

## Key Constraints & Decisions

- **Never use Disney-owned map images or park artwork** — all map visuals must be original SVG geometry
- **Never fabricate purine values** — use only Kaneko table or cited peer-reviewed sources; mark any estimate as `"estimated": true` in the data
- **Scoring is per-venue, not per-item** — the app scores venues holistically so users can make a go/no-go decision per restaurant, not navigate a full menu in the park
- **Mobile-responsive** — many users will be at the park on their phone; test at 390px width
- **No backend required** — fully static, all data baked into JSON at build time
- **Accessibility** — color alone is not the only signal; use icons (✅ ⚠️ ❌) alongside green/yellow/red for colorblind users

---

## Repo Name

`Its-A-Gouty-World`

---

*Generated by Claude.ai — handoff document for Claude Code build session.*
*Project conceived as a patient/clinician tool for gout dietary management at Magic Kingdom.*
