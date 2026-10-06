import { entities, type PlatformData, type Item } from "@/types/platform";
import { configs } from "@/data/admin/config";
export const imageChoices = [
  "/images/lake.svg",
  "/images/mountains.svg",
  "/images/steppe.svg",
  "/images/valley.svg",
];
export const lines = (value: string | undefined) =>
  (value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
export const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .trim()
    .replace(/\s+/g, " ");
export const validEmail = (value: string) =>
  !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function money(amount: string, currency = "USD") {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: ["USD", "KGS", "EUR"].includes(currency) ? currency : "USD",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max: number, required = false): value is string =>
  typeof value === "string" &&
  value.length <= max &&
  (!required || !!value.trim());
export function validImport(value: unknown): value is PlatformData {
  if (
    !record(value) ||
    value.version !== 1 ||
    !record(value.collections) ||
    !record(value.settings) ||
    !Array.isArray(value.activity) ||
    value.activity.length > 500
  )
    return false;
  const settings = value.settings;
  if (
    ![
      "company",
      "email",
      "phone",
      "address",
      "heroTitle",
      "heroDescription",
      "heroImage",
    ].every((key) =>
      text(settings[key], key === "heroDescription" ? 3000 : 300),
    ) ||
    !text(settings.company, 300, true) ||
    !text(settings.heroTitle, 300, true) ||
    !text(settings.heroDescription, 3000, true) ||
    !validEmail(settings.email as string) ||
    !imageChoices.includes(settings.heroImage as string)
  )
    return false;
  const validItem = (x: unknown): x is Item =>
    record(x) &&
    text(x.id, 100, true) &&
    /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(x.id) &&
    x.id !== "new" &&
    text(x.slug, 100, true) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug) &&
    text(x.title, 200, true) &&
    text(x.description, 3000) &&
    text(x.image, 200) &&
    imageChoices.includes(x.image) &&
    text(x.status, 100, true) &&
    record(x.fields) &&
    Object.values(x.fields).every((v) => text(v, 20000));
  for (const key of entities) {
    const rows = value.collections[key];
    if (!Array.isArray(rows) || rows.length > 2000 || !rows.every(validItem))
      return false;
    if (
      new Set(rows.map((row) => row.id)).size !== rows.length ||
      new Set(rows.map((row) => row.slug)).size !== rows.length
    )
      return false;
    for (const row of rows) {
      if (!configs[key].statuses.includes(row.status)) return false;
      for (const field of configs[key].fields) {
        const v = row.fields[field.key];
        if (field.required && !v?.trim()) return false;
        if (!v) continue;
        if (v.length > (field.type === "textarea" ? 20000 : 500)) return false;
        if (field.type === "number") {
          const n = Number(v);
          if (
            !v.trim() ||
            !Number.isFinite(n) ||
            n < (field.min ?? 0) ||
            (field.max !== undefined && n > field.max) ||
            (field.step === 1 && !Number.isInteger(n))
          )
            return false;
        }
        if (field.type === "date" && !validDate(v)) return false;
        if (field.type === "email" && !validEmail(v)) return false;
        if (field.options && !field.options.includes(v)) return false;
      }
      if (
        row.fields.start &&
        row.fields.end &&
        row.fields.end < row.fields.start
      )
        return false;
    }
  }
  const d = value as unknown as PlatformData;
  for (const key of entities)
    for (const row of d.collections[key])
      for (const field of configs[key].fields)
        if (
          field.relation &&
          row.fields[field.key] &&
          !d.collections[field.relation].some(
            (target) => target.id === row.fields[field.key],
          )
        )
          return false;
  return d.activity.every(
    (a) =>
      record(a) &&
      (["id", "date", "action", "entity", "title"] as const).every((key) =>
        text(a[key], 500),
      ) &&
      Number.isFinite(Date.parse(a.date as string)),
  );
}

export const emailPattern = "[^\\s@]+@[^\\s@]+\\.[^\\s@]+";
