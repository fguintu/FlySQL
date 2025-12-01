-- ============================================================
-- MATERIALIZED OLAP TABLE FOR ROUTE FLIGHT DENSITY
-- ============================================================

-- 1. Drop existing summary table if it exists
DROP TABLE IF EXISTS summary_route_density;

-- 2. Create materialized route-density table with precomputed values
CREATE TABLE summary_route_density AS
SELECT 
    a1.airport_id AS from_airport,
    ag1.city AS from_city,
    ag1.country AS from_country,
    ag1.latitude AS from_lat,
    ag1.longitude AS from_lng,

    a2.airport_id AS to_airport,
    ag2.city AS to_city,
    ag2.country AS to_country,
    ag2.latitude AS to_lat,
    ag2.longitude AS to_lng,

    DATE(f.departure) AS flight_date,
    COUNT(*) AS flight_count
FROM flight f
JOIN airport a1 ON f.`from` = a1.airport_id
JOIN airport_geo ag1 ON a1.airport_id = ag1.airport_id
JOIN airport a2 ON f.`to` = a2.airport_id
JOIN airport_geo ag2 ON a2.airport_id = ag2.airport_id
GROUP BY
    a1.airport_id,
    ag1.city,
    ag1.country,
    ag1.latitude,
    ag1.longitude,

    a2.airport_id,
    ag2.city,
    ag2.country,
    ag2.latitude,
    ag2.longitude,

    DATE(f.departure);

-- 3. Add indexes to speed up date-range queries
CREATE INDEX idx_summary_route_date
    ON summary_route_density(flight_date);

-- 4. Add indexes to speed up route pairing queries
CREATE INDEX idx_summary_route_from_to
    ON summary_route_density(from_airport, to_airport);

-- 5. Add composite index for the most common OLAP pattern:
--    route density within a date range
CREATE INDEX idx_summary_route_from_to_date
    ON summary_route_density(from_airport, to_airport, flight_date);

-- ============================================================
-- END OF FILE
-- ============================================================
