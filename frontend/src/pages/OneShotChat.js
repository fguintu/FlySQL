import React, { useState } from "react";
import { toSQL, runQuery } from "../services/api";
import ResultsTable from "../components/ResultsTable";

export default function OneShotChat() {
  const [question, setQuestion] = useState("");
  const [sql, setSql] = useState("");
  const [rows, setRows] = useState([]);

  const translate = async () => {
    const res = await toSQL(question);
    setSql(res.sql || "");
  };

  const execute = async () => {
    if (!sql) return;
    const res = await runQuery(sql);
    setRows(res.rows);
  };

  return (
    <div>
      <h2>One-shot NL → SQL</h2>
      <div style={{ display: "grid", gap: 8 }}>
        <input
          placeholder='e.g., "show flights from ORD to JFK today"'
          value={question}
          onChange={e => setQuestion(e.target.value)}
          style={input}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={translate} style={button}>Translate</button>
          <button onClick={execute} style={button} disabled={!sql}>Run</button>
        </div>
        <textarea rows={4} value={sql} onChange={e => setSql(e.target.value)} style={textarea} />
      </div>
      <div style={{ marginTop: 12 }}>
        <ResultsTable rows={rows} />
      </div>
    </div>
  );
}

const input = { width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd" };
const textarea = { width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd", fontFamily: "monospace" };
const button = { padding: "8px 12px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff" };
