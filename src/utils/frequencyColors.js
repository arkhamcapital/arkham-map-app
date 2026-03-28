/** Selected-period trips/hr → marker fill for map legend */
export function colorForTripsPerHour(tph) {
  const t = Number(tph) || 0;
  if (t > 6) return "#22c55e";
  if (t >= 3) return "#eab308";
  if (t >= 1) return "#f97316";
  return "#ef4444";
}
