from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

IMAGES = {"/images/lake.svg", "/images/mountains.svg", "/images/steppe.svg", "/images/valley.svg"}
ENTITIES = ("tours", "destinations", "experiences", "journal", "gallery", "reviews")
ALL_ENTITIES = (*ENTITIES, "leads", "customers", "bookings", "partners", "payments", "employees")


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Login(Strict):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)
    model_config = ConfigDict(extra="forbid")  # Passwords must not be trimmed.


class TextFields(Strict):
    label: str = Field(default="", max_length=300)
    body: str = Field(default="", max_length=20000)
    seoTitle: str = Field(default="", max_length=300)
    seoDescription: str = Field(default="", max_length=300)


class DestinationFields(TextFields):
    season: str = Field(default="", max_length=300)


class ArticleFields(TextFields):
    readingTime: str = Field(default="", max_length=100)


class TourFields(TextFields):
    destination: str = Field(default="", max_length=100)
    experience: str = Field(default="", max_length=100)
    category: Literal["Однодневный", "Многодневный", "Индивидуальный", "Групповой"]
    days: int = Field(ge=1, le=365)
    amount: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    currency: Literal["USD", "KGS", "EUR"]
    maxGroup: int = Field(ge=1, le=100)
    difficulty: Literal["Лёгкий", "Умеренный", "Средний"]
    season: str = Field(min_length=1, max_length=300)
    audience: str = Field(default="", max_length=20000)
    pace: str = Field(default="", max_length=20000)
    preparation: str = Field(default="", max_length=20000)
    startPoint: str = Field(default="", max_length=300)
    priceNote: str = Field(default="", max_length=20000)
    stay: str = Field(default="", max_length=20000)
    transport: str = Field(default="", max_length=20000)
    itinerary: str = Field(default="", max_length=20000)
    included: str = Field(default="", max_length=20000)
    excluded: str = Field(default="", max_length=20000)
    faq: str = Field(default="", max_length=20000)


class GalleryFields(Strict):
    alt: str = Field(min_length=1, max_length=300)
    destination: str = Field(default="", max_length=100)


class ReviewFields(Strict):
    author: str = Field(min_length=1, max_length=300)
    quote: str = Field(default="", max_length=20000)
    tour: str = Field(default="", max_length=100)
    demo: Literal["Да", "Нет"] = "Да"


FIELD_MODELS = dict(
    zip(
        ENTITIES,
        [TourFields, DestinationFields, TextFields, ArticleFields, GalleryFields, ReviewFields],
        strict=True,
    )
)


class ItemInput(Strict):
    id: str = Field(pattern=r"^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$")
    slug: str = Field(max_length=150, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=3000)
    image: str
    status: Literal["Опубликован", "Черновик"] = "Черновик"
    fields: dict[str, str]
    version: int | None = Field(default=None, ge=1)

    @field_validator("id")
    @classmethod
    def reserved(cls, value):
        if value == "new":
            raise ValueError("Reserved id")
        return value

    @field_validator("image")
    @classmethod
    def image_allowed(cls, value):
        if value not in IMAGES:
            raise ValueError("Unknown image")
        return value


class SettingsInput(Strict):
    company: str = Field(min_length=1, max_length=300)
    email: str = Field(default="", max_length=254)
    phone: str = Field(default="", max_length=100)
    address: str = Field(default="", max_length=300)
    heroTitle: str = Field(min_length=1, max_length=300)
    heroDescription: str = Field(min_length=1, max_length=3000)
    heroImage: str
    version: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate(self):
        if self.heroImage not in IMAGES:
            raise ValueError("Unknown image")
        if self.email:
            from pydantic import TypeAdapter

            TypeAdapter(EmailStr).validate_python(self.email)
        return self
