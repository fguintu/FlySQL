### 🛫 AirportDB Interactive — Natural Language SQL Exploration & Visualization

**A full-stack web app built for CS554: Advanced Database Systems**
This project demonstrates how natural language interfaces and data visualization can simplify relational database exploration. Using the *Flughafen (Airport)* dataset, users can query and visualize flight, booking, and airline data through an intuitive web-based interface — without needing SQL expertise.

---

### 💡 Key Features

* 🗣️ **Natural Language to SQL Translator** – Convert plain English questions into executable SQL queries.
* 💬 **Chatbot Query Builder** – Step-by-step guided interface to build SQL queries interactively.
* 📊 **Automatic Data Visualization** – Dynamic charts and maps for flight prices, distances, and airline data.
* 🔍 **Search & Filter Engine** – Explore flights by origin, destination, airline, or date.
* 💾 **Query History & Bookmarks** – Save and revisit past searches easily.

---

### ⚙️ Tech Stack

* **Frontend:** React + Chart.js
* **Backend:** Flask (Python) + MySQL
* **Database:** Flughafen DB (relational dataset of flights, bookings, passengers, and airlines)
* **Version Control:** Git + GitHub

---

### 🧱 Architecture Overview

The app follows a modular design:

* **Backend (Flask):** Handles database access, API endpoints, and natural language–to–SQL translation.
* **Frontend (React):** Provides interactive UI for search, chat, and data visualization.
* **Database Management:** Utilizes SQL views and sub-database segmentation to optimize feature-specific data access.

---

### 👥 Contributors

* **Frederic Guintu**
* **Allison Ng**

---

### 🚀 Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/fguintu/FlySQL.git
   ```
2. Set up the backend and install dependencies:

   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```
3. Start the frontend:

   ```bash
   cd frontend
   npm start
   ```
4. Visit [http://localhost:3000](http://localhost:3000) to explore the app.