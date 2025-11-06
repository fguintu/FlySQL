import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "flughafendb_large"),
    "port": int(os.getenv("DB_PORT", "3306")),
}

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

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=True)
