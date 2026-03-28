import React, { useState } from "react";
import MapView from "../Components/MapView";
import TimePeriodSelector from "../Components/TimePeriodSelector";
import StopDetailPanel from "../Components/StopDetailPanel";
import "../index.css";

const MapComp = () => {
  const [timePeriod, setTimePeriod] = useState("am_peak");
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <div style={{ paddingTop: "56px", minHeight: "100vh" }}>
      <div
        className="d-flex"
        style={{ height: "calc(100vh - 56px)", minHeight: 0 }}
      >
        <div
          className="position-relative flex-grow-1"
          style={{ minWidth: 0, minHeight: 0 }}
        >
          <TimePeriodSelector value={timePeriod} onChange={setTimePeriod} />
          <div className="h-100 w-100">
            <MapView
              timePeriod={timePeriod}
              selectedStopId={selectedFeature?.properties?.stop_id}
              onSelectStop={setSelectedFeature}
            />
          </div>
        </div>
        {selectedFeature ? (
          <StopDetailPanel
            feature={selectedFeature}
            timePeriod={timePeriod}
            onClose={() => setSelectedFeature(null)}
          />
        ) : null}
      </div>
    </div>
  );
};

export default MapComp;
