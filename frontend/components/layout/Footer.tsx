"use client";
import Link from "next/link";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { ui } from "@/data/content/platform";
import { content as t } from "@/data/content";
export function Footer() {
  const { data, server } = usePlatform();
  return (
    <footer id="contact" className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="footer-brand" href="/">
            {t.brand}
          </Link>
          <p>{t.footer.description}</p>
          <span className="eyebrow">
            {data.settings.address || t.footer.place}
          </span>
        </div>
        <div>
          <h3>{t.footer.navigation}</h3>
          <nav>
            {t.nav
              .filter((item) => item.href !== "/contacts")
              .map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>
        <div>
          <h3>{t.footer.contactTitle}</h3>
          <p>{data.settings.email || t.footer.contactDescription}</p>
          <Link href="/gallery">{ui.catalog.gallery.eyebrow}</Link>
          <br />
          <Link className="text-link" href="/plan">
            {t.plan}{" "}
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path d="M5 19 19 5M5 5h14v14" />
            </svg>
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 {t.footer.copyright}</span>
        <span>{server ? ui.backend.publicNote : t.footer.status}</span>
        <a href="#top">{t.footer.top} ↑</a>
      </div>
    </footer>
  );
}
