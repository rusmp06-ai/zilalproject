import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { seed } from "@/data/platform";
import { validImport, validDate, money, normalizeSearch } from "@/lib/platform";
import {
  readStored,
  writeStored,
  storageFailure,
  storageKey,
  StorageProblem,
} from "@/lib/storage";
const clone = () => structuredClone(seed);
let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
});
test("supplied examples can be round-tripped", () =>
  assert.equal(validImport(JSON.parse(JSON.stringify(seed))), true));
test("calendar validation rejects normalized impossible dates", () => {
  assert.equal(validDate("2027-02-30"), false);
  assert.equal(validDate("2027-02-29"), false);
  assert.equal(validDate("2028-02-29"), true);
});
test("imports reject fractional people, impossible dates and reversed trips", () => {
  let data = clone();
  data.collections.bookings[0].fields.people = "1.5";
  assert.equal(validImport(data), false);
  data = clone();
  data.collections.bookings[0].fields.start = "2027-02-30";
  assert.equal(validImport(data), false);
  data = clone();
  data.collections.leads[0].fields.start = "2027-07-10";
  data.collections.leads[0].fields.end = "2027-07-01";
  assert.equal(validImport(data), false);
});
test("imports reject unsafe IDs, empty titles and invalid email", () => {
  let data = clone();
  data.collections.tours[0].id = "../settings";
  assert.equal(validImport(data), false);
  data = clone();
  data.collections.tours[0].id = "new";
  assert.equal(validImport(data), false);
  data = clone();
  data.collections.tours[0].title = " ";
  assert.equal(validImport(data), false);
  data = clone();
  data.settings.email = "not-an-email";
  assert.equal(validImport(data), false);
});
test("imports cannot create dangling relationships or duplicate routes", () => {
  let data = clone();
  data.collections.tours[0].fields.destination = "missing";
  assert.equal(validImport(data), false);
  data = clone();
  data.collections.tours[1].slug = data.collections.tours[0].slug;
  assert.equal(validImport(data), false);
});
test("money keeps cents and search treats е and ё alike", () => {
  assert.match(money("650.25", "USD"), /650,25/);
  assert.equal(normalizeSearch("  ОЗЁРА  "), "озера");
});
test("a corrupt local copy is never silently overwritten", () => {
  values.set(storageKey, "BROKEN");
  assert.throws(() => readStored(), StorageProblem);
  assert.equal(values.get(storageKey), "BROKEN");
});
test("writes require the same original snapshot", () => {
  const original = JSON.stringify(seed);
  values.set(storageKey, original);
  const changed = clone();
  changed.settings.company = "Another tab";
  values.set(storageKey, JSON.stringify(changed));
  const result = writeStored(clone(), original);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.kind, "conflict");
  assert.equal(readStored().data.settings.company, "Another tab");
});
test("successful writes are immediately readable", () => {
  const data = clone();
  data.settings.company = "Updated";
  assert.equal(writeStored(data, null).ok, true);
  assert.equal(readStored().data.settings.company, "Updated");
});
test("quota errors cannot be turned into success", () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("Full", "QuotaExceededError");
      },
    },
  });
  let failure: unknown;
  try {
    writeStored(clone(), null);
  } catch (error) {
    failure = error;
  }
  const result = storageFailure(failure);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.kind, "storage");
});
