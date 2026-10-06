"use client";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { ui } from "@/data/content/platform";
import { imageChoices, validImport } from "@/lib/platform";
import type { Settings as SettingsType } from "@/types/platform";
export function Settings() {
  const { ready, data } = usePlatform();
  if (!ready) return <p>{ui.loading}</p>;
  return <SettingsEditor initial={data.settings} />;
}
function SettingsEditor({ initial }: { initial: SettingsType }) {
  const { data, saveSettings, replace, reset } = usePlatform();
  const [settings, setSettings] = useState(initial);
  useEffect(() => setSettings(initial), [initial]);
  const [message, setMessage] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const update = (key: keyof SettingsType, value: string) =>
    setSettings((previous) => ({ ...previous, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveSettings(settings);
    setMessage(ui.admin.saved);
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
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
          <button className="button" type="submit">
            {ui.admin.save}
          </button>
        </form>
        <section className="admin-panel">
          <h2>{ui.admin.dataSettings}</h2>
          <p>{ui.admin.exportNote}</p>
          <div className="data-actions">
            <button className="small-button" onClick={exportData}>
              {ui.admin.export}
            </button>
            <button
              className="small-button"
              onClick={() => upload.current?.click()}
            >
              {ui.admin.import}
            </button>
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
                    replace(parsed);
                    setMessage(ui.admin.imported);
                  }
                } catch {
                  setMessage(ui.admin.invalidImport);
                }
              }}
            />
            <button
              className="delete-link"
              onClick={() => {
                if (window.confirm(ui.admin.resetConfirm)) {
                  reset();
                  setMessage(ui.admin.saved);
                }
              }}
            >
              {ui.admin.reset}
            </button>
          </div>
          <p className="demo-note">{ui.admin.noProduction}</p>
        </section>
      </div>
      {message && (
        <p className="admin-feedback" role="status">
          {message}
        </p>
      )}
    </>
  );
}
