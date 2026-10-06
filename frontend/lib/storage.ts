import { seed } from "@/data/platform";
import { ui } from "@/data/content/platform";
import { validImport } from "@/lib/platform";
import type { PlatformData, MutationResult } from "@/types/platform";
export const storageKey = "zilal-platform-v1";
export class StorageProblem extends Error {
  kind: "corrupt" | "conflict";
  constructor(kind: "corrupt" | "conflict", message: string) {
    super(message);
    this.kind = kind;
  }
}
export function readStored() {
  const raw = localStorage.getItem(storageKey);
  if (raw === null) return { raw, data: seed };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validImport(parsed)) return { raw, data: parsed };
  } catch {}
  throw new StorageProblem("corrupt", ui.admin.corrupt);
}
export const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
// Web Locks serialize cooperating tabs; the raw-value check also protects browsers without locks.
export async function storageLock<T>(operation: () => T): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks)
    return navigator.locks.request(storageKey, operation);
  return operation();
}
export function storageFailure(error: unknown): MutationResult {
  return error instanceof StorageProblem
    ? { ok: false, kind: error.kind, error: error.message }
    : { ok: false, kind: "storage", error: ui.admin.storageError };
}
export function writeStored(
  next: PlatformData,
  expectedRaw: string | null,
): MutationResult {
  if (!validImport(next))
    return { ok: false, kind: "invalid", error: ui.admin.validation };
  if (localStorage.getItem(storageKey) !== expectedRaw)
    return { ok: false, kind: "conflict", error: ui.admin.concurrent };
  localStorage.setItem(storageKey, JSON.stringify(next));
  return { ok: true };
}
