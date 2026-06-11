"""
Verify/refresh venue GPS coordinates against OpenStreetMap data.

The gps_coords in src/data/venues.json (used by the GPS Map tab) were
originally derived geometrically from a verified Cinderella Castle anchor
point, NOT from surveyed data (see README "GPS Map note"). This script
cross-checks them against real OpenStreetMap points of interest:

    1. Query the Overpass API for named food/beverage POIs within a
       bounding box covering Magic Kingdom.
    2. Fuzzy-match each venue's name against those POIs.
    3. For confident matches (name similarity + within MAX_DISTANCE_M of the
       current placeholder), overwrite gps_coords with the OSM position.
    4. For everything else, leave gps_coords untouched and list it in the
       generated report for manual review.

Usage:
    python3 scripts/verify_gps_coords.py

Output:
    - src/data/venues.json updated in place for confident matches
    - data_sources/osm_cache/magic_kingdom_food_pois.json (raw OSM response, cached)
    - data_sources/gps_verification_report.md (human-readable summary)
"""

import difflib
import json
import math
import re
from pathlib import Path

import requests

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
USER_AGENT = "mk-gout-heatmap-research-bot/1.0 (+https://github.com/hefrock/its-a-gouty-world)"

# Bounding box covering Magic Kingdom: (south, west, north, east)
BBOX = (28.413, -81.588, 28.423, -81.576)

NAME_SIMILARITY_THRESHOLD = 0.6
MAX_DISTANCE_M = 250

ROOT = Path(__file__).resolve().parent.parent
VENUES_JSON = ROOT / "src" / "data" / "venues.json"
OSM_CACHE = ROOT / "data_sources" / "osm_cache" / "magic_kingdom_food_pois.json"
REPORT_PATH = ROOT / "data_sources" / "gps_verification_report.md"

GPS_PATTERN = re.compile(r'"gps_coords":\s*\{\s*"lat":\s*[-\d.]+,\s*"lng":\s*[-\d.]+\s*\}')


def fetch_osm_pois() -> list[dict]:
    if OSM_CACHE.exists():
        return json.loads(OSM_CACHE.read_text(encoding="utf-8"))

    south, west, north, east = BBOX
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"~"restaurant|fast_food|cafe|ice_cream|bar|pub"]["name"]({south},{west},{north},{east});
      way["amenity"~"restaurant|fast_food|cafe|ice_cream|bar|pub"]["name"]({south},{west},{north},{east});
    );
    out center;
    """
    resp = requests.post(
        OVERPASS_URL,
        data={"data": query},
        headers={"User-Agent": USER_AGENT},
        timeout=60,
    )
    resp.raise_for_status()
    elements = resp.json().get("elements", [])

    pois = []
    for el in elements:
        name = el.get("tags", {}).get("name")
        if not name:
            continue
        if el["type"] == "node":
            lat, lng = el["lat"], el["lon"]
        else:
            center = el.get("center")
            if not center:
                continue
            lat, lng = center["lat"], center["lon"]
        pois.append({"name": name, "lat": lat, "lng": lng})

    OSM_CACHE.parent.mkdir(parents=True, exist_ok=True)
    OSM_CACHE.write_text(json.dumps(pois, indent=2), encoding="utf-8")
    return pois


def normalize(name: str) -> str:
    name = name.lower()
    name = re.sub(r"\(.*?\)", "", name)  # drop parentheticals, e.g. "(Starbucks)"
    name = re.sub(r"^the\s+", "", name)
    name = re.sub(r"[^a-z0-9 ]", "", name)
    return name.strip()


def best_match(venue_name: str, pois: list[dict]) -> tuple[dict | None, float]:
    target = normalize(venue_name)
    best, best_score = None, 0.0
    for poi in pois:
        score = difflib.SequenceMatcher(None, target, normalize(poi["name"])).ratio()
        if score > best_score:
            best_score, best = score, poi
    return best, best_score


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000  # Earth radius in meters
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def update_gps_coords(text: str, venue_id: str, lat: float, lng: float) -> str:
    id_pos = text.index(f'"id": "{venue_id}"')
    m = GPS_PATTERN.search(text, id_pos)
    if not m:
        raise ValueError(f"gps_coords not found for venue '{venue_id}'")
    replacement = f'"gps_coords": {{ "lat": {lat}, "lng": {lng} }}'
    return text[: m.start()] + replacement + text[m.end() :]


def main():
    text = VENUES_JSON.read_text(encoding="utf-8")
    venues = json.loads(text)

    pois = fetch_osm_pois()
    print(f"Fetched {len(pois)} named food/beverage POIs from OSM")

    report = [
        "# GPS Coordinate Verification Report",
        "",
        f"Cross-referenced `src/data/venues.json` against {len(pois)} named "
        "food/beverage points of interest from OpenStreetMap (via Overpass API), "
        f"within a bounding box covering Magic Kingdom.",
        "",
        f"A venue's `gps_coords` were updated only when the closest OSM match had "
        f"name similarity >= {NAME_SIMILARITY_THRESHOLD} AND was within "
        f"{MAX_DISTANCE_M}m of the existing placeholder position.",
        "",
    ]

    updated, flagged, unmatched = 0, 0, 0
    for venue in venues:
        old = venue["gps_coords"]
        poi, score = best_match(venue["name"], pois)

        if not poi:
            report.append(f"- ❌ **{venue['name']}**: no OSM food/beverage POI found nearby — placeholder kept")
            unmatched += 1
            continue

        dist_m = haversine_m(old["lat"], old["lng"], poi["lat"], poi["lng"])

        if score >= NAME_SIMILARITY_THRESHOLD and dist_m <= MAX_DISTANCE_M:
            lat, lng = round(poi["lat"], 6), round(poi["lng"], 6)
            text = update_gps_coords(text, venue["id"], lat, lng)
            report.append(
                f"- ✅ **{venue['name']}** matched OSM \"{poi['name']}\" "
                f"(similarity {score:.2f}, {dist_m:.0f}m from placeholder) — gps_coords updated"
            )
            updated += 1
        else:
            report.append(
                f"- ⚠️ **{venue['name']}**: closest OSM match \"{poi['name']}\" "
                f"(similarity {score:.2f}, {dist_m:.0f}m away) did not meet the confidence "
                f"threshold — placeholder kept, needs manual review"
            )
            flagged += 1

    report.append("")
    report.append(f"**Summary:** {updated} updated, {flagged} flagged for manual review, {unmatched} unmatched, out of {len(venues)} venues.")

    VENUES_JSON.write_text(text, encoding="utf-8")
    REPORT_PATH.write_text("\n".join(report) + "\n", encoding="utf-8")

    print(f"Updated gps_coords for {updated}/{len(venues)} venues")
    print(f"{flagged} flagged for manual review, {unmatched} had no OSM match")
    print(f"Report written to {REPORT_PATH}")


if __name__ == "__main__":
    main()
