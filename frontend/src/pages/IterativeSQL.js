import React, { useEffect, useState } from "react";
import QueryEditor from "../components/QueryEditor";
import ResultsTable from "../components/ResultsTable";
import { runQuery, getHistory, addBookmark, listBookmarks } from "../services/api";

export default function IterativeSQL() {
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    getHistory().then(setHistory);
    listBookmarks().then(setBookmarks);
  }, []);

  const handleRun = async (sql) => {
    const res = await runQuery(sql, {}, 1);
    setRows(res.rows);
    getHistory().then(setHistory);
  };

  const handleAddBookmark = async () => {
    const name = prompt("Bookmark name?");
    if (!name) return;
    const sql = prompt("SQL to save?");
    if (!sql) return;
    await addBookmark(name, sql, {});
    listBookmarks().then(setBookmarks);
  };

  return (
    <div>
      <h2>Iterative SQL Querier</h2>
      <QueryEditor onRun={handleRun} />
      <ResultsTable rows={rows} />
      <div style={grid2}>
        <div style={card}>
          <h3>History</h3>
          <ul style={{ marginTop: 8 }}>
            {history.map((h, i) => (
              <li key={i}><code>{(h.sql || "").slice(0, 120)}</code> <small>· {h.rows} rows · {h.ms} ms</small></li>
            ))}
          </ul>
        </div>
        <div style={card}>
          <h3>Bookmarks</h3>
          <ul style={{ marginTop: 8 }}>
            {bookmarks.map((b, i) => (<li key={i}><code>{b.name}</code></li>))}
          </ul>
          <button onClick={handleAddBookmark} style={button}>+ Add Bookmark</button>
        </div>
      </div>
    </div>
  );
}

const card = { border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" };
const grid2 = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 12 };
const button = { padding: "8px 12px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", marginTop: 8 };
