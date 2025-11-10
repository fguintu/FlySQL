import React, { useEffect, useState } from "react";
import { getSchema } from "../services/api";

export default function DbOptimizations() {
  const [meta, setMeta] = useState(null);
  useEffect(() => { getSchema().then(setMeta); }, []);
  if (!meta) return <p>Loading…</p>;

  return (
    <div>
      <h2>Optimized DB for Exploration</h2>
      <p>This documents the views & indexes we created to speed up common tasks.</p>

      <h3>Tables</h3>
      <ul>{meta.tables?.map(t => <li key={t}><code>{t}</code></li>)}</ul>

      <h3>Indexes</h3>
      <ul>{meta.indexes?.map((i, idx) => <li key={idx}><code>{i}</code></li>)}</ul>

      <h3>Views</h3>
      <ul>{meta.views?.map((v, idx) => <li key={idx}><code>{v}</code></li>)}</ul>

      {meta.notes ? <p style={{ color: "#555" }}>{meta.notes}</p> : null}
    </div>
  );
}
