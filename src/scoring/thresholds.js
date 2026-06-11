// Maps a composite 0-10 score to a risk tier, color, and accessible icon.
export const TIERS = {
  green: {
    tier: 'green',
    label: 'Lower Risk',
    color: '#22c55e',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
    borderClass: 'border-green-500',
    icon: '✅',
    description: 'Generally safer choices available',
  },
  yellow: {
    tier: 'yellow',
    label: 'Moderate Risk',
    color: '#eab308',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-800',
    borderClass: 'border-yellow-500',
    icon: '⚠️',
    description: 'Some risk factors present — review menu before ordering',
  },
  red: {
    tier: 'red',
    label: 'Higher Risk',
    color: '#ef4444',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    borderClass: 'border-red-500',
    icon: '❌',
    description: 'Multiple significant gout triggers — plan ahead or choose alternatives',
  },
};

export function scoreToTier(score) {
  if (score <= 3) return TIERS.green;
  if (score <= 6) return TIERS.yellow;
  return TIERS.red;
}
