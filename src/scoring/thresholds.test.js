import { describe, it, expect } from 'vitest';
import { scoreToTier, TIERS } from './thresholds.js';

describe('scoreToTier', () => {
  it('classifies 0-3 as green', () => {
    expect(scoreToTier(0)).toBe(TIERS.green);
    expect(scoreToTier(3)).toBe(TIERS.green);
  });

  it('classifies 3.1-6 as yellow', () => {
    expect(scoreToTier(3.1)).toBe(TIERS.yellow);
    expect(scoreToTier(6)).toBe(TIERS.yellow);
  });

  it('classifies above 6 as red', () => {
    expect(scoreToTier(6.1)).toBe(TIERS.red);
    expect(scoreToTier(10)).toBe(TIERS.red);
  });
});
