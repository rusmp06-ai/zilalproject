"use client";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { ui } from "@/data/content/platform";
import { money } from "@/lib/platform";
import Image from "next/image";
import { content as t } from "@/data/content";
import { Button, Landscape, SectionHeading } from "@/components/ui/Primitives";

export function Home() {
  const { data } = usePlatform();
  const published = (
    key:
      | "tours"
      | "destinations"
      | "experiences"
      | "journal"
      | "gallery"
      | "reviews",
  ) => data.collections[key].filter((r) => r.status === "Опубликован");
  const tours = published("tours")
    .slice(0, 3)
    .map((r) => ({
      ...r,
      ...r.fields,
      label: r.fields.label,
      duration: r.fields.days + " " + ui.tour.daysShort,
      season: r.fields.season,
      price: money(r.fields.amount, r.fields.currency),
      difficulty: r.fields.difficulty,
      group: r.fields.maxGroup + " " + ui.tour.peopleShort,
    }));
  const destinations = published("destinations")
    .slice(0, 4)
    .map((r) => ({ ...r, label: r.fields.label }));
  const experiences = published("experiences")
    .slice(0, 3)
    .map((r) => ({ ...r, label: r.fields.label }));
  const journal = published("journal")
    .slice(0, 2)
    .map((r) => ({ ...r, label: r.fields.label }));
  const gallery = published("gallery")
    .slice(0, 4)
    .map((r) => ({ ...r, caption: r.title }));
  const reviews = published("reviews")
    .slice(0, 2)
    .map((r) => ({
      ...r,
      quote: r.fields.quote,
      name: r.fields.author,
      trip: r.description,
    }));
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <Image
          src={data.settings.heroImage}
          alt={t.hero.location}
          fill
          priority
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="container hero-content">
          <p className="eyebrow">{t.hero.eyebrow}</p>
          <h1 id="hero-title">{data.settings.heroTitle}</h1>
          <p className="hero-description">{data.settings.heroDescription}</p>
          <div className="hero-actions">
            <Button href="/tours">{t.hero.action}</Button>
            <a className="hero-secondary" href="/destinations">
              {t.hero.secondary} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <div className="container hero-bottom">
          <span>{t.hero.bottom}</span>
          <span>{t.hero.placeholder}</span>
        </div>
      </section>
      <section id="about" className="section container intro" data-reveal>
        <SectionHeading {...t.intro} />
        <div className="intro-copy">
          <p className="large-copy">{t.intro.description}</p>
          <p>{t.intro.detail}</p>
          <span className="signature">{t.brand}</span>
        </div>
      </section>
      <section id="experiences" className="section container" data-reveal>
        <SectionHeading {...t.experiences} />
        <div className="grid-three">
          {experiences.map((item, index) => (
            <a
              className="experience-card"
              key={item.id}
              href={`/experiences/${item.slug}`}
            >
              <Landscape src={item.image} alt={item.title} />
              <div className="experience-overlay">
                <span className="eyebrow">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <span className="card-arrow" aria-hidden="true">
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
              </span>
              <span className="card-number" aria-hidden="true">
                0{index + 1}
              </span>
            </a>
          ))}
        </div>
      </section>
      <section id="tours" className="section tours-section" data-reveal>
        <div className="container">
          <SectionHeading {...t.tours} />
          <div className="grid-three">
            {tours.map((item) => (
              <article key={item.id} className="tour-card">
                <Landscape src={item.image} alt={item.title} />
                <div className="tour-body">
                  <p className="eyebrow">{item.label}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="tour-meta">
                    <span>{item.duration}</span>
                    <span>{item.season}</span>
                  </div>
                  <div className="tour-extra">
                    <span>{item.group}</span>
                    <span>{item.difficulty}</span>
                  </div>
                  <div className="tour-price">
                    <div>
                      <small>{t.tours.priceLabel}</small>
                      <strong>{item.price}</strong>
                      <small>{t.tours.perPerson}</small>
                    </div>
                    <a
                      href={`/tours/${item.slug}`}
                      aria-label={`${t.tours.action}: ${item.title}`}
                      className="round-link"
                    >
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
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="demo-note">{t.tours.note}</p>
        </div>
      </section>
      <section id="destinations" className="section container" data-reveal>
        <div className="heading-split">
          <SectionHeading {...t.destinations} />
          <p>{t.destinations.description}</p>
        </div>
        <div className="grid-four">
          {destinations.map((item) => (
            <a
              href={`/destinations/${item.slug}`}
              key={item.id}
              className="destination-card"
            >
              <Landscape src={item.image} alt={item.title} />
              <p className="eyebrow">{item.label}</p>
              <h3>
                {item.title}
                <span aria-hidden="true">
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
                </span>
              </h3>
              <p>{item.description}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="section why-section" data-reveal>
        <div className="container why-grid">
          <SectionHeading {...t.why} light />
          <div className="why-items">
            {t.why.items.map((item, index) => (
              <div key={item.title}>
                <span className="why-number">0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="kyrgyzstan" className="country-section" data-reveal>
        <div className="country-image">
          <Landscape src="/images/mountains.svg" alt={t.country.caption} />
          <span>{t.country.caption}</span>
        </div>
        <div className="country-copy">
          <SectionHeading {...t.country} />
          <p>{t.country.description}</p>
          <p className="country-detail">{t.country.detail}</p>
          <Button href="/experiences" secondary>
            {t.country.action}
          </Button>
        </div>
      </section>
      <section id="journal" className="section container" data-reveal>
        <SectionHeading {...t.journal} />
        <div className="grid-two">
          {journal.map((item) => (
            <article key={item.id} className="journal-card">
              <Landscape src={item.image} alt={item.title} />
              <p className="eyebrow">{item.label}</p>
              <h3>
                <a href={`/journal/${item.slug}`}>{item.title}</a>
              </h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <p className="demo-note">{t.journal.note}</p>
      </section>
      <section className="section gallery-section" data-reveal>
        <div className="container">
          <SectionHeading {...t.gallery} />
          <div className="gallery-grid">
            {gallery.map((item) => (
              <figure key={item.caption}>
                <Landscape src={item.image} alt={item.caption} />
                <figcaption>{item.caption}</figcaption>
              </figure>
            ))}
          </div>
          <p className="demo-note">{t.gallery.caption}</p>
        </div>
      </section>
      <section className="section container" data-reveal>
        <SectionHeading {...t.reviews} />
        <div className="grid-two reviews-grid">
          {reviews.map((item) => (
            <figure key={item.id}>
              <span className="quote-mark" aria-hidden="true">
                “
              </span>
              <blockquote>{item.quote}</blockquote>
              <figcaption>
                <strong>{item.name}</strong>
                <span>{item.trip}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="demo-note">{t.reviews.note}</p>
      </section>
      <section id="plan" className="section cta-section" data-reveal>
        <div className="container">
          <span className="cta-symbol" aria-hidden="true">
            △
          </span>
          <SectionHeading {...t.cta} />
          <p className="cta-description">{t.cta.description}</p>
          <Button href="/plan">{t.plan}</Button>
          <p className="demo-note">{t.cta.note}</p>
        </div>
      </section>
    </>
  );
}
