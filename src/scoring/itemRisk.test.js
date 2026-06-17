import { describe, it, expect } from 'vitest';
import { itemRisk } from './itemRisk.js';

describe('itemRisk', () => {
  it('uses purine_score_item as the base', () => {
    expect(itemRisk({ purine_score_item: 5 })).toBe(5);
  });

  it('adds a fixed bump for alcohol', () => {
    expect(itemRisk({ purine_score_item: 0, alcohol: true })).toBe(3);
  });

  it('adds a fixed bump for SSBs', () => {
    expect(itemRisk({ purine_score_item: 0, is_ssb: true })).toBe(2);
  });

  it('adds sugar_g scaled by 1/15', () => {
    expect(itemRisk({ purine_score_item: 0, sugar_g: 30 })).toBe(2);
  });

  it('combines all factors', () => {
    expect(itemRisk({ purine_score_item: 4, alcohol: true, is_ssb: true, sugar_g: 15 })).toBe(10);
  });

  it('treats missing fields as zero', () => {
    expect(itemRisk({})).toBe(0);
  });
});
