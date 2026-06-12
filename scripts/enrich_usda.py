"""
Enrich menu items with USDA FoodData Central nutrient data.

This script is a one-time data-collection helper (CLAUDE.md Phase 1, Step 3).
For each menu item in src/data/menu_items.json, it queries the USDA
FoodData Central search API and caches the top result, extracting:

    - sodium (mg)        -> dehydration risk proxy
    - total sugars (g)   -> fructose/SSB scoring support
    - protein (g)        -> purine load proxy when no Kaneko category exists

Usage:
    python3 scripts/enrich_usda.py [--api-key YOUR_KEY]

Without --api-key, the public DEMO_KEY is used (heavily rate-limited).
Register for a free key at https://fdc.nal.usda.gov/api-key-signup.html

Responses are cached to data_sources/usda_cache/{item_slug}.json so repeat
runs do not re-query items that have already been fetched.
"""

import argparse
import json
import re
import time
from pathlib import Path
from urllib.parse import quote, urlencode

import requests

USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
REQUEST_DELAY_SECONDS = 1

ROOT = Path(__file__).resolve().parent.parent
MENU_ITEMS_PATH = ROOT / "src" / "data" / "menu_items.json"
CACHE_DIR = ROOT / "data_sources" / "usda_cache"

NUTRIENT_NAMES = {
    "sodium_mg": "Sodium, Na",
    "sugars_g": "Sugars, total including NLEA",
    "protein_g": "Protein",
}


def slugify(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def fetch_food(session: requests.Session, query: str, api_key: str) -> dict | None:
    # Build the query string manually with %20 (not requests' default '+') for
    # spaces -- USDA's API rejects dataType values like "Survey (FNDDS)" with a
    # 400 if the space is sent as a literal '+'.
    params = [
        ("query", query),
        ("api_key", api_key),
        ("pageSize", 1),
        ("dataType", "Survey (FNDDS)"),
        ("dataType", "SR Legacy"),
    ]
    qs = urlencode(params, quote_via=quote)
    resp = session.get(f"{USDA_SEARCH_URL}?{qs}", timeout=15)
    if not resp.ok:
        raise requests.HTTPError(
            f"{resp.status_code} {resp.reason} for url: {resp.url}\nResponse body: {resp.text[:500]}",
            response=resp,
        )
    data = resp.json()
    foods = data.get("foods") or []
    return foods[0] if foods else None


def extract_nutrients(food: dict) -> dict:
    out = {}
    for field, nutrient_name in NUTRIENT_NAMES.items():
        for nutrient in food.get("foodNutrients", []):
            if nutrient.get("nutrientName") == nutrient_name:
                out[field] = nutrient.get("value")
                break
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key", default="DEMO_KEY", help="USDA FoodData Central API key")
    args = parser.parse_args()

    menu_items = json.loads(MENU_ITEMS_PATH.read_text(encoding="utf-8"))
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    updated = 0

    for item in menu_items:
        slug = slugify(f"{item['venue_id']}-{item['item_name']}")
        cache_path = CACHE_DIR / f"{slug}.json"

        if cache_path.exists():
            food = json.loads(cache_path.read_text(encoding="utf-8"))
        else:
            print(f"Querying USDA for: {item['item_name']}")
            try:
                food = fetch_food(session, item["item_name"], args.api_key)
            except requests.RequestException as exc:
                print(f"  [warn] USDA query failed for '{item['item_name']}': {exc}")
                food = None
            cache_path.write_text(json.dumps(food, indent=2), encoding="utf-8")
            time.sleep(REQUEST_DELAY_SECONDS)

        if not food:
            continue

        item["usda_fdc_id"] = str(food.get("fdcId", ""))
        nutrients = extract_nutrients(food)
        for field, value in nutrients.items():
            if value is not None:
                item.setdefault("usda_" + field, round(value, 1))
        updated += 1

    MENU_ITEMS_PATH.write_text(json.dumps(menu_items, indent=2), encoding="utf-8")
    print(f"Enriched {updated}/{len(menu_items)} menu items with USDA data")


if __name__ == "__main__":
    main()
