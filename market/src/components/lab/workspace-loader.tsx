"use client";

import dynamic from "next/dynamic";

const LabWorkspace = dynamic(
  () => import("./lab-workspace").then((m) => m.LabWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[70vh] items-center justify-center text-sm text-on-surface-variant">
        در حال بارگذاری میز کار آزمایشگاه…
      </div>
    ),
  },
);

export function WorkspaceLoader({
  initialPartSlug,
  initialTemplateId,
}: {
  initialPartSlug?: string | null;
  initialTemplateId?: string | null;
}) {
  return (
    <LabWorkspace
      initialPartSlug={initialPartSlug}
      initialTemplateId={initialTemplateId}
    />
  );
}
