import argparse
import getpass
import json
from pathlib import Path

from sqlalchemy import select

from app.auth import passwords
from app.content import SETTINGS_MAP, save_item
from app.database import SessionLocal
from app.models import Content, SiteSettings, User
from app.schemas import ENTITIES, ItemInput, SettingsInput


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    admin = sub.add_parser("create-user")
    admin.add_argument("--email", required=True)
    admin.add_argument("--name", default="Администратор")
    admin.add_argument(
        "--role",
        choices=["super_admin", "admin", "content_manager", "manager", "operator"],
        default="super_admin",
    )
    seed = sub.add_parser("import-content")
    seed.add_argument("file")
    seed.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    with SessionLocal() as db:
        if args.command == "create-user":
            from pydantic import EmailStr, TypeAdapter

            email = str(TypeAdapter(EmailStr).validate_python(args.email)).lower()
            if db.scalar(select(User).where(User.email == email)):
                parser.error("Этот пользователь уже существует")
            password = getpass.getpass("Пароль (минимум 12 символов): ")
            if len(password) < 12 or len(password) > 200:
                parser.error("Пароль должен содержать от 12 до 200 символов")
            if password != getpass.getpass("Повторите пароль: "):
                parser.error("Пароли не совпадают")
            db.add(
                User(
                    email=email,
                    name=args.name,
                    role=args.role,
                    password_hash=passwords.hash(password),
                )
            )
            db.commit()
            print("Пользователь создан. Пароль не выводится и не сохраняется в файлах.")
        else:
            path = Path(args.file)
            if path.stat().st_size > 5_000_000:
                parser.error("Файл слишком большой")
            value = json.loads(path.read_text(encoding="utf-8"))
            if value.get("version") != 1:
                parser.error("Неизвестная версия файла")
            settings = SettingsInput.model_validate(value["settings"])
            ids = {
                (entity, row["id"]): row["id"]
                if row["id"].startswith(entity + "-")
                else entity + "-" + row["id"]
                for entity in ENTITIES
                for row in value["collections"].get(entity, [])
            }
            count = 0
            conflicts = []
            # Explicit order preserves typed foreign keys. Existing records are never overwritten.
            for entity in ("destinations", "experiences", "tours", "journal", "gallery", "reviews"):
                for raw in value["collections"].get(entity, []):
                    raw = {**raw, "id": ids[(entity, raw["id"])], "fields": dict(raw["fields"])}
                    references = {
                        "destination": "destinations",
                        "experience": "experiences",
                        "tour": "tours",
                    }
                    for key, target in references.items():
                        if raw["fields"].get(key):
                            original = raw["fields"][key]
                            if (target, original) not in ids:
                                parser.error(f"Связь не найдена: {entity}/{key}")
                            raw["fields"][key] = ids[(target, original)]
                    raw.pop("version", None)
                    payload = ItemInput.model_validate(raw)
                    if db.get(Content, payload.id) or db.scalar(
                        select(Content).where(
                            Content.entity == entity, Content.slug == payload.slug
                        )
                    ):
                        conflicts.append(f"{entity}/{payload.slug}")
                        continue
                    save_item(db, entity, payload, None, create=True)
                    count += 1
            if not db.get(SiteSettings, 1):
                db.add(
                    SiteSettings(
                        **{attr: getattr(settings, key) for key, attr in SETTINGS_MAP.items()}
                    )
                )
            print(f"Новые записи: {count}. Уже существующие (пропущены): {len(conflicts)}.")
            for entry in conflicts:
                print(entry)
            if args.apply:
                db.commit()
                print("Применено. CRM-примеры и сотрудники не импортируются.")
            else:
                db.rollback()
                print("Предварительная проверка. Для применения добавьте --apply.")


if __name__ == "__main__":
    main()
