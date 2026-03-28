/**
 * demand_score = (poi_count * 10) + (is_interchange ? 30 : 0) + population_proxy
 * supply_score = normalize(trips_per_hour, 0, 12) * 100
 * gap_score = max(0, demand_score - supply_score), capped 0–100 for display
 */
export function normalizeTripsToSupplyScore(tripsPerHour, min = 0, max = 12) {
  const t = Math.max(min, Math.min(max, Number(tripsPerHour) || 0));
  return (t / max) * 100;
}

export function computeGapMetrics({
  poiCount,
  isInterchange,
  populationProxy,
  tripsPerHourSelected,
}) {
  const demand_score =
    poiCount * 10 + (isInterchange ? 30 : 0) + (populationProxy || 0);
  const supply_score = normalizeTripsToSupplyScore(tripsPerHourSelected);
  const rawGap = demand_score - supply_score;
  const gap_score = Math.max(0, Math.min(100, rawGap));
  return {
    demand_score,
    supply_score,
    gap_score,
    raw_gap: rawGap,
  };
}
