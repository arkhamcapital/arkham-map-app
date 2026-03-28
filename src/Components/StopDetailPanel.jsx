import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TIME_PERIOD_ORDER, labelForKey } from "../constants/timePeriods";
import { isNearMajorInterchange } from "../constants/interchanges";
import { computeGapMetrics } from "../utils/gapScore";
import { fetchPoiCountAround } from "../utils/overpassPoi";
import AIRecommendationPanel from "./AIRecommendationPanel";

const POPULATION_PROXY_PLACEHOLDER = 0;

export default function StopDetailPanel({ feature, timePeriod, onClose }) {
  const props = feature.properties;
  const freq = useMemo(() => props.frequency || {}, [props.frequency]);
  const [poiCount, setPoiCount] = useState(null);
  const [poiError, setPoiError] = useState(null);
  const [poiLoading, setPoiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const interchange = isNearMajorInterchange(props.stop_name);
  const tph = Number(freq[timePeriod]) || 0;

  const chartData = useMemo(
    () =>
      TIME_PERIOD_ORDER.map(({ key, label }) => ({
        name: label,
        tripsPerHour: Number(freq[key]) || 0,
      })),
    [freq]
  );

  const metrics = useMemo(
    () =>
      computeGapMetrics({
        poiCount: poiCount ?? 0,
        isInterchange: interchange,
        populationProxy: POPULATION_PROXY_PLACEHOLDER,
        tripsPerHourSelected: tph,
      }),
    [poiCount, interchange, tph]
  );

  const poiListForPrompt = useMemo(() => {
    if (poiLoading) return "Loading…";
    if (poiError) return `Unavailable (${poiError})`;
    if (poiCount === null) return "—";
    return `${poiCount} OSM features (hospitals, schools, colleges, malls) within 400m`;
  }, [poiLoading, poiError, poiCount]);

  useEffect(() => {
    setShowAi(false);
    setPoiCount(null);
    setPoiError(null);
    const [lon, lat] = feature.geometry.coordinates;
    let cancelled = false;
    setPoiLoading(true);
    fetchPoiCountAround(lat, lon, 400)
      .then((n) => {
        if (!cancelled) {
          setPoiCount(n);
          setPoiError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setPoiCount(0);
          setPoiError(e.message || "POI lookup failed");
        }
      })
      .finally(() => {
        if (!cancelled) setPoiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [feature]);

  return (
    <aside
      className="bg-dark text-white border-start border-secondary d-flex flex-column shadow-lg"
      style={{ width: "min(420px, 100vw)", maxHeight: "calc(100vh - 56px)", zIndex: 1100 }}
    >
      <div className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-start gap-2">
        <div>
          <h2 className="h5 mb-1">{props.stop_name || "Stop"}</h2>
          <code className="small text-secondary">id: {props.stop_id}</code>
        </div>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close"
          onClick={onClose}
        />
      </div>

      <div className="flex-grow-1 overflow-auto p-3">
        <section className="mb-3">
          <h3 className="h6 text-secondary">Routes</h3>
          {props.routes?.length ? (
            <ul className="list-unstyled small mb-0">
              {props.routes.map((r) => (
                <li key={r.route_id}>
                  <span className="fw-semibold">{r.route_short_name || r.route_id}</span>
                  {r.route_long_name ? (
                    <span className="text-white-50"> — {r.route_long_name}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="small text-white-50 mb-0">No route metadata</p>
          )}
        </section>

        <section className="mb-3">
          <h3 className="h6 text-secondary">Scheduled frequency (trips/hr)</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ bottom: 8, left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" tick={{ fill: "#aaa", fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={70} />
                <YAxis tick={{ fill: "#aaa", fontSize: 11 }} width={32} />
                <Tooltip
                  contentStyle={{ background: "#222", border: "1px solid #555" }}
                  formatter={(v) => [`${v} / hr`, "Trips"]}
                />
                <Bar dataKey="tripsPerHour" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mb-3">
          <h3 className="h6 text-secondary">Demand signals</h3>
          <ul className="small mb-0 ps-3">
            <li>
              Near GO/Subway interchange?{" "}
              <strong>{interchange ? "Likely (list match)" : "Not flagged"}</strong>
            </li>
            <li>
              POI count (OSM, 400m):{" "}
              {poiLoading ? (
                <span className="text-white-50">Loading…</span>
              ) : (
                <strong>{poiCount ?? "—"}</strong>
              )}
              {poiError ? (
                <span className="text-warning ms-1">({poiError})</span>
              ) : null}
            </li>
            <li>
              Population proxy: <strong>{POPULATION_PROXY_PLACEHOLDER}</strong>{" "}
              <span className="text-white-50">(placeholder)</span>
            </li>
          </ul>
        </section>

        <section className="mb-3 p-3 rounded bg-black bg-opacity-25 border border-secondary">
          <h3 className="h6 text-secondary">Gap score (0–100)</h3>
          <div className="display-6 mb-1">{Math.round(metrics.gap_score)}</div>
          <div className="small text-white-50">
            Demand {Math.round(metrics.demand_score)} vs supply index{" "}
            {Math.round(metrics.supply_score)}
          </div>
          <div className="progress mt-2" style={{ height: 8 }}>
            <div
              className="progress-bar bg-warning"
              style={{ width: `${metrics.gap_score}%` }}
            />
          </div>
        </section>

        {!showAi ? (
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={() => setShowAi(true)}
          >
            Analyze with AI
          </button>
        ) : (
          <AIRecommendationPanel
            stopId={props.stop_id}
            stopName={props.stop_name}
            routes={props.routes}
            frequency={freq}
            selectedPeriodLabel={labelForKey(timePeriod)}
            poiList={poiListForPrompt}
            isInterchange={interchange}
            gapScore={Math.round(metrics.gap_score)}
          />
        )}
      </div>
    </aside>
  );
}
