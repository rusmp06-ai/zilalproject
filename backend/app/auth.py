import hashlib
import secrets
from datetime import timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.config import config
from app.database import db_session
from app.models import LoginLimit, Session, User, now

passwords = PasswordHasher()
DUMMY = passwords.hash(secrets.token_urlsafe(32))


def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


def origin(request: Request):
    if request.headers.get("origin") != config().site_origin:
        raise HTTPException(403, "Недопустимый источник запроса")


def current_session(request: Request, db=Depends(db_session)):
    token = request.cookies.get("zilal_session", "")
    if not token or len(token) > 200:
        raise HTTPException(401, "Войдите в админку")
    session = db.get(Session, digest(token))
    if not session or session.expires_at <= now():
        raise HTTPException(401, "Сессия завершена. Войдите снова")
    user = db.get(User, session.user_id)
    if not user or not user.active:
        raise HTTPException(401, "Доступ отключён")
    return session, user


def editor(auth=Depends(current_session)):
    if auth[1].role not in {"super_admin", "admin", "content_manager"}:
        raise HTTPException(403, "Нет доступа к контенту")
    return auth


def writable(request: Request, auth=Depends(editor)):
    origin(request)
    if not secrets.compare_digest(request.headers.get("x-csrf-token", ""), auth[0].csrf):
        raise HTTPException(403, "Проверка запроса не пройдена. Обновите страницу")
    return auth


def login_limit(db, request):
    # Per API-client IP. No trust in arbitrary forwarded headers; shared proxy limits are conservative.
    key = digest(request.client.host if request.client else "unknown")
    db.execute(
        insert(LoginLimit)
        .values(key=key, count=0, until=now() + timedelta(minutes=15))
        .on_conflict_do_nothing()
    )
    row = db.scalar(select(LoginLimit).where(LoginLimit.key == key).with_for_update())
    if row.until <= now():
        row.count = 0
        row.until = now() + timedelta(minutes=15)
    if row.count >= 10:
        db.commit()
        raise HTTPException(429, "Слишком много попыток. Подождите 15 минут")
    row.count += 1
    db.commit()


def verify(user, password):
    try:
        return (
            passwords.verify(user.password_hash if user else DUMMY, password)
            and user is not None
            and user.active
        )
    except (VerificationError, InvalidHashError):
        return False
