import { Alert, EmptyState, PageHeader } from "../components/ui";
import { leadsApi } from "../lib/api";
import { useAsync } from "../lib/useAsync";

export function LeadsPage() {
  const { data, loading, error } = useAsync(leadsApi.list);
  const items = data ?? [];

  return (
    <div>
      <PageHeader title="Leads" titleFa="سرنخ‌ها" />
      <p className="mb-4 text-sm text-on-surface-variant">Read-only inbox from the public site contact form.</p>
      {loading ? <p className="font-mono text-sm text-on-surface-variant">loading…</p> : null}
      {error ? <Alert>{error}</Alert> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="No leads" body="New messages will appear here when portfolio-web records them." />
      ) : null}
      {items.length > 0 ? (
        <div className="overflow-x-auto panel-card">
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead className="border-b border-outline font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-outline/70 last:border-0">
                  <td className="px-4 py-3 align-top">
                    <div>{item.name ?? "—"}</div>
                    <div className="font-mono text-xs text-on-surface-variant">{item.email}</div>
                    {item.phone ? <div className="font-mono text-xs text-on-surface-variant">{item.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3 align-top whitespace-pre-wrap">{item.message ?? "—"}</td>
                  <td className="px-4 py-3 align-top font-mono text-xs text-on-surface-variant">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
