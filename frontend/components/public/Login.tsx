"use client";
import { useState, type FormEvent } from "react";
import { api } from "@/services/client";
import { ui } from "@/data/content/platform";
export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setPassword("");
      window.location.assign("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : ui.backend.unavailable);
      setBusy(false);
    }
  }
  return (
    <div className="container public-page login-page">
      <p className="eyebrow">{ui.backend.staff}</p>
      <h1>{ui.backend.login}</h1>
      <p>{ui.backend.loginHint}</p>
      <form onSubmit={submit} className="admin-panel">
        <label>
          {ui.backend.email}
          <input
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          {ui.backend.password}
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={200}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? ui.backend.loggingIn : ui.backend.loginAction}
        </button>
      </form>
    </div>
  );
}
