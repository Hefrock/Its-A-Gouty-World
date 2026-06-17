// Rough relative-risk score for ranking individual menu items (not part of
// the venue composite score, which is computed from venue.scores only).
export function itemRisk(item) {
  let risk = item.purine_score_item ?? 0;
  if (item.alcohol) risk += 3;
  if (item.is_ssb) risk += 2;
  risk += (item.sugar_g ?? 0) / 15;
  return risk;
}
