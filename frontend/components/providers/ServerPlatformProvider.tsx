"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Context } from "./PlatformProvider";
import { api, APIError } from "@/services/client";
import { ui } from "@/data/content/platform";
import type {
  Entity,
  Item,
  PlatformData,
  Settings,
  MutationResult,
} from "@/types/platform";
type Staff = { id: string; name: string; role: string };
export function ServerPlatformProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial: PlatformData;
}) {
  const path = usePathname();
  const [data, setData] = useState(initial);
  const [loadedScope, setLoadedScope] = useState<string | null>(
    path.startsWith("/admin") ? null : "public",
  );
  const [error, setError] = useState("");
  const [user, setUser] = useState<Staff>();
  const csrf = useRef("");
  const generation = useRef(0);
  const admin = path.startsWith("/admin");
  const load = useCallback(async () => {
    const run = ++generation.current;
    if (admin) {
      const auth = await api<{ user: Staff; csrf: string }>("auth/me");
      if (run !== generation.current) return;
      csrf.current = auth.csrf;
      setUser(auth.user);
    }
    const next = await api<PlatformData>(
      admin ? "admin/platform" : "public/platform",
    );
    if (run !== generation.current) return;
    setData(next);
    setError("");
    setLoadedScope(admin ? "admin" : "public");
  }, [admin, path]);
  useEffect(() => {
    let active = true;
    load().catch((e) => {
      if (active) {
        setError(e.message);
      }
    });
    const focus = () =>
      load().catch((e) => {
        if (active) setError(e.message);
      });
    window.addEventListener("focus", focus);
    const timer = admin
      ? setInterval(() => {
          if (document.visibilityState === "visible") focus();
        }, 60000)
      : undefined;
    return () => {
      active = false;
      generation.current++;
      window.removeEventListener("focus", focus);
      if (timer) clearInterval(timer);
    };
  }, [load, admin]);
  const mutate = async <T,>(
    path: string,
    method: string,
    body: unknown,
    apply: (data: PlatformData, result: T) => PlatformData,
  ): Promise<MutationResult> => {
    try {
      const result = await api<T>(path, {
        method,
        headers: { "X-CSRF-Token": csrf.current },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      setData((previous) => apply(previous, result));
      try {
        await load();
      } catch {
        setError(ui.backend.refreshFailed);
      }
      return { ok: true };
    } catch (e) {
      const status = e instanceof APIError ? e.status : 503;
      const message = e instanceof Error ? e.message : ui.backend.unavailable;
      if (status === 401 || status >= 500) setError(message);
      return {
        ok: false,
        kind:
          status === 409 ? "conflict" : status >= 500 ? "storage" : "invalid",
        error: message,
      };
    }
  };
  const unsupported = async (): Promise<MutationResult> => ({
    ok: false,
    kind: "invalid",
    error: ui.backend.notConnected,
  });
  return (
    <Context.Provider
      value={{
        data,
        ready: loadedScope === (admin ? "admin" : "public"),
        error,
        server: true,
        user,
        save: (entity: Entity, item: Item, expected?: Item) =>
          mutate<Item>(
            `admin/content/${entity}${expected ? "/" + encodeURIComponent(item.id) : ""}`,
            expected ? "PUT" : "POST",
            { ...item, version: expected?.version },
            (previous, row) => ({
              ...previous,
              collections: {
                ...previous.collections,
                [entity]: expected
                  ? previous.collections[entity].map((old) =>
                      old.id === row.id ? row : old,
                    )
                  : [...previous.collections[entity], row],
              },
            }),
          ),
        remove: (entity: Entity, id: string, expected?: Item) =>
          mutate(
            `admin/content/${entity}/${encodeURIComponent(id)}?version=${expected?.version || 0}`,
            "DELETE",
            undefined,
            (previous) => ({
              ...previous,
              collections: {
                ...previous.collections,
                [entity]: previous.collections[entity].filter(
                  (row) => row.id !== id,
                ),
              },
            }),
          ),
        saveSettings: (settings: Settings, expected?: Settings) =>
          mutate<Settings>(
            "admin/settings",
            "PUT",
            { ...settings, version: expected?.version },
            (previous, row) => ({ ...previous, settings: row }),
          ),
        replace: unsupported,
        reset: unsupported,
        logout: async () => {
          await api("auth/logout", {
            method: "POST",
            headers: { "X-CSRF-Token": csrf.current },
          });
          csrf.current = "";
          window.location.assign("/login");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
