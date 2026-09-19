import type { Metadata } from "next";
import { WorkspaceLoader } from "@/components/lab/workspace-loader";

export const metadata: Metadata = {
  title: "میز کار آزمایشگاه",
  description: "ویرایشگر مدار و شبیه‌ساز Arduino فکستن",
};

type Props = { searchParams: Promise<{ part?: string; template?: string; share?: string }> };

export default async function LabWorkspacePage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <WorkspaceLoader
      initialPartSlug={sp.part ?? null}
      initialTemplateId={sp.template ?? null}
    />
  );
}
