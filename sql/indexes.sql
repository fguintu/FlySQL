CREATE INDEX idx_booking_flightid_price ON booking(flight_id, price);
CREATE INDEX idx_flight_from_to_airline_departure ON flight(`from`, `to`, airline_id, departure);
CREATE INDEX idx_airline_id_name ON airline(airline_id, airlinename);
CREATE INDEX idx_airport_airportid_iata_name ON airport(airport_id, iata, name);
