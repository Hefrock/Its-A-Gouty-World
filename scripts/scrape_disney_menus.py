"""
Scrape Magic Kingdom dining venue and menu data from Disney's public dining
pages.

This script is a one-time data-collection helper. It is NOT run automatically
as part of the build -- the committed src/data/venues.json and
src/data/menu_items.json were built manually (see CLAUDE.md Phase 1, Step 4)
using publicly known menu information and are marked "estimated": true.

Usage:
    python3 scripts/scrape_disney_menus.py

Output:
    data_sources/raw_disney_menus/{venue_slug}.html   -- raw HTML per venue
    data_sources/raw_disney_menus/venues_raw.json     -- master venue list

Notes:
    - Respects robots.txt and adds a 2-second delay between requests.
    - If Disney's site blocks scraping (bot protection, JS-rendered content,
      changed markup, etc.), this script will log a warning per venue and
      leave that venue out of venues_raw.json. In that case, fall back to
      manually maintaining src/data/venues.json as described in CLAUDE.md.
"""

import json
import re
import time
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://disneyworld.disney.go.com"
DINING_INDEX_URL = f"{BASE_URL}/dining/?park=magic-kingdom"
USER_AGENT = "mk-gout-heatmap-research-bot/1.0 (+https://github.com/hefrock/its-a-gouty-world)"
REQUEST_DELAY_SECONDS = 2

RAW_DIR = Path(__file__).resolve().parent.parent / "data_sources" / "raw_disney_menus"

# Fallback list used if the live index page can't be parsed (matches
# CLAUDE.md's "Known Magic Kingdom dining venues" list, deduplicated).
FALLBACK_VENUES = [
    {"name": "Casey's Corner", "land": "main_street", "service_type": "quick_service"},
    {"name": "The Crystal Palace", "land": "main_street", "service_type": "table_service"},
    {"name": "Main Street Bakery (Starbucks)", "land": "main_street", "service_type": "quick_service"},
    {"name": "Plaza Restaurant", "land": "main_street", "service_type": "table_service"},
    {"name": "Plaza Ice Cream Parlor", "land": "main_street", "service_type": "kiosk"},
    {"name": "Tony's Town Square Restaurant", "land": "main_street", "service_type": "table_service"},
    {"name": "Jungle Navigation Co. Ltd. Skipper Canteen", "land": "adventureland", "service_type": "table_service"},
    {"name": "Tortuga Tavern", "land": "adventureland", "service_type": "quick_service"},
    {"name": "Sunshine Tree Terrace", "land": "adventureland", "service_type": "kiosk"},
    {"name": "Aloha Isle", "land": "adventureland", "service_type": "kiosk"},
    {"name": "The Beak and Barrel", "land": "adventureland", "service_type": "kiosk"},
    {"name": "Pecos Bill Tall Tale Inn and Café", "land": "frontierland", "service_type": "quick_service"},
    {"name": "Golden Oak Outpost", "land": "frontierland", "service_type": "kiosk"},
    {"name": "Westward Ho Refreshments", "land": "frontierland", "service_type": "snack_cart"},
    {"name": "The Diamond Horseshoe", "land": "frontierland", "service_type": "table_service"},
    {"name": "Liberty Tree Tavern", "land": "liberty_square", "service_type": "table_service"},
    {"name": "Columbia Harbour House", "land": "liberty_square", "service_type": "quick_service"},
    {"name": "Liberty Square Market", "land": "liberty_square", "service_type": "snack_cart"},
    {"name": "Sleepy Hollow", "land": "liberty_square", "service_type": "kiosk"},
    {"name": "Be Our Guest Restaurant", "land": "fantasyland", "service_type": "table_service"},
    {"name": "Cinderella's Royal Table", "land": "fantasyland", "service_type": "table_service"},
    {"name": "Pinocchio Village Haus", "land": "fantasyland", "service_type": "quick_service"},
    {"name": "The Friar's Nook", "land": "fantasyland", "service_type": "quick_service"},
    {"name": "Gaston's Tavern", "land": "fantasyland", "service_type": "kiosk"},
    {"name": "Prince Eric's Village Market", "land": "fantasyland", "service_type": "snack_cart"},
    {"name": "Storybook Treats", "land": "fantasyland", "service_type": "kiosk"},
    {"name": "Cheshire Café", "land": "fantasyland", "service_type": "kiosk"},
    {"name": "Cosmic Ray's Starlight Café", "land": "tomorrowland", "service_type": "quick_service"},
    {"name": "The Lunching Pad", "land": "tomorrowland", "service_type": "snack_cart"},
    {"name": "Tomorrowland Terrace Restaurant", "land": "tomorrowland", "service_type": "quick_service"},
    {"name": "AstroFizz", "land": "tomorrowland", "service_type": "kiosk"},
    {"name": "Auntie Gravity's Galactic Goodies", "land": "tomorrowland", "service_type": "kiosk"},
]


def slugify(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def can_fetch(session: requests.Session, url: str) -> bool:
    rp = urllib.robotparser.RobotFileParser()
    rp.set_url(f"{BASE_URL}/robots.txt")
    try:
        resp = session.get(f"{BASE_URL}/robots.txt", timeout=10)
        rp.parse(resp.text.splitlines())
    except requests.RequestException:
        # If robots.txt can't be fetched, be conservative and skip.
        return False
    return rp.can_fetch(USER_AGENT, url)


def fetch_dining_index(session: requests.Session) -> list[dict]:
    """Fetch and parse the Magic Kingdom dining index page."""
    resp = session.get(DINING_INDEX_URL, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    venues = []
    for link in soup.select("a[href*='/dining/magic-kingdom/']"):
        name = link.get_text(strip=True)
        href = link.get("href")
        if not name or not href:
            continue
        url = href if href.startswith("http") else f"{BASE_URL}{href}"
        venues.append({"name": name, "disney_url": url})
    return venues


def fetch_venue_page(session: requests.Session, venue: dict) -> dict:
    slug = slugify(venue["name"])
    url = venue.get("disney_url") or f"{BASE_URL}/dining/magic-kingdom/{slug}/"

    if not can_fetch(session, url):
        print(f"  [skip] robots.txt disallows: {url}")
        return venue

    try:
        resp = session.get(url, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as exc:
        print(f"  [warn] failed to fetch {url}: {exc}")
        return venue

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    (RAW_DIR / f"{slug}.html").write_text(resp.text, encoding="utf-8")

    venue["disney_url"] = url
    venue["scraped_at"] = datetime.now(timezone.utc).isoformat()
    return venue


def main():
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    print(f"Fetching dining index: {DINING_INDEX_URL}")
    try:
        venues = fetch_dining_index(session) or []
    except requests.RequestException as exc:
        print(f"[warn] could not load dining index ({exc}); using fallback venue list")
        venues = []

    if not venues:
        venues = [dict(v) for v in FALLBACK_VENUES]

    results = []
    for venue in venues:
        print(f"Fetching: {venue['name']}")
        results.append(fetch_venue_page(session, venue))
        time.sleep(REQUEST_DELAY_SECONDS)

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    output_path = RAW_DIR / "venues_raw.json"
    output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Wrote {len(results)} venues to {output_path}")


if __name__ == "__main__":
    main()
