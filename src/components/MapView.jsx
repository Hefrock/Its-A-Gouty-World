import { useRef, useState } from 'react';
import { computeVenueScore, getExtremeFactors } from '../scoring/engine.js';
import { MAP_VIEWBOX, HUB, LANDS, getLandWedgePath, getLandLabelPos, getVenueCoords } from '../utils/mapCoords.js';
import { OPERATING_STATUS_SHORT } from '../utils/operatingStatus.js';

export default function MapView({ venues, activeToggles, strictnessMode, onSelectVenue }) {
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  function handleEnter(e, venue, result, extremeFactors) {
    const rect = containerRef.current.getBoundingClientRect();
    setHovered({
      venue,
      result,
      extremeFactors,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  function handleMove(e) {
    if (!hovered) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHovered((h) => (h ? { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top } : h));
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div ref={containerRef} className="relative w-full" onMouseMove={handleMove}>
        <svg viewBox={MAP_VIEWBOX} role="img" aria-label="Map of Magic Kingdom dining locations" className="w-full h-auto">
          {Object.entries(LANDS).map(([key, land]) => {
            const labelPos = getLandLabelPos(key);
            return (
              <g key={key}>
                <path d={getLandWedgePath(key)} fill={land.color} fillOpacity={0.4} stroke="#fff" strokeWidth={2} />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="20"
                  fontWeight="600"
                  fill="#374151"
                >
                  {land.name}
                </text>
              </g>
            );
          })}

          <circle cx={HUB.cx} cy={HUB.cy} r={HUB.r} fill="#e9d5ff" stroke="#fff" strokeWidth={3} />
          <text x={HUB.cx} y={HUB.cy} textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="700" fill="#6b21a8">
            Cinderella
            <tspan x={HUB.cx} dy="1.2em">Castle</tspan>
          </text>

          {venues.map((venue) => {
            const result = computeVenueScore(venue, activeToggles, strictnessMode);
            const extremeFactors = getExtremeFactors(venue, activeToggles, result.tier);
            const { x, y } = getVenueCoords(venue);
            const isNonOpen = venue.operating_status && venue.operating_status !== 'open';
            const extremeLabel = extremeFactors.length > 0
              ? ` — high ${extremeFactors.map((f) => f.label).join(', ')} (${extremeFactors.map((f) => f.score).join(', ')}/10)`
              : '';
            const statusLabel = isNonOpen ? ` — ${OPERATING_STATUS_SHORT[venue.operating_status]}` : '';
            return (
              <g key={venue.id}>
                {extremeFactors.length > 0 && (
                  <circle
                    cx={x}
                    cy={y}
                    r={19}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="3,2"
                    aria-hidden="true"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={14}
                  fill={result.color}
                  fillOpacity={isNonOpen ? 0.4 : 1}
                  stroke="#1f2937"
                  strokeWidth={1.5}
                  tabIndex={0}
                  role="button"
                  aria-label={`${venue.name}: ${result.label}, score ${result.score} of 10${extremeLabel}${statusLabel}`}
                  onMouseEnter={(e) => handleEnter(e, venue, result, extremeFactors)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={(e) => handleEnter(e, venue, result, extremeFactors)}
                  onBlur={() => setHovered(null)}
                  onClick={() => onSelectVenue(venue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelectVenue(venue);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <title>{venue.name}: {result.label} ({result.score}/10){extremeLabel}{statusLabel}</title>
                </circle>
                {isNonOpen && (
                  <text
                    x={x + 10}
                    y={y - 10}
                    fontSize="12"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    aria-hidden="true"
                  >
                    ⚠️
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div
            className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg z-10"
            style={{ left: hovered.x + 12, top: hovered.y + 12 }}
          >
            <p className="font-semibold">{hovered.venue.name}</p>
            <p>{hovered.result.icon} {hovered.result.label} &mdash; {hovered.result.score}/10</p>
            {hovered.extremeFactors?.length > 0 && (
              <p className="text-red-300">
                ⚡ High {hovered.extremeFactors.map((f) => `${f.label} (${f.score}/10)`).join(', ')}
              </p>
            )}
            {hovered.venue.operating_status && hovered.venue.operating_status !== 'open' && (
              <p className="text-amber-300">
                ⚠️ {OPERATING_STATUS_SHORT[hovered.venue.operating_status]}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
