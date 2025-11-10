import React, { useState } from "react";

export default function QueryEditor({ initialSQL, onRun }) {
  const [sql, setSql] = useState(initialSQL || "SELECT * FROM flight LIMIT 100");
  return (
    <div style={styles.card}>
      <textarea
        rows={6}
        spellCheck={false}
        value={sql}
        onChange={e => setSql(e.target.value)}
        style={styles.textarea}
      />
      <div style={styles.row}>
        <button onClick={() => onRun(sql)} style={styles.button}>Run</button>
      </div>
    </div>
  );
}

const styles = {
  card: { border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 12, background: "#fff" },
  textarea: { width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd", fontFamily: "monospace" },
  row: { display: "flex", gap: 8, alignItems: "center", marginTop: 8 },
  button: { padding: "8px 12px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff" }
};
