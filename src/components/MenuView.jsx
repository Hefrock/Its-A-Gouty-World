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
          <li key={item.item_name} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
            <span className="text-xs text-gray-400 w-5 pt-0.5 shrink-0">{index + 1}</span>
            <span className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${accentClass}`}>
                {item.item_name}
                {item.flags.map((flag) => (
                  <span key={flag} title={ITEM_FLAG_LABELS[flag]?.title} className="ml-1" aria-hidden="true">
                    {ITEM_FLAG_LABELS[flag]?.icon}
                  </span>
                ))}
              </span>
              <span className="block text-xs text-gray-500">
                {item.venues.map(({ venue, land }, i) => (
                  <span key={venue.id}>
                    <button
                      type="button"
                      onClick={() => onSelectVenue(venue)}
                      className="hover:underline hover:text-indigo-700"
                    >
                      {venue.name}
                      {venue.operating_status && venue.operating_status !== 'open' && (
                        <span className="ml-0.5 text-amber-600" title={OPERATING_STATUS_SHORT[venue.operating_status]}>
                          <span aria-hidden="true">⚠️</span>
                        </span>
                      )}
                    </button>
                    {' · '}
                    {land?.name ?? venue.land}
                    {i < item.venues.length - 1 && ', '}
                  </span>
                ))}
              </span>
            </span>
            <span className="text-sm font-semibold text-gray-700 shrink-0 pt-0.5">{item.risk.toFixed(1)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function MenuView({ venues, menuItems, onSelectVenue }) {
  const ranked = useMemo(() => {
    const venuesById = Object.fromEntries(venues.map((v) => [v.id, v]));
    const groups = new Map();

    for (const item of menuItems) {
      const venue = venuesById[item.venue_id];
      if (!venue) continue;

      const risk = itemRisk(item);
      const group = groups.get(item.item_name);
      if (group) {
        group.totalRisk += risk;
        group.count += 1;
        group.venues.push({ venue, land: LANDS[venue.land] });
        for (const flag of item.flags ?? []) group.flags.add(flag);
      } else {
        groups.set(item.item_name, {
          item_name: item.item_name,
          totalRisk: risk,
          count: 1,
          venues: [{ venue, land: LANDS[venue.land] }],
          flags: new Set(item.flags ?? []),
        });
      }
    }

    const scored = Array.from(groups.values())
      .map((group) => ({
        item_name: group.item_name,
        risk: group.totalRisk / group.count,
        venues: group.venues,
        flags: Array.from(group.flags),
      }))
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
        affected by the risk-factor toggles above. The same item served at
        multiple venues is merged into one row and averaged; tap a venue name
        to open its card.
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
