"use client";
import { ui } from "@/data/content/platform";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container public-page">
      <h1>{ui.backend.unavailable}</h1>
      <p>{ui.backend.retryHint}</p>
      <button className="button" onClick={reset}>
        {ui.backend.retry}
      </button>
    </main>
  );
}
