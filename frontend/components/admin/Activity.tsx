"use client";
import { usePlatform } from "@/components/providers/PlatformProvider";
import { ui } from "@/data/content/platform";
export function Activity() {
  const { data } = usePlatform();
  return (
    <>
      <div className="admin-page-heading">
        <h1>{ui.admin.audit}</h1>
      </div>
      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{ui.admin.day}</th>
              <th>{ui.admin.activityAction}</th>
              <th>{ui.admin.entity}</th>
              <th>{ui.admin.titleField}</th>
            </tr>
          </thead>
          <tbody>
            {data.activity.map((row) => (
              <tr key={row.id}>
                <td>
                  <time dateTime={row.date}>
                    {new Date(row.date).toLocaleString("ru-RU")}
                  </time>
                </td>
                <td>{row.action}</td>
                <td>{row.entity}</td>
                <td>{row.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.activity.length && (
        <p className="empty-state">{ui.admin.noActivity}</p>
      )}
    </>
  );
}
