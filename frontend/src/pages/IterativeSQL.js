import React, { useMemo, useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const TABLE_DEFS = {
  booking: {
    label: "booking",
    description: "Tickets purchased for a specific flight",
    columns: ["booking_id", "flight_id", "seat", "passenger_id", "price"],
  },
  employee: {
    label: "employee",
    description: "Airport staff records",
    columns: ["employee_id", "firstname", "lastname", "department", "emailaddress"],
  },
  passenger: {
    label: "passenger",
    description: "Passengers and personal details",
    columns: ["passenger_id", "firstname", "lastname", "birthdate", "sex"],
  },
  flight: {
    label: "flight",
    description: "Scheduled flight instances",
    columns: ["flight_id", "flightno", "from", "to", "departure", "arrival", "airline_id"],
  },
};

const OPERATORS = ["=", "<", ">", "<=", ">=", "LIKE"];

function ResultsView({ rows, loading, error }) {
  if (loading) return <div style={{ padding: 8 }}>Running query…</div>;
  if (error)
    return (
      <div style={{ padding: 8, color: "#b00020" }}>
        <strong>Error:</strong> {error}
      </div>
    );

  if (!rows || rows.length === 0)
    return (
      <div style={{ padding: 8 }}>
        No results yet. Build a query on the left and click <strong>Run Query</strong>.
      </div>
    );

  const columns = Object.keys(rows[0] || {});

  return (
    <div style={{ padding: 8, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{ borderBottom: "1px solid #ddd", padding: 6 }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c} style={{ borderBottom: "1px solid #eee", padding: 6 }}>
                  {String(row[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function IterativeSQL() {
  const [step, setStep] = useState(1);
  const [table, setTable] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState([{ column: "", op: "=", value: "" }]);
  const [limit, setLimit] = useState(10);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentTableDef = table ? TABLE_DEFS[table] : null;

  // ------------------------------------------------------------
  // SQL PREVIEW (semicolon removed, limit ends with space)
  // ------------------------------------------------------------
  const sqlPreview = useMemo(() => {
    if (!table) return "-- Start by picking a table above.";

  const cols = selectedColumns.length
    ? selectedColumns.map(c => `\`${c}\``).join(", ")
    : "*";

    let sql = `SELECT ${cols}\nFROM ${table}`;

    const active = filters.filter((f) => f.column && f.value !== "");
    if (active.length) {
      sql +=
        "\nWHERE " +
        active
          .map((f) => {
            const numeric = !isNaN(Number(f.value));
            const val = numeric && f.op !== "LIKE" ? f.value : `'${f.value}'`;
            return `${f.column} ${f.op} ${val}`;
          })
          .join(" AND ");
    }

    // IMPORTANT:
    // - NO semicolon
    // - Add trailing space to trigger backend's " limit " detection
    sql += `\nLIMIT ${limit} `;

    return sql;
  }, [table, selectedColumns, filters, limit]);

  // Remove semicolons & normalize LIMIT for backend
  const prepareSQLForBackend = (sql) => {
    let s = sql.trim().replace(/;$/, "");
    s = s.replace(/LIMIT\s+(\d+)$/i, "LIMIT $1 "); // ensure trailing space
    return s;
  };

  const handlePickTable = (tblKey) => {
    setTable(tblKey);
    setStep(2);
    setSelectedColumns(TABLE_DEFS[tblKey].columns.slice(0, 3));
    setFilters([{ column: "", op: "=", value: "" }]);
  };

  const toggleColumn = (col) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((x) => x !== col) : [...prev, col]
    );
  };

  const handleFilterChange = (index, key, value) => {
    const next = [...filters];
    next[index][key] = value;
    setFilters(next);
    setStep(3);
  };

  const addFilterRow = () => {
    setFilters((prev) => [...prev, { column: "", op: "=", value: "" }]);
  };

  // ------------------------------------------------------------
  // RUN QUERY (with cleaned SQL)
  // ------------------------------------------------------------
  const runQuery = async () => {
    if (!table) return;

    const cleanedSQL = prepareSQLForBackend(sqlPreview);

    setLoading(true);
    setError("");

    try {
      const resp = await axios.post(`${API}/api/query`, {
        sql: cleanedSQL,
        params: {},
        page: 1,
        page_size: limit,
      });

      setRows(resp.data.rows || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2.2fr 1.3fr",
        gap: 16,
        minHeight: "80vh",
      }}
    >
      {/* LEFT SIDE */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <section
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e0e0e0",
            background: "#fafafa",
          }}
        >
          <h2 style={{ margin: 0 }}>Iterative SQL Playground</h2>
          <p>Step 1: Choose a table</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {Object.entries(TABLE_DEFS).map(([key, def]) => (
              <button
                key={key}
                onClick={() => handlePickTable(key)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: table === key ? "2px solid #1976d2" : "1px solid #ccc",
                  background: table === key ? "#e3f2fd" : "white",
                  textAlign: "left",
                }}
              >
                <strong>{def.label}</strong>
                <p style={{ fontSize: 12 }}>{def.description}</p>
                <code style={{ fontSize: 11 }}>{def.columns.join(", ")}</code>
              </button>
            ))}
          </div>
        </section>

        {/* Query Builder */}
        <section
          style={{
            flex: 1,
            borderRadius: 12,
            border: "1px solid #e0e0e0",
            background: "white",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 10,
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>SQL Builder</h3>
              <small>Step {step} of 3</small>
            </div>

            <button
              onClick={runQuery}
              disabled={!table}
              style={{
                background: table ? "#1976d2" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: 20,
                padding: "6px 12px",
              }}
            >
              Run Query
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr" }}>
            <div style={{ padding: 10 }}>
              {!table ? (
                <p>Pick a table to continue.</p>
              ) : (
                <>
                  <h4>Step 2 – Columns</h4>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {currentTableDef.columns.map((col) => (
                      <label
                        key={col}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 12,
                          cursor: "pointer",
                          fontSize: 12,
                          border: selectedColumns.includes(col)
                            ? "1px solid #1976d2"
                            : "1px solid #ccc",
                          background: selectedColumns.includes(col)
                            ? "#e3f2fd"
                            : "#fafafa",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(col)}
                          onChange={() => toggleColumn(col)}
                          style={{ marginRight: 4 }}
                        />
                        {col}
                      </label>
                    ))}
                  </div>

                  <h4 style={{ marginTop: 16 }}>Step 3 – Filters (optional)</h4>

                  {filters.map((f, idx) => (
                    <div
                      key={idx}
                      style={{ display: "flex", gap: 4, marginBottom: 4 }}
                    >
                      <select
                        value={f.column}
                        onChange={(e) =>
                          handleFilterChange(idx, "column", e.target.value)
                        }
                        style={{ flex: 1 }}
                      >
                        <option value="">Column</option>
                        {currentTableDef.columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>

                      <select
                        value={f.op}
                        onChange={(e) =>
                          handleFilterChange(idx, "op", e.target.value)
                        }
                        style={{ width: 70 }}
                      >
                        {OPERATORS.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={f.value}
                        placeholder="value"
                        onChange={(e) =>
                          handleFilterChange(idx, "value", e.target.value)
                        }
                        style={{ flex: 1.2 }}
                      />
                    </div>
                  ))}

                  <button
                    onClick={addFilterRow}
                    style={{
                      border: "1px dashed #aaa",
                      padding: "4px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  >
                    + Add condition
                  </button>

                  <div style={{ marginTop: 10, fontSize: 12 }}>
                    Limit:
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={limit}
                      onChange={(e) =>
                        setLimit(parseInt(e.target.value || "10"))
                      }
                      style={{ width: 60, marginLeft: 6 }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* SQL preview */}
            <div style={{ padding: 10 }}>
              <h4>Your SQL</h4>
              <pre
                style={{
                  background: "#111827",
                  color: "#e5e7eb",
                  padding: 10,
                  borderRadius: 8,
                  whiteSpace: "pre-wrap",
                  fontSize: 12,
                }}
              >
{sqlPreview}
              </pre>
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT: RESULTS */}
      <section
        style={{
          borderRadius: 12,
          border: "1px solid #e0e0e0",
          background: "white",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 10, borderBottom: "1px solid #eee" }}>
          <h3 style={{ margin: 0 }}>Query Results</h3>
        </div>

        <div style={{ height: "calc(100% - 50px)", overflow: "auto" }}>
          <ResultsView rows={rows} loading={loading} error={error} />
        </div>
      </section>
    </div>
  );
}
