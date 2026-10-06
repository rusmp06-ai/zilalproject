"use client";
import Link from "next/link";
import Image from "next/image";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { ui } from "@/data/content/platform";
import { money } from "@/lib/platform";
import { content as t } from "@/data/content";
import { Button, Landscape, SectionHeading } from "@/components/ui/Primitives";
import type { Entity } from "@/types/platform";

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}
export function Home() {
  const { data } = usePlatform();
  const published = (key: Entity) =>
    data.collections[key].filter((row) => row.status === "Опубликован");
  const tours = published("tours").slice(0, 3);
  const destinations = published("destinations").slice(0, 4);
  const experiences = published("experiences").slice(0, 3);
  const journal = published("journal").slice(0, 3);
  const gallery = published("gallery").slice(0, 4);
  const reviews = published("reviews").slice(0, 2);
  return (
    <div className="editorial-home">
      <section className="edition-hero" aria-labelledby="hero-title">
        <div className="edition-hero-copy">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1 id="hero-title">{data.settings.heroTitle}</h1>
          <p className="edition-deck">{data.settings.heroDescription}</p>
          <Button href="/tours">{t.hero.action}</Button>
          <p className="edition-issue">{t.editorial.issue}</p>
        </div>
        <figure className="edition-hero-art">
          <Image
            src={data.settings.heroImage}
            alt={t.hero.location}
            fill
            priority
            sizes="(min-width: 1024px) 56vw, 100vw"
          />
          <figcaption>{t.hero.placeholder}</figcaption>
        </figure>
      </section>
      <div className="container edition-opening">
        <span>{t.hero.bottom}</span>
        <a href="#about">
          {t.hero.secondary} <span aria-hidden="true">↓</span>
        </a>
      </div>

      <section
        id="about"
        className="container section edition-intro"
        data-reveal
      >
        <div className="edition-intro-copy">
          <SectionHeading eyebrow={t.intro.eyebrow} title={t.intro.title} />
          <p className="large-copy">{t.intro.description}</p>
          <p>{t.intro.detail}</p>
          <Link className="text-link" href="/about">
            {t.editorial.approach} <Arrow />
          </Link>
        </div>
        <figure className="edition-portrait">
          <Landscape src="/images/steppe.svg" alt="" />
          <figcaption>{t.editorial.introCaption}</figcaption>
        </figure>
      </section>

      <section
        id="experiences"
        className="container section edition-experiences"
        data-reveal
      >
        <SectionHeading {...t.experiences} />
        <div className="edition-moods">
          {experiences.map((item, index) => (
            <article key={item.id}>
              <Link
                href={`/experiences/${item.slug}`}
                className="edition-mood-image"
                tabIndex={-1}
                aria-hidden="true"
              >
                <Landscape src={item.image} alt="" />
                <span aria-hidden="true">0{index + 1}</span>
              </Link>
              <p className="eyebrow">{item.fields.label}</p>
              <h3>
                <Link href={`/experiences/${item.slug}`}>
                  {t.editorial.experienceMoods[
                    item.id as keyof typeof t.editorial.experienceMoods
                  ] || item.title}{" "}
                  <Arrow />
                </Link>
              </h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="tours" className="section edition-tours" data-reveal>
        <div className="container">
          <div className="edition-section-top">
            <SectionHeading {...t.tours} />
            <Link className="text-link" href="/tours">
              {t.editorial.allTours} <Arrow />
            </Link>
          </div>
          <div className="grid-three">
            {tours.map((item) => (
              <article key={item.id} className="edition-tour">
                <Link
                  href={`/tours/${item.slug}`}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <Landscape src={item.image} alt="" />
                </Link>
                <div className="edition-tour-copy">
                  <p className="eyebrow">{item.fields.label}</p>
                  <h3>
                    <Link href={`/tours/${item.slug}`}>{item.title}</Link>
                  </h3>
                  <p>{item.description}</p>
                  <div className="edition-tour-facts">
                    <span>
                      {item.fields.days} {ui.tour.daysShort}
                    </span>
                    <span>{item.fields.difficulty}</span>
                    <span>
                      {ui.tour.upTo} {item.fields.maxGroup}{" "}
                      {ui.tour.peopleShort}
                    </span>
                  </div>
                  <p className="edition-tour-season">{item.fields.season}</p>
                  <div className="edition-tour-price">
                    <div>
                      <small>{t.tours.priceLabel}</small>
                      <strong>
                        {money(item.fields.amount, item.fields.currency)}
                      </strong>
                      <small>{t.tours.perPerson}</small>
                    </div>
                    <Link
                      className="text-link"
                      href={`/tours/${item.slug}`}
                      aria-label={`${t.editorial.tourDetails}: ${item.title}`}
                    >
                      {ui.details} <Arrow />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="demo-note">{t.tours.note}</p>
        </div>
      </section>

      <section className="container section edition-trust" data-reveal>
        <figure className="edition-team-placeholder">
          <div aria-hidden="true">
            <span>△</span>
          </div>
          <figcaption>{t.editorial.teamCaption}</figcaption>
        </figure>
        <div>
          <SectionHeading {...t.why} />
          <div className="edition-values">
            {t.why.items.map((item, index) => (
              <div key={item.title}>
                <span aria-hidden="true">0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <Link className="text-link" href="/about">
            {t.editorial.approach} <Arrow />
          </Link>
        </div>
      </section>

      <section id="kyrgyzstan" className="edition-country" data-reveal>
        <figure>
          <Landscape src="/images/mountains.svg" alt="" />
          <figcaption>{t.country.caption}</figcaption>
        </figure>
        <div className="container edition-country-copy">
          <SectionHeading eyebrow={t.country.eyebrow} title={t.country.title} />
          <p>{t.country.description}</p>
          <p className="country-detail">{t.country.detail}</p>
          <Button href="/experiences" secondary>
            {t.country.action}
          </Button>
        </div>
      </section>

      <section
        id="destinations"
        className="container section edition-destinations"
        data-reveal
      >
        <div className="edition-section-top">
          <SectionHeading {...t.destinations} />
          <Link className="text-link" href="/destinations">
            {t.editorial.allDestinations} <Arrow />
          </Link>
        </div>
        <div className="edition-places">
          {destinations.map((item, index) => (
            <Link
              href={`/destinations/${item.slug}`}
              key={item.id}
              className="edition-place"
            >
              <span className="edition-place-number" aria-hidden="true">
                0{index + 1}
              </span>
              <Landscape src={item.image} alt="" />
              <div>
                <p className="eyebrow">{item.fields.label}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <span className="edition-place-arrow">
                <Arrow />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="journal"
        className="container section edition-journal"
        data-reveal
      >
        <div className="edition-section-top">
          <SectionHeading {...t.journal} />
          <Link className="text-link" href="/journal">
            {t.editorial.allStories} <Arrow />
          </Link>
        </div>
        <div className="edition-stories">
          {journal.map((item, index) => (
            <article
              key={item.id}
              className={
                index === 0 ? "edition-story-feature" : "edition-story-small"
              }
            >
              <Link
                href={`/journal/${item.slug}`}
                aria-hidden="true"
                tabIndex={-1}
              >
                <Landscape src={item.image} alt="" />
              </Link>
              <div>
                <p className="eyebrow">{item.fields.label}</p>
                <h3>
                  <Link href={`/journal/${item.slug}`}>{item.title}</Link>
                </h3>
                <p>{item.description}</p>
                <Link
                  className="text-link"
                  href={`/journal/${item.slug}`}
                  aria-label={`${t.editorial.readStory}: ${item.title}`}
                >
                  {t.editorial.readStory} <Arrow />
                </Link>
              </div>
            </article>
          ))}
          {journal.length < 3 && (
            <aside className="edition-journal-invitation">
              <p className="eyebrow">{t.editorial.journalInvitation}</p>
              <p>{t.editorial.journalText}</p>
              <Link className="text-link" href="/journal">
                {t.editorial.allStories} <Arrow />
              </Link>
            </aside>
          )}
        </div>
      </section>

      <section className="section edition-gallery" data-reveal>
        <div className="container">
          <div className="edition-section-top">
            <SectionHeading {...t.gallery} />
            <Link className="text-link" href="/gallery">
              {t.editorial.galleryLink} <Arrow />
            </Link>
          </div>
          <div className="edition-mosaic">
            {gallery.map((item) => (
              <figure key={item.id}>
                <Landscape src={item.image} alt="" />
                <figcaption>{item.title}</figcaption>
              </figure>
            ))}
          </div>
          <p className="demo-note">{t.gallery.caption}</p>
        </div>
      </section>

      <section className="container section edition-reviews" data-reveal>
        <SectionHeading {...t.reviews} />
        <p className="demo-note">{t.reviews.note}</p>
        <div className="grid-two reviews-grid">
          {reviews.map((item) => (
            <figure key={item.id}>
              <span className="quote-mark" aria-hidden="true">
                “
              </span>
              <blockquote>{item.fields.quote}</blockquote>
              <figcaption>
                <strong>{item.fields.author}</strong>
                <span>{item.description}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="plan" className="section edition-finale" data-reveal>
        <div className="container">
          <p className="eyebrow">{t.cta.eyebrow}</p>
          <h2>{t.cta.title}</h2>
          <p>{t.cta.description}</p>
          <Button href="/plan">{t.plan}</Button>
          <p className="demo-note">{t.cta.note}</p>
        </div>
        <span className="edition-finale-mark" aria-hidden="true">
          △
        </span>
      </section>
    </div>
  );
}
