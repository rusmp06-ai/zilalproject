"use client";
import { useState } from "react";
import Link from "next/link";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { configs, leadStatuses } from "@/data/admin/config";
import { ui } from "@/data/content/platform";
import type { Entity, Item, Field } from "@/types/platform";
import { money, normalizeSearch } from "@/lib/platform";
export function EntityList({ entity }: { entity: Entity }) {
  const { data, save, remove, ready } = usePlatform();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [board, setBoard] = useState(false);
  const [message, setMessage] = useState("");
  const config = configs[entity];
  const rows = data.collections[entity].filter(
    (row) =>
      normalizeSearch(
        row.title +
          " " +
          row.description +
          " " +
          Object.values(row.fields).join(" "),
      ).includes(normalizeSearch(query)) &&
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
  const deleteItem = async (row: Item) => {
    if (
      !window.confirm(`${ui.admin.confirm}
${row.title}
${ui.admin.confirmText}`)
    )
      return;
    const result = await remove(entity, row.id, row);
    setMessage(result.ok ? ui.admin.deleted : result.error);
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
          <select
            aria-label={ui.admin.status}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
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
        <p
          role="status"
          className={
            message === ui.admin.deleted ? "admin-feedback" : "form-error"
          }
        >
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
                        onChange={async (e) => {
                          const result = await save(
                            entity,
                            { ...row, status: e.target.value },
                            row,
                          );
                          if (!result.ok) setMessage(result.error);
                          else setMessage("");
                        }}
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
                <th scope="col">{ui.admin.titleField}</th>
                {columns.map((field) => (
                  <th key={field.key} scope="col">
                    {field.label}
                  </th>
                ))}
                <th scope="col">{ui.admin.status}</th>
                <th scope="col">{ui.admin.actions}</th>
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
                      <Link
                        href={`/admin/${entity}/${row.id}`}
                        aria-label={`${ui.admin.edit}: ${row.title}`}
                      >
                        {ui.admin.edit}
                      </Link>
                      <button
                        className="delete-link"
                        aria-label={`${ui.admin.remove}: ${row.title}`}
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
