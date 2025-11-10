import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = (
        os.getenv("DATABASE_URL")  # e.g., mysql+pymysql://readonly:pw@localhost:3306/flughafen
        or "mysql+pymysql://readonly:readonly@localhost:3306/flughafen"
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }
    MAX_ROWS = 5000
    PAGE_SIZE = 100
    ALLOWED_TABLES = {
        "flight", "airport", "airline", "booking", "passenger", "weather", "route", "ticket"
    }  # adjust to your Flughafen schema
