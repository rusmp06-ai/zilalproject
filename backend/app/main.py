import secrets
from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from app.auth import current_session, digest, editor, login_limit, origin, verify, writable
from app.config import config
from app.content import save_item, serialize, settings_out, snapshot, update_settings
from app.database import db_session
from app.models import Audit, Content, Session, User, now
from app.schemas import ENTITIES, ItemInput, Login, SettingsInput

if config().app_env == "production" and not config().site_origin.startswith("https://"):
    raise RuntimeError("Production requires HTTPS SITE_ORIGIN")
app = FastAPI(
    title="ZILAL TRAVEL API",
    version="0.1.0",
    docs_url=None if config().app_env == "production" else "/docs",
    redoc_url=None,
)


@app.middleware("http")
async def bounds(request, call_next):
    try:
        length = int(request.headers.get("content-length", "0"))
    except ValueError:
        return JSONResponse({"detail": "Некорректный размер запроса"}, status_code=400)
    if length > 262144:
        return JSONResponse({"detail": "Запрос слишком большой"}, status_code=413)
    if request.method in {"POST", "PUT", "PATCH"}:
        body = bytearray()
        async for chunk in request.stream():
            body.extend(chunk)
            if len(body) > 262144:
                return JSONResponse({"detail": "Запрос слишком большой"}, status_code=413)
        request._body = bytes(body)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.exception_handler(IntegrityError)
async def integrity_handler(request, exc):
    return JSONResponse(
        {"detail": "Адрес уже занят или запись связана с другими данными"}, status_code=409
    )


@app.get("/health")
def health(db=Depends(db_session)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.post("/api/v1/auth/login")
def login(payload: Login, request: Request, response: Response, db=Depends(db_session)):
    origin(request)
    login_limit(db, request)
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not verify(user, payload.password):
        raise HTTPException(401, "Неверный email или пароль")
    if user.role not in {"super_admin", "admin", "content_manager"}:
        raise HTTPException(403, "Этот рабочий раздел ещё не подключён для вашей роли")
    token, csrf = secrets.token_urlsafe(48), secrets.token_urlsafe(32)
    db.add(
        Session(
            token_hash=digest(token),
            user_id=user.id,
            csrf=csrf,
            expires_at=now() + timedelta(hours=config().session_hours),
        )
    )
    db.commit()
    response.set_cookie(
        "zilal_session",
        token,
        httponly=True,
        secure=config().app_env == "production",
        samesite="lax",
        max_age=config().session_hours * 3600,
        path="/",
    )
    return {"user": {"id": user.id, "name": user.name, "role": user.role}, "csrf": csrf}


@app.get("/api/v1/auth/me")
def me(auth=Depends(current_session)):
    session, user = auth
    return {"user": {"id": user.id, "name": user.name, "role": user.role}, "csrf": session.csrf}


@app.post("/api/v1/auth/logout")
def logout(response: Response, auth=Depends(writable), db=Depends(db_session)):
    db.delete(auth[0])
    db.commit()
    response.delete_cookie("zilal_session", path="/")
    return {"ok": True}


@app.get("/api/v1/public/platform")
def public_platform(db=Depends(db_session)):
    return snapshot(db)


@app.get("/api/v1/admin/platform")
def admin_platform(auth=Depends(editor), db=Depends(db_session)):
    return snapshot(db, admin=True)


@app.get("/api/v1/public/{entity}")
def public_list(entity: str, db=Depends(db_session)):
    if entity not in ENTITIES:
        raise HTTPException(404)
    return snapshot(db)["collections"][entity]


@app.get("/api/v1/public/{entity}/{slug}")
def public_detail(entity: str, slug: str, db=Depends(db_session)):
    row = db.scalar(
        select(Content).where(
            Content.entity == entity, Content.slug == slug, Content.status == "Опубликован"
        )
    )
    if not row or entity not in ENTITIES:
        raise HTTPException(404, "Материал не найден")
    return serialize(db, row)


@app.post("/api/v1/admin/content/{entity}", status_code=201)
def create(entity: str, payload: ItemInput, auth=Depends(writable), db=Depends(db_session)):
    row = save_item(db, entity, payload, auth[1].id, create=True)
    db.commit()
    return serialize(db, row)


@app.put("/api/v1/admin/content/{entity}/{id}")
def edit(entity: str, id: str, payload: ItemInput, auth=Depends(writable), db=Depends(db_session)):
    if id != payload.id:
        raise HTTPException(422, "ID не совпадает")
    row = save_item(db, entity, payload, auth[1].id)
    db.commit()
    return serialize(db, row)


@app.delete("/api/v1/admin/content/{entity}/{id}")
def remove(
    entity: str, id: str, version: int = Query(ge=1), auth=Depends(writable), db=Depends(db_session)
):
    row = db.scalar(
        select(Content).where(Content.id == id, Content.entity == entity).with_for_update()
    )
    if not row or entity not in ENTITIES:
        raise HTTPException(404)
    if row.version != version:
        raise HTTPException(409, "Запись изменена. Обновите страницу")
    title = serialize(db, row)["title"]
    db.delete(row)
    db.add(Audit(user_id=auth[1].id, action="Удаление", entity=entity, title=title))
    db.commit()
    return {"ok": True}


@app.put("/api/v1/admin/settings")
def settings(payload: SettingsInput, auth=Depends(writable), db=Depends(db_session)):
    if auth[1].role not in {"super_admin", "admin"}:
        raise HTTPException(403, "Настройки доступны администратору")
    row = update_settings(db, payload, auth[1].id)
    db.commit()
    return settings_out(row)
