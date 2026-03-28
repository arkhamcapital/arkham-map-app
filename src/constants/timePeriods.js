/** Keys match `frequency` on GeoJSON from process_gtfs.js */
export const TIME_PERIOD_ORDER = [
  { key: "early_morning", label: "Early (5–7)" },
  { key: "am_peak", label: "AM Peak" },
  { key: "midday", label: "Midday" },
  { key: "pm_peak", label: "PM Peak" },
  { key: "evening", label: "Evening" },
  { key: "night", label: "Night" },
];

export function labelForKey(key) {
  return TIME_PERIOD_ORDER.find((p) => p.key === key)?.label ?? key;
}
