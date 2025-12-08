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
  const [sortDir, setSortDir] = useState("DESC"); // High → Low by default

  // Build SQL price filter
  const buildPriceFilter = () => {
    if (minPrice && maxPrice)
      return `WHERE avg_price BETWEEN ${Number(minPrice)} AND ${Number(maxPrice)}`;
    else if (minPrice)
      return `WHERE avg_price >= ${Number(minPrice)}`;
    else if (maxPrice)
      return `WHERE avg_price <= ${Number(maxPrice)}`;
    return "";
  };

  // -----------------------------------------
  // FETCH – Top Airlines (Materialized)
  // -----------------------------------------
  async function fetchAirlines() {
    setLoading(true);
    setErr(null);

    try {
      const priceClause = buildPriceFilter();

      const sql = `
        SELECT al.airlinename AS label, s.avg_price AS value
        FROM summary_price_airline s
        JOIN airline al ON s.airline_id = al.airline_id
        ${priceClause}
        ORDER BY value ${sortDir}
        LIMIT ${limit};
      `;

      const res = await runQuery(sql, {}, 1);
      const rows = res.rows || [];

      setData({
        labels: rows.map(r => r.label),
        values: rows.map(r => Number(r.value))
      });

      setTitle(`Top ${limit} Airlines by Avg Price`);
    } catch (e) {
      setErr(e.toString());
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------
  // FETCH – Top Countries (Materialized)
  // -----------------------------------------
  async function fetchCountries() {
    setLoading(true);
    setErr(null);

    try {
      const priceClause = buildPriceFilter();

      const sql = `
        SELECT country AS label, avg_price AS value
        FROM summary_price_country
        ${priceClause}
        ORDER BY value ${sortDir}
        LIMIT ${limit};
      `;

      const res = await runQuery(sql, {}, 1);
      const rows = res.rows || [];

      setData({
        labels: rows.map(r => r.label),
        values: rows.map(r => Number(r.value))
      });

      setTitle(`Top ${limit} Countries by Avg Price`);
    } catch (e) {
      setErr(e.toString());
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------
  // CHART CONFIG – Make differences visible
  // -----------------------------------------
  const minVal = data.values.length ? Math.min(...data.values) : 0;
  const maxVal = data.values.length ? Math.max(...data.values) : 1;
  const yMin = Math.floor(minVal - 5);  // zoom lower
  const yMax = Math.ceil(maxVal + 5);   // zoom upper

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

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        min: yMin,
        max: yMax,
        ticks: {
          stepSize: Math.max(1, Math.round((yMax - yMin) / 10)),
        },
      },
    },
  };

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div>
      <h2>Price Analytics</h2>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>

        <button onClick={fetchAirlines} style={btn}>Top Airlines</button>
        <button onClick={fetchCountries} style={btn}>Top Countries</button>
        <button style={{ ...btn, background: "#444" }}>
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

        <label style={{ marginLeft: 12 }}>Sort:</label>
        <select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
          style={input}
        >
          <option value="DESC">High → Low</option>
          <option value="ASC">Low → High</option>
        </select>

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

      {/* Chart */}
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {loading ? <p>Loading…</p> : <Bar data={chartData} options={chartOptions} />}

      {err && <p style={{ color: "#b00" }}>Error: {err}</p>}

      <p className="muted" style={{ marginTop: 12 }}>
        Uses precomputed OLAP tables (<code>summary_price_airline</code> &amp; <code>summary_price_country</code>).
        Y-axis zoom ensures meaningful visual differences even when values are close (e.g., 245–256).
      </p>
    </div>
  );
}

// Styling
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
