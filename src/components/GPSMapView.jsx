import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { computeVenueScore } from '../scoring/engine.js';

// Approximate center of Magic Kingdom (Cinderella Castle).
const PARK_CENTER = [28.4194, -81.5812];
const DEFAULT_ZOOM = 17;

// Wraps a CircleMarker so it behaves like a focusable, keyboard-activatable
// button (matching the SVG MapView markers), since Leaflet's vector layers
// don't expose this by default.
function VenueMarker({ venue, result, onSelectVenue }) {
  const layerRef = useRef(null);
  const { lat, lng } = venue.gps_coords;
  const ariaLabel = `${venue.name}: ${result.label}, score ${result.score} of 10`;

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
    <CircleMarker
      ref={layerRef}
      center={[lat, lng]}
      radius={10}
      pathOptions={{ color: '#1f2937', weight: 1.5, fillColor: result.color, fillOpacity: 0.9 }}
      eventHandlers={{ click: () => onSelectVenue(venue) }}
    >
      <Tooltip direction="top" offset={[0, -8]}>
        <span className="font-semibold">{venue.name}</span>
        <br />
        {result.icon} {result.label} &mdash; {result.score}/10
      </Tooltip>
    </CircleMarker>
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
            return (
              <VenueMarker key={venue.id} venue={venue} result={result} onSelectVenue={onSelectVenue} />
            );
          })}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        GPS positions are approximate placeholders for prototyping and have not been
        verified against satellite imagery or surveyed park data &mdash; do not rely
        on them for in-park navigation yet. Map data &copy;{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
          OpenStreetMap
        </a>{' '}
        contributors.
      </p>
    </div>
  );
}
