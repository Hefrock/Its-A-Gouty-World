# GPS Coordinate Verification Report

Cross-referenced `src/data/venues.json` against 30 named food/beverage points of interest from OpenStreetMap (via Overpass API), within a bounding box covering Magic Kingdom.

A venue's `gps_coords` were updated only when the closest OSM match had name similarity >= 0.6 AND was within 250m of the existing placeholder position.

- ✅ **Casey's Corner** matched OSM "Casey's Corner" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **The Crystal Palace** matched OSM "The Crystal Palace" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ⚠️ **Main Street Bakery (Starbucks)**: closest OSM match "Liberty Tree Tavern" (similarity 0.54, 171m away) did not meet the confidence threshold — placeholder kept, needs manual review
- ✅ **Plaza Restaurant** matched OSM "The Plaza Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Tony's Town Square Restaurant** matched OSM "Tony's Town Square Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Cosmic Ray's Starlight Café** matched OSM "Cosmic Ray's Starlight Café" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **The Lunching Pad** matched OSM "The Lunching Pad" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Tomorrowland Terrace Restaurant** matched OSM "Tomorrowland Terrace Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ⚠️ **AstroFizz**: closest OSM match "Westward Ho!" (similarity 0.40, 502m away) did not meet the confidence threshold — placeholder kept, needs manual review
- ✅ **Auntie Gravity's Galactic Goodies** matched OSM "Auntie Gravity's Galactic Goodies" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Be Our Guest Restaurant** matched OSM "Be Our Guest Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ⚠️ **Pinocchio Village Haus**: closest OSM match "Pecos Bill Tale Tale Inn and Café" (similarity 0.37, 371m away) did not meet the confidence threshold — placeholder kept, needs manual review
- ✅ **The Friar's Nook** matched OSM "The Friar's Nook" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Gaston's Tavern** matched OSM "Gaston's Tavern" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ⚠️ **Prince Eric's Village Market**: closest OSM match "Pecos Bill Tale Tale Inn and Café" (similarity 0.41, 628m away) did not meet the confidence threshold — placeholder kept, needs manual review
- ✅ **Storybook Treats** matched OSM "Storybook Treats" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Liberty Tree Tavern** matched OSM "Liberty Tree Tavern" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Columbia Harbour House** matched OSM "Columbia Harbor House" (similarity 0.98, 0m from placeholder) — gps_coords updated
- ✅ **Sleepy Hollow** matched OSM "Sleepy Hollow" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Pecos Bill Tall Tale Inn and Café** matched OSM "Pecos Bill Tale Tale Inn and Café" (similarity 0.97, 0m from placeholder) — gps_coords updated
- ✅ **Golden Oak Outpost** matched OSM "Golden Oak Outpost" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Westward Ho Refreshments** matched OSM "Westward Ho!" (similarity 0.63, 0m from placeholder) — gps_coords updated
- ✅ **Jungle Navigation Co. Ltd. Skipper Canteen** matched OSM "Jungle Navigatinon Co. LTD. Skipper Canteen" (similarity 0.99, 0m from placeholder) — gps_coords updated
- ⚠️ **Tortuga Tavern**: closest OSM match "Gaston's Tavern" (similarity 0.64, 426m away) did not meet the confidence threshold — placeholder kept, needs manual review
- ✅ **Sunshine Tree Terrace** matched OSM "Sunshine Tree Terrace" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Aloha Isle** matched OSM "Aloha Isle Refreshments" (similarity 0.61, 0m from placeholder) — gps_coords updated

**Summary:** 21 updated, 5 flagged for manual review, 0 unmatched, out of 26 venues.
