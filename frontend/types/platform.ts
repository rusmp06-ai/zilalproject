export const entities = [
  "tours",
  "destinations",
  "experiences",
  "journal",
  "gallery",
  "reviews",
  "leads",
  "customers",
  "bookings",
  "partners",
  "payments",
  "employees",
] as const;
export type Entity = (typeof entities)[number];
export type Item = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  status: string;
  fields: Record<string, string>;
};
export type Activity = {
  id: string;
  date: string;
  action: string;
  entity: string;
  title: string;
};
export type Settings = {
  company: string;
  email: string;
  phone: string;
  address: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
};
export type PlatformData = {
  version: 1;
  collections: Record<Entity, Item[]>;
  settings: Settings;
  activity: Activity[];
};
export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "email" | "select";
  options?: string[];
  relation?: Entity;
  required?: boolean;
  min?: number;
  max?: number;
};
export type EntityConfig = {
  label: string;
  singular: string;
  description: string;
  fields: Field[];
  statuses: string[];
  publicPath?: string;
};
