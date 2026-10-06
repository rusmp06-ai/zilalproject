"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { content as t } from "@/data/content";
export function Header() {
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (event.key === "Tab") {
        if (
          !panel.current?.contains(document.activeElement) &&
          document.activeElement !== toggle.current
        ) {
          event.preventDefault();
          toggle.current?.focus();
          return;
        }
        const links = panel.current?.querySelectorAll<HTMLElement>("a");
        const last = links?.[links.length - 1];
        if (event.shiftKey && document.activeElement === toggle.current) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          toggle.current?.focus();
        }
      }
    };
    const mq = matchMedia("(min-width: 1100px)");
    const resize = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", resize);
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", handle);
      mq.removeEventListener("change", resize);
    };
  }, [open]);
  return (
    <header className="header">
      <div className="header-inner">
        <Link className="wordmark" href="/" aria-label={t.brand}>
          <span className="brand-mark" aria-hidden="true">
            △
          </span>
          <span>
            {t.brand.split(" ")[0]}
            <span className="brand-small">{t.brand.split(" ")[1]}</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label={t.footer.navigation}>
          {t.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                path === item.href || path.startsWith(item.href + "/")
                  ? "page"
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="header-plan" href="/plan">
          {t.plan}
          <span aria-hidden="true">
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
          </span>
        </Link>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-label={open ? t.menuClose : t.menuOpen}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <span className={open ? "cross" : ""} />
          <span className={open ? "cross" : ""} />
        </button>
      </div>
      <div ref={panel} id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label={t.footer.navigation}>
          {t.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
              <span aria-hidden="true">
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
              </span>
            </Link>
          ))}
          <Link className="button" href="/plan" onClick={() => setOpen(false)}>
            {t.plan}
          </Link>
        </nav>
      </div>
    </header>
  );
}
