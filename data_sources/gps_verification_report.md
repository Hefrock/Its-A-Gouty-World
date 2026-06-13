# GPS Coordinate Verification Report

## Automated OSM cross-check (26 venues, run via `scripts/verify_gps_coords.py`)

Cross-referenced `src/data/venues.json` against 30 named food/beverage points of interest from OpenStreetMap (via Overpass API), within a bounding box covering Magic Kingdom.

A venue's `gps_coords` were updated only when the closest OSM match had name similarity >= 0.6 AND was within 250m of the existing placeholder position.

- ✅ **Casey's Corner** matched OSM "Casey's Corner" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **The Crystal Palace** matched OSM "The Crystal Palace" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ⚠️ **Main Street Bakery (Starbucks)**: closest OSM match "Liberty Tree Tavern" (similarity 0.54, 171m away) did not meet the confidence threshold — placeholder kept by the automated pass; **manually verified since, see below**
- ✅ **Plaza Restaurant** matched OSM "The Plaza Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Tony's Town Square Restaurant** matched OSM "Tony's Town Square Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Cosmic Ray's Starlight Café** matched OSM "Cosmic Ray's Starlight Café" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **The Lunching Pad** matched OSM "The Lunching Pad" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Tomorrowland Terrace Restaurant** matched OSM "Tomorrowland Terrace Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ⚠️ **AstroFizz**: closest OSM match "Westward Ho!" (similarity 0.40, 502m away) did not meet the confidence threshold — placeholder kept by the automated pass; **manually verified since, see below**
- ✅ **Auntie Gravity's Galactic Goodies** matched OSM "Auntie Gravity's Galactic Goodies" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Be Our Guest Restaurant** matched OSM "Be Our Guest Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ⚠️ **Pinocchio Village Haus**: closest OSM match "Pecos Bill Tale Tale Inn and Café" (similarity 0.37, 371m away) did not meet the confidence threshold — placeholder kept by the automated pass; **manually verified since, see below**
- ✅ **The Friar's Nook** matched OSM "The Friar's Nook" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Gaston's Tavern** matched OSM "Gaston's Tavern" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ⚠️ **Prince Eric's Village Market**: closest OSM match "Pecos Bill Tale Tale Inn and Café" (similarity 0.41, 628m away) did not meet the confidence threshold — placeholder kept by the automated pass; **manually verified since, see below**
- ✅ **Storybook Treats** matched OSM "Storybook Treats" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Liberty Tree Tavern** matched OSM "Liberty Tree Tavern" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Columbia Harbour House** matched OSM "Columbia Harbor House" (similarity 0.98, 0m from placeholder) — gps_coords updated
- ✅ **Sleepy Hollow** matched OSM "Sleepy Hollow" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Pecos Bill Tall Tale Inn and Café** matched OSM "Pecos Bill Tale Tale Inn and Café" (similarity 0.97, 0m from placeholder) — gps_coords updated
- ✅ **Golden Oak Outpost** matched OSM "Golden Oak Outpost" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Westward Ho Refreshments** matched OSM "Westward Ho!" (similarity 0.63, 0m from placeholder) — gps_coords updated
- ✅ **Jungle Navigation Co. Ltd. Skipper Canteen** matched OSM "Jungle Navigatinon Co. LTD. Skipper Canteen" (similarity 0.99, 0m from placeholder) — gps_coords updated
- ⚠️ **Tortuga Tavern**: closest OSM match "Gaston's Tavern" (similarity 0.64, 426m away) did not meet the confidence threshold — placeholder kept by the automated pass; **manually verified since, see below**
- ✅ **Sunshine Tree Terrace** matched OSM "Sunshine Tree Terrace" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Aloha Isle** matched OSM "Aloha Isle Refreshments" (similarity 0.61, 0m from placeholder) — gps_coords updated

**Automated pass summary:** 21 updated via OSM match, 5 flagged for manual review, 0 unmatched, out of 26 venues.

## Manual verification (Google Maps cross-check)

The 5 venues flagged above, plus 6 venues added later (PR #12, after this
script's last run) that were never run through the automated OSM pass, have
since been manually verified against Google Maps and `gps_coords` updated
accordingly:

- ✅ **Main Street Bakery (Starbucks)** — 28.418037, -81.581125
- ✅ **AstroFizz** (replaced Cool Ship at the same location) — 28.418461, -81.578941
- ✅ **Pinocchio Village Haus** — 28.420795, -81.581457
- ✅ **Prince Eric's Village Market** — 28.421043, -81.578571
- ✅ **Tortuga Tavern** — 28.418553, -81.583450
- ✅ **Cheshire Café** — 28.419954, -81.579618
- ✅ **Cinderella's Royal Table** — 28.419715, -81.579660
- ✅ **The Diamond Horseshoe** — 28.419105, -81.581818
- ✅ **Liberty Square Market** — 28.419713, -81.581545
- ✅ **Plaza Ice Cream Parlor** — 28.418132, -81.580749
- ✅ **The Beak and Barrel** — 28.418353, -81.584458

**Overall status:** all 32 venues now have verified `gps_coords` — 21 via
automated OSM name-matching, 11 via manual Google Maps cross-check.

