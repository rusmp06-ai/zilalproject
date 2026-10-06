from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import config

engine = create_engine(config().database_url, pool_pre_ping=True, pool_size=3, max_overflow=2)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def db_session():
    with SessionLocal() as db:
        yield db
