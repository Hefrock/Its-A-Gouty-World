import { useRef, useState } from 'react';
import { computeVenueScore } from '../scoring/engine.js';
import { MAP_VIEWBOX, HUB, LANDS, getLandWedgePath, getLandLabelPos, getVenueCoords } from '../utils/mapCoords.js';

export default function MapView({ venues, activeToggles, strictnessMode, onSelectVenue }) {
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  function handleEnter(e, venue, result) {
    const rect = containerRef.current.getBoundingClientRect();
    setHovered({
      venue,
      result,
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
            const { x, y } = getVenueCoords(venue);
            return (
              <circle
                key={venue.id}
                cx={x}
                cy={y}
                r={14}
                fill={result.color}
                stroke="#1f2937"
                strokeWidth={1.5}
                tabIndex={0}
                role="button"
                aria-label={`${venue.name}: ${result.label}, score ${result.score} of 10`}
                onMouseEnter={(e) => handleEnter(e, venue, result)}
                onMouseLeave={() => setHovered(null)}
                onFocus={(e) => handleEnter(e, venue, result)}
                onBlur={() => setHovered(null)}
                onClick={() => onSelectVenue(venue)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectVenue(venue);
                }}
                style={{ cursor: 'pointer' }}
              >
                <title>{venue.name}: {result.label} ({result.score}/10)</title>
              </circle>
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
          </div>
        )}
      </div>
    </div>
  );
}
