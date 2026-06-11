import { lazy, Suspense, useState } from 'react';
import TogglePanel from './components/TogglePanel.jsx';
import Legend from './components/Legend.jsx';
import ListView from './components/ListView.jsx';
import MapView from './components/MapView.jsx';
import venues from './data/venues.json';
import menuItems from './data/menu_items.json';

// Lazy-loaded so the Leaflet/react-leaflet bundle only downloads when the
// GPS Map tab is opened.
const GPSMapView = lazy(() => import('./components/GPSMapView.jsx'));
// Lazy-loaded so the Recharts bundle only downloads when a venue card is opened.
const VenueCard = lazy(() => import('./components/VenueCard.jsx'));

const DEFAULT_TOGGLES = { purines: true, alcohol: true, fructose: true };

function App() {
  const [activeToggles, setActiveToggles] = useState(DEFAULT_TOGGLES);
  const [strictnessMode, setStrictnessMode] = useState('strict');
  const [view, setView] = useState('map');
  const [selectedVenue, setSelectedVenue] = useState(null);

  function handleToggleChange(key, value) {
    setActiveToggles((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-700 text-white px-4 py-4 shadow">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold">It's a Gouty World</h1>
          <p className="text-sm text-indigo-100">Magic Kingdom gout-safe dining heatmap</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 flex flex-col gap-4">
        <TogglePanel
          activeToggles={activeToggles}
          onToggleChange={handleToggleChange}
          strictnessMode={strictnessMode}
          onStrictnessChange={setStrictnessMode}
        />

        <div className="flex gap-2" role="tablist" aria-label="View selector">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'map'}
            onClick={() => setView('map')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              view === 'map' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            Map View
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'list'}
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            List View
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'gps'}
            onClick={() => setView('gps')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              view === 'gps' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300'
            }`}
          >
            GPS Map
          </button>
        </div>

        {view === 'map' && (
          <MapView
            venues={venues}
            activeToggles={activeToggles}
            strictnessMode={strictnessMode}
            onSelectVenue={setSelectedVenue}
          />
        )}
        {view === 'list' && (
          <ListView
            venues={venues}
            activeToggles={activeToggles}
            strictnessMode={strictnessMode}
            onSelectVenue={setSelectedVenue}
          />
        )}
        {view === 'gps' && (
          <Suspense fallback={<div className="bg-white rounded-xl shadow p-4 text-sm text-gray-500">Loading map&hellip;</div>}>
            <GPSMapView
              venues={venues}
              activeToggles={activeToggles}
              strictnessMode={strictnessMode}
              onSelectVenue={setSelectedVenue}
            />
          </Suspense>
        )}

        <Legend />
      </main>

      {selectedVenue && (
        <Suspense fallback={null}>
          <VenueCard
            venue={selectedVenue}
            menuItems={menuItems}
            activeToggles={activeToggles}
            strictnessMode={strictnessMode}
            onClose={() => setSelectedVenue(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
