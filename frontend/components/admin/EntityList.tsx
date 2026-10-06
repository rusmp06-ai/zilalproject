"use client";
import { useState } from "react";
import Link from "next/link";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { configs, leadStatuses } from "@/data/admin/config";
import { ui } from "@/data/content/platform";
import type { Entity, Item, Field } from "@/types/platform";
import { money } from "@/lib/platform";
export function EntityList({ entity }: { entity: Entity }) {
  const { data, save, remove, ready } = usePlatform();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [board, setBoard] = useState(false);
  const [message, setMessage] = useState("");
  const config = configs[entity];
  const rows = data.collections[entity].filter(
    (row) =>
      (
        row.title +
        " " +
        row.description +
        " " +
        Object.values(row.fields).join(" ")
      )
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (!status || row.status === status),
  );
  const columns = config.fields
    .filter((field) => !["textarea"].includes(field.type || ""))
    .slice(0, 3);
  const fieldValue = (row: Item, field: Field) =>
    field.relation
      ? data.collections[field.relation].find(
          (r) => r.id === row.fields[field.key],
        )?.title || ui.admin.none
      : field.key === "amount"
        ? money(row.fields.amount, row.fields.currency)
        : row.fields[field.key] || "—";
  const deleteItem = (row: Item) => {
    if (
      !window.confirm(`${ui.admin.confirm}
${row.title}
${ui.admin.confirmText}`)
    )
      return;
    if (remove(entity, row.id)) setMessage(ui.admin.deleted);
    else setMessage(ui.admin.linked);
  };
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">{ui.admin.title}</p>
          <h1>{config.label}</h1>
          <p>{config.description}</p>
        </div>
        <Link className="button" href={`/admin/${entity}/new`}>
          {ui.admin.create}
        </Link>
      </div>
      <div className="admin-toolbar">
        <label>
          {ui.search}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui.admin.search}
          />
        </label>
        <label>
          {ui.admin.status}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{ui.all}</option>
            {config.statuses.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        {entity === "leads" && (
          <div className="view-switch">
            <button aria-pressed={!board} onClick={() => setBoard(false)}>
              {ui.admin.list}
            </button>
            <button aria-pressed={board} onClick={() => setBoard(true)}>
              {ui.admin.board}
            </button>
          </div>
        )}
      </div>
      {message && (
        <p role="status" className="admin-feedback">
          {message}
        </p>
      )}
      <p className="result-count" aria-live="polite">
        {ui.filters.found}: {rows.length}
      </p>
      {!ready ? (
        <p>{ui.loading}</p>
      ) : board ? (
        <div className="kanban">
          {leadStatuses.map((stage) => (
            <section key={stage}>
              <h2>
                {stage}
                <span>{rows.filter((r) => r.status === stage).length}</span>
              </h2>
              {rows
                .filter((r) => r.status === stage)
                .map((row) => (
                  <article key={row.id}>
                    <Link href={`/admin/${entity}/${row.id}`}>{row.title}</Link>
                    <p>{row.fields.email}</p>
                    <p>{row.description}</p>
                    <label>
                      {ui.admin.status}
                      <select
                        aria-label={`${ui.admin.status}: ${row.title}`}
                        value={row.status}
                        onChange={(e) =>
                          save(entity, { ...row, status: e.target.value })
                        }
                      >
                        {leadStatuses.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{ui.admin.titleField}</th>
                {columns.map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}
                <th>{ui.admin.status}</th>
                <th>{ui.admin.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      className="table-title"
                      href={`/admin/${entity}/${row.id}`}
                    >
                      {row.title}
                    </Link>
                    <small>{row.description.slice(0, 90)}</small>
                  </td>
                  {columns.map((field) => (
                    <td key={field.key}>{fieldValue(row, field)}</td>
                  ))}
                  <td>
                    <span
                      className={`status-pill ${row.status === "Черновик" ? "muted" : ""}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link href={`/admin/${entity}/${row.id}`}>
                        {ui.admin.edit}
                      </Link>
                      <button
                        className="delete-link"
                        onClick={() => deleteItem(row)}
                      >
                        {ui.admin.remove}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!rows.length && ready && (
        <p className="empty-state">{ui.admin.noRecords}</p>
      )}
      {entity === "employees" && (
        <p className="demo-note">{ui.admin.roleNote}</p>
      )}
    </>
  );
}
