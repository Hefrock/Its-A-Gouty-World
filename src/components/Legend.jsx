import { TIERS } from '../scoring/thresholds.js';

export default function Legend() {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Legend</h2>
      <ul className="space-y-2 text-sm">
        {Object.values(TIERS).map((tier) => (
          <li key={tier.tier} className="flex items-start gap-2">
            <span aria-hidden="true">{tier.icon}</span>
            <span>
              <span className="font-semibold">{tier.label} ({tier.tier === 'green' ? '0-3' : tier.tier === 'yellow' ? '4-6' : '7-10'}):</span>{' '}
              {tier.description}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-2">
        This tool is for informational purposes. Consult your physician or dietitian for personalized guidance.
      </p>
    </div>
  );
}
