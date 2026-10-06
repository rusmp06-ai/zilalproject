"use client";
import { ui } from "@/data/content/platform";
export default function GlobalError() {
  return (
    <html lang="ru">
      <body
        style={{
          margin: "48px auto",
          padding: 24,
          maxWidth: 640,
          fontFamily: "sans-serif",
          lineHeight: 1.7,
        }}
      >
        <h1>{ui.backend.unavailable}</h1>
        <p>{ui.backend.retryHint}</p>
        <button onClick={() => window.location.reload()}>
          {ui.backend.retry}
        </button>
      </body>
    </html>
  );
}
