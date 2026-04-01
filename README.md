# TTC Service Gap Analyzer

A React + Leaflet prototype for **exploring scheduled transit service at the stop level** using **static GTFS** (the agency’s published timetable). It’s aimed at planners and schedulers who want a **fast first pass** before diving into spreadsheets, real-time feeds, or crowding data.

## What it does (in plain terms)

1. **Turns GTFS into a map**  
   A Node script reads the feed and builds `public/data/stops_with_frequency.geojson`: each stop includes **scheduled trips per hour** in time buckets (early morning, AM peak, midday, PM peak, evening, night) for **weekday** service.

2. **Map**  
   Stops appear as circle markers. **Color** reflects trips/hour in the **currently selected** time period (green = more scheduled service, red = less—see the on-map legend).

3. **Stop detail panel**  
   Click a stop to see **name/ID**, **routes** that serve it, a **bar chart** of trips/hour across all buckets, and optional **demand hints** (e.g. major-interchange flag, nearby POIs from OpenStreetMap via Overpass).

4. **Analyze with AI** (optional)  
   Sends that context to **Anthropic Claude** (streaming) for a short, plain-language note and a **recommended next step** (e.g. monitor, tripper, frequency review). The AI interprets the **same numbers you see**—it does not replace official data systems.

## What it is *not*

- **Not real-time.** There is no live vehicle tracking or delay data unless you add GTFS-RT or similar later.
- **Not crowding.** Scheduled frequency ≠ how full vehicles are; you’d need APC or other ridership sources for that.
- **Not an agency decision system.** Treat outputs as **decision support / demo** quality unless you harden data, validation, and deployment.

## Data pipeline (GTFS → GeoJSON)

1. Place a TTC (or other) static GTFS extract where the script can find it—either under `data/gtfs/`, a subfolder of that, or a folder next to `package.json` (e.g. `f-dpz8-ttc-latest/`).
2. Run:

   ```bash
   npm run process-gtfs
   ```

3. Output: `public/data/stops_with_frequency.geojson`.

The processor currently **restricts to GTFS `route_type = 1`** (subway/metro in the standard). Buses, streetcars, and LRT (other `route_type` values) are excluded unless you change `scripts/process_gtfs.js`.

## Running the app

### Development (map + AI)

`npm start` runs **two** processes:

1. **`scripts/anthropic-proxy.js`** — listens on port **3001** and forwards `POST /api/claude/messages` to Anthropic (keeps the API key off the browser).
2. **`react-scripts start`** — dev server on port **3000**, with `package.json` **`proxy`** set to `http://127.0.0.1:3001`.

Create **`mapapp/.env.local`** (gitignored):

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Never commit real keys.

### Without AI

There is no separate “frontend-only” script in `package.json`; AI is optional at runtime (you can ignore the panel). To avoid starting the proxy, you could run `react-scripts start` directly, but then **Analyze with AI** will fail unless you add another backend.

### Production build

```bash
npm run build
```

Static files land in `build/`. The Anthropic proxy **does not** run in production—you need a **hosted API route** (e.g. serverless function) that mirrors `scripts/anthropic-proxy.js` if you want AI in production.

## Project layout (high level)

| Path | Role |
|------|------|
| `scripts/process_gtfs.js` | GTFS → `stops_with_frequency.geojson` |
| `scripts/anthropic-proxy.js` | Dev-only Claude proxy |
| `public/data/stops_with_frequency.geojson` | Generated stop features (run `process-gtfs`) |
| `src/Components/MapView.jsx` | Leaflet map + GeoJSON stops |
| `src/Components/TimePeriodSelector.jsx` | Time bucket toggle |
| `src/Components/StopDetailPanel.jsx` | Sidebar for selected stop |
| `src/Components/AIRecommendationPanel.jsx` | Streaming AI + export |
| `src/api/claudeStream.js` | Prompt shape + SSE client |
| `src/Pages/About.jsx` | Product / use-case copy |

## Scripts reference

| Command | Description |
|---------|-------------|
| `npm start` | Proxy (3001) + CRA dev server (3000) |
| `npm run build` | Production bundle |
| `npm run process-gtfs` | Regenerate GeoJSON from GTFS |
| `npm test` | CRA test runner |

## Tech stack

- React (Create React App), React Router, React Leaflet, Bootstrap / Reactstrap, Recharts  
- Node + `csv-parse` for GTFS preprocessing  
- Anthropic Messages API (streaming) behind dev proxy  

---

Bootstrapped with [Create React App](https://github.com/facebook/create-react-app). For generic CRA topics (eject, deployment, troubleshooting), see the [CRA documentation](https://facebook.github.io/create-react-app/docs/getting-started).
