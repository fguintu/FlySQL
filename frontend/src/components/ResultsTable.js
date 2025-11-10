import React from "react";

export default function ResultsTable({ rows }) {
  if (!rows || rows.length === 0) return <div style={{ color: "#777" }}>No rows.</div>;
  const cols = Object.keys(rows[0]);
  return (
    <div style={{ overflow: "auto", maxHeight: 420, border: "1px solid #eee", borderRadius: 8 }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>{cols.map(c => <th key={c} style={thtd}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map(c => <td key={c} style={thtd}>{String(r[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thtd = { borderBottom: "1px solid #f1f1f1", padding: "6px 8px", fontSize: ".95rem", textAlign: "left" };
