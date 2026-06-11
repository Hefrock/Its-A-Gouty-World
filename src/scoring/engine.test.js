import { describe, it, expect } from 'vitest';
import { computeVenueScore, getScoreBreakdown } from './engine.js';

const venue = {
  scores: {
    purine_score: 8,
    alcohol_score: 4,
    fructose_score: 2,
  },
};

describe('computeVenueScore', () => {
  it('returns "no factors selected" when all toggles are off', () => {
    const result = computeVenueScore(venue, { purines: false, alcohol: false, fructose: false }, 'strict');
    expect(result.score).toBe(0);
    expect(result.tier).toBe('green');
    expect(result.label).toBe('No factors selected');
  });

  it('averages all three factors equally in strict mode', () => {
    const result = computeVenueScore(venue, { purines: true, alcohol: true, fructose: true }, 'strict');
    // (8 + 4 + 2) / 3 = 4.666... -> rounds to 4.7
    expect(result.score).toBe(4.7);
    expect(result.tier).toBe('yellow');
  });

  it('only counts active toggles', () => {
    const result = computeVenueScore(venue, { purines: true, alcohol: false, fructose: false }, 'strict');
    expect(result.score).toBe(8);
    expect(result.tier).toBe('red');
  });

  it('applies moderate weights (alcohol 0.7, fructose 0.5)', () => {
    const result = computeVenueScore(venue, { purines: true, alcohol: true, fructose: true }, 'moderate');
    // (8*1.0 + 4*0.7 + 2*0.5) / (1.0 + 0.7 + 0.5) = 11.8 / 2.2 = 5.3636...
    expect(result.score).toBe(5.4);
    expect(result.tier).toBe('yellow');
  });

  it('applies flexible weights (alcohol 0.5, fructose 0.3)', () => {
    const result = computeVenueScore(venue, { purines: true, alcohol: true, fructose: true }, 'flexible');
    // (8*1.0 + 4*0.5 + 2*0.3) / (1.0 + 0.5 + 0.3) = 10.6 / 1.8 = 5.888...
    expect(result.score).toBe(5.9);
    expect(result.tier).toBe('yellow');
  });

  it('maps boundary scores to the correct tier', () => {
    const lowVenue = { scores: { purine_score: 3, alcohol_score: 3, fructose_score: 3 } };
    const midVenue = { scores: { purine_score: 6, alcohol_score: 6, fructose_score: 6 } };
    const highVenue = { scores: { purine_score: 7, alcohol_score: 7, fructose_score: 7 } };
    const toggles = { purines: true, alcohol: true, fructose: true };

    expect(computeVenueScore(lowVenue, toggles, 'strict').tier).toBe('green');
    expect(computeVenueScore(midVenue, toggles, 'strict').tier).toBe('yellow');
    expect(computeVenueScore(highVenue, toggles, 'strict').tier).toBe('red');
  });
});

describe('getScoreBreakdown', () => {
  it('returns all three factors regardless of toggles', () => {
    const breakdown = getScoreBreakdown(venue);
    expect(breakdown).toEqual([
      { factor: 'Purines', key: 'purine_score', score: 8 },
      { factor: 'Alcohol', key: 'alcohol_score', score: 4 },
      { factor: 'Fructose / SSBs', key: 'fructose_score', score: 2 },
    ]);
  });
});
