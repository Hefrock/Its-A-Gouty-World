import { useState } from 'react';
import { STRICTNESS_MODES, STRICTNESS_LABELS, STRICTNESS_DESCRIPTIONS } from '../scoring/weights.js';

const FACTORS = [
  { key: 'purines', label: 'Purines', icon: '🥩' },
  { key: 'alcohol', label: 'Alcohol', icon: '🍺' },
  { key: 'fructose', label: 'Fructose / SSBs', icon: '🥤' },
];

export default function TogglePanel({ activeToggles, onToggleChange, strictnessMode, onStrictnessChange }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Risk Factors</h2>
        <div className="flex flex-wrap gap-2">
          {FACTORS.map(({ key, label, icon }) => {
            const active = activeToggles[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleChange(key, !active)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-100 text-gray-500 border-gray-300'
                }`}
              >
                <span className="mr-1" aria-hidden="true">{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1 mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Strictness</h2>
          <button
            type="button"
            aria-label="What does strictness mean?"
            onClick={() => setShowInfo((v) => !v)}
            className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-xs font-bold leading-5"
          >
            i
          </button>
        </div>
        {showInfo && (
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-2 mb-2 space-y-1">
            {STRICTNESS_MODES.map((mode) => (
              <p key={mode}>
                <span className="font-semibold">{STRICTNESS_LABELS[mode]}:</span> {STRICTNESS_DESCRIPTIONS[mode]}
              </p>
            ))}
          </div>
        )}
        <div role="radiogroup" aria-label="Strictness mode" className="flex gap-2">
          {STRICTNESS_MODES.map((mode) => (
            <label
              key={mode}
              className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
                strictnessMode === mode
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'bg-gray-100 border-gray-300 text-gray-600'
              }`}
            >
              <input
                type="radio"
                name="strictness"
                value={mode}
                checked={strictnessMode === mode}
                onChange={() => onStrictnessChange(mode)}
                className="sr-only"
              />
              {STRICTNESS_LABELS[mode]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
