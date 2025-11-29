import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from "chart.js";
import { runQuery } from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const mock = {
  airlines: {
    labels: ["Air A", "Air B", "Air C", "Air D", "Air E", "Air F", "Air G", "Air H", "Air I", "Air J"],
    values: [520, 505, 498, 480, 472, 468, 455, 449, 447, 440]
  },
  countries: {
    labels: ["USA", "UK", "JP", "DE", "FR", "CA", "IT", "ES", "SG", "AU"],
    values: [540, 522, 501, 495, 488, 472, 469, 460, 456, 452]
  }
};

export default function VisualExplorer() {
  const [title, setTitle] = useState("Top 10 Most Expensive Airlines (Avg Price)");
  const [data, setData] = useState(mock.airlines);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const chartData = useMemo(() => ({
    labels: data.labels,
    datasets: [{ label: "Average Price (USD)", data: data.values }]
  }), [data]);

  async function fetchAirlines() {
    setLoading(true); setErr(null);
    try {
      // Top 10 airlines by average booking price
      const sql = `
        SELECT al.airlinename AS label, ROUND(AVG(b.price), 2) AS value
        FROM booking b
        JOIN flight f   ON b.flight_id = f.flight_id
        JOIN airline al ON f.airline_id = al.airline_id
        GROUP BY al.airlinename
        ORDER BY value DESC
        LIMIT 10
      `;
      const res = await runQuery(sql, {}, 1);
      const rows = res.rows || [];
      if (rows.length) {
        setData({
          labels: rows.map(r => r.label),
          values: rows.map(r => Number(r.value))
        });
      } else {
        setData(mock.airlines);
      }
      setTitle("Top 10 Most Expensive Airlines (Avg Price)");
    } catch (e) {
      setErr(e.toString());
      setData(mock.airlines);
      setTitle("Top 10 Most Expensive Airlines (Avg Price) — mock");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCountries() {
    setLoading(true); setErr(null);
    try {
      // Option A: country of ORIGIN airport
      const sql = `
        SELECT ag.country AS label, ROUND(AVG(b.price), 2) AS value
        FROM booking b
        JOIN flight f     ON b.flight_id = f.flight_id
        JOIN airport a1   ON f.\`from\` = a1.airport_id
        JOIN airport_geo ag ON a1.airport_id = ag.airport_id
        GROUP BY ag.country
        ORDER BY value DESC
        LIMIT 10
      `;
      // Option B (alternative): passenger country — use if you prefer passenger-based pricing
      // const sql = `
      //   SELECT pd.country AS label, ROUND(AVG(b.price), 2) AS value
      //   FROM booking b
      //   JOIN passenger p  ON b.passenger_id = p.passenger_id
      //   JOIN passengerdetails pd ON p.passenger_id = pd.passenger_id
      //   GROUP BY pd.country
      //   ORDER BY value DESC
      //   LIMIT 10
      // `;

      const res = await runQuery(sql, {}, 1);
      const rows = res.rows || [];
      if (rows.length) {
        setData({
          labels: rows.map(r => r.label),
          values: rows.map(r => Number(r.value))
        });
      } else {
        setData(mock.countries);
      }
      setTitle("Top 10 Most Expensive Countries (Avg Price)");
    } catch (e) {
      setErr(e.toString());
      setData(mock.countries);
      setTitle("Top 10 Most Expensive Countries (Avg Price) — mock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Price Analytics</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={fetchAirlines} style={btn}>Top Airlines</button>
        <button onClick={fetchCountries} style={btn}>Top Countries</button>
      </div>

      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {loading ? <p>Loading…</p> : <Bar data={chartData} /> }
      {err ? <p style={{ color: "#b00" }}>Note: {err}</p> : null}

      <p className="muted" style={{ marginTop: 12 }}>
        Uses <code>AVG(booking.price)</code>. You can swap to <code>MEDIAN</code> via a view or window function if your MySQL version supports it,
        or add filters (date range, airline, country) later.
      </p>
    </div>
  );
}

const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" };
