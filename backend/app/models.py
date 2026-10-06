from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def now():
    return datetime.now(UTC)


def uid():
    return str(uuid4())


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(100), primary_key=True, default=uid)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(30))
    active: Mapped[bool] = mapped_column(default=True)
    __table_args__ = (
        CheckConstraint("role IN ('super_admin','admin','content_manager','manager','operator')"),
    )


class Session(Base):
    __tablename__ = "sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    csrf: Mapped[str] = mapped_column(String(100))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class LoginLimit(Base):
    __tablename__ = "login_limits"
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    count: Mapped[int] = mapped_column(default=0)
    until: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Content(Base):
    __tablename__ = "content"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    entity: Mapped[str] = mapped_column(String(30), index=True)
    slug: Mapped[str] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(30), default="Черновик")
    image: Mapped[str] = mapped_column(String(300))
    version: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    translations: Mapped[list["Translation"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )
    __table_args__ = (
        UniqueConstraint("entity", "slug"),
        CheckConstraint(
            "entity IN ('tours','destinations','experiences','journal','gallery','reviews')"
        ),
        CheckConstraint("status IN ('Опубликован','Черновик')"),
        CheckConstraint("version > 0"),
    )


class Translation(Base):
    __tablename__ = "content_translations"
    content_id: Mapped[str] = mapped_column(
        ForeignKey("content.id", ondelete="CASCADE"), primary_key=True
    )
    locale: Mapped[str] = mapped_column(String(10), primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text, default="")
    label: Mapped[str] = mapped_column(String(300), default="")
    body: Mapped[str] = mapped_column(Text, default="")
    audience: Mapped[str] = mapped_column(Text, default="")
    pace: Mapped[str] = mapped_column(Text, default="")
    preparation: Mapped[str] = mapped_column(Text, default="")
    start_point: Mapped[str] = mapped_column(String(300), default="")
    price_note: Mapped[str] = mapped_column(Text, default="")
    stay: Mapped[str] = mapped_column(Text, default="")
    transport: Mapped[str] = mapped_column(Text, default="")
    season: Mapped[str] = mapped_column(String(300), default="")
    seo_title: Mapped[str] = mapped_column(String(300), default="")
    seo_description: Mapped[str] = mapped_column(String(300), default="")


class Tour(Base):
    __tablename__ = "tours"
    id: Mapped[str] = mapped_column(ForeignKey("content.id", ondelete="CASCADE"), primary_key=True)
    destination_id: Mapped[str | None] = mapped_column(
        ForeignKey("content.id", ondelete="RESTRICT")
    )
    experience_id: Mapped[str | None] = mapped_column(ForeignKey("content.id", ondelete="RESTRICT"))
    category: Mapped[str] = mapped_column(String(50))
    days: Mapped[int]
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3))
    max_group: Mapped[int]
    difficulty: Mapped[str] = mapped_column(String(30))
    __table_args__ = (
        CheckConstraint("days BETWEEN 1 AND 365"),
        CheckConstraint("max_group BETWEEN 1 AND 100"),
        CheckConstraint("amount >= 0"),
        CheckConstraint("currency IN ('USD','KGS','EUR')"),
    )


class TourLine(Base):
    __tablename__ = "tour_lines"
    id: Mapped[int] = mapped_column(primary_key=True)
    tour_id: Mapped[str] = mapped_column(ForeignKey("tours.id", ondelete="CASCADE"), index=True)
    locale: Mapped[str] = mapped_column(String(10))
    kind: Mapped[str] = mapped_column(String(20))
    position: Mapped[int]
    text: Mapped[str] = mapped_column(Text)
    __table_args__ = (
        UniqueConstraint("tour_id", "locale", "kind", "position"),
        CheckConstraint("kind IN ('itinerary','included','excluded','faq')"),
    )


class Article(Base):
    __tablename__ = "articles"
    id: Mapped[str] = mapped_column(ForeignKey("content.id", ondelete="CASCADE"), primary_key=True)
    reading_time: Mapped[str] = mapped_column(String(100), default="")


class Gallery(Base):
    __tablename__ = "gallery"
    id: Mapped[str] = mapped_column(ForeignKey("content.id", ondelete="CASCADE"), primary_key=True)
    alt: Mapped[str] = mapped_column(String(300))
    destination_id: Mapped[str | None] = mapped_column(
        ForeignKey("content.id", ondelete="RESTRICT")
    )


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[str] = mapped_column(ForeignKey("content.id", ondelete="CASCADE"), primary_key=True)
    author: Mapped[str] = mapped_column(String(300))
    quote: Mapped[str] = mapped_column(Text)
    tour_id: Mapped[str | None] = mapped_column(ForeignKey("tours.id", ondelete="RESTRICT"))
    demo: Mapped[bool] = mapped_column(default=True)


class SiteSettings(Base):
    __tablename__ = "site_settings"
    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    company: Mapped[str] = mapped_column(String(300))
    email: Mapped[str] = mapped_column(String(254), default="")
    phone: Mapped[str] = mapped_column(String(100), default="")
    address: Mapped[str] = mapped_column(String(300), default="")
    hero_title: Mapped[str] = mapped_column(String(300))
    hero_description: Mapped[str] = mapped_column(Text)
    hero_image: Mapped[str] = mapped_column(String(300))
    version: Mapped[int] = mapped_column(default=1)


class Audit(Base):
    __tablename__ = "audit"
    id: Mapped[str] = mapped_column(String(100), primary_key=True, default=uid)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    action: Mapped[str] = mapped_column(String(100))
    entity: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(300))
