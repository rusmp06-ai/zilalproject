import json
import os
import secrets
from pathlib import Path

import pytest
from sqlalchemy import text

# Never run truncation against an application database.
url = os.environ.get("TEST_DATABASE_URL", "")
if not url or not url.split("?")[0].endswith("/zilal_test"):
    raise RuntimeError("Set TEST_DATABASE_URL to a dedicated database named zilal_test")
os.environ["DATABASE_URL"] = url
os.environ["SITE_ORIGIN"] = "http://testserver"
os.environ["APP_ENV"] = "development"
from fastapi.testclient import TestClient

from app.auth import passwords
from app.content import SETTINGS_MAP, save_item
from app.database import SessionLocal, engine
from app.main import app
from app.models import Base, SiteSettings, User
from app.schemas import ItemInput

PASSWORD = secrets.token_urlsafe(24)
HASH = passwords.hash(PASSWORD)


@pytest.fixture(autouse=True)
def database():
    with engine.begin() as connection:
        connection.execute(
            text(
                "TRUNCATE "
                + ",".join('"' + name + '"' for name in Base.metadata.tables)
                + " RESTART IDENTITY CASCADE"
            )
        )
    seed = json.loads((Path(__file__).parents[1] / "initial-content.json").read_text())
    ids = {
        (entity, row["id"]): entity + "-" + row["id"]
        for entity, rows in seed["collections"].items()
        for row in rows
    }
    with SessionLocal() as db:
        for entity in ("destinations", "experiences", "tours", "journal", "gallery", "reviews"):
            for row in seed["collections"][entity]:
                item = {**row, "id": ids[(entity, row["id"])], "fields": dict(row["fields"])}
                for key, target in {
                    "destination": "destinations",
                    "experience": "experiences",
                    "tour": "tours",
                }.items():
                    if item["fields"].get(key):
                        item["fields"][key] = ids[(target, item["fields"][key])]
                save_item(db, entity, ItemInput.model_validate(item), None, create=True)
        db.add(SiteSettings(**{attr: seed["settings"][key] for key, attr in SETTINGS_MAP.items()}))
        for role in ("admin", "content_manager", "manager"):
            db.add(User(email=role + "@example.com", name=role, role=role, password_hash=HASH))
        db.commit()
    yield


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client


@pytest.fixture
def authorized(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": PASSWORD},
        headers={"Origin": "http://testserver"},
    )
    assert response.status_code == 200
    return client, {"Origin": "http://testserver", "X-CSRF-Token": response.json()["csrf"]}
