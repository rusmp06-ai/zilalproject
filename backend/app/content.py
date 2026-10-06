from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import delete, select

from app.models import (
    Article,
    Audit,
    Content,
    Gallery,
    Review,
    SiteSettings,
    Tour,
    TourLine,
    Translation,
)
from app.schemas import ALL_ENTITIES, ENTITIES, FIELD_MODELS, ItemInput, SettingsInput

TEXT_MAP = {
    "label": "label",
    "body": "body",
    "season": "season",
    "audience": "audience",
    "pace": "pace",
    "preparation": "preparation",
    "startPoint": "start_point",
    "priceNote": "price_note",
    "stay": "stay",
    "transport": "transport",
    "seoTitle": "seo_title",
    "seoDescription": "seo_description",
}
SETTINGS_MAP = {
    "company": "company",
    "email": "email",
    "phone": "phone",
    "address": "address",
    "heroTitle": "hero_title",
    "heroDescription": "hero_description",
    "heroImage": "hero_image",
}


def settings_out(row):
    return {
        **{key: getattr(row, attr) for key, attr in SETTINGS_MAP.items()},
        "version": row.version,
    }


def serialize(db, row, locale="ru"):
    text = next((t for t in row.translations if t.locale == locale), None)
    if not text:
        raise HTTPException(404, "Перевод не найден")
    allowed = FIELD_MODELS[row.entity].model_fields
    fields = {key: getattr(text, attr) for key, attr in TEXT_MAP.items() if key in allowed}
    if row.entity == "tours":
        tour = db.get(Tour, row.id)
        fields.update(
            destination=tour.destination_id or "",
            experience=tour.experience_id or "",
            category=tour.category,
            days=str(tour.days),
            amount=str(tour.amount),
            currency=tour.currency,
            maxGroup=str(tour.max_group),
            difficulty=tour.difficulty,
        )
        entries = db.scalars(
            select(TourLine)
            .where(TourLine.tour_id == row.id, TourLine.locale == locale)
            .order_by(TourLine.position)
        ).all()
        fields.update(
            {
                kind: "\n".join(e.text for e in entries if e.kind == kind)
                for kind in ("itinerary", "included", "excluded", "faq")
            }
        )
    elif row.entity == "journal":
        fields["readingTime"] = db.get(Article, row.id).reading_time
    elif row.entity == "gallery":
        gallery = db.get(Gallery, row.id)
        fields.update(alt=gallery.alt, destination=gallery.destination_id or "")
    elif row.entity == "reviews":
        review = db.get(Review, row.id)
        fields.update(
            author=review.author,
            quote=review.quote,
            tour=review.tour_id or "",
            demo="Да" if review.demo else "Нет",
        )
    return dict(
        id=row.id,
        slug=row.slug,
        title=text.title,
        description=text.description,
        image=row.image,
        status=row.status,
        version=row.version,
        fields=fields,
    )


def snapshot(db, admin=False):
    rows = db.scalars(select(Content).order_by(Content.created_at, Content.id)).all()
    collections = {key: [] for key in ALL_ENTITIES}
    for row in rows:
        if admin or row.status == "Опубликован":
            collections[row.entity].append(serialize(db, row))
    settings = db.get(SiteSettings, 1)
    if not settings:
        raise HTTPException(503, "Начальные данные не загружены")
    audit = db.scalars(select(Audit).order_by(Audit.date.desc()).limit(500)).all() if admin else []
    return dict(
        version=1,
        collections=collections,
        settings=settings_out(settings),
        activity=[
            dict(id=a.id, date=a.date.isoformat(), action=a.action, entity=a.entity, title=a.title)
            for a in audit
        ],
    )


def validate_fields(entity, item):
    try:
        return FIELD_MODELS[entity].model_validate(item.fields)
    except ValidationError as e:
        raise HTTPException(
            422,
            "Проверьте поля: "
            + "; ".join(".".join(str(x) for x in err["loc"]) for err in e.errors()),
        ) from e


def reference(db, value, entity, published):
    if not value:
        return None
    row = db.scalar(
        select(Content)
        .where(Content.id == value)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    if not row or row.entity != entity:
        raise HTTPException(422, "Связанная запись не найдена")
    if published and row.status != "Опубликован":
        raise HTTPException(422, "Опубликуйте связанную запись перед публикацией")
    return row.id


def save_item(db, entity, payload: ItemInput, user_id, create=False, locale="ru"):
    if entity not in ENTITIES:
        raise HTTPException(404, "Раздел не подключён")
    fields = validate_fields(entity, payload)
    row = db.scalar(select(Content).where(Content.id == payload.id).with_for_update())
    if create:
        if row:
            raise HTTPException(409, "Запись с таким ID уже существует")
        row = Content(
            id=payload.id,
            entity=entity,
            slug=payload.slug,
            image=payload.image,
            status=payload.status,
        )
        db.add(row)
    else:
        if not row or row.entity != entity:
            raise HTTPException(404, "Запись не найдена")
        if payload.version != row.version:
            raise HTTPException(
                409,
                "Запись изменена. Обновите страницу перед сохранением; ваши правки остаются в форме.",
            )
        if row.slug != payload.slug:
            raise HTTPException(422, "Адрес существующей страницы не меняется")
        if row.status == "Опубликован" and payload.status == "Черновик":
            links = []
            links.extend(
                db.scalars(
                    select(Tour.id).where(
                        (Tour.destination_id == row.id) | (Tour.experience_id == row.id)
                    )
                ).all()
            )
            links.extend(
                db.scalars(select(Gallery.id).where(Gallery.destination_id == row.id)).all()
            )
            links.extend(db.scalars(select(Review.id).where(Review.tour_id == row.id)).all())
            if links and db.scalar(
                select(Content.id)
                .where(Content.id.in_(links), Content.status == "Опубликован")
                .limit(1)
            ):
                raise HTTPException(409, "На запись ссылается опубликованный материал")
        row.version += 1
        row.image = payload.image
        row.status = payload.status
    f = fields.model_dump()
    published = payload.status == "Опубликован"
    destination = reference(db, f.get("destination"), "destinations", published)
    experience = reference(db, f.get("experience"), "experiences", published)
    tour_ref = reference(db, f.get("tour"), "tours", published)
    text = next((t for t in row.translations if t.locale == locale), None)
    if not text:
        text = Translation(locale=locale, title=payload.title, description=payload.description)
        row.translations.append(text)
    text.title, text.description = payload.title, payload.description
    for key, attr in TEXT_MAP.items():
        if key in f:
            setattr(text, attr, f[key])
    db.flush()
    if entity == "tours":
        tour = db.get(Tour, row.id) or Tour(id=row.id)
        for key, attr in {
            "category": "category",
            "days": "days",
            "amount": "amount",
            "currency": "currency",
            "maxGroup": "max_group",
            "difficulty": "difficulty",
        }.items():
            setattr(tour, attr, f[key])
        tour.destination_id, tour.experience_id = destination, experience
        db.add(tour)
        db.flush()
        db.execute(delete(TourLine).where(TourLine.tour_id == row.id, TourLine.locale == locale))
        for kind in ("itinerary", "included", "excluded", "faq"):
            for position, line in enumerate(f[kind].splitlines()):
                if line.strip():
                    db.add(
                        TourLine(
                            tour_id=row.id,
                            locale=locale,
                            kind=kind,
                            position=position,
                            text=line.strip(),
                        )
                    )
    elif entity == "journal":
        article = db.get(Article, row.id) or Article(id=row.id)
        article.reading_time = f["readingTime"]
        db.add(article)
    elif entity == "gallery":
        gallery = db.get(Gallery, row.id) or Gallery(id=row.id)
        gallery.alt, gallery.destination_id = f["alt"], destination
        db.add(gallery)
    elif entity == "reviews":
        review = db.get(Review, row.id) or Review(id=row.id)
        review.author, review.quote, review.tour_id, review.demo = (
            f["author"],
            f["quote"],
            tour_ref,
            f["demo"] == "Да",
        )
        db.add(review)
    db.add(
        Audit(
            user_id=user_id,
            action="Создание" if create else "Редактирование",
            entity=entity,
            title=payload.title,
        )
    )
    db.flush()
    return row


def update_settings(db, payload: SettingsInput, user_id):
    row = db.scalar(select(SiteSettings).where(SiteSettings.id == 1).with_for_update())
    if not row or row.version != payload.version:
        raise HTTPException(409, "Настройки изменены. Обновите страницу перед сохранением.")
    for key, attr in SETTINGS_MAP.items():
        setattr(row, attr, getattr(payload, key))
    row.version += 1
    db.add(
        Audit(user_id=user_id, action="Настройки обновлены", entity="settings", title=row.company)
    )
    return row
