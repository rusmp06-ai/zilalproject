"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { configs } from "@/data/admin/config";
import { ui } from "@/data/content/platform";
import { imageChoices } from "@/lib/platform";
import { entities, type Entity, type Item } from "@/types/platform";
import { Landscape } from "@/components/ui/Primitives";
export function EntityEditor({ entity, id }: { entity: Entity; id: string }) {
  const { data, ready } = usePlatform();
  if (!ready) return <p>{ui.loading}</p>;
  const existing = data.collections[entity].find((r) => r.id === id);
  if (id !== "new" && !existing)
    return (
      <div className="admin-panel">
        <h1>{ui.tour.notFound}</h1>
        <Link className="button" href={`/admin/${entity}`}>
          {ui.back}
        </Link>
      </div>
    );
  return <Editor key={id} entity={entity} initial={existing} />;
}
function Editor({ entity, initial }: { entity: Entity; initial?: Item }) {
  const { data, save } = usePlatform();
  const config = configs[entity];
  const router = useRouter();
  const [item, setItem] = useState<Item>(
    () =>
      initial || {
        id: "",
        slug: "",
        title: "",
        description: "",
        status: config.statuses[0],
        image: "/images/lake.svg",
        fields: Object.fromEntries(
          config.fields.map((field) => [field.key, field.options?.[0] || ""]),
        ),
      },
  );
  const [error, setError] = useState("");
  const update = (key: keyof Omit<Item, "fields">, value: string) =>
    setItem((previous) => ({ ...previous, [key]: value }));
  const field = (key: string, value: string) =>
    setItem((previous) => ({
      ...previous,
      fields: { ...previous.fields, [key]: value },
    }));
  const related = initial
    ? entities.flatMap((e) =>
        data.collections[e]
          .filter((row) =>
            configs[e].fields.some(
              (f) => f.relation === entity && row.fields[f.key] === initial.id,
            ),
          )
          .map((row) => ({ entity: e, row })),
      )
    : [];
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!item.title.trim()) {
      setError(ui.admin.validation);
      return;
    }
    const id = item.id || `${entity}-${crypto.randomUUID()}`;
    const slug = (item.slug.trim() || id).toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError(ui.admin.invalidSlug);
      return;
    }
    if (
      data.collections[entity].some((row) => row.slug === slug && row.id !== id)
    ) {
      setError(ui.admin.duplicate);
      return;
    }
    const normalized = {
      ...item,
      id,
      slug,
      title: item.title.trim(),
      description: item.description.trim(),
    };
    save(entity, normalized);
    router.push(`/admin/${entity}`);
  };
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <Link href={`/admin/${entity}`} className="text-link">
            ← {config.label}
          </Link>
          <h1>
            {initial ? ui.admin.edit : ui.admin.create} · {config.singular}
          </h1>
          <p>{config.description}</p>
        </div>
        {config.publicPath && initial && entity !== "gallery" && (
          <Link
            className="small-button"
            href={`${config.publicPath}/${initial.slug}`}
          >
            {ui.admin.preview}
          </Link>
        )}
      </div>
      <form className="entity-form" onSubmit={submit}>
        <div className="admin-panel">
          <div className="editor-fields">
            <label className="field-wide">
              {ui.admin.titleField}
              <input
                required
                maxLength={200}
                value={item.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </label>
            {config.publicPath && (
              <label>
                {ui.admin.slug}
                <input
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={100}
                  required
                  readOnly={!!initial}
                  value={item.slug}
                  onChange={(e) => update("slug", e.target.value)}
                />
                {initial && <small>{ui.admin.readonlySlug}</small>}
              </label>
            )}
            <label>
              {ui.admin.status}
              <select
                aria-label={ui.admin.status}
                value={item.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {config.statuses.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="field-wide">
              {ui.admin.descriptionField}
              <textarea
                aria-label={ui.admin.descriptionField}
                rows={3}
                maxLength={3000}
                value={item.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </label>
            {config.fields.map((f) => (
              <label
                className={f.type === "textarea" ? "field-wide" : ""}
                key={f.key}
              >
                {f.label}
                {f.required ? " *" : ""}
                {f.type === "textarea" ? (
                  <textarea
                    aria-label={f.label}
                    rows={f.key === "body" || f.key === "itinerary" ? 7 : 3}
                    maxLength={20000}
                    value={item.fields[f.key] || ""}
                    onChange={(e) => field(f.key, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <select
                    aria-label={f.label}
                    required={f.required}
                    value={item.fields[f.key] || ""}
                    onChange={(e) => field(f.key, e.target.value)}
                  >
                    {f.relation ? (
                      <>
                        <option value="">{ui.admin.none}</option>
                        {data.collections[f.relation].map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.title}
                          </option>
                        ))}
                      </>
                    ) : (
                      f.options?.map((v) => <option key={v}>{v}</option>)
                    )}
                  </select>
                ) : (
                  <input
                    type={f.type || "text"}
                    required={f.required}
                    min={f.min}
                    max={f.max}
                    step={f.type === "number" ? "any" : undefined}
                    maxLength={f.type === "text" || !f.type ? 500 : undefined}
                    value={item.fields[f.key] || ""}
                    onChange={(e) => field(f.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
        {(config.publicPath || entity === "reviews") && (
          <aside className="admin-panel cover-editor">
            <h2>{ui.admin.image}</h2>
            <Landscape src={item.image} alt={item.title} />
            <div className="cover-options">
              {imageChoices.map((image, index) => (
                <button
                  type="button"
                  key={image}
                  aria-pressed={item.image === image}
                  onClick={() => update("image", image)}
                >
                  {ui.admin.placeholderOptions[index]}
                </button>
              ))}
            </div>
            <p className="demo-note">{ui.illustration}</p>
          </aside>
        )}
        <div className="editor-actions">
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button type="submit" className="button">
            {ui.admin.save}
          </button>
          <Link className="small-button" href={`/admin/${entity}`}>
            {ui.admin.cancel}
          </Link>
        </div>
      </form>
      {related.length > 0 && (
        <section className="admin-panel">
          <h2>{ui.admin.related}</h2>
          <div className="related-records">
            {related.map(({ entity: e, row }) => (
              <Link key={e + row.id} href={`/admin/${e}/${row.id}`}>
                <span>{configs[e].label}</span>
                <strong>{row.title}</strong>
                <span>{row.status}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
