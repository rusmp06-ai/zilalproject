"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation } from "@/data/admin/config";
import { ui } from "@/data/content/platform";
import { usePlatform } from "@/components/providers/PlatformProvider";
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { error, server, user, logout } = usePlatform();
  useEffect(() => setOpen(false), [path]);
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">
        {ui.admin.title}
      </a>
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          {ui.admin.brand}
        </Link>
        <button
          className="admin-menu-button"
          aria-expanded={open}
          aria-controls="admin-nav"
          onClick={() => setOpen(!open)}
        >
          {ui.admin.menu} {open ? "−" : "+"}
        </button>
        <nav
          id="admin-nav"
          className={open ? "is-open" : ""}
          aria-label={ui.admin.navigation}
        >
          {adminNavigation
            .filter(
              (item) =>
                !server ||
                item.href === "/admin" ||
                [
                  "tours",
                  "destinations",
                  "experiences",
                  "journal",
                  "gallery",
                  "reviews",
                  "activity",
                  ...(user?.role !== "content_manager" ? ["settings"] : []),
                ].some((section) => item.href === `/admin/${section}`),
            )
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  (
                    item.href === "/admin"
                      ? path === item.href
                      : path.startsWith(item.href)
                  )
                    ? "active"
                    : ""
                }
                aria-current={
                  (
                    item.href === "/admin"
                      ? path === item.href
                      : path.startsWith(item.href)
                  )
                    ? "page"
                    : undefined
                }
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <Link className="admin-site-link" href="/">
          ← {ui.admin.site}
        </Link>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>{ui.admin.title}</span>
          <span className="status-pill">
            {server ? user?.name || ui.backend.server : ui.demoShort}
          </span>
          {server && (
            <button
              className="small-button"
              onClick={() =>
                logout?.().catch(() => window.location.assign("/login"))
              }
            >
              {ui.backend.logout}
            </button>
          )}
        </header>
        <div className="admin-banner">
          {server ? ui.backend.adminNote : ui.admin.noProduction}
        </div>
        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}
        <main id="admin-main" className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
