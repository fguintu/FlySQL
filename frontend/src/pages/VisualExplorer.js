import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { runQuery } from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function VisualExplorer() {
  const [title, setTitle] = useState("Top 10 Most Expensive Airlines (Avg Price)");
  const [data, setData] = useState({ labels: [], values: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Filters
  const [limit, setLimit] = useState(10);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const chartData = useMemo(
    () => ({
      labels: data.labels,
      datasets: [
        {
          label: "Average Price (USD)",
          data: data.values,
          backgroundColor: "rgba(33, 102, 172, 0.8)",
        },
      ],
    }),
    [data]
  );

  // Helper to build price filter clause
  const buildPriceFilter = () => {
    let cond = "";
    if (minPrice && maxPrice)
      cond = `WHERE b.price BETWEEN ${Number(minPrice)} AND ${Number(maxPrice)}`;
    else if (minPrice)
      cond = `WHERE b.price >= ${Number(minPrice)}`;
    else if (maxPrice)
      cond = `WHERE b.price <= ${Number(maxPrice)}`;
    return cond;
  };

  async function fetchAirlines() {
    setLoading(true);
    setErr(null);

    try {
      const priceClause =
        minPrice && maxPrice
          ? `WHERE avg_price BETWEEN ${minPrice} AND ${maxPrice}`
          : minPrice
          ? `WHERE avg_price >= ${minPrice}`
          : maxPrice
          ? `WHERE avg_price <= ${maxPrice}`
          : "";

      const sql = `
        SELECT al.airlinename AS label, s.avg_price AS value
        FROM summary_price_airline s
        JOIN airline al ON s.airline_id = al.airline_id
        ${priceClause}
        ORDER BY value DESC
        LIMIT ${Number(limit)};
      `;

      const res = await runQuery(sql, {}, 1);
      const rows = res.rows || [];

      setData({
        labels: rows.map((r) => r.label),
        values: rows.map((r) => Number(r.value)),
      });

      setTitle(`Top ${limit} Airlines by Avg Price`);
    } catch (e) {
      setErr(e.toString());
    } finally {
      setLoading(false);
    }
  }


  async function fetchCountries() {
  setLoading(true);
  setErr(null);

  try {
    const priceClause =
      minPrice && maxPrice
        ? `WHERE avg_price BETWEEN ${minPrice} AND ${maxPrice}`
        : minPrice
        ? `WHERE avg_price >= ${minPrice}`
        : maxPrice
        ? `WHERE avg_price <= ${maxPrice}`
        : "";

    const sql = `
      SELECT country AS label, avg_price AS value
      FROM summary_price_country
      ${priceClause}
      ORDER BY value DESC
      LIMIT ${Number(limit)};
    `;

    const res = await runQuery(sql, {}, 1);
    const rows = res.rows || [];

    setData({
      labels: rows.map((r) => r.label),
      values: rows.map((r) => Number(r.value)),
    });

    setTitle(`Top ${limit} Countries by Avg Price`);
  } catch (e) {
    setErr(e.toString());
  } finally {
    setLoading(false);
  }
}

  function handleGeoVisualization() {
    alert("🌍 Geolocation visualization coming soon!\n(This will use airport_geo.latitude/longitude for to/from routes.)");
  }

  return (
    <div>
      <h2>Price Analytics Dashboard</h2>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <button onClick={fetchAirlines} style={btn}>Top Airlines</button>
        <button onClick={fetchCountries} style={btn}>Top Countries</button>
        <button onClick={handleGeoVisualization} style={{ ...btn, background: "#444" }}>
          ✈️ To/From Geolocation (Placeholder)
        </button>

        <label style={{ marginLeft: 12 }}>Show Top:</label>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          min="5"
          max="100"
          style={input}
        />

        <label style={{ marginLeft: 12 }}>Min Price:</label>
        <input
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="e.g. 100"
          style={input}
        />

        <label>Max Price:</label>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="e.g. 1000"
          style={input}
        />
      </div>

      {/* Chart and output */}
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {loading ? <p>Loading…</p> : <Bar data={chartData} />}
      {err ? <p style={{ color: "#b00" }}>Error: {err}</p> : null}

      <p className="muted" style={{ marginTop: 12 }}>
        Uses <code>AVG(booking.price)</code>.  
        Filters use optimized indexes:  
        <code>(flight_id, price)</code>, <code>(from, to, airline_id)</code>, <code>(airport_id, country)</code>.
      </p>
    </div>
  );
}

const btn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};

const input = {
  width: 80,
  padding: "4px 6px",
  border: "1px solid #aaa",
  borderRadius: 4,
};
