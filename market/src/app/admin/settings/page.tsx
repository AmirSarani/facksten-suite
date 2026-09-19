import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { SiteSettingsForm } from "@/components/site-settings-form";
import { requireUser } from "@/lib/auth";
import { getCategoryTree, getSiteSettings, parseHomeConfig } from "@/lib/catalog";

export const metadata = { title: "تنظیمات سایت" };

export default async function AdminSettingsPage() {
  await requireUser(["ADMIN"]);
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategoryTree()]);
  const faq = JSON.parse(settings.faqJson || "[]") as { q: string; a: string }[];
  const home = parseHomeConfig("homeJson" in settings ? settings.homeJson : "{}");

  return (
    <AdminShell
      title="تنظیمات سایت"
      subtitle="تماس فروشگاه، FAQ سفارشی و چینش صفحه اصلی"
      active="/admin/settings"
      actions={
        <>
          <Link
            href="/"
            target="_blank"
            className="cyber-chamfer-sm border border-outline bg-surface-container-low px-3 py-2 text-sm font-semibold text-on-surface hover:border-primary-container hover:text-primary-container"
          >
            مشاهده فروشگاه
          </Link>
        </>
      }
    >
      <SiteSettingsForm
        initial={{
          phone: settings.phone,
          email: settings.email,
          address: settings.address,
          faq,
          home,
        }}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </AdminShell>
  );
}
