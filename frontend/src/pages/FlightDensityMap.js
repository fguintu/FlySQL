import React, { useState } from "react";
import axios from "axios";

import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Fix Leaflet icon paths for CRA/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function FlightDensityMap() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState("2015-06-01");
  const [dateTo, setDateTo] = useState("2015-09-01");

  // Minimum number of flights to include a route
  const [minCount, setMinCount] = useState(10);

  async function fetchDensity() {
    setLoading(true);

    try {
      const url =
        `${API}/api/visuals/flight_density` +
        `?date_from=${dateFrom}` +
        `&date_to=${dateTo}` +
        `&min_count=${minCount}`;

      const res = await axios.get(url);
      setRoutes(res.data);
    } catch (err) {
      console.error("Error loading flight density:", err);
    }

    setLoading(false);
  }

  return (
    <div>
      <h2>Flight Density Map</h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <label>From:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />

        <label>To:</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />

        <label>Min Flights:</label>
        <input
          type="number"
          value={minCount}
          min={1}
          onChange={(e) => setMinCount(e.target.value)}
          style={{ width: 80 }}
        />

        <button onClick={fetchDensity} style={btn}>
          Load Map
        </button>
      </div>

      {loading && <p>Loading route density...</p>}

      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "620px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routes.map((r, i) => {
          // Thickness scaling (capped)
          const weight = Math.min(12, 1 + r.flight_count / 8);

          return (
            <Polyline
              key={i}
              positions={[
                [r.from_lat, r.from_lng],
                [r.to_lat, r.to_lng],
              ]}
              pathOptions={{
                color: "red",
                weight: weight,
                opacity: 0.5,
                dashArray: "4 8",
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}

const btn = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};
