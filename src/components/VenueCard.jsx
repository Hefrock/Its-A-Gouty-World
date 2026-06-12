import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from 'recharts';
import { computeVenueScore, getScoreBreakdown } from '../scoring/engine.js';
import { scoreToTier } from '../scoring/thresholds.js';
import { LANDS } from '../utils/mapCoords.js';

const SERVICE_TYPE_LABELS = {
  quick_service: 'Quick Service',
  table_service: 'Table Service',
  snack_cart: 'Snack Cart',
  kiosk: 'Kiosk',
};

const OPERATING_STATUS_LABELS = {
  temporarily_closed: '⚠️ Currently Closed',
  seasonal_pause: '⚠️ Seasonal Closure',
  limited_service: '⚠️ Limited Service',
};

// Rough relative-risk score for ranking individual menu items (not part of
// the venue composite score, which is computed from venue.scores only).
function itemRisk(item) {
  let risk = item.purine_score_item ?? 0;
  if (item.alcohol) risk += 3;
  if (item.is_ssb) risk += 2;
  risk += (item.sugar_g ?? 0) / 15;
  return risk;
}

export default function VenueCard({ venue, menuItems, activeToggles, strictnessMode, onClose }) {
  const result = computeVenueScore(venue, activeToggles, strictnessMode);
  const breakdown = getScoreBreakdown(venue).map((row) => ({
    ...row,
    fill: scoreToTier(row.score).color,
  }));

  const items = menuItems.filter((item) => item.venue_id === venue.id);
  const sorted = [...items].sort((a, b) => itemRisk(b) - itemRisk(a));
  // Split into non-overlapping halves (capped at 3 each) so a menu item never
  // appears in both the higher-risk and lower-risk lists. With small menus
  // (most venues have 3-4 items), a single middle item may be omitted.
  const maxEach = sorted.length === 1 ? 1 : Math.min(3, Math.floor(sorted.length / 2));
  const highest = sorted.slice(0, maxEach);
  const lowest = sorted.slice(sorted.length - maxEach).reverse();

  const land = LANDS[venue.land];

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl shadow-xl max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{venue.name}</h2>
            <p className="text-sm text-gray-500">
              {land?.name ?? venue.land} &middot; {SERVICE_TYPE_LABELS[venue.service_type] ?? venue.service_type}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {venue.operating_status && venue.operating_status !== 'open' && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p className="font-semibold">
              {OPERATING_STATUS_LABELS[venue.operating_status] ?? 'Status update'}
            </p>
            {venue.status_note && <p className="mt-1">{venue.status_note}</p>}
          </div>
        )}

        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${result.bgClass} ${result.textClass} ${result.borderClass} text-sm font-semibold mb-4`}>
          <span aria-hidden="true">{result.icon}</span>
          {result.label} &mdash; {result.score} / 10
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Score Breakdown</h3>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer>
              <BarChart data={breakdown} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} hide />
                <YAxis type="category" dataKey="factor" width={110} tick={{ fontSize: 12 }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {breakdown.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {(highest.length > 0 || lowest.length > 0) && (
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {highest.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Higher-Risk Items</h3>
                <ul className="text-sm space-y-1">
                  {highest.map((item) => (
                    <li key={item.item_name} className="text-red-700">
                      &bull; {item.item_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lowest.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Lower-Risk Items</h3>
                <ul className="text-sm space-y-1">
                  {lowest.map((item) => (
                    <li key={item.item_name} className="text-green-700">
                      &bull; {item.item_name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mb-4 space-y-2 text-sm text-gray-600">
          <h3 className="text-sm font-semibold text-gray-700">Score Notes</h3>
          <p><span className="font-semibold">Purines:</span> {venue.score_notes.purine}</p>
          <p><span className="font-semibold">Alcohol:</span> {venue.score_notes.alcohol}</p>
          <p><span className="font-semibold">Fructose:</span> {venue.score_notes.fructose}</p>
        </div>

        <div className="text-xs text-gray-500 border-t border-gray-200 pt-3 space-y-1">
          {venue.estimated && (
            <p className="italic">Scores are estimated from publicly available menu descriptions, not lab-measured values.</p>
          )}
          <p>
            Menu data verified {venue.last_verified}. Disney menus change &mdash; verify at{' '}
            <a href={venue.disney_url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
              the official Disney menu page
            </a>{' '}
            before your visit.
          </p>
        </div>
      </div>
    </div>
  );
}
