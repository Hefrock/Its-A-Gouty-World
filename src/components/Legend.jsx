import { TIERS } from '../scoring/thresholds.js';

export default function Legend() {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Legend</h2>
      <p className="text-xs text-gray-600 mb-3">
        Each venue's score is a weighted average of only the risk factors
        toggled on above &mdash; not a sum, and not a worst-case. Switching a
        factor on or off changes what gets averaged in, so a venue's score
        and tier can shift even though nothing about its menu changed. The ⚡
        indicator below flags venues where one active factor is severe (7+)
        on its own but gets averaged into a lower overall tier.
      </p>
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
        <li className="flex items-start gap-2">
          <span aria-hidden="true">⚡</span>
          <span>
            <span className="font-semibold">High on one factor:</span>{' '}
            Shown when a single active factor (purines, alcohol, or fructose/SSBs) is in the Higher Risk range (7+) on its own, but the overall score doesn't land in the Higher Risk tier — averaging can mask one severe factor.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span aria-hidden="true">⚠️</span>
          <span>
            <span className="font-semibold">Closed / limited / seasonal:</span>{' '}
            Shown for venues that are temporarily closed, on a seasonal pause, or offering limited service — check the venue details for the current status before planning your visit.
          </span>
        </li>
      </ul>
      <p className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-2">
        This tool is for informational purposes. Consult your physician or dietitian for personalized guidance.
      </p>
    </div>
  );
}
