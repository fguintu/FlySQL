CREATE TABLE summary_price_airline AS
SELECT f.airline_id, ROUND(AVG(b.price), 2) AS avg_price
FROM booking b
JOIN flight f ON b.flight_id = f.flight_id
GROUP BY f.airline_id;

CREATE TABLE summary_price_country AS
SELECT ag.country, ROUND(AVG(b.price), 2) AS avg_price
FROM booking b
JOIN flight f      ON b.flight_id = f.flight_id
JOIN airport a1    ON f.`from` = a1.airport_id
JOIN airport_geo ag ON a1.airport_id = ag.airport_id
GROUP BY ag.country;
