import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import mysql.connector
import re

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "flughafendb_large"),
    "port": int(os.getenv("DB_PORT", "3306")),
}

PAGE_SIZE = int(os.getenv("PAGE_SIZE", "100"))
MAX_PAGE_SIZE = int(os.getenv("MAX_PAGE_SIZE", "1000"))
ALLOWED_SELECT_ONLY = True  # guard against DML/DDL
# Optional: allowlist of table names if you want extra safety checks
ALLOWED_TABLES = set(
    (os.getenv("ALLOWED_TABLES") or "flight,airport,airline,booking,passenger,weather,route,ticket")
    .replace(" ", "").split(",")
)

def get_conn():
    return mysql.connector.connect(**DB_CONFIG)

def run_query(sql, params=None, dict_rows=True):
    conn = get_conn()
    try:
        cur = conn.cursor(dictionary=dict_rows)
        cur.execute(sql, params or ())
        if sql.strip().lower().startswith("select"):
            rows = cur.fetchall()
        else:
            conn.commit()
            rows = {"affected": cur.rowcount}
        cur.close()
        return rows
    finally:
        conn.close()

def run_safe_select(sql: str, params: dict | tuple | None = None, page: int = 1, page_size: int = PAGE_SIZE):
    sql_stripped = sql.strip()
    if ALLOWED_SELECT_ONLY and not sql_stripped.lower().startswith("select"):
        raise ValueError("Only SELECT queries are allowed.")

    # Clamp page_size
    page_size = min(max(1, int(page_size)), MAX_PAGE_SIZE)
    offset = max(0, (int(page) - 1) * page_size)

    # Optional: light allowlist check (very naive, but helps prevent random table access)
    # You can comment this out if it gets in your way.
    low = f" {sql_stripped.lower()} "
    if ALLOWED_TABLES:
        found = False
        for t in ALLOWED_TABLES:
            if f" {t.lower()} " in low:
                found = True
                break
        # not strict because JOINs/aliases can break simple checks

    # Force server-side pagination unless user already has LIMIT
    # Wrap as subquery so we don't try to rewrite user's SQL
    if " limit " not in low:
        paged_sql = f"SELECT * FROM ({sql_stripped}) AS _sub LIMIT %s OFFSET %s"
        # params dict or tuple both work with mysql-connector-python
        if params is None:
            params = ()
        if isinstance(params, dict):
            # add positional at the end
            rows = run_query(paged_sql, (*params.values(), page_size, offset))
        else:
            rows = run_query(paged_sql, (*params, page_size, offset))
    else:
        rows = run_query(sql_stripped, params)

    return rows

HISTORY = []   # last N queries (metadata only)
BOOKMARKS = [] # [{name, sql, params}]

app = Flask(__name__)
CORS(app)  # allow localhost:3000 to talk to 5000

# ---------- Health / setup ----------
@app.route("/api/health")
def health():
    return jsonify({"ok": True})

@app.route("/api/test_db")
def test_db():
    rows = run_query("SHOW TABLES;", dict_rows=False)
    tables = [r[0] for r in rows]
    return jsonify({"tables": tables})

# ---------- Basic data ----------
@app.route("/api/airlines")
def airlines():
    rows = run_query("SELECT airline_id, airlinename FROM airline ORDER BY airlinename;")
    return jsonify(rows)

@app.route("/api/flights")
def flights():
    # quick browse list
    limit = int(request.args.get("limit", 25))
    sql = """
    SELECT f.flight_id, f.flightno, f.`from` AS from_airport_id, f.`to` AS to_airport_id,
           a1.name AS from_airport, a2.name AS to_airport,
           f.departure, f.arrival, al.airlinename
    FROM flight f
    JOIN airport a1 ON f.`from` = a1.airport_id
    JOIN airport a2 ON f.`to`   = a2.airport_id
    JOIN airline al ON f.airline_id = al.airline_id
    ORDER BY f.departure DESC
    LIMIT %s;
    """
    rows = run_query(sql, (limit,))
    return jsonify(rows)

# ---------- Search (parameterized) ----------
@app.route("/api/search")
def search():
    # /api/search?from=ORD&to=JFK&airline_id=1&limit=100
    params = []
    where = []

    from_code = request.args.get("from")
    to_code = request.args.get("to")
    airline_id = request.args.get("airline_id")
    date_from = request.args.get("date_from")   # 'YYYY-MM-DD'
    date_to = request.args.get("date_to")       # 'YYYY-MM-DD'
    limit = int(request.args.get("limit", 50))

    if from_code:
        where.append("a1.iata = %s")
        params.append(from_code)
    if to_code:
        where.append("a2.iata = %s")
        params.append(to_code)
    if airline_id:
        where.append("al.airline_id = %s")
        params.append(airline_id)
    if date_from:
        where.append("DATE(f.departure) >= %s")
        params.append(date_from)
    if date_to:
        where.append("DATE(f.departure) <= %s")
        params.append(date_to)

    sql = """
    SELECT f.flight_id, f.flightno, a1.iata AS from_iata, a2.iata AS to_iata,
           a1.name AS from_airport, a2.name AS to_airport,
           al.airlinename, f.departure, f.arrival
    FROM flight f
    JOIN airport a1 ON f.`from` = a1.airport_id
    JOIN airport a2 ON f.`to`   = a2.airport_id
    JOIN airline al ON f.airline_id = al.airline_id
    """
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY f.departure DESC LIMIT %s;"
    params.append(limit)

    rows = run_query(sql, tuple(params))
    return jsonify(rows)

# ---------- Visualization-friendly endpoint ----------
# Average booking price by airline
@app.route("/api/visuals/avg_price_by_airline")
def avg_price_by_airline():
    sql = """
    SELECT al.airlinename AS label, ROUND(AVG(b.price),2) AS value
    FROM booking b
    JOIN flight f ON b.flight_id = f.flight_id
    JOIN airline al ON f.airline_id = al.airline_id
    GROUP BY al.airlinename
    ORDER BY value DESC;
    """
    rows = run_query(sql)
    # return in a chart-friendly structure
    return jsonify({
        "labels": [r["label"] for r in rows],
        "values": [float(r["value"]) for r in rows],
        "raw": rows
    })

@app.post("/api/query")
def api_query():
    """
    Body: { "sql": "...", "params": { ... } | [ ... ], "page": 1, "page_size": 100 }
    Returns: { rows: [...], page, page_size, elapsed_ms }
    """
    import time
    data = request.get_json(force=True) or {}
    sql = data.get("sql") or ""
    params = data.get("params")
    page = int(data.get("page", 1))
    page_size = int(data.get("page_size", PAGE_SIZE))

    t0 = time.time()
    try:
        rows = run_safe_select(sql, params, page=page, page_size=page_size)
        elapsed = round((time.time() - t0) * 1000, 1)
        # record minimal history (avoid storing huge result sets)
        HISTORY.append({
            "sql": sql,
            "params": params if isinstance(params, dict) else None,
            "rows": len(rows),
            "ms": elapsed
        })
        # keep last 100
        if len(HISTORY) > 100:
            del HISTORY[:-100]
        return jsonify({"rows": rows, "page": page, "page_size": page_size, "elapsed_ms": elapsed})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.get("/api/history")
def api_history():
    # most recent first
    return jsonify(list(reversed(HISTORY)))

@app.get("/api/bookmarks")
def api_bookmarks_list():
    return jsonify(BOOKMARKS)

@app.post("/api/bookmarks")
def api_bookmarks_add():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    sql = (data.get("sql") or "").strip()
    params = data.get("params") or {}
    if not name or not sql:
        return jsonify({"error": "Missing name or sql"}), 400
    BOOKMARKS.append({"name": name, "sql": sql, "params": params})
    return jsonify({"ok": True})

@app.get("/api/schema")
def api_schema():
    # Replace with your real schema/index/view choices
    return jsonify({
        "tables": ["airport", "airline", "flight", "route", "passenger", "booking", "ticket", "weather"],
        "indexes": [
            "CREATE INDEX idx_flight_origin_dest_date ON flight(`from`, `to`, DATE(departure))",
            "CREATE INDEX idx_airport_iata ON airport(iata)",
            "CREATE INDEX idx_flight_airline ON flight(airline_id)"
        ],
        "views": [
            "CREATE VIEW v_flight_basic AS SELECT flight_id, flightno, `from`, `to`, departure, arrival, airline_id FROM flight",
            "CREATE VIEW v_airline_perf AS SELECT airline_id, AVG(TIMESTAMPDIFF(MINUTE, departure, arrival)) AS avg_minutes FROM flight GROUP BY airline_id"
        ],
        "notes": "Document here why these help typical exploration: origin/dest/date filters, airline performance, etc."
    })

@app.post("/api/nl2sql")
def api_nl2sql():
    data = request.get_json(force=True) or {}
    q = (data.get("query") or "").strip()

    # Example pattern: "show flights from ORD to JFK [today|tomorrow|this week]"
    m = re.match(r"show flights from (\w+) to (\w+)(?: (today|tomorrow|this week))?$", q, re.I)
    if m:
        origin, dest, when = m.groups()
        where_time = ""
        if when and when.lower() == "today":
            where_time = " AND DATE(f.departure) = CURDATE()"
        elif when and when.lower() == "tomorrow":
            where_time = " AND DATE(f.departure) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)"
        elif when and when.lower() == "this week":
            where_time = " AND YEARWEEK(f.departure, 1) = YEARWEEK(CURDATE(), 1)"

        sql = f"""
          SELECT f.flight_id, f.flightno, a1.iata AS from_iata, a2.iata AS to_iata,
                 a1.name AS from_airport, a2.name AS to_airport,
                 al.airlinename, f.departure, f.arrival
          FROM flight f
          JOIN airport a1 ON f.`from` = a1.airport_id
          JOIN airport a2 ON f.`to`   = a2.airport_id
          JOIN airline al ON f.airline_id = al.airline_id
          WHERE a1.iata = %(origin)s AND a2.iata = %(dest)s
          {where_time}
          ORDER BY f.departure DESC
          LIMIT 200
        """
        return jsonify({"sql": sql, "params": {"origin": origin.upper(), "dest": dest.upper()}})

    # Fallback: a safe default the user can edit
    return jsonify({"sql": "SELECT flight_id, flightno, departure, arrival FROM flight LIMIT 100", "params": {}})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=True)
