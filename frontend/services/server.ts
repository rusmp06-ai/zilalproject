import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { cache } from "react";
import { seed } from "@/data/platform";
import type { PlatformData, Item, Entity } from "@/types/platform";
export const serverMode = () => {
  const mode = process.env.PLATFORM_MODE || "demo";
  if (!["demo", "server"].includes(mode))
    throw Error("PLATFORM_MODE must be demo or server");
  return mode === "server";
};
export function backendURL() {
  const base = process.env.BACKEND_URL;
  if (!base) throw Error("BACKEND_URL is required in server mode");
  const url = new URL(base);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw Error("Invalid BACKEND_URL");
  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw Error("Backend requires HTTPS");
  return base.replace(/\/$/, "");
}
export async function backendFetch(path: string, authenticated = false) {
  const headers: Record<string, string> = {};
  if (authenticated) {
    const token = (await cookies()).get("zilal_session")?.value;
    if (token) headers.Cookie = `zilal_session=${token}`;
  }
  return fetch(`${backendURL()}/api/v1/${path}`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(60000),
  });
}
export const publicData = cache(async (): Promise<PlatformData> => {
  if (!serverMode()) return seed;
  const response = await backendFetch("public/platform");
  if (!response.ok)
    throw Error("Не удалось загрузить сайт. Попробуйте ещё раз через минуту.");
  return response.json();
});
export const requireAdmin = cache(async () => {
  if (!serverMode()) return null;
  const response = await backendFetch("auth/me", true);
  if (response.status === 401) redirect("/login");
  if (!response.ok)
    throw Error("Не удалось проверить доступ. Попробуйте ещё раз.");
  const auth = await response.json();
  if (!["super_admin", "admin", "content_manager"].includes(auth.user.role))
    notFound();
  return auth;
});
export async function publicItem(
  entity: Entity,
  slug: string,
): Promise<Item | undefined> {
  const data = await publicData();
  const row = data.collections[entity].find(
    (row) => row.slug === slug && row.status === "Опубликован",
  );
  if (serverMode() && !row) notFound();
  return row;
}
export async function requireContentSection(section: string) {
  if (!serverMode()) return;
  await requireAdmin();
  if (
    ![
      "tours",
      "destinations",
      "experiences",
      "journal",
      "gallery",
      "reviews",
    ].includes(section)
  )
    notFound();
}
