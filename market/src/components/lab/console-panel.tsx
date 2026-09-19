"use client";

export function ConsolePanel({
  logs,
  serial,
}: {
  logs: string[];
  serial: string;
}) {
  return (
    <div className="grid h-full grid-cols-1 gap-2 md:grid-cols-2" dir="ltr">
      <div className="flex min-h-0 flex-col overflow-hidden rounded border border-outline bg-surface-container-lowest">
        <div className="border-b border-outline px-2 py-1 text-[11px] font-semibold text-on-surface-variant">
          Logs / Errors
        </div>
        <pre className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[11px] text-on-surface whitespace-pre-wrap">
          {logs.length ? logs.join("\n") : "—"}
        </pre>
      </div>
      <div className="flex min-h-0 flex-col overflow-hidden rounded border border-outline bg-surface-container-lowest">
        <div className="border-b border-outline px-2 py-1 text-[11px] font-semibold text-on-surface-variant">
          Serial Monitor
        </div>
        <pre className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
          {serial || "—"}
        </pre>
      </div>
    </div>
  );
}
