/**
 * Gap score uses two comparable 0–100 indices, then measures shortfall.
 *
 * Demand index (0–100): weighted blend of coarse demand proxies
 *   - Major interchange (name match): up to 35
 *   - OSM POI count (schools, hospitals, malls, etc.): up to 50 (4 pts each, cap 50)
 *   - Population proxy: up to 15 (placeholder often 0)
 *
 * Supply index (0–100): scheduled trips/hour in the selected period vs a ceiling.
 *   - Trips/hr is capped at SUPPLY_TPH_CEILING for scoring (above = “fully adequate” for index).
 *
 * Gap score (0–100): max(0, demand_index − supply_index), min with 100.
 *   High gap ≈ demand signals outweigh scheduled service in that period (worth a closer look).
 */

const SUPPLY_TPH_CEILING = 16; // ~every 3.75 min; tune for mode (subway vs bus feed)

const WEIGHT_INTERCHANGE = 35;
const WEIGHT_POI_PER_POINT = 4;
const WEIGHT_POI_CAP = 50;
const WEIGHT_POP_CAP = 15;

/**
 * Maps trips/hour to a 0–100 "scheduled adequacy" index.
 */
export function supplyIndexFromTripsPerHour(tripsPerHour, tphCeiling = SUPPLY_TPH_CEILING) {
  const t = Math.max(0, Math.min(tphCeiling, Number(tripsPerHour) || 0));
  return (t / tphCeiling) * 100;
}

/**
 * Maps POI count to 0–WEIGHT_POI_CAP with diminishing urgency after ~12 POIs.
 */
export function poiContribution(poiCount) {
  const n = Math.max(0, Number(poiCount) || 0);
  return Math.min(WEIGHT_POI_CAP, n * WEIGHT_POI_PER_POINT);
}

/**
 * Demand side 0–100 from interchange flag, POIs, optional population scalar.
 */
export function demandIndexFromSignals({
  poiCount,
  isInterchange,
  populationProxy = 0,
}) {
  const interchangePts = isInterchange ? WEIGHT_INTERCHANGE : 0;
  const poiPts = poiContribution(poiCount);
  const popPts = Math.min(
    WEIGHT_POP_CAP,
    Math.max(0, Number(populationProxy) || 0)
  );
  const raw = interchangePts + poiPts + popPts;
  return Math.min(100, Math.round(raw * 10) / 10);
}

export function computeGapMetrics({
  poiCount,
  isInterchange,
  populationProxy,
  tripsPerHourSelected,
  supplyTphCeiling = SUPPLY_TPH_CEILING,
}) {
  const demand_score = demandIndexFromSignals({
    poiCount,
    isInterchange,
    populationProxy,
  });
  const supply_score = Math.round(
    supplyIndexFromTripsPerHour(tripsPerHourSelected, supplyTphCeiling) * 10
  ) / 10;
  const rawGap = demand_score - supply_score;
  const gap_score = Math.max(0, Math.min(100, Math.round(rawGap * 10) / 10));
  return {
    demand_score,
    supply_score,
    gap_score,
    raw_gap: rawGap,
    supply_tph_ceiling: supplyTphCeiling,
  };
}
