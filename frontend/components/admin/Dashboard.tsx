"use client";
import Link from "next/link";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { ui } from "@/data/content/platform";
import { leadStatuses, configs } from "@/data/admin/config";
import { money } from "@/lib/platform";
export function Dashboard({ reports = false }: { reports?: boolean }) {
  const { data, server } = usePlatform();
  const c = data.collections;
  const active = c.leads.filter(
    (r) => !["Потерян", "Отменён", "Путешествие завершено"].includes(r.status),
  ).length;
  const published = c.tours.filter((r) => r.status === "Опубликован").length;
  const confirmed = c.leads.filter((r) =>
    ["Подтверждён", "Оплачен", "Путешествие завершено"].includes(r.status),
  ).length;
  const currencies = ["USD", "KGS", "EUR"];
  const totals = currencies.map((currency) => ({
    currency,
    total: c.payments
      .filter(
        (r) =>
          r.fields.currency === currency &&
          (r.status === "Оплачен" || r.status === "Возврат"),
      )
      .reduce(
        (sum, r) =>
          sum +
          (r.status === "Возврат" ? -1 : 1) * (Number(r.fields.amount) || 0),
        0,
      ),
  }));
  if (server)
    return (
      <>
        <div className="admin-page-heading">
          <div>
            <p className="eyebrow">{ui.backend.server}</p>
            <h1>{ui.backend.contentOverview}</h1>
            <p>{ui.backend.contentOverviewText}</p>
          </div>
          <Link className="button" href="/admin/tours/new">
            {ui.admin.create} · {configs.tours.singular}
          </Link>
        </div>
        <div className="metric-grid">
          {(["tours", "destinations", "experiences", "journal"] as const).map(
            (entity) => (
              <Link
                className="admin-panel"
                href={`/admin/${entity}`}
                key={entity}
              >
                <p>{configs[entity].label}</p>
                <h2>
                  {
                    c[entity].filter((row) => row.status === "Опубликован")
                      .length
                  }
                </h2>
              </Link>
            ),
          )}
        </div>
        <p className="demo-note">{ui.backend.adminNote}</p>
      </>
    );
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">{ui.demoShort}</p>
          <h1>{reports ? ui.admin.reports : ui.admin.overview}</h1>
          <p>{reports ? ui.admin.totals : ui.admin.overviewText}</p>
        </div>
        <Link className="button" href="/admin/tours/new">
          {ui.admin.create} · {configs.tours.singular}
        </Link>
      </div>
      <div className="metric-grid">
        {[
          [ui.admin.leads, active, "/admin/leads"],
          [ui.admin.bookings, c.bookings.length, "/admin/bookings"],
          [ui.admin.tours, published, "/admin/tours"],
          [
            ui.admin.conversion,
            `${c.leads.length ? Math.round((confirmed / c.leads.length) * 100) : 0}%`,
            "/admin/leads",
          ],
        ].map(([label, value, href]) => (
          <Link className="metric-card" href={String(href)} key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>→</small>
          </Link>
        ))}
      </div>
      <div className="admin-grid-two">
        <section className="admin-panel">
          <h2>{ui.admin.pipeline}</h2>
          <div className="pipeline-chart">
            {leadStatuses.map((status) => {
              const count = c.leads.filter((r) => r.status === status).length;
              return (
                <div key={status}>
                  <span>{status}</span>
                  <div className="chart-track">
                    <div
                      style={{
                        width: `${c.leads.length ? (count / c.leads.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </section>
        <section className="admin-panel">
          <h2>{ui.admin.revenue}</h2>
          <div className="currency-totals">
            {totals.map((row) => (
              <div key={row.currency}>
                <span>{row.currency}</span>
                <strong>{money(String(row.total), row.currency)}</strong>
              </div>
            ))}
          </div>
          <h3>{ui.admin.payments}</h3>
          {configs.payments.statuses.map((status) => (
            <div className="report-row" key={status}>
              <span>{status}</span>
              <strong>
                {c.payments.filter((r) => r.status === status).length}
              </strong>
            </div>
          ))}
          <p className="demo-note">{configs.payments.description}</p>
        </section>
      </div>
      {reports ? (
        <section className="admin-panel">
          <h2>{ui.admin.totals}</h2>
          {Object.entries(configs).map(([key, value]) => (
            <div className="report-row" key={key}>
              <Link href={`/admin/${key}`}>{value.label}</Link>
              <strong>{c[key as keyof typeof c].length}</strong>
            </div>
          ))}
        </section>
      ) : (
        <section className="admin-panel">
          <h2>{ui.admin.recent}</h2>
          {data.activity.length ? (
            <div className="activity-list">
              {data.activity.slice(0, 6).map((row) => (
                <div key={row.id}>
                  <span>
                    {row.action}
                    <strong>{row.title}</strong>
                  </span>
                  <time dateTime={row.date}>
                    {new Date(row.date).toLocaleString("ru-RU")}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">{ui.admin.noActivity}</p>
          )}
        </section>
      )}
    </>
  );
}
