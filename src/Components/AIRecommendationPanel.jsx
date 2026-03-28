import React, { useEffect, useState } from "react";

const MOCK_STREAM =
  "Summary: This stop shows elevated demand pressure relative to scheduled frequency in the selected period. " +
  "Consider validating crowding complaints with APC or faregate data, then evaluate a short tripper before the peak " +
  "if the gap persists across multiple weekdays. Coordinate with rail connections if this is a transfer-heavy location.";

/**
 * UI shell for an AI recommendation. Browser builds cannot call Anthropic directly (API key);
 * wire a small backend or serverless function later and replace the mock stream.
 */
export default function AIRecommendationPanel({ stopName, gapScore, timePeriodLabel, tripsPerHour }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setText("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setText(MOCK_STREAM.slice(0, i));
      if (i >= MOCK_STREAM.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 12);
    return () => clearInterval(id);
  }, [stopName]);

  const exportSummary = [
    `Stop: ${stopName}`,
    `Period: ${timePeriodLabel}`,
    `Trips/hr (selected): ${tripsPerHour}`,
    `Gap score: ${gapScore}`,
    "",
    "Recommendation:",
    text || MOCK_STREAM,
  ].join("\n");

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
          disabled={!done}
          onClick={copyExport}
        >
          Export
        </button>
      </div>
      <p className="small text-white-50 mb-2">
        Demo: simulated streaming. Production: call Claude via a backend proxy.
      </p>
      <div
        className="small"
        style={{ whiteSpace: "pre-wrap", lineHeight: 1.45, minHeight: "4rem" }}
      >
        {text}
        {!done && <span className="opacity-50">▍</span>}
      </div>
    </div>
  );
}
