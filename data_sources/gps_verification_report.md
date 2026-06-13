# GPS Coordinate Verification Report

## Manually verified (locked)

The following 11 venues have `gps_coords` cross-checked against Google Maps
and are marked `"gps_source": "manual"` in `venues.json`. `scripts/verify_gps_coords.py`
skips them entirely so a re-run of the automated OSM pass can never overwrite
a manually-confirmed position.

- 🔒 **Main Street Bakery (Starbucks)** — 28.418037, -81.581125
- 🔒 **AstroFizz** (replaced Cool Ship at the same location) — 28.418461, -81.578941
- 🔒 **Pinocchio Village Haus** — 28.420795, -81.581457
- 🔒 **Prince Eric's Village Market** — 28.421043, -81.578571
- 🔒 **Tortuga Tavern** — 28.418553, -81.583450
- 🔒 **Cheshire Café** — 28.419954, -81.579618
- 🔒 **Cinderella's Royal Table** — 28.419715, -81.579660
- 🔒 **The Diamond Horseshoe** — 28.419105, -81.581818
- 🔒 **Liberty Square Market** — 28.419713, -81.581545
- 🔒 **Plaza Ice Cream Parlor** — 28.418132, -81.580749
- 🔒 **The Beak and Barrel** — 28.418353, -81.584458

## Automated OSM cross-check

Cross-referenced the remaining 21 `"gps_source": "osm"` venues against 30
named food/beverage points of interest from OpenStreetMap (via Overpass
API), within a bounding box covering Magic Kingdom.

A venue's `gps_coords` were updated only when the closest OSM match had name
similarity >= 0.6 AND was within 250m of the existing placeholder position.

- ✅ **Casey's Corner** matched OSM "Casey's Corner" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **The Crystal Palace** matched OSM "The Crystal Palace" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Plaza Restaurant** matched OSM "The Plaza Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Tony's Town Square Restaurant** matched OSM "Tony's Town Square Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Cosmic Ray's Starlight Café** matched OSM "Cosmic Ray's Starlight Café" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **The Lunching Pad** matched OSM "The Lunching Pad" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Tomorrowland Terrace Restaurant** matched OSM "Tomorrowland Terrace Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Auntie Gravity's Galactic Goodies** matched OSM "Auntie Gravity's Galactic Goodies" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Be Our Guest Restaurant** matched OSM "Be Our Guest Restaurant" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **The Friar's Nook** matched OSM "The Friar's Nook" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Gaston's Tavern** matched OSM "Gaston's Tavern" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Storybook Treats** matched OSM "Storybook Treats" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Liberty Tree Tavern** matched OSM "Liberty Tree Tavern" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Columbia Harbour House** matched OSM "Columbia Harbor House" (similarity 0.98, 0m from placeholder) — gps_coords updated
- ✅ **Sleepy Hollow** matched OSM "Sleepy Hollow" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Pecos Bill Tall Tale Inn and Café** matched OSM "Pecos Bill Tale Tale Inn and Café" (similarity 0.97, 0m from placeholder) — gps_coords updated
- ✅ **Golden Oak Outpost** matched OSM "Golden Oak Outpost" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Westward Ho Refreshments** matched OSM "Westward Ho!" (similarity 0.63, 0m from placeholder) — gps_coords updated
- ✅ **Jungle Navigation Co. Ltd. Skipper Canteen** matched OSM "Jungle Navigatinon Co. LTD. Skipper Canteen" (similarity 0.99, 0m from placeholder) — gps_coords updated
- ✅ **Sunshine Tree Terrace** matched OSM "Sunshine Tree Terrace" (similarity 1.00, 0m from placeholder) — gps_coords updated
- ✅ **Aloha Isle** matched OSM "Aloha Isle Refreshments" (similarity 0.61, 0m from placeholder) — gps_coords updated

**Summary:** 11 locked (manually verified), 21 updated via OSM match, 0
flagged for manual review, 0 unmatched, out of 32 venues.
