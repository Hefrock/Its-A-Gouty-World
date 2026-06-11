// Weight configs for each strictness mode.
// Higher weight = factor counts more toward the composite score.
export const WEIGHTS = {
  strict: { purines: 1.0, alcohol: 1.0, fructose: 1.0 },
  moderate: { purines: 1.0, alcohol: 0.7, fructose: 0.5 },
  flexible: { purines: 1.0, alcohol: 0.5, fructose: 0.3 },
};

export const STRICTNESS_MODES = ['strict', 'moderate', 'flexible'];

export const STRICTNESS_LABELS = {
  strict: 'Strict',
  moderate: 'Moderate',
  flexible: 'Flexible',
};

export const STRICTNESS_DESCRIPTIONS = {
  strict: 'All three risk factors (purines, alcohol, fructose/SSBs) count equally toward the score. Best for patients managing frequent flares.',
  moderate: 'Purines weigh most heavily; alcohol and fructose count for less. A balanced view for most patients.',
  flexible: 'Purines remain the primary signal; alcohol and fructose have minimal influence. For patients with well-controlled gout who want occasional flexibility.',
};
