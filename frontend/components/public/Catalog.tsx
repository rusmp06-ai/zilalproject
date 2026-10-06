"use client";
import Link from "next/link";
import { useState } from "react";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { Landscape, SectionHeading } from "@/components/ui/Primitives";
import { ui } from "@/data/content/platform";
import { configs } from "@/data/admin/config";
import { money, normalizeSearch } from "@/lib/platform";
import type { Item } from "@/types/platform";
export type PublicEntity =
  "tours" | "destinations" | "experiences" | "journal" | "gallery";
export function ContentCard({
  item,
  entity,
}: {
  item: Item;
  entity: PublicEntity;
}) {
  return (
    <article className="catalog-card">
      <Link
        href={`${configs[entity].publicPath}/${item.slug}`}
        className="image-link"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Landscape src={item.image} alt="" />
      </Link>
      <div className="catalog-card-body">
        <p className="eyebrow">{item.fields.label || ui.illustration}</p>
        <h3>
          <Link href={`${configs[entity].publicPath}/${item.slug}`}>
            {item.title}
          </Link>
        </h3>
        <p>{item.description}</p>
        {entity === "tours" && (
          <>
            <div className="tour-meta">
              <span>
                {item.fields.days} {ui.tour.daysShort}
              </span>
              <span>{item.fields.season}</span>
            </div>
            <div className="catalog-price">
              <span>{money(item.fields.amount, item.fields.currency)}</span>
              <small>{ui.tour.perPerson}</small>
            </div>
          </>
        )}
        <Link
          href={`${configs[entity].publicPath}/${item.slug}`}
          className="text-link"
          aria-label={`${ui.details}: ${item.title}`}
        >
          {ui.details} →
        </Link>
      </div>
    </article>
  );
}
export function Catalog({ entity }: { entity: PublicEntity }) {
  const { data } = usePlatform();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [destination, setDestination] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("original");
  const [currency, setCurrency] = useState("");
  const rows = data.collections[entity].filter(
    (r) => r.status === "Опубликован",
  );
  const filtered = rows
    .filter(
      (r) =>
        normalizeSearch(
          r.title +
            " " +
            r.description +
            " " +
            (r.fields.label || "") +
            " " +
            (data.collections.destinations.find(
              (d) => d.id === r.fields.destination,
            )?.title || ""),
        ).includes(normalizeSearch(query)) &&
        (!category || r.fields.category === category) &&
        (!destination || r.fields.destination === destination) &&
        (!difficulty || r.fields.difficulty === difficulty) &&
        (!currency || r.fields.currency === currency),
    )
    .sort((a, b) =>
      sort === "priceAsc"
        ? Number(a.fields.amount) - Number(b.fields.amount)
        : sort === "priceDesc"
          ? Number(b.fields.amount) - Number(a.fields.amount)
          : sort === "duration"
            ? Number(a.fields.days) - Number(b.fields.days)
            : 0,
    );
  return (
    <div className="container public-page">
      <SectionHeading as="h1" {...ui.catalog[entity]} />
      <div className="catalog-filters">
        <label>
          {ui.search}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
          />
        </label>
        {entity === "tours" && (
          <>
            <label>
              {ui.filters.category}
              <select
                aria-label={ui.filters.category}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{ui.all}</option>
                {(
                  configs.tours.fields.find((f) => f.key === "category")
                    ?.options || []
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              {ui.filters.destination}
              <select
                aria-label={ui.filters.destination}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                <option value="">{ui.all}</option>
                {data.collections.destinations
                  .filter((d) => d.status === "Опубликован")
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {ui.filters.difficulty}
              <select
                aria-label={ui.filters.difficulty}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">{ui.all}</option>
                {(
                  configs.tours.fields.find((f) => f.key === "difficulty")
                    ?.options || []
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              {ui.admin.currencyFilter}
              <select
                aria-label={ui.admin.currencyFilter}
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option value="" disabled={sort.startsWith("price")}>
                  {ui.all}
                </option>
                {["USD", "KGS", "EUR"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              {ui.filters.sort}
              <select
                aria-label={ui.filters.sort}
                value={sort}
                onChange={(e) => {
                  const next = e.target.value;
                  setSort(next);
                  if (next.startsWith("price") && !currency)
                    setCurrency(
                      rows.find((row) => row.fields.currency === "USD")
                        ? "USD"
                        : rows[0]?.fields.currency || "USD",
                    );
                }}
              >
                <option value="original">{ui.filters.original}</option>
                <option value="priceAsc">{ui.filters.priceAsc}</option>
                <option value="priceDesc">{ui.filters.priceDesc}</option>
                <option value="duration">{ui.filters.duration}</option>
              </select>
            </label>
          </>
        )}
        <button
          className="small-button"
          onClick={() => {
            setQuery("");
            setCategory("");
            setDestination("");
            setDifficulty("");
            setSort("original");
            setCurrency("");
          }}
        >
          {ui.reset}
        </button>
      </div>
      {entity === "tours" && sort.startsWith("price") && (
        <p className="demo-note">{ui.admin.currencySortNote}</p>
      )}
      <p className="result-count" aria-live="polite">
        {ui.filters.found}: {filtered.length}
      </p>
      {entity === "gallery" ? (
        <div className="gallery-grid">
          {filtered.map((item) => (
            <figure key={item.id}>
              <Landscape src={item.image} alt={item.fields.alt || item.title} />
              <figcaption>{item.title}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="grid-three">
          {filtered.map((item) => (
            <ContentCard key={item.id} item={item} entity={entity} />
          ))}
        </div>
      )}
      {!filtered.length && <p className="empty-state">{ui.empty}</p>}
      <p className="demo-note">
        {entity === "tours" ? ui.tour.demo : ui.illustration}
      </p>
    </div>
  );
}
