# 🛫 FlySQL — Interactive SQL Exploration & Optimized Flight Analytics
CS 554: Advanced Database Systems — Final Project

FlySQL is a full-stack web application designed to support efficient, interactive exploration of large relational databases. Built on the Flughafen (Airport) dataset, the project demonstrates how careful database design, indexing, and materialized summary tables enable real-time analytics and visualization over tens of millions of rows.

Rather than focusing on natural language translation, FlySQL emphasizes core database systems concepts: schema design, query optimization, OLAP-style aggregation, and scalable visualization pipelines.

---

## Key Features

### Flight Browser
Browse recent flight records directly from the flight table. Flights are loaded efficiently and sorted by departure time, giving users immediate exposure to the dataset structure.

### Search Interface
A parameterized search engine that allows users to filter flights by:
- origin airport
- destination airport
- airline
- date range

This feature demonstrates how indexed relational tables can power responsive, user-friendly search without requiring SQL knowledge.

### Iterative SQL Query Builder
A guided, step-by-step interface for constructing SQL queries interactively.

Users can:
1. Select a table (flight, booking, passenger, or employee)
2. Choose columns to project
3. Add filters and limits
4. Execute the query and view results live

This feature serves both educational and exploratory purposes by reinforcing SQL semantics through direct feedback.

### Price Visualizations (OLAP)
High-performance analytics for average booking prices:
- by airline
- by country

These visualizations are powered by materialized summary tables, eliminating expensive runtime aggregation over the 50M+ row booking table. Sorting controls (ascending / descending) are included for interpretability.

### Flight Density Map
A global geospatial visualization showing high-frequency flight routes.

Features include:
- date-range filtering
- minimum flight-count threshold
- arc-based route visualization

This module relies on a precomputed route-density table with denormalized geographic metadata, enabling interactive performance even at global scale.

### Database Optimizations (Documentation)
An in-app documentation tab explaining:
- indexing strategies
- materialized summary tables
- denormalization decisions
- OLAP query patterns

This section connects backend engineering decisions directly to frontend performance.

---

## Tech Stack

Frontend:
- React
- JavaScript
- Chart.js
- Leaflet

Backend:
- Flask (Python)
- REST API architecture

Database:
- MySQL
- Flughafen DB (large version)
- Indexed base tables
- Materialized summary tables for analytics

---

## Architecture Overview

FlySQL follows a modular, performance-oriented design:
- MySQL stores both normalized base tables and OLAP summary tables
- Flask exposes optimized query endpoints
- React provides interactive search, SQL building, and visualization
- Heavy analytical workloads are served from precomputed tables to avoid expensive runtime joins

This architecture enables real-time exploration over a dataset that would otherwise require 25–30 minute query runtimes on raw tables.

---

## Getting Started

1) Clone the repository

git clone https://github.com/fguintu/FlySQL.git

2) Database setup

Install and load the large Flughafen database into MySQL (e.g., flughafendb_large).

Run the optimization scripts:

USE flughafendb_large;
source indexes.sql
source FlightDensity.sql
source VisualExplorer.sql

3) Backend setup

cd backend
pip install -r requirements.txt
python app.py

4) Frontend setup

cd frontend
npm ci
npm start

Open the application:
- Frontend: http://localhost:3000
- Backend health check: http://localhost:5000/api/health

---

## Contributors

- Frederic Guintu
- Allison Ng
