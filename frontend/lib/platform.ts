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
export function money(amount: string, currency = "USD") {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: ["USD", "KGS", "EUR"].includes(currency) ? currency : "USD",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}
export function validImport(value: unknown): value is PlatformData {
  if (!value || typeof value !== "object") return false;
  const d = value as PlatformData;
  if (
    d.version !== 1 ||
    !d.collections ||
    !d.settings ||
    !Array.isArray(d.activity)
  )
    return false;
  const settingKeys = [
    "company",
    "email",
    "phone",
    "address",
    "heroTitle",
    "heroDescription",
    "heroImage",
  ];
  if (
    !settingKeys.every(
      (k) =>
        typeof (d.settings as unknown as Record<string, unknown>)[k] ===
        "string",
    ) ||
    !imageChoices.includes(d.settings.heroImage)
  )
    return false;
  const validItem = (x: Item) =>
    x &&
    typeof x === "object" &&
    ["id", "slug", "title", "description", "image", "status"].every(
      (k) => typeof (x as unknown as Record<string, unknown>)[k] === "string",
    ) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug) &&
    imageChoices.includes(x.image) &&
    x.fields &&
    typeof x.fields === "object" &&
    !Array.isArray(x.fields) &&
    Object.values(x.fields).every((v) => typeof v === "string");
  for (const key of entities) {
    const rows = d.collections[key];
    if (!Array.isArray(rows) || rows.length > 2000 || !rows.every(validItem))
      return false;
    if (
      new Set(rows.map((r) => r.id)).size !== rows.length ||
      new Set(rows.map((r) => r.slug)).size !== rows.length
    )
      return false;
    for (const row of rows) {
      if (!configs[key].statuses.includes(row.status)) return false;
      for (const field of configs[key].fields) {
        const v = row.fields[field.key];
        if (field.required && !v?.trim()) return false;
        if (
          v &&
          field.type === "number" &&
          (!Number.isFinite(Number(v)) ||
            Number(v) < (field.min ?? 0) ||
            (field.max !== undefined && Number(v) > field.max))
        )
          return false;
        if (
          v &&
          field.type === "date" &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)))
        )
          return false;
        if (v && field.options && !field.options.includes(v)) return false;
      }
    }
  }
  for (const key of entities)
    for (const row of d.collections[key])
      for (const field of configs[key].fields) {
        if (
          field.relation &&
          row.fields[field.key] &&
          !d.collections[field.relation].some(
            (target) => target.id === row.fields[field.key],
          )
        )
          return false;
      }
  return d.activity.every(
    (a) =>
      a &&
      ["id", "date", "action", "entity", "title"].every(
        (k) => typeof (a as unknown as Record<string, unknown>)[k] === "string",
      ),
  );
}
