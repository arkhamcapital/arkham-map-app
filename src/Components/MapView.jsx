import React, { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { colorForTripsPerHour } from "../utils/frequencyColors";

function MapLegend() {
  return (
    <div
      className="position-absolute bottom-0 end-0 m-3 p-2 rounded shadow bg-dark text-white small"
      style={{ zIndex: 1000 }}
    >
      <div className="text-secondary mb-1">Trips/hr (selected period)</div>
      <div className="d-flex align-items-center gap-1 mb-1">
        <span className="rounded-circle d-inline-block" style={{ width: 12, height: 12, background: "#22c55e" }} /> &gt; 6
      </div>
      <div className="d-flex align-items-center gap-1 mb-1">
        <span className="rounded-circle d-inline-block" style={{ width: 12, height: 12, background: "#eab308" }} /> 3–6
      </div>
      <div className="d-flex align-items-center gap-1 mb-1">
        <span className="rounded-circle d-inline-block" style={{ width: 12, height: 12, background: "#f97316" }} /> 1–3
      </div>
      <div className="d-flex align-items-center gap-1">
        <span className="rounded-circle d-inline-block" style={{ width: 12, height: 12, background: "#ef4444" }} /> &lt; 1
      </div>
    </div>
  );
}

function StopsLayer({ features, timePeriod, selectedStopId, onSelectStop }) {
  const map = useMap();
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    const update = () => {
      const b = map.getBounds().pad(0.12);
      const next = features.filter((f) => {
        const [lon, lat] = f.geometry.coordinates;
        return b.contains(L.latLng(lat, lon));
      });
      setVisible(next);
    };
    update();
    map.on("moveend zoomend", update);
    return () => {
      map.off("moveend zoomend", update);
    };
  }, [map, features]);

  return (
    <>
      {visible.map((f) => {
        const id = f.properties.stop_id;
        const tph = Number(f.properties.frequency?.[timePeriod]) || 0;
        const fill = colorForTripsPerHour(tph);
        const selected = selectedStopId === id;
        return (
          <CircleMarker
            key={id}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={selected ? 11 : 6}
            pathOptions={{
              color: selected ? "#fff" : "#222",
              weight: selected ? 2 : 1,
              fillColor: fill,
              fillOpacity: 0.88,
            }}
            eventHandlers={{
              click: () => onSelectStop(f),
            }}
          />
        );
      })}
    </>
  );
}

const TORONTO_CENTER = [43.6532, -79.3832];
const GEOJSON_URL = `${process.env.PUBLIC_URL}/data/stops_with_frequency.geojson`;

export default function MapView({ timePeriod, selectedStopId, onSelectStop }) {
  const [collection, setCollection] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setCollection)
      .catch((e) => setError(e.message));
  }, []);

  const features = useMemo(
    () => (collection?.type === "FeatureCollection" ? collection.features : []),
    [collection]
  );

  if (error) {
    return (
      <div className="d-flex align-items-center justify-content-center bg-secondary text-white h-100">
        <div className="p-4 text-center">
          <p className="mb-2">Could not load stops GeoJSON.</p>
          <code className="small">{error}</code>
          <p className="small mt-2 mb-0">Run <code>npm run process-gtfs</code> first.</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="d-flex align-items-center justify-content-center bg-dark text-white h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading map…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="position-relative h-100 w-100">
      <MapContainer
        center={TORONTO_CENTER}
        zoom={12}
        className="h-100 w-100"
        scrollWheelZoom
        style={{ background: "#1a1a1a" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <StopsLayer
          features={features}
          timePeriod={timePeriod}
          selectedStopId={selectedStopId}
          onSelectStop={onSelectStop}
        />
      </MapContainer>
      <MapLegend />
    </div>
  );
}
