/*
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Link, useSearchParams } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
*/

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Link, useSearchParams } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import IterativeSQL from "./pages/IterativeSQL";
import DbOptimizations from "./pages/DbOptimizations";
import OneShotChat from "./pages/OneShotChat";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios.get(url).then(r => { if (alive) setData(r.data); })
      .catch(e => alive && setErr(e.toString()))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [url]);
  return { data, loading, err };
}

function FlightsPage() {
  const { data, loading, err } = useFetch(`${API}/api/flights?limit=25`);
  if (loading) return <p>Loading…</p>;
  if (err) return <p>Error: {err}</p>;
  return (
    <div>
      <h2>Recent Flights</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Flight</th><th>From</th><th>To</th><th>Airline</th><th>Departure</th>
          </tr>
        </thead>
        <tbody>
          {data.map(r => (
            <tr key={r.flight_id}>
              <td>{r.flightno}</td>
              <td>{r.from_airport}</td>
              <td>{r.to_airport}</td>
              <td>{r.airlinename}</td>
              <td>{new Date(r.departure).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SearchPage() {
  const [params, setParams] = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const url = `${API}/api/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=100`;
  const { data, loading } = useFetch(url);

  const onSubmit = (e) => {
    e.preventDefault();
    const f = e.target.from.value.trim();
    const t = e.target.to.value.trim();
    setParams(p => {
      if (f) p.set("from", f); else p.delete("from");
      if (t) p.set("to", t); else p.delete("to");
      return p;
    });
  };

  return (
    <div>
      <h2>Search Flights</h2>
      <form onSubmit={onSubmit} style={{ marginBottom: 12 }}>
        <input name="from" placeholder="From IATA (e.g., ORD)" defaultValue={from} />
        <input name="to" placeholder="To IATA (e.g., JFK)" defaultValue={to} style={{ marginLeft: 8 }} />
        <button style={{ marginLeft: 8 }}>Search</button>
      </form>
      {loading ? <p>Loading…</p> :
        <ul>
          {data?.map(r => (
            <li key={r.flight_id}>
              {r.from_iata} → {r.to_iata} · {r.airlinename} · {new Date(r.departure).toLocaleString()}
            </li>
          ))}
        </ul>
      }
    </div>
  );
}

function VisualsPage() {
  const { data, loading, err } = useFetch(`${API}/api/visuals/avg_price_by_airline`);
  const chartData = useMemo(() => ({
    labels: data?.labels || [],
    datasets: [{ label: "Avg Booking Price", data: data?.values || [] }],
  }), [data]);

  if (loading) return <p>Loading chart…</p>;
  if (err) return <p>Error: {err}</p>;
  return (
    <div>
      <h2>Average Booking Price by Airline</h2>
      <Bar data={chartData} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 16 }}>
        <h1>AirportDB Interactive</h1>
        <nav style={{ marginBottom: 12 }}>
          <Link to="/">Flights</Link> ·{" "}
          <Link to="/search">Search</Link> ·{" "}
          <Link to="/visuals">Visuals</Link> ·{" "}
          <Link to="/iterative">Iterative SQL</Link> ·{" "}
          <Link to="/dbms">DB Optimizations</Link>
          <Link to="/chat">One-shot Chat</Link>
        </nav>
        <Routes>
          <Route path="/" element={<FlightsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/visuals" element={<VisualsPage />} />
          <Route path="/iterative" element={<IterativeSQL />} />
          <Route path="/dbms" element={<DbOptimizations />} />
          <Route path="/chat" element={<OneShotChat />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
