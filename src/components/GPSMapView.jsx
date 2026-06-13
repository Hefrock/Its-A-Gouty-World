import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { computeVenueScore, getExtremeFactors } from '../scoring/engine.js';
import { OPERATING_STATUS_SHORT } from '../utils/operatingStatus.js';

// Approximate center of Magic Kingdom (Cinderella Castle).
const PARK_CENTER = [28.4194, -81.5812];
const DEFAULT_ZOOM = 17;

// Wraps a CircleMarker so it behaves like a focusable, keyboard-activatable
// button (matching the SVG MapView markers), since Leaflet's vector layers
// don't expose this by default.
function VenueMarker({ venue, result, extremeFactors, onSelectVenue }) {
  const layerRef = useRef(null);
  const { lat, lng } = venue.gps_coords;
  const isNonOpen = venue.operating_status && venue.operating_status !== 'open';
  const extremeLabel = extremeFactors.length > 0
    ? ` — high ${extremeFactors.map((f) => `${f.label} (${f.score}/10)`).join(', ')}`
    : '';
  const statusLabel = isNonOpen ? ` — ${OPERATING_STATUS_SHORT[venue.operating_status]}` : '';
  const ariaLabel = `${venue.name}: ${result.label}, score ${result.score} of 10${extremeLabel}${statusLabel}`;

  useEffect(() => {
    const el = layerRef.current?._path;
    if (!el) return;
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', ariaLabel);
    if (!el.dataset.kbBound) {
      el.dataset.kbBound = 'true';
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectVenue(venue);
        }
      });
    }
  });

  return (
    <>
      {extremeFactors.length > 0 && (
        <CircleMarker
          center={[lat, lng]}
          radius={15}
          pathOptions={{ color: '#dc2626', weight: 2, fill: false, dashArray: '3,2' }}
          interactive={false}
        />
      )}
      <CircleMarker
        ref={layerRef}
        center={[lat, lng]}
        radius={10}
        pathOptions={{ color: '#1f2937', weight: 1.5, fillColor: result.color, fillOpacity: isNonOpen ? 0.4 : 0.9 }}
        eventHandlers={{ click: () => onSelectVenue(venue) }}
      >
        <Tooltip direction="top" offset={[0, -8]}>
          <span className="font-semibold">{venue.name}</span>
          <br />
          {result.icon} {result.label} &mdash; {result.score}/10
          {extremeFactors.length > 0 && (
            <>
              <br />
              <span className="text-red-600">
                ⚡ High {extremeFactors.map((f) => `${f.label} (${f.score}/10)`).join(', ')}
              </span>
            </>
          )}
          {isNonOpen && (
            <>
              <br />
              <span className="text-amber-600">⚠️ {OPERATING_STATUS_SHORT[venue.operating_status]}</span>
            </>
          )}
        </Tooltip>
      </CircleMarker>
    </>
  );
}

export default function GPSMapView({ venues, activeToggles, strictnessMode, onSelectVenue }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="rounded-lg overflow-hidden h-[420px] sm:h-[520px]">
        <MapContainer center={PARK_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {venues.map((venue) => {
            const result = computeVenueScore(venue, activeToggles, strictnessMode);
            const extremeFactors = getExtremeFactors(venue, activeToggles, result.tier);
            return (
              <VenueMarker
                key={venue.id}
                venue={venue}
                result={result}
                extremeFactors={extremeFactors}
                onSelectVenue={onSelectVenue}
              />
            );
          })}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        GPS positions have been cross-checked against OpenStreetMap and Google
        Maps but have not been validated with on-site GPS readings &mdash; treat
        this as a close approximation, not a surveyed in-park navigation aid.
        Map data &copy;{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
          OpenStreetMap
        </a>{' '}
        contributors.
      </p>
    </div>
  );
}
