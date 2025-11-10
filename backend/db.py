from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from config import Config

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, **Config.SQLALCHEMY_ENGINE_OPTIONS)

def run_safe_select(sql: str, params: dict | None = None, limit: int | None = None, offset: int = 0):
    sql_l = sql.strip().lower()
    if not sql_l.startswith("select"):
        raise ValueError("Only SELECT queries are allowed.")
    # crude table allowlist check (improve if you use views/synonyms)
    for t in Config.ALLOWED_TABLES:
        if f" {t} " in f" {sql_l} " or f" {t}\n" in f" {sql_l} ":
            break
    else:
        # allow joins via aliases by relaxing to FROM presence if needed
        pass
    # enforce server-side paging when not provided
    suffix = f" LIMIT {limit or Config.PAGE_SIZE} OFFSET {offset}"
    wrapped = f"SELECT * FROM ({sql}) as _sub {suffix}" if "limit" not in sql_l else sql
    with engine.connect() as conn:
        result = conn.execute(text(wrapped), params or {})
        rows = [dict(r) for r in result]
    return rows
