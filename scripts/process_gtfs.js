/**
 * GTFS → stops_with_frequency.geojson
 * Reads GTFS .txt from: data/gtfs/, a subfolder of data/gtfs/, or a folder next to package.json
 * (e.g. f-dpz8-ttc-latest/ — common when unzipping beside src/ instead of under data/gtfs/).
 * counts weekday trip arrivals per time bucket per stop,
 * writes GeoJSON to public/data/stops_with_frequency.geojson
 *
 * Usage: node scripts/process_gtfs.js
 * Optional: set GTFS_DIR to a folder that already contains the five required .txt files
 * (e.g. if your feed lives outside the repo).
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const ROOT = path.join(__dirname, "..");
const OUT_FILE = path.join(ROOT, "public", "data", "stops_with_frequency.geojson");

const REQUIRED_GTFS_FILES = [
  "calendar.txt",
  "routes.txt",
  "trips.txt",
  "stops.txt",
  "stop_times.txt",
];

function hasAllGtfsFiles(dir) {
  return REQUIRED_GTFS_FILES.every((f) => fs.existsSync(path.join(dir, f)));
}

function describeFolderContents(dir) {
  if (!fs.existsSync(dir)) return "(missing)";
  const names = fs.readdirSync(dir);
  if (names.length === 0) return "(empty)";
  return names.slice(0, 20).join(", ") + (names.length > 20 ? ", …" : "");
}

/** Skip these when scanning project root for an extracted GTFS folder */
const SKIP_ROOT_DIR_NAMES = new Set([
  "node_modules",
  "public",
  "src",
  "build",
  ".git",
  "scripts",
  "data",
]);

/**
 * Resolution order:
 * 1. GTFS_DIR env var
 * 2. data/gtfs (direct or one subfolder)
 * 3. Any other folder directly under the project root (same level as package.json) that contains all five files
 */
function resolveGtfsDir() {
  const envDir = process.env.GTFS_DIR && process.env.GTFS_DIR.trim();
  if (envDir) {
    const resolved = path.isAbsolute(envDir)
      ? envDir
      : path.resolve(process.cwd(), envDir);
    if (!fs.existsSync(resolved)) {
      throw new Error(`GTFS_DIR does not exist: ${resolved}`);
    }
    if (!hasAllGtfsFiles(resolved)) {
      throw new Error(
        `GTFS_DIR must contain ${REQUIRED_GTFS_FILES.join(", ")}. Contents: ${describeFolderContents(resolved)}`
      );
    }
    return resolved;
  }

  const base = path.join(ROOT, "data", "gtfs");
  const fromDataGtfs = [];
  if (fs.existsSync(base)) {
    if (hasAllGtfsFiles(base)) fromDataGtfs.push(base);
    for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const p = path.join(base, ent.name);
      if (hasAllGtfsFiles(p)) fromDataGtfs.push(p);
    }
  }

  const fromProjectRoot = [];
  for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!ent.isDirectory() || SKIP_ROOT_DIR_NAMES.has(ent.name)) continue;
    const p = path.join(ROOT, ent.name);
    if (hasAllGtfsFiles(p)) fromProjectRoot.push(p);
  }

  const pick = (arr, label) => {
    if (arr.length === 0) return null;
    arr.sort((a, b) => a.localeCompare(b));
    if (arr.length > 1) {
      console.warn(
        `Multiple GTFS folders (${label}); using ${path.relative(ROOT, arr[0])}`
      );
    }
    return arr[0];
  };

  const chosen =
    pick(fromDataGtfs, "under data/gtfs") || pick(fromProjectRoot, "next to package.json");
  if (chosen) return chosen;

  const baseHint = fs.existsSync(base)
    ? describeFolderContents(base)
    : "(folder missing — create data/gtfs or put feed next to package.json)";
  throw new Error(
    `No GTFS feed found.\n` +
      `  The script looks in:\n` +
      `    • ${base} (and its subfolders)\n` +
      `    • folders next to package.json (same folder as src/), e.g. f-dpz8-ttc-latest\n` +
      `  data/gtfs right now: ${baseHint}\n` +
      `  Required files in one folder: ${REQUIRED_GTFS_FILES.join(", ")}\n` +
      `  Or set GTFS_DIR to that folder.`
  );
}

const BUCKETS = [
  "early_morning",
  "am_peak",
  "midday",
  "pm_peak",
  "evening",
  "night",
];

/** Hours spanned by each bucket for trips/hour (single representative weekday) */
const BUCKET_HOURS = {
  early_morning: 2, // 5–7
  am_peak: 2, // 7–9
  midday: 6, // 9–15
  pm_peak: 4, // 15–19
  evening: 3, // 19–22
  night: 7, // 22–24 + 0–5
};

function readGtfsCsv(gtfsDir, filename) {
  const fp = path.join(gtfsDir, filename);
  if (!fs.existsSync(fp)) {
    throw new Error(`Missing GTFS file: ${fp}`);
  }
  const text = fs.readFileSync(fp, "utf8");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });
}

/** GTFS time → minutes in [0, 1440) (handles hours ≥ 24) */
function arrivalTimeToMinutesOfDay(timeStr) {
  const [hStr, mStr, sStr = "0"] = String(timeStr).trim().split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const s = parseInt(sStr, 10);
  if ([h, m, s].some((x) => Number.isNaN(x))) return null;
  let total = h * 60 + m + s / 60;
  total = ((total % 1440) + 1440) % 1440;
  return total;
}

function bucketForMinutes(mins) {
  if (mins >= 300 && mins < 420) return "early_morning"; // 5–7
  if (mins >= 420 && mins < 540) return "am_peak"; // 7–9
  if (mins >= 540 && mins < 900) return "midday"; // 9–15
  if (mins >= 900 && mins < 1140) return "pm_peak"; // 15–19
  if (mins >= 1140 && mins < 1320) return "evening"; // 19–22
  if (mins >= 1320 || mins < 300) return "night"; // 22–5
  return null;
}

function isWeekdayService(row) {
  const d = (k) => String(row[k] ?? "").trim() === "1";
  return (
    d("monday") &&
    d("tuesday") &&
    d("wednesday") &&
    d("thursday") &&
    d("friday")
  );
}

function main() {
  const gtfsDir = resolveGtfsDir();
  console.log(`GTFS directory: ${path.relative(ROOT, gtfsDir)}`);

  const calendarRows = readGtfsCsv(gtfsDir, "calendar.txt");
  const weekdayServiceIds = new Set();
  for (const row of calendarRows) {
    if (isWeekdayService(row) && row.service_id) {
      weekdayServiceIds.add(String(row.service_id).trim());
    }
  }
  if (weekdayServiceIds.size === 0) {
    throw new Error(
      "No weekday service_ids found (expected Mon–Fri all = 1 in calendar.txt)."
    );
  }

  const routesRows = readGtfsCsv(gtfsDir, "routes.txt");
  const routeById = new Map();
  for (const r of routesRows) {
    const id = String(r.route_id ?? "").trim();
    if (!id) continue;
    routeById.set(id, {
      route_id: id,
      route_short_name: r.route_short_name ?? "",
      route_long_name: r.route_long_name ?? "",
    });
  }

  const tripsRows = readGtfsCsv(gtfsDir, "trips.txt");
  /** trip_id -> { route_id, service_id } */
  const tripMeta = new Map();
  for (const t of tripsRows) {
    const tid = String(t.trip_id ?? "").trim();
    const sid = String(t.service_id ?? "").trim();
    const rid = String(t.route_id ?? "").trim();
    if (!tid || !weekdayServiceIds.has(sid)) continue;
    tripMeta.set(tid, { route_id: rid, service_id: sid });
  }

  const stopsRows = readGtfsCsv(gtfsDir, "stops.txt");
  const stopById = new Map();
  for (const s of stopsRows) {
    const id = String(s.stop_id ?? "").trim();
    if (!id) continue;
    const lat = parseFloat(s.stop_lat);
    const lon = parseFloat(s.stop_lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    stopById.set(id, {
      stop_id: id,
      stop_name: s.stop_name ?? "",
      stop_lat: lat,
      stop_lon: lon,
    });
  }

  /** stop_id -> bucket -> trip count */
  const counts = new Map();
  /** stop_id -> Map route_id -> route info */
  const routesAtStop = new Map();

  function ensureStopMaps(stopId) {
    if (!counts.has(stopId)) {
      counts.set(stopId, Object.fromEntries(BUCKETS.map((b) => [b, 0])));
      routesAtStop.set(stopId, new Map());
    }
  }

  const stopTimesRows = readGtfsCsv(gtfsDir, "stop_times.txt");
  for (const st of stopTimesRows) {
    const tripId = String(st.trip_id ?? "").trim();
    const stopId = String(st.stop_id ?? "").trim();
    if (!tripId || !stopId || !stopById.has(stopId)) continue;
    const meta = tripMeta.get(tripId);
    if (!meta) continue;

    const timeField = st.arrival_time || st.departure_time;
    if (!timeField) continue;
    const mins = arrivalTimeToMinutesOfDay(timeField);
    if (mins === null) continue;
    const bucket = bucketForMinutes(mins);
    if (!bucket) continue;

    ensureStopMaps(stopId);
    counts.get(stopId)[bucket] += 1;

    const rid = meta.route_id;
    if (rid && routeById.has(rid)) {
      routesAtStop.get(stopId).set(rid, routeById.get(rid));
    }
  }

  const features = [];
  for (const [stopId, info] of stopById) {
    const c = counts.get(stopId);
    const freq = {};
    for (const b of BUCKETS) {
      const raw = c ? c[b] : 0;
      const hours = BUCKET_HOURS[b];
      freq[b] = Math.round((raw / hours) * 10) / 10;
    }

    const routeList = routesAtStop.has(stopId)
      ? [...routesAtStop.get(stopId).values()].sort((a, b) =>
          String(a.route_short_name).localeCompare(String(b.route_short_name))
        )
      : [];

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [info.stop_lon, info.stop_lat],
      },
      properties: {
        stop_id: info.stop_id,
        stop_name: info.stop_name,
        stop_lat: info.stop_lat,
        stop_lon: info.stop_lon,
        routes: routeList,
        frequency: freq,
      },
    });
  }

  const collection = {
    type: "FeatureCollection",
    features,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(collection), "utf8");
  console.log(
    `Wrote ${features.length} stops to ${path.relative(ROOT, OUT_FILE)}`
  );
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
