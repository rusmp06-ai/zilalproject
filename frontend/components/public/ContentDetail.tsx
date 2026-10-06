"use client";
import Link from "next/link";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { Landscape, Button } from "@/components/ui/Primitives";
import { ContentCard, type PublicEntity } from "./Catalog";
import { configs } from "@/data/admin/config";
import { ui } from "@/data/content/platform";
import { lines, money } from "@/lib/platform";
export function ContentDetail({
  entity,
  slug,
}: {
  entity: PublicEntity;
  slug: string;
}) {
  const { data, ready } = usePlatform();
  const item = data.collections[entity].find(
    (r) => r.slug === slug && r.status === "Опубликован",
  );
  if (!item)
    return (
      <div className="container public-page">
        <h1>{ready ? ui.tour.notFound : ui.loading}</h1>
        <p>{ui.tour.unavailable}</p>
        <Button href={configs[entity].publicPath || "/"}>{ui.back}</Button>
      </div>
    );
  const f = item.fields;
  const tour = entity === "tours";
  const related = data.collections.tours
    .filter(
      (r) =>
        r.status === "Опубликован" &&
        r.id !== item.id &&
        (entity === "destinations"
          ? r.fields.destination === item.id
          : entity === "experiences"
            ? r.fields.experience === item.id
            : true),
    )
    .slice(0, 3);
  const destination = data.collections.destinations.find(
    (d) => d.id === f.destination && d.status === "Опубликован",
  );
  const faq = lines(f.faq);
  return (
    <>
      <div className="container detail-heading">
        <nav className="breadcrumbs">
          <Link href="/">{ui.home}</Link>
          <span>/</span>
          <Link href={configs[entity].publicPath || "/"}>
            {configs[entity].label}
          </Link>
        </nav>
        <p className="eyebrow">{f.label}</p>
        <h1>{item.title}</h1>
        <p className="detail-intro">{item.description}</p>
        {tour && (
          <div className="detail-facts">
            {[
              [ui.tour.duration, `${f.days} ${ui.tour.daysShort}`],
              [ui.tour.group, `${f.maxGroup} ${ui.tour.peopleShort}`],
              [ui.tour.difficulty, f.difficulty],
              [ui.tour.season, f.season],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="detail-cover">
        <Landscape src={item.image} alt={item.title} priority />
        <span>{ui.illustration}</span>
      </div>
      <div
        className={`container detail-grid ${!tour ? "editorial-detail" : ""}`}
      >
        <div className="detail-main">
          <section>
            <h2>
              {tour
                ? ui.tour.overview
                : entity === "journal"
                  ? ui.tour.article
                  : item.title}
            </h2>
            {(f.body || item.description)
              .split("\n\n")
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            {destination && (
              <Link
                className="text-link"
                href={`/destinations/${destination.slug}`}
              >
                {destination.title} →
              </Link>
            )}
          </section>
          {tour && (
            <>
              <section id="program">
                <h2>{ui.tour.program}</h2>
                <div className="itinerary">
                  {lines(f.itinerary).map((day, index) => (
                    <details key={index} open={index === 0}>
                      <summary>
                        {ui.tour.day} {index + 1}
                      </summary>
                      <p>{day}</p>
                    </details>
                  ))}
                </div>
              </section>
              <section className="grid-two conditions">
                <div>
                  <h3>{ui.tour.included}</h3>
                  <ul>
                    {lines(f.included).map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>{ui.tour.excluded}</h3>
                  <ul>
                    {lines(f.excluded).map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>
              </section>
              <section className="grid-two">
                <div>
                  <h3>{ui.tour.stay}</h3>
                  <p>{f.stay}</p>
                </div>
                <div>
                  <h3>{ui.tour.transport}</h3>
                  <p>{f.transport}</p>
                </div>
              </section>
              <section>
                <h2>{ui.tour.gallery}</h2>
                <div className="grid-two">
                  {[item.image, "/images/valley.svg"].map((src, index) => (
                    <Landscape key={index} src={src} alt={item.title} />
                  ))}
                </div>
              </section>
              <section>
                <h2>{ui.tour.faq}</h2>
                {faq.map((line, index) => {
                  const [question, ...answer] = line.split("|");
                  return (
                    <details className="faq-item" key={index}>
                      <summary>{question}</summary>
                      <p>{answer.join("|")}</p>
                    </details>
                  );
                })}
              </section>
            </>
          )}
        </div>
        {tour && (
          <aside className="request-card">
            <p className="eyebrow">{ui.tour.price}</p>
            <strong>{money(f.amount, f.currency)}</strong>
            <span>{ui.tour.perPerson}</span>
            <Button href={`/plan?tour=${encodeURIComponent(item.id)}`}>
              {ui.tour.request}
            </Button>
            <p>{ui.tour.demo}</p>
          </aside>
        )}
      </div>
      {(entity === "tours" ||
        entity === "destinations" ||
        entity === "experiences") && (
        <section className="container section">
          <h2>
            {entity === "destinations"
              ? ui.tour.destinationTours
              : entity === "experiences"
                ? ui.tour.experienceTours
                : ui.tour.related}
          </h2>
          <div className="grid-three detail-related">
            {related.map((r) => (
              <ContentCard key={r.id} item={r} entity="tours" />
            ))}
          </div>
          {!related.length && <p className="empty-state">{ui.empty}</p>}
          <div className="detail-cta">
            <Button
              href={
                tour ? `/plan?tour=${encodeURIComponent(item.id)}` : "/plan"
              }
            >
              {ui.plan}
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
