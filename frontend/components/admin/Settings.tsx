"use client";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { ui } from "@/data/content/platform";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { same, storageKey } from "@/lib/storage";
import { imageChoices, validImport } from "@/lib/platform";
import type { Settings as SettingsType } from "@/types/platform";
export function Settings() {
  const { ready, data } = usePlatform();
  if (!ready) return <p>{ui.loading}</p>;
  return <SettingsEditor initial={data.settings} />;
}
function SettingsEditor({ initial }: { initial: SettingsType }) {
  const { data, server, saveSettings, replace, reset } = usePlatform();
  const [settings, setSettings] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const dirty = !same(settings, baseline);
  useUnsavedChanges(dirty);
  const conflict = !same(initial, baseline);
  useEffect(() => {
    if (!dirty && !same(initial, baseline)) {
      setSettings(initial);
      setBaseline(initial);
    }
  }, [initial, baseline, dirty]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const update = (key: keyof SettingsType, value: string) =>
    setSettings((previous) => ({ ...previous, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await saveSettings(settings, baseline);
    setBusy(false);
    if (result.ok) {
      setBaseline(settings);
      setMessage(server ? ui.backend.saveConfirmed : ui.admin.saved);
    } else
      setMessage(
        result.kind === "storage" || result.kind === "corrupt"
          ? ui.admin.saveFailed
          : result.error,
      );
  };
  const exportData = () => {
    let payload: string;
    try {
      payload = server
        ? JSON.stringify(data, null, 2)
        : (localStorage.getItem(storageKey) ?? JSON.stringify(data, null, 2));
    } catch {
      setMessage(ui.admin.storageError);
      return;
    }
    const blob = new Blob([payload], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zilal-local-data.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">{ui.admin.title}</p>
          <h1>{ui.admin.settings}</h1>
        </div>
      </div>
      {dirty && (
        <p className="draft-notice" role="status">
          {ui.admin.dirty}
        </p>
      )}
      {conflict && dirty && (
        <p className="form-error" role="alert">
          {ui.admin.conflict}
        </p>
      )}
      <div className="admin-grid-two">
        <form onSubmit={submit} className="admin-panel settings-form">
          <h2>{ui.admin.contentSettings}</h2>
          {(
            [
              "company",
              "email",
              "phone",
              "address",
              "heroTitle",
              "heroDescription",
            ] as const
          ).map((key) => (
            <label key={key}>
              {ui.admin[key]}
              {key === "heroTitle" || key === "heroDescription" ? (
                <textarea
                  aria-label={ui.admin[key]}
                  rows={3}
                  maxLength={key === "heroDescription" ? 3000 : 300}
                  required
                  value={settings[key]}
                  onChange={(e) => update(key, e.target.value)}
                />
              ) : (
                <input
                  aria-label={ui.admin[key]}
                  type={key === "email" ? "email" : "text"}
                  maxLength={300}
                  required={key === "company"}
                  value={settings[key]}
                  onChange={(e) => update(key, e.target.value)}
                />
              )}
            </label>
          ))}
          <label>
            {ui.admin.heroImage}
            <select
              aria-label={ui.admin.heroImage}
              value={settings.heroImage}
              onChange={(e) => update("heroImage", e.target.value)}
            >
              {imageChoices.map((src, index) => (
                <option key={src} value={src}>
                  {ui.admin.placeholderOptions[index]}
                </option>
              ))}
            </select>
          </label>
          <button className="button" type="submit" disabled={busy || conflict}>
            {busy ? ui.admin.saving : ui.admin.save}
          </button>
        </form>
        <section className="admin-panel">
          <h2>{ui.admin.dataSettings}</h2>
          <p>{server ? ui.backend.settingsNote : ui.admin.exportNote}</p>
          <div className="data-actions">
            <button className="small-button" onClick={exportData}>
              {server ? ui.backend.export : ui.admin.export}
            </button>
            {!server && (
              <button
                className="small-button"
                disabled={busy || dirty}
                onClick={() => upload.current?.click()}
              >
                {ui.admin.import}
              </button>
            )}
            {!server && (
              <>
                <input
                  ref={upload}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    try {
                      if (file.size > 5_000_000) throw Error();
                      const parsed: unknown = JSON.parse(await file.text());
                      if (!validImport(parsed)) throw Error();
                      if (window.confirm(ui.admin.importConfirm)) {
                        setBusy(true);
                        const result = await replace(parsed);
                        setBusy(false);
                        if (result.ok) {
                          setMessage(ui.admin.imported);
                        } else
                          setMessage(
                            result.kind === "storage" ||
                              result.kind === "corrupt"
                              ? ui.admin.saveFailed
                              : result.error,
                          );
                      }
                    } catch {
                      setMessage(ui.admin.invalidImport);
                    }
                  }}
                />
                <button
                  className="delete-link"
                  disabled={busy || dirty}
                  onClick={async () => {
                    if (window.confirm(ui.admin.resetConfirm)) {
                      setBusy(true);
                      const result = await reset();
                      setBusy(false);
                      if (result.ok) {
                        setMessage(
                          server ? ui.backend.saveConfirmed : ui.admin.saved,
                        );
                      } else
                        setMessage(
                          result.kind === "storage" || result.kind === "corrupt"
                            ? ui.admin.saveFailed
                            : result.error,
                        );
                    }
                  }}
                >
                  {ui.admin.reset}
                </button>
              </>
            )}
          </div>
          <p className="demo-note">
            {server
              ? ui.backend.settingsNote
              : dirty
                ? ui.admin.importPending
                : ui.admin.noProduction}
          </p>
        </section>
      </div>
      {message && !(conflict && dirty && message === ui.admin.conflict) && (
        <p
          className={
            message === ui.admin.saved ||
            message === ui.backend.saveConfirmed ||
            message === ui.admin.imported
              ? "admin-feedback"
              : "form-error"
          }
          role="status"
        >
          {message}
        </p>
      )}
    </>
  );
}
