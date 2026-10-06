"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { seed } from "@/data/platform";
import { ui } from "@/data/content/platform";
import { configs } from "@/data/admin/config";
import {
  readStored,
  writeStored,
  storageLock,
  storageFailure,
  storageKey,
  same,
} from "@/lib/storage";
import {
  entities,
  type PlatformData,
  type Entity,
  type Item,
  type Settings,
  type MutationResult,
  type Activity,
} from "@/types/platform";
type Store = {
  data: PlatformData;
  ready: boolean;
  error: string;
  save: (
    entity: Entity,
    item: Item,
    expected?: Item,
  ) => Promise<MutationResult>;
  remove: (
    entity: Entity,
    id: string,
    expected?: Item,
  ) => Promise<MutationResult>;
  saveSettings: (
    settings: Settings,
    expected?: Settings,
  ) => Promise<MutationResult>;
  replace: (data: PlatformData) => Promise<MutationResult>;
  reset: () => Promise<MutationResult>;
};
const Context = createContext<Store | null>(null);
function activity(entity: string, title: string, action: string): Activity {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    entity,
    title,
    action,
  };
}
export function PlatformProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PlatformData>(seed);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const load = () => {
      try {
        setData(readStored().data);
        setError("");
      } catch (e) {
        const result = storageFailure(e);
        if (!result.ok) setError(result.error);
      }
    };
    load();
    setReady(true);
    const listener = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) load();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  const mutate = useCallback(
    async (
      operation: (previous: PlatformData) => PlatformData | MutationResult,
      overwrite = false,
    ): Promise<MutationResult> => {
      try {
        return await storageLock(() => {
          const stored = overwrite
            ? { raw: localStorage.getItem(storageKey), data: seed }
            : readStored();
          const next = operation(stored.data);
          if ("ok" in next) {
            if (!next.ok) setData(stored.data);
            return next;
          }
          const result = writeStored(next, stored.raw);
          if (result.ok) {
            setData(next);
            setError("");
          } else if (result.kind === "storage" || result.kind === "corrupt")
            setError(result.error);
          return result;
        });
      } catch (e) {
        const result = storageFailure(e);
        if (!result.ok) setError(result.error);
        return result;
      }
    },
    [],
  );
  const save = useCallback(
    (entity: Entity, item: Item, expected?: Item) =>
      mutate((previous) => {
        const current = previous.collections[entity].find(
          (row) => row.id === item.id,
        );
        if (expected && !same(current, expected))
          return { ok: false, kind: "conflict", error: ui.admin.conflict };
        if (
          previous.collections[entity].some(
            (row) => row.slug === item.slug && row.id !== item.id,
          )
        )
          return { ok: false, kind: "invalid", error: ui.admin.duplicate };
        return {
          ...previous,
          collections: {
            ...previous.collections,
            [entity]: current
              ? previous.collections[entity].map((row) =>
                  row.id === item.id ? item : row,
                )
              : [item, ...previous.collections[entity]],
          },
          activity: [
            activity(
              configs[entity].label,
              item.title,
              current ? ui.admin.editAction : ui.admin.createAction,
            ),
            ...previous.activity,
          ].slice(0, 500),
        };
      }),
    [mutate],
  );
  const remove = useCallback(
    (entity: Entity, id: string, expected?: Item) =>
      mutate((previous) => {
        const current = previous.collections[entity].find(
          (row) => row.id === id,
        );
        if (expected && !same(current, expected))
          return { ok: false, kind: "conflict", error: ui.admin.conflict };
        if (
          entities.some((key) =>
            previous.collections[key].some((row) =>
              configs[key].fields.some(
                (field) =>
                  field.relation === entity && row.fields[field.key] === id,
              ),
            ),
          )
        )
          return { ok: false, kind: "linked", error: ui.admin.linked };
        return {
          ...previous,
          collections: {
            ...previous.collections,
            [entity]: previous.collections[entity].filter(
              (row) => row.id !== id,
            ),
          },
          activity: [
            activity(
              configs[entity].label,
              current?.title || id,
              ui.admin.deleteAction,
            ),
            ...previous.activity,
          ].slice(0, 500),
        };
      }),
    [mutate],
  );
  const saveSettings = useCallback(
    (settings: Settings, expected?: Settings) =>
      mutate((previous) => {
        if (expected && !same(previous.settings, expected))
          return { ok: false, kind: "conflict", error: ui.admin.conflict };
        return {
          ...previous,
          settings,
          activity: [
            activity(
              ui.admin.settings,
              settings.company,
              ui.admin.settingsAction,
            ),
            ...previous.activity,
          ].slice(0, 500),
        };
      }),
    [mutate],
  );
  const replace = useCallback(
    (next: PlatformData) => mutate(() => next, true),
    [mutate],
  );
  return (
    <Context.Provider
      value={{
        data,
        ready,
        error,
        save,
        remove,
        saveSettings,
        replace,
        reset: () => replace(structuredClone(seed)),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePlatform() {
  const store = useContext(Context);
  if (!store) throw Error("PlatformProvider is missing");
  return store;
}
