import { useMemo, useState } from 'react';
import { computeVenueScore } from '../scoring/engine.js';
import { LANDS } from '../utils/mapCoords.js';

const SERVICE_TYPE_LABELS = {
  quick_service: 'Quick Service',
  table_service: 'Table Service',
  snack_cart: 'Snack Cart',
  kiosk: 'Kiosk',
};

const COLUMNS = [
  { key: 'name', label: 'Venue Name', sortable: true },
  { key: 'land', label: 'Land', sortable: true },
  { key: 'service_type', label: 'Service Type', sortable: true },
  { key: 'purine_score', label: 'Purine', sortable: true, toggle: 'purines' },
  { key: 'alcohol_score', label: 'Alcohol', sortable: true, toggle: 'alcohol' },
  { key: 'fructose_score', label: 'Fructose', sortable: true, toggle: 'fructose' },
  { key: 'composite', label: 'Composite', sortable: true },
  { key: 'tier', label: 'Risk Tier', sortable: true },
];

export default function ListView({ venues, activeToggles, strictnessMode, onSelectVenue }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('composite');
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    return venues
      .map((venue) => {
        const result = computeVenueScore(venue, activeToggles, strictnessMode);
        return {
          venue,
          name: venue.name,
          land: LANDS[venue.land]?.name ?? venue.land,
          service_type: SERVICE_TYPE_LABELS[venue.service_type] ?? venue.service_type,
          purine_score: venue.scores.purine_score,
          alcohol_score: venue.scores.alcohol_score,
          fructose_score: venue.scores.fructose_score,
          composite: result.score,
          tier: result.tier,
          tierInfo: result,
        };
      })
      .filter((row) => row.name.toLowerCase().includes(search.toLowerCase()) || row.land.toLowerCase().includes(search.toLowerCase()));
  }, [venues, activeToggles, strictnessMode, search]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'composite' ? 'desc' : 'asc');
    }
  }

  const visibleColumns = COLUMNS.filter((col) => !col.toggle || activeToggles[col.toggle]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <input
        type="search"
        placeholder="Search venues or lands..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        aria-label="Search venues"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200">
              {visibleColumns.map((col) => (
                <th key={col.key} scope="col" className="py-2 px-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="font-semibold text-gray-700 flex items-center gap-1"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span aria-hidden="true">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={row.venue.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectVenue(row.venue)}
              >
                {visibleColumns.map((col) => {
                  if (col.key === 'tier') {
                    return (
                      <td key={col.key} className="py-2 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${row.tierInfo.bgClass} ${row.tierInfo.textClass}`}>
                          <span aria-hidden="true">{row.tierInfo.icon}</span>
                          {row.tierInfo.label}
                        </span>
                      </td>
                    );
                  }
                  if (col.key === 'composite') {
                    return (
                      <td key={col.key} className="py-2 px-2 font-semibold">
                        {row.composite}
                      </td>
                    );
                  }
                  return (
                    <td key={col.key} className="py-2 px-2 whitespace-nowrap">
                      {row[col.key]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {sortedRows.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No venues match your search.</p>
        )}
      </div>
    </div>
  );
}
