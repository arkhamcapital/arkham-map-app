import React, { useEffect, useMemo, useState } from "react";
import {
  buildPromptPayload,
  streamAnthropicMessages,
} from "../api/claudeStream";

export default function AIRecommendationPanel({
  stopId,
  stopName,
  routes,
  frequency,
  selectedPeriodLabel,
  poiList,
  isInterchange,
  gapScore,
}) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const payload = useMemo(
    () =>
      buildPromptPayload({
        stop_name: stopName,
        stop_id: stopId,
        routes,
        frequency,
        selected_period_label: selectedPeriodLabel,
        poi_list: poiList,
        is_interchange: isInterchange,
        gap_score: gapScore,
      }),
    [
      stopName,
      stopId,
      routes,
      frequency,
      selectedPeriodLabel,
      poiList,
      isInterchange,
      gapScore,
    ]
  );

  useEffect(() => {
    setText("");
    setDone(false);
    setError(null);
    const ac = new AbortController();

    streamAnthropicMessages(payload, {
      signal: ac.signal,
      onDelta: (chunk) => setText((prev) => prev + chunk),
      onError: (msg) => {
        setError(msg);
        setDone(true);
      },
      onDone: () => setDone(true),
    });

    return () => ac.abort();
  }, [payload]);

  const exportSummary = useMemo(() => {
    const head = [
      `Stop: ${stopName} (${stopId})`,
      `Period: ${selectedPeriodLabel}`,
      `Gap score: ${gapScore}`,
      "",
    ];
    if (error) return [...head, `Error: ${error}`].join("\n");
    return [...head, "Recommendation:", text || "(empty)"].join("\n");
  }, [stopName, stopId, selectedPeriodLabel, gapScore, text, error]);

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportSummary);
    } catch {
      window.prompt("Copy:", exportSummary);
    }
  };

  return (
    <div className="mt-3 p-3 rounded border border-secondary bg-black bg-opacity-25">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-semibold text-info">AI recommendation</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          disabled={!text && !error}
          onClick={copyExport}
        >
          Export
        </button>
      </div>
      {error ? (
        <div className="small text-warning">{error}</div>
      ) : (
        <div
          className="small"
          style={{ whiteSpace: "pre-wrap", lineHeight: 1.45, minHeight: "4rem" }}
        >
          {text}
          {!done && !error && <span className="opacity-50">▍</span>}
        </div>
      )}
    </div>
  );
}
