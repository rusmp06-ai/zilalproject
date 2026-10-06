"use client";
import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { ui } from "@/data/content/platform";
import { SectionHeading } from "@/components/ui/Primitives";
export function PlanForm() {
  const { data, save, ready, error: storageError } = usePlatform();
  const [tour, setTour] = useState("");
  useEffect(
    () =>
      setTour(new URLSearchParams(window.location.search).get("tour") || ""),
    [],
  );
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    country: "",
    start: "",
    end: "",
    people: "2",
    stay: "Без предпочтений",
    budget: "",
    notes: "",
    name: "",
    email: "",
    phone: "",
  });
  const [flexible, setFlexible] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const update = (key: keyof typeof values, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  const [dateMin, setDateMin] = useState("");
  useEffect(() => {
    const today = new Date();
    setDateMin(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
    );
  }, []);
  const selectedTour = data.collections.tours.find(
    (r) => r.id === tour && r.status === "Опубликован",
  );
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (step === 0) {
      if (!values.country.trim()) {
        setError(ui.form.error);
        return;
      }
      if (!flexible && (!values.start || !values.end)) {
        setError(ui.form.dateRequired);
        return;
      }
      if (!flexible && values.start < dateMin) {
        setError(ui.form.pastError);
        return;
      }
      if (!flexible && values.end < values.start) {
        setError(ui.form.datesError);
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    if (!consent || !values.name.trim() || !values.email.trim()) {
      setError(ui.form.error);
      return;
    }
    const id = "lead-" + crypto.randomUUID();
    save("leads", {
      id,
      slug: id,
      title: values.name.trim(),
      description: values.notes.trim(),
      image: "/images/lake.svg",
      status: "Новый",
      fields: {
        country: values.country.trim(),
        start: flexible ? "" : values.start,
        end: flexible ? "" : values.end,
        people: values.people,
        stay: values.stay,
        budget: values.budget,
        email: values.email.trim(),
        phone: values.phone.trim(),
        interests: interests.join(", "),
        tour: selectedTour?.id || "",
        manager:
          data.collections.employees.find(
            (employee) =>
              employee.status === "Активный" &&
              employee.fields.role === "Менеджер",
          )?.id || "",
        customer: "",
        communication: "",
      },
    });
    setReference(id);
  };
  if (reference)
    return (
      <div className="container public-page">
        <div className="form-success" role="status">
          <p className="eyebrow">{ui.demoShort}</p>
          <h1>{ui.form.success}</h1>
          <p>{ui.form.successText}</p>
          <small>
            {ui.form.reference}: {reference.slice(0, 13).toUpperCase()}
          </small>
          {storageError && <p className="form-error">{storageError}</p>}
          <div className="form-success-actions">
            <Link className="button" href="/admin/leads">
              {ui.form.admin}
            </Link>
            <button
              className="small-button"
              onClick={() => {
                setReference("");
                setStep(0);
                setValues({
                  ...values,
                  name: "",
                  email: "",
                  phone: "",
                  notes: "",
                });
                setConsent(false);
              }}
            >
              {ui.form.new}
            </button>
          </div>
        </div>
      </div>
    );
  return (
    <div className="container public-page">
      <SectionHeading as="h1" {...ui.form} />
      <div className="planning-grid">
        <div>
          <ol className="form-steps">
            {ui.form.steps.map((label, index) => (
              <li
                key={label}
                aria-current={step === index ? "step" : undefined}
                className={step >= index ? "active" : ""}
              >
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <form key={step} onSubmit={submit} className="planning-form">
            {step === 0 && (
              <>
                <label>
                  {ui.form.tour}
                  <select
                    aria-label={ui.form.tour}
                    value={selectedTour?.id || ""}
                    onChange={(e) => setTour(e.target.value)}
                  >
                    <option value="">{ui.form.custom}</option>
                    {data.collections.tours
                      .filter((r) => r.status === "Опубликован")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  {ui.form.country}
                  <input
                    required
                    maxLength={100}
                    value={values.country}
                    onChange={(e) => update("country", e.target.value)}
                  />
                </label>
                <div className="form-two">
                  <label>
                    {ui.form.date}
                    <input
                      type="date"
                      min={dateMin}
                      disabled={flexible}
                      required={!flexible}
                      value={values.start}
                      onChange={(e) => update("start", e.target.value)}
                    />
                  </label>
                  <label>
                    {ui.form.end}
                    <input
                      type="date"
                      min={values.start || dateMin}
                      disabled={flexible}
                      required={!flexible}
                      value={values.end}
                      onChange={(e) => update("end", e.target.value)}
                    />
                  </label>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={flexible}
                    onChange={(e) => setFlexible(e.target.checked)}
                  />
                  {ui.form.flexible}
                </label>
                <label>
                  {ui.form.people}
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={values.people}
                    onChange={(e) => update("people", e.target.value)}
                  />
                </label>
              </>
            )}
            {step === 1 && (
              <>
                <fieldset className="interest-options">
                  <legend>{ui.form.interests}</legend>
                  {ui.form.interestOptions.map((v) => (
                    <label key={v}>
                      <input
                        type="checkbox"
                        checked={interests.includes(v)}
                        onChange={() =>
                          setInterests((previous) =>
                            previous.includes(v)
                              ? previous.filter((x) => x !== v)
                              : [...previous, v],
                          )
                        }
                      />
                      {v}
                    </label>
                  ))}
                </fieldset>
                <div className="form-two">
                  <label>
                    {ui.form.stay}
                    <select
                      aria-label={ui.form.stay}
                      value={values.stay}
                      onChange={(e) => update("stay", e.target.value)}
                    >
                      {ui.form.stayOptions.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {ui.form.budget}
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      value={values.budget}
                      onChange={(e) => update("budget", e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  {ui.form.notes}
                  <textarea
                    aria-label={ui.form.notes}
                    rows={4}
                    maxLength={3000}
                    value={values.notes}
                    onChange={(e) => update("notes", e.target.value)}
                  />
                </label>
              </>
            )}
            {step === 2 && (
              <>
                <label>
                  {ui.form.name}
                  <input
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={values.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </label>
                <label>
                  {ui.form.email}
                  <input
                    autoComplete="email"
                    type="email"
                    required
                    maxLength={200}
                    value={values.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </label>
                <label>
                  {ui.form.phone}
                  <input
                    autoComplete="tel"
                    type="tel"
                    maxLength={40}
                    value={values.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    required
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  {ui.form.consent}
                </label>
              </>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            {storageError && <p className="form-error">{storageError}</p>}
            <div className="form-navigation">
              {step > 0 && (
                <button
                  type="button"
                  className="small-button"
                  onClick={() => {
                    setStep(step - 1);
                    setError("");
                  }}
                >
                  {ui.form.previous}
                </button>
              )}
              <button className="button" type="submit" disabled={!ready}>
                {step === 2 ? ui.form.submit : ui.form.next}
              </button>
            </div>
            <p className="demo-note">{ui.demo}</p>
          </form>
        </div>
        <aside className="plan-summary">
          <p className="eyebrow">{ui.form.summary}</p>
          <h3>{selectedTour?.title || ui.form.custom}</h3>
          <p>{values.country || ui.form.country}</p>
          <p>
            {flexible
              ? ui.form.flexible
              : [values.start, values.end].filter(Boolean).join(" — ")}
          </p>
          <p>
            {ui.form.people}: {values.people}
          </p>
          <p>{interests.join(" · ")}</p>
        </aside>
      </div>
    </div>
  );
}
