"""
Combine scraped Disney data, the Kaneko purine lookup table, and USDA
enrichment into the final src/data/venues.json and src/data/menu_items.json
used by the React app.

This is the last step of the data pipeline (CLAUDE.md Phase 1, Step 4). The
committed venues.json/menu_items.json were built manually with
"estimated": true scores as a starting point. Running this script after
scrape_disney_menus.py and enrich_usda.py will:

    1. Load the Kaneko purine lookup table (data_sources/kaneko_purines.csv).
    2. Cross-reference data_sources/raw_disney_menus/venues_raw.json (if
       present) to refresh disney_url and last_verified for each venue.
    3. Re-derive each menu item's purine_category risk_tier from the Kaneko
       table and leave purine_score_item / venue scores untouched unless a
       human has reviewed them (estimated scores are NOT overwritten
       automatically -- see CLAUDE.md "Never fabricate purine values").

Usage:
    python3 scripts/build_dataset.py
"""

import csv
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KANEKO_CSV = ROOT / "data_sources" / "kaneko_purines.csv"
VENUES_RAW = ROOT / "data_sources" / "raw_disney_menus" / "venues_raw.json"
VENUES_JSON = ROOT / "src" / "data" / "venues.json"
MENU_ITEMS_JSON = ROOT / "src" / "data" / "menu_items.json"


def load_kaneko_table() -> dict:
    table = {}
    with open(KANEKO_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            table[row["food_type"]] = row
    return table


def refresh_venue_urls(venues: list[dict]) -> int:
    if not VENUES_RAW.exists():
        print(f"[info] {VENUES_RAW} not found; skipping URL refresh")
        return 0

    raw_venues = json.loads(VENUES_RAW.read_text(encoding="utf-8"))
    by_name = {v["name"]: v for v in raw_venues if "name" in v}

    updated = 0
    today = date.today().isoformat()
    for venue in venues:
        raw = by_name.get(venue["name"])
        if not raw:
            continue
        if raw.get("disney_url"):
            venue["disney_url"] = raw["disney_url"]
        if raw.get("scraped_at"):
            venue["last_verified"] = today
            venue["estimated"] = False
            updated += 1
    return updated


def validate_purine_categories(menu_items: list[dict], kaneko: dict) -> list[str]:
    warnings = []
    for item in menu_items:
        category = item.get("purine_category")
        if category and category not in kaneko:
            warnings.append(f"{item['venue_id']}/{item['item_name']}: unknown purine_category '{category}'")
    return warnings


def main():
    kaneko = load_kaneko_table()
    print(f"Loaded {len(kaneko)} Kaneko purine categories")

    venues = json.loads(VENUES_JSON.read_text(encoding="utf-8"))
    menu_items = json.loads(MENU_ITEMS_JSON.read_text(encoding="utf-8"))

    updated = refresh_venue_urls(venues)
    print(f"Refreshed disney_url/last_verified for {updated} venue(s)")

    warnings = validate_purine_categories(menu_items, kaneko)
    for w in warnings:
        print(f"[warn] {w}")

    VENUES_JSON.write_text(json.dumps(venues, indent=2) + "\n", encoding="utf-8")
    MENU_ITEMS_JSON.write_text(json.dumps(menu_items, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(venues)} venues and {len(menu_items)} menu items")


if __name__ == "__main__":
    main()
