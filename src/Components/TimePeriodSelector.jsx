import React from "react";
import { TIME_PERIOD_ORDER } from "../constants/timePeriods";

export default function TimePeriodSelector({ value, onChange }) {
  return (
    <div
      className="position-absolute top-0 start-0 m-3 p-2 rounded shadow bg-dark text-white"
      style={{ zIndex: 1000, maxWidth: "calc(100% - 2rem)" }}
    >
      <div className="small text-secondary mb-1">Time period (map colors)</div>
      <div className="btn-group btn-group-sm flex-wrap" role="group">
        {TIME_PERIOD_ORDER.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`btn ${value === key ? "btn-primary" : "btn-outline-light"}`}
            onClick={() => onChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
