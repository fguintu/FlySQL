# 📈 Performance Improvements Summary

Our project includes several analytical features such as:

Average booking price by airline

Average booking price by passenger country / airport country

Global to/from flight density map with geolocation

These queries involve joining large tables (booking, flight, airport, airport_geo) and grouping over millions of rows. During development, we evaluated performance under three stages: no indexes, with indexes, and with precomputed OLAP materialization.

## ❌ 1. Raw Queries (No Indexes) — ~30 Minutes

Our earliest implementation executed the following queries directly on the base tables:

```AVG(price) grouped by airline

AVG(price) grouped by country

Route density: COUNT(*) grouped by from and to airports and filtered by date```

Without any indexes, MySQL performed full table scans on the largest tables (e.g., booking, flight). As a result:

Runtime: ~25–30 minutes per query
(completely unusable for a web application)

This made the interactive data exploration essentially impossible.

## ⚠️ 2. Indexed Queries — ~5 Minutes

Next, we added all appropriate indexes, including:

``booking(flight_id, price)

flight(from, to, airline_id, departure)

airport_geo(airport_id, country)

airline(airline_id, airlinename)```

These indexes significantly improved join and filter performance.

However, due to the size of the data and heavy GROUP BY operations:

Runtime: reduced from ~30 minutes → ~5 minutes
Still far too slow for real-time visualization.

This confirmed that indexes alone are not enough for OLAP-style analytical workloads when operating over large fact tables.

## 🚀 3. Precomputed OLAP Tables (Materialized Summary Tables) — <1s to ~5s

To achieve interactive performance, we created materialized summary tables:

```summary_price_airline

summary_price_country

summary_route_density (daily route-level flight counts)```

These tables are computed once using batch processing and indexed appropriately:

```summary_route_density(from_airport, to_airport, flight_date)

summary_price_airline(airline_id)

summary_price_country(country)```

After switching the frontend features to query the summary tables:

Runtime: Instantaneous (<100 ms) for price analytics
Runtime: 1–5 seconds for heavy flight-density map queries
(regardless of the size of the underlying fact tables)

This transformed the system from a batch-like analytical engine into a fast, responsive OLAP-style dashboard.

# ✅ Conclusion
Stage	Duration	Feasibility	Notes
No Indexes	25–30 min	❌ Unusable	Full table scans
Indexed	~5 min	⚠️ Too slow	Better, but still too heavy for web
Materialized Tables	<1–5 sec	✅ Production-ready	Correct approach for OLAP workloads

By combining:

- aggressive indexing,

- query optimization, and

- materialized precomputed OLAP tables,

we achieved the performance necessary for real-time visual analytics, such as:

- live flight density maps

- dynamic filters

- instantaneous price comparisons

- date-range exploration

This validates the importance of data warehousing practices even when using a relational DB like MySQL.