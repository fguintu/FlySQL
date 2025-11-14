import React, { useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

export default function ChartAuto({ rows }) {
  const cfg = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const sample = rows[0];
    const keys = Object.keys(sample);
    const numeric = keys.filter(k => typeof sample[k] === "number");
    const temporal = keys.filter(k => /date|time/i.test(k));
    const xKey = temporal[0] || keys[0];
    const yKey = numeric[0] || (numeric[1] || null);
    if (!yKey) return null;
    const labels = rows.map(r => r[xKey]);
    const data = rows.map(r => r[yKey]);
    const chartType = temporal[0] ? "line" : "bar";
    return { chartType, labels, yKey, data };
  }, [rows]);

  if (!cfg) return <div style={{ color: "#777" }}>No obvious chartable columns.</div>;

  const data = { labels: cfg.labels, datasets: [{ label: cfg.yKey, data: cfg.data }] };
  return cfg.chartType === "line" ? <Line data={data} /> : <Bar data={data} />;
}
