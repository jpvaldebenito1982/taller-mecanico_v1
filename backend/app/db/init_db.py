from sqlalchemy import text

from app.db.base import Base
from app.db.session import engine

# Importing the models registers every table in Base.metadata.
import app.models  # noqa: F401, E402


def init_db() -> None:
    """Create the application schema and any tables that do not exist yet."""
    with engine.begin() as connection:
        connection.execute(text('CREATE SCHEMA IF NOT EXISTS "Taller_mecanico"'))

    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database schema is ready.")
