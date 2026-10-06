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
import { validImport } from "@/lib/platform";
import {
  entities,
  type PlatformData,
  type Entity,
  type Item,
  type Settings,
} from "@/types/platform";
const key = "zilal-platform-v1";
type Store = {
  data: PlatformData;
  ready: boolean;
  error: string;
  save: (entity: Entity, item: Item) => void;
  remove: (entity: Entity, id: string) => boolean;
  saveSettings: (settings: Settings) => void;
  replace: (data: PlatformData) => void;
  reset: () => void;
};
const Context = createContext<Store | null>(null);
export function PlatformProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PlatformData>(seed);
  const [ready, setReady] = useState(false);
  const [canPersist, setCanPersist] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed: unknown = JSON.parse(saved);
          if (validImport(parsed)) {
            setData(parsed);
            setCanPersist(true);
          } else setError(ui.admin.corrupt);
        } catch {
          setError(ui.admin.corrupt);
        }
      } else setCanPersist(true);
    } catch {
      setError(ui.admin.storageError);
    }
    setReady(true);
    const listener = (event: StorageEvent) => {
      if (event.key !== key) return;
      try {
        if (!event.newValue) setData(seed);
        else {
          const parsed: unknown = JSON.parse(event.newValue);
          if (validImport(parsed)) setData(parsed);
        }
      } catch {
        setError(ui.admin.corrupt);
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  useEffect(() => {
    if (!ready || !canPersist) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setError("");
    } catch {
      setError(ui.admin.storageError);
    }
  }, [data, ready, canPersist]);
  const save = useCallback((entity: Entity, item: Item) => {
    setCanPersist(true);
    setData((previous) => {
      const exists = previous.collections[entity].some((r) => r.id === item.id);
      return {
        ...previous,
        collections: {
          ...previous.collections,
          [entity]: exists
            ? previous.collections[entity].map((r) =>
                r.id === item.id ? item : r,
              )
            : [item, ...previous.collections[entity]],
        },
        activity: [
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            entity: configs[entity].label,
            title: item.title,
            action: exists ? ui.admin.editAction : ui.admin.createAction,
          },
          ...previous.activity,
        ].slice(0, 500),
      };
    });
  }, []);
  const remove = (entity: Entity, id: string) => {
    const linked = entities.some((k) =>
      data.collections[k].some((row) =>
        configs[k].fields.some(
          (field) => field.relation === entity && row.fields[field.key] === id,
        ),
      ),
    );
    if (linked) return false;
    setCanPersist(true);
    setData((previous) => ({
      ...previous,
      collections: {
        ...previous.collections,
        [entity]: previous.collections[entity].filter((r) => r.id !== id),
      },
      activity: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          entity: configs[entity].label,
          title:
            previous.collections[entity].find((r) => r.id === id)?.title || id,
          action: ui.admin.deleteAction,
        },
        ...previous.activity,
      ].slice(0, 500),
    }));
    return true;
  };
  const saveSettings = (settings: Settings) => {
    setCanPersist(true);
    setData((previous) => ({
      ...previous,
      settings,
      activity: [
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          entity: ui.admin.settings,
          title: settings.company,
          action: ui.admin.settingsAction,
        },
        ...previous.activity,
      ].slice(0, 500),
    }));
  };
  const replace = (next: PlatformData) => {
    setCanPersist(true);
    setError("");
    setData(next);
  };
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
