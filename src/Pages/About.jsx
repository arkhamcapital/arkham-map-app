import React from "react";
import Footer from "../Components/Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";

const About = () => {
  return (
    <main className="bg-light text-black min-vh-100" style={{ paddingTop: "5.5rem" }}>
      <div className="container py-4 pb-5 col-lg-10 mx-auto">
        <h1 className="h2 mb-2">About TTC Service Gap Analyzer</h1>
        <p className="text-secondary lead mb-4">
          A planning-oriented prototype for exploring scheduled service and demand
          signals at the stop level—built around static GTFS and a map-first
          workflow.
        </p>

        <section className="mb-5">
          <h2 className="h4 text-info mb-3">Who it’s for</h2>
          <p className="mb-3">
            The core scenario is a <strong>transit scheduler or service planner</strong>{" "}
            (at the TTC or any agency that publishes GTFS): someone who needs to
            respond to rider feedback, crowding concerns, or network reviews without
            spending the first half-hour manually joining spreadsheets, maps, and
            timetable PDFs.
          </p>
          <p className="mb-0">
            The app is meant to <strong>compress the first pass</strong>: open the
            map, pick a stop, and see{" "}
            <strong>scheduled frequency by time of day</strong>, routes that serve
            it, a crude <strong>demand-vs-supply gap</strong> hint, and an optional{" "}
            <strong>AI summary</strong> that speaks in plain language—so the team can
            decide whether a case deserves deeper analysis (APC, OTP, complaints
            databases, field checks).
          </p>
        </section>

        <section className="mb-5">
          <h2 className="h4 text-info mb-3">What you can do with it</h2>
          <ul className="mb-0 ps-3">
            <li className="mb-2">
              <strong>Explore scheduled service.</strong> Frequencies come from the
              agency’s <strong>static GTFS</strong> (trips and stop times), not live
              GPS—so you’re looking at what the timetable <em>promises</em>, which is
              the right baseline for schedule changes, trippers, and headway
              discussions.
            </li>
            <li className="mb-2">
              <strong>Switch time periods</strong> (early morning, peaks, midday,
              evening, night) and see stops colored by trips per hour in that window—
              useful for peak-focused complaints or off-peak gaps.
            </li>
            <li className="mb-2">
              <strong>Open a stop</strong> to see routes, a frequency bar chart, light
              demand context (e.g. major interchange flag, nearby POIs from
              OpenStreetMap), and a gap score derived from matching 0–100 demand and
              supply indices (shortfall when demand exceeds scheduled service).
            </li>
            <li className="mb-0">
              <strong>Analyze with AI</strong> (optional) to get a concise narrative and
              a forced recommendation bucket—helpful for notes, emails, or handoff to
              colleagues, not a substitute for agency data systems.
            </li>
          </ul>
        </section>

        <section className="mb-5">
          <h2 className="h4 text-info mb-3">What it is not</h2>
          <p className="mb-3">
            Static GTFS does <strong>not</strong> show real-time delay, short-turning,
            or live crowding. This tool does not replace{" "}
            <strong>GTFS-RT, APC, or operational dashboards</strong>; it situates a stop
            in the <strong>published schedule</strong> so you can ask better questions
            when you add real-time or ridership layers later.
          </p>
          <p className="mb-0 small text-secondary">
            Route and mode filters (e.g. subway-only) depend on how routes are typed in
            your feed (<code>route_type</code> in GTFS). Regenerate the processed GeoJSON
            after feed updates so the map matches the agency’s current schedule.
          </p>
        </section>

        <section className="mb-2">
          <h2 className="h4 text-info mb-3">Why it matters for a product story</h2>
          <p className="mb-0">
            Products like this sell <strong>faster decision cycles</strong>: map +
            schedule + context + narrative in one place. The value is not “replace the
            planner,” it’s <strong>reduce time-to-insight</strong> when someone says,
            “this stop is a problem”—and your demo shows you already think in terms of
            data pipelines, UX for schedulers, and responsible AI on top of transparent
            inputs.
          </p>
          <small>Contains information licensed under the Open Government Licence - Toronto</small>
        </section>
      </div>
      <Footer />
    </main>
  );
};

export default About;
