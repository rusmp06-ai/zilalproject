import copy
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

from conftest import PASSWORD
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.database import SessionLocal
from app.main import app
from app.models import LoginLimit, Session, User, now

BASE = "/api/v1"


def snapshot(client, admin=False):
    response = client.get(BASE + ("/admin/platform" if admin else "/public/platform"))
    assert response.status_code == 200
    return response.json()


def new_tour(client):
    tour = copy.deepcopy(snapshot(client)["collections"]["tours"][0])
    tour.update(id="test-tour", slug="test-tour", title="Тестовый тур", status="Черновик")
    tour.pop("version")
    return tour


def test_health_and_public_projection(client):
    assert client.get("/health").json() == {"status": "ok"}
    data = snapshot(client)
    assert len(data["collections"]["tours"]) == 4
    assert (
        not data["activity"]
        and not data["collections"]["employees"]
        and not data["collections"]["leads"]
    )
    assert "password_hash" not in str(data)


def test_anonymous_admin_is_denied(client):
    assert client.get(BASE + "/admin/platform").status_code == 401
    assert client.post(BASE + "/admin/content/tours", json=new_tour(client)).status_code == 401


def test_login_origin_password_and_secure_cookie(client):
    credentials = {"email": "admin@example.com", "password": PASSWORD}
    assert client.post(BASE + "/auth/login", json=credentials).status_code == 403
    assert (
        client.post(
            BASE + "/auth/login",
            json={**credentials, "password": "wrong"},
            headers={"Origin": "http://testserver"},
        ).status_code
        == 401
    )
    result = client.post(
        BASE + "/auth/login", json=credentials, headers={"Origin": "http://testserver"}
    )
    assert result.status_code == 200
    cookie = result.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie
    with SessionLocal() as db:
        session = db.scalar(select(Session))
        assert session.token_hash != client.cookies.get("zilal_session")


def test_logout_revokes_session(authorized):
    client, headers = authorized
    assert client.post(BASE + "/auth/logout", headers=headers).status_code == 200
    assert client.get(BASE + "/auth/me").status_code == 401
    with SessionLocal() as db:
        assert db.scalar(select(Session)) is None


def test_expired_session_is_denied(authorized):
    client, _ = authorized
    with SessionLocal() as db:
        db.scalar(select(Session)).expires_at = now() - timedelta(seconds=1)
        db.commit()
    assert client.get(BASE + "/admin/platform").status_code == 401


def test_csrf_and_wrong_origin_are_denied(authorized):
    client, headers = authorized
    item = new_tour(client)
    assert (
        client.post(
            BASE + "/admin/content/tours", json=item, headers={"Origin": "http://testserver"}
        ).status_code
        == 403
    )
    assert (
        client.post(
            BASE + "/admin/content/tours",
            json=item,
            headers={**headers, "Origin": "https://evil.example"},
        ).status_code
        == 403
    )


def test_draft_publish_and_real_404(authorized):
    client, headers = authorized
    item = new_tour(client)
    created = client.post(BASE + "/admin/content/tours", json=item, headers=headers)
    assert created.status_code == 201
    assert client.get(BASE + "/public/tours/test-tour").status_code == 404
    assert len(snapshot(client, True)["collections"]["tours"]) == 5
    assert len(snapshot(client)["collections"]["tours"]) == 4
    updated = created.json()
    updated["status"] = "Опубликован"
    response = client.put(BASE + "/admin/content/tours/test-tour", json=updated, headers=headers)
    assert response.status_code == 200
    assert client.get(BASE + "/public/tours/test-tour").json()["title"] == "Тестовый тур"
    assert client.get(BASE + "/public/tours/unknown").status_code == 404


def test_stale_version_preserves_saved_change(authorized):
    client, headers = authorized
    old = snapshot(client, True)["collections"]["tours"][0]
    first = {**old, "title": "Первая версия"}
    assert (
        client.put(
            BASE + "/admin/content/tours/" + old["id"], json=first, headers=headers
        ).status_code
        == 200
    )
    assert (
        client.put(
            BASE + "/admin/content/tours/" + old["id"],
            json={**old, "title": "Затирающая версия"},
            headers=headers,
        ).status_code
        == 409
    )
    assert client.get(BASE + "/public/tours/" + old["slug"]).json()["title"] == "Первая версия"


def test_simultaneous_updates_have_one_winner(authorized):
    client, headers = authorized
    item = snapshot(client, True)["collections"]["tours"][0]
    token = client.cookies.get("zilal_session")

    def update(title):
        with TestClient(app) as other:
            other.cookies.set("zilal_session", token)
            return other.put(
                BASE + "/admin/content/tours/" + item["id"],
                json={**item, "title": title},
                headers=headers,
            ).status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(update, ["A", "B"]))
    assert sorted(results) == [200, 409]


def test_validation_rejects_fractional_people_money_and_bad_links(authorized):
    client, headers = authorized
    for key, value in [
        ("maxGroup", "2.5"),
        ("days", "0"),
        ("amount", "4.001"),
        ("destination", "unknown"),
        ("currency", "XXX"),
    ]:
        item = new_tour(client)
        item["fields"][key] = value
        assert (
            client.post(BASE + "/admin/content/tours", json=item, headers=headers).status_code
            == 422
        ), key
    assert len(snapshot(client)["collections"]["tours"]) == 4


def test_linked_deletion_and_unpublishing_are_blocked(authorized):
    client, headers = authorized
    destination = snapshot(client, True)["collections"]["destinations"][0]
    endpoint = BASE + "/admin/content/destinations/" + destination["id"]
    assert (
        client.delete(
            endpoint + "?version=" + str(destination["version"]), headers=headers
        ).status_code
        == 409
    )
    assert (
        client.put(
            endpoint, json={**destination, "status": "Черновик"}, headers=headers
        ).status_code
        == 409
    )
    assert client.get(BASE + "/public/destinations/" + destination["slug"]).status_code == 200


def test_safe_deletion_is_versioned_and_audited(authorized):
    client, headers = authorized
    item = client.post(BASE + "/admin/content/tours", json=new_tour(client), headers=headers).json()
    endpoint = BASE + "/admin/content/tours/" + item["id"]
    assert client.delete(endpoint + "?version=999", headers=headers).status_code == 409
    assert client.delete(endpoint + "?version=1", headers=headers).status_code == 200
    assert client.get(BASE + "/public/tours/test-tour").status_code == 404
    assert snapshot(client, True)["activity"][0]["action"] == "Удаление"


def test_content_manager_cannot_edit_settings(client):
    login = client.post(
        BASE + "/auth/login",
        json={"email": "content_manager@example.com", "password": PASSWORD},
        headers={"Origin": "http://testserver"},
    )
    assert login.status_code == 200
    data = snapshot(client, True)
    headers = {"Origin": "http://testserver", "X-CSRF-Token": login.json()["csrf"]}
    assert (
        client.put(BASE + "/admin/settings", json=data["settings"], headers=headers).status_code
        == 403
    )
    assert (
        client.post(
            BASE + "/admin/content/tours", json=new_tour(client), headers=headers
        ).status_code
        == 201
    )


def test_manager_role_and_disabled_user_denied(client):
    assert (
        client.post(
            BASE + "/auth/login",
            json={"email": "manager@example.com", "password": PASSWORD},
            headers={"Origin": "http://testserver"},
        ).status_code
        == 403
    )
    with SessionLocal() as db:
        db.scalar(select(User).where(User.email == "admin@example.com")).active = False
        db.commit()
    assert (
        client.post(
            BASE + "/auth/login",
            json={"email": "admin@example.com", "password": PASSWORD},
            headers={"Origin": "http://testserver"},
        ).status_code
        == 401
    )


def test_login_rate_limit_is_persistent(client):
    for _ in range(10):
        assert (
            client.post(
                BASE + "/auth/login",
                json={"email": "missing@example.com", "password": "wrong"},
                headers={"Origin": "http://testserver"},
            ).status_code
            == 401
        )
    assert (
        client.post(
            BASE + "/auth/login",
            json={"email": "admin@example.com", "password": PASSWORD},
            headers={"Origin": "http://testserver"},
        ).status_code
        == 429
    )
    with SessionLocal() as db:
        assert db.scalar(select(LoginLimit)).count == 10


def test_settings_versions_are_checked(authorized):
    client, headers = authorized
    old = snapshot(client, True)["settings"]
    updated = {**old, "heroTitle": "Новая главная"}
    assert client.put(BASE + "/admin/settings", json=updated, headers=headers).status_code == 200
    assert client.put(BASE + "/admin/settings", json=old, headers=headers).status_code == 409
    assert snapshot(client)["settings"]["heroTitle"] == "Новая главная"


def test_request_size_is_limited(authorized):
    client, headers = authorized
    assert (
        client.post(
            BASE + "/admin/content/tours", content="x" * 262145, headers=headers
        ).status_code
        == 413
    )


def test_all_public_content_editors_are_persisted(authorized):
    client, headers = authorized
    data = snapshot(client, True)
    for entity in ("tours", "destinations", "experiences", "journal", "gallery", "reviews"):
        item = copy.deepcopy(data["collections"][entity][0])
        item.update(
            id="new-" + entity, slug="new-" + entity, title="Новый " + entity, status="Черновик"
        )
        item.pop("version")
        response = client.post(BASE + "/admin/content/" + entity, json=item, headers=headers)
        assert response.status_code == 201, entity
        saved = response.json()
        assert saved["fields"] == snapshot(client, True)["collections"][entity][-1]["fields"]
        saved["title"] = "Изменённый " + entity
        assert (
            client.put(
                BASE + "/admin/content/" + entity + "/" + saved["id"], json=saved, headers=headers
            ).status_code
            == 200
        )
        assert any(
            row["title"] == "Изменённый " + entity
            for row in snapshot(client, True)["collections"][entity]
        )


def test_disabled_account_invalidates_existing_session(authorized):
    client, _ = authorized
    with SessionLocal() as db:
        db.scalar(select(User).where(User.email == "admin@example.com")).active = False
        db.commit()
    assert client.get(BASE + "/auth/me").status_code == 401


def test_published_review_prevents_tour_unpublishing(authorized):
    client, headers = authorized
    item = next(
        row for row in snapshot(client, True)["collections"]["tours"] if row["slug"] == "issyk-kul"
    )
    item["status"] = "Черновик"
    assert (
        client.put(
            BASE + "/admin/content/tours/" + item["id"], json=item, headers=headers
        ).status_code
        == 409
    )
