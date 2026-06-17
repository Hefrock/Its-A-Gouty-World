import { useMemo } from 'react';
import { itemRisk } from '../scoring/itemRisk.js';
import { LANDS } from '../utils/mapCoords.js';
import { OPERATING_STATUS_SHORT } from '../utils/operatingStatus.js';
import { ITEM_FLAG_LABELS } from '../utils/menuItemFlags.js';

const RANKED_COUNT = 10;

function ItemList({ title, items, accentClass, onSelectVenue }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <ol className="space-y-1">
        {items.map((item, index) => (
          <li key={`${item.venue_id}-${item.item_name}`}>
            <button
              type="button"
              onClick={() => onSelectVenue(item.venue)}
              className="w-full flex items-start gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-gray-50"
            >
              <span className="text-xs text-gray-400 w-5 pt-0.5 shrink-0">{index + 1}</span>
              <span className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${accentClass}`}>
                  {item.item_name}
                  {(item.flags ?? []).map((flag) => (
                    <span key={flag} title={ITEM_FLAG_LABELS[flag]?.title} className="ml-1" aria-hidden="true">
                      {ITEM_FLAG_LABELS[flag]?.icon}
                    </span>
                  ))}
                </span>
                <span className="block text-xs text-gray-500 truncate">
                  {item.venue?.name ?? item.venue_id}
                  {item.venue?.operating_status && item.venue.operating_status !== 'open' && (
                    <span className="ml-1 text-amber-600" title={OPERATING_STATUS_SHORT[item.venue.operating_status]}>
                      <span aria-hidden="true">⚠️</span>
                    </span>
                  )}
                  {' · '}
                  {item.land?.name ?? item.venue?.land}
                </span>
              </span>
              <span className="text-sm font-semibold text-gray-700 shrink-0 pt-0.5">{item.risk.toFixed(1)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function MenuView({ venues, menuItems, onSelectVenue }) {
  const ranked = useMemo(() => {
    const venuesById = Object.fromEntries(venues.map((v) => [v.id, v]));
    const scored = menuItems
      .map((item) => {
        const venue = venuesById[item.venue_id];
        return {
          ...item,
          venue,
          land: venue ? LANDS[venue.land] : undefined,
          risk: itemRisk(item),
        };
      })
      .filter((item) => item.venue)
      .sort((a, b) => b.risk - a.risk);

    return {
      highest: scored.slice(0, RANKED_COUNT),
      lowest: scored.slice(-RANKED_COUNT).reverse(),
    };
  }, [venues, menuItems]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-xs text-gray-600 mb-3">
        The {RANKED_COUNT} highest- and lowest-risk individual menu items across
        all of Magic Kingdom, ranked by an item-level heuristic (purine score,
        plus a fixed bump for alcohol, SSBs, and sugar content) &mdash; not the
        same as the venue composite score elsewhere in this app, and not
        affected by the risk-factor toggles above. Tap any item to open its
        venue.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ItemList
          title="Highest-Risk Items"
          items={ranked.highest}
          accentClass="text-red-700"
          onSelectVenue={onSelectVenue}
        />
        <ItemList
          title="Lowest-Risk Items"
          items={ranked.lowest}
          accentClass="text-green-700"
          onSelectVenue={onSelectVenue}
        />
      </div>
    </div>
  );
}
