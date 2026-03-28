import React from "react";
import MapComp from "./MapElements/Map";
import Navigation from "./Components/Navigation";
import About from "./Pages/About";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes>
          <Route path="/" element={<MapComp />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}
