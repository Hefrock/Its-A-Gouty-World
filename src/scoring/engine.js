import { WEIGHTS } from './weights.js';
import { scoreToTier } from './thresholds.js';

/**
 * Scoring Engine — Magic Kingdom Gout Heatmap
 *
 * Three independent risk dimensions, each scored 0-10 per venue:
 *   - purine_score: based on dominant protein types on the menu (Kaneko categories)
 *   - alcohol_score: availability and prominence of alcohol
 *   - fructose_score: SSB availability + dessert sugar load
 *
 * Composite score = weighted average of ACTIVE toggles only, using the
 * weights for the selected strictness mode. If no toggles are active,
 * the venue is treated as having no assessable risk (green, score 0).
 */
export function computeVenueScore(venue, activeToggles, strictnessMode) {
  const weights = WEIGHTS[strictnessMode];
  let totalWeight = 0;
  let weightedScore = 0;

  if (activeToggles.purines) {
    weightedScore += venue.scores.purine_score * weights.purines;
    totalWeight += weights.purines;
  }
  if (activeToggles.alcohol) {
    weightedScore += venue.scores.alcohol_score * weights.alcohol;
    totalWeight += weights.alcohol;
  }
  if (activeToggles.fructose) {
    weightedScore += venue.scores.fructose_score * weights.fructose;
    totalWeight += weights.fructose;
  }

  if (totalWeight === 0) {
    return { ...scoreToTier(0), score: 0, label: 'No factors selected' };
  }

  const composite = weightedScore / totalWeight;
  const rounded = Math.round(composite * 10) / 10;
  const tierInfo = scoreToTier(rounded);

  return {
    score: rounded,
    ...tierInfo,
  };
}

/**
 * Returns the per-factor score breakdown for a venue, regardless of
 * which toggles are active. Used by VenueCard for the bar chart.
 */
export function getScoreBreakdown(venue) {
  return [
    { factor: 'Purines', key: 'purine_score', score: venue.scores.purine_score },
    { factor: 'Alcohol', key: 'alcohol_score', score: venue.scores.alcohol_score },
    { factor: 'Fructose / SSBs', key: 'fructose_score', score: venue.scores.fructose_score },
  ];
}
