/**
 * POI count (hospitals, schools, malls) within radiusMeters using Overpass API.
 * May fail from the browser due to CORS or rate limits — caller should handle errors.
 */
export async function fetchPoiCountAround(lat, lon, radiusMeters = 400) {
  const q = `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  node["amenity"="school"](around:${radiusMeters},${lat},${lon});
  node["amenity"="college"](around:${radiusMeters},${lat},${lon});
  node["amenity"="university"](around:${radiusMeters},${lat},${lon});
  node["shop"="mall"](around:${radiusMeters},${lat},${lon});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lon});
  way["amenity"="school"](around:${radiusMeters},${lat},${lon});
  way["shop"="mall"](around:${radiusMeters},${lat},${lon});
);
out body;
`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(q),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const json = await res.json();
  const n = Array.isArray(json.elements) ? json.elements.length : 0;
  return n;
}
