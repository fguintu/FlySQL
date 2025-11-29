CREATE INDEX idx_booking_flightid_price ON booking(flight_id, price);
CREATE INDEX idx_flight_airlineid ON flight(airline_id);
CREATE INDEX idx_flight_from_to_airline ON flight(`from`, `to`, airline_id);
CREATE INDEX idx_airline_id_name ON airline(airline_id, airlinename);
CREATE INDEX idx_airport_airportid_iata_name ON airport(airport_id, iata, name);
CREATE INDEX idx_airportgeo_airportid_country ON airport_geo(airport_id, country);
