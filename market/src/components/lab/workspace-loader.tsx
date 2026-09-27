"use client";

import dynamic from "next/dynamic";

const LabWorkspace = dynamic(() => import("./lab-workspace").then((m) => m.LabWorkspace), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-background">
      <span className="cyber-chamfer-sm size-10 animate-pulse border border-primary-container bg-primary-container/10" aria-hidden />
      <p className="font-mono text-xs text-on-surface-variant">&gt; در حال آماده‌سازی میز کار…</p>
    </div>
  ),
});

export function WorkspaceLoader({
  initialPartSlug,
  initialTemplateId,
  initialShareToken,
}: {
  initialPartSlug?: string | null;
  initialTemplateId?: string | null;
  initialShareToken?: string | null;
}) {
  return (
    <LabWorkspace
      initialPartSlug={initialPartSlug}
      initialTemplateId={initialTemplateId}
      initialShareToken={initialShareToken}
    />
  );
}
